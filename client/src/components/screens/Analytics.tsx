import React, { useState, useEffect } from 'react';
import { BarChart2, DollarSign, Package, Users, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StageFunnelEntry {
  stage: string;
  count: number;
}

interface DailyEntry {
  date: string;
  count: number;
}

interface AiCostEntry {
  date: string;
  cost: number;
}

interface PlatformBreakdown {
  pushedToEbay: number;
  notPushed: number;
}

interface ListerEntry {
  name: string;
  count: number;
}

interface AnalyticsData {
  stageFunnel: StageFunnelEntry[];
  dailyPublished: DailyEntry[];
  aiCosts: {
    byDay: AiCostEntry[];
    total: number;
  };
  platformBreakdown: PlatformBreakdown;
  perListerThroughput: ListerEntry[];
}

const STAGE_LABELS: Record<string, string> = {
  PHOTO_UPLOAD: 'Photo Upload',
  AI_PROCESSING: 'AI Processing',
  REVIEW_EDIT: 'Review / Edit',
  PRICING: 'Pricing',
  FINAL_REVIEW: 'Final Review',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
};

const STAGE_COLORS: Record<string, string> = {
  PHOTO_UPLOAD: 'bg-slate-400',
  AI_PROCESSING: 'bg-blue-400',
  REVIEW_EDIT: 'bg-amber-400',
  PRICING: 'bg-orange-400',
  FINAL_REVIEW: 'bg-purple-400',
  PUBLISHED: 'bg-green-500',
  REJECTED: 'bg-red-400',
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, color = 'text-ink-600' }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
    <div className={cn('mt-0.5', color)}>{icon}</div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export const Analytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/analytics');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">{error || 'No data available'}</p>
      </div>
    );
  }

  const totalItems = data.stageFunnel.reduce((s, e) => s + e.count, 0);
  const publishedCount = data.stageFunnel.find(e => e.stage === 'PUBLISHED')?.count ?? 0;
  const last7Days = data.dailyPublished.slice(-7);
  const last7Total = last7Days.reduce((s, d) => s + d.count, 0);
  const maxBarCount = Math.max(...data.stageFunnel.map(e => e.count), 1);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Last 30 days · workflow overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Package size={20} />}
          label="Total Active"
          value={totalItems}
          color="text-slate-500"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Published (30d)"
          value={data.dailyPublished.reduce((s, d) => s + d.count, 0)}
          sub={`${last7Total} in last 7 days`}
          color="text-green-600"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="AI Cost (30d)"
          value={`$${data.aiCosts.total.toFixed(4)}`}
          color="text-amber-600"
        />
        <StatCard
          icon={<BarChart2 size={20} />}
          label="On eBay"
          value={data.platformBreakdown.pushedToEbay}
          sub={`${data.platformBreakdown.notPushed} not yet pushed`}
          color="text-blue-600"
        />
      </div>

      {/* Stage Funnel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Stage Funnel</h2>
        <div className="space-y-2">
          {data.stageFunnel.map(entry => (
            <div key={entry.stage} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-28 shrink-0">
                {STAGE_LABELS[entry.stage] ?? entry.stage}
              </span>
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                <div
                  className={cn('h-4 rounded-full transition-all', STAGE_COLORS[entry.stage] ?? 'bg-slate-400')}
                  style={{ width: `${Math.round((entry.count / maxBarCount) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-700 w-8 text-right">{entry.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Published + Platform Breakdown side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Items published per day — last 7 days */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Published per Day (last 7 days)</h2>
          {last7Days.length === 0 ? (
            <p className="text-sm text-slate-400">No published items in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {last7Days.map(d => (
                  <tr key={d.date} className="border-b border-slate-50 last:border-0">
                    <td className="py-1.5 text-slate-500">{d.date}</td>
                    <td className="py-1.5 text-right font-medium text-slate-700">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Platform breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Platform Breakdown</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Pushed to eBay</span>
              <span className="text-sm font-semibold text-green-700">{data.platformBreakdown.pushedToEbay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Not yet pushed</span>
              <span className="text-sm font-semibold text-slate-600">{data.platformBreakdown.notPushed}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-sm text-slate-500">Published on eBay</span>
              <span className="text-sm font-semibold text-slate-700">{publishedCount}</span>
            </div>
          </div>
          {/* Simple bar */}
          {(data.platformBreakdown.pushedToEbay + data.platformBreakdown.notPushed) > 0 && (
            <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 h-3"
                style={{
                  width: `${Math.round(
                    (data.platformBreakdown.pushedToEbay /
                      (data.platformBreakdown.pushedToEbay + data.platformBreakdown.notPushed)) * 100
                  )}%`
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Costs by day */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">AI Costs by Day (last 30 days)</h2>
        <p className="text-xs text-slate-400 mb-4">Cumulative total: ${data.aiCosts.total.toFixed(4)}</p>
        {data.aiCosts.byDay.length === 0 ? (
          <p className="text-sm text-slate-400">No AI costs recorded in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-2 font-medium">Date</th>
                  <th className="text-right pb-2 font-medium">Cost (USD)</th>
                </tr>
              </thead>
              <tbody>
                {data.aiCosts.byDay.slice(-14).map(d => (
                  <tr key={d.date} className="border-b border-slate-50 last:border-0">
                    <td className="py-1.5 text-slate-500">{d.date}</td>
                    <td className="py-1.5 text-right font-medium text-amber-700">${d.cost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-lister throughput */}
      {data.perListerThroughput.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            <span className="flex items-center gap-2">
              <Users size={15} className="text-slate-400" />
              Per-Lister Throughput (30d)
            </span>
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="text-left pb-2 font-medium">Name</th>
                <th className="text-right pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.perListerThroughput.map(lister => (
                <tr key={lister.name} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 text-slate-600">{lister.name}</td>
                  <td className="py-1.5 text-right font-semibold text-slate-700">{lister.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
