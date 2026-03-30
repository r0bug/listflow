import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Package,
  Warehouse,
  Search,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Copy,
  BarChart3,
  Camera,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onNavigate?: () => void;
  children?: { to: string; label: string; badge?: number }[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge, onNavigate, children }) => {
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
                onClick={onNavigate}
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
      onClick={onNavigate}
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

interface SidebarProps {
  isMobileOpen?: boolean;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onNavigate }) => {
  const navContent = (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <NavItem to="/" icon={<Warehouse size={18} />} label="Inventory" onNavigate={onNavigate} />
      <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" onNavigate={onNavigate} />
      <NavItem to="/import" icon={<Upload size={18} />} label="Import" onNavigate={onNavigate} />
      <NavItem to="/snap" icon={<Camera size={18} />} label="Snap" onNavigate={onNavigate} />

      <NavItem
        to="/listings"
        icon={<Package size={18} />}
        label="Listings"
        onNavigate={onNavigate}
        children={[
          { to: '/listings/active', label: 'Active' },
          { to: '/listings/sold', label: 'Sold' },
        ]}
      />
      <NavItem to="/templates" icon={<FileText size={18} />} label="Templates" onNavigate={onNavigate} />
      <NavItem to="/sell-similar" icon={<Copy size={18} />} label="Sell Similar" onNavigate={onNavigate} />
      <NavItem to="/research" icon={<Search size={18} />} label="Research" onNavigate={onNavigate} />
      <NavItem to="/reports" icon={<BarChart3 size={18} />} label="Reports" onNavigate={onNavigate} />
      <NavItem to="/analytics" icon={<TrendingUp size={18} />} label="Analytics" onNavigate={onNavigate} />

      <div className="pt-3 mt-3 border-t border-slate-100">
        <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" onNavigate={onNavigate} />
      </div>
    </nav>
  );

  // Mobile: overlay drawer
  if (isMobileOpen !== undefined) {
    if (!isMobileOpen) return null;
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          onClick={onNavigate}
        />
        {/* Drawer */}
        <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col h-full shadow-xl md:hidden animate-slide-in-left">
          {navContent}
        </aside>
      </>
    );
  }

  // Desktop: inline sidebar
  return (
    <aside className="hidden md:flex w-60 bg-white border-r border-slate-200 flex-col h-full">
      {navContent}
    </aside>
  );
};
