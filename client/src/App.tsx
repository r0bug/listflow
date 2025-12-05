import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout';
import {
  Dashboard,
  Queue,
  PhotoImport,
  Templates,
  ItemDetail,
  PinLogin,
} from './components/screens';
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

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Import */}
        <Route path="import" element={<PhotoImport />} />

        {/* Queue */}
        <Route path="queue" element={<Queue />} />
        <Route path="queue/:step" element={<Queue />} />

        {/* Item Detail */}
        <Route path="item/:id" element={<ItemDetail />} />

        {/* Listings */}
        <Route path="listings" element={<Placeholder name="Listings" />} />
        <Route path="listings/active" element={<Placeholder name="Active Listings" />} />
        <Route path="listings/sold" element={<Placeholder name="Sold Listings" />} />

        {/* Inventory */}
        <Route path="inventory" element={<Placeholder name="Inventory" />} />

        {/* Templates */}
        <Route path="templates" element={<Templates />} />
        <Route path="templates/new" element={<Placeholder name="New Template" />} />
        <Route path="templates/:id/edit" element={<Placeholder name="Edit Template" />} />
        <Route path="templates/:id/use" element={<Placeholder name="Use Template" />} />

        {/* Sell Similar */}
        <Route path="sell-similar" element={<Placeholder name="Sell Similar" />} />

        {/* Research */}
        <Route path="research" element={<Placeholder name="Price Research" />} />

        {/* Reports */}
        <Route path="reports" element={<Placeholder name="Reports" />} />
        <Route path="performance" element={<Placeholder name="Performance" />} />

        {/* Settings */}
        <Route path="settings" element={<Placeholder name="Settings" />} />

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
