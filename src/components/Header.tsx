import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Language } from '../types';
import { 
  Building2, 
  Wallet, 
  Globe2, 
  Menu, 
  X, 
  Printer, 
  Download, 
  Wheat, 
  TrendingUp, 
  Scale, 
  Truck, 
  Users, 
  Receipt, 
  FileSpreadsheet, 
  LayoutDashboard 
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { db, lang, t, setLang, exportDatabase } = useDatabase();

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'inventory', label: t.navInventory, icon: Wheat },
    { id: 'formula', label: t.navFormula, icon: Scale },
    { id: 'sales', label: t.navSales, icon: TrendingUp },
    { id: 'suppliers', label: t.navSuppliers, icon: Truck },
    { id: 'customers', label: t.navCustomers, icon: Users },
    { id: 'expenses', label: t.navExpenses, icon: Receipt },
    { id: 'reports', label: t.navReports, icon: FileSpreadsheet },
  ];

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200/80 shadow-xs no-print">
      {/* Top Banner with Company Names in 3 languages & controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          
          {/* Logo & Company Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-600/20 flex items-center justify-center text-amber-700 shadow-xs shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                  {t.companyName}
                </h1>
              </div>
              <p className="text-xs text-stone-500 line-clamp-1 font-normal">
                {t.companySubtitle}
              </p>
            </div>
          </div>

          {/* Right Controls: Cash In Hand & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Money in Hand badge */}
            <div 
              id="cash-pill-header"
              onClick={() => setActiveTab('expenses')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium cursor-pointer hover:bg-emerald-100 transition-colors"
              title={t.moneyInHandCard}
            >
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>{t.moneyInHandCard}:</span>
              <span className="font-bold text-emerald-950 font-mono text-sm">
                {db.cashInHand.toLocaleString()} {t.currency}
              </span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => handleLangChange('fa')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  lang === 'fa' 
                    ? 'bg-white text-amber-800 shadow-xs font-bold' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                دری
              </button>
              <button
                type="button"
                onClick={() => handleLangChange('ps')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  lang === 'ps' 
                    ? 'bg-white text-amber-800 shadow-xs font-bold' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                پښتو
              </button>
              <button
                type="button"
                onClick={() => handleLangChange('en')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  lang === 'en' 
                    ? 'bg-white text-amber-800 shadow-xs font-bold' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                EN
              </button>
            </div>

            {/* Print & Backup quick action */}
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden lg:flex p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
              title={t.printReport}
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 border-t border-stone-100 py-1 overflow-x-auto no-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {/* Mobile Cash In Hand */}
          <div className="flex items-center justify-between p-3 mb-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Wallet className="w-4 h-4 text-emerald-600" />
              {t.moneyInHandCard}:
            </span>
            <span className="font-bold text-sm font-mono">
              {db.cashInHand.toLocaleString()} {t.currency}
            </span>
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
