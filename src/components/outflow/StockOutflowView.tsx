import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { StockOutflowRecord } from '../../types';
import {
  exportToExcel,
  parseExcelFile,
  downloadOutflowTemplate,
} from '../../utils/excelUtils';
import { SectionRecycleBinModal } from '../common/SectionRecycleBinModal';
import {
  ArrowUpFromLine,
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  Calendar,
  Building,
  FileSpreadsheet,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';

export const StockOutflowView: React.FC = () => {
  const {
    outflows,
    addOutflow,
    deleteOutflows,
    bulkImportOutflows,
    recycleBin,
    inventory,
    categories,
    addToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSectionRecycleBin, setShowSectionRecycleBin] = useState(false);

  const outflowRecycleCount = recycleBin.filter((i) => i.originModule === 'Outflow').length;

  // Add Outflow Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOutflow, setNewOutflow] = useState({
    date: new Date().toISOString().split('T')[0],
    recipient: 'NEPS West Campus Branch Store',
    referenceSlipNo: `DISP-${Date.now().toString().slice(-4)}`,
    category: categories[0]?.name || 'Full Pant',
    itemName: 'Navy Blue Formal Pant',
    itemCode: 'NEPS-PNT-28',
    size: '28',
    units: 5,
    reason: 'Inter-Branch Stock Transfer',
  });

  // Bulk Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, any>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common reasons
  const REASONS = [
    'Inter-Branch Stock Transfer',
    'Faculty & Coach Demonstration Kits',
    'Defective Return to Factory/Vendor',
    'Annual Sports Meet Direct Issue',
    'Student Scholarship / Charity Donation',
    'Sample Uniform Display Kit',
  ];

  const filteredOutflows = useMemo(() => {
    return outflows.filter((out) => {
      const matchReason = reasonFilter === 'All' || out.reason === reasonFilter;
      const matchSearch =
        out.referenceSlipNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        out.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        out.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        out.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchReason && matchSearch;
    });
  }, [outflows, reasonFilter, searchQuery]);

  const totalDispatchedUnits = useMemo(
    () => outflows.reduce((s, o) => s + o.units, 0),
    [outflows]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredOutflows.map((i) => i.id));
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

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    deleteOutflows(selectedIds);
    setSelectedIds([]);
  };

  const handleExport = () => {
    const data = filteredOutflows.map((o) => ({
      Date: o.date,
      'Recipient / Entity': o.recipient,
      'Reference Slip No': o.referenceSlipNo,
      'Item Code': o.itemCode,
      'Item Name': o.itemName,
      Category: o.category,
      Size: o.size,
      'Outward Units': o.units,
      Reason: o.reason,
    }));
    exportToExcel(data, `NEPS_Stock_Outflows_${new Date().toISOString().split('T')[0]}`);
    addToast('Outflow dispatch history exported to Excel', 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    try {
      const rows = await parseExcelFile(file);
      setImportRows(rows);
    } catch (err: any) {
      addToast(err.message || 'Failed to read file', 'error');
    }
  };

  const commitImport = () => {
    if (importRows.length === 0) return;
    const count = bulkImportOutflows(importRows);
    addToast(`Imported ${count} dispatch rows and updated live stock`, 'success');
    setShowImportModal(false);
    setImportRows([]);
    setImportFileName('');
  };

  const handleInventoryPick = (code: string) => {
    const found = inventory.find((i) => i.code === code);
    if (found) {
      setNewOutflow({
        ...newOutflow,
        itemCode: found.code,
        itemName: found.name,
        category: found.category,
        size: found.size,
      });
    }
  };

  const pickedInventoryItem = inventory.find((i) => i.code === newOutflow.itemCode);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Outflow KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <ArrowUpFromLine className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Outward Dispatches</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
              {outflows.length} <span className="text-xs text-slate-400 font-normal">records</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <span className="font-bold text-lg">📤</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Units Dispatched</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
              {totalDispatchedUnits.toLocaleString('en-IN')}{' '}
              <span className="text-xs text-slate-400 font-normal">units</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Top Outward Destination</div>
            <div className="text-sm font-bold text-slate-800 truncate mt-0.5 max-w-44">
              Branch Stores & Sports
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-56 flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by recipient, slip no, or item..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="All">All Dispatch Reasons</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}

          {/* Section Recycle Bin button right next to Delete Selected */}
          <button
            type="button"
            onClick={() => setShowSectionRecycleBin(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Open Stock Outflow Recycle Bin"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Recycle Bin ({outflowRecycleCount})</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Excel Import</span>
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Direct Dispatch</span>
          </button>
        </div>
      </div>

      {/* 3. Outflow History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredOutflows.length > 0 &&
                      filteredOutflows.every((i) => selectedIds.includes(i.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Dispatch Slip #</th>
                <th className="py-3 px-3">Recipient / Entity</th>
                <th className="py-3 px-3">Uniform Item Details</th>
                <th className="py-3 px-3 text-center">Size</th>
                <th className="py-3 px-3 text-center">Outward Units</th>
                <th className="py-3 px-3">Reason / Purpose</th>
                <th className="py-3 px-3 text-center">Live Stock Impact</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOutflows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No outflow dispatch records found.
                  </td>
                </tr>
              ) : (
                filteredOutflows.map((out) => {
                  const isSelected = selectedIds.includes(out.id);
                  return (
                    <tr
                      key={out.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(out.id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {out.date}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-orange-700">
                        {out.referenceSlipNo}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{out.recipient}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{out.itemName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {out.itemCode} • {out.category}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                          {out.size}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-rose-600 font-mono text-sm">
                        -{out.units}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{out.reason}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Deducted from Stock
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteOutflows([out.id])}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          title="Move to Recycle Bin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Record Direct Dispatch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-sm">Record Outward Stock Dispatch</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Select SKU from Inventory */}
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl">
                <label className="block font-bold text-orange-950 mb-1">
                  Pick Item to Dispatch (Shows Live Available Stock):
                </label>
                <select
                  value={newOutflow.itemCode}
                  onChange={(e) => handleInventoryPick(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white text-slate-800 font-medium"
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.code}>
                      {inv.code} - {inv.name} (Size: {inv.size}) • Available: {inv.availableUnits} units
                    </option>
                  ))}
                </select>
                {pickedInventoryItem && (
                  <div className="mt-2 text-xs flex items-center justify-between">
                    <span className="text-slate-600">Current Available in Store:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {pickedInventoryItem.availableUnits} units
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dispatch Date</label>
                  <input
                    type="date"
                    value={newOutflow.date}
                    onChange={(e) => setNewOutflow({ ...newOutflow, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reference Slip #
                  </label>
                  <input
                    type="text"
                    value={newOutflow.referenceSlipNo}
                    onChange={(e) =>
                      setNewOutflow({ ...newOutflow, referenceSlipNo: e.target.value })
                    }
                    placeholder="e.g. DISP-2026-08"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recipient Branch / Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOutflow.recipient}
                  onChange={(e) => setNewOutflow({ ...newOutflow, recipient: e.target.value })}
                  placeholder="e.g. NEPS West Campus, Sports Department, Teacher Council"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Outward Units <span className="text-rose-500">* (-Stock)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={pickedInventoryItem?.availableUnits || 999}
                    value={newOutflow.units}
                    onChange={(e) =>
                      setNewOutflow({ ...newOutflow, units: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dispatch Reason</label>
                  <select
                    value={newOutflow.reason}
                    onChange={(e) => setNewOutflow({ ...newOutflow, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newOutflow.recipient.trim() || newOutflow.units <= 0) {
                      addToast('Recipient and valid units are required', 'warning');
                      return;
                    }
                    const ok = addOutflow(newOutflow);
                    if (ok) {
                      setShowAddModal(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold cursor-pointer"
                >
                  Dispatch & Deduct from Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Bulk Outflow Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Bulk Outflow Excel/CSV Import</h3>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportRows([]);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-orange-900">Download Outflow Template:</div>
                  <div className="text-[11px] text-orange-800">
                    Columns: Date, Recipient Name, Reference Slip No, Item Code, Outward Units, Reason.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadOutflowTemplate}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold whitespace-nowrap shadow-xs cursor-pointer"
                >
                  Get Template
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-xl p-6 text-center bg-slate-50 hover:bg-orange-50/30 transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-slate-700">
                  {importFileName ? importFileName : 'Click to select Outflow Excel / CSV'}
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>

              {importRows.length > 0 && (
                <div className="text-orange-800 font-semibold bg-orange-50 p-2.5 rounded-xl border border-orange-200">
                  ✓ {importRows.length} outflow dispatch rows ready. Units will be deducted from live stock.
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importRows.length === 0}
                  onClick={commitImport}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-semibold cursor-pointer"
                >
                  Dispatch & Deduct Stock ({importRows.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Section-Specific Recycle Bin Modal */}
      <SectionRecycleBinModal
        module="Outflow"
        isOpen={showSectionRecycleBin}
        onClose={() => setShowSectionRecycleBin(false)}
      />
    </div>
  );
};
