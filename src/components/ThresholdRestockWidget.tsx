import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  AlertTriangle, 
  ArrowDownToLine, 
  SlidersHorizontal, 
  Truck, 
  Scale, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  TrendingDown,
  Info,
  Phone,
  ShieldAlert,
  Sparkles,
  Layers
} from 'lucide-react';

interface ThresholdRestockWidgetProps {
  setActiveTab: (tab: any) => void;
}

export const ThresholdRestockWidget: React.FC<ThresholdRestockWidgetProps> = ({ setActiveTab }) => {
  const { 
    db, 
    t, 
    lang, 
    lowStockThreshold, 
    setLowStockThreshold, 
    getLocalizedName, 
    getLocalizedCat 
  } = useDatabase();

  const [filterMode, setFilterMode] = useState<'all_attention' | 'critical' | 'warning' | 'all'>('all_attention');
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(lowStockThreshold.toString());

  const isRtl = lang === 'fa' || lang === 'ps';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(thresholdInput);
    if (!isNaN(val) && val > 0) {
      setLowStockThreshold(val);
      setEditingThreshold(false);
    }
  };

  // Analyze each material against its specific threshold or global default
  const analyzedMaterials = useMemo(() => {
    return db.rawMaterials.map(rm => {
      const targetThreshold = rm.lowStockThreshold ?? lowStockThreshold;
      const stockKg = rm.stockKg || 0;
      const ratio = targetThreshold > 0 ? (stockKg / targetThreshold) : 1;
      const percentage = Math.round(ratio * 100);
      
      const isCritical = stockKg <= targetThreshold; // <= 100% of threshold
      const isWarning = stockKg > targetThreshold && stockKg <= (targetThreshold * 1.3); // Between 100% and 130%
      const isHealthy = stockKg > (targetThreshold * 1.3);

      const shortageKg = Math.max(0, targetThreshold - stockKg);
      const shortageCost = shortageKg * rm.unitPrice;
      const tons = stockKg / 1000;
      const bags = Math.round(stockKg / 50);

      // Find supplier phone if available
      const supplierObj = db.suppliers.find(s => s.id === rm.supplierId || s.name === rm.supplierName);
      const supplierPhone = supplierObj?.phone || '';

      return {
        ...rm,
        targetThreshold,
        stockKg,
        ratio,
        percentage,
        isCritical,
        isWarning,
        isHealthy,
        shortageKg,
        shortageCost,
        tons,
        bags,
        supplierPhone,
      };
    }).sort((a, b) => {
      // Sort critical items first (ascending percentage)
      return a.percentage - b.percentage;
    });
  }, [db.rawMaterials, db.suppliers, lowStockThreshold]);

  // Filter based on active tab
  const displayedMaterials = useMemo(() => {
    switch (filterMode) {
      case 'critical':
        return analyzedMaterials.filter(m => m.isCritical);
      case 'warning':
        return analyzedMaterials.filter(m => m.isWarning);
      case 'all':
        return analyzedMaterials;
      case 'all_attention':
      default:
        return analyzedMaterials.filter(m => m.isCritical || m.isWarning);
    }
  }, [analyzedMaterials, filterMode]);

  const criticalCount = analyzedMaterials.filter(m => m.isCritical).length;
  const warningCount = analyzedMaterials.filter(m => m.isWarning).length;
  const totalShortageKg = analyzedMaterials.reduce((acc, m) => acc + m.shortageKg, 0);
  const totalShortageCost = analyzedMaterials.reduce((acc, m) => acc + m.shortageCost, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 1. WIDGET TOP HEADER */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-slate-50 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-3 rounded-2xl shrink-0 shadow-xs ${
              criticalCount > 0 
                ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse' 
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  {t.thresholdWidgetTitle}
                </h3>
                {criticalCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                    {criticalCount} {t.thresholdStatusCritical}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                    {warningCount} {t.thresholdStatusWarning}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t.thresholdWidgetSubtitle}
              </p>
            </div>
          </div>

          {/* Quick Threshold Adjuster & Restock All Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!editingThreshold ? (
              <button
                type="button"
                onClick={() => {
                  setThresholdInput(lowStockThreshold.toString());
                  setEditingThreshold(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title={t.configureThreshold}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.lowStockThresholdLabel} {lowStockThreshold.toLocaleString()} {t.kilo}</span>
              </button>
            ) : (
              <form onSubmit={handleSaveThreshold} className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-600"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {t.saveThreshold}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingThreshold(false)}
                  className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 cursor-pointer"
                >
                  {t.cancel}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>{t.manageRawStock}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Shortage Metrics Strip */}
        {totalShortageKg > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-amber-200/70 text-xs">
            <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between">
              <span className="text-slate-600">{t.recommendedRestockQty}:</span>
              <strong className="font-mono text-rose-700 text-sm">
                {(totalShortageKg / 1000).toFixed(2)} {t.tons} ({totalShortageKg.toLocaleString()} {t.kilo})
              </strong>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between">
              <span className="text-slate-600">{t.totalValue}:</span>
              <strong className="font-mono text-slate-900 text-sm">
                {totalShortageCost.toLocaleString()} {t.currency}
              </strong>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between">
              <span className="text-slate-600">{t.itemsNeedRestock}:</span>
              <strong className="font-mono text-amber-900 text-sm">
                {criticalCount + warningCount} {t.itemsCount}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* 2. FILTER TABS */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all_attention')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'all_attention'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {t.thresholdFilterAll} ({criticalCount + warningCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('critical')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'critical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-rose-700 hover:bg-rose-50'
            }`}
          >
            {t.thresholdFilterCritical} ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('warning')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'warning'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-amber-700 hover:bg-amber-50'
            }`}
          >
            {t.thresholdFilterWarning} ({warningCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {t.all} ({analyzedMaterials.length})
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          {displayedMaterials.length} {t.itemsCount}
        </span>
      </div>

      {/* 3. MATERIAL ITEMS TABLE / LIST */}
      {displayedMaterials.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4 text-start">{t.materialName}</th>
                <th className="py-3 px-3 text-start">{t.currentStockLabel}</th>
                <th className="py-3 px-3 text-start">{t.thresholdLimitLabel}</th>
                <th className="py-3 px-4 text-start">{t.percentageOfThreshold}</th>
                <th className="py-3 px-3 text-start">{t.recommendedRestockQty}</th>
                <th className="py-3 px-3 text-start">{t.supplier}</th>
                <th className="py-3 px-4 text-center">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedMaterials.map((m) => {
                const isCrit = m.isCritical;
                const isWarn = m.isWarning;

                // Color classes based on severity
                const barColor = isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500';
                const badgeBg = isCrit 
                  ? 'bg-rose-100 text-rose-800 border-rose-200' 
                  : isWarn 
                  ? 'bg-amber-100 text-amber-800 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                return (
                  <tr 
                    key={m.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isCrit ? 'bg-rose-50/20' : isWarn ? 'bg-amber-50/15' : ''
                    }`}
                  >
                    {/* Material Name & Category */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {isCrit && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />}
                        <span>{getLocalizedName(m.name)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200">
                          {getLocalizedCat(m.category)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {m.unitPrice} {t.currency}/kg
                        </span>
                      </div>
                    </td>

                    {/* Current Stock */}
                    <td className="py-3.5 px-3">
                      <div className={`font-mono font-bold text-sm ${isCrit ? 'text-rose-700' : isWarn ? 'text-amber-800' : 'text-slate-900'}`}>
                        {m.tons.toFixed(2)} {t.tons}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {m.stockKg.toLocaleString()} {t.kilo} • {m.bags} {t.bags}
                      </div>
                    </td>

                    {/* Minimum Threshold */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono text-slate-700 font-semibold text-xs">
                        {(m.targetThreshold / 1000).toFixed(2)} {t.tons}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {m.targetThreshold.toLocaleString()} kg
                      </div>
                    </td>

                    {/* Status & Visual Progress Bar */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeBg}`}>
                          {isCrit ? t.statusLow : isWarn ? t.thresholdStatusWarning : t.statusNormal}
                        </span>
                        <span className="font-bold text-slate-700">{m.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className={`h-full rounded-full transition-all ${barColor}`} 
                          style={{ width: `${Math.min(100, Math.max(5, m.percentage))}%` }} 
                        />
                      </div>
                    </td>

                    {/* Shortage to Safety Buffer */}
                    <td className="py-3.5 px-3">
                      {m.shortageKg > 0 ? (
                        <div>
                          <span className="font-mono font-bold text-rose-700 text-xs">
                            +{(m.shortageKg / 1000).toFixed(2)} {t.tons}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            ~ {m.shortageCost.toLocaleString()} {t.currency}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t.thresholdStatusAdequate}</span>
                        </span>
                      )}
                    </td>

                    {/* Supplier & Phone */}
                    <td className="py-3.5 px-3">
                      {m.supplierName ? (
                        <div>
                          <div className="font-semibold text-slate-900 text-xs truncate max-w-[120px]" title={m.supplierName}>
                            {m.supplierName}
                          </div>
                          {m.supplierPhone && (
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-amber-600" />
                              <span dir="ltr">{m.supplierPhone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Action Button: Direct to Restock */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveTab('inventory')}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 mx-auto cursor-pointer active:scale-95"
                        title={t.restockItem}
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5 text-amber-700" />
                        <span>{t.actionRestock}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center bg-emerald-50/40">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-slate-900">{t.allStockHealthy}</h4>
          <p className="text-xs text-slate-600 mt-1">{t.noMaterialsNearThreshold}</p>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className="mt-3 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            {t.all}
          </button>
        </div>
      )}
    </div>
  );
};
