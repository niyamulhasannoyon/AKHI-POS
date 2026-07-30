'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { farmStore } from '@/lib/store';
import { FarmState } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, Bird, Egg, ShoppingBag, PlusCircle, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const [state, setState] = useState<FarmState>(farmStore.getState());

  useEffect(() => {
    const unsub = farmStore.subscribe((s) => setState({ ...s }));
    return () => unsub();
  }, []);

  const sales = state.sales || [];
  const acc = state.accounting || [];
  const flocks = state.flocks || [];
  const khamari = state.khamariLogs || [];

  const totalRevenue = sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalIncome = acc.filter(a => a.type === 'Income').reduce((sum, a) => sum + a.amount, 0);
  const totalExpense = acc.filter(a => a.type === 'Expense').reduce((sum, a) => sum + a.amount, 0);
  const netProfit = (totalRevenue + totalIncome) - totalExpense;

  const activeBirds = flocks.filter(f => f.status === 'Active').reduce((sum, f) => sum + f.currentQty, 0);
  const todayEggs = (khamari[0] as any)?.eggGood || 0;

  return (
    <div className="space-y-6">
      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">Total Sales Revenue</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">Estimated Net Profit</div>
            <div className={`text-xl font-extrabold mt-0.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(netProfit)}
            </div>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
            <Bird className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">Active Farm Birds</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{activeBirds.toLocaleString()} Birds</div>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
            <Egg className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">Daily Egg Yield</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{todayEggs.toLocaleString()} Eggs</div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad */}
      <div className="glass-card">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>🚀</span> Quick Action Launchpad
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/pos" className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS Register (F2)</span>
          </Link>
          <Link href="/khamari" className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-950/50 flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            <span>Log Daily Khamari Entry</span>
          </Link>
          <Link href="/feed-gura" className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium text-sm rounded-xl border border-white/10 flex items-center gap-2">
            <span>🌾 Formulate Feed</span>
          </Link>
          <Link href="/customers" className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium text-sm rounded-xl border border-white/10 flex items-center gap-2">
            <span>💳 Receive Customer Due</span>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Recent Sales & Shed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Table */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base">Recent Sales Transactions</h3>
            <Link href="/pos" className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
              <span>View All</span> <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 5).map(s => (
                  <tr key={s.id}>
                    <td className="font-bold text-emerald-400">{s.id}</td>
                    <td>{s.customerName}</td>
                    <td className="font-bold text-white">{formatCurrency(s.grandTotal)}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                        {s.paymentMethod}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Shed Status */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base">Active Shed Batches</h3>
            <Link href="/khamar" className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
              <span>Manage Sheds</span> <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {flocks.filter(f => f.status === 'Active').map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <div>
                  <div className="font-bold text-white text-sm">{f.name}</div>
                  <div className="text-xs text-gray-400">{f.breed} ({f.houseNo}) • Age {f.ageDays} Days</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-emerald-400 text-base">{f.currentQty}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Birds Count</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
