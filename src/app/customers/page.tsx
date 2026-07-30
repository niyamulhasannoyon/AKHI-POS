'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Customer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Users, Plus, DollarSign } from 'lucide-react';

function generateId(prefix: string, sliceLength: number): string {
  return `${prefix}-${Date.now().toString().slice(-sliceLength)}`;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const update = () => setCustomers(farmStore.getState().customers || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleAddCustomer = () => {
    const name = prompt('Customer Name:');
    if (!name) return;
    const phone = prompt('Mobile Phone:', '01700-000000') || '';
    const address = prompt('Address:', 'Gazipur') || '';

    farmStore.addItem('customers', {
      id: generateId('CUST', 4),
      name,
      phone,
      address,
      due: 0,
      totalPurchases: 0
    });
  };

  const handleReceivePayment = (c: Customer) => {
    if (c.due <= 0) {
      alert('Customer has no outstanding due balance!');
      return;
    }

    const amount = Number(prompt(`Receive due payment from ${c.name} (Current Due: ${formatCurrency(c.due)}):`, c.due.toString())) || 0;
    if (amount > 0) {
      farmStore.updateItem('customers', c.id, { due: Math.max(0, c.due - amount) });
      farmStore.addItem('accounting', {
        id: generateId('ACC', 5),
        date: new Date().toISOString().slice(0, 10),
        type: 'Income',
        category: 'Customer Due Payment',
        amount,
        note: `Due received from ${c.name}`
      });
      alert(`Payment of ${formatCurrency(amount)} received!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Customer Directory & Dues Ledger</span>
          </h2>
          <p className="text-xs text-gray-400">Manage buyer accounts, credit limits, and receive outstanding due payments.</p>
        </div>
        <button
          onClick={handleAddCustomer}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Total Purchases</th>
                <th>Outstanding Due</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td className="font-bold text-gray-400">{c.id}</td>
                  <td className="font-bold text-white">{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.address || '-'}</td>
                  <td>{formatCurrency(c.totalPurchases || 0)}</td>
                  <td className={`font-bold ${c.due > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(c.due)}</td>
                  <td>
                    <button
                      onClick={() => handleReceivePayment(c)}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> <span>Receive Due</span>
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
