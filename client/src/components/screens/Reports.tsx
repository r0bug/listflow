import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';

type TimeRange = '7d' | '30d' | '90d' | '1y';

interface ReportsData {
  metrics: {
    totalRevenue: number;
    itemsSold: number;
    avgSalePrice: number;
    activeListings: number;
    revenueChange: number;
    itemsChange: number;
    avgPriceChange: number;
  };
  salesByDay: { date: string; sales: number; revenue: number }[];
  topCategories: { name: string; sales: number; revenue: number }[];
  topSellers: { name: string; itemsSold: number; revenue: number }[];
  summary: {
    totalRevenue: number;
    itemsSold: number;
    sellThroughRate: number;
  };
}

export const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ReportsData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard/reports?range=${timeRange}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [timeRange]);

  const handleExport = async (format: 'json' | 'csv' = 'csv') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/dashboard/reports/export?range=${timeRange}&format=${format}`);

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${timeRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        const result = await response.json();
        if (result.success) {
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sales-report-${timeRange}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        }
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
    setIsExporting(false);
  };

  const salesByDay = data?.salesByDay || [];
  const topCategories = data?.topCategories || [];
  const topSellers = data?.topSellers || [];

  const maxSales = Math.max(...salesByDay.map(d => d.sales), 1);
  const maxCategoryRevenue = Math.max(...topCategories.map(c => c.revenue), 1);

  const metrics = data?.metrics || {
    totalRevenue: 0,
    itemsSold: 0,
    avgSalePrice: 0,
    activeListings: 0,
    revenueChange: 0,
    itemsChange: 0,
    avgPriceChange: 0
  };

  const summary = data?.summary || { totalRevenue: 0, itemsSold: 0, sellThroughRate: 0 };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">Sales analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
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
            </select>
          </div>
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="btn-secondary disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Download size={20} />
            )}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
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
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                metrics.revenueChange >= 0 ? 'text-sage-600' : 'text-coral-600'
              )}>
                {metrics.revenueChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(metrics.revenueChange)}%
              </div>
            </div>
            <p className="stat-value">${metrics.totalRevenue.toFixed(2)}</p>
            <p className="stat-label">Total Revenue</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-ink-100 rounded-lg">
                <Package size={20} className="text-ink-600" />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                metrics.itemsChange >= 0 ? 'text-sage-600' : 'text-coral-600'
              )}>
                {metrics.itemsChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(metrics.itemsChange)}%
              </div>
            </div>
            <p className="stat-value">{metrics.itemsSold}</p>
            <p className="stat-label">Items Sold</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-sage-100 rounded-lg">
                <TrendingUp size={20} className="text-sage-600" />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                metrics.avgPriceChange >= 0 ? 'text-sage-600' : 'text-coral-600'
              )}>
                {metrics.avgPriceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(metrics.avgPriceChange)}%
              </div>
            </div>
            <p className="stat-value">${metrics.avgSalePrice.toFixed(2)}</p>
            <p className="stat-label">Avg Sale Price</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-plum-100 rounded-lg">
                <BarChart2 size={20} className="text-plum-600" />
              </div>
            </div>
            <p className="stat-value">{metrics.activeListings}</p>
            <p className="stat-label">Active Listings</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card p-6">
          <h3 className="font-medium text-slate-900 mb-4">Daily Sales</h3>
          <div className="h-48 flex items-end gap-2">
            {salesByDay.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                No sales data available
              </div>
            ) : (
              salesByDay.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-ink-500 rounded-t transition-all hover:bg-ink-600"
                    style={{ height: `${(day.sales / maxSales) * 100}%`, minHeight: day.sales > 0 ? '4px' : '0' }}
                    title={`${day.sales} sales - $${day.revenue.toFixed(2)}`}
                  />
                  <span className="text-xs text-slate-500">{day.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="card p-6">
          <h3 className="font-medium text-slate-900 mb-4">Top Categories</h3>
          <div className="space-y-3">
            {topCategories.length === 0 ? (
              <div className="text-center text-slate-500 py-4">No category data available</div>
            ) : (
              topCategories.map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{category.name}</span>
                    <span className="text-sm font-medium text-slate-900">${category.revenue.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ink-500 rounded-full"
                      style={{ width: `${(category.revenue / maxCategoryRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-slate-400" />
          <h3 className="font-medium text-slate-900">Team Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 table-header">User</th>
                <th className="text-right py-3 px-4 table-header">Items Processed</th>
                <th className="text-right py-3 px-4 table-header">Est. Revenue</th>
                <th className="text-right py-3 px-4 table-header">Avg/Item</th>
                <th className="text-left py-3 px-4 table-header">Performance</th>
              </tr>
            </thead>
            <tbody>
              {topSellers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No team performance data available
                  </td>
                </tr>
              ) : (
                topSellers.map((seller, index) => (
                  <tr key={index} className="table-row">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-ink-100 rounded-full flex items-center justify-center">
                          <span className="text-ink-600 font-medium text-sm">
                            {seller.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900">{seller.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-slate-900">{seller.itemsSold}</td>
                    <td className="text-right py-3 px-4 text-slate-900">${seller.revenue.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-slate-900">
                      ${seller.itemsSold > 0 ? (seller.revenue / seller.itemsSold).toFixed(2) : '0.00'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sage-500 rounded-full"
                          style={{ width: `${Math.min((seller.itemsSold / 50) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-slate-400" />
          <h3 className="font-medium text-slate-900">Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-sage-50 rounded-xl">
            <p className="text-3xl font-bold text-sage-600 text-display">${summary.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-sage-700">Total Revenue</p>
          </div>
          <div className="text-center p-4 bg-ink-50 rounded-xl">
            <p className="text-3xl font-bold text-ink-600 text-display">{summary.itemsSold}</p>
            <p className="text-sm text-ink-700">Items Sold</p>
          </div>
          <div className="text-center p-4 bg-plum-100 rounded-xl">
            <p className="text-3xl font-bold text-plum-600 text-display">{summary.sellThroughRate}%</p>
            <p className="text-sm text-plum-600">Sell-Through Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};
