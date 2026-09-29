import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Plus, 
  Search, 
  Wheat, 
  Trash2, 
  AlertTriangle, 
  DollarSign, 
  Scale, 
  Truck, 
  Sparkles,
  X,
  ArrowDownToLine,
  LayoutList,
  LayoutGrid,
  Phone,
  Calendar,
  CheckCircle2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { UnitType } from '../types';

export const InventoryView: React.FC = () => {
  const { 
    db, 
    t, 
    lang, 
    addRawMaterial, 
    restockRawMaterial,
    deleteRawMaterial, 
    updateRawMaterialThreshold,
    lowStockThreshold,
    getLocalizedName,
    getLocalizedCat
  } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'row' | 'card'>('row');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<{
    id: string;
    name: string;
    currentStockKg: number;
    currentUnitPrice: number;
    supplierName?: string;
    supplierPhone?: string;
  } | null>(null);

  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);
  const [editingThresholdItem, setEditingThresholdItem] = useState<{ id: string; name: string; current: number } | null>(null);
  const [newThresholdValue, setNewThresholdValue] = useState<number | ''>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Material Form State
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Grains');
  const [stockKg, setStockKg] = useState<number | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [threshold, setThreshold] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Restock Form State
  const [restockUnit, setRestockUnit] = useState<UnitType>('kg');
  const [restockQuantity, setRestockQuantity] = useState<number | ''>('');
  const [restockPrice, setRestockPrice] = useState<number | ''>('');
  const [restockSupplier, setRestockSupplier] = useState('');
  const [restockPhone, setRestockPhone] = useState('');
  const [restockPaid, setRestockPaid] = useState<number | ''>('');
  const [restockNotes, setRestockNotes] = useState('');
  const [updateAvgCost, setUpdateAvgCost] = useState(true);
  const [restockError, setRestockError] = useState('');

  // Quick Presets
  const quickPresets = [
    { 
      name: lang === 'fa' ? 'جواری دانه زرد' : lang === 'ps' ? 'ژېړ جوار' : 'Yellow Corn (Maize)', 
      cat: 'Grains', 
      price: 24 
    },
    { 
      name: lang === 'fa' ? 'کنجاره سویا (پروتین ۴۶٪)' : lang === 'ps' ? 'د سویا کنجاړه (۴۶٪)' : 'Soybean Meal (46%)', 
      cat: 'Protein', 
      price: 48 
    },
    { 
      name: lang === 'fa' ? 'کنجاره پنبه دانه' : lang === 'ps' ? 'د پنبې دانې کنجاړه' : 'Cottonseed Oil Cake', 
      cat: 'Protein', 
      price: 32 
    },
    { 
      name: lang === 'fa' ? 'تیل دیزل جنراتور و موتر' : lang === 'ps' ? 'ډیزل تېل او روغنیات' : 'Diesel Fuel & Oil', 
      cat: 'Fuel', 
      price: 65 
    },
    { 
      name: lang === 'fa' ? 'سبوس گندم' : lang === 'ps' ? 'د غنمو بوش (سبوس)' : 'Wheat Bran', 
      cat: 'Fiber', 
      price: 18 
    },
    { 
      name: lang === 'fa' ? 'پری‌میکس و ویتامین مرغداری' : lang === 'ps' ? 'ویټامینونه او پری‌میکس' : 'Poultry Premix & Vitamins', 
      cat: 'Supplements', 
      price: 120 
    },
  ];

  const handleQuickFill = (preset: typeof quickPresets[0]) => {
    setItemName(preset.name);
    setCategory(preset.cat);
    setUnitPrice(preset.price);
  };

  const handleSelectExistingSupplier = (supName: string) => {
    setSupplierName(supName);
    const existing = db.suppliers.find(s => s.name === supName);
    if (existing && existing.phone) {
      setSupplierPhone(existing.phone);
    }
  };

  const handleOpenRestockModal = (item: typeof db.rawMaterials[0]) => {
    const existingSupplier = db.suppliers.find(s => s.id === item.supplierId || s.name === item.supplierName);
    setRestockItem({
      id: item.id,
      name: item.name,
      currentStockKg: item.stockKg,
      currentUnitPrice: item.unitPrice,
      supplierName: item.supplierName || existingSupplier?.name || '',
      supplierPhone: existingSupplier?.phone || '',
    });
    setRestockUnit('kg');
    setRestockQuantity('');
    setRestockPrice(item.unitPrice);
    setRestockSupplier(item.supplierName || existingSupplier?.name || '');
    setRestockPhone(existingSupplier?.phone || '');
    setRestockPaid('');
    setRestockNotes('');
    setUpdateAvgCost(true);
    setRestockError('');
  };

  // Convert Restock Input to Kg
  const restockQtyNumeric = Number(restockQuantity) || 0;
  const restockAddedKg = restockUnit === 'ton' ? restockQtyNumeric * 1000 : restockUnit === 'bag' ? restockQtyNumeric * 50 : restockQtyNumeric;
  const restockPriceNumeric = Number(restockPrice) || 0;
  const restockTotalBill = restockAddedKg * restockPriceNumeric;
  const restockPaidNumeric = restockPaid === '' ? restockTotalBill : Number(restockPaid);
  const restockRemaining = Math.max(0, restockTotalBill - restockPaidNumeric);
  const restockProjectedKg = (restockItem?.currentStockKg || 0) + restockAddedKg;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!itemName.trim() || stockKg === '' || unitPrice === '') {
      setErrorMsg(t.invalidCredentials || 'Please fill in all required fields');
      return;
    }

    const numericStock = Number(stockKg);
    const numericPrice = Number(unitPrice);
    const numericPaid = paidAmount === '' ? numericStock * numericPrice : Number(paidAmount);
    const numericThreshold = threshold === '' ? undefined : Number(threshold);

    addRawMaterial({
      name: itemName.trim(),
      category,
      stockKg: numericStock,
      unitPrice: numericPrice,
      supplierName: supplierName.trim() || undefined,
      notes: notes.trim() || undefined,
      lowStockThreshold: numericThreshold,
    }, numericPaid, supplierPhone.trim() || undefined);

    setFeedbackMessage({
      type: 'success',
      text: `${t.save}: ${itemName.trim()} (${numericStock.toLocaleString()} ${t.kilo})`
    });

    setItemName('');
    setCategory('Grains');
    setStockKg('');
    setUnitPrice('');
    setThreshold('');
    setSupplierName('');
    setSupplierPhone('');
    setPaidAmount('');
    setNotes('');
    setErrorMsg('');
    setIsAddModalOpen(false);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRestockError('');

    if (!restockItem) return;
    if (restockAddedKg <= 0) {
      setRestockError(lang === 'fa' ? 'لطفاً مقدار بار وارده را مشخص نمایید' : lang === 'ps' ? 'مهرباني وکړئ د بار اندازه وټاکئ' : 'Please specify a valid restock quantity');
      return;
    }

    const result = restockRawMaterial({
      materialId: restockItem.id,
      addedWeightKg: restockAddedKg,
      newUnitPrice: restockPriceNumeric,
      supplierName: restockSupplier.trim() || undefined,
      supplierPhone: restockPhone.trim() || undefined,
      paidAmount: restockPaidNumeric,
      notes: restockNotes.trim() || undefined,
      updateAvgCost,
    });

    if (result.success) {
      setFeedbackMessage({
        type: 'success',
        text: `${t.restockSuccessMsg} (${getLocalizedName(restockItem.name)}: +${restockAddedKg.toLocaleString()} ${t.kilo})`
      });
      setRestockItem(null);
    } else {
      setRestockError(result.error || 'Restock error');
    }
  };

  // Filtered raw materials with search and category filter
  const filteredItems = db.rawMaterials.filter(item => {
    const localizedName = getLocalizedName(item.name).toLowerCase();
    const rawName = item.name.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      localizedName.includes(search) ||
      rawName.includes(search) ||
      (item.supplierName && item.supplierName.toLowerCase().includes(search)) ||
      (item.category && getLocalizedCat(item.category).toLowerCase().includes(search));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalWarehouseKg = db.rawMaterials.reduce((acc, i) => acc + i.stockKg, 0);
  const totalWarehouseValue = db.rawMaterials.reduce((acc, i) => acc + (i.stockKg * i.unitPrice), 0);
  const lowStockCount = db.rawMaterials.filter(i => i.stockKg <= (i.lowStockThreshold ?? lowStockThreshold)).length;

  const categories = ['all', 'Grains', 'Protein', 'Fuel', 'Fiber', 'Supplements'];

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Wheat className="w-5 h-5" />
            </div>
            <span>{t.inventoryTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.inventoryDesc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle: Row vs Card */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('row')}
              title={t.rowView}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'row'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">{t.rowView}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              title={t.cardView}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">{t.cardView}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addRawMaterial}</span>
          </button>
        </div>
      </div>

      {/* Alert / Feedback message */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 border animate-fadeIn ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button 
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Stat Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t.rawStockCard}</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {totalWarehouseKg.toLocaleString()} {t.kilo}
            </div>
            <span className="text-xs text-amber-700 font-mono font-medium">
              {(totalWarehouseKg / 1000).toFixed(1)} {t.ton} • {Math.round(totalWarehouseKg / 50).toLocaleString()} {t.bags}
            </span>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl border border-amber-200">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t.totalValue}</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {totalWarehouseValue.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-500">{db.rawMaterials.length} {t.itemsCount}</span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t.lowStockNotificationTitle}</span>
            <div className="text-xl font-bold font-mono text-rose-700 mt-1">
              {lowStockCount} {t.itemsCount}
            </div>
            <span className="text-xs text-slate-500">
              {t.thresholdLimitLabel}: {lowStockThreshold.toLocaleString()} {t.kilo}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${lowStockCount > 0 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH BAR & CATEGORY FILTER */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={t.searchPlaceholderInventory}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 me-1 shrink-0 hidden sm:inline">
            {t.categoryFilter}
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? t.allCategories : getLocalizedCat(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 1. ROW / LINE SYSTEM VIEW (REQUESTED STYLE: ONE LINE PER ITEM WITH ALL INFO)     */}
      {/* -------------------------------------------------------------------------------- */}
      {viewMode === 'row' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Row */}
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <LayoutList className="w-4 h-4 text-amber-600" />
              <span>{t.rawStockLinearTitle}</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {filteredItems.length} {t.itemsCount}
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {t.showingResults} {filteredItems.length} {t.records}
            </span>
          </div>

          {/* Desktop & Tablet Table (Horizontal Line System) */}
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-bold text-slate-600">
                  <th className="py-3 px-4 text-start">{t.materialName}</th>
                  <th className="py-3 px-3 text-start">{t.category}</th>
                  <th className="py-3 px-4 text-start">{t.currentStockLabel}</th>
                  <th className="py-3 px-3 text-start">{t.status}</th>
                  <th className="py-3 px-3 text-start">{t.unitPriceKilo}</th>
                  <th className="py-3 px-4 text-start">{t.totalValue}</th>
                  <th className="py-3 px-3 text-start">{t.supplier}</th>
                  <th className="py-3 px-4 text-center">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredItems.map((item) => {
                  const itemThreshold = item.lowStockThreshold ?? lowStockThreshold;
                  const isLowStock = item.stockKg <= itemThreshold;
                  const tons = item.stockKg / 1000;
                  const bags = Math.round(item.stockKg / 50);
                  const totalVal = item.stockKg * item.unitPrice;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isLowStock ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Name & Notes */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {getLocalizedName(item.name)}
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                            {item.notes}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {t.date}: {item.dateAdded}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-amber-800 font-medium">
                          {getLocalizedCat(item.category)}
                        </span>
                      </td>

                      {/* Stock in Tons, Bags, Kg */}
                      <td className="py-3 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-base font-bold font-mono ${isLowStock ? 'text-rose-700' : 'text-slate-900'}`}>
                            {tons.toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">{t.tons}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {item.stockKg.toLocaleString()} {t.kilo}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">
                            {bags.toLocaleString()} {t.bags}
                          </span>
                        </div>
                      </td>

                      {/* Status & Threshold */}
                      <td className="py-3 px-3">
                        {isLowStock ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{t.statusLow}</span>
                            </span>
                            <div className="text-[10px] text-rose-600 font-mono">
                              &lt; {itemThreshold.toLocaleString()} kg
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{t.statusNormal}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingThresholdItem({
                                  id: item.id,
                                  name: getLocalizedName(item.name),
                                  current: itemThreshold,
                                });
                                setNewThresholdValue(itemThreshold);
                              }}
                              className="text-[10px] text-slate-400 hover:text-amber-700 font-mono flex items-center gap-0.5 cursor-pointer"
                              title={t.configureThreshold}
                            >
                              <span>{itemThreshold.toLocaleString()} kg</span>
                              <SlidersHorizontal className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-amber-700 font-mono text-sm">
                          {item.unitPrice.toLocaleString()} {t.currency}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {(item.unitPrice * 1000).toLocaleString()} / {t.ton}
                        </div>
                      </td>

                      {/* Total Value */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-700 font-mono text-sm">
                          {totalVal.toLocaleString()} {t.currency}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {t.activeFactory}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-3">
                        {item.supplierName ? (
                          <div>
                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                              <Truck className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate max-w-[130px]">{item.supplierName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {t.supplier}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Actions: RESTOCK & DELETE */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* RESTOCK BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleOpenRestockModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 hover:text-amber-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title={t.restockItem}
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5 text-amber-700" />
                            <span>{t.quickRestock}</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setMaterialToDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="p-12 text-center">
              <Wheat className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-medium">
                {t.showingResults} 0 {t.records}
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-700 text-xs font-semibold cursor-pointer"
                >
                  {t.clearFilters}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* -------------------------------------------------------------------------------- */
        /* 2. CARD VIEW (ALTERNATIVE TOGGLE)                                                */
        /* -------------------------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const itemThreshold = item.lowStockThreshold ?? lowStockThreshold;
            const isLowStock = item.stockKg <= itemThreshold;
            const totalVal = item.stockKg * item.unitPrice;
            const tons = item.stockKg / 1000;
            const bags = Math.round(item.stockKg / 50);

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative shadow-sm ${
                  isLowStock 
                    ? 'bg-rose-50/50 border-rose-300 hover:border-rose-400' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {getLocalizedName(item.name)}
                      </h3>
                      <span className="inline-block mt-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-amber-700 font-medium">
                        {getLocalizedCat(item.category)}
                      </span>
                    </div>
                    {isLowStock ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 border border-rose-200 animate-pulse shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{t.statusLow}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {t.statusNormal}
                      </span>
                    )}
                  </div>

                  {/* Stock Details */}
                  <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-slate-100 bg-slate-50/70 rounded-xl px-3.5">
                    <div>
                      <span className="text-[11px] text-slate-500 block">{t.currentStockLabel}</span>
                      <span className={`text-base font-bold font-mono ${isLowStock ? 'text-rose-700' : 'text-slate-900'}`}>
                        {tons.toFixed(2)} {t.tons}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {item.stockKg.toLocaleString()} kg • {bags} {t.bags}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">{t.unitPriceKilo}</span>
                      <span className="text-base font-bold text-amber-700 font-mono">
                        {item.unitPrice.toLocaleString()} {t.currency}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {(item.unitPrice * 1000).toLocaleString()} / {t.ton}
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{t.totalValue}:</span>
                      <span className="text-sm font-bold text-emerald-700 font-mono">
                        {totalVal.toLocaleString()} {t.currency}
                      </span>
                    </div>
                  </div>

                  {/* Supplier Info */}
                  {item.supplierName && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-700">
                      <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-slate-500">{t.supplier}:</span>
                      <span className="font-semibold text-slate-900 truncate">{item.supplierName}</span>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRestockModal(item)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>{t.quickRestock}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaterialToDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* 3. DEDICATED RESTOCK MODAL (COMPREHENSIVE WITH WEIGHT, SUPPLIER, AMOUNT, BILL)    */}
      {/* -------------------------------------------------------------------------------- */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                  <ArrowDownToLine className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{t.restockModalTitle}</h3>
                  <p className="text-xs text-slate-500">{getLocalizedName(restockItem.name)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Stock Banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">{t.currentStockBeforeRestock}:</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  {(restockItem.currentStockKg / 1000).toFixed(2)} {t.tons} ({restockItem.currentStockKg.toLocaleString()} {t.kilo})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{t.unitPriceKilo}:</span>
                <span className="font-bold font-mono text-amber-700 text-sm">
                  {restockItem.currentUnitPrice.toLocaleString()} {t.currency}
                </span>
              </div>
            </div>

            {restockError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{restockError}</span>
              </div>
            )}

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-4">
              {/* Unit & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.selectUnitForRestock} *
                  </label>
                  <select
                    value={restockUnit}
                    onChange={(e) => setRestockUnit(e.target.value as UnitType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs cursor-pointer font-medium"
                  >
                    <option value="kg">{t.kilos} (Kg)</option>
                    <option value="bag">{t.bags} (50 Kg)</option>
                    <option value="ton">{t.tons} (1000 Kg)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.addedWeight} ({restockUnit === 'ton' ? t.tons : restockUnit === 'bag' ? t.bags : t.kilos}) *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value ? Number(e.target.value) : '')}
                    placeholder="مثال: 5000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs font-bold"
                  />
                  {restockAddedKg > 0 && restockUnit !== 'kg' && (
                    <span className="text-[11px] text-amber-700 font-mono mt-1 block">
                      = {restockAddedKg.toLocaleString()} {t.kilo}
                    </span>
                  )}
                </div>
              </div>

              {/* Purchase Price per Kg */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.newPurchasePrice} ({t.currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={restockPrice}
                    onChange={(e) => setRestockPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="25"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.amountPaidLabel} ({t.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={restockPaid}
                    onChange={(e) => setRestockPaid(e.target.value ? Number(e.target.value) : '')}
                    placeholder={t.defaultFullPayment}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Supplier & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.supplier}
                  </label>
                  <input
                    type="text"
                    value={restockSupplier}
                    onChange={(e) => {
                      setRestockSupplier(e.target.value);
                      const s = db.suppliers.find(sup => sup.name === e.target.value);
                      if (s && s.phone) setRestockPhone(s.phone);
                    }}
                    placeholder={t.supplierNamePlaceholder}
                    list="suppliers-restock-list"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                  <datalist id="suppliers-restock-list">
                    {db.suppliers.map(s => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.supplierPhoneLabel}
                  </label>
                  <input
                    type="text"
                    value={restockPhone}
                    onChange={(e) => setRestockPhone(e.target.value)}
                    placeholder="0700xxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.restockDeliveryNote}
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="مثال: بارنامه شماره ۸۴ - موتر کاماز هرات"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>

              {/* Cost calculation option */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateAvgCost}
                  onChange={(e) => setUpdateAvgCost(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <span>{t.weightedAverageCostOption}</span>
              </label>

              {/* Restock Calculations Preview Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>{t.totalBill}:</span>
                  <strong className="font-mono text-slate-900 text-sm">{restockTotalBill.toLocaleString()} {t.currency}</strong>
                </div>
                <div className="flex justify-between items-center text-rose-700 pt-1 border-t border-amber-200">
                  <span>{t.remainingDebt}:</span>
                  <strong className="font-mono">{restockRemaining.toLocaleString()} {t.currency}</strong>
                </div>
                <div className="flex justify-between items-center text-emerald-800 pt-1 border-t border-amber-200">
                  <span>{t.projectedStockAfterRestock}:</span>
                  <strong className="font-mono">
                    {(restockProjectedKg / 1000).toFixed(2)} {t.tons} ({restockProjectedKg.toLocaleString()} {t.kilo})
                  </strong>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* 4. ADD NEW RAW MATERIAL MODAL                                                    */}
      {/* -------------------------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                  <Wheat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{t.addRawMaterial}</h3>
                  <p className="text-xs text-slate-500">{t.inventoryDesc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Fill presets */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.highConsumptionFactoryItems}</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickFill(preset)}
                    className="text-xs px-2.5 py-1 bg-white hover:bg-amber-600 hover:text-white text-slate-700 rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.materialName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder={t.materialName}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.category}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs cursor-pointer"
                  >
                    <option value="Grains">{getLocalizedCat('Grains')}</option>
                    <option value="Protein">{getLocalizedCat('Protein')}</option>
                    <option value="Fuel">{getLocalizedCat('Fuel')}</option>
                    <option value="Fiber">{getLocalizedCat('Fiber')}</option>
                    <option value="Supplements">{getLocalizedCat('Supplements')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.stockInKilo} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={stockKg}
                    onChange={(e) => setStockKg(e.target.value ? Number(e.target.value) : '')}
                    placeholder="5000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs font-bold"
                  />
                  {Number(stockKg) > 0 && (
                    <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                      = {(Number(stockKg) / 1000).toFixed(2)} {t.ton} ({Math.round(Number(stockKg) / 50)} {t.bag})
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.unitPriceKilo} ({t.currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="25"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.customThresholdOpt}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value ? Number(e.target.value) : '')}
                    placeholder={`${t.defaultPrefix} ${lowStockThreshold}`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.supplier}
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => handleSelectExistingSupplier(e.target.value)}
                    placeholder={t.supplierNamePlaceholder}
                    list="suppliers-list"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                  <datalist id="suppliers-list">
                    {db.suppliers.map(s => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.supplierPhoneLabel}
                  </label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="0700xxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.amountPaidLabel} ({t.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder={t.defaultFullPayment}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.notesDescriptionLabel}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.loadDetailsPlaceholder}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25 cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* 5. EDIT THRESHOLD MODAL                                                          */}
      {/* -------------------------------------------------------------------------------- */}
      {editingThresholdItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              {t.individualThresholdTitle}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {t.rawMaterialColon} <strong>{editingThresholdItem.name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.thresholdKgColon}
              </label>
              <input
                type="number"
                min="0"
                value={newThresholdValue}
                onChange={(e) => setNewThresholdValue(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {t.thresholdNoticeText}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditingThresholdItem(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newThresholdValue !== '') {
                    updateRawMaterialThreshold(editingThresholdItem.id, Number(newThresholdValue));
                    setEditingThresholdItem(null);
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-amber-600 text-xs font-bold text-white hover:bg-amber-700 shadow-xs cursor-pointer"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* 6. DELETE CONFIRMATION MODAL                                                     */}
      {/* -------------------------------------------------------------------------------- */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t.delete}
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              {t.confirmDelete}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteRawMaterial(materialToDelete);
                  setMaterialToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
