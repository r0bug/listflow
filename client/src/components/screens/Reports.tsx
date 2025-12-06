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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Sales analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <DollarSign size={20} />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                metrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {metrics.revenueChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(metrics.revenueChange)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">${metrics.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <Package size={20} />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                metrics.itemsChange >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {metrics.itemsChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(metrics.itemsChange)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.itemsSold}</p>
            <p className="text-sm text-gray-500">Items Sold</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <TrendingUp size={20} />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                metrics.avgPriceChange >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {metrics.avgPriceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(metrics.avgPriceChange)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">${metrics.avgSalePrice.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Avg Sale Price</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <BarChart2 size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.activeListings}</p>
            <p className="text-sm text-gray-500">Active Listings</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">Daily Sales</h3>
          <div className="h-48 flex items-end gap-2">
            {salesByDay.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                No sales data available
              </div>
            ) : (
              salesByDay.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${(day.sales / maxSales) * 100}%`, minHeight: day.sales > 0 ? '4px' : '0' }}
                    title={`${day.sales} sales - $${day.revenue.toFixed(2)}`}
                  />
                  <span className="text-xs text-gray-500">{day.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">Top Categories</h3>
          <div className="space-y-3">
            {topCategories.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No category data available</div>
            ) : (
              topCategories.map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{category.name}</span>
                    <span className="text-sm font-medium text-gray-900">${category.revenue.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
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
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-gray-400" />
          <h3 className="font-medium text-gray-900">Team Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Items Processed</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Est. Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Avg/Item</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Performance</th>
              </tr>
            </thead>
            <tbody>
              {topSellers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No team performance data available
                  </td>
                </tr>
              ) : (
                topSellers.map((seller, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {seller.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{seller.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900">{seller.itemsSold}</td>
                    <td className="text-right py-3 px-4 text-gray-900">${seller.revenue.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">
                      ${seller.itemsSold > 0 ? (seller.revenue / seller.itemsSold).toFixed(2) : '0.00'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
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
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-gray-400" />
          <h3 className="font-medium text-gray-900">Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-3xl font-bold text-green-600">${summary.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-green-700">Total Revenue</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-3xl font-bold text-blue-600">{summary.itemsSold}</p>
            <p className="text-sm text-blue-700">Items Sold</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-3xl font-bold text-purple-600">{summary.sellThroughRate}%</p>
            <p className="text-sm text-purple-700">Sell-Through Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};
