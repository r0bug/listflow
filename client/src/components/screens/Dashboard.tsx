import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ListTodo,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  action?: { label: string; to: string };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, action }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
    </div>
    {action && (
      <Link
        to={action.to}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3"
      >
        {action.label}
        <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

interface QueuePreviewProps {
  identify: number;
  review: number;
  price: number;
}

const QueuePreview: React.FC<QueuePreviewProps> = ({ identify, review, price }) => (
  <div className="flex gap-2 mt-2">
    <div className="flex-1 text-center py-2 bg-gray-100 rounded">
      <div className="text-lg font-bold">{identify}</div>
      <div className="text-xs text-gray-500">ID</div>
    </div>
    <div className="flex-1 text-center py-2 bg-gray-100 rounded">
      <div className="text-lg font-bold">{review}</div>
      <div className="text-xs text-gray-500">REV</div>
    </div>
    <div className="flex-1 text-center py-2 bg-gray-100 rounded">
      <div className="text-lg font-bold">{price}</div>
      <div className="text-xs text-gray-500">PRC</div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { loadDashboardStats, loadRecentActivity, dashboardStats, recentActivity } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadDashboardStats(), loadRecentActivity()]);
      setIsLoading(false);
    };
    loadData();
  }, [loadDashboardStats, loadRecentActivity]);

  // Use real data from store, with fallback defaults
  const stats = dashboardStats || {
    queueTotal: 0,
    queueCounts: { identify: 0, review: 0, price: 0, ready: 0 },
    totalListed: 0,
    soldToday: 0,
    soldTodayValue: 0,
    revenue30Days: 0,
    needsAttention: {
      lowConfidence: 0,
      stale: 0,
      pendingSync: 0,
    },
  };

  const activity = recentActivity.length > 0 ? recentActivity : [
    { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), action: 'Session started', item: null, price: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/queue"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Play size={18} />
          Start Queue
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Queue</p>
              <p className="text-2xl font-bold mt-1">{stats.queueTotal}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <ListTodo size={20} className="text-blue-600" />
            </div>
          </div>
          <QueuePreview
            identify={stats.queueCounts.identify}
            review={stats.queueCounts.review}
            price={stats.queueCounts.price}
          />
          <Link
            to="/queue"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3"
          >
            Start Queue
            <ArrowRight size={14} />
          </Link>
        </div>

        <StatCard
          title="Listed"
          value={stats.totalListed}
          subtitle="Active items on eBay"
          icon={<Package size={20} className="text-green-600" />}
          color="bg-green-100"
          action={{ label: 'View All', to: '/listings/active' }}
        />

        <StatCard
          title="Sold Today"
          value={stats.soldToday}
          subtitle={`$${stats.soldTodayValue.toFixed(2)} total`}
          icon={<DollarSign size={20} className="text-purple-600" />}
          color="bg-purple-100"
          action={{ label: 'View Orders', to: '/listings/sold' }}
        />

        <StatCard
          title="Revenue (30 days)"
          value={`$${stats.revenue30Days.toLocaleString()}`}
          icon={<TrendingUp size={20} className="text-orange-600" />}
          color="bg-orange-100"
          action={{ label: 'Report', to: '/reports' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activity.map((item: any, index: number) => (
              <div key={index} className="px-4 py-3 flex items-center gap-4">
                <span className="text-sm text-gray-500 w-12">{item.time}</span>
                <div className="flex-1">
                  <span className="font-medium">{item.action}</span>
                  {item.item && (
                    <span className="text-gray-600"> "{item.item}"</span>
                  )}
                  {item.price && (
                    <span className="text-green-600"> → ${item.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Needs Attention</h2>
          </div>
          <div className="p-4 space-y-3">
            {stats.needsAttention.lowConfidence > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg text-yellow-800">
                <AlertCircle size={20} />
                <span>
                  {stats.needsAttention.lowConfidence} items with low AI confidence (&lt;70%)
                  need manual review
                </span>
              </div>
            )}
            {stats.needsAttention.stale > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg text-yellow-800">
                <Clock size={20} />
                <span>
                  {stats.needsAttention.stale} items waiting &gt;24 hours in queue
                </span>
              </div>
            )}
            {stats.needsAttention.pendingSync > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-blue-800">
                <Package size={20} />
                <span>Sync pending: {stats.needsAttention.pendingSync} items to upload</span>
              </div>
            )}
            {stats.needsAttention.lowConfidence === 0 && stats.needsAttention.stale === 0 && stats.needsAttention.pendingSync === 0 && (
              <div className="text-center text-gray-500 py-4">
                All caught up! No items need attention.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
