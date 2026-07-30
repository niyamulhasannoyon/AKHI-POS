'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { AccountingEntry } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, Plus, Trash2 } from 'lucide-react';

export default function AccountingPage() {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);

  useEffect(() => {
    const update = () => setEntries(farmStore.getState().accounting || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleAddEntry = () => {
    const type = (prompt('Entry Type (Income / Expense):', 'Expense') || 'Expense') as 'Income' | 'Expense';
    const category = prompt('Category (e.g. Electricity, Wages, Transport):', 'Electricity') || 'General';
    const amount = Number(prompt('Amount (৳):', '5000')) || 0;
    const note = prompt('Notes:', 'July electric bill') || '';

    farmStore.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().slice(0, 10),
      type,
      category,
      amount,
      note
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this cash journal transaction?')) {
      farmStore.deleteItem('accounting', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" />
            <span>Farm Accounting & Cash Journal</span>
          </h2>
          <p className="text-xs text-gray-400">Track daily cashflow, operational expenditures, and revenue receipts.</p>
        </div>
        <button
          onClick={handleAddEntry}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record Income / Expense</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td className="font-bold text-white">{formatDate(e.date)}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.type === 'Income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="font-bold text-white">{e.category}</td>
                  <td className={`font-bold ${e.type === 'Income' ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(e.amount)}</td>
                  <td className="text-xs text-gray-400">{e.note || '-'}</td>
                  <td>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg">
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
