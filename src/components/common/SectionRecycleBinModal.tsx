import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { OriginModule } from '../../types';
import {
  Trash2,
  RotateCcw,
  X,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertOctagon,
  Receipt,
  CheckCircle,
} from 'lucide-react';

interface SectionRecycleBinModalProps {
  module: OriginModule;
  isOpen: boolean;
  onClose: () => void;
}

export const SectionRecycleBinModal: React.FC<SectionRecycleBinModalProps> = ({
  module,
  isOpen,
  onClose,
}) => {
  const {
    recycleBin,
    restoreRecycleBinItems,
    permanentlyDeleteRecycleBinItems,
    addToast,
  } = useStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sectionItems = useMemo(() => {
    return recycleBin.filter((item) => item.originModule === module);
  }, [recycleBin, module]);

  if (!isOpen) return null;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(sectionItems.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggle = (id: string, checked: boolean) => {
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
    if (sectionItems.length === 0) return;
    restoreRecycleBinItems(sectionItems.map((i) => i.id));
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    permanentlyDeleteRecycleBinItems(selectedIds);
    setSelectedIds([]);
  };

  const handleEmptySectionBin = () => {
    if (sectionItems.length === 0) return;
    permanentlyDeleteRecycleBinItems(sectionItems.map((i) => i.id));
    setSelectedIds([]);
  };

  const getModuleIcon = () => {
    switch (module) {
      case 'Inventory':
        return <Boxes className="w-5 h-5 text-blue-600" />;
      case 'Inflow':
        return <ArrowDownToLine className="w-5 h-5 text-indigo-600" />;
      case 'Outflow':
        return <ArrowUpFromLine className="w-5 h-5 text-orange-600" />;
      case 'Dead Stock':
        return <AlertOctagon className="w-5 h-5 text-rose-600" />;
      case 'Sales':
        return <Receipt className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              {getModuleIcon()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {module} Recycle Bin ({sectionItems.length})
              </h3>
              <p className="text-xs text-slate-500">
                Restoring items automatically recalculates and synchronizes live stock units
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleRestoreSelected}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Selected ({selectedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {sectionItems.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleRestoreAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore All ({sectionItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleEmptySectionBin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empty Bin</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Table / List */}
        <div className="flex-1 overflow-y-auto py-2">
          {sectionItems.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <Trash2 className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-semibold text-slate-700">Recycle Bin is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No deleted records currently exist in this section.
              </p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        sectionItems.length > 0 &&
                        sectionItems.every((i) => selectedIds.includes(i.id))
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-2.5 px-3">Deleted Item / Title</th>
                  <th className="py-2.5 px-3">Summary Details</th>
                  <th className="py-2.5 px-3">Stock Impact Note</th>
                  <th className="py-2.5 px-3">Deleted At</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sectionItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const formattedDate = new Date(item.deletedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
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
                          onChange={(e) => handleToggle(item.id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.title}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {item.summary}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {item.stockEffectNote}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => restoreRecycleBinItems([item.id])}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-colors cursor-pointer"
                            title="Restore this item"
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
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
