import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { DeadStockRecord, DeadStockStatus } from '../../types';
import { exportToExcel } from '../../utils/excelUtils';
import { SectionRecycleBinModal } from '../common/SectionRecycleBinModal';
import {
  AlertOctagon,
  Plus,
  Search,
  Download,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  RotateCcw,
  XCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const DeadStockView: React.FC = () => {
  const {
    deadStock,
    addDeadStock,
    updateDeadStockStatus,
    deleteDeadStocks,
    recycleBin,
    inventory,
    categories,
    addToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSectionRecycleBin, setShowSectionRecycleBin] = useState(false);

  const deadStockRecycleCount = recycleBin.filter((i) => i.originModule === 'Dead Stock').length;

  // Add Dead Stock Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [deductFromActive, setDeductFromActive] = useState(true);
  const [newDeadStock, setNewDeadStock] = useState({
    date: new Date().toISOString().split('T')[0],
    itemCode: inventory[0]?.code || 'NEPS-PNT-28',
    itemName: inventory[0]?.name || 'Navy Blue Formal Pant',
    category: inventory[0]?.category || 'Full Pant',
    size: inventory[0]?.size || '28',
    defectReason: 'Torn seam at waistband & missing button',
    units: 1,
    mrp: inventory[0]?.mrp || 650,
    status: 'Pending Replacement' as DeadStockStatus,
    vendorName: 'Apex Uniform Manufacturers Pvt Ltd',
  });

  const STATUS_LIST: DeadStockStatus[] = [
    'Damaged',
    'Pending Replacement',
    'Replaced by Vendor',
    'Written Off',
  ];

  const filteredDeadStock = useMemo(() => {
    return deadStock.filter((ds) => {
      const matchStatus = statusFilter === 'All' || ds.status === statusFilter;
      const matchSearch =
        ds.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ds.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ds.defectReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ds.vendorName && ds.vendorName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [deadStock, statusFilter, searchQuery]);

  // KPIs
  const totalDeadUnits = useMemo(
    () => deadStock.reduce((s, d) => s + d.units, 0),
    [deadStock]
  );
  const totalEstimatedLoss = useMemo(
    () => deadStock.reduce((s, d) => s + d.estimatedLoss, 0),
    [deadStock]
  );
  const pendingReplacementsCount = useMemo(
    () => deadStock.filter((d) => d.status === 'Pending Replacement').length,
    [deadStock]
  );
  const replacedByVendorCount = useMemo(
    () => deadStock.filter((d) => d.status === 'Replaced by Vendor').length,
    [deadStock]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredDeadStock.map((d) => d.id));
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
    deleteDeadStocks(selectedIds);
    setSelectedIds([]);
  };

  const handleExport = () => {
    const data = filteredDeadStock.map((d) => ({
      Date: d.date,
      'Item Code': d.itemCode,
      'Item Name': d.itemName,
      Category: d.category,
      Size: d.size,
      'Defect Reason': d.defectReason,
      'Dead Units': d.units,
      'MRP (₹)': d.mrp,
      'Estimated Loss (₹)': d.estimatedLoss,
      Status: d.status,
      'Vendor / Supplier': d.vendorName || 'N/A',
      'Replacement Date': d.replacementDate || 'N/A',
    }));
    exportToExcel(data, `NEPS_Dead_Stock_Ledger_${new Date().toISOString().split('T')[0]}`);
    addToast('Dead stock ledger exported to Excel', 'success');
  };

  const handleInventoryPick = (code: string) => {
    const found = inventory.find((i) => i.code === code);
    if (found) {
      setNewDeadStock({
        ...newDeadStock,
        itemCode: found.code,
        itemName: found.name,
        category: found.category,
        size: found.size,
        mrp: found.mrp,
      });
    }
  };

  const getStatusBadge = (status: DeadStockStatus) => {
    switch (status) {
      case 'Replaced by Vendor':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Pending Replacement':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Damaged':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Written Off':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Dead Stock KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Defective Units</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
              {totalDeadUnits} <span className="text-xs text-slate-400 font-normal">units</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <span className="font-bold text-lg">₹</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Estimated Loss Value</div>
            <div className="text-2xl font-bold text-rose-700 font-mono mt-0.5">
              ₹{totalEstimatedLoss.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Pending Vendor Claims</div>
            <div className="text-2xl font-bold text-amber-700 font-mono mt-0.5">
              {pendingReplacementsCount}{' '}
              <span className="text-xs text-slate-400 font-normal">claims</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Replaced by Vendors</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono mt-0.5">
              {replacedByVendorCount}{' '}
              <span className="text-xs text-slate-400 font-normal">batches</span>
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
              placeholder="Search by SKU code, uniform name, defect, or vendor..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="All">All Statuses ({deadStock.length})</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
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
            title="Open Dead Stock Recycle Bin"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Recycle Bin ({deadStockRecycleCount})</span>
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
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Defective / Dead Stock</span>
          </button>
        </div>
      </div>

      {/* 3. Dead Stock Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredDeadStock.length > 0 &&
                      filteredDeadStock.every((i) => selectedIds.includes(i.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Item Details</th>
                <th className="py-3 px-3 text-center">Size</th>
                <th className="py-3 px-3">Defect Reason & Note</th>
                <th className="py-3 px-3 text-center">Dead Units</th>
                <th className="py-3 px-3 text-right">Unit MRP</th>
                <th className="py-3 px-3 text-right">Est. Loss Value</th>
                <th className="py-3 px-3 text-center">Replacement Status & Action</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeadStock.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No dead stock or defective items found.
                  </td>
                </tr>
              ) : (
                filteredDeadStock.map((ds) => {
                  const isSelected = selectedIds.includes(ds.id);
                  return (
                    <tr
                      key={ds.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(ds.id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {ds.date}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{ds.itemName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {ds.itemCode} • {ds.category}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                          {ds.size}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="text-slate-800 font-medium">{ds.defectReason}</div>
                        {ds.vendorName && (
                          <div className="text-[10px] text-slate-400">
                            Vendor: <strong className="text-slate-600">{ds.vendorName}</strong>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-rose-700 font-mono text-sm">
                        {ds.units}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        ₹{ds.mrp.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                        ₹{ds.estimatedLoss.toLocaleString('en-IN')}
                      </td>

                      {/* Status Dropdown with Automatic Stock Re-credit */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={ds.status}
                          onChange={(e) =>
                            updateDeadStockStatus(ds.id, e.target.value as DeadStockStatus)
                          }
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border focus:outline-none cursor-pointer transition-colors ${getStatusBadge(
                            ds.status
                          )}`}
                        >
                          {STATUS_LIST.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {ds.status === 'Replaced by Vendor' && (
                          <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                            ✓ Units credited to Live Stock
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteDeadStocks([ds.id])}
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

      {/* 4. Log Dead Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Log Damaged or Defective Uniform</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Pick Item from Inventory */}
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                <label className="block font-bold text-rose-950 mb-1">
                  Pick Uniform SKU from Inventory:
                </label>
                <select
                  value={newDeadStock.itemCode}
                  onChange={(e) => handleInventoryPick(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white text-slate-800 font-medium"
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.code}>
                      {inv.code} - {inv.name} ({inv.size}) • Live Stock: {inv.availableUnits}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Logged</label>
                  <input
                    type="date"
                    value={newDeadStock.date}
                    onChange={(e) => setNewDeadStock({ ...newDeadStock, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor / Factory</label>
                  <input
                    type="text"
                    value={newDeadStock.vendorName}
                    onChange={(e) =>
                      setNewDeadStock({ ...newDeadStock, vendorName: e.target.value })
                    }
                    placeholder="e.g. Apex Uniform Manufacturers"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Defect Description & Inspection Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={newDeadStock.defectReason}
                  onChange={(e) =>
                    setNewDeadStock({ ...newDeadStock, defectReason: e.target.value })
                  }
                  placeholder="e.g. Broken zipper teeth, fabric dye discoloration, uneven seam"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dead Units <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newDeadStock.units}
                    onChange={(e) =>
                      setNewDeadStock({
                        ...newDeadStock,
                        units: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newDeadStock.mrp}
                    onChange={(e) =>
                      setNewDeadStock({ ...newDeadStock, mrp: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={newDeadStock.status}
                    onChange={(e) =>
                      setNewDeadStock({
                        ...newDeadStock,
                        status: e.target.value as DeadStockStatus,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-medium"
                  >
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deduct from Live Stock Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="deductActive"
                  checked={deductFromActive}
                  onChange={(e) => setDeductFromActive(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="deductActive" className="text-xs text-slate-700 select-none cursor-pointer">
                  Automatically deduct these defective units from current Live Stock
                </label>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600">Calculated Loss Value:</span>
                <span className="font-mono font-bold text-rose-700 text-sm">
                  ₹{(newDeadStock.units * newDeadStock.mrp).toLocaleString('en-IN')}
                </span>
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
                    if (!newDeadStock.defectReason.trim() || newDeadStock.units <= 0) {
                      addToast('Defect reason and valid units are required', 'warning');
                      return;
                    }
                    addDeadStock(
                      {
                        ...newDeadStock,
                        estimatedLoss: newDeadStock.units * newDeadStock.mrp,
                      },
                      deductFromActive
                    );
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                >
                  Log Dead Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Section-Specific Recycle Bin Modal */}
      <SectionRecycleBinModal
        module="Dead Stock"
        isOpen={showSectionRecycleBin}
        onClose={() => setShowSectionRecycleBin(false)}
      />
    </div>
  );
};
