import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { DashboardOverview } from './pages/DashboardOverview';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
        <AdminSidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-6 overflow-y-auto">
            {currentTab === 'dashboard' ? (
              <DashboardOverview />
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <h3 className="text-lg font-bold text-white capitalize">{currentTab} Section</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  This administrative module is scheduled for implementation in Sprint 3-5 of Phase 1.
                </p>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default App;
