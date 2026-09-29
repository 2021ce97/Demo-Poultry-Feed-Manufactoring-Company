import { DatabaseState, RawMaterialItem, ProductionBatch, Sale, Customer, Supplier, Expense } from '../types';
import { initialFactoryData } from '../initialData';

export const FACTORY_DB_KEY = 'mahir_poultry_feed_db_v1';
const IDB_NAME = 'AlMakkahFactoryLocalDB';
const IDB_VERSION = 1;
const IDB_STORE = 'app_state';

// -------------------------------------------------------------
// IndexedDB Helper for high-resilience browser persistence
// -------------------------------------------------------------

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToIndexedDB(key: string, value: any): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IDB] IndexedDB save warning:', err);
  }
}

export async function loadFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IDB] IndexedDB read warning:', err);
    return null;
  }
}

// -------------------------------------------------------------
// Local DB Load / Save Functions
// -------------------------------------------------------------

export function loadLocalFactoryDB(): DatabaseState {
  try {
    const saved = localStorage.getItem(FACTORY_DB_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.rawMaterials)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading factory DB from localStorage:', e);
  }
  return initialFactoryData;
}

export function saveLocalFactoryDB(state: DatabaseState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(FACTORY_DB_KEY, serialized);
    saveToIndexedDB(FACTORY_DB_KEY, state);
  } catch (e) {
    console.error('Error saving factory DB to localStorage:', e);
  }
}

// -------------------------------------------------------------
// Database Backup, JSON Import/Export & SQL Generator
// -------------------------------------------------------------

export interface FactoryAppBackup {
  version: string;
  exportedAt: string;
  application: string;
  factoryDatabase: DatabaseState;
}

export function exportFullBackupJSON(factory: DatabaseState): void {
  const backup: FactoryAppBackup = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    application: 'Al-Makkah Poultry Feed Manufacturing Co. (المکه د چرګانود دانی تولیدي شرکت)',
    factoryDatabase: factory,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `AlMakkah_Factory_DB_Backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importFullBackupJSON(
  jsonText: string
): { success: boolean; error?: string; factory?: DatabaseState } {
  try {
    const data = JSON.parse(jsonText);
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'فایل JSON نامعتبر است!' };
    }

    let importedFactory: DatabaseState | undefined;

    if (data.factoryDatabase && Array.isArray(data.factoryDatabase.rawMaterials)) {
      importedFactory = data.factoryDatabase;
    } else if (Array.isArray(data.rawMaterials)) {
      importedFactory = data as DatabaseState;
    }

    if (!importedFactory) {
      return { success: false, error: 'هیچ ساختار دیتابیس معتبری در این فایل یافت نشد!' };
    }

    return {
      success: true,
      factory: importedFactory,
    };
  } catch (err: any) {
    return { success: false, error: `خطا در خواندن فایل JSON: ${err?.message || err}` };
  }
}

/**
 * Generates an ANSI SQL dump file ready to run on PostgreSQL, SQLite, or MySQL.
 */
export function generateSQLDump(factory: DatabaseState): string {
  const lines: string[] = [
    '--',
    '-- AL-MAKKAH POULTRY FEED MANUFACTURING CO. - SQL DATABASE DUMP',
    `-- Exported At: ${new Date().toISOString()}`,
    '-- Compatible with PostgreSQL, SQLite, and cloud SQL engines',
    '--',
    '',
    'BEGIN TRANSACTION;',
    '',
    '-- 1. FACTORY RAW MATERIALS TABLE',
    'CREATE TABLE IF NOT EXISTS raw_materials (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  name VARCHAR(255) NOT NULL,',
    '  category VARCHAR(100),',
    '  stock_kg NUMERIC(14,2) DEFAULT 0,',
    '  unit_price NUMERIC(14,2) DEFAULT 0,',
    '  supplier_id VARCHAR(64),',
    '  supplier_name VARCHAR(255),',
    '  date_added VARCHAR(32),',
    '  notes TEXT,',
    '  low_stock_threshold NUMERIC(14,2)',
    ');',
    '',
  ];

  for (const m of factory.rawMaterials) {
    const escNotes = (m.notes || '').replace(/'/g, "''");
    const escName = (m.name || '').replace(/'/g, "''");
    const escSup = (m.supplierName || '').replace(/'/g, "''");
    lines.push(
      `INSERT INTO raw_materials (id, name, category, stock_kg, unit_price, supplier_id, supplier_name, date_added, notes, low_stock_threshold) VALUES ('${m.id}', '${escName}', '${m.category}', ${m.stockKg}, ${m.unitPrice}, '${m.supplierId || ''}', '${escSup}', '${m.dateAdded}', '${escNotes}', ${m.lowStockThreshold || 5000}) ON CONFLICT (id) DO NOTHING;`
    );
  }

  lines.push('', '-- 2. PROCESSED STOCK');
  lines.push(
    'CREATE TABLE IF NOT EXISTS processed_stock (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  name VARCHAR(255) NOT NULL,',
    '  formula_id VARCHAR(64),',
    '  stock_kg NUMERIC(14,2) DEFAULT 0,',
    '  average_cost_per_kg NUMERIC(14,2) DEFAULT 0,',
    '  last_updated VARCHAR(32)',
    ');'
  );

  for (const p of factory.processedStock) {
    const escName = p.name.replace(/'/g, "''");
    lines.push(
      `INSERT INTO processed_stock (id, name, formula_id, stock_kg, average_cost_per_kg, last_updated) VALUES ('${p.id}', '${escName}', '${p.formulaId || ''}', ${p.stockKg}, ${p.averageCostPerKg}, '${p.lastUpdated}') ON CONFLICT (id) DO NOTHING;`
    );
  }

  lines.push('', '-- 3. CUSTOMERS');
  lines.push(
    'CREATE TABLE IF NOT EXISTS customers (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  name VARCHAR(255) NOT NULL,',
    '  phone VARCHAR(64),',
    '  address TEXT,',
    '  total_purchased NUMERIC(14,2) DEFAULT 0,',
    '  total_paid NUMERIC(14,2) DEFAULT 0,',
    '  balance_owed NUMERIC(14,2) DEFAULT 0,',
    '  created_at VARCHAR(32)',
    ');'
  );

  for (const c of factory.customers) {
    const escName = c.name.replace(/'/g, "''");
    const escAddr = (c.address || '').replace(/'/g, "''");
    lines.push(
      `INSERT INTO customers (id, name, phone, address, total_purchased, total_paid, balance_owed, created_at) VALUES ('${c.id}', '${escName}', '${c.phone}', '${escAddr}', ${c.totalPurchasedAmount}, ${c.totalPaid}, ${c.balanceOwed}, '${c.createdAt}') ON CONFLICT (id) DO NOTHING;`
    );
  }

  lines.push('', '-- 4. SUPPLIERS');
  lines.push(
    'CREATE TABLE IF NOT EXISTS suppliers (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  name VARCHAR(255) NOT NULL,',
    '  phone VARCHAR(64),',
    '  address TEXT,',
    '  total_purchased NUMERIC(14,2) DEFAULT 0,',
    '  total_paid NUMERIC(14,2) DEFAULT 0,',
    '  balance_owed NUMERIC(14,2) DEFAULT 0,',
    '  created_at VARCHAR(32)',
    ');'
  );

  for (const s of factory.suppliers) {
    const escName = s.name.replace(/'/g, "''");
    const escAddr = (s.address || '').replace(/'/g, "''");
    lines.push(
      `INSERT INTO suppliers (id, name, phone, address, total_purchased, total_paid, balance_owed, created_at) VALUES ('${s.id}', '${escName}', '${s.phone}', '${escAddr}', ${s.totalPurchasedAmount}, ${s.totalPaid}, ${s.balanceOwed}, '${s.createdAt}') ON CONFLICT (id) DO NOTHING;`
    );
  }

  lines.push('', '-- 5. FORMULAS & PRODUCTION');
  lines.push(
    'CREATE TABLE IF NOT EXISTS formulas (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  name VARCHAR(255) NOT NULL,',
    '  total_weight_kg NUMERIC(14,2) DEFAULT 0,',
    '  cost_per_kg NUMERIC(14,2) DEFAULT 0,',
    '  created_date VARCHAR(32)',
    ');'
  );

  for (const f of factory.formulas) {
    const escName = f.name.replace(/'/g, "''");
    lines.push(
      `INSERT INTO formulas (id, name, total_weight_kg, cost_per_kg, created_date) VALUES ('${f.id}', '${escName}', ${f.totalWeightKg}, ${f.costPerKg}, '${f.createdDate}') ON CONFLICT (id) DO NOTHING;`
    );
  }

  lines.push('', 'COMMIT;', '');
  return lines.join('\n');
}

export function downloadSQLDump(factory: DatabaseState): void {
  const sql = generateSQLDump(factory);
  const blob = new Blob([sql], { type: 'text/sql' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `AlMakkah_Factory_DB_Schema_Data_${dateStr}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// Seed Extra Realistic Afghan Data on Request
// -------------------------------------------------------------

export function generateExtraFactoryData(current: DatabaseState): DatabaseState {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const newBatch: ProductionBatch = {
    id: `pb-${Date.now()}`,
    formulaId: 'form-1',
    formulaName: 'Broiler Starter Super Feed (دان پیش‌دان گوشتی المکه)',
    date: dateStr,
    totalWeightKg: 10000,
    costPerKg: 32.8,
    totalCost: 328000,
    operatorName: 'انجینر ریان (Rayan)',
    notes: 'تولید ۲۰۰ بوجی ۵۰ کیلویی مخصوص فرمایش فارم‌های قندهار و کابل',
  };

  const newSale: Sale = {
    id: `sale-${Date.now()}`,
    date: dateStr,
    customerId: 'cust-1',
    customerName: 'فارم مرغداری برکت (حاجی نقیب الله)',
    customerPhone: '0700 554 433',
    productId: 'ps-1',
    productName: 'Broiler Starter Feed (دانه پیش‌دان سوپر گوشتی المکه)',
    unitType: 'bag',
    unitQuantity: 150,
    quantityKg: 7500,
    salePricePerUnit: 2450,
    totalAmount: 367500,
    costRatePerKg: 32.8,
    totalCostOfGoods: 246000,
    profit: 121500,
    paidAmount: 300000,
    remainingAmount: 67500,
    notes: 'بارگیری مستقیم از درب کارخانه المکه با موتر مازدا',
  };

  const newExpense: Expense = {
    id: `exp-${Date.now()}`,
    date: dateStr,
    category: 'fuel',
    description: 'تامین گاز مایع و دیزل برای هیترهای خط خشک‌کن دانه',
    amount: 18000,
    paidBy: 'مسئول مالی',
    notes: 'تایید شده توسط حاجی صاحب',
  };

  return {
    ...current,
    productionBatches: [newBatch, ...current.productionBatches],
    sales: [newSale, ...current.sales],
    expenses: [newExpense, ...current.expenses],
    cashInHand: current.cashInHand + 300000 - 18000,
  };
}
