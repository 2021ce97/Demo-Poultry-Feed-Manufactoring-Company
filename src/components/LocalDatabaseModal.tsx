import React, { useState, useRef } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Database, 
  Download, 
  Upload, 
  FileCode2, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  HardDrive, 
  Layers,
  X,
  AlertTriangle,
  Package,
  Receipt,
  Users,
  Building2
} from 'lucide-react';

interface LocalDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalDatabaseModal: React.FC<LocalDatabaseModalProps> = ({ isOpen, onClose }) => {
  const { 
    db, 
    lang, 
    exportDatabase, 
    importDatabase, 
    exportSQL, 
    seedExtraData, 
    resetToDefaultData 
  } = useDatabase();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Approximate database size in localStorage
  const factoryJson = JSON.stringify(db);
  const totalBytes = new Blob([factoryJson]).size;
  const storageKb = (totalBytes / 1024).toFixed(1);

  const handleSeedData = () => {
    seedExtraData();
    setSuccessMessage(
      lang === 'fa' 
        ? 'اطلاعات نمونه و فاکتورهای جدید فابریکه با موفقیت اضافه شد!' 
        : lang === 'ps' 
        ? 'د فابریکې نوي معلومات او بیلونه اضافه شول!' 
        : 'Factory sample data and transactions added successfully!'
    );
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const ok = importDatabase(text);
        if (ok) {
          setSuccessMessage(lang === 'fa' ? 'دیتابیس با موفقیت بازیابی شد!' : 'ډیټابیس په بریالیتوب سره راوستل شو!');
          setTimeout(() => setSuccessMessage(null), 4000);
        } else {
          setErrorMessage(lang === 'fa' ? 'خطا در خواندن فایل JSON!' : 'د JSON فایل په لوستلو کې تېروتنه!');
          setTimeout(() => setErrorMessage(null), 4000);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetConfirm = () => {
    const confirmText = lang === 'fa' 
      ? 'آیا مطمئن هستید که می‌خواهید دیتابیس را به حالت اولیه فابریکه بازنشانی کنید؟ تمام تغییرات پاک خواهد شد.' 
      : 'آیا ډاډه یاست چې غواړئ ډیټابیس لومړني حالت ته راوګرځوئ؟';
    if (window.confirm(confirmText)) {
      resetToDefaultData();
      setSuccessMessage(lang === 'fa' ? 'دیتابیس به حالت اولیه بازنشانی شد.' : 'ډیټابیس لومړني حالت ته وګرځول شو.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const isRtl = lang === 'fa' || lang === 'ps';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 end-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{lang === 'fa' ? 'دیتابیس محلی کارخانه (Local Database)' : 'د فابریکې محلي ډیټابیس'}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  100% Local DB
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {lang === 'fa' 
                  ? 'ذخیره‌سازی پایدار در مرورگر با قابلیت اجرا و دیپلوی مستقیم روی Vercel بدون نیاز به سرور خارجی'
                  : 'په براوزر کې ذخیره شوی محلي ډیټابیس د Vercel لپاره چمتو'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Notification Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Vercel Deployment Notice Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-600/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>آماده برای دیپلوی در Vercel (Vercel Ready)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  سیستم به صورت کامل مستقل کار می‌کند. با دیپلوی در Vercel هیچ سرور یا کلید اضافی نیاز نیست.
                </p>
              </div>
            </div>
            <div className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs font-bold font-mono">
              vercel.json ✓
            </div>
          </div>

          {/* Database Statistics Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>آمار و اقلام ثبت شده در دیتابیس کارخانه</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1">حجم دیتابیس:</span>
                <span className="font-bold text-base text-slate-900 font-mono">{storageKb} KB</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1">مواد خام گدام:</span>
                <span className="font-bold text-base text-amber-600 font-mono">{db.rawMaterials.length} قلم</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1">دسته‌های تولید (بچ):</span>
                <span className="font-bold text-base text-indigo-600 font-mono">{db.productionBatches.length} دسته</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1">فروشات و فاکتورها:</span>
                <span className="font-bold text-base text-emerald-600 font-mono">{db.sales.length} فاکتور</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1">مشتریان و فارم‌ها:</span>
                <span className="font-bold text-base text-slate-900 font-mono">{db.customers.length} فارم</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1">عرضه‌کنندگان مواد:</span>
                <span className="font-bold text-base text-slate-900 font-mono">{db.suppliers.length} شرکت</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Seed Data, Export, Import, SQL */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>عملیات و مدیریت دیتابیس کارخانه</span>
            </h3>

            {/* Seed More Data Button */}
            <button
              type="button"
              onClick={handleSeedData}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>افزودن دیتا و معلومات بیشتر به کارخانه (+ دیتای نمونه افغانی)</span>
            </button>

            {/* Grid of Secondary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Export JSON */}
              <button
                type="button"
                onClick={exportDatabase}
                className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span>دانلود بکاپ کامل (JSON)</span>
              </button>

              {/* Import JSON */}
              <label className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>بازیابی فایل بکاپ</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              {/* Download SQL Dump */}
              <button
                type="button"
                onClick={exportSQL}
                className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCode2 className="w-4 h-4 text-emerald-600" />
                <span>دانلود اسکریپت SQL</span>
              </button>
            </div>

            {/* Reset to Clean Defaults */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResetConfirm}
                className="text-xs text-rose-600 hover:text-rose-800 hover:underline transition-colors font-medium flex items-center justify-center gap-1 mx-auto cursor-pointer p-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی به دیتای اولیه کارخانه</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>سیستم محلی آماده و فعال است</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
