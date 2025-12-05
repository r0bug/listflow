import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { formatDistanceToNow } from 'date-fns';

export const StatusBar: React.FC = () => {
  const { user } = useAuthStore();
  const { syncStatus, isSyncing, sync } = useAppStore();

  return (
    <footer className="bg-gray-100 border-t border-gray-200 h-8 flex items-center justify-between px-4 text-xs text-gray-600 flex-shrink-0">
      <div className="flex items-center gap-4">
        <span>
          Domain: <strong>{user?.domain?.name || 'Not connected'}</strong>
        </span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">
          Account: <strong>Main Store</strong>
        </span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">
          User: <strong>{user?.email || 'Not logged in'}</strong>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Sync Status */}
        <div className="flex items-center gap-2">
          {syncStatus.isConnected ? (
            <>
              <Wifi size={14} className="text-green-500" />
              <span className="text-green-600">Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-red-500" />
              <span className="text-red-600">Offline</span>
            </>
          )}
        </div>

        {syncStatus.lastSyncAt && (
          <span className="hidden sm:inline">
            Last sync: {formatDistanceToNow(new Date(syncStatus.lastSyncAt), { addSuffix: true })}
          </span>
        )}

        {syncStatus.pendingChanges > 0 && (
          <span className="flex items-center gap-1 text-orange-600">
            <AlertCircle size={14} />
            {syncStatus.pendingChanges} pending
          </span>
        )}

        <button
          onClick={sync}
          disabled={isSyncing}
          className="flex items-center gap-1 hover:text-blue-600 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </button>

        <span className="text-gray-400">v2.0.0</span>
      </div>
    </footer>
  );
};
