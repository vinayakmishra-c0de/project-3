import { CategoryInfo, ItemVariant, StockInflowRecord, StockOutflowRecord, DeadStockRecord, StudentSaleRecord } from '../types';

export const INITIAL_CATEGORIES: CategoryInfo[] = [
  { id: 'cat-pant', name: 'Full Pant', codePrefix: 'PNT', description: 'Navy Blue Formal Trousers (Boys)' },
  { id: 'cat-shirt', name: 'Half Shirt', codePrefix: 'SHT', description: 'Sky Blue w/ School Crest (Unisex)' },
  { id: 'cat-skirt', name: 'Skirt', codePrefix: 'SKT', description: 'Box Pleated Navy Blue Skirt (Girls)' },
  { id: 'cat-blazer', name: 'Blazer', codePrefix: 'BLZ', description: 'Navy Blue Wool Blend with Embroidered Crest' },
  { id: 'cat-track', name: 'Track Suit', codePrefix: 'TRK', description: 'Sports Track Pants & Jacket Set' },
  { id: 'cat-house', name: 'House T-Shirt', codePrefix: 'HTS', description: 'Cotton Sports T-Shirt (Red, Blue, Green, Gold)' },
  { id: 'cat-tiebelt', name: 'Tie & Belt', codePrefix: 'TAB', description: 'School Crest Tie and Elastic Webbed Belt' },
  { id: 'cat-socks', name: 'Socks & Footwear', codePrefix: 'SCK', description: 'Ribbed Cotton Navy Socks with Dual White Stripes' },
];

export const INITIAL_INVENTORY: ItemVariant[] = [
  // Full Pant
  { id: 'inv-pnt-24', code: 'NEPS-PNT-24', name: 'Navy Blue Formal Pant', category: 'Full Pant', size: '24', availableUnits: 28, mrp: 580, costPrice: 380, minStockAlert: 5, updatedAt: '2026-10-20' },
  { id: 'inv-pnt-26', code: 'NEPS-PNT-26', name: 'Navy Blue Formal Pant', category: 'Full Pant', size: '26', availableUnits: 34, mrp: 620, costPrice: 400, minStockAlert: 5, updatedAt: '2026-10-20' },
  { id: 'inv-pnt-28', code: 'NEPS-PNT-28', name: 'Navy Blue Formal Pant', category: 'Full Pant', size: '28', availableUnits: 42, mrp: 650, costPrice: 420, minStockAlert: 8, updatedAt: '2026-10-21' },
  { id: 'inv-pnt-30', code: 'NEPS-PNT-30', name: 'Navy Blue Formal Pant', category: 'Full Pant', size: '30', availableUnits: 19, mrp: 680, costPrice: 440, minStockAlert: 5, updatedAt: '2026-10-22' },
  { id: 'inv-pnt-32', code: 'NEPS-PNT-32', name: 'Navy Blue Formal Pant', category: 'Full Pant', size: '32', availableUnits: 12, mrp: 720, costPrice: 460, minStockAlert: 5, updatedAt: '2026-10-22' },
  { id: 'inv-pnt-34', code: 'NEPS-PNT-34', name: 'Navy Blue Formal Pant', category: 'Full Pant', size: '34', availableUnits: 4, mrp: 750, costPrice: 480, minStockAlert: 5, updatedAt: '2026-10-23' }, // Low stock!

  // Half Shirt
  { id: 'inv-sht-26', code: 'NEPS-SHT-26', name: 'Sky Blue Half Shirt w/ Crest', category: 'Half Shirt', size: '26', availableUnits: 35, mrp: 420, costPrice: 260, minStockAlert: 5, updatedAt: '2026-10-20' },
  { id: 'inv-sht-28', code: 'NEPS-SHT-28', name: 'Sky Blue Half Shirt w/ Crest', category: 'Half Shirt', size: '28', availableUnits: 40, mrp: 440, costPrice: 270, minStockAlert: 5, updatedAt: '2026-10-21' },
  { id: 'inv-sht-30', code: 'NEPS-SHT-30', name: 'Sky Blue Half Shirt w/ Crest', category: 'Half Shirt', size: '30', availableUnits: 55, mrp: 460, costPrice: 280, minStockAlert: 8, updatedAt: '2026-10-21' },
  { id: 'inv-sht-32', code: 'NEPS-SHT-32', name: 'Sky Blue Half Shirt w/ Crest', category: 'Half Shirt', size: '32', availableUnits: 25, mrp: 490, costPrice: 300, minStockAlert: 5, updatedAt: '2026-10-22' },
  { id: 'inv-sht-34', code: 'NEPS-SHT-34', name: 'Sky Blue Half Shirt w/ Crest', category: 'Half Shirt', size: '34', availableUnits: 18, mrp: 520, costPrice: 320, minStockAlert: 5, updatedAt: '2026-10-22' },
  { id: 'inv-sht-36', code: 'NEPS-SHT-36', name: 'Sky Blue Half Shirt w/ Crest', category: 'Half Shirt', size: '36', availableUnits: 3, mrp: 550, costPrice: 340, minStockAlert: 5, updatedAt: '2026-10-23' }, // Low stock!

  // Skirt
  { id: 'inv-skt-24', code: 'NEPS-SKT-24', name: 'Box Pleated Navy Skirt', category: 'Skirt', size: '24', availableUnits: 22, mrp: 520, costPrice: 330, minStockAlert: 5, updatedAt: '2026-10-19' },
  { id: 'inv-skt-26', code: 'NEPS-SKT-26', name: 'Box Pleated Navy Skirt', category: 'Skirt', size: '26', availableUnits: 30, mrp: 550, costPrice: 350, minStockAlert: 5, updatedAt: '2026-10-19' },
  { id: 'inv-skt-28', code: 'NEPS-SKT-28', name: 'Box Pleated Navy Skirt', category: 'Skirt', size: '28', availableUnits: 26, mrp: 590, costPrice: 380, minStockAlert: 5, updatedAt: '2026-10-20' },
  { id: 'inv-skt-30', code: 'NEPS-SKT-30', name: 'Box Pleated Navy Skirt', category: 'Skirt', size: '30', availableUnits: 15, mrp: 630, costPrice: 400, minStockAlert: 5, updatedAt: '2026-10-21' },
  { id: 'inv-skt-32', code: 'NEPS-SKT-32', name: 'Box Pleated Navy Skirt', category: 'Skirt', size: '32', availableUnits: 8, mrp: 670, costPrice: 430, minStockAlert: 5, updatedAt: '2026-10-22' },

  // Blazer
  { id: 'inv-blz-28', code: 'NEPS-BLZ-28', name: 'Navy Blue Embroidered Blazer', category: 'Blazer', size: '28', availableUnits: 14, mrp: 1450, costPrice: 980, minStockAlert: 4, updatedAt: '2026-10-18' },
  { id: 'inv-blz-30', code: 'NEPS-BLZ-30', name: 'Navy Blue Embroidered Blazer', category: 'Blazer', size: '30', availableUnits: 20, mrp: 1550, costPrice: 1050, minStockAlert: 4, updatedAt: '2026-10-18' },
  { id: 'inv-blz-32', code: 'NEPS-BLZ-32', name: 'Navy Blue Embroidered Blazer', category: 'Blazer', size: '32', availableUnits: 16, mrp: 1650, costPrice: 1120, minStockAlert: 4, updatedAt: '2026-10-19' },
  { id: 'inv-blz-34', code: 'NEPS-BLZ-34', name: 'Navy Blue Embroidered Blazer', category: 'Blazer', size: '34', availableUnits: 9, mrp: 1750, costPrice: 1200, minStockAlert: 4, updatedAt: '2026-10-20' },
  { id: 'inv-blz-36', code: 'NEPS-BLZ-36', name: 'Navy Blue Embroidered Blazer', category: 'Blazer', size: '36', availableUnits: 5, mrp: 1850, costPrice: 1280, minStockAlert: 4, updatedAt: '2026-10-21' },

  // Track Suit
  { id: 'inv-trk-s', code: 'NEPS-TRK-S', name: 'Sports Track Suit (Jacket + Lower)', category: 'Track Suit', size: 'S', availableUnits: 18, mrp: 950, costPrice: 620, minStockAlert: 4, updatedAt: '2026-10-15' },
  { id: 'inv-trk-m', code: 'NEPS-TRK-M', name: 'Sports Track Suit (Jacket + Lower)', category: 'Track Suit', size: 'M', availableUnits: 24, mrp: 1050, costPrice: 680, minStockAlert: 4, updatedAt: '2026-10-15' },
  { id: 'inv-trk-l', code: 'NEPS-TRK-L', name: 'Sports Track Suit (Jacket + Lower)', category: 'Track Suit', size: 'L', availableUnits: 15, mrp: 1150, costPrice: 750, minStockAlert: 4, updatedAt: '2026-10-16' },
  { id: 'inv-trk-xl', code: 'NEPS-TRK-XL', name: 'Sports Track Suit (Jacket + Lower)', category: 'Track Suit', size: 'XL', availableUnits: 7, mrp: 1250, costPrice: 820, minStockAlert: 4, updatedAt: '2026-10-16' },

  // House T-Shirt
  { id: 'inv-hts-red-m', code: 'NEPS-HTS-RED-M', name: 'House T-Shirt (Red - Tagore)', category: 'House T-Shirt', size: 'M', availableUnits: 32, mrp: 350, costPrice: 210, minStockAlert: 6, updatedAt: '2026-10-14' },
  { id: 'inv-hts-blu-m', code: 'NEPS-HTS-BLU-M', name: 'House T-Shirt (Blue - Raman)', category: 'House T-Shirt', size: 'M', availableUnits: 38, mrp: 350, costPrice: 210, minStockAlert: 6, updatedAt: '2026-10-14' },
  { id: 'inv-hts-grn-m', code: 'NEPS-HTS-GRN-M', name: 'House T-Shirt (Green - Kalam)', category: 'House T-Shirt', size: 'M', availableUnits: 29, mrp: 350, costPrice: 210, minStockAlert: 6, updatedAt: '2026-10-14' },
  { id: 'inv-hts-gld-m', code: 'NEPS-HTS-GLD-M', name: 'House T-Shirt (Gold - Shivaji)', category: 'House T-Shirt', size: 'M', availableUnits: 41, mrp: 350, costPrice: 210, minStockAlert: 6, updatedAt: '2026-10-14' },

  // Tie & Belt
  { id: 'inv-tab-jr', code: 'NEPS-TAB-JR', name: 'Junior School Tie & Elastic Belt Combo', category: 'Tie & Belt', size: 'Junior (Cl 1-5)', availableUnits: 65, mrp: 220, costPrice: 120, minStockAlert: 10, updatedAt: '2026-10-12' },
  { id: 'inv-tab-sr', code: 'NEPS-TAB-SR', name: 'Senior School Tie & Webbed Belt Combo', category: 'Tie & Belt', size: 'Senior (Cl 6-12)', availableUnits: 78, mrp: 250, costPrice: 140, minStockAlert: 10, updatedAt: '2026-10-12' },

  // Socks
  { id: 'inv-sck-s', code: 'NEPS-SCK-S', name: 'Navy Ribbed School Socks (Pair)', category: 'Socks & Footwear', size: 'Size 4-6', availableUnits: 90, mrp: 95, costPrice: 50, minStockAlert: 15, updatedAt: '2026-10-10' },
  { id: 'inv-sck-m', code: 'NEPS-SCK-M', name: 'Navy Ribbed School Socks (Pair)', category: 'Socks & Footwear', size: 'Size 7-9', availableUnits: 85, mrp: 110, costPrice: 55, minStockAlert: 15, updatedAt: '2026-10-10' },
  { id: 'inv-sck-l', code: 'NEPS-SCK-L', name: 'Navy Ribbed School Socks (Pair)', category: 'Socks & Footwear', size: 'Size 10-12', availableUnits: 60, mrp: 120, costPrice: 60, minStockAlert: 15, updatedAt: '2026-10-10' },
];

export const INITIAL_INFLOWS: StockInflowRecord[] = [
  {
    id: 'inf-001',
    date: '2026-10-18',
    vendorName: 'Apex Uniform Manufacturers Pvt Ltd',
    itemCode: 'NEPS-PNT-28',
    itemName: 'Navy Blue Formal Pant',
    category: 'Full Pant',
    size: '28',
    units: 50,
    mrp: 650,
    createdAt: '2026-10-18T10:30:00Z'
  },
  {
    id: 'inf-002',
    date: '2026-10-19',
    vendorName: 'Arvind Textile Mills Supply',
    itemCode: 'NEPS-SHT-30',
    itemName: 'Sky Blue Half Shirt w/ Crest',
    category: 'Half Shirt',
    size: '30',
    units: 60,
    mrp: 460,
    createdAt: '2026-10-19T14:15:00Z'
  },
  {
    id: 'inf-003',
    date: '2026-10-21',
    vendorName: 'Elite Embroidery & Tailors',
    itemCode: 'NEPS-BLZ-32',
    itemName: 'Navy Blue Embroidered Blazer',
    category: 'Blazer',
    size: '32',
    units: 20,
    mrp: 1650,
    createdAt: '2026-10-21T11:00:00Z'
  }
];

export const INITIAL_OUTFLOWS: StockOutflowRecord[] = [
  {
    id: 'out-001',
    date: '2026-10-19',
    recipient: 'NEPS West Campus Branch Store',
    referenceSlipNo: 'DISP/BR2/041',
    itemCode: 'NEPS-PNT-26',
    itemName: 'Navy Blue Formal Pant',
    category: 'Full Pant',
    size: '26',
    units: 10,
    reason: 'Inter-Branch Stock Transfer',
    createdAt: '2026-10-19T16:20:00Z'
  },
  {
    id: 'out-002',
    date: '2026-10-20',
    recipient: 'Physical Education & Sports Dept',
    referenceSlipNo: 'DEPT/SPORTS/09',
    itemCode: 'NEPS-TRK-M',
    itemName: 'Sports Track Suit (Jacket + Lower)',
    category: 'Track Suit',
    size: 'M',
    units: 4,
    reason: 'Faculty & Coach Demonstration Kits',
    createdAt: '2026-10-20T09:45:00Z'
  }
];

export const INITIAL_DEADSTOCK: DeadStockRecord[] = [
  {
    id: 'ds-001',
    date: '2026-10-16',
    itemCode: 'NEPS-SHT-32',
    itemName: 'Sky Blue Half Shirt w/ Crest',
    category: 'Half Shirt',
    size: '32',
    defectReason: 'Severe oil stain from factory loom & torn collar stitch',
    units: 2,
    mrp: 490,
    estimatedLoss: 980,
    status: 'Pending Replacement',
    vendorName: 'Arvind Textile Mills Supply',
    createdAt: '2026-10-16T11:20:00Z'
  },
  {
    id: 'ds-002',
    date: '2026-10-17',
    itemCode: 'NEPS-PNT-30',
    itemName: 'Navy Blue Formal Pant',
    category: 'Full Pant',
    size: '30',
    defectReason: 'Misaligned zipper teeth and broken belt loop',
    units: 1,
    mrp: 680,
    estimatedLoss: 680,
    status: 'Damaged',
    vendorName: 'Apex Uniform Manufacturers Pvt Ltd',
    createdAt: '2026-10-17T15:40:00Z'
  }
];

export const INITIAL_SALES: StudentSaleRecord[] = [
  {
    id: 'sale-001',
    invoiceNo: 'INV-2026-001',
    date: '2026-10-22',
    time: '10:15 AM',
    cashierName: 'Store Manager',
    studentName: 'Aarav Sharma',
    studentClass: 'Grade 7 - B',
    rollNoAdmission: 'NEPS/2021/412',
    contactNo: '9876543210',
    items: [
      {
        itemVariantId: 'inv-pnt-28',
        code: 'NEPS-PNT-28',
        name: 'Navy Blue Formal Pant',
        category: 'Full Pant',
        size: '28',
        mrp: 650,
        quantity: 2,
        subtotal: 1300,
        maxStock: 42
      },
      {
        itemVariantId: 'inv-sht-30',
        code: 'NEPS-SHT-30',
        name: 'Sky Blue Half Shirt w/ Crest',
        category: 'Half Shirt',
        size: '30',
        mrp: 460,
        quantity: 2,
        subtotal: 920,
        maxStock: 55
      },
      {
        itemVariantId: 'inv-tab-sr',
        code: 'NEPS-TAB-SR',
        name: 'Senior School Tie & Webbed Belt Combo',
        category: 'Tie & Belt',
        size: 'Senior (Cl 6-12)',
        mrp: 250,
        quantity: 1,
        subtotal: 250,
        maxStock: 78
      }
    ],
    grossTotal: 2470,
    discountType: 'percent',
    discountValue: 5,
    discountAmount: 123.5,
    netAmount: 2346.5,
    paymentMode: 'UPI',
    notes: 'Sibling discount applied',
    createdAt: '2026-10-22T10:15:00Z'
  },
  {
    id: 'sale-002',
    invoiceNo: 'INV-2026-002',
    date: '2026-10-22',
    time: '11:40 AM',
    cashierName: 'Store Manager',
    studentName: 'Ananya Verma',
    studentClass: 'Grade 9 - A',
    rollNoAdmission: 'NEPS/2019/882',
    contactNo: '9822334455',
    items: [
      {
        itemVariantId: 'inv-blz-34',
        code: 'NEPS-BLZ-34',
        name: 'Navy Blue Embroidered Blazer',
        category: 'Blazer',
        size: '34',
        mrp: 1750,
        quantity: 1,
        subtotal: 1750,
        maxStock: 9
      },
      {
        itemVariantId: 'inv-skt-28',
        code: 'NEPS-SKT-28',
        name: 'Box Pleated Navy Skirt',
        category: 'Skirt',
        size: '28',
        mrp: 590,
        quantity: 1,
        subtotal: 590,
        maxStock: 26
      }
    ],
    grossTotal: 2340,
    discountType: 'flat',
    discountValue: 100,
    discountAmount: 100,
    netAmount: 2240,
    paymentMode: 'Card',
    notes: 'New academic term purchase',
    createdAt: '2026-10-22T11:40:00Z'
  },
  {
    id: 'sale-003',
    invoiceNo: 'INV-2026-003',
    date: '2026-10-23',
    time: '09:20 AM',
    cashierName: 'Store Manager',
    studentName: 'Rohan Mehra',
    studentClass: 'Grade 4 - C',
    rollNoAdmission: 'NEPS/2023/110',
    contactNo: '9711223344',
    items: [
      {
        itemVariantId: 'inv-hts-red-m',
        code: 'NEPS-HTS-RED-M',
        name: 'House T-Shirt (Red - Tagore)',
        category: 'House T-Shirt',
        size: 'M',
        mrp: 350,
        quantity: 1,
        subtotal: 350,
        maxStock: 32
      },
      {
        itemVariantId: 'inv-sck-s',
        code: 'NEPS-SCK-S',
        name: 'Navy Ribbed School Socks (Pair)',
        category: 'Socks & Footwear',
        size: 'Size 4-6',
        mrp: 95,
        quantity: 2,
        subtotal: 190,
        maxStock: 90
      }
    ],
    grossTotal: 540,
    discountType: 'flat',
    discountValue: 0,
    discountAmount: 0,
    netAmount: 540,
    paymentMode: 'Cash',
    notes: '',
    createdAt: '2026-10-23T09:20:00Z'
  }
];
