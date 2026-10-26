import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { StudentSaleRecord } from '../../types';
import { exportToExcel } from '../../utils/excelUtils';
import { InvoiceReceiptModal } from '../pos/InvoiceReceiptModal';
import { SectionRecycleBinModal } from '../common/SectionRecycleBinModal';
import { StudentExchangeModal } from './StudentExchangeModal';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Download,
  Trash2,
  Calendar,
  Search,
  Printer,
  Boxes,
  Percent,
  AlertOctagon,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  GraduationCap,
  ArrowLeftRight,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const {
    activeDivision,
    sales,
    deleteSales,
    inventory,
    deadStock,
    recycleBin,
    activeInvoice,
    setActiveInvoice,
    addToast,
  } = useStore();

  const [showSectionRecycleBin, setShowSectionRecycleBin] = useState(false);
  const [exchangeModalSale, setExchangeModalSale] = useState<StudentSaleRecord | null>(null);
  const salesRecycleCount = recycleBin.filter((i) => i.originModule === 'Sales').length;

  // Date Filter preset: 'today' | 'yesterday' | '7days' | 'month' | 'all' | 'custom'
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Table search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Calculate Date Thresholds
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(now.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split('T')[0];

  const monthAgoDate = new Date();
  monthAgoDate.setMonth(now.getMonth() - 1);
  const monthAgoStr = monthAgoDate.toISOString().split('T')[0];

  // Filtered sales based on date range
  const dateFilteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = sale.date;
      if (datePreset === 'today') {
        return saleDate === todayStr;
      }
      if (datePreset === 'yesterday') {
        return saleDate === yesterdayStr;
      }
      if (datePreset === '7days') {
        return saleDate >= sevenDaysAgoStr && saleDate <= todayStr;
      }
      if (datePreset === 'month') {
        return saleDate >= monthAgoStr && saleDate <= todayStr;
      }
      if (datePreset === 'custom') {
        if (customStartDate && saleDate < customStartDate) return false;
        if (customEndDate && saleDate > customEndDate) return false;
        return true;
      }
      return true; // 'all'
    });
  }, [sales, datePreset, todayStr, yesterdayStr, sevenDaysAgoStr, monthAgoStr, customStartDate, customEndDate]);

  // Metric KPI Computations
  const totalStockUnits = useMemo(
    () => inventory.reduce((sum, item) => sum + item.availableUnits, 0),
    [inventory]
  );
  const totalInventoryValue = useMemo(
    () => inventory.reduce((sum, item) => sum + item.availableUnits * item.mrp, 0),
    [inventory]
  );
  const totalRevenue = useMemo(
    () => dateFilteredSales.reduce((sum, s) => sum + s.netAmount, 0),
    [dateFilteredSales]
  );
  const totalDiscountsGiven = useMemo(
    () => dateFilteredSales.reduce((sum, s) => sum + s.discountAmount, 0),
    [dateFilteredSales]
  );
  const totalDeadStockLoss = useMemo(
    () => deadStock.reduce((sum, d) => sum + d.estimatedLoss, 0),
    [deadStock]
  );
  const lowStockCount = useMemo(
    () => inventory.filter((i) => i.availableUnits <= (i.minStockAlert ?? 5)).length,
    [inventory]
  );

  // Table Search and Payment Filter
  const tableFilteredSales = useMemo(() => {
    return dateFilteredSales.filter((sale) => {
      const matchPayment = paymentFilter === 'All' || sale.paymentMode === paymentFilter;
      const matchSearch =
        sale.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.studentClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.rollNoAdmission.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchPayment && matchSearch;
    });
  }, [dateFilteredSales, paymentFilter, searchQuery]);

  // Payment Breakdown Summary
  const paymentBreakdown = useMemo(() => {
    const summary: Record<string, { count: number; total: number }> = {
      UPI: { count: 0, total: 0 },
      Cash: { count: 0, total: 0 },
      Card: { count: 0, total: 0 },
      'Net Banking': { count: 0, total: 0 },
    };
    dateFilteredSales.forEach((s) => {
      if (summary[s.paymentMode]) {
        summary[s.paymentMode].count += 1;
        summary[s.paymentMode].total += s.netAmount;
      }
    });
    return summary;
  }, [dateFilteredSales]);

  // Category sales breakdown
  const categorySalesBreakdown = useMemo(() => {
    const counts: Record<string, { units: number; amount: number }> = {};
    dateFilteredSales.forEach((s) => {
      s.items.forEach((item) => {
        if (!counts[item.category]) {
          counts[item.category] = { units: 0, amount: 0 };
        }
        counts[item.category].units += item.quantity;
        counts[item.category].amount += item.subtotal;
      });
    });
    return counts;
  }, [dateFilteredSales]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(tableFilteredSales.map((s) => s.id));
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
    deleteSales(selectedIds);
    setSelectedIds([]);
  };

  const handleExportSales = () => {
    const data = tableFilteredSales.map((s) => ({
      'Invoice No': s.invoiceNo,
      Date: s.date,
      Time: s.time,
      'Student Name': s.studentName,
      'Class / Grade': s.studentClass,
      'Roll / Adm ID': s.rollNoAdmission,
      'Parent Contact': s.contactNo,
      'Items Purchased': s.items.map((i) => `${i.name} (${i.size}) x${i.quantity}`).join('; '),
      'Gross Total (₹)': s.grossTotal,
      'Discount (₹)': s.discountAmount,
      'Net Paid (₹)': s.netAmount,
      'Payment Mode': s.paymentMode,
      Cashier: s.cashierName,
    }));
    exportToExcel(data, `NEPS_Sales_History_${new Date().toISOString().split('T')[0]}`);
    addToast('Exported sales history to Excel', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Date Range Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700">Analytics Period:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map((preset) => {
            const isSelected = datePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setDatePreset(preset.id as any)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {datePreset === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            />
          </div>
        )}
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Live Stock Units */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Stock in Hand</span>
            <Boxes className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalStockUnits.toLocaleString('en-IN')}{' '}
            <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all categories</div>
        </div>

        {/* KPI 2: Live Inventory Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Inventory Value</span>
            <span className="text-sm font-bold text-emerald-600">₹</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ₹{totalInventoryValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Calculated at Retail MRP</div>
        </div>

        {/* KPI 3: Total Revenue Generated */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs bg-gradient-to-br from-white to-blue-50/50">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-blue-900">Total Net Revenue</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            {dateFilteredSales.length} student sales recorded
          </div>
        </div>

        {/* KPI 4: Total Discounts Given */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Discounts</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            ₹{totalDiscountsGiven.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Special & sibling concessions</div>
        </div>

        {/* KPI 5: Total Dead Stock Loss */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Dead Stock Value</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono">
            ₹{totalDeadStockLoss.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {activeDivision === 'books' ? 'Defective, misprinted & damaged books' : 'Defective & damaged uniforms'}
          </div>
        </div>
      </div>

      {/* 3. Visual Charts & Summaries (Category & Payment breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Breakdown Cards */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
            <span>Payment Modes Distribution</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </h4>
          <div className="space-y-3">
            {Object.entries(paymentBreakdown).map(([mode, data]) => {
              const pct = totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0;
              return (
                <div key={mode} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      {mode === 'UPI' && <Smartphone className="w-3.5 h-3.5 text-blue-600" />}
                      {mode === 'Cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                      {mode === 'Card' && <CreditCard className="w-3.5 h-3.5 text-indigo-600" />}
                      {mode} ({data.count} bills)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{data.total.toLocaleString('en-IN')} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        mode === 'UPI'
                          ? 'bg-blue-600'
                          : mode === 'Cash'
                          ? 'bg-emerald-500'
                          : mode === 'Card'
                          ? 'bg-indigo-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Demand Bar Rollup */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
            <span>
              {activeDivision === 'books'
                ? 'Sales & Demand by Book/Stationery Category'
                : 'Sales & Demand by Uniform Category'}
            </span>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
            {Object.keys(categorySalesBreakdown).length === 0 ? (
              <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                No category sales recorded in this period.
              </div>
            ) : (
              Object.entries(categorySalesBreakdown).map(([catName, data]) => (
                <div
                  key={catName}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-800">{catName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Units Sold: <strong className="text-slate-800 font-mono">{data.units}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-blue-700">
                      ₹{data.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Sales & Student Purchase History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table header & actions */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-56 flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, invoice #, class, or uniform..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Payment Modes</option>
              <option value="UPI">UPI Only</option>
              <option value="Cash">Cash Only</option>
              <option value="Card">Card Only</option>
              <option value="Net Banking">Net Banking Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}

            {/* Section-level Recycle Bin button right next to Delete Selected */}
            <button
              type="button"
              onClick={() => setShowSectionRecycleBin(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Open Sales History Recycle Bin"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Recycle Bin ({salesRecycleCount})</span>
            </button>

            <button
              onClick={handleExportSales}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sales to Excel</span>
            </button>
          </div>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/60 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      tableFilteredSales.length > 0 &&
                      tableFilteredSales.every((s) => selectedIds.includes(s.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Class / Grade</th>
                <th className="py-3 px-3">Items Purchased</th>
                <th className="py-3 px-3 text-center">Payment Mode</th>
                <th className="py-3 px-3 text-right">Discount</th>
                <th className="py-3 px-3 text-right">Net Amount Paid</th>
                <th className="py-3 px-3 text-right">Receipt & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableFilteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400">
                    No sales records found matching the filters.
                  </td>
                </tr>
              ) : (
                tableFilteredSales.map((sale) => {
                  const isSelected = selectedIds.includes(sale.id);
                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(sale.id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        <div>{sale.invoiceNo}</div>
                        {sale.exchangeLogs && sale.exchangeLogs.length > 0 && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Exchanged / Refunded
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {sale.date} <span className="text-slate-400 text-[10px]">({sale.time})</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{sale.studentName}</div>
                        {sale.rollNoAdmission && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Adm: {sale.rollNoAdmission}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                          {sale.studentClass}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="space-y-0.5">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 truncate">
                              • {item.name} ({item.size}) <span className="font-bold">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {sale.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                        {sale.discountAmount > 0 ? `-₹${sale.discountAmount.toFixed(1)}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{sale.netAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setExchangeModalSale(sale)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
                            title="Exchange uniform size/item or refund money"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Exchange / Refund</span>
                          </button>
                          <button
                            onClick={() => setActiveInvoice(sale)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
                            title="View and reprint tax receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSales([sale.id])}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete to Recycle Bin (Refunds Stock)"
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

      {/* Student Uniform Exchange / Refund Modal */}
      <StudentExchangeModal
        sale={exchangeModalSale}
        isOpen={!!exchangeModalSale}
        onClose={() => setExchangeModalSale(null)}
      />

      {/* Invoice Reprint Modal */}
      <InvoiceReceiptModal
        invoice={activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />

      {/* Section-Specific Recycle Bin Modal */}
      <SectionRecycleBinModal
        module="Sales"
        isOpen={showSectionRecycleBin}
        onClose={() => setShowSectionRecycleBin(false)}
      />
    </div>
  );
};
