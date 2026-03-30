import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout';
import {
  Dashboard,
  PhotoImport,
  Templates,
  ItemDetail,
  PinLogin,
  Inventory,
  Research,
  Settings,
  Listings,
  SellSimilar,
  Reports,
  EbayCallback,
  Analytics,
} from './components/screens';
import Snap from './components/screens/Snap';
import { useAuthStore } from './stores/authStore';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [checking, setChecking] = React.useState(true);

  useEffect(() => {
    checkAuth().finally(() => setChecking(false));
  }, [checkAuth]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Placeholder components for routes not yet fully implemented
const Placeholder: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{name}</h2>
      <p className="text-gray-500">Coming soon...</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PinLogin />} />
      <Route path="/snap" element={<Snap />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Inventory />} />

        {/* Dashboard */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* Import */}
        <Route path="import" element={<PhotoImport />} />

        {/* Queue → redirects to Inventory */}
        <Route path="queue" element={<Navigate to="/inventory" replace />} />
        <Route path="queue/:step" element={<Navigate to="/inventory" replace />} />

        {/* Item Detail */}
        <Route path="item/:id" element={<ItemDetail />} />

        {/* Listings */}
        <Route path="listings" element={<Listings />} />
        <Route path="listings/active" element={<Listings />} />
        <Route path="listings/sold" element={<Listings />} />
        <Route path="listings/:type" element={<Listings />} />

        {/* Inventory */}
        <Route path="inventory" element={<Inventory />} />

        {/* Templates */}
        <Route path="templates" element={<Templates />} />
        <Route path="templates/new" element={<Placeholder name="New Template" />} />
        <Route path="templates/:id/edit" element={<Placeholder name="Edit Template" />} />
        <Route path="templates/:id/use" element={<Placeholder name="Use Template" />} />

        {/* Sell Similar */}
        <Route path="sell-similar" element={<SellSimilar />} />

        {/* Research */}
        <Route path="research" element={<Research />} />

        {/* Reports */}
        <Route path="reports" element={<Reports />} />
        <Route path="performance" element={<Reports />} />

        {/* Analytics */}
        <Route path="analytics" element={<Analytics />} />

        {/* Settings */}
        <Route path="settings" element={<Settings />} />
        <Route path="settings/ebay/callback" element={<EbayCallback />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
