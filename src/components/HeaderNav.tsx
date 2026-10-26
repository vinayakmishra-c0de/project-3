import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { NavTab } from '../types';
import {
  CreditCard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertOctagon,
  BarChart3,
  Trash2,
  LogOut,
  ShoppingBag,
  BookOpen,
  Sparkles,
  User,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';

export const HeaderNav: React.FC = () => {
  const {
    activeDivision,
    setActiveDivision,
    activeTab,
    setActiveTab,
    cart,
    inventory,
    recycleBin,
    logout,
    cashierName,
    setCashierName,
  } = useStore();

  const [timeStr, setTimeStr] = useState<string>('');
  const [isEditingCashier, setIsEditingCashier] = useState(false);
  const [tempCashier, setTempCashier] = useState(cashierName);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        }) +
          ', ' +
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

  const isBooks = activeDivision === 'books';

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'pos',
      label: isBooks ? 'Books POS Billing' : 'POS Billing',
      icon: CreditCard,
      badge: cart.length > 0 ? cart.reduce((s, c) => s + c.quantity, 0) : undefined,
      badgeColor: isBooks ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white',
    },
    {
      id: 'inventory',
      label: isBooks ? 'Books Live Stock' : 'Live Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'inflow',
      label: 'Stock Inflow',
      icon: ArrowDownToLine,
    },
    {
      id: 'outflow',
      label: 'Stock Outflow',
      icon: ArrowUpFromLine,
    },
    {
      id: 'deadstock',
      label: isBooks ? 'Damaged / Defective Books' : 'Dead Stock',
      icon: AlertOctagon,
    },
    {
      id: 'analytics',
      label: 'Sales & Analytics',
      icon: BarChart3,
    },
    {
      id: 'recyclebin',
      label: 'Recycle Bin',
      icon: Trash2,
      badge: recycleBin.length > 0 ? recycleBin.length : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
  ];

  const handleSaveCashier = () => {
    if (tempCashier.trim()) {
      setCashierName(tempCashier.trim());
    }
    setIsEditingCashier(false);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md no-print">
      {/* Top Banner Row: Brand, Division Quick Switcher, Live Date, Cashier, Demo Reset, Logout */}
      <div className="px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-slate-800/80 gap-3">
        {/* Brand & Division Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 shadow-md shrink-0 bg-slate-950 ring-1 ring-white/10">
              <img
                src="/assets/aistudio/Screenshot_2026-10-08_142919_1e22bef8.png"
                alt="NEPS Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {/* Dynamic Header Badge - Text 'NEPS' removed as requested */}
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border transition-colors ${
                    isBooks
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60 shadow-xs'
                      : 'bg-blue-950/90 text-blue-300 border-blue-700/60 shadow-xs'
                  }`}
                >
                  {isBooks ? 'Books & Stationery Division' : 'Uniform Division'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                New Era Public School Store Portal
              </span>
            </div>
          </div>

          {/* Quick-Switch Toggle between Uniforms and Books without logging out */}
          <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveDivision('uniform')}
              title="Switch to Uniform Division"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isBooks
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Uniforms</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDivision('books')}
              title="Switch to Books & Stationery Division"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isBooks
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Books & Stationery</span>
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 text-xs ml-auto">
          {/* Mobile Quick Switcher */}
          <div className="flex sm:hidden items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveDivision(isBooks ? 'uniform' : 'books')}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
            >
              <ArrowRightLeft className="w-3 h-3 text-blue-400" />
              <span>{isBooks ? 'Go to Uniforms' : 'Go to Books'}</span>
            </button>
          </div>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeStr}</span>
          </div>

          {/* Low Stock Warning */}
          {lowStockCount > 0 && (
            <button
              onClick={() => setActiveTab('inventory')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer hover:bg-amber-500/30 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{lowStockCount} Low Stock</span>
            </button>
          )}

          {/* Firebase Cloud Live Indicator */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firebase Cloud</span>
          </div>

          {/* Cashier Switcher */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <div
              className={`w-7 h-7 rounded-full overflow-hidden border flex items-center justify-center shrink-0 ring-1 ring-white/10 ${
                isBooks
                  ? 'border-emerald-500/50 bg-emerald-950'
                  : 'border-blue-500/50 bg-blue-950'
              }`}
            >
              <img
                src="/assets/aistudio/Screenshot_2026-10-08_142919_1e22bef8.png"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            {isEditingCashier ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempCashier}
                  onChange={(e) => setTempCashier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCashier()}
                  autoFocus
                  className="px-2 py-0.5 text-xs rounded bg-slate-800 text-white border border-blue-500 focus:outline-none w-24"
                />
                <button
                  onClick={handleSaveCashier}
                  className="bg-blue-600 px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer"
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
                className="text-left cursor-pointer group"
                title="Click to edit cashier name"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                  {cashierName}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono leading-none">
                  ● Active
                </div>
              </button>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs Bar in Header */}
      <div className="px-4 lg:px-6 bg-slate-900/90 overflow-x-auto flex items-center gap-1 py-1.5 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? isBooks
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                    item.badgeColor || 'bg-slate-700 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
