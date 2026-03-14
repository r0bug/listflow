import React from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-5 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
        >
          <Menu size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ink-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">LF</span>
          </div>
          <span className="text-lg font-semibold text-slate-900 hidden sm:inline tracking-tight">
            ListFlow
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-slate-100 rounded-lg relative transition-colors">
          <Bell size={18} className="text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-amber-700 font-semibold text-sm">
                {(user?.displayName || user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-slate-800 leading-tight">
                {user?.displayName || user?.name || 'User'}
              </div>
              <div className="text-xs text-slate-400">{user?.role}</div>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-medium text-slate-800">{user?.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{user?.email}</div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-coral-600 hover:bg-coral-50 transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
