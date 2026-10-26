import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { DiscountType, ItemVariant, PaymentMode } from '../../types';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  User,
  GraduationCap,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

import { BooksPOSView } from './BooksPOSView';

const UniformPOSView: React.FC = () => {
  const {
    inventory,
    categories,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    completeCheckout,
    cashierName,
    setCashierName,
    activeInvoice,
    setActiveInvoice,
    addToast,
  } = useStore();

  // Header / Student Inputs
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [rollNoAdmission, setRollNoAdmission] = useState('');
  const [contactNo, setContactNo] = useState('');

  // Item Picker State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);

  // Discount & Payment
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [notes, setNotes] = useState<string>('');

  // Filter items by category & search
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch =
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.size.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  // Distinct item names for the primary item picker
  const uniqueItemNames = useMemo(() => {
    const names = new Set<string>();
    filteredInventory.forEach((item) => names.add(item.name));
    return Array.from(names);
  }, [filteredInventory]);

  // Automatically select the first item if current selection is invalid
  const currentItemName = selectedItemName || uniqueItemNames[0] || '';

  // Variants (sizes) for the selected item name
  const availableVariants = useMemo(() => {
    return inventory.filter((item) => item.name === currentItemName);
  }, [inventory, currentItemName]);

  // Currently selected variant
  const activeVariant: ItemVariant | undefined = useMemo(() => {
    if (selectedVariantId) {
      const found = availableVariants.find((v) => v.id === selectedVariantId);
      if (found) return found;
    }
    return availableVariants[0];
  }, [availableVariants, selectedVariantId]);

  // Cart calculations
  const grossTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, discountValue || 0));
      return (grossTotal * pct) / 100;
    }
    return Math.min(grossTotal, Math.max(0, discountValue || 0));
  }, [grossTotal, discountType, discountValue]);

  const netPayable = Math.max(0, grossTotal - discountAmount);

  // Live stock HUD status
  const getStockStatus = (variant?: ItemVariant) => {
    if (!variant) return null;
    const units = variant.availableUnits;
    if (units <= 0) {
      return {
        label: 'Out of Stock (0 units)',
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        badge: 'bg-rose-500',
        canAdd: false,
      };
    }
    if (units <= (variant.minStockAlert ?? 5)) {
      return {
        label: `Low Stock (${units} units left!)`,
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        badge: 'bg-amber-500',
        canAdd: true,
      };
    }
    return {
      label: `In Stock (${units} units available)`,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badge: 'bg-emerald-500',
      canAdd: true,
    };
  };

  const currentStockStatus = getStockStatus(activeVariant);

  const handleAddItemToCart = () => {
    if (!activeVariant) return;
    if (selectedQty <= 0) {
      addToast('Please enter a quantity greater than zero', 'warning');
      return;
    }
    const success = addToCart(activeVariant, selectedQty);
    if (success) {
      setSelectedQty(1);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      addToast('Student Name is required for billing receipt', 'warning');
      return;
    }
    if (!studentClass.trim()) {
      addToast('Student Class / Grade is required (e.g., Grade 6 - A)', 'warning');
      return;
    }
    if (cart.length === 0) {
      addToast('Cannot checkout with an empty cart!', 'error');
      return;
    }

    const sale = completeCheckout({
      studentName,
      studentClass,
      rollNoAdmission,
      contactNo,
      discountType,
      discountValue: Number(discountValue) || 0,
      paymentMode,
      notes,
      billDate,
    });

    if (sale) {
      // Clear form inputs for next student
      setStudentName('');
      setStudentClass('');
      setRollNoAdmission('');
      setContactNo('');
      setDiscountValue(0);
      setNotes('');
    }
  };

  const handleFillSampleStudent = () => {
    setStudentName('Kavya Singhania');
    setStudentClass('Grade 8 - B');
    setRollNoAdmission('NEPS/2020/554');
    setContactNo('9811234567');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Inputs: Cashier, Date, Student Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">POS Billing Terminal</h3>
              <p className="text-xs text-slate-500">Fast uniform invoicing & stock auto-deduction</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Cashier input */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Cashier:</span>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="Cashier Name"
                className="font-semibold text-slate-800 bg-transparent focus:outline-none w-28 md:w-36"
              />
            </div>

            {/* Bill Date input */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="font-medium text-slate-800 bg-transparent focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleFillSampleStudent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sample Student</span>
            </button>
          </div>
        </div>

        {/* Student Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Arjun Kapoor"
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Class / Grade <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              placeholder="e.g. Grade 7 - B"
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Roll No / Admission ID
            </label>
            <input
              type="text"
              value={rollNoAdmission}
              onChange={(e) => setRollNoAdmission(e.target.value)}
              placeholder="e.g. NEPS/2021/841"
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Parent Contact No.
            </label>
            <input
              type="tel"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Main POS Grid: Item Picker (Left) & Cart / Bill Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Item Selection & Live Stock Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Uniform Catalog & Stock Inspection</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {filteredInventory.length} SKUs in view
              </span>
            </div>

            {/* Instant Search & Category Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search by Item Code (e.g. NEPS-PNT-28) or Uniform Name..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Item Selector & Size Selector */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Uniform Item:
                </label>
                <select
                  value={currentItemName}
                  onChange={(e) => {
                    setSelectedItemName(e.target.value);
                    setSelectedVariantId('');
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium text-slate-800"
                >
                  {uniqueItemNames.length === 0 ? (
                    <option value="">No items found matching filter</option>
                  ) : (
                    uniqueItemNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Size Variants Selection */}
              {availableVariants.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Select Size / Variant:
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Category: <strong className="text-slate-600">{activeVariant?.category}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableVariants.map((variant) => {
                      const isSelected = activeVariant?.id === variant.id;
                      const isOut = variant.availableUnits <= 0;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                          } ${isOut ? 'opacity-60' : ''}`}
                        >
                          <div className="font-bold text-sm text-slate-800">{variant.size}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ₹{variant.mrp}
                          </div>
                          <div
                            className={`text-[9px] font-bold mt-1 inline-block px-1.5 py-0.2 rounded-full ${
                              variant.availableUnits > 5
                                ? 'text-emerald-700 bg-emerald-100'
                                : variant.availableUnits > 0
                                ? 'text-amber-800 bg-amber-100'
                                : 'text-rose-700 bg-rose-100'
                            }`}
                          >
                            {variant.availableUnits} left
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LIVE STOCK HUD BADGE & QUANTITY STEPPER */}
              {activeVariant && currentStockStatus && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Live Stock HUD Indicator */}
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span>Item Code:</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded">
                        {activeVariant.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentStockStatus.color}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${currentStockStatus.badge} animate-pulse`} />
                        <span>{currentStockStatus.label}</span>
                      </span>

                      <span className="text-sm font-bold text-slate-900 font-mono">
                        MRP: ₹{activeVariant.mrp}
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Add to Cart */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                        className="px-2.5 py-2 hover:bg-slate-100 text-slate-600 transition-colors"
                        disabled={selectedQty <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={activeVariant.availableUnits}
                        value={selectedQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setSelectedQty(Math.max(1, Math.min(val, activeVariant.availableUnits || 1)));
                        }}
                        className="w-12 text-center text-sm font-bold text-slate-800 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedQty((q) => Math.min(activeVariant.availableUnits, q + 1))
                        }
                        className="px-2.5 py-2 hover:bg-slate-100 text-slate-600 transition-colors"
                        disabled={selectedQty >= activeVariant.availableUnits}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={!currentStockStatus.canAdd || activeVariant.availableUnits === 0}
                      onClick={handleAddItemToCart}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Cart, Summary, Discount & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">Cart Items ({cart.length})</h4>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="py-3 max-h-60 overflow-y-auto space-y-2.5 flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                  <p className="text-xs font-medium">Cart is currently empty</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select an item and variant on the left to add to bill
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.itemVariantId}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-400">{item.code}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          Size: {item.size}
                        </span>
                        <span>•</span>
                        <span>₹{item.mrp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Stepper */}
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.itemVariantId, item.quantity - 1)}
                          className="px-1.5 py-1 hover:bg-slate-100 text-slate-600 text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.itemVariantId, item.quantity + 1)}
                          className="px-1.5 py-1 hover:bg-slate-100 text-slate-600 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="w-16 text-right font-mono font-bold text-xs text-slate-800">
                        ₹{item.subtotal}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.itemVariantId)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Discount */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              {/* Discount Selector */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Special Discount:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        discountType === 'percent'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      % Percent
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('flat')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        discountType === 'flat'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Flat ₹
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? 100 : grossTotal}
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder={discountType === 'percent' ? 'e.g. 5%' : 'e.g. ₹100'}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  {discountAmount > 0 && (
                    <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
                      -₹{discountAmount.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Mode:
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['UPI', 'Cash', 'Card', 'Net Banking'] as PaymentMode[]).map((mode) => {
                    const isSelected = paymentMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`p-2 rounded-xl border text-center font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mode === 'UPI' && <Smartphone className="w-3.5 h-3.5" />}
                        {mode === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                        {mode === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                        {mode === 'Net Banking' && <Building className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{mode}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Remark */}
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional bill notes (e.g. Sibling discount, term kit)..."
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Bill Totals & Checkout Button */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Gross Total:</span>
                  <span className="font-mono">₹{grossTotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 font-medium">
                    <span>Total Discount:</span>
                    <span className="font-mono">- ₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-800">
                  <span className="text-slate-100">Net Payable:</span>
                  <span className="font-mono text-xl text-emerald-400">
                    ₹{netPayable.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full mt-3 py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] active:bg-[#0040a8] text-white font-bold text-sm shadow-xl shadow-blue-600/35 ring-2 ring-blue-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Complete Sale & Generate Invoice</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        invoice={activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />
    </div>
  );
};

export const POSBillingView: React.FC = () => {
  const { activeDivision } = useStore();

  if (activeDivision === 'books') {
    return <BooksPOSView />;
  }

  return <UniformPOSView />;
};

