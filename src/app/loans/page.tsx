'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Loan } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Landmark, Plus, DollarSign } from 'lucide-react';

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    const update = () => setLoans(farmStore.getState().loans || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleAddLoan = () => {
    const lender = prompt('Lender / Bank Name:');
    if (!lender) return;
    const amount = Number(prompt('Loan Principal Amount (৳):', '500000')) || 0;
    const interestRate = Number(prompt('Interest Rate (%):', '8')) || 0;
    const emi = Number(prompt('Monthly EMI (৳):', '22500')) || 0;

    farmStore.addItem('loans', {
      id: `LN-${Date.now().toString().slice(-4)}`,
      lender,
      amount,
      interestRate,
      emi,
      remaining: amount,
      nextDueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10)
    });
  };

  const handlePayEMI = (loan: Loan) => {
    const pay = Number(prompt(`Pay EMI for ${loan.lender}:`, loan.emi.toString())) || 0;
    if (pay > 0) {
      farmStore.updateItem('loans', loan.id, { remaining: Math.max(0, loan.remaining - pay) });
      farmStore.addItem('accounting', {
        id: `ACC-${Date.now().toString().slice(-5)}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'Expense',
        category: 'Loan EMI Payment',
        amount: pay,
        note: `EMI paid for ${loan.lender}`
      });
      alert('EMI payment logged!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-400" />
            <span>Farm Loans & Credit Manager</span>
          </h2>
          <p className="text-xs text-gray-400">Track bank loans, interest rates, monthly EMI schedules, and repayments.</p>
        </div>
        <button
          onClick={handleAddLoan}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Loan</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Lender / Bank</th>
                <th>Principal</th>
                <th>Interest Rate</th>
                <th>Monthly EMI</th>
                <th>Remaining Balance</th>
                <th>Next Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(l => (
                <tr key={l.id}>
                  <td className="font-bold text-gray-400">{l.id}</td>
                  <td className="font-bold text-white">{l.lender}</td>
                  <td>{formatCurrency(l.amount)}</td>
                  <td><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">{l.interestRate}% P.A.</span></td>
                  <td className="font-bold text-white">{formatCurrency(l.emi)}</td>
                  <td className="font-bold text-red-400">{formatCurrency(l.remaining)}</td>
                  <td>{formatDate(l.nextDueDate)}</td>
                  <td>
                    <button
                      onClick={() => handlePayEMI(l)}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> <span>Pay EMI</span>
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
