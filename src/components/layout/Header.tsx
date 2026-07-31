'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { farmStore } from '@/lib/store';
import { Download, Upload, Clock as ClockIcon, RotateCcw, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export default function Header({ onToggleMobileSidebar }: HeaderProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [activeFlocksCount, setActiveFlocksCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  useEffect(() => {
    const updateStats = () => {
      const state = farmStore.getState();
      const activeFlocks = state.flocks.filter(f => f.status === 'Active').length;
      const lowStock = state.products.filter(p => p.stock <= p.minStock).length;
      setActiveFlocksCount(activeFlocks);
      setLowStockCount(lowStock);
    };

    updateStats();
    const unsub = farmStore.subscribe(updateStats);

    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(farmStore.exportBackupJSON());
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `Akhi_Farm_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const success = farmStore.importBackupJSON(evt.target?.result as string);
          if (success) {
            alert('Farm backup restored successfully!');
            location.reload();
          } else {
            alert('Invalid backup JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    const success = await farmStore.syncWithCloudDb();
    setIsSyncing(false);
    if (success) {
      alert('Neon PostgreSQL ক্লাউড ডাটাবেজের সাথে সফলভাবে সব ডেটা সিঙ্ক হয়েছে!');
    } else {
      alert('ক্লাউড ডাটাবেজ সিঙ্ক ব্যর্থ হয়েছে অথবা DATABASE_URL ভ্যারিয়েবল সেট করা নেই।');
    }
  };

  const handleResetAllData = () => {
    if (confirm('আপনি কি নিশ্চিত যে সমস্ত ডেমো ডেটা মুছে ফেলে রিয়েল কাজের জন্য সিস্টেম রিসেট করতে চান? (এই অ্যাকশনটি ব্যাকআপ না নিয়ে ফিরিয়ে আনা যাবে না)')) {
      farmStore.clearAllData();
      alert('সফলভাবে সমস্ত ডেমো ডেটা রিসেট করা হয়েছে! আপনি এখন আসল ডেটা নিয়ে কাজ করতে পারবেন।');
      location.reload();
    }
  };

  return (
    <header className="min-h-16 bg-[#090d16]/90 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between sticky top-0 z-30 lg:ml-64 gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight truncate max-w-[170px] xs:max-w-[240px] sm:max-w-none">
            Akhi Farm Management
          </h2>
        </Link>
      </div>

      <div className="flex items-center flex-wrap gap-2 text-xs">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <span>{activeFlocksCount} Flocks</span>
        </div>

        <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full ${lowStockCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          <span>{lowStockCount} Low Stock</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-gray-400 font-mono">
          <ClockIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>{timeStr || '00:00:00 AM'}</span>
        </div>

        <button
          onClick={handleSyncDatabase}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg font-bold transition disabled:opacity-50 text-[11px] sm:text-xs"
          title="localhost এবং live domain-এর মধ্যে ডেটাবেজ সিঙ্ক করুন"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="inline">{isSyncing ? 'সিঙ্ক...' : '⚡ সিঙ্ক'}</span>
        </button>

        <button 
          onClick={handleExportBackup} 
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-medium transition text-[11px] sm:text-xs"
          title="Export JSON backup"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Backup</span>
        </button>

        <button 
          onClick={handleImportBackup} 
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-medium transition text-[11px] sm:text-xs"
          title="Import JSON backup"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import</span>
        </button>

        <button 
          onClick={handleResetAllData} 
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg font-bold transition text-[11px] sm:text-xs"
          title="সমস্ত ডেমো ডেটা মুছে ফেলে রিয়েল কাজের জন্য সিস্টেম পরিষ্কার করুন"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>রিসেট</span>
        </button>
      </div>
    </header>
  );
}
