'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { KhamariLog, Flock } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, CalendarCheck } from 'lucide-react';

export default function KhamariPage() {
  const [logs, setLogs] = useState<KhamariLog[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);

  useEffect(() => {
    const update = () => {
      const state = farmStore.getState();
      setLogs(state.khamariLogs || []);
      setFlocks(state.flocks || []);
    };
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleAddLog = () => {
    const activeFlocks = flocks.filter(f => f.status === 'Active');
    if (activeFlocks.length === 0) {
      alert('Please add an active flock batch first!');
      return;
    }

    const flockId = prompt(`Enter Flock ID (${activeFlocks.map(f => `${f.id}:${f.name}`).join(', ')}):`, activeFlocks[0].id);
    if (!flockId) return;

    const eggGood = Number(prompt('Good Eggs Collected:', '1500')) || 0;
    const feedBags = Number(prompt('Feed Consumed (Bags):', '4.5')) || 0;
    const mortality = Number(prompt('Mortality Bird Count:', '2')) || 0;

    const newLog: KhamariLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      flockId,
      date: new Date().toISOString().slice(0, 10),
      eggGood,
      eggDamaged: 5,
      feedBags,
      mortality,
      temperature: 28,
      notes: 'Daily production entry'
    };

    // Add Log
    farmStore.addItem('khamariLogs', newLog);

    // Auto-update flock count
    const targetFlock = flocks.find(f => f.id === flockId);
    if (targetFlock && mortality > 0) {
      farmStore.updateItem('flocks', flockId, { currentQty: Math.max(0, targetFlock.currentQty - mortality) });
    }

    // Auto add egg crates to inventory (PRD-003)
    if (eggGood > 0) {
      const eggProduct = farmStore.getState().products.find(p => p.id === 'PRD-003');
      if (eggProduct) {
        const addedCrates = Math.floor(eggGood / 30);
        if (addedCrates > 0) {
          farmStore.updateItem('products', eggProduct.id, { stock: eggProduct.stock + addedCrates });
        }
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this daily log entry?')) {
      farmStore.deleteItem('khamariLogs', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-amber-400" />
            <span>Khamari Daily Production Logger</span>
          </h2>
          <p className="text-xs text-gray-400">Record daily egg collection, feed intake, mortality, and shed observations.</p>
        </div>
        <button
          onClick={handleAddLog}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-950/50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Log Production Entry</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Flock Batch</th>
                <th>Good Eggs</th>
                <th>Damaged</th>
                <th>Feed (Bags)</th>
                <th>Mortality</th>
                <th>Temp</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const flock = flocks.find(f => f.id === log.flockId);
                return (
                  <tr key={log.id}>
                    <td className="font-bold text-white">{formatDate(log.date)}</td>
                    <td className="font-bold text-emerald-400">{flock ? flock.name : log.flockId}</td>
                    <td className="font-extrabold text-emerald-400">🥚 {log.eggGood}</td>
                    <td className="text-red-400">{log.eggDamaged}</td>
                    <td className="font-bold text-amber-400">🌾 {log.feedBags} Bags</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${log.mortality > 3 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-300'}`}>
                        ☠ {log.mortality}
                      </span>
                    </td>
                    <td>{log.temperature || 28}°C</td>
                    <td className="text-xs text-gray-400">{log.notes || '-'}</td>
                    <td>
                      <button onClick={() => handleDelete(log.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
