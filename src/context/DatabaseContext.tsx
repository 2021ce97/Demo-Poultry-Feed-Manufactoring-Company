import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  DatabaseState, 
  Language, 
  RawMaterialItem, 
  Supplier, 
  Customer, 
  Sale, 
  Expense, 
  UnitType,
  AuthUser
} from '../types';
import { initialFactoryData } from '../initialData';
import { 
  translations, 
  getLocalizedItemName, 
  getLocalizedCategory,
  getLocalizedTransactionType,
  getLocalizedTransactionDescription 
} from '../translations';
import { authenticateOwner, OWNER_ACCOUNTS } from '../authAccounts';
import { 
  FACTORY_DB_KEY, 
  loadLocalFactoryDB, 
  saveLocalFactoryDB,
  exportFullBackupJSON,
  importFullBackupJSON,
  downloadSQLDump,
  generateExtraFactoryData
} from '../lib/localDatabase';

const LANG_STORAGE_KEY = 'mahir_poultry_feed_lang';
const THRESHOLD_STORAGE_KEY = 'mahir_poultry_feed_threshold';
const AUTH_USER_STORAGE_KEY = 'al_makkah_auth_user';

interface DatabaseContextType {
  // Factory State
  db: DatabaseState;

  // Language & Localization
  lang: Language;
  t: typeof translations['fa'];
  setLang: (lang: Language) => void;
  getLocalizedName: (name: string) => string;
  getLocalizedCat: (cat: string) => string;
  getLocalizedTxType: (type: string) => string;
  getLocalizedTxDesc: (desc: string) => string;

  // Authentication
  user: AuthUser | null;
  isAuthLoading: boolean;
  isDatabaseLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  quickLoginAsDirector: () => void;

  // Low Stock Notification Threshold
  lowStockThreshold: number;
  setLowStockThreshold: (threshold: number) => void;
  updateRawMaterialThreshold: (id: string, threshold: number) => void;
  lowStockMaterials: RawMaterialItem[];
  isSupabaseConnected: boolean;

  // Inventory & Suppliers
  addRawMaterial: (
    item: Omit<RawMaterialItem, 'id' | 'dateAdded'>, 
    paidAmount: number, 
    supplierPhone?: string
  ) => void;
  restockRawMaterial: (params: {
    materialId: string;
    addedWeightKg: number;
    newUnitPrice: number;
    supplierName?: string;
    supplierPhone?: string;
    paidAmount: number;
    notes?: string;
    updateAvgCost?: boolean;
  }) => { success: boolean; error?: string };
  deleteRawMaterial: (id: string) => void;
  settleSupplierPayment: (supplierId: string, amountToPay: number, note?: string) => void;
  deleteSupplier: (supplierId: string) => void;

  // Formulation & Production
  saveFormulaTemplate: (
    name: string,
    ingredients: { rawMaterialId: string; weightKg: number }[],
    description?: string,
    formulaIdToUpdate?: string
  ) => { success: boolean; formulaId: string };
  createFormulaAndProduce: (
    name: string,
    ingredients: { rawMaterialId: string; weightKg: number }[],
    description?: string,
    operatorName?: string,
    produceBatchImmediately?: boolean,
    batchExpenses?: number
  ) => { success: boolean; error?: string };
  deleteFormula: (formulaId: string) => void;

  // Sales & Customers
  recordSale: (saleData: {
    productId?: string;
    productName: string;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    unitType: UnitType;
    unitQuantity: number;
    salePricePerUnit: number;
    paidAmount: number;
    notes?: string;
  }) => { success: boolean; error?: string };
  receiveCustomerPayment: (customerId: string, amount: number, note?: string) => void;
  deleteCustomer: (customerId: string) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  deleteExpense: (id: string) => void;

  // Local Database Management & Backup
  exportDatabase: () => void;
  importDatabase: (jsonData: string) => boolean;
  exportSQL: () => void;
  seedExtraData: () => void;
  resetToDefaultData: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language setup - default to Dari ('fa')
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return (saved === 'fa' || saved === 'ps' || saved === 'en') ? (saved as Language) : 'fa';
  });

  // Auth User
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Failed to load auth user from localStorage:', e);
    }
    // Auto-login as Director Eng. Rayan with rayan.af@gmail.com
    const director = OWNER_ACCOUNTS.find(a => a.username === 'rayan');
    if (director) {
      return {
        email: director.email,
        username: director.username,
        name: director.name,
        role: director.role,
        roleId: director.roleId,
        phone: director.phone,
        loginTime: new Date().toISOString(),
      };
    }
    return null;
  });

  const [isAuthLoading] = useState(false);
  const [isDatabaseLoading] = useState(false);
  const [isSupabaseConnected] = useState(false);

  // Low Stock Threshold
  const [lowStockThreshold, setLowStockThresholdState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(THRESHOLD_STORAGE_KEY);
      if (saved) {
        const num = Number(saved);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch (e) {
      console.error(e);
    }
    return 5000;
  });

  const setLowStockThreshold = (threshold: number) => {
    const safeVal = Math.max(100, Number(threshold) || 1000);
    setLowStockThresholdState(safeVal);
    try {
      localStorage.setItem(THRESHOLD_STORAGE_KEY, safeVal.toString());
    } catch (e) {
      console.error(e);
    }
  };

  // Factory Database State (Persistent Local)
  const [db, setDb] = useState<DatabaseState>(() => loadLocalFactoryDB());

  // Auto-save DB on updates
  useEffect(() => {
    saveLocalFactoryDB(db);
  }, [db]);

  // Set Language
  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, newLang);
    } catch (e) {
      console.error(e);
    }
  };

  // Active translation dictionary
  const t = translations[lang] || translations.fa;

  // Localization helpers
  const getLocalizedName = (name: string) => getLocalizedItemName(name, lang);
  const getLocalizedCat = (cat: string) => getLocalizedCategory(cat, lang);
  const getLocalizedTxType = (type: string) => getLocalizedTransactionType(type, lang);
  const getLocalizedTxDesc = (desc: string) => getLocalizedTransactionDescription(desc, lang);

  // Authentication
  const login = async (emailInput: string, passInput: string): Promise<{ success: boolean; error?: string }> => {
    const owner = authenticateOwner(emailInput, passInput);
    if (owner) {
      setUser(owner);
      try {
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(owner));
      } catch (e) {
        console.error(e);
      }
      return { success: true };
    }
    return { success: false, error: t.invalidCredentials };
  };

  const logout = async () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const quickLoginAsDirector = () => {
    const director = OWNER_ACCOUNTS.find(a => a.username === 'rayan');
    if (director) {
      const authUser: AuthUser = {
        email: director.email,
        username: director.username,
        name: director.name,
        role: director.role,
        roleId: director.roleId,
        phone: director.phone,
        loginTime: new Date().toISOString(),
      };
      setUser(authUser);
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(authUser));
    }
  };

  // Low stock materials computation
  const lowStockMaterials = db.rawMaterials.filter(
    m => m.stockKg <= (m.lowStockThreshold || lowStockThreshold)
  );

  const updateRawMaterialThreshold = (id: string, threshold: number) => {
    setDb(prev => ({
      ...prev,
      rawMaterials: prev.rawMaterials.map(m =>
        m.id === id ? { ...m, lowStockThreshold: threshold } : m
      ),
    }));
  };

  // -------------------------------------------------------------
  // Factory Operations (Raw materials, formulations, batches)
  // -------------------------------------------------------------

  const addRawMaterial = (
    item: Omit<RawMaterialItem, 'id' | 'dateAdded'>, 
    paidAmount: number, 
    supplierPhone?: string
  ) => {
    const newItemId = `rm-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const totalCost = item.stockKg * item.unitPrice;
    const remainingAmount = Math.max(0, totalCost - paidAmount);

    let updatedSuppliers = [...db.suppliers];
    let matchedSupplierId = item.supplierId;

    if (item.supplierName && item.supplierName.trim()) {
      const existing = updatedSuppliers.find(
        s => s.name.toLowerCase() === item.supplierName!.trim().toLowerCase()
      );

      const tx: any = {
        id: `stx-${Date.now()}`,
        date: dateStr,
        type: 'purchase',
        description: `خرید ${item.name} (${item.stockKg} kg)`,
        amount: totalCost,
        paidAmount,
        remainingAmount,
        handledBy: user?.name || 'مدیر سیستم',
      };

      if (existing) {
        matchedSupplierId = existing.id;
        updatedSuppliers = updatedSuppliers.map(s => {
          if (s.id === existing.id) {
            return {
              ...s,
              phone: supplierPhone || s.phone,
              totalPurchasedAmount: s.totalPurchasedAmount + totalCost,
              totalPaid: s.totalPaid + paidAmount,
              balanceOwed: s.balanceOwed + remainingAmount,
              transactions: [tx, ...s.transactions],
            };
          }
          return s;
        });
      } else {
        matchedSupplierId = `sup-${Date.now()}`;
        const newSup: Supplier = {
          id: matchedSupplierId,
          name: item.supplierName.trim(),
          phone: supplierPhone || '0700000000',
          totalPurchasedAmount: totalCost,
          totalPaid: paidAmount,
          balanceOwed: remainingAmount,
          transactions: [tx],
          createdAt: dateStr,
        };
        updatedSuppliers = [newSup, ...updatedSuppliers];
      }
    }

    const newItem: RawMaterialItem = {
      ...item,
      id: newItemId,
      dateAdded: dateStr,
      supplierId: matchedSupplierId,
    };

    setDb(prev => ({
      ...prev,
      rawMaterials: [newItem, ...prev.rawMaterials],
      suppliers: updatedSuppliers,
      cashInHand: Math.max(0, prev.cashInHand - paidAmount),
    }));
  };

  const restockRawMaterial = (params: {
    materialId: string;
    addedWeightKg: number;
    newUnitPrice: number;
    supplierName?: string;
    supplierPhone?: string;
    paidAmount: number;
    notes?: string;
    updateAvgCost?: boolean;
  }) => {
    const target = db.rawMaterials.find(m => m.id === params.materialId);
    if (!target) return { success: false, error: 'جنس مورد نظر یافت نشد!' };

    const totalCost = params.addedWeightKg * params.newUnitPrice;
    const remainingAmount = Math.max(0, totalCost - params.paidAmount);
    const dateStr = new Date().toISOString().split('T')[0];

    const currentTotalWeight = target.stockKg;
    const newTotalWeight = currentTotalWeight + params.addedWeightKg;
    let computedUnitPrice = target.unitPrice;

    if (params.updateAvgCost && newTotalWeight > 0) {
      computedUnitPrice = Math.round(
        ((target.unitPrice * currentTotalWeight) + (params.newUnitPrice * params.addedWeightKg)) / newTotalWeight
      );
    } else {
      computedUnitPrice = params.newUnitPrice;
    }

    let updatedSuppliers = [...db.suppliers];
    const supName = params.supplierName || target.supplierName;
    if (supName) {
      const existing = updatedSuppliers.find(
        s => s.name.toLowerCase() === supName.toLowerCase()
      );
      const tx: any = {
        id: `stx-${Date.now()}`,
        date: dateStr,
        type: 'purchase',
        description: `اکمال ${target.name} (${params.addedWeightKg} kg)`,
        amount: totalCost,
        paidAmount: params.paidAmount,
        remainingAmount,
        handledBy: user?.name || 'مدیر سیستم',
      };

      if (existing) {
        updatedSuppliers = updatedSuppliers.map(s => {
          if (s.id === existing.id) {
            return {
              ...s,
              phone: params.supplierPhone || s.phone,
              totalPurchasedAmount: s.totalPurchasedAmount + totalCost,
              totalPaid: s.totalPaid + params.paidAmount,
              balanceOwed: s.balanceOwed + remainingAmount,
              transactions: [tx, ...s.transactions],
            };
          }
          return s;
        });
      }
    }

    setDb(prev => ({
      ...prev,
      rawMaterials: prev.rawMaterials.map(m => {
        if (m.id === params.materialId) {
          return {
            ...m,
            stockKg: newTotalWeight,
            unitPrice: computedUnitPrice,
            supplierName: supName,
            notes: params.notes || m.notes,
          };
        }
        return m;
      }),
      suppliers: updatedSuppliers,
      cashInHand: Math.max(0, prev.cashInHand - params.paidAmount),
    }));

    return { success: true };
  };

  const deleteRawMaterial = (id: string) => {
    setDb(prev => ({
      ...prev,
      rawMaterials: prev.rawMaterials.filter(m => m.id !== id),
    }));
  };

  const settleSupplierPayment = (supplierId: string, amountToPay: number, note?: string) => {
    const target = db.suppliers.find(s => s.id === supplierId);
    if (!target || amountToPay <= 0) return;

    const dateStr = new Date().toISOString().split('T')[0];
    const tx: any = {
      id: `stx-${Date.now()}`,
      date: dateStr,
      type: 'payment',
      description: note || `پرداخت نقدی به تامین‌کننده`,
      amount: amountToPay,
      paidAmount: amountToPay,
      remainingAmount: 0,
      handledBy: user?.name || 'مدیر سیستم',
    };

    setDb(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => {
        if (s.id === supplierId) {
          return {
            ...s,
            totalPaid: s.totalPaid + amountToPay,
            balanceOwed: Math.max(0, s.balanceOwed - amountToPay),
            transactions: [tx, ...s.transactions],
          };
        }
        return s;
      }),
      cashInHand: Math.max(0, prev.cashInHand - amountToPay),
    }));
  };

  const deleteSupplier = (supplierId: string) => {
    setDb(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== supplierId),
    }));
  };

  // -------------------------------------------------------------
  // Formulation & Production
  // -------------------------------------------------------------

  const saveFormulaTemplate = (
    name: string,
    ingredients: { rawMaterialId: string; weightKg: number }[],
    description?: string,
    formulaIdToUpdate?: string
  ) => {
    const enriched = ingredients.map(ing => {
      const mat = db.rawMaterials.find(m => m.id === ing.rawMaterialId);
      const costPerKg = mat?.unitPrice || 0;
      return {
        rawMaterialId: ing.rawMaterialId,
        rawMaterialName: mat?.name || 'ناشناخته',
        weightKg: ing.weightKg,
        costPerKg,
        totalCost: ing.weightKg * costPerKg,
      };
    });

    const totalWeight = enriched.reduce((sum, i) => sum + i.weightKg, 0);
    const totalCost = enriched.reduce((sum, i) => sum + i.totalCost, 0);
    const costPerKg = totalWeight > 0 ? Math.round((totalCost / totalWeight) * 10) / 10 : 0;
    const formulaId = formulaIdToUpdate || `form-${Date.now()}`;

    const newFormula = {
      id: formulaId,
      name,
      description,
      ingredients: enriched,
      totalWeightKg: totalWeight,
      totalBatchCost: totalCost,
      costPerKg,
      createdDate: new Date().toISOString().split('T')[0],
    };

    setDb(prev => {
      const exists = prev.formulas.some(f => f.id === formulaId);
      return {
        ...prev,
        formulas: exists
          ? prev.formulas.map(f => (f.id === formulaId ? newFormula : f))
          : [newFormula, ...prev.formulas],
      };
    });

    return { success: true, formulaId };
  };

  const createFormulaAndProduce = (
    name: string,
    ingredients: { rawMaterialId: string; weightKg: number }[],
    description?: string,
    operatorName?: string,
    produceBatchImmediately = true,
    batchExpenses = 0
  ) => {
    // Check ingredient stock availability
    for (const ing of ingredients) {
      const mat = db.rawMaterials.find(m => m.id === ing.rawMaterialId);
      if (!mat || mat.stockKg < ing.weightKg) {
        return {
          success: false,
          error: `موجودی جنس "${mat?.name || 'ناشناخته'}" برای این دسته کافی نیست!`,
        };
      }
    }

    const { formulaId } = saveFormulaTemplate(name, ingredients, description);

    if (produceBatchImmediately) {
      const enriched = ingredients.map(ing => {
        const mat = db.rawMaterials.find(m => m.id === ing.rawMaterialId);
        const costPerKg = mat?.unitPrice || 0;
        return {
          rawMaterialId: ing.rawMaterialId,
          rawMaterialName: mat?.name || 'ناشناخته',
          weightKg: ing.weightKg,
          costPerKg,
          totalCost: ing.weightKg * costPerKg,
        };
      });

      const totalWeight = enriched.reduce((sum, i) => sum + i.weightKg, 0);
      const totalCost = enriched.reduce((sum, i) => sum + i.totalCost, 0) + batchExpenses;
      const costPerKg = totalWeight > 0 ? Math.round((totalCost / totalWeight) * 10) / 10 : 0;
      const dateStr = new Date().toISOString().split('T')[0];

      const batch = {
        id: `pb-${Date.now()}`,
        formulaId,
        formulaName: name,
        date: dateStr,
        totalWeightKg: totalWeight,
        costPerKg,
        totalCost,
        operatorName: operatorName || user?.name || 'اپراتور خط تولید',
        notes: description,
      };

      setDb(prev => {
        // Deduct raw materials
        const updatedMaterials = prev.rawMaterials.map(mat => {
          const used = ingredients.find(i => i.rawMaterialId === mat.id);
          if (used) {
            return { ...mat, stockKg: Math.max(0, mat.stockKg - used.weightKg) };
          }
          return mat;
        });

        // Add to processed stock
        const existingStockIndex = prev.processedStock.findIndex(
          p => p.formulaId === formulaId || p.name.toLowerCase() === name.toLowerCase()
        );
        let updatedStock = [...prev.processedStock];

        if (existingStockIndex >= 0) {
          const item = updatedStock[existingStockIndex];
          const newWeight = item.stockKg + totalWeight;
          const avgCost = newWeight > 0
            ? Math.round(((item.averageCostPerKg * item.stockKg) + totalCost) / newWeight * 10) / 10
            : costPerKg;
          updatedStock[existingStockIndex] = {
            ...item,
            stockKg: newWeight,
            averageCostPerKg: avgCost,
            lastUpdated: dateStr,
          };
        } else {
          updatedStock.push({
            id: `ps-${Date.now()}`,
            name,
            formulaId,
            stockKg: totalWeight,
            averageCostPerKg: costPerKg,
            lastUpdated: dateStr,
          });
        }

        return {
          ...prev,
          rawMaterials: updatedMaterials,
          productionBatches: [batch, ...prev.productionBatches],
          processedStock: updatedStock,
          cashInHand: Math.max(0, prev.cashInHand - batchExpenses),
        };
      });
    }

    return { success: true };
  };

  const deleteFormula = (formulaId: string) => {
    setDb(prev => ({
      ...prev,
      formulas: prev.formulas.filter(f => f.id !== formulaId),
    }));
  };

  // -------------------------------------------------------------
  // Sales & Customers
  // -------------------------------------------------------------

  const recordSale = (saleData: {
    productId?: string;
    productName: string;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    unitType: UnitType;
    unitQuantity: number;
    salePricePerUnit: number;
    paidAmount: number;
    notes?: string;
  }) => {
    // Weight calculation: 1 bag = 50kg, 1 ton = 1000kg
    const kgMultiplier = saleData.unitType === 'bag' ? 50 : saleData.unitType === 'ton' ? 1000 : 1;
    const totalWeightKg = saleData.unitQuantity * kgMultiplier;
    const totalAmount = saleData.unitQuantity * saleData.salePricePerUnit;
    const remainingAmount = Math.max(0, totalAmount - saleData.paidAmount);
    const dateStr = new Date().toISOString().split('T')[0];

    // Find stock cost rate
    const stockItem = db.processedStock.find(
      p => p.id === saleData.productId || p.name.toLowerCase() === saleData.productName.toLowerCase()
    );
    const costRatePerKg = stockItem?.averageCostPerKg || 30;
    const totalCostOfGoods = totalWeightKg * costRatePerKg;
    const profit = totalAmount - totalCostOfGoods;

    let updatedCustomers = [...db.customers];
    let matchedCustomerId = saleData.customerId;

    if (saleData.customerName.trim()) {
      const existing = updatedCustomers.find(
        c => c.name.toLowerCase() === saleData.customerName.trim().toLowerCase()
      );
      const tx: any = {
        id: `ctx-${Date.now()}`,
        date: dateStr,
        type: 'sale',
        description: `فروش ${saleData.productName} (${saleData.unitQuantity} ${saleData.unitType})`,
        amount: totalAmount,
        paidAmount: saleData.paidAmount,
        remainingAmount,
        handledBy: user?.name || 'مدیر فروشات',
      };

      if (existing) {
        matchedCustomerId = existing.id;
        updatedCustomers = updatedCustomers.map(c => {
          if (c.id === existing.id) {
            return {
              ...c,
              phone: saleData.customerPhone || c.phone,
              totalPurchasedAmount: c.totalPurchasedAmount + totalAmount,
              totalPaid: c.totalPaid + saleData.paidAmount,
              balanceOwed: c.balanceOwed + remainingAmount,
              transactions: [tx, ...c.transactions],
            };
          }
          return c;
        });
      } else {
        matchedCustomerId = `cust-${Date.now()}`;
        const newCust: Customer = {
          id: matchedCustomerId,
          name: saleData.customerName.trim(),
          phone: saleData.customerPhone || '0700000000',
          totalPurchasedAmount: totalAmount,
          totalPaid: saleData.paidAmount,
          balanceOwed: remainingAmount,
          transactions: [tx],
          createdAt: dateStr,
        };
        updatedCustomers = [newCust, ...updatedCustomers];
      }
    }

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      date: dateStr,
      customerId: matchedCustomerId || 'unknown',
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      productId: saleData.productId || 'custom',
      productName: saleData.productName,
      unitType: saleData.unitType,
      unitQuantity: saleData.unitQuantity,
      quantityKg: totalWeightKg,
      salePricePerUnit: saleData.salePricePerUnit,
      totalAmount,
      costRatePerKg,
      totalCostOfGoods,
      profit,
      paidAmount: saleData.paidAmount,
      remainingAmount,
      notes: saleData.notes,
    };

    setDb(prev => {
      const updatedStock = prev.processedStock.map(p => {
        if (p.id === saleData.productId || p.name.toLowerCase() === saleData.productName.toLowerCase()) {
          return { ...p, stockKg: Math.max(0, p.stockKg - totalWeightKg) };
        }
        return p;
      });

      return {
        ...prev,
        sales: [newSale, ...prev.sales],
        customers: updatedCustomers,
        processedStock: updatedStock,
        cashInHand: prev.cashInHand + saleData.paidAmount,
      };
    });

    return { success: true };
  };

  const receiveCustomerPayment = (customerId: string, amount: number, note?: string) => {
    const target = db.customers.find(c => c.id === customerId);
    if (!target || amount <= 0) return;

    const dateStr = new Date().toISOString().split('T')[0];
    const tx: any = {
      id: `ctx-${Date.now()}`,
      date: dateStr,
      type: 'payment_received',
      description: note || `تصفیه طلبات مشتری`,
      amount,
      paidAmount: amount,
      remainingAmount: 0,
      handledBy: user?.name || 'مدیر سیستم',
    };

    setDb(prev => ({
      ...prev,
      customers: prev.customers.map(c => {
        if (c.id === customerId) {
          return {
            ...c,
            totalPaid: c.totalPaid + amount,
            balanceOwed: Math.max(0, c.balanceOwed - amount),
            transactions: [tx, ...c.transactions],
          };
        }
        return c;
      }),
      cashInHand: prev.cashInHand + amount,
    }));
  };

  const deleteCustomer = (customerId: string) => {
    setDb(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== customerId),
    }));
  };

  // -------------------------------------------------------------
  // Expenses
  // -------------------------------------------------------------

  const addExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      paidBy: expense.paidBy || user?.name || 'مسئول مالی',
    };

    setDb(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      cashInHand: Math.max(0, prev.cashInHand - expense.amount),
    }));
  };

  const deleteExpense = (id: string) => {
    setDb(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id),
    }));
  };

  // -------------------------------------------------------------
  // Local Database Backup, Import, SQL & Data Seeding
  // -------------------------------------------------------------

  const exportDatabase = () => {
    exportFullBackupJSON(db);
  };

  const importDatabase = (jsonData: string): boolean => {
    const res = importFullBackupJSON(jsonData);
    if (res.success && res.factory) {
      setDb(res.factory);
      return true;
    }
    return false;
  };

  const exportSQL = () => {
    downloadSQLDump(db);
  };

  const seedExtraData = () => {
    setDb(prev => generateExtraFactoryData(prev));
  };

  const resetToDefaultData = () => {
    setDb(initialFactoryData);
    localStorage.removeItem(FACTORY_DB_KEY);
  };

  return (
    <DatabaseContext.Provider
      value={{
        db,
        lang,
        t,
        setLang,
        getLocalizedName,
        getLocalizedCat,
        getLocalizedTxType,
        getLocalizedTxDesc,
        user,
        isAuthLoading,
        isDatabaseLoading,
        login,
        logout,
        quickLoginAsDirector,
        lowStockThreshold,
        setLowStockThreshold,
        updateRawMaterialThreshold,
        lowStockMaterials,
        isSupabaseConnected,
        addRawMaterial,
        restockRawMaterial,
        deleteRawMaterial,
        settleSupplierPayment,
        deleteSupplier,
        saveFormulaTemplate,
        createFormulaAndProduce,
        deleteFormula,
        recordSale,
        receiveCustomerPayment,
        deleteCustomer,
        addExpense,
        deleteExpense,
        exportDatabase,
        importDatabase,
        exportSQL,
        seedExtraData,
        resetToDefaultData,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
