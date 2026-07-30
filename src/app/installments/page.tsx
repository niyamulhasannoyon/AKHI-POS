'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Installment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Clock, DollarSign } from 'lucide-react';

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<Installment[]>([]);

  useEffect(() => {
    const update = () => setInstallments(farmStore.getState().installments || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleReceivePart = (ins: Installment) => {
    const pay = Number(prompt(`Receive installment part from ${ins.customerName}:`, '5000')) || 0;
    if (pay > 0) {
      const newPaid = ins.paidAmount + pay;
      const newRemaining = Math.max(0, ins.totalAmount - newPaid);
      farmStore.updateItem('installments', ins.id, { paidAmount: newPaid, remaining: newRemaining });
      farmStore.addItem('accounting', {
        id: `ACC-${Date.now().toString().slice(-5)}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'Income',
        category: 'Installment Payment',
        amount: pay,
        note: `Installment received from ${ins.customerName}`
      });
      alert('Installment part payment received!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-400" />
          <span>Customer Installment Payment Tracker</span>
        </h2>
        <p className="text-xs text-gray-400">Manage multi-stage installment agreements for large bird or feed orders.</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Agreement Total</th>
                <th>Paid So Far</th>
                <th>Remaining Due</th>
                <th>Parts</th>
                <th>Next Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {installments.map(ins => (
                <tr key={ins.id}>
                  <td className="font-bold text-gray-400">{ins.id}</td>
                  <td className="font-bold text-white">{ins.customerName}</td>
                  <td>{formatCurrency(ins.totalAmount)}</td>
                  <td className="text-emerald-400 font-bold">{formatCurrency(ins.paidAmount)}</td>
                  <td className="text-red-400 font-bold">{formatCurrency(ins.remaining)}</td>
                  <td><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-gray-300">{ins.installmentCount} Parts</span></td>
                  <td>{formatDate(ins.nextDate)}</td>
                  <td>
                    <button
                      onClick={() => handleReceivePart(ins)}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> <span>Receive Part</span>
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
