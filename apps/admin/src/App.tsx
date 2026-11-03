import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { BookingsManagement } from './pages/BookingsManagement';
import { UniversalServiceManagement } from './pages/UniversalServiceManagement';
import { MasterDataManagement } from './pages/MasterDataManagement';
import { ImportExportManagement } from './pages/ImportExportManagement';
import { CustomersManagement } from './pages/CustomersManagement';
import { RolesManagement } from './pages/RolesManagement';
import { UsersManagement } from './pages/UsersManagement';
import { PricingManagement } from './pages/PricingManagement';
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'bookings':
        return <BookingsManagement />;
      // 10 Services
      case 'flights':
      case 'hotels':
      case 'villas':
      case 'packages':
      case 'trains':
      case 'buses':
      case 'cabs':
      case 'tours':
      case 'visa':
      case 'insurance':
        return <UniversalServiceManagement entity={currentTab} />;
      // Master Reference Data
      case 'master-data':
        return <MasterDataManagement />;
      // Commercials
      case 'pricing':
        return <PricingManagement />;
      case 'coupons':
        return <CouponsManagement />;
      // Users & Access
      case 'customers':
        return <CustomersManagement />;
      case 'roles':
        return <RolesManagement />;
      case 'users':
        return <UsersManagement />;
      // Tools & Audit
      case 'import-export':
        return <ImportExportManagement />;
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
      <AdminSidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader 
          isSidebarOpen={isMobileSidebarOpen}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto min-w-0">
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
