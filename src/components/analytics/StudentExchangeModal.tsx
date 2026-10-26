import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ItemVariant, PaymentMode, StudentSaleRecord } from '../../types';
import {
  ArrowLeftRight,
  RotateCcw,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  X,
  User,
  GraduationCap,
  Package,
  Layers,
  Info,
  Clock,
  Check,
} from 'lucide-react';

interface StudentExchangeModalProps {
  sale: StudentSaleRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentExchangeModal: React.FC<StudentExchangeModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  const { inventory, categories, processExchange, processRefund, addToast } = useStore();

  const [activeTab, setActiveTab] = useState<'exchange' | 'refund'>('exchange');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  // Exchange state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [replacementVariantId, setReplacementVariantId] = useState<string>('');
  const [exchangeReason, setExchangeReason] = useState<string>('Size fit issue / Size change');

  // Refund state
  const [refundPaymentMode, setRefundPaymentMode] = useState<PaymentMode>('Cash');
  const [refundReason, setRefundReason] = useState<string>('Item returned by student / Not needed');

  // Sync state when sale opens or changes
  useEffect(() => {
    if (sale && sale.items.length > 0) {
      setSelectedItemIndex(0);
      setQuantity(1);
      const firstItem = sale.items[0];
      setSelectedCategory(firstItem.category);
      setRefundPaymentMode(sale.paymentMode || 'Cash');
    }
  }, [sale]);

  // Selected item from sale
  const originalItem = sale && sale.items[selectedItemIndex] ? sale.items[selectedItemIndex] : null;

  // Whenever original item changes, clamp quantity and adjust default category
  useEffect(() => {
    if (originalItem) {
      setQuantity(1);
      setSelectedCategory(originalItem.category);
      setReplacementVariantId('');
    }
  }, [selectedItemIndex, originalItem]);

  // Filter available replacement inventory
  const filteredReplacementItems = useMemo(() => {
    if (!selectedCategory) return inventory;
    return inventory.filter((i) => i.category === selectedCategory);
  }, [inventory, selectedCategory]);

  // Selected replacement variant
  const replacementVariant = useMemo(() => {
    return inventory.find((i) => i.id === replacementVariantId) || null;
  }, [inventory, replacementVariantId]);

  // Price calculations for exchange
  const priceDiffPerUnit = replacementVariant && originalItem ? replacementVariant.mrp - originalItem.mrp : 0;
  const totalPriceDiff = priceDiffPerUnit * quantity;

  // Refund calculations
  const discountRatio = useMemo(() => {
    if (!sale || sale.grossTotal <= 0) return 1;
    return (sale.grossTotal - sale.discountAmount) / sale.grossTotal;
  }, [sale]);

  const baseRefundAmount = originalItem ? originalItem.mrp * quantity : 0;
  const netRefundAmount = Math.round(baseRefundAmount * discountRatio * 100) / 100;

  if (!isOpen || !sale) return null;

  // Handle Exchange submission
  const handleConfirmExchange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalItem) return;

    if (!replacementVariant) {
      addToast('Please select a replacement uniform item and size variant.', 'warning');
      return;
    }

    if (replacementVariant.availableUnits < quantity) {
      addToast(
        `Insufficient stock! Only ${replacementVariant.availableUnits} unit(s) available for ${replacementVariant.name} (${replacementVariant.size}).`,
        'error',
        'Stock Unavailable'
      );
      return;
    }

    const success = processExchange(sale.id, {
      originalItemIndex: selectedItemIndex,
      originalVariantId: originalItem.itemVariantId,
      quantity,
      replacementVariant,
      reason: exchangeReason.trim() || 'Size/Item Exchange',
    });

    if (success) {
      onClose();
    }
  };

  // Handle Refund submission
  const handleConfirmRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalItem) return;

    const success = processRefund(sale.id, {
      originalItemIndex: selectedItemIndex,
      originalVariantId: originalItem.itemVariantId,
      quantity,
      refundPaymentMode,
      reason: refundReason.trim() || 'Uniform return & refund',
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <ArrowLeftRight className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Uniform Exchange & Refund Desk</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  NEPS
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Size swap, item replacement, or item return with instant cash refund & stock sync.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student & Invoice Info Card */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                {sale.studentName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Class / Grade</span>
              <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {sale.studentClass}
              </span>
            </div>
            {sale.rollNoAdmission && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Adm / Roll</span>
                <span className="font-mono text-slate-700">{sale.rollNoAdmission}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice #</span>
              <span className="font-mono font-bold text-blue-700">{sale.invoiceNo}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Bill Date</span>
              <span className="font-mono text-slate-600">{sale.date}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {sale.items.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              All items in this invoice have been refunded or exchanged.
            </div>
          ) : (
            <>
              {/* Step 1: Select Purchased Item to Exchange/Return */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  1. Select Purchased Item to Exchange or Return
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sale.items.map((item, idx) => {
                    const isSelected = selectedItemIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedItemIndex(idx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex items-start justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Code: {item.code} • Size:{' '}
                            <span className="font-bold text-slate-800 bg-slate-100 px-1 py-0.2 rounded">
                              {item.size}
                            </span>
                          </div>
                          <div className="text-[11px] text-blue-700 font-semibold mt-1">
                            MRP: ₹{item.mrp.toFixed(2)} each
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                            Qty: {item.quantity}
                          </span>
                          <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                            ₹{item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity selector for return/exchange */}
              {originalItem && (
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-800 block">Quantity to Return/Exchange:</span>
                    <span className="text-[11px] text-slate-500">
                      Total purchased in this bill: {originalItem.quantity} unit(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-sm font-mono text-slate-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= originalItem.quantity}
                      onClick={() => setQuantity((q) => Math.min(originalItem.quantity, q + 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Choose Mode - Exchange (Replace Size/Item) OR Return & Money Refund */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  2. Choose Action
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('exchange')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      activeTab === 'exchange'
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        activeTab === 'exchange' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Exchange / Replace</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Change size (e.g. 30 ➔ 32) or swap with another uniform item.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('refund')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      activeTab === 'refund'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        activeTab === 'refund' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Return & Money Refund</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Restock the uniform & return money back to student.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mode 1: EXCHANGE CONTENT */}
              {activeTab === 'exchange' && originalItem && (
                <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Select Replacement Uniform from Live Stock</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          setReplacementVariantId('');
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Replacement Item Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Replacement Size / Item Variant
                      </label>
                      <select
                        value={replacementVariantId}
                        onChange={(e) => setReplacementVariantId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">-- Choose replacement size/item --</option>
                        {filteredReplacementItems.map((variant) => (
                          <option
                            key={variant.id}
                            value={variant.id}
                            disabled={variant.availableUnits < quantity}
                          >
                            {variant.name} (Size: {variant.size}) — MRP: ₹{variant.mrp} [Stock: {variant.availableUnits}]
                            {variant.availableUnits < quantity ? ' - OUT OF STOCK' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Live Stock & Price HUD */}
                  {replacementVariant && (
                    <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Available Stock for Replacement:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            replacementVariant.availableUnits >= quantity
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {replacementVariant.availableUnits} units available in store
                        </span>
                      </div>

                      {/* Price Difference Breakdown */}
                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500">Original Rate: </span>
                          <span className="font-mono font-semibold text-slate-700">₹{originalItem.mrp}</span>
                          <span className="text-slate-400 mx-1.5">➔</span>
                          <span className="text-slate-500">Replacement Rate: </span>
                          <span className="font-mono font-semibold text-slate-700">₹{replacementVariant.mrp}</span>
                        </div>
                        <div className="text-right">
                          {totalPriceDiff > 0 ? (
                            <div className="text-rose-700 font-bold">
                              Collect Extra: +₹{totalPriceDiff.toFixed(2)}
                            </div>
                          ) : totalPriceDiff < 0 ? (
                            <div className="text-emerald-700 font-bold">
                              Refund Difference: ₹{Math.abs(totalPriceDiff).toFixed(2)}
                            </div>
                          ) : (
                            <div className="text-slate-700 font-bold">Even Exchange (₹0 Diff)</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reason for exchange */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Reason for Exchange / Size Change
                    </label>
                    <input
                      type="text"
                      value={exchangeReason}
                      onChange={(e) => setExchangeReason(e.target.value)}
                      placeholder="e.g., Size too tight, requested one size larger..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Exchange Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!replacementVariant || replacementVariant.availableUnits < quantity}
                      onClick={handleConfirmExchange}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        Confirm Exchange ({originalItem.name} {originalItem.size} ➔ {replacementVariant ? `${replacementVariant.name} ${replacementVariant.size}` : '...'})
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 2: RETURN & REFUND CONTENT */}
              {activeTab === 'refund' && originalItem && (
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <RotateCcw className="w-4 h-4 text-emerald-700" />
                    <span>Return Uniform to Store & Refund Money</span>
                  </div>

                  {/* Refund calculation breakdown */}
                  <div className="bg-white p-4 rounded-xl border border-emerald-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Item MRP ({quantity} unit(s) @ ₹{originalItem.mrp}):</span>
                      <span className="font-mono font-semibold text-slate-800">₹{baseRefundAmount.toFixed(2)}</span>
                    </div>

                    {discountRatio < 1 && (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Sale Discount Proportion applied:</span>
                        <span className="font-mono text-emerald-700 font-semibold">
                          {((1 - discountRatio) * 100).toFixed(1)}% discount factored
                        </span>
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 uppercase">Total Cash/Money to Refund:</span>
                        <div className="text-[11px] text-slate-400">
                          Units will be credited immediately back into Live Stock.
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold font-mono text-emerald-700">
                          ₹{netRefundAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Select Refund Payment Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Refund Payment Mode
                      </label>
                      <select
                        value={refundPaymentMode}
                        onChange={(e) => setRefundPaymentMode(e.target.value as PaymentMode)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="Cash">Cash (Immediate Handover)</option>
                        <option value="UPI">UPI Refund</option>
                        <option value="Card">Card Reversal</option>
                        <option value="Net Banking">Net Banking</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Reason for Return
                      </label>
                      <input
                        type="text"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="e.g. Excess purchase, wrong uniform selected..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Confirm Refund Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmRefund}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>
                        Process Return & Refund ₹{netRefundAmount.toFixed(2)} via {refundPaymentMode}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Past Exchange & Return History Logs for this sale */}
              {sale.exchangeLogs && sale.exchangeLogs.length > 0 && (
                <div className="border-t border-slate-200 pt-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Previous Exchange & Refund History on this Bill</span>
                  </div>

                  <div className="space-y-2">
                    {sale.exchangeLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.type === 'Exchange'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {log.type}
                            </span>
                            <span className="font-mono text-slate-400 text-[11px]">
                              {log.date} at {log.time}
                            </span>
                          </div>

                          <div className="font-semibold text-slate-900 mt-1">
                            {log.type === 'Exchange' ? (
                              <span>
                                {log.quantity}x {log.originalItemName} ({log.originalSize}) ➔{' '}
                                <span className="text-blue-700 font-bold">
                                  {log.replacementItemName} ({log.replacementSize})
                                </span>
                              </span>
                            ) : (
                              <span>
                                Returned {log.quantity}x {log.originalItemName} ({log.originalSize})
                              </span>
                            )}
                          </div>

                          <div className="text-slate-500 text-[11px] mt-0.5">
                            Reason: {log.reason}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {log.type === 'Exchange' ? (
                            <div>
                              <span className="text-[10px] text-slate-400 block">Diff Adjustment</span>
                              <span className="font-mono font-bold text-xs text-slate-800">
                                {log.priceDifference && log.priceDifference > 0
                                  ? `+₹${log.priceDifference.toFixed(2)}`
                                  : log.priceDifference && log.priceDifference < 0
                                  ? `-₹${Math.abs(log.priceDifference).toFixed(2)}`
                                  : '₹0 (Even)'}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-[10px] text-slate-400 block">
                                Refunded ({log.refundPaymentMode})
                              </span>
                              <span className="font-mono font-bold text-xs text-emerald-700">
                                ₹{log.refundAmount?.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Inventory stock counts are adjusted automatically upon confirmation.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel / Close
          </button>
        </div>
      </div>
    </div>
  );
};
