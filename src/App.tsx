import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { LoginView } from './components/auth/LoginView';
import { HeaderNav } from './components/HeaderNav';
import { ToastContainer } from './components/ToastContainer';
import { POSBillingView } from './components/pos/POSBillingView';
import { LiveStockView } from './components/inventory/LiveStockView';
import { StockInflowView } from './components/inflow/StockInflowView';
import { StockOutflowView } from './components/outflow/StockOutflowView';
import { DeadStockView } from './components/deadstock/DeadStockView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { RecycleBinView } from './components/recyclebin/RecycleBinView';

const DashboardContent: React.FC = () => {
  const { isAuthenticated, activeTab } = useStore();

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'pos':
        return <POSBillingView />;
      case 'inventory':
        return <LiveStockView />;
      case 'inflow':
        return <StockInflowView />;
      case 'outflow':
        return <StockOutflowView />;
      case 'deadstock':
        return <DeadStockView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'recyclebin':
        return <RecycleBinView />;
      default:
        return <POSBillingView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header Navigation (all sections placed in the header) */}
      <HeaderNav />

      {/* Main Full-Width Content Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full">
        {renderActiveModule()}
      </main>

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <DashboardContent />
    </StoreProvider>
  );
}
