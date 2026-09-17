import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useTenantStore } from '../../app/store/useTenantStore';

export const AppLayout: React.FC = () => {
  const { user } = useAuthStore();
  const { activeCompany } = useTenantStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Placeholder */}
      <aside className="w-full md:w-64 bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold mb-8">
          {activeCompany?.name || 'RentCar ERP'}
        </h1>
        <nav className="flex flex-col gap-2">
          <a href="/" className="hover:bg-primary/80 p-2 rounded">Dashboard</a>
          {/* We will add more links here later */}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Placeholder */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
          <div className="font-medium text-muted-foreground">
            {/* Context/Breadcrumbs here */}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user.email}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
