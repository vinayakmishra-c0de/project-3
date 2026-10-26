import React from 'react';
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
  Sparkles,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const {
    activeTab,
    setActiveTab,
    cart,
    inventory,
    recycleBin,
    logout,
    cashierName,
    resetToSampleData,
  } = useStore();

  const lowStockCount = inventory.filter(
    (i) => i.availableUnits <= (i.minStockAlert ?? 5)
  ).length;

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'pos',
      label: 'POS Billing',
      icon: CreditCard,
      badge: cart.length > 0 ? cart.reduce((s, c) => s + c.quantity, 0) : undefined,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'inventory',
      label: 'Live Stock & Catalog',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'inflow',
      label: 'Stock Inflow (Purchases)',
      icon: ArrowDownToLine,
    },
    {
      id: 'outflow',
      label: 'Stock Outflow (Dispatch)',
      icon: ArrowUpFromLine,
    },
    {
      id: 'deadstock',
      label: 'Dead Stock & Claims',
      icon: AlertOctagon,
    },
    {
      id: 'analytics',
      label: 'Sales & Analytics',
      icon: BarChart3,
    },
    {
      id: 'recyclebin',
      label: 'Universal Recycle Bin',
      icon: Trash2,
      badge: recycleBin.length > 0 ? recycleBin.length : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-68'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} no-print`}
      >
        {/* Header / Brand */}
        <div className="h-18 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700/80 shrink-0 shadow-md bg-slate-950 ring-1 ring-white/10">
              <img
                src="/assets/aistudio/Screenshot_2026-10-08_142919_1e22bef8.png"
                alt="NEPS"
                className="w-full h-full object-cover"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white tracking-tight text-base leading-snug truncate">
                  NEPS Uniform Store
                </span>
                <span className="text-[11px] text-blue-400 font-medium leading-none">
                  National English Public School
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                      item.badgeColor || 'bg-slate-700 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge !== undefined && (
                  <span
                    className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${
                      item.badgeColor?.split(' ')[0] || 'bg-blue-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Demo reset & quick tips */}
        {!collapsed && (
          <div className="px-3 py-2 border-t border-slate-800">
            <button
              onClick={() => {
                resetToSampleData();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-amber-950/30 rounded-lg border border-slate-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Demo Seed Data</span>
            </button>
          </div>
        )}

        {/* Footer / Cashier Info & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {cashierName || 'Store Manager'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    ● Admin Online
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
