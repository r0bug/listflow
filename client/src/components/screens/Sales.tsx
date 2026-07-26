import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  RefreshCw,
  Loader2,
  X,
  Upload,
  UserPlus,
  Home,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

type SalesTab = 'all' | 'pending';
type RateType = 'PERCENT' | 'FLAT';

interface Agent {
  id: string;
  name: string;
  active: boolean;
  rateType: RateType;
  rateValue: number;
}

interface Sale {
  id: string;
  ebayOrderId: string;
  title: string;
  quantity: number;
  itemPrice: number | string;
  shippingPrice: number | string;
  totalPrice: number | string;
  buyerUsername?: string | null;
  buyerName?: string | null;
  soldAt: string;
  imageUrl?: string | null;
  thumbnailPath?: string | null;
  source?: string;
  attributionStatus: 'PENDING' | 'ATTRIBUTED' | 'HOUSE';
  ebayAccount?: { id: string; accountName: string } | null;
  listing?: { id: string; listingAgentId?: string | null; imageUrls?: string[] } | null;
  commission?: {
    id: string;
    amount: number | string;
    status: string;
    agent: { id: string; name: string };
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ImportResult {
  created: number;
  skipped: number;
  duplicates: number;
  errors: { row: number; reason: string }[];
  dryRun: boolean;
}

const money = (v: number | string | null | undefined): string => {
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '$0.00';
};

const PAGE_LIMIT = 25;

export const Sales: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SalesTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [accountId, setAccountId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: PAGE_LIMIT, total: 0, pages: 1 });
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Account options derived from sale rows (accounts endpoint may not exist)
  const [accountOptions, setAccountOptions] = useState<{ id: string; accountName: string }[]>([]);

  // Agents (for assign modal)
  const [agents, setAgents] = useState<Agent[]>([]);

  // Assign modal state
  const [assignSale, setAssignSale] = useState<Sale | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [overrideRate, setOverrideRate] = useState(false);
  const [overrideType, setOverrideType] = useState<RateType>('PERCENT');
  const [overrideValue, setOverrideValue] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importAccountId, setImportAccountId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('attribution', activeTab === 'pending' ? 'pending' : 'all');
      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));
      if (searchQuery) params.set('search', searchQuery);
      if (accountId) params.set('ebayAccountId', accountId);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const response = await fetch(`/api/v1/sales?${params.toString()}`);
      const data = await response.json();
      if (Array.isArray(data.sales)) {
        setSales(data.sales);
        if (data.pagination) setPagination(data.pagination);
        if (typeof data.pendingCount === 'number') setPendingCount(data.pendingCount);

        // Accumulate account options from rows (defensive: no accounts endpoint)
        setAccountOptions(prev => {
          const map = new Map(prev.map(a => [a.id, a]));
          for (const sale of data.sales as Sale[]) {
            if (sale.ebayAccount?.id && !map.has(sale.ebayAccount.id)) {
              map.set(sale.ebayAccount.id, sale.ebayAccount);
            }
          }
          return Array.from(map.values());
        });
      }
    } catch (error) {
      console.error('Failed to load sales:', error);
    }
    setIsLoading(false);
  }, [activeTab, page, searchQuery, accountId, fromDate, toDate]);

  // Debounced reload on filter changes
  useEffect(() => {
    const timer = setTimeout(loadSales, 250);
    return () => clearTimeout(timer);
  }, [loadSales]);

  const loadAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/agents');
      const data = await response.json();
      if (Array.isArray(data.agents)) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSales();
    setIsRefreshing(false);
  };

  const handleTabChange = (tab: SalesTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const openAssignModal = (sale: Sale) => {
    setAssignSale(sale);
    setSelectedAgentId(sale.listing?.listingAgentId || '');
    setOverrideRate(false);
    setOverrideType('PERCENT');
    setOverrideValue('');
    setAssignError('');
  };

  const handleAssign = async () => {
    if (!assignSale || !selectedAgentId) return;
    setIsAssigning(true);
    setAssignError('');
    try {
      const body: Record<string, unknown> = { agentId: selectedAgentId };
      if (overrideRate && overrideValue !== '') {
        body.rateType = overrideType;
        body.rateValue = parseFloat(overrideValue);
      }
      const response = await fetch(`/api/v1/sales/${assignSale.id}/assign-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        setAssignSale(null);
        await loadSales();
      } else {
        setAssignError(data.error || data.message || 'Failed to assign agent');
      }
    } catch (error) {
      console.error('Failed to assign agent:', error);
      setAssignError('Failed to assign agent');
    }
    setIsAssigning(false);
  };

  const handleMarkHouse = async () => {
    if (!assignSale) return;
    setIsAssigning(true);
    setAssignError('');
    try {
      const response = await fetch(`/api/v1/sales/${assignSale.id}/mark-house`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setAssignSale(null);
        await loadSales();
      } else {
        setAssignError(data.error || data.message || 'Failed to mark as house sale');
      }
    } catch (error) {
      console.error('Failed to mark house sale:', error);
      setAssignError('Failed to mark as house sale');
    }
    setIsAssigning(false);
  };

  const openImportModal = () => {
    setShowImport(true);
    setImportFile(null);
    setImportResult(null);
    setImportError('');
    setImportAccountId(accountOptions[0]?.id || '');
  };

  const handleImport = async (dryRun: boolean) => {
    if (!importFile || !importAccountId) {
      setImportError('Select an account and a CSV file first');
      return;
    }
    setIsImporting(true);
    setImportError('');
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('ebayAccountId', importAccountId);
      const response = await fetch(`/api/v1/sales/import-csv${dryRun ? '?dryRun=true' : ''}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setImportResult(data);
        if (!dryRun) {
          await loadSales();
        }
      } else {
        setImportError(data.error || data.message || 'Import failed');
      }
    } catch (error) {
      console.error('Failed to import CSV:', error);
      setImportError('Import failed');
    }
    setIsImporting(false);
  };

  const activeAgents = agents.filter(a => a.active);

  const renderAttributionBadge = (sale: Sale) => {
    switch (sale.attributionStatus) {
      case 'ATTRIBUTED':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="badge-sage">
              {sale.commission?.agent?.name || 'Attributed'}
            </span>
            {sale.commission && (
              <span className="text-xs text-slate-500">{money(sale.commission.amount)} commission</span>
            )}
          </div>
        );
      case 'HOUSE':
        return <span className="badge">House</span>;
      case 'PENDING':
      default:
        return <span className="badge-amber">Pending</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
          <p className="text-slate-500">Track sales and attribute them to listing agents</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openImportModal}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload size={20} />
            Import CSV
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Package size={16} />
            <span className="stat-label">Total Sales</span>
          </div>
          <p className="stat-value">{pagination.total}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <AlertCircle size={16} />
            <span className="stat-label">Needs Attribution</span>
          </div>
          <p className="stat-value">{pendingCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => handleTabChange('all')}
          className={cn(
            'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'all'
              ? 'border-ink-600 text-ink-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          All Sales
        </button>
        <button
          onClick={() => handleTabChange('pending')}
          className={cn(
            'pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'pending'
              ? 'border-ink-600 text-ink-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          Needs Attribution
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sales..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="input w-full pl-10"
          />
        </div>
        <select
          value={accountId}
          onChange={(e) => { setAccountId(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">All accounts</option>
          {accountOptions.map((account) => (
            <option key={account.id} value={account.id}>{account.accountName}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="input w-auto text-sm"
            aria-label="From date"
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="input w-auto text-sm"
            aria-label="To date"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 table-header">Item</th>
                <th className="text-left py-3 px-4 table-header">Account</th>
                <th className="text-left py-3 px-4 table-header">Buyer</th>
                <th className="text-left py-3 px-4 table-header">Sold</th>
                <th className="text-right py-3 px-4 table-header">Qty</th>
                <th className="text-right py-3 px-4 table-header">Item Price</th>
                <th className="text-right py-3 px-4 table-header">Total</th>
                <th className="text-left py-3 px-4 table-header">Attribution</th>
                <th className="text-right py-3 px-4 table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-ink-600 mx-auto" />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No sales found</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const thumb = sale.thumbnailPath || sale.imageUrl;
                  return (
                    <tr key={sale.id} className="table-row">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package size={18} className="text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 line-clamp-1 max-w-xs" title={sale.title}>
                              {sale.title}
                            </p>
                            <p className="text-xs text-slate-500">{sale.ebayOrderId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        {sale.ebayAccount?.accountName || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        {sale.buyerName || sale.buyerUsername || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm whitespace-nowrap">
                        {sale.soldAt ? new Date(sale.soldAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="text-right py-3 px-4 text-slate-900">{sale.quantity}</td>
                      <td className="text-right py-3 px-4 text-slate-900">{money(sale.itemPrice)}</td>
                      <td className="text-right py-3 px-4 font-medium text-slate-900">{money(sale.totalPrice)}</td>
                      <td className="py-3 px-4">{renderAttributionBadge(sale)}</td>
                      <td className="py-3 px-4 text-right">
                        {sale.attributionStatus === 'PENDING' && (
                          <button
                            onClick={() => openAssignModal(sale)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50 rounded-lg"
                          >
                            <UserPlus size={14} />
                            Assign agent
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} sales)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Agent Modal */}
      {assignSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md p-6 shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Assign Agent</h2>
              <button
                onClick={() => setAssignSale(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-slate-900 line-clamp-2">{assignSale.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                {money(assignSale.totalPrice)} · {new Date(assignSale.soldAt).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select an agent...</option>
                  {activeAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.rateType === 'PERCENT' ? `${agent.rateValue}%` : `$${agent.rateValue} flat`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  onClick={() => setOverrideRate(!overrideRate)}
                  className="text-sm text-ink-600 hover:text-ink-800 font-medium"
                >
                  {overrideRate ? 'Use agent default rate' : 'Override rate'}
                </button>
                {overrideRate && (
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={overrideType}
                      onChange={(e) => setOverrideType(e.target.value as RateType)}
                      className="input w-auto text-sm"
                    >
                      <option value="PERCENT">Percent</option>
                      <option value="FLAT">Flat ($)</option>
                    </select>
                    <input
                      type="number"
                      value={overrideValue}
                      onChange={(e) => setOverrideValue(e.target.value)}
                      placeholder={overrideType === 'PERCENT' ? 'e.g. 10' : 'e.g. 5.00'}
                      className="input flex-1 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              {assignError && (
                <div className="flex items-center gap-2 text-coral-600 text-sm">
                  <AlertCircle size={16} />
                  {assignError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 mt-6">
              <button
                onClick={handleMarkHouse}
                disabled={isAssigning}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50"
              >
                <Home size={16} />
                House sale (no commission)
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAssignSale(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={isAssigning || !selectedAgentId}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {isAssigning && <Loader2 size={16} className="animate-spin" />}
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-lg p-6 shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Import Sales CSV</h2>
              <button
                onClick={() => setShowImport(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">eBay Account</label>
                {accountOptions.length > 0 ? (
                  <select
                    value={importAccountId}
                    onChange={(e) => setImportAccountId(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Select an account...</option>
                    {accountOptions.map((account) => (
                      <option key={account.id} value={account.id}>{account.accountName}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={importAccountId}
                    onChange={(e) => setImportAccountId(e.target.value)}
                    placeholder="eBay account ID"
                    className="input w-full"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CSV File</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] || null);
                    setImportResult(null);
                  }}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-ink-50 file:text-ink-600 file:text-sm file:font-medium hover:file:bg-ink-100"
                />
              </div>

              {importError && (
                <div className="flex items-center gap-2 text-coral-600 text-sm">
                  <AlertCircle size={16} />
                  {importError}
                </div>
              )}

              {importResult && (
                <div className={cn(
                  'rounded-lg p-4 border',
                  importResult.dryRun ? 'bg-amber-50 border-amber-200' : 'bg-sage-50 border-sage-200'
                )}>
                  <p className="font-medium text-slate-900 mb-2">
                    {importResult.dryRun ? 'Preview (no changes made)' : 'Import complete'}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm text-slate-700">
                    <div>
                      <span className="font-semibold">{importResult.created}</span> {importResult.dryRun ? 'to create' : 'created'}
                    </div>
                    <div>
                      <span className="font-semibold">{importResult.skipped}</span> skipped
                    </div>
                    <div>
                      <span className="font-semibold">{importResult.duplicates}</span> duplicates
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <p className="text-sm font-medium text-coral-600 mb-1">
                        {importResult.errors.length} error{importResult.errors.length === 1 ? '' : 's'}
                      </p>
                      <ul className="text-xs text-slate-600 space-y-0.5 max-h-32 overflow-y-auto">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>Row {err.row}: {err.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowImport(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => handleImport(true)}
                disabled={isImporting || !importFile || !importAccountId}
                className="btn-secondary disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting && <Loader2 size={16} className="animate-spin" />}
                Preview (dry run)
              </button>
              <button
                onClick={() => handleImport(false)}
                disabled={isImporting || !importFile || !importAccountId}
                className="btn-primary disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting && <Loader2 size={16} className="animate-spin" />}
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
