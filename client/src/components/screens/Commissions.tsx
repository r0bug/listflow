import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Package,
  Users,
  Award,
  Download,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../utils/cn';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';
type RateType = 'PERCENT' | 'FLAT';

interface AgentTotal {
  agent: { id: string; name: string; rateType: RateType; rateValue: number };
  salesCount: number;
  totalBasis: number | string;
  totalCommission: number | string;
  paidAmount: number | string;
  unpaidAmount: number | string;
}

interface CommissionRow {
  id: string;
  rateType: RateType;
  rateValue: number;
  basis: number | string;
  amount: number | string;
  status: 'PENDING' | 'PAID';
  paidAt?: string | null;
  agent: { id: string; name: string };
  sale: {
    id: string;
    title: string;
    soldAt: string;
    itemPrice: number | string;
    quantity: number;
    ebayOrderId: string;
    imageUrl?: string | null;
    thumbnailPath?: string | null;
    ebayAccount?: { accountName: string } | null;
  };
}

interface ReportData {
  agentTotals: AgentTotal[];
  commissions: CommissionRow[];
}

const money = (v: number | string | null | undefined): string => {
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '$0.00';
};

const formatRate = (rateType: RateType, rateValue: number): string =>
  rateType === 'PERCENT' ? `${rateValue}%` : `$${Number(rateValue).toFixed(2)} flat`;

const RANGE_DAYS: Record<Exclude<TimeRange, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

export const Commissions: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [confirmPaidAgentId, setConfirmPaidAgentId] = useState<string | null>(null);
  const [markingPaidAgentId, setMarkingPaidAgentId] = useState<string | null>(null);

  const getRange = useCallback((): { from?: string; to?: string } => {
    if (timeRange === 'custom') {
      return {
        from: customFrom || undefined,
        to: customTo || undefined,
      };
    }
    const from = new Date(Date.now() - RANGE_DAYS[timeRange] * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return { from };
  }, [timeRange, customFrom, customTo]);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const { from, to } = getRange();
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const response = await fetch(`/api/v1/commissions/report?${params.toString()}`);
      const result = await response.json();
      if (Array.isArray(result.agentTotals)) {
        setData({
          agentTotals: result.agentTotals,
          commissions: Array.isArray(result.commissions) ? result.commissions : [],
        });
      }
    } catch (error) {
      console.error('Failed to load commissions report:', error);
    }
    setIsLoading(false);
  }, [getRange]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Reset inline confirm after a moment
  useEffect(() => {
    if (!confirmPaidAgentId) return;
    const timer = setTimeout(() => setConfirmPaidAgentId(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmPaidAgentId]);

  const handleMarkPaid = async (agentId: string) => {
    if (confirmPaidAgentId !== agentId) {
      setConfirmPaidAgentId(agentId);
      return;
    }
    setConfirmPaidAgentId(null);
    setMarkingPaidAgentId(agentId);
    try {
      const { to } = getRange();
      const body: Record<string, unknown> = { agentId };
      if (to) body.through = to;
      const response = await fetch('/api/v1/commissions/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        await loadReport();
      } else {
        console.error('Failed to mark paid:', await response.text());
      }
    } catch (error) {
      console.error('Failed to mark paid:', error);
    }
    setMarkingPaidAgentId(null);
  };

  const handleExportCsv = () => {
    const commissions = data?.commissions || [];
    const header = ['Agent', 'Sale Title', 'Sold Date', 'Order #', 'Account', 'Qty', 'Basis', 'Rate', 'Amount', 'Status', 'Paid At'];
    const escape = (v: string | number) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = commissions.map((c) => [
      c.agent.name,
      c.sale.title,
      c.sale.soldAt ? new Date(c.sale.soldAt).toLocaleDateString() : '',
      c.sale.ebayOrderId,
      c.sale.ebayAccount?.accountName || '',
      c.sale.quantity,
      Number(c.basis).toFixed(2),
      formatRate(c.rateType, c.rateValue),
      Number(c.amount).toFixed(2),
      c.status,
      c.paidAt ? new Date(c.paidAt).toLocaleDateString() : '',
    ]);
    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${timeRange}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const agentTotals = data?.agentTotals || [];
  const commissions = data?.commissions || [];

  const totalCommissions = agentTotals.reduce((sum, t) => sum + Number(t.totalCommission), 0);
  const totalUnpaid = agentTotals.reduce((sum, t) => sum + Number(t.unpaidAmount), 0);
  const totalSalesCount = agentTotals.reduce((sum, t) => sum + t.salesCount, 0);
  const topAgent = agentTotals.reduce<AgentTotal | null>(
    (top, t) => (!top || Number(t.totalCommission) > Number(top.totalCommission) ? t : top),
    null
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commissions</h1>
          <p className="text-slate-500 mt-1">Agent commission totals and payouts</p>
        </div>
        <div className="flex items-center gap-3">
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input w-auto text-sm"
                aria-label="From date"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input w-auto text-sm"
                aria-label="To date"
              />
            </div>
          )}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="input w-auto pr-10"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={commissions.length === 0}
            className="btn-secondary disabled:opacity-50 flex items-center gap-2"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-ink-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign size={20} className="text-amber-600" />
              </div>
            </div>
            <p className="stat-value">{money(totalCommissions)}</p>
            <p className="stat-label">Total Commissions</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-coral-100 rounded-lg">
                <DollarSign size={20} className="text-coral-600" />
              </div>
            </div>
            <p className="stat-value">{money(totalUnpaid)}</p>
            <p className="stat-label">Unpaid</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-ink-100 rounded-lg">
                <Package size={20} className="text-ink-600" />
              </div>
            </div>
            <p className="stat-value">{totalSalesCount}</p>
            <p className="stat-label">Sales Count</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-sage-100 rounded-lg">
                <Award size={20} className="text-sage-600" />
              </div>
            </div>
            <p className="stat-value">{topAgent?.agent.name || '-'}</p>
            <p className="stat-label">Top Agent</p>
          </div>
        </div>
      )}

      {/* Per-Agent Table */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-slate-400" />
          <h3 className="font-medium text-slate-900">Agent Totals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 table-header">Agent</th>
                <th className="text-left py-3 px-4 table-header">Rate</th>
                <th className="text-right py-3 px-4 table-header">Sales</th>
                <th className="text-right py-3 px-4 table-header">Basis</th>
                <th className="text-right py-3 px-4 table-header">Commission</th>
                <th className="text-right py-3 px-4 table-header">Paid</th>
                <th className="text-right py-3 px-4 table-header">Unpaid</th>
                <th className="text-right py-3 px-4 table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-ink-600 mx-auto" />
                  </td>
                </tr>
              ) : agentTotals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-slate-500">
                    No commissions in this period
                  </td>
                </tr>
              ) : (
                agentTotals.map((total) => {
                  const agentId = total.agent.id;
                  const isExpanded = expandedAgentId === agentId;
                  const agentCommissions = commissions.filter((c) => c.agent.id === agentId);
                  return (
                    <React.Fragment key={agentId}>
                      <tr className="table-row">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setExpandedAgentId(isExpanded ? null : agentId)}
                            className="flex items-center gap-2 text-left"
                          >
                            {isExpanded ? (
                              <ChevronDown size={16} className="text-slate-400" />
                            ) : (
                              <ChevronRight size={16} className="text-slate-400" />
                            )}
                            <div className="w-8 h-8 bg-ink-100 rounded-full flex items-center justify-center">
                              <span className="text-ink-600 font-medium text-sm">
                                {total.agent.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-slate-900">{total.agent.name}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          {formatRate(total.agent.rateType, total.agent.rateValue)}
                        </td>
                        <td className="text-right py-3 px-4 text-slate-900">{total.salesCount}</td>
                        <td className="text-right py-3 px-4 text-slate-900">{money(total.totalBasis)}</td>
                        <td className="text-right py-3 px-4 font-medium text-slate-900">
                          {money(total.totalCommission)}
                        </td>
                        <td className="text-right py-3 px-4 text-sage-600">{money(total.paidAmount)}</td>
                        <td className="text-right py-3 px-4 text-coral-600">{money(total.unpaidAmount)}</td>
                        <td className="text-right py-3 px-4">
                          {Number(total.unpaidAmount) > 0 && (
                            <button
                              onClick={() => handleMarkPaid(agentId)}
                              disabled={markingPaidAgentId === agentId}
                              className={cn(
                                'inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg disabled:opacity-50',
                                confirmPaidAgentId === agentId
                                  ? 'bg-coral-50 text-coral-600 hover:bg-coral-100 font-medium'
                                  : 'text-ink-600 hover:bg-ink-50'
                              )}
                            >
                              {markingPaidAgentId === agentId && (
                                <Loader2 size={14} className="animate-spin" />
                              )}
                              {confirmPaidAgentId === agentId ? 'Confirm?' : 'Mark paid'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-slate-50 px-4 py-3">
                            {agentCommissions.length === 0 ? (
                              <p className="text-sm text-slate-500 py-2">No commission details</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-slate-200">
                                      <th className="text-left py-2 px-3 table-header">Sale</th>
                                      <th className="text-left py-2 px-3 table-header">Date</th>
                                      <th className="text-left py-2 px-3 table-header">Order #</th>
                                      <th className="text-right py-2 px-3 table-header">Basis</th>
                                      <th className="text-left py-2 px-3 table-header">Rate</th>
                                      <th className="text-right py-2 px-3 table-header">Amount</th>
                                      <th className="text-left py-2 px-3 table-header">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {agentCommissions.map((c) => (
                                      <tr key={c.id} className="border-b border-slate-100 last:border-0">
                                        <td className="py-2 px-3">
                                          <p className="text-sm text-slate-900 line-clamp-1 max-w-xs" title={c.sale.title}>
                                            {c.sale.title}
                                          </p>
                                        </td>
                                        <td className="py-2 px-3 text-sm text-slate-600 whitespace-nowrap">
                                          {c.sale.soldAt ? new Date(c.sale.soldAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="py-2 px-3 text-sm text-slate-600">{c.sale.ebayOrderId}</td>
                                        <td className="text-right py-2 px-3 text-sm text-slate-900">{money(c.basis)}</td>
                                        <td className="py-2 px-3 text-sm text-slate-600">
                                          {formatRate(c.rateType, c.rateValue)}
                                        </td>
                                        <td className="text-right py-2 px-3 text-sm font-medium text-slate-900">
                                          {money(c.amount)}
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className={c.status === 'PAID' ? 'badge-sage' : 'badge-amber'}>
                                            {c.status === 'PAID' ? 'Paid' : 'Pending'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
