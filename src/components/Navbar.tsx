import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  User,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';

interface NavbarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  setMobileOpen: (o: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  collapsed,
  setCollapsed,
  setMobileOpen,
}) => {
  const {
    activeTab,
    setActiveTab,
    cashierName,
    setCashierName,
    inventory,
    cart,
  } = useStore();

  const [timeStr, setTimeStr] = useState<string>('');
  const [isEditingCashier, setIsEditingCashier] = useState(false);
  const [tempCashier, setTempCashier] = useState(cashierName);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
          ' | ' +
          now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const lowStockCount = inventory.filter(
    (i) => i.availableUnits <= (i.minStockAlert ?? 5)
  ).length;

  const getTabTitle = () => {
    switch (activeTab) {
      case 'pos':
        return 'POS Billing & Checkout';
      case 'inventory':
        return 'Live Stock & Category Management';
      case 'inflow':
        return 'Stock Inflow (Vendor Purchases)';
      case 'outflow':
        return 'Stock Outflow (Dispatches & Transfers)';
      case 'deadstock':
        return 'Dead Stock & Vendor Replacements';
      case 'analytics':
        return 'Analytics & Student Sales History';
      case 'recyclebin':
        return 'Universal Recycle Bin (Soft Deletion)';
      default:
        return 'Dashboard';
    }
  };

  const handleSaveCashier = () => {
    if (tempCashier.trim()) {
      setCashierName(tempCashier.trim());
    }
    setIsEditingCashier(false);
  };

  return (
    <header className="h-18 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs no-print">
      {/* Left controls */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse trigger */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-snug">
            {getTabTitle()}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>National English Public School</span>
            <span>•</span>
            <span className="font-mono text-slate-400">POS & Inventory v2.4</span>
          </div>
        </div>
      </div>

      {/* Right widgets */}
      <div className="flex items-center gap-3">
        {/* Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 text-xs font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr || 'Loading...'}</span>
        </div>

        {/* Low Stock Warning Pill */}
        {lowStockCount > 0 && (
          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Click to view low stock items"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{lowStockCount} Items Low Stock</span>
          </button>
        )}

        {/* Cashier inline editor */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
            <User className="w-4 h-4" />
          </div>

          <div className="hidden md:block">
            {isEditingCashier ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempCashier}
                  onChange={(e) => setTempCashier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCashier()}
                  autoFocus
                  className="px-2 py-0.5 text-xs border border-blue-400 rounded focus:outline-none w-28 bg-white"
                />
                <button
                  onClick={handleSaveCashier}
                  className="text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempCashier(cashierName);
                  setIsEditingCashier(true);
                }}
                className="text-left group cursor-pointer"
                title="Click to edit cashier name"
              >
                <div className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                  {cashierName}
                </div>
                <div className="text-[10px] text-slate-400 leading-none">
                  Cashier / Staff (click to edit)
                </div>
              </button>
            )}
          </div>
        </div>

        {/* POS Cart button if in other tabs */}
        {activeTab !== 'pos' && cart.length > 0 && (
          <button
            onClick={() => setActiveTab('pos')}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-blue-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          </button>
        )}
      </div>
    </header>
  );
};
