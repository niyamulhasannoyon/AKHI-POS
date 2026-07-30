'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

export default function AnalyticsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [accounting, setAccounting] = useState<any[]>([]);
  const [khamariLogs, setKhamariLogs] = useState<any[]>([]);

  useEffect(() => {
    const update = () => {
      const state = farmStore.getState();
      setSales(state.sales || []);
      setAccounting(state.accounting || []);
      setKhamariLogs(state.khamariLogs || []);
    };
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalIncome = accounting.filter(a => a.type === 'Income').reduce((sum, a) => sum + a.amount, 0);
  const totalExpenses = accounting.filter(a => a.type === 'Expense').reduce((sum, a) => sum + a.amount, 0);
  const netProfit = (totalSalesRevenue + totalIncome) - totalExpenses;

  // Chart Sample Data
  const financialData = [
    { name: 'Mon', Revenue: 18000, Expense: 12000 },
    { name: 'Tue', Revenue: 24000, Expense: 8000 },
    { name: 'Wed', Revenue: 15000, Expense: 14000 },
    { name: 'Thu', Revenue: 32000, Expense: 9500 },
    { name: 'Fri', Revenue: 28000, Expense: 11000 },
    { name: 'Sat', Revenue: 41000, Expense: 16000 },
    { name: 'Sun', Revenue: 35000, Expense: 7000 },
  ];

  const eggProductionData = khamariLogs.map(log => ({
    date: log.date,
    GoodEggs: log.eggGood,
    Damaged: log.eggDamaged
  })).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          <span>Farm Business Intelligence & Analytics</span>
        </h2>
        <p className="text-xs text-gray-400">Comprehensive financial summaries, egg production yield metrics, and mortality ratios.</p>
      </div>

      {/* P&L Financial Statement Card */}
      <div className="glass-card">
        <h3 className="font-bold text-white text-base mb-4 border-b border-white/10 pb-2">Financial Profit & Loss Statement</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <div className="text-xs text-gray-400 uppercase font-semibold">Total Revenue Inflows</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">{formatCurrency(totalSalesRevenue + totalIncome)}</div>
          </div>

          <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
            <div className="text-xs text-gray-400 uppercase font-semibold">Total Operating Expenses</div>
            <div className="text-xl font-extrabold text-red-400 mt-1">{formatCurrency(totalExpenses)}</div>
          </div>

          <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <div className="text-xs text-gray-400 uppercase font-semibold">Estimated Net Profit</div>
            <div className={`text-xl font-extrabold mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(netProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expense Area Chart */}
        <div className="glass-card">
          <h3 className="font-bold text-white text-base mb-4">Revenue vs Expense Trend (Weekly)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff20', color: '#fff' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" fill="#10b98130" />
                <Area type="monotone" dataKey="Expense" stroke="#ef4444" fill="#ef444430" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Egg Yield Bar Chart */}
        <div className="glass-card">
          <h3 className="font-bold text-white text-base mb-4">Daily Egg Yield Collection</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eggProductionData.length > 0 ? eggProductionData : [{ date: 'Today', GoodEggs: 1645, Damaged: 5 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff20', color: '#fff' }} />
                <Bar dataKey="GoodEggs" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
