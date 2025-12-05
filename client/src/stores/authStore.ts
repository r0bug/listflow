import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Domain } from '../types';
import api from '../api/client';

interface AuthState {
  user: User | null;
  domain: Domain | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  recentUsers: User[];

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (userId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string, refreshToken?: string) => void;
  switchUser: (userId: string, pin: string) => Promise<void>;
  addRecentUser: (user: User) => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      domain: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      recentUsers: [],

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.login(email, password);
          if (response.success) {
            const { user, token, refreshToken } = response.data;
            api.setToken(token);
            set({
              user,
              domain: user.domain,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            get().addRecentUser(user);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithPin: async (userId: string, pin: string) => {
        set({ isLoading: true });
        try {
          const response = await api.loginWithPin(userId, pin);
          if (response.success) {
            const { user, token } = response.data;
            api.setToken(token);
            set({
              user,
              domain: user.domain,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            get().addRecentUser(user);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch {
          // Ignore errors during logout
        }
        api.setToken(null);
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setToken: (token: string, refreshToken?: string) => {
        api.setToken(token);
        set({ token, refreshToken: refreshToken ?? get().refreshToken });
      },

      switchUser: async (userId: string, pin: string) => {
        await get().loginWithPin(userId, pin);
      },

      addRecentUser: (user: User) => {
        const recentUsers = get().recentUsers.filter((u) => u.id !== user.id);
        recentUsers.unshift(user);
        set({ recentUsers: recentUsers.slice(0, 5) });
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) return false;

        api.setToken(token);
        try {
          const response = await api.getMe();
          if (response.success) {
            set({ user: response.data, isAuthenticated: true });
            return true;
          }
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
        return false;
      },
    }),
    {
      name: 'consoleebay-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        recentUsers: state.recentUsers,
      }),
    }
  )
);
