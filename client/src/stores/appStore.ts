import { create } from 'zustand';
import type { SyncStatus, DashboardStats, EbayAccount, Warehouse } from '../types';
import api from '../api/client';

interface AppState {
  // Sync status
  syncStatus: SyncStatus;
  isSyncing: boolean;

  // Dashboard
  dashboardStats: DashboardStats | null;
  recentActivity: any[];

  // Cached data
  ebayAccounts: EbayAccount[];
  warehouses: Warehouse[];

  // UI state
  sidebarCollapsed: boolean;
  currentView: string;
  selectedItemIds: string[];

  // Actions
  setSyncStatus: (status: SyncStatus) => void;
  sync: () => Promise<void>;
  loadDashboardStats: () => Promise<void>;
  loadRecentActivity: () => Promise<void>;
  loadEbayAccounts: () => Promise<void>;
  loadWarehouses: () => Promise<void>;
  toggleSidebar: () => void;
  setCurrentView: (view: string) => void;
  selectItems: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  syncStatus: {
    isConnected: true,
    pendingChanges: 0,
    conflicts: 0,
  },
  isSyncing: false,
  dashboardStats: null,
  recentActivity: [],
  ebayAccounts: [],
  warehouses: [],
  sidebarCollapsed: false,
  currentView: 'dashboard',
  selectedItemIds: [],

  // Actions
  setSyncStatus: (status) => set({ syncStatus: status }),

  sync: async () => {
    set({ isSyncing: true });
    try {
      const response = await api.getSyncStatus();
      if (response.success) {
        set({ syncStatus: response.data });
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  loadDashboardStats: async () => {
    try {
      const response = await api.getDashboardStats();
      if (response.success) {
        set({ dashboardStats: response.data });
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  },

  loadRecentActivity: async () => {
    try {
      const response = await api.getRecentActivity(10);
      if (response.success) {
        set({ recentActivity: response.data });
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  },

  loadEbayAccounts: async () => {
    try {
      const response = await api.getEbayAccounts();
      if (response.success) {
        set({ ebayAccounts: response.data });
      }
    } catch (error) {
      console.error('Failed to load eBay accounts:', error);
    }
  },

  loadWarehouses: async () => {
    try {
      const response = await api.getWarehouses();
      if (response.success) {
        set({ warehouses: response.data });
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setCurrentView: (view) => set({ currentView: view }),

  selectItems: (ids) => set({ selectedItemIds: ids }),

  clearSelection: () => set({ selectedItemIds: [] }),
}));
