import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { useIsMobile } from '../../hooks/useIsMobile';

export const MainLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header onMenuToggle={() => setMobileMenuOpen((v) => !v)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar (always visible) */}
        <Sidebar />
        {/* Mobile sidebar (overlay drawer) */}
        {isMobile && (
          <Sidebar
            isMobileOpen={mobileMenuOpen}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        )}
        <main className="flex-1 overflow-auto p-4 md:p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
      <div className="hidden md:flex">
        <StatusBar />
      </div>
    </div>
  );
};
