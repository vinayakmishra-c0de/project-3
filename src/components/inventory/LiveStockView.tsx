import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { ItemVariant, CategoryInfo, ALL_CLASSES } from '../../types';
import {
  exportToExcel,
  exportToCSV,
  parseExcelFile,
  downloadInventoryTemplate,
  smartParseInventoryRows,
  ParsedInventoryItem,
} from '../../utils/excelUtils';
import { SectionRecycleBinModal } from '../common/SectionRecycleBinModal';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Sparkles,
  Layers,
  Save,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

export const LiveStockView: React.FC = () => {
  const {
    activeDivision,
    inventory,
    categories,
    recycleBin,
    addCategory,
    editCategory,
    deleteCategory,
    clearAllCategories,
    addItemVariant,
    updateItemVariant,
    deleteItemVariants,
    bulkImportInventory,
    addToast,
  } = useStore();

  const [showSectionRecycleBin, setShowSectionRecycleBin] = useState(false);
  const inventoryRecycleCount = recycleBin.filter((i) => i.originModule === 'Inventory').length;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Expanded categories state (all expanded by default for easy scanning)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    categories.forEach((c) => (init[c.name] = true));
    return init;
  });

  // Multi-select for bulk delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state: Add Category
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPrefix, setNewCatPrefix] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Modals state: Manage Categories Center
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);

  // Modals state: Edit Category
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatPrefix, setEditCatPrefix] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  // Modals state: Delete Category Confirmation
  const [deletingCategory, setDeletingCategory] = useState<CategoryInfo | null>(null);
  const [deleteCatOption, setDeleteCatOption] = useState<'recycle' | 'keep'>('recycle');

  const [showAddSkuModal, setShowAddSkuModal] = useState(false);
  const [newSku, setNewSku] = useState({
    code: '',
    name: '',
    category: categories[0]?.name || 'Full Pant',
    size: '',
    availableUnits: 20,
    mrp: 500,
    costPrice: 320,
    minStockAlert: 5,
  });

  // Inline editing state for quick edits
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editUnits, setEditUnits] = useState<number>(0);
  const [editMrp, setEditMrp] = useState<number>(0);

  // Bulk Excel Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<ParsedInventoryItem[]>([]);
  const [inferredCount, setInferredCount] = useState(0);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [replaceCategoriesWithExcel, setReplaceCategoriesWithExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered inventory items
  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchClass =
        selectedClassFilter === 'All' ||
        item.classGrade === selectedClassFilter ||
        item.size === selectedClassFilter;
      const matchSearch =
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.isbn && item.isbn.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchLow = !lowStockOnly || item.availableUnits <= (item.minStockAlert ?? 5);
      return matchCat && matchClass && matchSearch && matchLow;
    });
  }, [inventory, selectedCategory, selectedClassFilter, searchQuery, lowStockOnly]);

  // Group items by category for hierarchical rollup
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, ItemVariant[]> = {};
    // Ensure all categories exist in map
    categories.forEach((cat) => {
      groups[cat.name] = [];
    });
    // Add any category from inventory that might not be in categories list
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [categories, filteredItems]);

  // Rollup KPIs
  const totalUnits = useMemo(
    () => inventory.reduce((sum, item) => sum + item.availableUnits, 0),
    [inventory]
  );
  const totalValue = useMemo(
    () => inventory.reduce((sum, item) => sum + item.availableUnits * item.mrp, 0),
    [inventory]
  );
  const lowStockCount = useMemo(
    () => inventory.filter((i) => i.availableUnits <= (i.minStockAlert ?? 5)).length,
    [inventory]
  );

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  // Selection handlers
  const handleSelectAllInCat = (items: ItemVariant[], checked: boolean) => {
    const ids = items.map((i) => i.id);
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    } else {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    deleteItemVariants(selectedIds);
    setSelectedIds([]);
  };

  // Save quick edit
  const startEditing = (item: ItemVariant) => {
    setEditingItemId(item.id);
    setEditUnits(item.availableUnits);
    setEditMrp(item.mrp);
  };

  const saveEdit = (id: string) => {
    updateItemVariant(id, {
      availableUnits: Math.max(0, editUnits),
      mrp: Math.max(0, editMrp),
    });
    setEditingItemId(null);
  };

  // Excel Export
  const handleExportExcel = () => {
    const data = filteredItems.map((item) => ({
      'Item Code': item.code,
      'Item Name': item.name,
      'Category': item.category,
      'Size Variant': item.size,
      'Available Stock': item.availableUnits,
      'MRP (₹)': item.mrp,
      'Cost Price (₹)': item.costPrice || 0,
      'Inventory Value (₹)': item.availableUnits * item.mrp,
      'Last Updated': item.updatedAt,
    }));
    exportToExcel(data, `NEPS_Live_Inventory_${new Date().toISOString().split('T')[0]}`);
    addToast('Exported live inventory to Excel', 'success');
  };

  // File Upload Handler with Smart Auto-Detection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportError('');
    try {
      const rawRows = await parseExcelFile(file);
      if (rawRows.length === 0) {
        setImportError('No valid data rows found in uploaded file');
        return;
      }
      const { parsedRows, inferredCount: infCount } = smartParseInventoryRows(
        rawRows,
        activeDivision
      );
      if (parsedRows.length === 0) {
        setImportError('No valid items could be parsed from the file');
        return;
      }
      setImportRows(parsedRows);
      setInferredCount(infCount);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse Excel file');
    }
  };

  const detectedExcelCategories = useMemo(() => {
    return Array.from(new Set(importRows.map((r) => r.category).filter(Boolean)));
  }, [importRows]);

  const commitImport = () => {
    if (importRows.length === 0) return;
    bulkImportInventory(importRows, { replaceCategories: replaceCategoriesWithExcel });
    setShowImportModal(false);
    setImportRows([]);
    setImportFileName('');
    setInferredCount(0);
    setReplaceCategoriesWithExcel(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Metric Rollup Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Stock in Hand</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
              {totalUnits} <span className="text-xs text-slate-400 font-normal">units</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="font-bold text-base">₹</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Inventory Value</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
              ₹{totalValue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div
          onClick={() => setShowManageCategoriesModal(true)}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
          title="Click to manage, edit, or delete active categories"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span>Active Categories</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold group-hover:bg-indigo-200">
                Manage
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
              {categories.length} <span className="text-xs text-slate-400 font-normal">categories</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
            lowStockOnly
              ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Low Stock Alerts</div>
            <div className="text-xl font-bold text-amber-700 font-mono mt-0.5 flex items-center gap-1.5">
              <span>{lowStockCount}</span>
              <span className="text-[10px] font-medium text-amber-600 bg-amber-200/80 px-1.5 py-0.5 rounded">
                {lowStockOnly ? 'Filtered' : 'Filter'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Controls & Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-56 flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeDivision === 'books'
                  ? 'Search by title, subject, ISBN, or code...'
                  : 'Search by code, uniform name, or size...'
              }
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {activeDivision === 'books' && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="text-xs bg-transparent text-emerald-900 font-bold focus:outline-none cursor-pointer"
              >
                <option value="All">All 15 Classes</option>
                {ALL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          )}

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="All">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
              lowStockOnly
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only</span>
          </button>
        </div>

        {/* Action Buttons: Bulk Delete, Recycle Bin, Add Category, Add SKU, Export, Import */}
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

          {/* Section-level Recycle Bin button right next to Delete Selected */}
          <button
            type="button"
            onClick={() => setShowSectionRecycleBin(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Open Live Stock Recycle Bin"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Recycle Bin ({inventoryRecycleCount})</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            title="Import Excel or CSV template"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Excel Import</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition-colors cursor-pointer"
            title="Download full inventory as Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setShowManageCategoriesModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Manage, Edit, or Delete Active Categories"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manage Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>

          <button
            onClick={() => setShowAddSkuModal(true)}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add SKU Variant</span>
          </button>
        </div>
      </div>

      {/* 3. Hierarchical / Categorized View with Nested Expandable Tables */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Active Categories Configured</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            All categories have been cleared. You can now build your own custom categories or upload an Excel file — the system will automatically treat categories in your Excel as the active categories!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Category</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel to Auto-Adopt Categories</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const items = groupedByCategory[cat.name] || [];
            if (selectedCategory !== 'All' && selectedCategory !== cat.name) return null;
            if (items.length === 0 && (searchQuery || lowStockOnly)) return null;

            const isExpanded = !!expandedCategories[cat.name];
            const catUnits = items.reduce((s, i) => s + i.availableUnits, 0);
            const catValue = items.reduce((s, i) => s + i.availableUnits * i.mrp, 0);
            const catLowCount = items.filter((i) => i.availableUnits <= (i.minStockAlert ?? 5)).length;

            const allSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Category Rollup Header Bar */}
                <div
                  onClick={() => toggleCategory(cat.name)}
                  className="px-5 py-4 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-base">{cat.name}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                          Prefix: {cat.codePrefix}
                        </span>
                        {catLowCount > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {catLowCount} Low Stock
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs ml-auto">
                    <div className="text-right hidden sm:block">
                      <span className="text-slate-400">Total: </span>
                      <strong className="text-slate-700">{items.length} SKUs</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">Units: </span>
                      <strong className="text-slate-900 font-mono text-sm">{catUnits}</strong>
                    </div>
                    <div className="text-right hidden md:block">
                      <span className="text-slate-400">Value: </span>
                      <strong className="text-slate-900 font-mono text-sm">
                        ₹{catValue.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    {/* Category Action Buttons: Edit & Delete */}
                    <div
                      className="flex items-center gap-1.5 pl-3 border-l border-slate-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditCatName(cat.name);
                          setEditCatPrefix(cat.codePrefix);
                          setEditCatDesc(cat.description || '');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                        title="Edit Category Name, Prefix or Description"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeletingCategory(cat);
                          setDeleteCatOption('recycle');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                        title="Delete this Category"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

              {/* Nested Expandable Table */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  {items.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No SKU variants in this category yet. Click "Add SKU Variant" to add sizes.
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/60 text-slate-600 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={(e) => handleSelectAllInCat(items, e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="py-3 px-3">Item Code (SKU)</th>
                          <th className="py-3 px-3">Item Name</th>
                          <th className="py-3 px-3 text-center">Size / Variant</th>
                          <th className="py-3 px-3 text-center">Available Units</th>
                          <th className="py-3 px-3 text-right">MRP (₹)</th>
                          <th className="py-3 px-3 text-right">Inventory Value (₹)</th>
                          <th className="py-3 px-3 text-center">Stock Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item) => {
                          const isLow = item.availableUnits <= (item.minStockAlert ?? 5);
                          const isZero = item.availableUnits === 0;
                          const isSelected = selectedIds.includes(item.id);
                          const isEditing = editingItemId === item.id;

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
                                  onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-3 px-3 font-mono font-semibold text-blue-700">
                                {item.code}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-900">{item.name}</div>
                                {(item.subject || item.isbn) && (
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    {item.subject ? <span className="text-emerald-700 font-semibold">{item.subject} • </span> : null}
                                    {item.isbn ? `ISBN: ${item.isbn}` : null}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-xs">
                                  {item.size}
                                </span>
                              </td>

                              {/* Available Units (with Inline Edit) */}
                              <td className="py-3 px-3 text-center">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={editUnits}
                                    onChange={(e) => setEditUnits(parseInt(e.target.value, 10) || 0)}
                                    className="w-16 text-center py-1 px-1.5 border border-blue-400 rounded bg-white font-bold"
                                  />
                                ) : (
                                  <span
                                    onClick={() => startEditing(item)}
                                    className="font-bold text-slate-900 font-mono hover:text-blue-600 cursor-pointer"
                                    title="Click to inline edit stock"
                                  >
                                    {item.availableUnits}
                                  </span>
                                )}
                              </td>

                              {/* MRP (with Inline Edit) */}
                              <td className="py-3 px-3 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={editMrp}
                                    onChange={(e) => setEditMrp(parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right py-1 px-1.5 border border-blue-400 rounded bg-white font-mono font-bold"
                                  />
                                ) : (
                                  <span
                                    onClick={() => startEditing(item)}
                                    className="font-mono text-slate-700 font-medium hover:text-blue-600 cursor-pointer"
                                    title="Click to inline edit MRP"
                                  >
                                    ₹{item.mrp.toFixed(2)}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                ₹{(item.availableUnits * item.mrp).toLocaleString('en-IN')}
                              </td>

                              {/* Stock status badge */}
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                {isZero ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                                    Out of Stock (0 units)
                                  </span>
                                ) : isLow ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Low Stock ({item.availableUnits} left)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    In Stock
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => saveEdit(item.id)}
                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                        title="Save"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setEditingItemId(null)}
                                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                        title="Cancel"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEditing(item)}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                        title="Edit Units / Price"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteItemVariants([item.id])}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                        title="Move to Recycle Bin"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* 4. Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Add New {activeDivision === 'books' ? 'Books & Stationery' : 'Uniform'} Category
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Winter Pullover, Laboratory Coat"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Code Prefix (3-4 Letters) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCatPrefix}
                  onChange={(e) => setNewCatPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. WPV, LAB"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Woolen V-neck sweater with school logo"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newCatName.trim() || !newCatPrefix.trim()) {
                      addToast('Category Name and Prefix are required', 'warning');
                      return;
                    }
                    addCategory(newCatName, newCatPrefix, newCatDesc);
                    setShowAddCategoryModal(false);
                    setNewCatName('');
                    setNewCatPrefix('');
                    setNewCatDesc('');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add SKU Variant Modal */}
      {showAddSkuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Add New SKU Variant</h3>
              <button
                onClick={() => setShowAddSkuModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newSku.category}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.name === e.target.value);
                      const prefix = cat ? cat.codePrefix : 'ITM';
                      setNewSku({
                        ...newSku,
                        category: e.target.value,
                        code: `NEPS-${prefix}-${newSku.size || 'STD'}`,
                      });
                    }}
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
                  <label className="block font-semibold text-slate-700 mb-1">
                    Size / Variant <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSku.size}
                    onChange={(e) => {
                      const s = e.target.value;
                      const cat = categories.find((c) => c.name === newSku.category);
                      const prefix = cat ? cat.codePrefix : 'ITM';
                      setNewSku({
                        ...newSku,
                        size: s,
                        code: `NEPS-${prefix}-${s.toUpperCase()}`,
                      });
                    }}
                    placeholder="e.g. 28, 30, M, XL"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSku.name}
                  onChange={(e) => setNewSku({ ...newSku, name: e.target.value })}
                  placeholder="e.g. Boys Full Pant - Navy Blue"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Generated Item Code (SKU) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSku.code}
                  onChange={(e) => setNewSku({ ...newSku, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. NEPS-PNT-28"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-mono uppercase font-bold text-blue-700"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Available Units</label>
                  <input
                    type="number"
                    min="0"
                    value={newSku.availableUnits}
                    onChange={(e) =>
                      setNewSku({ ...newSku, availableUnits: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSku.mrp}
                    onChange={(e) =>
                      setNewSku({ ...newSku, mrp: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSku.costPrice}
                    onChange={(e) =>
                      setNewSku({ ...newSku, costPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSkuModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newSku.name.trim() || !newSku.code.trim() || !newSku.size.trim()) {
                      addToast('Name, Code, and Size are required', 'warning');
                      return;
                    }
                    addItemVariant(newSku);
                    setShowAddSkuModal(false);
                    setNewSku({
                      code: '',
                      name: '',
                      category: categories[0]?.name || 'Full Pant',
                      size: '',
                      availableUnits: 20,
                      mrp: 500,
                      costPrice: 320,
                      minStockAlert: 5,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Add SKU Variant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Excel Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Bulk Inventory Excel/CSV Import</h3>
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

            <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Instructions and Download Template */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-900">Need the correct column format?</div>
                  <div className="text-[11px] text-blue-700">
                    Download our pre-formatted template with standard columns: Item Code, Item Name, Category, Size, Available Units, MRP.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadInventoryTemplate}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap shadow-xs cursor-pointer"
                >
                  Download Template
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-slate-700">
                  {importFileName ? importFileName : 'Click to select Excel (.xlsx, .xls) or CSV file'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Existing codes will update stock and price; new codes will be added automatically.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>

              {importError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  {importError}
                </div>
              )}

              {/* Smart Import Info Banner */}
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Smart Flexible Import Active</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-indigo-700 mt-1">
                  <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                    <strong className="text-indigo-900 block font-semibold">1. Unified Units / Stock:</strong>
                    <span>"Units", "Available Units", "Qty", "Stock" are recognized as identical.</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                    <strong className="text-indigo-900 block font-semibold">2. Smart Category from Name:</strong>
                    <span>Extracts category & size from item names (e.g. all "Full Pant" sizes group together).</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                    <strong className="text-indigo-900 block font-semibold">3. Blank Column Tolerance:</strong>
                    <span>Missing template columns are safely left blank without rejecting your file.</span>
                  </div>
                </div>
              </div>

              {/* Preview Rows */}
              {importRows.length > 0 && (
                <div>
                  <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>Parsed Items Preview ({importRows.length} items ready)</span>
                      {inferredCount > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {inferredCount} item(s) smart-inferred from names
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> File Validated
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-100 sticky top-0 font-semibold text-slate-700">
                        <tr>
                          <th className="p-2 text-left">Item Code</th>
                          <th className="p-2 text-left">Item Name</th>
                          <th className="p-2 text-left">Category</th>
                          <th className="p-2 text-center">Size</th>
                          <th className="p-2 text-center">Units / Stock</th>
                          <th className="p-2 text-right">MRP (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importRows.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-blue-700">
                              <div>{row.code}</div>
                              {row.isCodeGenerated && (
                                <span className="text-[9px] text-slate-400 font-normal">Auto-Code</span>
                              )}
                            </td>
                            <td className="p-2 text-slate-800 font-medium">
                              {row.name}
                            </td>
                            <td className="p-2 text-slate-700">
                              <span className="font-semibold">{row.category}</span>
                              {row.isCategoryInferred && (
                                <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-normal">
                                  From Name
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {row.size ? (
                                <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">
                                  {row.size}
                                </span>
                              ) : (
                                <span className="text-slate-300 italic">—</span>
                              )}
                            </td>
                            <td className="p-2 text-center font-bold text-slate-900 font-mono">
                              {row.availableUnits}
                            </td>
                            <td className="p-2 text-right font-mono text-slate-700">
                              ₹{row.mrp.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importRows.length > 15 && (
                    <p className="text-[10px] text-slate-400 mt-1 italic text-center">
                      Showing first 15 of {importRows.length} items. All will be processed into Live Stock.
                    </p>
                  )}
                </div>
              )}

              {/* Detected Categories from Excel Preview & Configuration */}
              {detectedExcelCategories.length > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Excel Categories Detected ({detectedExcelCategories.length})</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                      Auto-Adopt Active
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mb-2">
                    These categories will automatically be set as active categories in Live Stock upon import:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {detectedExcelCategories.map((cName) => (
                      <span
                        key={cName}
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800 shadow-2xs"
                      >
                        {cName}
                      </span>
                    ))}
                  </div>
                  <label className="flex items-start gap-2.5 text-xs text-emerald-950 cursor-pointer select-none pt-2 border-t border-emerald-200/80">
                    <input
                      type="checkbox"
                      checked={replaceCategoriesWithExcel}
                      onChange={(e) => setReplaceCategoriesWithExcel(e.target.checked)}
                      className="mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold">Replace existing active categories with these Excel categories</span>
                      <p className="text-[10px] text-emerald-700">
                        Check this box if you want ONLY the categories found in this Excel file to be active (removes old default categories).
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportRows([]);
                  setReplaceCategoriesWithExcel(false);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importRows.length === 0}
                onClick={commitImport}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                Commit & Update Live Stock ({importRows.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Manage Active Categories Center Modal */}
      {showManageCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Manage Active Categories ({categories.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Edit names/prefixes, delete active categories, or clear all to build your own or import from Excel.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowManageCategoriesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">Quick Category Actions:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManageCategoriesModal(false);
                      setShowAddCategoryModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Custom Category</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Are you sure you want to remove all active categories? You can create your own custom categories or upload an Excel file to set categories.'
                        )
                      ) {
                        clearAllCategories();
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Clear All Categories</span>
                  </button>
                </div>
              </div>

              {categories.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No Active Categories Configured</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    You can create custom categories using "Create Custom Category" or upload an Excel sheet to auto-adopt its categories.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Category Name</th>
                        <th className="py-2.5 px-3">Prefix</th>
                        <th className="py-2.5 px-3 text-center">Items</th>
                        <th className="py-2.5 px-3 text-center">Stock Units</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((cat) => {
                        const items = inventory.filter((i) => i.category === cat.name);
                        const units = items.reduce((sum, i) => sum + i.availableUnits, 0);
                        return (
                          <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <div>{cat.name}</div>
                              {cat.description && (
                                <div className="text-[10px] text-slate-400 font-normal">{cat.description}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                                {cat.codePrefix}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                              {items.length} SKUs
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                              {units}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setEditCatName(cat.name);
                                    setEditCatPrefix(cat.codePrefix);
                                    setEditCatDesc(cat.description || '');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 font-medium transition-colors cursor-pointer"
                                  title="Edit category"
                                >
                                  <Edit2 className="w-3 h-3 text-blue-600" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingCategory(cat);
                                    setDeleteCatOption('recycle');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-medium transition-colors cursor-pointer"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-600" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowManageCategoriesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Edit Active Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Edit Active Category</h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  placeholder="e.g. Winter Wear, Laboratory Coat, Primary Textbooks"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Renaming this category will automatically update all existing items and historical references to it.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Code Prefix (3-4 Letters) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCatPrefix}
                  onChange={(e) => setEditCatPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. WIN, LAB"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  placeholder="e.g. Official winter uniforms and pullovers"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editCatName.trim() || !editCatPrefix.trim()) {
                      addToast('Category Name and Prefix are required', 'warning');
                      return;
                    }
                    editCategory(editingCategory.id, editCatName, editCatPrefix, editCatDesc);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Delete Active Category Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Active Category</h3>
              </div>
              <button
                onClick={() => setDeletingCategory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to delete the category{' '}
                <strong className="text-slate-900 font-bold">"{deletingCategory.name}"</strong>?
              </p>

              {(() => {
                const affectedItems = inventory.filter((i) => i.category === deletingCategory.name);
                const totalUnits = affectedItems.reduce((s, i) => s + i.availableUnits, 0);

                if (affectedItems.length === 0) {
                  return (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                      No items currently belong to this category. The category will be safely removed.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                      <div className="font-bold">Items in this Category:</div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        {affectedItems.length} SKU item(s) with {totalUnits} total stock units are currently assigned to this category.
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="font-semibold text-slate-700 block">Choose item action:</label>
                      <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="radio"
                          name="deleteCatAction"
                          checked={deleteCatOption === 'recycle'}
                          onChange={() => setDeleteCatOption('recycle')}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-800">Move all items to Recycle Bin (Recommended)</div>
                          <div className="text-[11px] text-slate-500">
                            Removes items from live inventory and places them in the Universal Recycle Bin where they can be restored if needed.
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="radio"
                          name="deleteCatAction"
                          checked={deleteCatOption === 'keep'}
                          onChange={() => setDeleteCatOption('keep')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-800">Keep items as "Uncategorized"</div>
                          <div className="text-[11px] text-slate-500">
                            Items remain in live stock but their category will be reset to Uncategorized.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteCategory(deletingCategory.id, deleteCatOption);
                    setDeletingCategory(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section-Specific Recycle Bin Modal */}
      <SectionRecycleBinModal
        module="Inventory"
        isOpen={showSectionRecycleBin}
        onClose={() => setShowSectionRecycleBin(false)}
      />
    </div>
  );
};
