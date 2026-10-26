import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { StockInflowRecord } from '../../types';
import {
  exportToExcel,
  parseExcelFile,
  downloadInflowTemplate,
} from '../../utils/excelUtils';
import { SectionRecycleBinModal } from '../common/SectionRecycleBinModal';
import {
  ArrowDownToLine,
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  Calendar,
  Building2,
  FileSpreadsheet,
  X,
  Layers,
  Sparkles,
  Boxes,
} from 'lucide-react';

export const StockInflowView: React.FC = () => {
  const {
    inflows,
    addInflow,
    deleteInflows,
    bulkImportInflows,
    recycleBin,
    categories,
    inventory,
    addToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSectionRecycleBin, setShowSectionRecycleBin] = useState(false);

  // Add Inflow Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInflow, setNewInflow] = useState({
    date: new Date().toISOString().split('T')[0],
    vendorName: 'Apex Uniform Manufacturers Pvt Ltd',
    category: categories[0]?.name || 'Full Pant',
    itemName: 'Navy Blue Formal Pant',
    itemCode: 'NEPS-PNT-28',
    size: '28',
    units: 50,
    mrp: 650,
  });

  // Bulk Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, any>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inflowRecycleCount = recycleBin.filter((i) => i.originModule === 'Inflow').length;

  // Distinct vendors
  const vendors = useMemo(() => {
    const set = new Set<string>();
    inflows.forEach((inf) => set.add(inf.vendorName));
    return Array.from(set);
  }, [inflows]);

  // Filtered inflows (removed invoiceNo search)
  const filteredInflows = useMemo(() => {
    return inflows.filter((inf) => {
      const matchVendor = vendorFilter === 'All' || inf.vendorName === vendorFilter;
      const matchSearch =
        inf.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchVendor && matchSearch;
    });
  }, [inflows, vendorFilter, searchQuery]);

  // Totals
  const totalInwardUnits = useMemo(
    () => inflows.reduce((s, i) => s + i.units, 0),
    [inflows]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredInflows.map((i) => i.id));
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

  // Immediate delete without window.confirm blocking
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    deleteInflows(selectedIds);
    setSelectedIds([]);
  };

  const handleExport = () => {
    const data = filteredInflows.map((i) => ({
      Date: i.date,
      'Vendor Name': i.vendorName,
      'Item Code': i.itemCode,
      'Item Name': i.itemName,
      Category: i.category,
      Size: i.size,
      'Inward Units': i.units,
      'MRP (₹)': i.mrp || 0,
    }));
    exportToExcel(data, `NEPS_Stock_Inflows_${new Date().toISOString().split('T')[0]}`);
    addToast('Inflow batches exported to Excel', 'success');
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
    const count = bulkImportInflows(importRows);
    addToast(`Successfully imported ${count} inflow batches and incremented live stock!`, 'success');
    setShowImportModal(false);
    setImportRows([]);
    setImportFileName('');
  };

  const handleInventoryItemSelected = (code: string) => {
    const found = inventory.find((i) => i.code === code);
    if (found) {
      setNewInflow({
        ...newInflow,
        itemCode: found.code,
        itemName: found.name,
        category: found.category,
        size: found.size,
        mrp: found.mrp,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Inflow KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ArrowDownToLine className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Inward Batches</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
              {inflows.length} <span className="text-xs text-slate-400 font-normal">batches</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="font-bold text-lg">📦</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Inward Units Received</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
              {totalInwardUnits.toLocaleString('en-IN')}{' '}
              <span className="text-xs text-slate-400 font-normal">units</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Supplying Vendors</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
              {vendors.length} <span className="text-xs text-slate-400 font-normal">manufacturers</span>
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
              placeholder="Search by vendor, item code, or uniform name..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="All">All Vendors ({vendors.length})</option>
            {vendors.map((v) => (
              <option key={v} value={v}>
                {v}
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
            title="Open Stock Inflow Recycle Bin"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Recycle Bin ({inflowRecycleCount})</span>
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
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Inflow Batch</span>
          </button>
        </div>
      </div>

      {/* 3. Inflow History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredInflows.length > 0 &&
                      filteredInflows.every((i) => selectedIds.includes(i.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Vendor / Manufacturer</th>
                <th className="py-3 px-3">Item Details</th>
                <th className="py-3 px-3 text-center">Size</th>
                <th className="py-3 px-3 text-center">Inward Units</th>
                <th className="py-3 px-3 text-center">Live Stock Impact</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInflows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No inflow batches found.
                  </td>
                </tr>
              ) : (
                filteredInflows.map((inf) => {
                  const isSelected = selectedIds.includes(inf.id);
                  return (
                    <tr
                      key={inf.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(inf.id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {inf.date}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {inf.vendorName}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{inf.itemName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inf.itemCode} • {inf.category}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                          {inf.size}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700 font-mono text-sm">
                        +{inf.units}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Credited to Stock
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteInflows([inf.id])}
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

      {/* 4. Add Inflow Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Record Inward Stock Batch</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Pick Existing Catalog SKU */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <label className="block font-bold text-blue-900 mb-1">
                  Pick Existing Catalog SKU:
                </label>
                <select
                  onChange={(e) => handleInventoryItemSelected(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white text-slate-800 font-medium"
                >
                  <option value="">-- Choose Existing Uniform SKU --</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.code}>
                      {inv.code} - {inv.name} (Size: {inv.size}) - Live Stock: {inv.availableUnits}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inward Date</label>
                  <input
                    type="date"
                    value={newInflow.date}
                    onChange={(e) => setNewInflow({ ...newInflow, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vendor / Manufacturer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newInflow.vendorName}
                    onChange={(e) => setNewInflow({ ...newInflow, vendorName: e.target.value })}
                    placeholder="e.g. Arvind Textiles, Apex Uniforms"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Uniform Item Name</label>
                  <input
                    type="text"
                    value={newInflow.itemName}
                    onChange={(e) => setNewInflow({ ...newInflow, itemName: e.target.value })}
                    placeholder="e.g. Navy Blue Formal Pant"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Code (SKU)</label>
                  <input
                    type="text"
                    value={newInflow.itemCode}
                    onChange={(e) =>
                      setNewInflow({ ...newInflow, itemCode: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. NEPS-PNT-28"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-mono uppercase font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newInflow.category}
                    onChange={(e) => setNewInflow({ ...newInflow, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Size / Variant</label>
                  <input
                    type="text"
                    value={newInflow.size}
                    onChange={(e) => setNewInflow({ ...newInflow, size: e.target.value })}
                    placeholder="e.g. 28, M"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Inward Units <span className="text-emerald-600 font-bold">(+Stock)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newInflow.units}
                    onChange={(e) =>
                      setNewInflow({ ...newInflow, units: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-bold text-emerald-700"
                  />
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
                    if (!newInflow.vendorName.trim() || !newInflow.itemCode.trim() || newInflow.units <= 0) {
                      addToast('Please provide vendor, code, and valid inward units', 'warning');
                      return;
                    }
                    addInflow({
                      ...newInflow,
                    });
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Record & Increment Live Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Inflow Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Bulk Inflow Excel/CSV Import</h3>
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
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-900">Download Inflow Template:</div>
                  <div className="text-[11px] text-blue-700">Columns: Date, Vendor Name, Item Code, Size, Inward Units.</div>
                </div>
                <button
                  type="button"
                  onClick={downloadInflowTemplate}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap shadow-xs cursor-pointer"
                >
                  Get Template
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-slate-700">
                  {importFileName ? importFileName : 'Click to select Inflow Excel / CSV'}
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
                <div className="text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  ✓ {importRows.length} inflow rows ready for import. Live Stock will automatically increment.
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold cursor-pointer"
                >
                  Import & Increment Stock ({importRows.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section-Specific Recycle Bin Modal */}
      <SectionRecycleBinModal
        module="Inflow"
        isOpen={showSectionRecycleBin}
        onClose={() => setShowSectionRecycleBin(false)}
      />
    </div>
  );
};
