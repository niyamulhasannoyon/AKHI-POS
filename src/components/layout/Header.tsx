'use client';

import { useEffect, useState } from 'react';
import { farmStore } from '@/lib/store';
import { Download, Upload, Clock as ClockIcon, RotateCcw } from 'lucide-react';

export default function Header() {
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
    <header className="h-16 bg-[#090d16]/80 backdrop-blur-md border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-30 ml-64">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-white tracking-tight">Akhi Farm Management System</h2>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <span>{activeFlocksCount} Active Flocks</span>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full ${lowStockCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          <span>{lowStockCount} Low Stock Alerts</span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-400 font-mono">
          <ClockIcon className="w-4 h-4 text-emerald-400" />
          <span>{timeStr || '00:00:00 AM'}</span>
        </div>

        <button
          onClick={handleSyncDatabase}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg font-bold transition disabled:opacity-50"
          title="localhost এবং live domain-এর মধ্যে ডেটাবেজ সিঙ্ক করুন"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : '⚡ ডাটাবেজ সিঙ্ক'}</span>
        </button>

        <button 
          onClick={handleExportBackup} 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-medium transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Backup</span>
        </button>

        <button 
          onClick={handleImportBackup} 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-medium transition"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>

        <button 
          onClick={handleResetAllData} 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg font-bold transition"
          title="সমস্ত ডেমো ডেটা মুছে ফেলে রিয়েল কাজের জন্য সিস্টেম পরিষ্কার করুন"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>রিসেট ডেটা</span>
        </button>
      </div>
    </header>
  );
}
