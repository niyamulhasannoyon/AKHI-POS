'use client';

import { useEffect, useState } from 'react';
import { farmStore } from '@/lib/store';
import { Download, Upload, Clock as ClockIcon } from 'lucide-react';

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
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
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

  return (
    <header className="h-16 bg-[#090d16]/80 backdrop-blur-md border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-30 ml-64">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-white tracking-tight">Akhi Farm Management System</h2>
      </div>

      <div className="flex items-center gap-4 text-xs">
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
      </div>
    </header>
  );
}
