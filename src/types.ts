export type SizeVariant = string;

export type Division = 'uniform' | 'books';

export const ALL_CLASSES = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
] as const;

export type SchoolClass = typeof ALL_CLASSES[number];

export interface ItemVariant {
  id: string;
  code: string;
  name: string;
  category: string;
  size: string; // Size for uniform (e.g. '28', 'M'), or Class / Grade / Spec for books (e.g. 'Class 5', '172 Pgs', 'Junior')
  availableUnits: number;
  mrp: number;
  costPrice?: number;
  minStockAlert?: number;
  updatedAt: string;
  division?: Division;
  // Book specific optional attributes
  subject?: string;
  classGrade?: string;
  isbn?: string;
  publisher?: string;
  isSyllabusBook?: boolean;
}

export interface CategoryInfo {
  id: string;
  name: string;
  codePrefix: string;
  description?: string;
  division?: Division;
}

export interface POSCartItem {
  itemVariantId: string;
  code: string;
  name: string;
  category: string;
  size: string;
  mrp: number;
  quantity: number;
  subtotal: number;
  maxStock: number;
  division?: Division;
  subject?: string;
  classGrade?: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Net Banking';
export type DiscountType = 'flat' | 'percent';

export interface ExchangeReturnLog {
  id: string;
  date: string;
  time: string;
  type: 'Exchange' | 'Refund';
  originalVariantId: string;
  originalItemCode: string;
  originalItemName: string;
  originalSize: string;
  quantity: number;
  originalRate: number;
  replacementVariantId?: string;
  replacementItemCode?: string;
  replacementItemName?: string;
  replacementSize?: string;
  replacementRate?: number;
  priceDifference?: number; // > 0: collected from student, < 0: refunded to student
  refundAmount?: number;
  refundPaymentMode?: PaymentMode;
  reason: string;
}

export interface StudentSaleRecord {
  id: string;
  invoiceNo: string;
  date: string;
  time: string;
  cashierName: string;
  studentName: string;
  studentClass: string;
  rollNoAdmission: string;
  contactNo: string;
  items: POSCartItem[];
  grossTotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  netAmount: number;
  paymentMode: PaymentMode;
  notes?: string;
  createdAt: string;
  exchangeLogs?: ExchangeReturnLog[];
  division?: Division;
}

export interface StockInflowRecord {
  id: string;
  date: string;
  vendorName: string;
  itemCode: string;
  itemName: string;
  category: string;
  size: string;
  units: number;
  mrp?: number;
  createdAt: string;
  division?: Division;
}

export interface StockOutflowRecord {
  id: string;
  date: string;
  recipient: string;
  referenceSlipNo: string;
  itemCode: string;
  itemName: string;
  category: string;
  size: string;
  units: number;
  reason: string;
  createdAt: string;
  division?: Division;
}

export type DeadStockStatus = 'Damaged' | 'Pending Replacement' | 'Replaced by Vendor' | 'Written Off';

export interface DeadStockRecord {
  id: string;
  date: string;
  itemCode: string;
  itemName: string;
  category: string;
  size: string;
  defectReason: string;
  units: number;
  mrp: number;
  estimatedLoss: number;
  status: DeadStockStatus;
  vendorName?: string;
  replacementDate?: string;
  createdAt: string;
  division?: Division;
}

export type OriginModule = 'Inventory' | 'Sales' | 'Inflow' | 'Outflow' | 'Dead Stock';

export interface RecycleBinItem {
  id: string;
  originModule: OriginModule;
  deletedAt: string;
  title: string;
  summary: string;
  originalData: any;
  stockEffectNote: string;
  division?: Division;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export type NavTab = 
  | 'pos'
  | 'inventory'
  | 'inflow'
  | 'outflow'
  | 'deadstock'
  | 'analytics'
  | 'recyclebin';
