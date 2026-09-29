import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Menu, 
  Bell, 
  Wallet, 
  AlertTriangle, 
  SlidersHorizontal, 
  CheckCircle2, 
  LogOut, 
  Database,
  Wheat,
  X
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { Language } from '../types';

interface TopBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMobileMenu: () => void;
  onOpenRestockModal?: () => void;
  onOpenLocalDbModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  onOpenRestockModal,
  onOpenLocalDbModal,
}) => {
  const { 
    lang, 
    setLang, 
    t, 
    db, 
    user, 
    logout, 
    lowStockThreshold, 
    setLowStockThreshold, 
    lowStockMaterials,
    getLocalizedName
  } = useDatabase();

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(lowStockThreshold.toString());

  const isRtl = lang === 'fa' || lang === 'ps';

  const getTabTitle = (): string => {
    switch (activeTab) {
      case 'dashboard': return t.navDashboard;
      case 'inventory': return t.navInventory;
      case 'formula': return t.navFormula;
      case 'sales': return t.navSales;
      case 'suppliers': return t.navSuppliers;
      case 'customers': return t.navCustomers;
      case 'expenses': return t.navExpenses;
      case 'reports': return t.navReports;
      default: return t.companyName;
    }
  };

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(thresholdInput);
    if (!isNaN(val) && val > 0) {
      setLowStockThreshold(val);
      setEditingThreshold(false);
    }
  };

  const handleGoToInventory = () => {
    setActiveTab('inventory');
    setShowNotificationModal(false);
    if (onOpenRestockModal) {
      onOpenRestockModal();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-xs">
        {/* Left / Start: Mobile Menu Toggle & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate flex items-center gap-2">
              <span>{getTabTitle()}</span>
            </h1>
            <span className="text-[11px] text-slate-500 hidden md:inline-flex items-center gap-1.5 font-medium">
              <span>{t.companyName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-700 font-mono font-bold" dir="ltr">0780 001 923</span>
            </span>
          </div>
        </div>

        {/* Right / End: Local DB, Cash, Notifications, Language & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Local Database Modal Button */}
          <button
            type="button"
            onClick={onOpenLocalDbModal}
            className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="دیتابیس محلی (Local DB)"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">دیتابیس محلی</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>

          {/* Cash in Hand Quick Badge */}
          <div 
            onClick={() => setActiveTab('expenses')}
            className="cursor-pointer hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 transition-all text-xs"
            title={t.moneyInHandCard}
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <div className="flex flex-col text-start">
              <span className="text-[10px] text-slate-500 leading-none">{t.moneyInHandCard}</span>
              <span className="font-bold text-emerald-700 font-mono">
                {db.cashInHand.toLocaleString()} {t.currency}
              </span>
            </div>
          </div>

          {/* Stock Notification Bell */}
          <button
            type="button"
            onClick={() => setShowNotificationModal(true)}
            className={`relative p-2 rounded-xl border transition-colors cursor-pointer ${
              lowStockMaterials.length > 0
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={t.notifications}
          >
            <Bell className="w-4 h-4" />
            {lowStockMaterials.length > 0 && (
              <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {lowStockMaterials.length}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-xl text-xs font-semibold">
            {(['fa', 'ps', 'en'] as Language[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === l
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {l === 'fa' ? 'دری' : l === 'ps' ? 'پښتو' : 'EN'}
              </button>
            ))}
          </div>

          {/* User Profile / Logout */}
          {user && (
            <div className="flex items-center gap-1.5 ps-1 border-s border-slate-200">
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title={t.logoutBtn}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Low Stock Alerts Modal */}
      {showNotificationModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{t.notifications}</h3>
                  <p className="text-xs text-slate-300">
                    {lowStockMaterials.length > 0 
                      ? `${t.itemsNeedRestock}: ${lowStockMaterials.length}`
                      : t.allStockHealthy}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto space-y-3">
              {lowStockMaterials.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 stroke-1" />
                  <span>{t.allStockHealthy}</span>
                </div>
              ) : (
                lowStockMaterials.map(m => (
                  <div key={m.id} className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {getLocalizedName(m.name)}
                      </span>
                      <span className="text-xs text-rose-700 font-medium">
                        موجودی فعلی: {m.stockKg.toLocaleString()} کیلوگرام (کمتر از {lowStockThreshold} کیلو)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoToInventory}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      {t.restockNow}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Threshold Configuration Section */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs">
              {editingThreshold ? (
                <form onSubmit={handleSaveThreshold} className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">{t.lowStockThresholdLabel}:</span>
                  <input
                    type="number"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-center"
                    min="10"
                    step="50"
                  />
                  <span className="text-slate-500">کیلو</span>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold cursor-pointer"
                  >
                    ذخیره
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingThreshold(false)}
                    className="px-2 py-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    انصراف
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between text-slate-600">
                  <span>{t.lowStockThresholdLabel}: <strong className="text-slate-900 font-mono">{lowStockThreshold} کیلوگرام</strong></span>
                  <button
                    type="button"
                    onClick={() => setEditingThreshold(true)}
                    className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{t.configureThreshold}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
