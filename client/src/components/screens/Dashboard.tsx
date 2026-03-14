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
  <div className="stat-card card-hover">
    <div className="flex items-start justify-between">
      <div>
        <p className="stat-label">{title}</p>
        <p className="stat-value mt-1">{value}</p>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    </div>
    {action && (
      <Link
        to={action.to}
        className="flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-ink-800 mt-4 transition-colors duration-150"
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
  <div className="flex gap-2 mt-3">
    <div className="flex-1 text-center py-2.5 bg-slate-50 rounded-lg border border-slate-100">
      <div className="text-lg font-bold text-slate-800">{identify}</div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">ID</div>
    </div>
    <div className="flex-1 text-center py-2.5 bg-slate-50 rounded-lg border border-slate-100">
      <div className="text-lg font-bold text-slate-800">{review}</div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">REV</div>
    </div>
    <div className="flex-1 text-center py-2.5 bg-slate-50 rounded-lg border border-slate-100">
      <div className="text-lg font-bold text-slate-800">{price}</div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">PRC</div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { loadDashboardStats, loadRecentActivity, dashboardStats, recentActivity } = useAppStore();
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadDashboardStats(), loadRecentActivity()]);
      setIsLoading(false);
    };
    loadData();
  }, [loadDashboardStats, loadRecentActivity]);

  // Use real data from store, with fallback defaults
  const stats: any = dashboardStats || {
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link
          to="/queue"
          className="btn-primary"
        >
          <Play size={18} />
          Start Queue
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stat-card card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Queue</p>
              <p className="stat-value mt-1">{stats.queueTotal}</p>
            </div>
            <div className="p-3 rounded-xl bg-ink-100">
              <ListTodo size={20} className="text-ink-600" />
            </div>
          </div>
          <QueuePreview
            identify={stats.queueCounts.identify}
            review={stats.queueCounts.review}
            price={stats.queueCounts.price}
          />
          <Link
            to="/queue"
            className="flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-ink-800 mt-4 transition-colors duration-150"
          >
            Start Queue
            <ArrowRight size={14} />
          </Link>
        </div>

        <StatCard
          title="Listed"
          value={stats.totalListed}
          subtitle="Active items on eBay"
          icon={<Package size={20} className="text-sage-600" />}
          color="bg-sage-100"
          action={{ label: 'View All', to: '/listings/active' }}
        />

        <StatCard
          title="Sold Today"
          value={stats.soldToday}
          subtitle={`$${stats.soldTodayValue.toFixed(2)} total`}
          icon={<DollarSign size={20} className="text-plum-500" />}
          color="bg-plum-100"
          action={{ label: 'View Orders', to: '/listings/sold' }}
        />

        <StatCard
          title="Revenue (30 days)"
          value={`$${stats.revenue30Days.toLocaleString()}`}
          icon={<TrendingUp size={20} className="text-amber-600" />}
          color="bg-amber-100"
          action={{ label: 'Report', to: '/reports' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {activity.map((item: any, index: number) => (
              <div key={index} className="px-5 py-3.5 flex items-center gap-4 transition-colors duration-100 hover:bg-slate-50">
                <span className="text-sm text-slate-400 w-12 font-medium tabular-nums">{item.time}</span>
                <div className="flex-1">
                  <span className="font-medium text-slate-800">{item.action}</span>
                  {item.item && (
                    <span className="text-slate-500"> "{item.item}"</span>
                  )}
                  {item.price && (
                    <span className="text-sage-600 font-medium"> &rarr; ${item.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Needs Attention</h2>
          </div>
          <div className="p-5 space-y-3">
            {stats.needsAttention.lowConfidence > 0 && (
              <div className="flex items-center gap-3 p-3.5 bg-amber-50 rounded-lg text-amber-700 border border-amber-200/60">
                <AlertCircle size={20} className="shrink-0" />
                <span className="text-sm font-medium">
                  {stats.needsAttention.lowConfidence} items with low AI confidence (&lt;70%)
                  need manual review
                </span>
              </div>
            )}
            {stats.needsAttention.stale > 0 && (
              <div className="flex items-center gap-3 p-3.5 bg-amber-50 rounded-lg text-amber-700 border border-amber-200/60">
                <Clock size={20} className="shrink-0" />
                <span className="text-sm font-medium">
                  {stats.needsAttention.stale} items waiting &gt;24 hours in queue
                </span>
              </div>
            )}
            {stats.needsAttention.pendingSync > 0 && (
              <div className="flex items-center gap-3 p-3.5 bg-ink-50 rounded-lg text-ink-700 border border-ink-200/60">
                <Package size={20} className="shrink-0" />
                <span className="text-sm font-medium">Sync pending: {stats.needsAttention.pendingSync} items to upload</span>
              </div>
            )}
            {stats.needsAttention.lowConfidence === 0 && stats.needsAttention.stale === 0 && stats.needsAttention.pendingSync === 0 && (
              <div className="text-center text-slate-400 py-6 font-medium">
                All caught up! No items need attention.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
