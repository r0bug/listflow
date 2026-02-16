import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';

export const MainLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
      <StatusBar />
    </div>
  );
};
