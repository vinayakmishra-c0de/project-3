import * as XLSX from 'xlsx';

/**
 * Export data array to an Excel (.xlsx) file
 */
export function exportToExcel(data: Record<string, any>[], fileName: string, sheetName = 'Sheet1') {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Export data array to a CSV file
 */
export function exportToCSV(data: Record<string, any>[], fileName: string) {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse an uploaded Excel (.xlsx, .xls) or CSV file into JSON rows
 */
export function parseExcelFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Normalizes text for header comparison
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Searches row object for a value matching any alias in the list
 */
export function findValueByAliases(row: Record<string, any>, aliases: string[]): any {
  if (!row || typeof row !== 'object') return undefined;
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const normAlias = normalizeKey(alias);
    const foundKey = keys.find((k) => normalizeKey(k) === normAlias);
    if (foundKey !== undefined && row[foundKey] !== undefined && row[foundKey] !== null) {
      const val = row[foundKey];
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed !== '') return trimmed;
      } else {
        return val;
      }
    }
  }
  return undefined;
}

/**
 * Generates a clean 2 to 4 letter category prefix
 */
export function generateCategoryPrefix(categoryName: string): string {
  const clean = categoryName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  if (!clean) return 'CAT';
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
  }
  if (clean.length >= 3) {
    return clean.slice(0, 3).toUpperCase();
  }
  return (clean + 'XX').slice(0, 3).toUpperCase();
}

/**
 * Smartly infers Category and Size from Item Name if not provided explicitly.
 * Example:
 *  "Full Pant 28" -> Category: "Full Pant", Size: "28"
 *  "Full Pant Size 30" -> Category: "Full Pant", Size: "30"
 *  "Boys Full Pant - 32" -> Category: "Boys Full Pant", Size: "32"
 *  "Half Shirt 34" -> Category: "Half Shirt", Size: "34"
 *  "T-Shirt M" -> Category: "T-Shirt", Size: "M"
 *  "Mathematics Class 5" -> Category: "Mathematics", Size: "Class 5"
 */
export function smartExtractCategoryAndSize(
  rawItemName: string,
  explicitCategory?: string,
  explicitSize?: string
): { category: string; size: string; cleanName: string; isCategoryInferred: boolean; isSizeInferred: boolean } {
  let category = explicitCategory ? explicitCategory.trim() : '';
  let size = explicitSize ? explicitSize.trim() : '';
  let cleanName = rawItemName.trim();
  let isCategoryInferred = false;
  let isSizeInferred = false;

  // If size is missing, try to extract it from itemName
  if (!size && cleanName) {
    // 1. Check for Class/Grade pattern: "Class 5", "Grade 8", "Nursery", "LKG", "UKG"
    const classMatch = cleanName.match(/\b(?:Class|Grade|Std)\s*([0-9]{1,2}|Nursery|LKG|UKG|KG)\b/i);
    if (classMatch) {
      size = classMatch[0].trim();
      isSizeInferred = true;
    } else {
      const nurseryMatch = cleanName.match(/\b(Nursery|LKG|UKG)\b/i);
      if (nurseryMatch) {
        size = nurseryMatch[1].trim();
        isSizeInferred = true;
      }
    }

    // 2. Check for clothing sizes at the end of the item name:
    // e.g. "Size 28", "Size: 30", "- 32", "34", "XL", "XXL", "Free Size"
    if (!size) {
      const sizeAtEndRegex = /(?:[\s\-–—/,(]+)(?:size|no|num|#)?\s*[:.-]?\s*([0-9]{1,3}(?:\.[0-9]+)?|[0-9]{1,2}-[0-9]{1,2}|XXS|XS|S|M|L|XL|XXL|XXXL|FREE|STD|REGULAR)\s*\)?$/i;
      const match = cleanName.match(sizeAtEndRegex);
      if (match && match[1]) {
        size = match[1].trim().toUpperCase();
        isSizeInferred = true;
        // Clean trailing size token from candidate category/name if needed
        cleanName = cleanName.replace(sizeAtEndRegex, '').trim();
      }
    }

    // 3. Trailing pure number (e.g. "Full Pant 28" -> 28)
    if (!size) {
      const trailingNumRegex = /(?:[\s\-–—/]+)(\d{2,3})\s*$/;
      const numMatch = cleanName.match(trailingNumRegex);
      if (numMatch && numMatch[1]) {
        size = numMatch[1].trim();
        isSizeInferred = true;
        cleanName = cleanName.replace(trailingNumRegex, '').trim();
      }
    }
  }

  // If category is missing, infer it from the remaining cleanName or rawItemName
  if (!category) {
    let candidate = cleanName;

    // Remove any trailing dashes, slashes, brackets
    candidate = candidate.replace(/[\-–—/()]+$/, '').trim();

    // Known common school apparel/book groupings
    const knownGroups = [
      'Full Pant',
      'Half Pant',
      'Track Pant',
      'Trouser',
      'Full Shirt',
      'Half Shirt',
      'House T-Shirt',
      'T-Shirt',
      'Shirt',
      'Skirt',
      'Pleated Skirt',
      'Divided Skirt',
      'Blazer',
      'Sweater',
      'Pullover',
      'Cardigan',
      'Tie',
      'Belt',
      'Socks',
      'Shoes',
      'Salwar Suit',
      'Salwar',
      'Kurti',
      'School Bag',
      'Bag',
      'Water Bottle',
      'Notebook',
      'Register',
      'Practical File',
      'Single Line',
      'Four Line',
      'Square Grid',
      'English',
      'Hindi',
      'Mathematics',
      'Science',
      'Social Studies',
      'Sanskrit',
      'Computer',
      'Physics',
      'Chemistry',
      'Biology',
    ];

    const matchedGroup = knownGroups.find((g) =>
      candidate.toLowerCase().includes(g.toLowerCase())
    );

    if (matchedGroup) {
      category = matchedGroup;
      isCategoryInferred = true;
    } else if (candidate) {
      // Use the cleaned item name as the category name!
      // This groups all sizes of this item together:
      // e.g. "Boys Full Pant 28", "Boys Full Pant 30" -> Category: "Boys Full Pant"
      category = candidate;
      isCategoryInferred = true;
    } else {
      category = 'General';
    }
  }

  return {
    category: category.trim(),
    size: size.trim(),
    cleanName: rawItemName.trim(),
    isCategoryInferred,
    isSizeInferred,
  };
}

export interface ParsedInventoryItem {
  code: string;
  name: string;
  category: string;
  size: string;
  availableUnits: number;
  mrp: number;
  costPrice?: number;
  isCategoryInferred?: boolean;
  isSizeInferred?: boolean;
  isCodeGenerated?: boolean;
  raw: Record<string, any>;
}

/**
 * Smartly parse any inventory rows from Excel/CSV:
 * - Flexible alias matching (e.g. "Units" and "Available Units" are treated identically).
 * - Leaves absent template columns as blank or default values (does not fail).
 * - Smartly extracts category & size from item name (grouping all sizes under the same category).
 * - Generates clean SKU codes if missing.
 */
export function smartParseInventoryRows(
  rows: Record<string, any>[],
  activeDivision: 'uniform' | 'books' = 'uniform'
): {
  parsedRows: ParsedInventoryItem[];
  detectedCategories: string[];
  inferredCount: number;
} {
  const parsedRows: ParsedInventoryItem[] = [];
  const categorySet = new Set<string>();
  let inferredCount = 0;

  // Alias definitions
  const UNITS_ALIASES = [
    'available units',
    'availableunits',
    'units',
    'unit',
    'available_units',
    'available stock',
    'availablestock',
    'stock',
    'quantity',
    'qty',
    'count',
    'pcs',
    'pieces',
    'bal',
    'balance',
    'opening stock',
    'in hand',
    'total units',
    'inventory units',
  ];

  const NAME_ALIASES = [
    'item name',
    'itemname',
    'name',
    'product',
    'item',
    'title',
    'book title',
    'description',
    'particulars',
    'item_name',
    'product name',
    'productname',
  ];

  const CODE_ALIASES = [
    'item code',
    'itemcode',
    'code',
    'sku',
    'barcode',
    'id',
    'item_code',
    'product code',
    'item id',
  ];

  const CATEGORY_ALIASES = [
    'category',
    'cat',
    'group',
    'item category',
    'type',
    'item_category',
    'section',
  ];

  const SIZE_ALIASES = [
    'size',
    'sizes',
    'size variant',
    'variant',
    'dimension',
    'grade',
    'class grade',
    'class_grade',
  ];

  const MRP_ALIASES = [
    'mrp (₹)',
    'mrp(₹)',
    'mrp (rs)',
    'mrp(rs)',
    'mrp',
    'm.r.p',
    'm.r.p.',
    'price',
    'rate',
    'unit price',
    'selling price',
    'sale rate',
    'amount',
  ];

  const COST_ALIASES = [
    'cost price (₹)',
    'cost price(₹)',
    'cost price',
    'costprice',
    'cost',
    'cp',
    'c.p.',
    'purchase price',
    'buy price',
    'purchase rate',
  ];

  rows.forEach((row, index) => {
    // 1. Extract raw values using aliases
    const rawNameVal = findValueByAliases(row, NAME_ALIASES);
    const rawCodeVal = findValueByAliases(row, CODE_ALIASES);
    const rawCategoryVal = findValueByAliases(row, CATEGORY_ALIASES);
    const rawSizeVal = findValueByAliases(row, SIZE_ALIASES);
    const rawUnitsVal = findValueByAliases(row, UNITS_ALIASES);
    const rawMrpVal = findValueByAliases(row, MRP_ALIASES);
    const rawCostVal = findValueByAliases(row, COST_ALIASES);

    // If completely empty row, skip
    if (!rawNameVal && !rawCodeVal && rawUnitsVal === undefined && rawMrpVal === undefined) {
      return;
    }

    const rawName = rawNameVal ? String(rawNameVal).trim() : (rawCodeVal ? String(rawCodeVal).trim() : `Item ${index + 1}`);

    // 2. Smart Category and Size Extraction
    const extraction = smartExtractCategoryAndSize(
      rawName,
      rawCategoryVal ? String(rawCategoryVal) : undefined,
      rawSizeVal ? String(rawSizeVal) : undefined
    );

    if (extraction.isCategoryInferred || extraction.isSizeInferred) {
      inferredCount++;
    }

    const category = extraction.category || 'General';
    const size = extraction.size || ''; // Left blank if not in file or name
    categorySet.add(category);

    // 3. Units extraction (Units and Available Units are identical)
    let units = 0;
    if (rawUnitsVal !== undefined && rawUnitsVal !== null && rawUnitsVal !== '') {
      const parsedU = parseInt(String(rawUnitsVal).replace(/[^0-9\-]/g, ''), 10);
      units = isNaN(parsedU) ? 0 : Math.max(0, parsedU);
    }

    // 4. MRP extraction
    let mrp = 0;
    if (rawMrpVal !== undefined && rawMrpVal !== null && rawMrpVal !== '') {
      const parsedM = parseFloat(String(rawMrpVal).replace(/[^0-9.]/g, ''));
      mrp = isNaN(parsedM) ? 0 : Math.max(0, parsedM);
    }

    // 5. Cost price extraction (leave blank/undefined if not provided)
    let costPrice: number | undefined = undefined;
    if (rawCostVal !== undefined && rawCostVal !== null && rawCostVal !== '') {
      const parsedC = parseFloat(String(rawCostVal).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedC)) {
        costPrice = Math.max(0, parsedC);
      }
    }

    // 6. Code extraction or auto-generation
    let code = rawCodeVal ? String(rawCodeVal).trim().toUpperCase() : '';
    let isCodeGenerated = false;
    if (!code) {
      const prefix = generateCategoryPrefix(category);
      const cleanSize = size ? size.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
      const divTag = activeDivision === 'books' ? 'BK' : 'UN';
      const seq = String(index + 1).padStart(3, '0');
      code = cleanSize ? `NEPS-${divTag}-${prefix}-${cleanSize}` : `NEPS-${divTag}-${prefix}-${seq}`;
      isCodeGenerated = true;
    }

    parsedRows.push({
      code,
      name: rawName,
      category,
      size,
      availableUnits: units,
      mrp,
      costPrice,
      isCategoryInferred: extraction.isCategoryInferred,
      isSizeInferred: extraction.isSizeInferred,
      isCodeGenerated,
      raw: row,
    });
  });

  return {
    parsedRows,
    detectedCategories: Array.from(categorySet).filter(Boolean),
    inferredCount,
  };
}
/**
 * Download standard pre-formatted template for bulk live inventory import
 */
export function downloadInventoryTemplate() {
  const template = [
    {
      'Item Code': 'NEPS-PNT-28',
      'Item Name': 'Boys Full Pant - Navy Blue',
      'Category': 'Full Pant',
      'Size': '28',
      'Available Units': 35,
      'MRP (₹)': 650,
      'Cost Price (₹)': 420
    },
    {
      'Item Code': 'NEPS-SHT-30',
      'Item Name': 'Half Shirt - Sky Blue',
      'Category': 'Half Shirt',
      'Size': '30',
      'Available Units': 40,
      'MRP (₹)': 450,
      'Cost Price (₹)': 280
    },
    {
      'Item Code': 'NEPS-SKT-26',
      'Item Name': 'Pleated Skirt - Navy Blue',
      'Category': 'Skirt',
      'Size': '26',
      'Available Units': 25,
      'MRP (₹)': 550,
      'Cost Price (₹)': 350
    }
  ];
  exportToExcel(template, 'NEPS_Inventory_Template', 'Inventory_Format');
}

/**
 * Download standard pre-formatted template for stock inflows
 */
export function downloadInflowTemplate() {
  const template = [
    {
      'Date': new Date().toISOString().split('T')[0],
      'Vendor Name': 'Apex Uniform Manufacturers',
      'Item Code': 'NEPS-PNT-30',
      'Item Name': 'Boys Full Pant - Navy Blue',
      'Category': 'Full Pant',
      'Size': '30',
      'Inward Units': 50,
      'MRP (₹)': 650
    }
  ];
  exportToExcel(template, 'NEPS_Inflow_Template', 'Inflow_Format');
}

/**
 * Download standard pre-formatted template for stock outflows
 */
export function downloadOutflowTemplate() {
  const template = [
    {
      'Date': new Date().toISOString().split('T')[0],
      'Recipient Name': 'Branch 2 - Sector 12 Store',
      'Reference Slip No': 'DISP-2026-01',
      'Item Code': 'NEPS-SHT-32',
      'Item Name': 'Half Shirt - Sky Blue',
      'Category': 'Half Shirt',
      'Size': '32',
      'Outward Units': 10,
      'Reason': 'Branch Inter-Transfer'
    }
  ];
  exportToExcel(template, 'NEPS_Outflow_Template', 'Outflow_Format');
}
