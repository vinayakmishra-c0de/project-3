import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ALL_CLASSES, DiscountType, ItemVariant, PaymentMode, SchoolClass } from '../../types';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import {
  BookOpen,
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
  PackageCheck,
  CheckSquare,
  Square,
  ArrowRight,
  BookmarkCheck,
  Filter,
} from 'lucide-react';

export const BooksPOSView: React.FC = () => {
  const {
    inventory,
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
  const [cashierInput, setCashierInput] = useState(cashierName);
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState<SchoolClass>('Class 1');
  const [rollNoAdmission, setRollNoAdmission] = useState('');
  const [contactNo, setContactNo] = useState('');

  // Auxiliary item search & category filter
  const [auxCategory, setAuxCategory] = useState<string>('All');
  const [auxSearch, setAuxSearch] = useState<string>('');
  const [selectedAuxQty, setSelectedAuxQty] = useState<Record<string, number>>({});

  // Discount & Payment
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [notes, setNotes] = useState<string>('');

  // Keep cashier in sync
  useEffect(() => {
    setCashierInput(cashierName);
  }, [cashierName]);

  const handleCashierBlur = () => {
    if (cashierInput.trim()) {
      setCashierName(cashierInput.trim());
    }
  };

  // 1. Class-wise Syllabus Books (Mandatory Automated Syllabus Loading)
  const syllabusBooks = useMemo(() => {
    return inventory.filter(
      (item) =>
        (item.classGrade === selectedClass || item.size === selectedClass) &&
        (item.isSyllabusBook || item.category === 'Textbooks (Syllabus)')
    );
  }, [inventory, selectedClass]);

  // Track which syllabus books are selected in cart
  const syllabusSelectionMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    syllabusBooks.forEach((book) => {
      map[book.id] = cart.some((c) => c.itemVariantId === book.id);
    });
    return map;
  }, [syllabusBooks, cart]);

  // One-Click: [ Select Complete Book Set ]
  const handleSelectCompleteSet = () => {
    let addedCount = 0;
    syllabusBooks.forEach((book) => {
      const alreadyInCart = cart.some((c) => c.itemVariantId === book.id);
      if (!alreadyInCart && book.availableUnits > 0) {
        addToCart(book, 1);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      addToast(
        `Added full syllabus book bundle (${addedCount} textbooks) for ${selectedClass}`,
        'success',
        'Book Set Added'
      );
    } else {
      addToast(`All available books for ${selectedClass} are already in the bill.`, 'info');
    }
  };

  // One-Click: [ Deselect All ]
  const handleDeselectAll = () => {
    syllabusBooks.forEach((book) => {
      if (cart.some((c) => c.itemVariantId === book.id)) {
        removeFromCart(book.id);
      }
    });
    addToast(`Removed ${selectedClass} syllabus textbooks from bill`, 'info');
  };

  // Toggle individual syllabus book checkbox
  const handleToggleBook = (book: ItemVariant) => {
    const isInCart = cart.some((c) => c.itemVariantId === book.id);
    if (isInCart) {
      removeFromCart(book.id);
    } else {
      if (book.availableUnits <= 0) {
        addToast(`Cannot select ${book.name}: Out of Stock (0 units)!`, 'error');
        return;
      }
      addToCart(book, 1);
    }
  };

  // 2. Auxiliary Items (Notebooks, Stationery, Bags, Water Bottles, Art)
  const auxiliaryCategories = [
    'All',
    'Notebooks & Copies',
    'School Bags',
    'Water Bottles',
    'Stationery & Geometry',
    'Art & Craft Supplies',
    'Book Covers & Labels',
  ];

  const auxiliaryItems = useMemo(() => {
    return inventory.filter((item) => {
      // Must not be a class syllabus textbook
      const isSyllabus = item.isSyllabusBook || item.category === 'Textbooks (Syllabus)';
      if (isSyllabus) return false;

      const matchCat = auxCategory === 'All' || item.category === auxCategory;
      const matchSearch =
        item.name.toLowerCase().includes(auxSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(auxSearch.toLowerCase()) ||
        item.size.toLowerCase().includes(auxSearch.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [inventory, auxCategory, auxSearch]);

  const handleAddAuxItem = (item: ItemVariant) => {
    const qty = selectedAuxQty[item.id] || 1;
    if (qty <= 0) return;
    const ok = addToCart(item, qty);
    if (ok) {
      setSelectedAuxQty((prev) => ({ ...prev, [item.id]: 1 }));
    }
  };

  const handleAuxQtyChange = (itemId: string, val: number) => {
    setSelectedAuxQty((prev) => ({
      ...prev,
      [itemId]: Math.max(1, val),
    }));
  };

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

  // Stock status badge helper
  const renderStockBadge = (units: number, minStock: number = 5) => {
    if (units <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          Out of Stock (0 units)
        </span>
      );
    }
    if (units <= minStock) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          Low: {units} left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        {units} in stock
      </span>
    );
  };

  // Handle Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      addToast('Bill is empty. Please select books or stationery items.', 'error');
      return;
    }
    if (!studentName.trim()) {
      addToast('Please enter the Student Name before finalizing sale.', 'warning');
      return;
    }

    const sale = completeCheckout({
      studentName: studentName.trim(),
      studentClass: selectedClass,
      rollNoAdmission: rollNoAdmission.trim(),
      contactNo: contactNo.trim(),
      discountType,
      discountValue,
      paymentMode,
      notes: notes.trim(),
      billDate,
    });

    if (sale) {
      setStudentName('');
      setRollNoAdmission('');
      setContactNo('');
      setNotes('');
      setDiscountValue(0);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner & Billing Meta */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Books & Stationery Billing POS
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  Automated Syllabus Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Class-wise textbook sets, notebooks, school bags, and stationery essentials.
              </p>
            </div>
          </div>

          {/* Quick Cashier & Date Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Cashier</span>
                <input
                  type="text"
                  value={cashierInput}
                  onChange={(e) => setCashierInput(e.target.value)}
                  onBlur={handleCashierBlur}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none w-28"
                  placeholder="Cashier Name"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Bill Date</span>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Student & Mandatory Class Selector Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* MANDATORY CLASS SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Class / Grade *</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-bold lowercase">auto-loads syllabus</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as SchoolClass)}
              className="w-full bg-emerald-50/50 border-2 border-emerald-500/80 rounded-xl px-3 py-2.5 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer shadow-xs"
            >
              {ALL_CLASSES.map((cls) => (
                <option key={cls} value={cls} className="text-slate-900">
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Student Name *
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Roll No / Admission ID
            </label>
            <input
              type="text"
              value={rollNoAdmission}
              onChange={(e) => setRollNoAdmission(e.target.value)}
              placeholder="e.g. ADM-2024-508"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Parent Contact No
            </label>
            <input
              type="tel"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column POS Body: Left = Syllabus Books + Auxiliary Items | Right = Cart & Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Syllabus Engine & Auxiliary Items (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section A: Automated Class-Wise Syllabus Loading */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm md:text-base">
                    {selectedClass} Prescribed Syllabus Books
                  </h2>
                  <p className="text-xs text-slate-500">
                    {syllabusBooks.length} mapped textbook(s) for the curriculum
                  </p>
                </div>
              </div>

              {/* One-Click Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectCompleteSet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  title="Select all mapped textbooks for this grade into the bill"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Select Complete Book Set</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  title="Deselect syllabus books from cart"
                >
                  <span>Deselect All</span>
                </button>
              </div>
            </div>

            {/* Syllabus Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-12">Select</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Book Title / Description</th>
                    <th className="py-2.5 px-3 font-mono">ISBN / Code</th>
                    <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                    <th className="py-2.5 px-3 text-center">Live Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {syllabusBooks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No syllabus books mapped for {selectedClass}. Use Live Stock to add items.
                      </td>
                    </tr>
                  ) : (
                    syllabusBooks.map((book) => {
                      const isSelected = syllabusSelectionMap[book.id];
                      const isOut = book.availableUnits <= 0;

                      return (
                        <tr
                          key={book.id}
                          onClick={() => handleToggleBook(book)}
                          className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50/70 font-medium' : ''
                          } ${isOut ? 'opacity-60 bg-rose-50/20' : ''}`}
                        >
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={isOut}
                              onClick={() => handleToggleBook(book)}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isSelected
                                  ? 'text-emerald-600'
                                  : isOut
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-emerald-600'
                              }`}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {book.subject || 'Core'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{book.name}</div>
                            {book.publisher && (
                              <div className="text-[11px] text-slate-400">{book.publisher}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {book.isbn || book.code}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            ₹{book.mrp.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {renderStockBadge(book.availableUnits, book.minStockAlert)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Auxiliary / Add-On Items Section (Below Book Set) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                  <span>Auxiliary & Add-On School Essentials</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Notebooks, copies, registers, school bags, water bottles & stationery.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={auxSearch}
                  onChange={(e) => setAuxSearch(e.target.value)}
                  placeholder="Search notebooks, bags..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none">
              {auxiliaryCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAuxCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    auxCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Auxiliary Items List / Grid */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {auxiliaryItems.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No auxiliary items match your filter.
                </div>
              ) : (
                auxiliaryItems.map((item) => {
                  const currentQty = selectedAuxQty[item.id] || 1;
                  const isOut = item.availableUnits <= 0;

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono shrink-0">
                            {item.size}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-extrabold text-emerald-700">
                            ₹{item.mrp.toFixed(2)}
                          </span>
                          {renderStockBadge(item.availableUnits, item.minStockAlert)}
                        </div>
                      </div>

                      {/* Add Qty & Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            disabled={isOut || currentQty <= 1}
                            onClick={() => handleAuxQtyChange(item.id, currentQty - 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-slate-800">
                            {currentQty}
                          </span>
                          <button
                            type="button"
                            disabled={isOut || currentQty >= item.availableUnits}
                            onClick={() => handleAuxQtyChange(item.id, currentQty + 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isOut}
                          onClick={() => handleAddAuxItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Itemized Cart, Discounts & Electric Blue Complete Sale (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Cart Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm tracking-wide">
                  Student Bill Summary
                </h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Cart Item List */}
            <div className="p-4 max-h-[340px] overflow-y-auto divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                  <p className="text-xs font-semibold text-slate-600">No items added to bill yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select the complete book set or add individual copies & stationery.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.itemVariantId} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono">{item.code}</span>
                        <span>•</span>
                        <span>₹{item.mrp} each</span>
                      </div>
                    </div>

                    {/* Quantity Adjusters */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.itemVariantId, item.quantity - 1)}
                          className="p-1 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.itemVariantId, item.quantity + 1)}
                          className="p-1 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="w-16 text-right font-bold text-xs text-slate-900">
                        ₹{item.subtotal.toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.itemVariantId)}
                        className="text-slate-300 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bill Summary Calculations */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Gross Subtotal</span>
                <span className="font-bold text-slate-900 text-sm">₹{grossTotal.toFixed(2)}</span>
              </div>

              {/* Discount Section */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Discount</span>
                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        discountType === 'percent'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('flat')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        discountType === 'flat'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-500'
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
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {discountAmount > 0 && (
                    <span className="text-xs font-bold text-rose-600 whitespace-nowrap">
                      - ₹{discountAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="pt-2 border-t border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['UPI', 'Cash', 'Card', 'Net Banking'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                        paymentMode === mode
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Billing remarks / Parent notes (optional)"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Net Payable Row */}
              <div className="pt-3 border-t-2 border-slate-300 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Amount Due
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold">
                    Mode: {paymentMode}
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ₹{netPayable.toFixed(2)}
                </div>
              </div>

              {/* COMPLETE SALE BUTTON (ELECTRIC BLUE COLOR) */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-500/50"
              >
                <CheckCircle className="w-5 h-5 text-white" />
                <span>Complete Books Sale & Generate Receipt</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {activeInvoice && (
        <InvoiceReceiptModal
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
        />
      )}
    </div>
  );
};
