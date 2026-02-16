import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { formatDistanceToNow } from 'date-fns';

export const StatusBar: React.FC = () => {
  const { user } = useAuthStore();
  const { syncStatus, isSyncing, sync } = useAppStore();

  return (
    <footer className="bg-slate-900 h-8 flex items-center justify-between px-5 text-xs flex-shrink-0">
      <div className="flex items-center gap-3 text-slate-400">
        <span>
          <span className="text-slate-500">Domain:</span>{' '}
          <span className="text-slate-300 font-medium">{user?.domain?.name || 'Local'}</span>
        </span>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <span className="hidden sm:inline">
          <span className="text-slate-500">Account:</span>{' '}
          <span className="text-slate-300 font-medium">Main Store</span>
        </span>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <span className="hidden sm:inline text-slate-400">
          {user?.email || 'Not logged in'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {syncStatus.isConnected ? (
            <>
              <Wifi size={12} className="text-sage-400" />
              <span className="text-sage-400">Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-coral-400" />
              <span className="text-coral-400">Offline</span>
            </>
          )}
        </div>

        {syncStatus.lastSyncAt && (
          <span className="hidden sm:inline text-slate-500">
            {formatDistanceToNow(new Date(syncStatus.lastSyncAt), { addSuffix: true })}
          </span>
        )}

        {syncStatus.pendingChanges > 0 && (
          <span className="flex items-center gap-1 text-amber-400">
            <AlertCircle size={12} />
            {syncStatus.pendingChanges}
          </span>
        )}

        <button
          onClick={sync}
          disabled={isSyncing}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing' : 'Sync'}
        </button>

        <span className="text-slate-600">v2.0</span>
      </div>
    </footer>
  );
};
