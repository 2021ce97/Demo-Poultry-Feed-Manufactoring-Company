import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  LayoutDashboard, 
  Warehouse, 
  FlaskConical, 
  ShoppingCart, 
  Truck, 
  Users, 
  Receipt, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Wheat, 
  Database,
  X 
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard'
  | 'inventory'
  | 'formula'
  | 'sales'
  | 'suppliers'
  | 'customers'
  | 'expenses'
  | 'reports';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenLocalDbModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
  onOpenLocalDbModal,
}) => {
  const { lang, t, user, logout, lowStockMaterials } = useDatabase();
  const isRtl = lang === 'fa' || lang === 'ps';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: t.navDashboard,
      icon: LayoutDashboard,
      badge: lowStockMaterials.length > 0 ? lowStockMaterials.length : undefined,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    },
    {
      id: 'inventory' as ActiveTab,
      label: t.navInventory,
      icon: Warehouse,
      badge: lowStockMaterials.length > 0 ? lowStockMaterials.length : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'formula' as ActiveTab,
      label: t.navFormula,
      icon: FlaskConical,
    },
    {
      id: 'sales' as ActiveTab,
      label: t.navSales,
      icon: ShoppingCart,
    },
    {
      id: 'suppliers' as ActiveTab,
      label: t.navSuppliers,
      icon: Truck,
    },
    {
      id: 'customers' as ActiveTab,
      label: t.navCustomers,
      icon: Users,
    },
    {
      id: 'expenses' as ActiveTab,
      label: t.navExpenses,
      icon: Receipt,
    },
    {
      id: 'reports' as ActiveTab,
      label: t.navReports,
      icon: BarChart3,
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const CollapseIcon = isRtl
    ? (isCollapsed ? ChevronLeft : ChevronRight)
    : (isCollapsed ? ChevronRight : ChevronLeft);

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white border-r border-slate-200 text-slate-800 shadow-sm">
      {/* Top Brand */}
      <div>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-amber-500/25">
              <Wheat className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h2 className="font-bold text-sm tracking-tight text-slate-900 truncate">
                  {t.companyName}
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t.systemOnline}</span>
                </div>
              </div>
            )}
          </div>

          {/* Close on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          <div className="pt-2 pb-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {lang === 'fa' ? 'مدیریت کارخانه المکه' : 'د فابریکې څانګې'}
              </span>
            )}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && (
                  <span className="flex-1 text-start truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Local Database Modal Button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                onOpenLocalDbModal();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
            >
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-start">
                  <span>دیتابیس محلی (Local DB)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Footer Area: User Profile & Collapse Toggle */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/50">
        {user && !isCollapsed && (
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-amber-700 block truncate">
                {user.role}
              </span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
              title={t.logoutBtn}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-medium cursor-pointer"
        >
          <CollapseIcon className="w-4 h-4" />
          {!isCollapsed && <span className="ms-2">{t.sidebarCollapse}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 z-30 sticky top-0 h-screen ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-full h-full z-10 animate-slideIn">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
