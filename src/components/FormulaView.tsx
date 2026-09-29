import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Scale, 
  Plus, 
  Trash2, 
  PackageCheck, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  CalendarClock, 
  Zap, 
  Info, 
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkPlus,
  RefreshCw,
  Search,
  Sliders,
  Copy,
  FolderOpen,
  Eye,
  Percent,
  TrendingUp,
  Building,
  Check
} from 'lucide-react';
import { Formula } from '../types';

export const FormulaView: React.FC = () => {
  const { 
    db, 
    t, 
    lang, 
    saveFormulaTemplate,
    createFormulaAndProduce, 
    deleteFormula, 
    getLocalizedName 
  } = useDatabase();

  // Active Loaded Formula ID (if user loaded an existing saved formula)
  const [loadedFormulaId, setLoadedFormulaId] = useState<string | null>(null);

  // Form State
  const [formulaName, setFormulaName] = useState('');
  const [description, setDescription] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [batchExpenses, setBatchExpenses] = useState<number | ''>('');
  
  // Ingredients list in formulation (can hold 20+ items seamlessly)
  const [ingredients, setIngredients] = useState<{ rawMaterialId: string; weightKg: number }[]>([
    { rawMaterialId: db.rawMaterials[0]?.id || '', weightKg: 550 },
    { rawMaterialId: db.rawMaterials[1]?.id || '', weightKg: 350 },
    { rawMaterialId: db.rawMaterials[2]?.id || '', weightKg: 75 },
    { rawMaterialId: db.rawMaterials[3]?.id || '', weightKg: 25 },
  ]);

  // Ingredient search filter within the builder
  const [ingredientSearch, setIngredientSearch] = useState('');

  // Messages & confirmations
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formulaToDelete, setFormulaToDelete] = useState<string | null>(null);

  // Multi-unit display toggles for processed stock: 'all' | 'ton' | 'bag' | 'kg'
  const [stockViewUnit, setStockViewUnit] = useState<'all' | 'ton' | 'bag' | 'kg'>('all');

  // Quick Unit Converter state
  const [showConverter, setShowConverter] = useState(false);
  const [convTons, setConvTons] = useState<number | ''>(1);
  const [convBags, setConvBags] = useState<number | ''>(20);
  const [convKg, setConvKg] = useState<number | ''>(1000);

  const handleTonsChange = (val: number | '') => {
    setConvTons(val);
    if (val === '' || isNaN(Number(val))) {
      setConvBags('');
      setConvKg('');
    } else {
      const num = Number(val);
      setConvKg(Math.round(num * 1000 * 100) / 100);
      setConvBags(Math.round(num * 20 * 10) / 10);
    }
  };

  const handleBagsChange = (val: number | '') => {
    setConvBags(val);
    if (val === '' || isNaN(Number(val))) {
      setConvTons('');
      setConvKg('');
    } else {
      const num = Number(val);
      setConvKg(Math.round(num * 50 * 100) / 100);
      setConvTons(Math.round((num / 20) * 1000) / 1000);
    }
  };

  const handleKgChange = (val: number | '') => {
    setConvKg(val);
    if (val === '' || isNaN(Number(val))) {
      setConvTons('');
      setConvBags('');
    } else {
      const num = Number(val);
      setConvTons(Math.round((num / 1000) * 1000) / 1000);
      setConvBags(Math.round((num / 50) * 10) / 10);
    }
  };

  // 1. LOAD A SAVED FORMULA TEMPLATE INTO THE BUILDER
  const handleLoadFormula = (formula: Formula) => {
    setLoadedFormulaId(formula.id);
    setFormulaName(formula.name);
    setDescription(formula.description || '');
    
    // Map ingredients
    const loadedIngs = formula.ingredients.map(ing => ({
      rawMaterialId: ing.rawMaterialId,
      weightKg: ing.weightKg,
    }));
    
    setIngredients(loadedIngs);
    setMessage({
      type: 'success',
      text: `${t.loadFormulaTemplate}: "${formula.name}" (${loadedIngs.length} ${t.itemsCount} • ${(formula.totalWeightKg / 1000).toFixed(2)} ${t.tons})`
    });

    // Scroll smoothly to builder
    const builderEl = document.getElementById('formula-recipe-builder');
    if (builderEl) {
      builderEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 2. ONE-CLICK ADD ALL STOCK RAW MATERIALS (SOLVES 20+ ITEMS ISSUE)
  const handleAddAllStockItems = () => {
    if (db.rawMaterials.length === 0) return;

    // Get current IDs already in formulation
    const currentMap = new Map(ingredients.map(i => [i.rawMaterialId, i.weightKg]));

    // Build new list with all raw materials from warehouse
    const newIngredients = db.rawMaterials.map(rm => ({
      rawMaterialId: rm.id,
      weightKg: currentMap.get(rm.id) || (rm.category === 'Grains' ? 500 : rm.category === 'Protein' ? 250 : 25),
    }));

    setIngredients(newIngredients);
    setMessage({
      type: 'success',
      text: `${t.addAllActiveMaterials} (${newIngredients.length} ${t.itemsCount})`
    });
  };

  // 3. SAVE CURRENT FORMULA AS TEMPLATE (WITHOUT PRODUCING)
  const handleSaveAsTemplate = (isUpdate = false) => {
    setMessage(null);

    if (!formulaName.trim()) {
      setMessage({ type: 'error', text: t.pleaseEnterFormulaName });
      return;
    }

    if (ingredients.length === 0 || totalBatchWeight <= 0) {
      setMessage({ type: 'error', text: t.totalWeightMustBePositive });
      return;
    }

    const targetId = isUpdate && loadedFormulaId ? loadedFormulaId : undefined;
    const result = saveFormulaTemplate(
      formulaName.trim(),
      ingredients,
      description.trim() || undefined,
      targetId
    );

    if (result.success) {
      setLoadedFormulaId(result.formulaId);
      setMessage({
        type: 'success',
        text: isUpdate ? t.formulaUpdatedSuccess : t.formulaSavedSuccess
      });
    }
  };

  // Reset Builder to Empty / New
  const handleResetBuilder = () => {
    setLoadedFormulaId(null);
    setFormulaName('');
    setDescription('');
    setOperatorName('');
    setBatchExpenses('');
    if (db.rawMaterials.length > 0) {
      setIngredients([
        { rawMaterialId: db.rawMaterials[0]?.id || '', weightKg: 500 },
        { rawMaterialId: db.rawMaterials[1]?.id || '', weightKg: 300 },
        { rawMaterialId: db.rawMaterials[2]?.id || '', weightKg: 150 },
        { rawMaterialId: db.rawMaterials[3]?.id || '', weightKg: 50 },
      ]);
    }
    setMessage(null);
  };

  // Quick Preset Templates
  const applyTemplate = (type: 'starter' | 'grower' | 'layer') => {
    if (db.rawMaterials.length === 0) return;
    setLoadedFormulaId(null);

    const corn = db.rawMaterials.find(r => r.name.includes('Corn') || r.name.includes('جواری') || r.name.includes('جوار')) || db.rawMaterials[0];
    const soya = db.rawMaterials.find(r => r.name.includes('Soy') || r.name.includes('سویا')) || db.rawMaterials[1] || db.rawMaterials[0];
    const oilCake = db.rawMaterials.find(r => r.name.includes('Cake') || r.name.includes('کنجاره') || r.name.includes('کنجاړه')) || db.rawMaterials[2] || db.rawMaterials[0];
    const premix = db.rawMaterials.find(r => r.name.includes('Premix') || r.name.includes('ویتامین') || r.name.includes('ویټامین')) || db.rawMaterials[3] || db.rawMaterials[0];

    if (type === 'starter') {
      setFormulaName(lang === 'fa' ? 'دانه آغازین برویلر (سوپر استارتر)' : lang === 'ps' ? 'د برویلر پیلنی دانه (سوپر سټارټر)' : 'Broiler Starter Feed (Super Starter)');
      setDescription(lang === 'fa' ? 'پروتئین ۲۲ فیصد مخصوص جوجه گوشتی روز ۱ تا ۱۰' : lang === 'ps' ? '۲۲ سلنه پروتین د غوښینو چرګوړو ۱ تر ۱۰ ورځو لپاره' : '22% Protein for broiler chicks days 1-10');
      setIngredients([
        { rawMaterialId: corn.id, weightKg: 550 },
        { rawMaterialId: soya.id, weightKg: 350 },
        { rawMaterialId: oilCake.id, weightKg: 75 },
        { rawMaterialId: premix.id, weightKg: 25 },
      ]);
    } else if (type === 'grower') {
      setFormulaName(lang === 'fa' ? 'دانه رشد برویلر (گروور)' : lang === 'ps' ? 'د برویلر د ودې دانه (ګروور)' : 'Broiler Grower Feed');
      setDescription(lang === 'fa' ? 'پروتئین ۲۰ فیصد رشد سریع روز ۱۱ تا ۲۵' : lang === 'ps' ? '۲۰ سلنه پروتین د چټکې ودې لپاره ۱۱ تر ۲۵ ورځو' : '20% Protein for rapid broiler growth days 11-25');
      setIngredients([
        { rawMaterialId: corn.id, weightKg: 600 },
        { rawMaterialId: soya.id, weightKg: 280 },
        { rawMaterialId: oilCake.id, weightKg: 95 },
        { rawMaterialId: premix.id, weightKg: 25 },
      ]);
    } else {
      setFormulaName(lang === 'fa' ? 'دانه مرغ تخمی (لیر)' : lang === 'ps' ? 'د هګیو د چرګانو دانه (لیر)' : 'Layer Hen Feed');
      setDescription(lang === 'fa' ? 'فرمول تخمگذاری با کلسیم و فسفر غنی شده' : lang === 'ps' ? 'د هګیو اچولو ځانګړی فورمول د کلسیم او فاسفورس سره' : 'Layer feed enriched with calcium and phosphorus');
      setIngredients([
        { rawMaterialId: corn.id, weightKg: 620 },
        { rawMaterialId: soya.id, weightKg: 220 },
        { rawMaterialId: oilCake.id, weightKg: 135 },
        { rawMaterialId: premix.id, weightKg: 25 },
      ]);
    }
  };

  const handleAddIngredientRow = () => {
    const defaultRm = db.rawMaterials[0]?.id || '';
    setIngredients(prev => [...prev, { rawMaterialId: defaultRm, weightKg: 100 }]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, field: 'rawMaterialId' | 'weightKg', val: any) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Batch Scaling: Scale current ingredients to exact target Tons
  const handleScaleBatchToTons = (targetTons: number) => {
    if (totalBatchWeight <= 0) return;
    const targetKg = targetTons * 1000;
    const factor = targetKg / totalBatchWeight;
    setIngredients(prev => 
      prev.map(ing => ({
        ...ing,
        weightKg: Math.round(ing.weightKg * factor)
      }))
    );
  };

  // Calculations
  let totalBatchWeight = 0;
  let totalRawMaterialCost = 0;

  ingredients.forEach(ing => {
    const raw = db.rawMaterials.find(r => r.id === ing.rawMaterialId);
    const weight = Number(ing.weightKg) || 0;
    const cost = raw ? raw.unitPrice * weight : 0;
    totalBatchWeight += weight;
    totalRawMaterialCost += cost;
  });

  const batchExpenseAmount = Number(batchExpenses) || 0;
  const totalBatchCost = totalRawMaterialCost + batchExpenseAmount;
  const costPerKg = totalBatchWeight > 0 ? totalBatchCost / totalBatchWeight : 0;
  const costPerBag = costPerKg * 50;
  const costPerTon = costPerKg * 1000;
  const totalBags = Math.round(totalBatchWeight / 50);
  const totalTons = totalBatchWeight / 1000;

  // Processed Stock Aggregations
  const totalProcessedKg = db.processedStock.reduce((acc, p) => acc + (p.stockKg || 0), 0);
  const totalProcessedTons = totalProcessedKg / 1000;
  const totalProcessedBags = Math.round(totalProcessedKg / 50);
  const totalProcessedValue = db.processedStock.reduce((acc, p) => acc + ((p.stockKg || 0) * (p.averageCostPerKg || 0)), 0);

  // Produce Action
  const handleProduce = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formulaName.trim()) {
      setMessage({ type: 'error', text: t.pleaseEnterFormulaName });
      return;
    }

    if (totalBatchWeight <= 0) {
      setMessage({ type: 'error', text: t.totalWeightMustBePositive });
      return;
    }

    // Check if we have enough raw materials in stock
    for (const ing of ingredients) {
      const raw = db.rawMaterials.find(r => r.id === ing.rawMaterialId);
      if (!raw) {
        setMessage({ type: 'error', text: t.invalidRawMaterialSelected });
        return;
      }
      if (raw.stockKg < ing.weightKg) {
        setMessage({ 
          type: 'error', 
          text: `${t.insufficientStockOfItem} "${getLocalizedName(raw.name)}" - ${raw.stockKg.toLocaleString()} ${t.kilo}, ${t.requestedAmount} ${ing.weightKg.toLocaleString()} ${t.kilo}.` 
        });
        return;
      }
    }

    const result = createFormulaAndProduce(
      formulaName.trim(),
      ingredients,
      description.trim() || undefined,
      operatorName.trim() || undefined,
      true,
      batchExpenseAmount
    );

    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `${t.produceSuccessMsg} (${formulaName}) ${totalTons.toFixed(2)} ${t.tons} (${totalBatchWeight.toLocaleString()} ${t.kilo} • ${totalBags} ${t.bags}) ${t.readyFeedAddedToWarehouse}` 
      });

      // Reset form
      setFormulaName('');
      setDescription('');
      setOperatorName('');
      setBatchExpenses('');
      setLoadedFormulaId(null);
    } else {
      setMessage({ type: 'error', text: result.error || 'Error' });
    }
  };

  const handleConfirmDeleteFormula = () => {
    if (formulaToDelete) {
      deleteFormula(formulaToDelete);
      if (loadedFormulaId === formulaToDelete) {
        setLoadedFormulaId(null);
      }
      setFormulaToDelete(null);
    }
  };

  // Filter ingredients in the builder if user types a search term
  const filteredIngredientsWithIndices = useMemo(() => {
    return ingredients.map((ing, originalIndex) => {
      const raw = db.rawMaterials.find(r => r.id === ing.rawMaterialId);
      const name = raw ? getLocalizedName(raw.name).toLowerCase() : '';
      const matches = !ingredientSearch || name.includes(ingredientSearch.toLowerCase());
      return { ing, originalIndex, raw, matches };
    });
  }, [ingredients, db.rawMaterials, ingredientSearch, lang]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Scale className="w-5 h-5" />
            </div>
            <span>{t.formulaTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.formulaDesc}
          </p>
        </div>

        {/* Action Controls & Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Unit Converter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowConverter(!showConverter)}
            className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
            <span>{t.unitConverter}</span>
            {showConverter ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

          {/* Quick Formula Presets */}
          <span className="text-xs font-semibold text-slate-500 hidden md:inline">{t.factoryPresets}</span>
          <button
            type="button"
            onClick={() => applyTemplate('starter')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {t.starter22}
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('grower')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {t.grower20}
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('layer')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {t.layerHen}
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 1. SAVED FORMULAS SELECTOR BAR (SOLVES >20 ITEMS RE-ENTRY BY SAVING & LOADING)   */}
      {/* -------------------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-slate-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-600 text-white rounded-lg shadow-xs">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t.savedFormulasTitle}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t.selectExistingRecipe}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 1-Click Add All Stock Items Button */}
            <button
              type="button"
              onClick={handleAddAllStockItems}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addAllActiveMaterials}</span>
            </button>

            {/* Reset / New Recipe Form */}
            <button
              type="button"
              onClick={handleResetBuilder}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t.addNew}
            </button>
          </div>
        </div>

        {/* Formula Badges / Quick Load Chips */}
        {db.formulas.length === 0 ? (
          <p className="text-xs text-slate-500 bg-white/70 p-3 rounded-xl border border-amber-100">
            {t.noSavedFormulasYet}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {db.formulas.map(f => {
              const isSelected = loadedFormulaId === f.id;
              const fTons = (f.totalWeightKg / 1000).toFixed(2);
              const fItems = f.ingredients.length;

              return (
                <div
                  key={f.id}
                  onClick={() => handleLoadFormula(f)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400'
                      : 'bg-white hover:bg-amber-50/60 border-slate-200 hover:border-amber-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <h4 className={`font-bold text-xs line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-amber-800'}`}>
                      {f.name}
                    </h4>
                    {isSelected && (
                      <span className="p-0.5 rounded-full bg-white/20 text-white shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
                    isSelected ? 'border-amber-500/50 text-amber-100' : 'border-slate-100 text-slate-500'
                  }`}>
                    <span>{fItems} {t.itemsCount}</span>
                    <span className="font-bold">{fTons} {t.tons}</span>
                    <span className={`font-bold ${isSelected ? 'text-amber-200' : 'text-emerald-700'}`}>
                      {f.costPerKg.toFixed(1)} {t.currency}/kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Quick Unit Converter Box (Tons <-> Bags <-> Kg) */}
      {showConverter && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm transition-all animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-600 text-white rounded-lg shadow-xs">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-amber-950">
                {t.unitConverterTitle}
              </h4>
            </div>
            <div className="text-[11px] font-mono font-medium text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200">
              {t.standardConversionRule}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
            {/* Tons Input */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t.amountInTons}</span>
                <span className="text-[10px] text-amber-600 font-mono">1 Ton = 1000 Kg</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={convTons}
                  onChange={(e) => handleTonsChange(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="1"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-amber-600"
                />
                <span className="absolute end-3 top-2.5 text-xs font-bold text-slate-400">{t.tons}</span>
              </div>
            </div>

            {/* Bags Input */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t.amountInBags}</span>
                <span className="text-[10px] text-amber-600 font-mono">1 Bag = 50 Kg</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={convBags}
                  onChange={(e) => handleBagsChange(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="20"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-amber-600"
                />
                <span className="absolute end-3 top-2.5 text-xs font-bold text-slate-400">{t.bags}</span>
              </div>
            </div>

            {/* Kg Input */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t.amountInKg}</span>
                <span className="text-[10px] text-amber-600 font-mono">Standard Weight</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={convKg}
                  onChange={(e) => handleKgChange(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="1000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-amber-600"
                />
                <span className="absolute end-3 top-2.5 text-xs font-bold text-slate-400">{t.kilos}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{message.text}</span>
          </div>
          <button 
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* 2. MAIN GRID: RECIPE BUILDER (2 COLS) + LIVE COST CALCULATOR (1 COL)             */}
      {/* -------------------------------------------------------------------------------- */}
      <div id="formula-recipe-builder" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formula Recipe Builder Form (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <span>{t.recipeBuilderTitle}</span>
              </h3>
              {loadedFormulaId && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  {t.edit}
                </span>
              )}
            </div>

            {/* Scale Batch to Exact Tons Shortcuts */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
              <span className="text-[11px] text-slate-500 font-semibold">{t.scaleBatchTo}</span>
              <button
                type="button"
                onClick={() => handleScaleBatchToTons(1)}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-amber-500 text-slate-700 hover:text-amber-700 font-bold transition-all cursor-pointer shadow-2xs"
              >
                {t.ton1}
              </button>
              <button
                type="button"
                onClick={() => handleScaleBatchToTons(2)}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-amber-500 text-slate-700 hover:text-amber-700 font-bold transition-all cursor-pointer shadow-2xs"
              >
                {t.ton2}
              </button>
              <button
                type="button"
                onClick={() => handleScaleBatchToTons(5)}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-amber-500 text-slate-700 hover:text-amber-700 font-bold transition-all cursor-pointer shadow-2xs"
              >
                {t.ton5}
              </button>
            </div>
          </div>

          <form onSubmit={handleProduce} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.formulaNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  placeholder={t.formulaNamePlaceholder}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.operatorNameLabel}
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder={t.operatorPlaceholder}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.formulaDescriptionLabel}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.formulaDescPlaceholder}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>

              {/* Batch Production Expenses Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.batchProductionExpense} ({t.currency})</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={batchExpenses}
                  onChange={(e) => setBatchExpenses(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Ingredients Table / Rows with Search & 20+ Items Optimization */}
            <div className="mt-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t.rawItemsInBatch} ({ingredients.length} {t.itemsCount})
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  {/* Search input within ingredients */}
                  {ingredients.length > 5 && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t.search}
                        value={ingredientSearch}
                        onChange={(e) => setIngredientSearch(e.target.value)}
                        className="ps-7 pe-2 py-1 text-xs bg-slate-100 border border-slate-300 rounded-lg w-32 focus:w-44 transition-all focus:outline-none focus:border-amber-600"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2 top-2 pointer-events-none" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addRawIngredient}</span>
                  </button>
                </div>
              </div>

              {/* Scrollable list of ingredients */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pe-1">
                {filteredIngredientsWithIndices.map(({ ing, originalIndex, raw, matches }) => {
                  if (!matches) return null;

                  const weight = Number(ing.weightKg) || 0;
                  const cost = raw ? raw.unitPrice * weight : 0;
                  const isInsufficient = raw && raw.stockKg < weight;
                  const percentage = totalBatchWeight > 0 ? ((weight / totalBatchWeight) * 100).toFixed(1) : '0.0';

                  return (
                    <div 
                      key={originalIndex}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                        isInsufficient ? 'bg-rose-50/70 border-rose-300' : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Index & Material Selector */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span className="font-mono font-bold text-slate-700">#{originalIndex + 1}</span>
                          {raw && (
                            <span className={`font-mono ${isInsufficient ? 'text-rose-700 font-bold' : 'text-slate-500'}`}>
                              {t.currentStockLabel}: {(raw.stockKg / 1000).toFixed(2)} {t.tons} ({raw.stockKg.toLocaleString()} kg)
                            </span>
                          )}
                        </div>
                        <select
                          value={ing.rawMaterialId}
                          onChange={(e) => handleUpdateIngredient(originalIndex, 'rawMaterialId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs font-medium"
                        >
                          {db.rawMaterials.map(rm => (
                            <option key={rm.id} value={rm.id}>
                              {getLocalizedName(rm.name)} • {rm.unitPrice} {t.currency}/kg ({t.currentStockLabel}: {rm.stockKg.toLocaleString()} kg)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Weight Input */}
                      <div className="w-full sm:w-32">
                        <label className="block text-[10px] text-slate-500 mb-1">{t.weightKgLabel}</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={ing.weightKg}
                            onChange={(e) => handleUpdateIngredient(originalIndex, 'weightKg', e.target.value ? Number(e.target.value) : 0)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-600 shadow-2xs"
                          />
                          <span className="absolute end-2 top-1.5 text-[10px] font-bold text-slate-400">kg</span>
                        </div>
                      </div>

                      {/* Batch Percentage Badge */}
                      <div className="w-full sm:w-16 text-center sm:pt-4">
                        <span className="text-[10px] text-slate-400 block sm:hidden">{t.percentageOfBatch}</span>
                        <span className="inline-block px-2 py-1 rounded bg-amber-100/70 border border-amber-200 text-amber-900 font-mono font-bold text-[11px]">
                          {percentage}%
                        </span>
                      </div>

                      {/* Line Cost Total */}
                      <div className="w-full sm:w-28 text-end sm:pt-4">
                        <span className="text-[10px] text-slate-400 block sm:hidden">{t.itemCostTotal}</span>
                        <span className="text-xs font-bold text-amber-800 font-mono block">
                          {cost.toLocaleString()} {t.currency}
                        </span>
                      </div>

                      {/* Remove Row Button */}
                      <div className="sm:pt-4 text-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(originalIndex)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={t.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions: Produce Button + Template Save Options */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Save as Template / Update Template Button */}
                {loadedFormulaId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveAsTemplate(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      <span>{t.updateTemplateBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAsTemplate(false)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookmarkPlus className="w-4 h-4 text-slate-500" />
                      <span>{t.saveNewTemplateBtn}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveAsTemplate(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookmarkPlus className="w-4 h-4 text-amber-400" />
                    <span>{t.saveAsTemplateBtn}</span>
                  </button>
                )}
              </div>

              {/* Main Produce Feed Button */}
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <PackageCheck className="w-5 h-5" />
                <span>{t.produceFeedBtn} ({totalTons.toFixed(2)} {t.tons})</span>
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Calculation Panel (1 Column) - Multi-Unit (Tons, Bags, Kg) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>{t.autoCostCalcTon}</span>
            </h3>

            <div className="space-y-3 mt-4">
              {/* Total Weight in Tons & Kilo */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">{t.totalFormulaWeight}:</span>
                <div className="text-2xl font-black font-mono text-slate-900 mt-1 flex items-baseline gap-2">
                  <span>{totalTons.toFixed(3)}</span>
                  <span className="text-sm font-bold text-amber-700">{t.tons}</span>
                </div>
                <div className="text-xs text-slate-600 mt-1.5 font-mono font-medium flex items-center gap-2 pt-1 border-t border-slate-200">
                  <span className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-800 font-bold">
                    {totalBatchWeight.toLocaleString()} {t.kilo}
                  </span>
                  <span>•</span>
                  <span className="bg-amber-100 px-2 py-0.5 rounded text-amber-800 font-bold">
                    {totalBags.toLocaleString()} {t.bags}
                  </span>
                  <span>•</span>
                  <span className="text-slate-500">
                    {ingredients.length} {t.itemsCount}
                  </span>
                </div>
              </div>

              {/* Raw Material Cost & Batch Expenses */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>{t.rawMaterialsCost} ({ingredients.length} {t.itemsCount}):</span>
                  <span className="font-mono font-bold">{totalRawMaterialCost.toLocaleString()} {t.currency}</span>
                </div>
                {batchExpenseAmount > 0 && (
                  <div className="flex justify-between items-center text-amber-700 mt-1.5 pt-1.5 border-t border-slate-200">
                    <span>{t.prodExpensesSub}:</span>
                    <span className="font-mono font-bold">+{batchExpenseAmount.toLocaleString()} {t.currency}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-900 font-bold mt-2 pt-2 border-t border-slate-300">
                  <span>{t.totalBatchCost}:</span>
                  <span className="font-mono text-cyan-700">{totalBatchCost.toLocaleString()} {t.currency}</span>
                </div>
              </div>

              {/* Comprehensive Cost Rate per Unit: TON, BAG, KG */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 block">
                    {t.costPerTonResult}:
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-800 mt-0.5">
                    {costPerTon.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} {t.currency}
                    <span className="text-xs font-medium text-emerald-700 ms-1">/ {t.tons}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-700 block">{t.costPerBag50kg}</span>
                    <strong className="font-mono text-emerald-900 text-sm">
                      {costPerBag.toFixed(0)} {t.currency}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 block">{t.costPerKgShort}</span>
                    <strong className="font-mono text-emerald-900 text-sm">
                      {costPerKg.toFixed(2)} {t.currency}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {t.costTransferNotice}
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 3. FORMULATED ITEM STOCK (PROCESSED FEED WAREHOUSE) - SIMPLE & FORMATTED TABLE    */}
      {/* -------------------------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Section Header & Unit Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t.formulatedStockSimpleTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {t.formulatedStockSimpleDesc}
              </p>
            </div>
          </div>

          {/* Unit Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStockViewUnit('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                stockViewUnit === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.allUnits}
            </button>
            <button
              type="button"
              onClick={() => setStockViewUnit('ton')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                stockViewUnit === 'ton'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.inTons}
            </button>
            <button
              type="button"
              onClick={() => setStockViewUnit('bag')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                stockViewUnit === 'bag'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.inBags}
            </button>
            <button
              type="button"
              onClick={() => setStockViewUnit('kg')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                stockViewUnit === 'kg'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.inKg}
            </button>
          </div>
        </div>

        {/* Global Processed Stock Overview Banners */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-800 block">{t.totalStockInTons}</span>
            <div className="text-xl font-bold font-mono text-amber-900 mt-1">
              {totalProcessedTons.toFixed(2)} {t.tons}
            </div>
            <span className="text-[10px] text-amber-700">{t.equivalentMetricTon}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 block">{t.totalInBags50kg}</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {totalProcessedBags.toLocaleString()} {t.bags}
            </div>
            <span className="text-[10px] text-slate-500">{t.bagsPerTonRule}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 block">{t.totalInKg}</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {totalProcessedKg.toLocaleString()} {t.kilos}
            </div>
            <span className="text-[10px] text-slate-500">{t.totalWarehouseWeight}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 block">{t.totalProcessedStockValue}</span>
            <div className="text-xl font-bold font-mono text-emerald-900 mt-1">
              {totalProcessedValue.toLocaleString()} {t.currency}
            </div>
            <span className="text-[10px] text-emerald-700">{db.processedStock.length} {t.readyFeedTypes}</span>
          </div>
        </div>

        {/* Formatted Processed Feed Stock Table (Simple and Clean Layout) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-start border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                <th className="py-3 px-4 text-start">{t.productName}</th>
                <th className="py-3 px-4 text-start">{t.currentStockLabel}</th>
                <th className="py-3 px-3 text-start">{t.costPerTon}</th>
                <th className="py-3 px-3 text-start">{t.costPerBag50kg}</th>
                <th className="py-3 px-3 text-start">{t.costPerKgShort}</th>
                <th className="py-3 px-4 text-start">{t.totalValue}</th>
                <th className="py-3 px-3 text-center">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {db.processedStock.map(p => {
                const bags = Math.round(p.stockKg / 50);
                const tons = p.stockKg / 1000;
                const ratePerTon = p.averageCostPerKg * 1000;
                const ratePerBag = p.averageCostPerKg * 50;
                const val = p.stockKg * p.averageCostPerKg;

                // Find corresponding saved formula if any
                const correspondingFormula = db.formulas.find(f => f.id === p.formulaId || f.name.toLowerCase() === p.name.toLowerCase());

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {getLocalizedName(p.name)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {t.date}: {p.lastUpdated}
                      </div>
                    </td>

                    {/* Formatted Multi-Unit Stock */}
                    <td className="py-3 px-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold font-mono text-amber-800">
                          {tons.toFixed(2)}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">{t.tons}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {bags.toLocaleString()} {t.bags} • {p.stockKg.toLocaleString()} {t.kilo}
                      </div>
                    </td>

                    {/* Cost per Ton */}
                    <td className="py-3 px-3 font-mono font-bold text-amber-900 text-xs">
                      {ratePerTon.toLocaleString(undefined, { maximumFractionDigits: 0 })} {t.currency}
                    </td>

                    {/* Cost per Bag */}
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800 text-xs">
                      {ratePerBag.toFixed(0)} {t.currency}
                    </td>

                    {/* Cost per Kg */}
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800 text-xs">
                      {p.averageCostPerKg.toFixed(2)} {t.currency}
                    </td>

                    {/* Total Stock Asset Value */}
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800 text-sm">
                      {val.toLocaleString()} {t.currency}
                    </td>

                    {/* Quick Load into Builder Action */}
                    <td className="py-3 px-3 text-center">
                      {correspondingFormula && (
                        <button
                          type="button"
                          onClick={() => handleLoadFormula(correspondingFormula)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title={t.loadFormulaToBuilder}
                        >
                          <RefreshCw className="w-3 h-3 text-amber-700" />
                          <span>{t.produceMoreBtn}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 4. SAVED FORMULAS CARDS DETAILS & RECIPE MANAGEMENT                              */}
      {/* -------------------------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-amber-600" />
          <span>{t.savedFormulasWithTons}</span>
        </h3>

        {db.formulas.length === 0 ? (
          <p className="text-xs text-slate-500 p-4 text-center">{t.noFormulaRegistered}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.formulas.map(f => {
              const formulaTons = f.totalWeightKg / 1000;
              const formulaBags = Math.round(f.totalWeightKg / 50);
              const costTon = f.costPerKg * 1000;
              const costBag = f.costPerKg * 50;

              return (
                <div
                  key={f.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{f.name}</h4>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleLoadFormula(f)}
                          className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          title={t.loadFormulaTemplate}
                        >
                          <FolderOpen className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormulaToDelete(f.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={t.deleteFormula}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {f.description && (
                      <p className="text-xs text-slate-600 mt-1">{f.description}</p>
                    )}

                    {/* Ingredients summary pills */}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {f.ingredients.slice(0, 4).map((ing, i) => (
                        <span key={i} className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {getLocalizedName(ing.rawMaterialName).split('(')[0].trim()}: {ing.weightKg}kg
                        </span>
                      ))}
                      {f.ingredients.length > 4 && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold">
                          +{f.ingredients.length - 4} {t.itemsCount}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>{t.totalFormulaWeight}:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formulaTons.toFixed(2)} {t.tons} ({f.totalWeightKg.toLocaleString()} kg • {formulaBags} {t.bags})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>{t.costPerTon}:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {costTon.toLocaleString(undefined, { maximumFractionDigits: 1 })} {t.currency}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>{t.costPerBag50kg} / {t.costPerKgShort}:</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {costBag.toFixed(0)} / {f.costPerKg.toFixed(2)} {t.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{t.date}: {f.createdDate}</span>
                    <button
                      type="button"
                      onClick={() => handleLoadFormula(f)}
                      className="text-amber-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t.loadFormulaTemplate}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 5. RECENT PRODUCTION BATCHES HISTORY                                             */}
      {/* -------------------------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <CalendarClock className="w-4 h-4 text-amber-600" />
          <span>{t.productionHistoryTons}</span>
        </h3>

        <div className="space-y-2.5">
          {db.productionBatches.slice(0, 8).map(b => {
            const batchTons = b.totalWeightKg / 1000;
            const batchBags = Math.round(b.totalWeightKg / 50);

            return (
              <div
                key={b.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{getLocalizedName(b.formulaName)}</h4>
                  <span className="text-[11px] text-slate-500">
                    {t.date}: {b.date} {b.operatorName ? `• ${t.operatorNameLabel}: ${b.operatorName}` : ''}
                  </span>
                  {b.notes && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{b.notes}</p>
                  )}
                </div>
                <div className="text-end">
                  <span className="font-bold font-mono text-slate-900 text-sm block">
                    {batchTons.toFixed(2)} {t.tons}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {batchBags} {t.bags} • {b.totalWeightKg.toLocaleString()} {t.kilo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* In-app Confirmation Modal for Deleting Formula */}
      {formulaToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t.deleteFormula}
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              {t.confirmDeleteFormula}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormulaToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFormula}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                {t.deleteFormulaConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
