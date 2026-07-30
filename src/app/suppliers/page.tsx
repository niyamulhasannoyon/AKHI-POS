'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Supplier } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Building2, Plus, DollarSign } from 'lucide-react';

function generateId(prefix: string, sliceLength: number): string {
  return `${prefix}-${Date.now().toString().slice(-sliceLength)}`;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const update = () => setSuppliers(farmStore.getState().suppliers || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleAddSupplier = () => {
    const name = prompt('Supplier Company Name:');
    if (!name) return;
    const phone = prompt('Phone:', '01800-000000') || '';
    const address = prompt('Address:', 'Dhaka') || '';

    farmStore.addItem('suppliers', {
      id: generateId('SUP', 4),
      name,
      phone,
      address,
      balance: 0
    });
  };

  const handlePaySupplier = (s: Supplier) => {
    if (s.balance <= 0) {
      alert('No payable balance for this supplier!');
      return;
    }

    const amount = Number(prompt(`Pay to supplier ${s.name} (Payable: ${formatCurrency(s.balance)}):`, s.balance.toString())) || 0;
    if (amount > 0) {
      farmStore.updateItem('suppliers', s.id, { balance: Math.max(0, s.balance - amount) });
      farmStore.addItem('accounting', {
        id: generateId('ACC', 5),
        date: new Date().toISOString().slice(0, 10),
        type: 'Expense',
        category: 'Supplier Payment',
        amount,
        note: `Payment to supplier ${s.name}`
      });
      alert(`Payment of ${formatCurrency(amount)} logged!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span>Supplier Directory & Payables</span>
          </h2>
          <p className="text-xs text-gray-400">Manage feed mill, hatchery, and medicine supplier accounts and balances.</p>
        </div>
        <button
          onClick={handleAddSupplier}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier Company</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Payable Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td className="font-bold text-gray-400">{s.id}</td>
                  <td className="font-bold text-white">{s.name}</td>
                  <td>{s.phone}</td>
                  <td>{s.address || '-'}</td>
                  <td className={`font-bold ${s.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(s.balance)}</td>
                  <td>
                    <button
                      onClick={() => handlePaySupplier(s)}
                      className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> <span>Pay Supplier</span>
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
