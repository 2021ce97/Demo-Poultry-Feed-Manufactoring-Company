/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { FormulaView } from './components/FormulaView';
import { SalesView } from './components/SalesView';
import { SuppliersView } from './components/SuppliersView';
import { CustomersView } from './components/CustomersView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { LocalDatabaseModal } from './components/LocalDatabaseModal';
import { 
  LayoutDashboard, 
  Warehouse, 
  FlaskConical, 
  ShoppingCart, 
  Receipt,
  Menu,
  Database
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, lang, t, isAuthLoading, isDatabaseLoading } = useDatabase();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLocalDbModalOpen, setIsLocalDbModalOpen] = useState(false);

  // Synchronize document dir and lang attributes with the selected language
  useEffect(() => {
    const isRtl = lang === 'fa' || lang === 'ps';
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  if (isAuthLoading || (user && isDatabaseLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600 text-sm">
        در حال بارگذاری دیتابیس کارخانه...
      </div>
    );
  }

  // If no user is signed in, prompt login
  if (!user) {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={(tab: string) => setActiveTab(tab as ActiveTab)} />;
      case 'inventory':
        return <InventoryView />;
      case 'formula':
        return <FormulaView />;
      case 'sales':
        return <SalesView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'customers':
        return <CustomersView />;
      case 'expenses':
        return <ExpensesView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView setActiveTab={(tab: string) => setActiveTab(tab as ActiveTab)} />;
    }
  };

  const mobileNavItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'inventory', label: t.navInventory, icon: Warehouse },
    { id: 'formula', label: t.navFormula, icon: FlaskConical },
    { id: 'sales', label: t.navSales, icon: ShoppingCart },
    { id: 'expenses', label: t.navExpenses, icon: Receipt },
  ];

  const isRtl = lang === 'fa' || lang === 'ps';

  return (
    <div 
      className="min-h-screen bg-slate-100 text-slate-900 flex flex-row font-sans selection:bg-amber-500 selection:text-white"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenLocalDbModal={() => setIsLocalDbModalOpen(true)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 sm:pb-8">
        {/* Top Header Bar */}
        <TopBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenLocalDbModal={() => setIsLocalDbModalOpen(true)}
        />

        {/* Page Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderActiveView()}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 print:hidden text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              {t.companyName} • سیستم مدیریت تولید خوراکه مرغداری
            </span>
            <div className="flex items-center gap-3 text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>دیتابیس محلی فعال (Vercel Ready)</span>
              </span>
              <span>•</span>
              <span className="text-amber-400 font-bold" dir="ltr">0780 001 923</span>
            </div>
          </div>
        </footer>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 px-2 py-1.5 flex items-center justify-around shadow-2xl print:hidden">
          {mobileNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium cursor-pointer ${
                  isActive
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="truncate max-w-[56px]">{item.label}</span>
              </button>
            );
          })}

          {/* Local DB button on mobile */}
          <button
            type="button"
            onClick={() => setIsLocalDbModalOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
          >
            <Database className="w-5 h-5 mb-0.5 text-slate-500" />
            <span>دیتابیس</span>
          </button>

          {/* More button to trigger sidebar */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-400 hover:text-slate-200 text-[10px] font-medium cursor-pointer"
          >
            <Menu className="w-5 h-5 mb-0.5 text-slate-500" />
            <span>{t.morePages}</span>
          </button>
        </nav>
      </div>

      {/* Local Database Management Modal */}
      <LocalDatabaseModal
        isOpen={isLocalDbModalOpen}
        onClose={() => setIsLocalDbModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}
