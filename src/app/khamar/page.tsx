'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Flock } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, Bird } from 'lucide-react';

export default function KhamarPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);

  useEffect(() => {
    const update = () => setFlocks(farmStore.getState().flocks || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleAddFlock = () => {
    const name = prompt('Batch Title / Name (e.g. Batch 104 - Layer):');
    if (!name) return;
    const breed = prompt('Breed (e.g. Sonali Classic):', 'Sonali') || 'Sonali';
    const houseNo = prompt('Shed / House No:', 'Shed 1') || 'Shed 1';
    const initialQty = Number(prompt('Initial Bird Count:', '2000')) || 1000;

    const newFlock: Flock = {
      id: `FL-${Date.now().toString().slice(-4)}`,
      name,
      breed,
      houseNo,
      initialQty,
      currentQty: initialQty,
      startDate: new Date().toISOString().slice(0, 10),
      ageDays: 1,
      status: 'Active'
    };

    farmStore.addItem('flocks', newFlock);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this flock batch?')) {
      farmStore.deleteItem('flocks', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bird className="w-6 h-6 text-emerald-400" />
            <span>Flock Batch Lifecycle Tracker</span>
          </h2>
          <p className="text-xs text-gray-400">Manage active poultry sheds, bird counts, age, and mortality metrics.</p>
        </div>
        <button
          onClick={handleAddFlock}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Flock Batch</span>
        </button>
      </div>

      {/* Flocks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {flocks.map(f => {
          const mortalityCount = f.initialQty - f.currentQty;
          const mortalityPct = ((mortalityCount / f.initialQty) * 100).toFixed(1);

          return (
            <div key={f.id} className="glass-card border-l-4 border-l-emerald-500">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">{f.status}</span>
                  <h3 className="font-bold text-white text-base mt-1">{f.name}</h3>
                  <div className="text-xs text-gray-400">{f.breed} • {f.houseNo}</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-amber-400">{f.ageDays}</span>
                  <div className="text-[10px] text-gray-400 uppercase">Days Old</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs">
                <div>
                  <div className="text-gray-400 text-[10px]">Birds Count</div>
                  <div className="font-bold text-white">{f.currentQty} / {f.initialQty}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px]">Mortality Rate</div>
                  <div className={`font-bold ${Number(mortalityPct) > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {mortalityCount} ({mortalityPct}%)
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flocks Table */}
      <div className="glass-card overflow-hidden">
        <h3 className="font-bold text-white text-base mb-4">All Flock Records</h3>
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Batch Name & Breed</th>
                <th>Start Date</th>
                <th>Age</th>
                <th>Initial Qty</th>
                <th>Current Qty</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {flocks.map(f => (
                <tr key={f.id}>
                  <td className="font-bold text-emerald-400">{f.id}</td>
                  <td><b>{f.name}</b><br/><small className="text-gray-400">{f.breed} ({f.houseNo})</small></td>
                  <td>{formatDate(f.startDate)}</td>
                  <td><b>{f.ageDays} Days</b></td>
                  <td>{f.initialQty}</td>
                  <td className="font-bold text-emerald-400">{f.currentQty}</td>
                  <td><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">{f.status}</span></td>
                  <td>
                    <button onClick={() => handleDelete(f.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
