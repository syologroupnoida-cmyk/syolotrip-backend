import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { BookingsManagement } from './pages/BookingsManagement';
import { InventoryManagement } from './pages/InventoryManagement';
import { UsersManagement } from './pages/UsersManagement';
import { CouponsManagement } from './pages/CouponsManagement';
import { AuditLogsManagement } from './pages/AuditLogsManagement';
import { PlatformSettings } from './pages/PlatformSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Do not retry 401/403 auth errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

const AdminMainContent: React.FC = () => {
  const { isAuthenticated } = useAdminAuth();
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'bookings':
        return <BookingsManagement />;
      case 'flights':
      case 'hotels':
      case 'trains':
      case 'buses':
      case 'cabs':
      case 'packages':
        return <InventoryManagement type={currentTab} />;
      case 'users':
        return <UsersManagement />;
      case 'pricing':
        return <CouponsManagement />;
      case 'audit':
        return <AuditLogsManagement />;
      case 'settings':
        return <PlatformSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div
      className={`flex min-h-screen font-sans transition-colors duration-200 ${
        theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <AdminSidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AdminAuthProvider>
          <AdminMainContent />
        </AdminAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
