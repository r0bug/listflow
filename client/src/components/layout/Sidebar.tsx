import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  ListTodo,
  Package,
  Warehouse,
  Search,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Copy,
  BarChart3,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { cn } from '../../utils/cn';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  children?: { to: string; label: string; badge?: number }[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge, children }) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasChildren = children && children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {expanded && (
          <div className="ml-9 mt-0.5 space-y-0.5 animate-fade-in">
            {children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-ink-50 text-ink-700 font-medium'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  )
                }
              >
                <span>{child.label}</span>
                {child.badge !== undefined && child.badge > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {child.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
          isActive
            ? 'bg-ink-50 text-ink-700 font-medium'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
        )
      }
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-amber-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();

  if (sidebarCollapsed) {
    return null;
  }

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-full">
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
        <NavItem to="/import" icon={<Upload size={18} />} label="Import" />

        <NavItem
          to="/queue"
          icon={<ListTodo size={18} />}
          label="Queue"
          children={[
            { to: '/queue/identify', label: 'Identify', badge: 12 },
            { to: '/queue/review', label: 'Review', badge: 18 },
            { to: '/queue/price', label: 'Price', badge: 9 },
            { to: '/queue/ready', label: 'Ready', badge: 8 },
          ]}
        />

        <NavItem
          to="/listings"
          icon={<Package size={18} />}
          label="Listings"
          children={[
            { to: '/listings/active', label: 'Active' },
            { to: '/listings/sold', label: 'Sold' },
          ]}
        />

        <NavItem to="/inventory" icon={<Warehouse size={18} />} label="Inventory" />
        <NavItem to="/templates" icon={<FileText size={18} />} label="Templates" />
        <NavItem to="/sell-similar" icon={<Copy size={18} />} label="Sell Similar" />
        <NavItem to="/research" icon={<Search size={18} />} label="Research" />
        <NavItem to="/reports" icon={<BarChart3 size={18} />} label="Reports" />

        <div className="pt-3 mt-3 border-t border-slate-100">
          <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" />
        </div>
      </nav>
    </aside>
  );
};
