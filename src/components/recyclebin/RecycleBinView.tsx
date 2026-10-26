import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { OriginModule, RecycleBinItem } from '../../types';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertOctagon,
  Receipt,
  CheckCircle,
  X,
  Search,
  Layers,
} from 'lucide-react';

export const RecycleBinView: React.FC = () => {
  const {
    recycleBin,
    restoreRecycleBinItems,
    restoreAllRecycleBin,
    permanentlyDeleteRecycleBinItems,
    emptyRecycleBin,
    addToast,
  } = useStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [moduleFilter, setModuleFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const MODULES: OriginModule[] = ['Sales', 'Inflow', 'Outflow', 'Dead Stock', 'Inventory'];

  const filteredItems = useMemo(() => {
    return recycleBin.filter((item) => {
      const matchMod = moduleFilter === 'All' || item.originModule === moduleFilter;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.stockEffectNote.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMod && matchSearch;
    });
  }, [recycleBin, moduleFilter, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredItems.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleRestoreSelected = () => {
    if (selectedIds.length === 0) return;
    restoreRecycleBinItems(selectedIds);
    setSelectedIds([]);
  };

  const handleRestoreAll = () => {
    if (recycleBin.length === 0) return;
    restoreAllRecycleBin();
    setSelectedIds([]);
  };

  const handlePermanentDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    permanentlyDeleteRecycleBinItems(selectedIds);
    setSelectedIds([]);
  };

  const handleEmptyBin = () => {
    if (recycleBin.length === 0) return;
    emptyRecycleBin();
    setSelectedIds([]);
  };

  const getModuleIcon = (mod: OriginModule) => {
    switch (mod) {
      case 'Inventory':
        return <Boxes className="w-4 h-4 text-blue-600" />;
      case 'Sales':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case 'Inflow':
        return <ArrowDownToLine className="w-4 h-4 text-indigo-600" />;
      case 'Outflow':
        return <ArrowUpFromLine className="w-4 h-4 text-orange-600" />;
      case 'Dead Stock':
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      default:
        return <Trash2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const getModuleBadgeColor = (mod: OriginModule) => {
    switch (mod) {
      case 'Inventory':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sales':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Inflow':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Outflow':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Dead Stock':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Explanatory Banner & Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-md border border-slate-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Universal Soft Deletion & Stock Reversal</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Items deleted anywhere in the system (Live Stock, Inflows, Outflows, Dead Stock, or
                Student Sales) are stored safely here. Restoring an item automatically rolls back and
                synchronizes its precise stock quantity in Live Stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {recycleBin.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleRestoreAll}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore All ({recycleBin.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleEmptyBin}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empty Bin</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Controls & Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Module Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setModuleFilter('All')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
              moduleFilter === 'All'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Deleted ({recycleBin.length})
          </button>
          {MODULES.map((mod) => {
            const count = recycleBin.filter((i) => i.originModule === mod).length;
            const isSelected = moduleFilter === mod;
            return (
              <button
                key={mod}
                onClick={() => setModuleFilter(mod)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{mod}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected actions */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={handleRestoreSelected}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Selected ({selectedIds.length})</span>
              </button>
              <button
                onClick={handlePermanentDeleteSelected}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </>
          )}

          <div className="relative min-w-44">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deleted items..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Deleted Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredItems.length > 0 &&
                      filteredItems.every((i) => selectedIds.includes(i.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3">Origin Module</th>
                <th className="py-3 px-3">Item Title / Reference</th>
                <th className="py-3 px-3">Details & Content Summary</th>
                <th className="py-3 px-3">Live Stock Rollback Impact</th>
                <th className="py-3 px-3">Deleted Date & Time</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Trash2 className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-semibold text-xs text-slate-600">Recycle Bin is empty</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Deleted items across all modules will appear here with one-click restore.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const formattedDate = new Date(item.deletedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(item.id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getModuleBadgeColor(
                            item.originModule
                          )}`}
                        >
                          {getModuleIcon(item.originModule)}
                          <span>{item.originModule}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                        {item.title}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] max-w-sm leading-relaxed">
                        {item.summary}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg inline-block">
                          {item.stockEffectNote}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => restoreRecycleBinItems([item.id])}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
                            title="Restore and synchronize live stock"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => permanentlyDeleteRecycleBinItems([item.id])}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Permanently Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
