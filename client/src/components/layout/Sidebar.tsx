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
          className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium">{label}</span>
          </div>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {expanded && (
          <div className="ml-9 mt-1 space-y-1">
            {children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  )
                }
              >
                <span>{child.label}</span>
                {child.badge !== undefined && child.badge > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
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
            ? 'bg-blue-100 text-blue-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100'
        )
      }
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />

        <NavItem to="/import" icon={<Upload size={20} />} label="Import" />

        <NavItem
          to="/queue"
          icon={<ListTodo size={20} />}
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
          icon={<Package size={20} />}
          label="Listings"
          children={[
            { to: '/listings/active', label: 'Active' },
            { to: '/listings/sold', label: 'Sold' },
          ]}
        />

        <NavItem to="/inventory" icon={<Warehouse size={20} />} label="Inventory" />

        <NavItem to="/templates" icon={<FileText size={20} />} label="Templates" />

        <NavItem to="/sell-similar" icon={<Copy size={20} />} label="Sell Similar" />

        <NavItem to="/research" icon={<Search size={20} />} label="Research" />

        <NavItem to="/reports" icon={<BarChart3 size={20} />} label="Reports" />

        <div className="pt-4 border-t border-gray-200 mt-4">
          <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
        </div>
      </nav>
    </aside>
  );
};
