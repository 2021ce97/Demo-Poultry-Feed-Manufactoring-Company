export type Language = 'fa' | 'ps' | 'en';

export interface RawMaterialItem {
  id: string;
  name: string;
  category: string;
  stockKg: number;
  unitPrice: number; // Cost per kg in AFN (or local currency)
  supplierId?: string;
  supplierName?: string;
  dateAdded: string;
  notes?: string;
  lowStockThreshold?: number;
}

export interface SupplierTransaction {
  id: string;
  date: string;
  type: 'purchase' | 'payment';
  description: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  handledBy?: string; // which owner/account recorded or gave the money
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalPurchasedAmount: number;
  totalPaid: number;
  balanceOwed: number; // money we owe to supplier
  transactions: SupplierTransaction[];
  createdAt: string;
}

export interface FormulaIngredient {
  rawMaterialId: string;
  rawMaterialName: string;
  weightKg: number;
  costPerKg: number;
  totalCost: number;
}

export interface Formula {
  id: string;
  name: string;
  description?: string;
  ingredients: FormulaIngredient[];
  totalWeightKg: number;
  totalBatchCost: number;
  costPerKg: number; // production cost per kg
  createdDate: string;
}

export interface ProductionBatch {
  id: string;
  formulaId: string;
  formulaName: string;
  date: string;
  totalWeightKg: number;
  costPerKg: number;
  totalCost: number;
  operatorName?: string;
  notes?: string;
}

export interface ProcessedStockItem {
  id: string;
  name: string;
  formulaId?: string;
  stockKg: number;
  averageCostPerKg: number;
  lastUpdated: string;
}

export interface CustomerTransaction {
  id: string;
  date: string;
  type: 'sale' | 'payment_received';
  description: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  handledBy?: string; // which owner/account received the money
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalPurchasedAmount: number;
  totalPaid: number;
  balanceOwed: number; // money customer owes to us
  transactions: CustomerTransaction[];
  createdAt: string;
}

export type UnitType = 'kg' | 'bag' | 'ton';

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  productId: string;
  productName: string;
  unitType: UnitType;
  unitQuantity: number;
  quantityKg: number; // 1 bag = 50 kg, 1 ton = 1000 kg
  salePricePerUnit: number;
  totalAmount: number;
  costRatePerKg: number;
  totalCostOfGoods: number;
  profit: number;
  paidAmount: number;
  remainingAmount: number; // Debt customer owes
  notes?: string;
}

export type ExpenseCategory = 
  | 'fuel'
  | 'salary'
  | 'food'
  | 'electricity'
  | 'maintenance'
  | 'transport'
  | 'rent'
  | 'other';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidBy?: string;
  notes?: string;
}

export interface DatabaseState {
  rawMaterials: RawMaterialItem[];
  processedStock: ProcessedStockItem[];
  suppliers: Supplier[];
  customers: Customer[];
  formulas: Formula[];
  productionBatches: ProductionBatch[];
  sales: Sale[];
  expenses: Expense[];
  cashInHand: number;
}

export type OwnerRoleId = 'owner_one' | 'owner_two' | 'admin' | 'guest';

export interface AuthUser {
  email: string;
  username: string;
  name: string;
  role: string;
  roleId: OwnerRoleId;
  phone?: string;
  loginTime: string;
}
