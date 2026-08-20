'use client';

import React, { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Flock, BatchSale, BatchExpense, BatchLabor, BatchWeightLog, KhamariLog } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Bird,
  X,
  Plus,
  DollarSign,
  UserCheck,
  Scale,
  ShoppingBag,
  AlertCircle,
  FileText,
  Activity
} from 'lucide-react';

interface BatchProfileModalProps {
  flock: Flock;
  onClose: () => void;
}

export default function BatchProfileModal({ flock, onClose }: BatchProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LABOR' | 'WEIGHT_LOGS' | 'EXPENSES' | 'SALES'>('OVERVIEW');

  // Local reactive states from farmStore
  const [batchSales, setBatchSales] = useState<BatchSale[]>([]);
  const [batchExpenses, setBatchExpenses] = useState<BatchExpense[]>([]);
  const [batchLabor, setBatchLabor] = useState<BatchLabor[]>([]);
  const [batchWeightLogs, setBatchWeightLogs] = useState<BatchWeightLog[]>([]);
  const [khamariLogs, setKhamariLogs] = useState<KhamariLog[]>([]);

  // Sub-modal or form visibility states
  const [showAddLabor, setShowAddLabor] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);

  // Form States: Labor
  const [staffName, setStaffName] = useState('');
  const [workDesc, setWorkDesc] = useState('');
  const [laborDate, setLaborDate] = useState(new Date().toISOString().slice(0, 10));
  const [laborPaid, setLaborPaid] = useState<number | ''>('');
  const [laborDue, setLaborDue] = useState<number | ''>('');
  const [laborNotes, setLaborNotes] = useState('');

  // Form States: Weight Log
  const [weightDate, setWeightDate] = useState(new Date().toISOString().slice(0, 10));
  const [weightAgeDays, setWeightAgeDays] = useState<number | ''>(flock.ageDays || 1);
  const [sampleCount, setSampleCount] = useState<number | ''>('');
  const [sampleWeightKg, setSampleWeightKg] = useState<number | ''>('');
  const [weightMortality, setWeightMortality] = useState<number | ''>('');
  const [weightNotes, setWeightNotes] = useState('');

  // Form States: Expense
  const [expCategory, setExpCategory] = useState('খাদ্য বাবদ খরচ');
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expBagQty, setExpBagQty] = useState<number | ''>('');
  const [expPricePerBag, setExpPricePerBag] = useState<number | ''>('');
  const [expFeedType, setExpFeedType] = useState('');
  const [expNote, setExpNote] = useState('');

  // Form States: Sale
  const [saleBuyer, setSaleBuyer] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [saleBirdQty, setSaleBirdQty] = useState<number | ''>('');
  const [saleTotalWeight, setSaleTotalWeight] = useState<number | ''>('');
  const [salePricePerKg, setSalePricePerKg] = useState<number | ''>('');
  const [salePaid, setSalePaid] = useState<number | ''>('');
  const [saleNotes, setSaleNotes] = useState('');

  useEffect(() => {
    const update = () => {
      const state = farmStore.getState();
      setBatchSales((state.batchSales || []).filter(s => s.flockId === flock.id));
      setBatchExpenses((state.batchExpenses || []).filter(e => e.flockId === flock.id));
      setBatchLabor((state.batchLabor || []).filter(l => l.flockId === flock.id));
      setBatchWeightLogs((state.batchWeightLogs || []).filter(w => w.flockId === flock.id));
      setKhamariLogs((state.khamariLogs || []).filter(k => k.flockId === flock.id));
    };
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, [flock.id]);

  // Derived Calculations
  const totalSalesRevenue = batchSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalSalesPaid = batchSales.reduce((acc, s) => acc + (s.paidAmount !== undefined ? s.paidAmount : s.totalAmount), 0);
  const totalSalesDue = batchSales.reduce((acc, s) => acc + (s.dueAmount !== undefined ? s.dueAmount : (s.totalAmount - (s.paidAmount || s.totalAmount))), 0);

  const totalDirectExpenses = batchExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalLaborExpenses = batchLabor.reduce((acc, l) => acc + l.paidAmount + l.dueAmount, 0);
  const totalLaborPaid = batchLabor.reduce((acc, l) => acc + l.paidAmount, 0);
  const totalLaborDue = batchLabor.reduce((acc, l) => acc + l.dueAmount, 0);

  const chickCost = (flock.unitPrice || 0) * flock.initialQty;
  const totalOverallExpenses = totalDirectExpenses + totalLaborExpenses;
  const netProfitLoss = totalSalesRevenue - totalOverallExpenses;

  const totalMortalityLogs = khamariLogs.reduce((acc, l) => acc + (l.mortality || 0), 0);
  const totalWeightLogMortality = batchWeightLogs.reduce((acc, w) => acc + (w.mortalityCount || 0), 0);
  const totalMortality = Math.max(totalMortalityLogs, totalWeightLogMortality, flock.initialQty - flock.currentQty);
  const mortalityPercentage = flock.initialQty > 0 ? ((totalMortality / flock.initialQty) * 100).toFixed(1) : '0';

  const totalFeedBagsUsed = batchExpenses
    .filter(e => e.category === 'খাদ্য বাবদ খরচ')
    .reduce((acc, e) => acc + (e.bagQty || 0), 0);

  // Ultimate Average Weight calculation:
  // Derived from the latest weight log sample avg OR total weight sold / total birds sold if available
  const latestWeightLog = batchWeightLogs.length > 0
    ? [...batchWeightLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const totalBirdsSold = batchSales.reduce((acc, s) => acc + s.birdQty, 0);
  const totalWeightSoldKg = batchSales.reduce((acc, s) => acc + s.totalWeight, 0);
  const avgSoldWeightKg = totalBirdsSold > 0 ? (totalWeightSoldKg / totalBirdsSold) : 0;

  const ultimateAverageWeightKg = latestWeightLog && latestWeightLog.avgWeightKg > 0
    ? latestWeightLog.avgWeightKg
    : (avgSoldWeightKg > 0 ? avgSoldWeightKg : 0);

  // Handlers: Add Labor
  const handleAddLaborSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return alert('অনুগ্রহ করে কর্মচারীর নাম দিন');
    const paid = laborPaid !== '' ? Number(laborPaid) : 0;
    const due = laborDue !== '' ? Number(laborDue) : 0;
    if (paid <= 0 && due <= 0) return alert('অনুগ্রহ করে প্রদত্ত মজুরি অথবা বকেয়া টাকার পরিমাণ উল্লেখ করুন');

    const newLabor: BatchLabor = {
      id: `LBR-${Date.now().toString().slice(-4)}`,
      flockId: flock.id,
      date: laborDate,
      staffName: staffName.trim(),
      workDescription: workDesc.trim() || 'দৈনিক খামার মজুরি',
      paidAmount: paid,
      dueAmount: due,
      notes: laborNotes.trim() || undefined
    };

    farmStore.addItem('batchLabor', newLabor);

    // Also record in main accounting if paid > 0
    if (paid > 0) {
      farmStore.addItem('accounting', {
        id: `ACC-${Date.now().toString().slice(-4)}`,
        date: laborDate,
        type: 'Expense',
        category: 'Staff & Labor Salary',
        amount: paid,
        note: `Batch: ${flock.name} - ${staffName.trim()} (${workDesc.trim() || 'মজুরি'})`
      });
    }

    setStaffName('');
    setWorkDesc('');
    setLaborPaid('');
    setLaborDue('');
    setLaborNotes('');
    setShowAddLabor(false);
    alert('কর্মচারীর মজুরি সফলভাবে যুক্ত করা হয়েছে!');
  };

  // Handlers: Add Weight Log
  const handleAddWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleCount || Number(sampleCount) <= 0) return alert('অনুগ্রহ করে স্যাম্পল মুরগির সংখ্যা দিন');
    if (!sampleWeightKg || Number(sampleWeightKg) <= 0) return alert('অনুগ্রহ করে স্যাম্পল মোট ওজন (কেজি) দিন');

    const count = Number(sampleCount);
    const totalW = Number(sampleWeightKg);
    const avgW = totalW / count;
    const dead = weightMortality !== '' ? Number(weightMortality) : 0;

    const newWeightLog: BatchWeightLog = {
      id: `WLOG-${Date.now().toString().slice(-4)}`,
      flockId: flock.id,
      date: weightDate,
      ageDays: weightAgeDays !== '' ? Number(weightAgeDays) : flock.ageDays,
      sampleBirdCount: count,
      sampleTotalWeightKg: totalW,
      avgWeightKg: Number(avgW.toFixed(3)),
      mortalityCount: dead,
      notes: weightNotes.trim() || undefined
    };

    farmStore.addItem('batchWeightLogs', newWeightLog);

    // If mortality reported in weight log, update flock live count & khamariLogs
    if (dead > 0) {
      const newQty = Math.max(0, flock.currentQty - dead);
      farmStore.updateItem('flocks', flock.id, { currentQty: newQty });
      farmStore.addItem('khamariLogs', {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        flockId: flock.id,
        date: weightDate,
        eggGood: 0,
        eggDamaged: 0,
        feedBags: 0,
        mortality: dead,
        temperature: 28,
        notes: `নমুনা ওজন লগে মরা বাচ্চা রেকর্ড (${dead} পিস)`
      });
    }

    setSampleCount('');
    setSampleWeightKg('');
    setWeightMortality('');
    setWeightNotes('');
    setShowAddWeight(false);
    alert(`স্যাম্পল ওজন এন্ট্রি সফল! গড় ওজন: ${avgW.toFixed(2)} কেজি/পিস`);
  };

  // Handlers: Add Expense
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCategory) return alert('অনুগ্রহ করে খরচের ক্যাটাগরি বাছাই করুন');

    let amount = 0;
    let noteStr = expNote || `Batch: ${flock.name}`;

    if (expCategory === 'খাদ্য বাবদ খরচ' || expCategory === 'গুঁড়া বাবদ খরচ') {
      const qty = expBagQty !== '' ? Number(expBagQty) : 0;
      const rate = expPricePerBag !== '' ? Number(expPricePerBag) : 0;
      if (qty <= 0) return alert('অনুগ্রহ করে বস্তার সংখ্যা দিন');
      if (rate <= 0) return alert('অনুগ্রহ করে বস্তা প্রতি দাম দিন');
      amount = qty * rate;
      const typeStr = expFeedType ? ` (${expFeedType})` : '';
      noteStr = `${expCategory}${typeStr}: ${qty} বস্তা @ ৳${rate} - ${expNote}`;
    } else {
      if (!expAmount || Number(expAmount) <= 0) return alert('অনুগ্রহ করে খরচের মোট পরিমাণ দিন');
      amount = Number(expAmount);
    }

    const newExp: BatchExpense = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      flockId: flock.id,
      date: expDate,
      category: expCategory,
      amount,
      bagQty: expBagQty !== '' ? Number(expBagQty) : undefined,
      pricePerBag: expPricePerBag !== '' ? Number(expPricePerBag) : undefined,
      feedType: expFeedType || undefined,
      note: noteStr
    };

    farmStore.addItem('batchExpenses', newExp);
    farmStore.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-4)}`,
      date: expDate,
      type: 'Expense',
      category: expCategory,
      amount,
      note: noteStr
    });

    setExpAmount('');
    setExpBagQty('');
    setExpPricePerBag('');
    setExpFeedType('');
    setExpNote('');
    setShowAddExpense(false);
    alert('খরচের হিসাব সফলভাবে সংরক্ষিত হয়েছে!');
  };

  // Handlers: Add Sale
  const handleAddSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleBuyer.trim()) return alert('অনুগ্রহ করে ক্রেতার নাম দিন');
    if (!saleBirdQty || Number(saleBirdQty) <= 0) return alert('অনুগ্রহ করে বিক্রয়কৃত মুরগির সংখ্যা দিন');
    if (!saleTotalWeight || Number(saleTotalWeight) <= 0) return alert('অনুগ্রহ করে মোট বিক্রি ওজন (কেজি) দিন');
    if (!salePricePerKg || Number(salePricePerKg) <= 0) return alert('অনুগ্রহ করে কেজি প্রতি দাম দিন');

    const pcs = Number(saleBirdQty);
    const weight = Number(saleTotalWeight);
    const rate = Number(salePricePerKg);
    const totalAmount = weight * rate;
    const paid = salePaid !== '' ? Number(salePaid) : totalAmount;
    const due = Math.max(0, totalAmount - paid);

    const newSale: BatchSale = {
      id: `BS-${Date.now().toString().slice(-4)}`,
      flockId: flock.id,
      date: saleDate,
      buyerName: saleBuyer.trim(),
      birdQty: pcs,
      totalWeight: weight,
      pricePerKg: rate,
      totalAmount,
      paidAmount: paid,
      dueAmount: due
    };

    farmStore.addItem('batchSales', newSale);

    // Auto deduct live bird quantity
    const newQty = Math.max(0, flock.currentQty - pcs);
    farmStore.updateItem('flocks', flock.id, { currentQty: newQty });

    // Auto record in main Accounting
    farmStore.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-4)}`,
      date: saleDate,
      type: 'Income',
      category: 'Live Bird Sales',
      amount: totalAmount,
      note: `Batch: ${flock.name} - ${pcs} pcs (${weight}kg @ ৳${rate}/kg) - Buyer: ${saleBuyer.trim()}`
    });

    setSaleBuyer('');
    setSaleBirdQty('');
    setSaleTotalWeight('');
    setSalePricePerKg('');
    setSalePaid('');
    setSaleNotes('');
    setShowAddSale(false);
    alert(`৳${totalAmount.toLocaleString()} টাকার বিক্রয় হিসাব সফলভাবে সংরক্ষিত হয়েছে!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div className="bg-[#121620] border border-emerald-500/40 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden text-gray-100">
        
        {/* ========================================================================= */}
        {/* HEADER BAR */}
        {/* ========================================================================= */}
        <div className="bg-[#181e2e] border-b border-gray-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/40 text-emerald-400">
              <Bird className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">{flock.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  {flock.breed}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  flock.status === 'Active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {flock.status === 'Active' ? '● রানিং ব্যাচ (Active)' : 'প্রসেসিং / ক্লোজড'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                <span>কোম্পানী: <strong className="text-gray-200">{flock.companyName || 'N/A'}</strong></span>
                <span>•</span>
                <span>শেড: <strong className="text-gray-200">{flock.houseNo}</strong></span>
                <span>•</span>
                <span>বয়স: <strong className="text-emerald-400 font-mono">{flock.ageDays} দিন</strong></span>
                <span>•</span>
                <span>শুরু: <strong className="text-gray-200">{formatDate(flock.startDate)}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="self-end md:self-auto p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STATS OVERVIEW CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-[#141926] border-b border-gray-800">
          {/* Card 1: Flock Count & Mortality */}
          <div className="bg-[#1c2336] p-3 rounded-xl border border-gray-800">
            <span className="text-[11px] text-gray-400 font-medium">জীবন্ত মুরগি সংখ্যা</span>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {flock.currentQty.toLocaleString()} <span className="text-xs text-gray-400 font-normal">/ {flock.initialQty}</span>
            </div>
            <div className="text-[10px] text-rose-400 mt-1 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>মৃত্যু: {totalMortality} টি ({mortalityPercentage}%)</span>
            </div>
          </div>

          {/* Card 2: Ultimate Batch Average Weight */}
          <div className="bg-[#1c2336] p-3 rounded-xl border border-emerald-500/30">
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" /> সর্বমোট গড় ওজন (Avg Wt)
            </span>
            <div className="text-xl font-black text-emerald-300 mt-0.5">
              {ultimateAverageWeightKg > 0 ? `${ultimateAverageWeightKg.toFixed(2)} KG` : 'N/A'}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {latestWeightLog ? `সর্বশেষ ট্র্যাকিং: ${formatDate(latestWeightLog.date)}` : 'নমুনা ওজন ইনপুট দিন'}
            </div>
          </div>

          {/* Card 3: Total Sales Revenue */}
          <div className="bg-[#1c2336] p-3 rounded-xl border border-teal-500/30">
            <span className="text-[11px] text-teal-400 font-medium">সর্বমোট মুরগি বিক্রি (আয়)</span>
            <div className="text-xl font-extrabold text-teal-300 mt-0.5">
              {formatCurrency(totalSalesRevenue)}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              বকেয়া পাওনা: <span className="text-amber-400 font-bold">{formatCurrency(totalSalesDue)}</span>
            </div>
          </div>

          {/* Card 4: Total Batch Expenses + Labor */}
          <div className="bg-[#1c2336] p-3 rounded-xl border border-rose-500/30">
            <span className="text-[11px] text-rose-400 font-medium">সর্বমোট খরচ (ব্যয় + শ্রমিক)</span>
            <div className="text-xl font-extrabold text-rose-300 mt-0.5">
              {formatCurrency(totalOverallExpenses)}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              শ্রমিক খরচ: {formatCurrency(totalLaborExpenses)} ({totalLaborBagsLabel(totalFeedBagsUsed)})
            </div>
          </div>

          {/* Card 5: Net Profit / Loss */}
          <div className={`p-3 rounded-xl border ${
            netProfitLoss >= 0 ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-rose-950/40 border-rose-500/50'
          }`}>
            <span className="text-[11px] text-gray-300 font-medium">নিট লাভ / ক্ষতি (Net Profit)</span>
            <div className={`text-xl font-black mt-0.5 ${netProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netProfitLoss)}
            </div>
            <div className="text-[10px] text-gray-400 mt-1 font-semibold">
              {netProfitLoss >= 0 ? '▲ লাভ জনক অবস্থায় আছে' : '▼ লোকসান রিজিওনে আছে'}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABS NAVIGATION */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1 sm:gap-2 p-2 bg-[#121620] border-b border-gray-800 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-emerald-500 text-slate-950 shadow-lg'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>সারসংক্ষেপ ড্যাশবোর্ড</span>
          </button>

          <button
            onClick={() => setActiveTab('LABOR')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'LABOR'
                ? 'bg-emerald-500 text-slate-950 shadow-lg'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>কর্মচারী ও শ্রমিকের হিসাব ({batchLabor.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('WEIGHT_LOGS')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'WEIGHT_LOGS'
                ? 'bg-emerald-500 text-slate-950 shadow-lg'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>ওজন ও বৃদ্ধির ট্র্যাকার ({batchWeightLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'EXPENSES'
                ? 'bg-emerald-500 text-slate-950 shadow-lg'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>সম্পূর্ণ খরচের খাতা ({batchExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SALES')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'SALES'
                ? 'bg-emerald-500 text-slate-950 shadow-lg'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>মুরগি বিক্রি ও হিসাব ({batchSales.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENTS BODY */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 1: OVERVIEW */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Quick Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => { setActiveTab('LABOR'); setShowAddLabor(true); }}
                  className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>+ শ্রমিক/কর্মচারী মজুরি ইনপুট</span>
                </button>

                <button
                  onClick={() => { setActiveTab('WEIGHT_LOGS'); setShowAddWeight(true); }}
                  className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>+ নমুনা ওজন ও দৈনন্দিন এন্ট্রি</span>
                </button>

                <button
                  onClick={() => { setActiveTab('EXPENSES'); setShowAddExpense(true); }}
                  className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-rose-400" />
                  <span>+ নতুন খরচের এন্ট্রি দিন</span>
                </button>

                <button
                  onClick={() => { setActiveTab('SALES'); setShowAddSale(true); }}
                  className="px-4 py-2.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-teal-400" />
                  <span>+ মুরগি বিক্রির তথ্য যোগ করুন</span>
                </button>
              </div>

              {/* Financial Breakdown Table */}
              <div className="bg-[#181e2e] border border-gray-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>ব্যাচের পূর্ণাঙ্গ আয়-ব্যয় বিবরণী (Financial Statement)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cost Breakdown */}
                  <div className="space-y-3 bg-[#131722] p-4 rounded-xl border border-gray-800">
                    <div className="text-xs font-bold text-rose-400 border-b border-gray-800 pb-2 uppercase tracking-wider">
                      খরচ ও ব্যয়ের খাত সমূহ (Expenses)
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <span className="text-gray-400">১. বাচ্চা কেনার খরচ (Chicks Cost):</span>
                        <span className="font-mono font-bold text-white">{formatCurrency(chickCost)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <span className="text-gray-400">২. খাবার/ফিডের খরচ ({totalFeedBagsUsed} বস্তা):</span>
                        <span className="font-mono font-bold text-white">
                          {formatCurrency(batchExpenses.filter(e => e.category === 'খাদ্য বাবদ খরচ').reduce((acc, e) => acc + e.amount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <span className="text-gray-400">৩. মেডিসিন ও ভ্যাকসিন:</span>
                        <span className="font-mono font-bold text-white">
                          {formatCurrency(batchExpenses.filter(e => e.category === 'মেডিসিন বাবদ খরচ').reduce((acc, e) => acc + e.amount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <span className="text-gray-400">৪. তুষ / গুঁড়ার খরচ:</span>
                        <span className="font-mono font-bold text-white">
                          {formatCurrency(batchExpenses.filter(e => e.category === 'গুঁড়া বাবদ খরচ').reduce((acc, e) => acc + e.amount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <span className="text-gray-400">৫. বিদ্যুৎ, ফুয়েল ও অন্যান্য:</span>
                        <span className="font-mono font-bold text-white">
                          {formatCurrency(batchExpenses.filter(e => !['খাদ্য বাবদ খরচ', 'মেডিসিন বাবদ খরচ', 'গুঁড়া বাবদ খরচ'].includes(e.category)).reduce((acc, e) => acc + e.amount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <span className="text-indigo-400">৬. শ্রমিক ও কর্মচারীদের মোট মজুরি:</span>
                        <span className="font-mono font-bold text-indigo-300">{formatCurrency(totalLaborExpenses)}</span>
                      </div>

                      <div className="flex justify-between pt-2 text-sm font-extrabold text-rose-400">
                        <span>সর্বমোট ব্যয় (Total Cost):</span>
                        <span>{formatCurrency(totalOverallExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue & Profit Breakdown */}
                  <div className="space-y-3 bg-[#131722] p-4 rounded-xl border border-gray-800">
                    <div className="text-xs font-bold text-teal-400 border-b border-gray-800 pb-2 uppercase tracking-wider">
                      বিক্রি ও আয় খাত (Revenue & Income)
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <span className="text-gray-400">মুরগি বিক্রির পরিমাণ (পিস):</span>
                        <span className="font-mono font-bold text-white">{totalBirdsSold} পিস</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <span className="text-gray-400">মোট বিক্রয়কৃত ওজন (কেজি):</span>
                        <span className="font-mono font-bold text-white">{totalWeightSoldKg.toFixed(2)} KG</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <span className="text-gray-400">প্রাপ্ত টাকা (Cash Received):</span>
                        <span className="font-mono font-bold text-emerald-400">{formatCurrency(totalSalesPaid)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <span className="text-gray-400">কাস্টমার বকেয়া (Due Amount):</span>
                        <span className="font-mono font-bold text-amber-400">{formatCurrency(totalSalesDue)}</span>
                      </div>

                      <div className="flex justify-between pt-2 text-sm font-extrabold text-teal-300">
                        <span>সর্বমোট আয় (Total Sales):</span>
                        <span>{formatCurrency(totalSalesRevenue)}</span>
                      </div>

                      {/* Final Net Profit/Loss Box */}
                      <div className={`p-4 rounded-xl mt-4 border flex items-center justify-between ${
                        netProfitLoss >= 0
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                      }`}>
                        <div>
                          <div className="text-xs font-bold">ব্যাচের নিট লাভ/ক্ষতি (Net Calculation):</div>
                          <div className="text-xs text-gray-400">সর্বমোট আয় বাদ দিয়ে সর্বমোট সকল খরচ</div>
                        </div>
                        <div className="text-2xl font-black font-mono">
                          {formatCurrency(netProfitLoss)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 2: STAFF & LABOR LEDGER */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'LABOR' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#181e2e] p-4 rounded-xl border border-gray-800">
                <div>
                  <h3 className="text-base font-extrabold text-indigo-400 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    <span>কর্মচারী ও শ্রমিকের হিসাব (Staff & Labor Ledger)</span>
                  </h3>
                  <p className="text-xs text-gray-400">এই ব্যাচে কোন শ্রমিক কতদিন কাজ করেছেন, কত দেওয়া হয়েছে এবং বকেয়া তথ্য।</p>
                </div>
                <button
                  onClick={() => setShowAddLabor(!showAddLabor)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ নতুন শ্রমিক এন্ট্রি</span>
                </button>
              </div>

              {/* Add Labor Form */}
              {showAddLabor && (
                <form onSubmit={handleAddLaborSubmit} className="bg-[#181e2e] border border-indigo-500/40 p-4 rounded-2xl space-y-4 animate-fadeIn">
                  <h4 className="text-sm font-bold text-indigo-300 border-b border-gray-800 pb-2">নতুন শ্রমিক মজুরি ইনপুট</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">কর্মচারী/শ্রমিকের নাম *</label>
                      <input
                        type="text"
                        placeholder="যেমন: মো: রফিক"
                        value={staffName}
                        onChange={e => setStaffName(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">কাজের ধরন/সময়সূচী</label>
                      <input
                        type="text"
                        placeholder="যেমন: ৩ দিন শেড সাফাই / নাইটি ডিউটি"
                        value={workDesc}
                        onChange={e => setWorkDesc(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">তারিখ</label>
                      <input
                        type="date"
                        value={laborDate}
                        onChange={e => setLaborDate(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-emerald-400 mb-1">দেওয়া টাকা (Paid Amount) ৳</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={laborPaid}
                        onChange={e => setLaborPaid(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#131722] border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-amber-400 mb-1">বকেয়া পাওনা (Due Amount) ৳</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={laborDue}
                        onChange={e => setLaborDue(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#131722] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">নোট / মন্তব্য</label>
                      <input
                        type="text"
                        placeholder="অতিরিক্ত বিস্তারিত"
                        value={laborNotes}
                        onChange={e => setLaborNotes(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddLabor(false)}
                      className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl text-xs"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg"
                    >
                      সংরক্ষণ করুন
                    </button>
                  </div>
                </form>
              )}

              {/* Labor Summary Bar */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-[#181e2e] p-3 rounded-xl border border-gray-800">
                  <span className="text-gray-400">মোট শ্রমিক মজুরি</span>
                  <div className="text-base font-extrabold text-white mt-0.5">{formatCurrency(totalLaborExpenses)}</div>
                </div>
                <div className="bg-[#181e2e] p-3 rounded-xl border border-emerald-500/30">
                  <span className="text-emerald-400">মোট দেওয়া টাকা</span>
                  <div className="text-base font-extrabold text-emerald-300 mt-0.5">{formatCurrency(totalLaborPaid)}</div>
                </div>
                <div className="bg-[#181e2e] p-3 rounded-xl border border-amber-500/30">
                  <span className="text-amber-400">মোট বকেয়া পাওনা</span>
                  <div className="text-base font-extrabold text-amber-300 mt-0.5">{formatCurrency(totalLaborDue)}</div>
                </div>
              </div>

              {/* Labor Table */}
              <div className="bg-[#181e2e] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#131722] text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">শ্রমিক/কর্মচারীর নাম</th>
                      <th className="p-3">কাজের বিবরণ</th>
                      <th className="p-3">দেওয়া টাকা (Paid)</th>
                      <th className="p-3">বকেয়া (Due)</th>
                      <th className="p-3">মোট পাওনা</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {batchLabor.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-gray-500">
                          {"কোনো শ্রমিকের হিসাব ইনপুট দেওয়া হয়নি। + নতুন শ্রমিক এন্ট্রি বোতামে ক্লিক করুন।"}
                        </td>
                      </tr>
                    ) : (
                      batchLabor.map(item => (
                        <tr key={item.id} className="hover:bg-gray-800/40 transition">
                          <td className="p-3 font-mono text-gray-300">{formatDate(item.date)}</td>
                          <td className="p-3 font-bold text-white">{item.staffName}</td>
                          <td className="p-3 text-gray-300">{item.workDescription}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{formatCurrency(item.paidAmount)}</td>
                          <td className="p-3 font-mono font-bold text-amber-400">{formatCurrency(item.dueAmount)}</td>
                          <td className="p-3 font-mono font-bold text-indigo-300">{formatCurrency(item.paidAmount + item.dueAmount)}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm('আপনি কি এই শ্রমিকের রেকর্ডটি মুছতে চান?')) {
                                  farmStore.deleteItem('batchLabor', item.id);
                                }
                              }}
                              className="text-rose-400 hover:text-rose-300 font-medium text-[11px]"
                            >
                              মুছুন
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 3: WEIGHT & GROWTH TRACKER */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'WEIGHT_LOGS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#181e2e] p-4 rounded-xl border border-gray-800">
                <div>
                  <h3 className="text-base font-extrabold text-emerald-400 flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    <span>ওজন ও বৃদ্ধির ট্র্যাকার (Flock Growth Tracker & Ultimate Avg Weight)</span>
                  </h3>
                  <p className="text-xs text-gray-400">দৈনন্দিন স্যাম্পল ওজন ইনপুট দেওয়া মাত্রই অটোমেটিকালি সর্বমোট গড় ওজন (Avg Wt in kg) হিসেব হবে।</p>
                </div>
                <button
                  onClick={() => setShowAddWeight(!showAddWeight)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ স্যাম্পল ওজন এন্ট্রি</span>
                </button>
              </div>

              {/* Banner showing current calculated ultimate avg weight */}
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                    সর্বমোট গড় ওজন (Ultimate Batch Average Weight)
                  </div>
                  <div className="text-3xl font-black text-emerald-300 mt-1 font-mono">
                    {ultimateAverageWeightKg > 0 ? `${ultimateAverageWeightKg.toFixed(3)} KG` : 'এখনো ওজন লগে তথ্য নেই'}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ultimateAverageWeightKg > 0
                      ? `(${ (ultimateAverageWeightKg * 1000).toFixed(0) } গ্রাম/পিস)`
                      : 'স্যাম্পল ওজন এন্ট্রি দিন'}
                  </p>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div className="text-gray-300">বর্তমান মুরগির বয়স: <strong className="text-emerald-400 font-mono text-sm">{flock.ageDays} দিন</strong></div>
                  <div className="text-gray-300">মোট মরা বাচ্চা: <strong className="text-rose-400 font-mono text-sm">{totalMortality} টি ({mortalityPercentage}%)</strong></div>
                </div>
              </div>

              {/* Add Weight Form */}
              {showAddWeight && (
                <form onSubmit={handleAddWeightSubmit} className="bg-[#181e2e] border border-emerald-500/40 p-4 rounded-2xl space-y-4 animate-fadeIn">
                  <h4 className="text-sm font-bold text-emerald-300 border-b border-gray-800 pb-2">নতুন স্যাম্পল ওজন রেকর্ড করুন</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">তারিখ</label>
                      <input
                        type="date"
                        value={weightDate}
                        onChange={e => setWeightDate(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">মুরগির বয়স (দিন)</label>
                      <input
                        type="number"
                        placeholder="যেমন: ২৫"
                        value={weightAgeDays}
                        onChange={e => setWeightAgeDays(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-emerald-400 mb-1">স্যাম্পল মুরগির সংখ্যা (পিস) *</label>
                      <input
                        type="number"
                        placeholder="যেমন: ১০"
                        value={sampleCount}
                        onChange={e => setSampleCount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#131722] border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-emerald-400 mb-1">স্যাম্পল মোট ওজন (কেজি) *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="যেমন: ১৫.৫০"
                        value={sampleWeightKg}
                        onChange={e => setSampleWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#131722] border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-rose-400 mb-1">মরা বাচ্চা থাকলে সংখ্যা (পিস)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={weightMortality}
                        onChange={e => setWeightMortality(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#131722] border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">নোট / মন্তব্য</label>
                      <input
                        type="text"
                        placeholder="যেমন: সুস্থ বৃদ্ধি"
                        value={weightNotes}
                        onChange={e => setWeightNotes(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Auto calculated sample avg preview */}
                  {sampleCount && sampleWeightKg ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold flex justify-between">
                      <span>হিসাবকৃত নমুনা গড় ওজন:</span>
                      <span className="font-mono text-sm">
                        {(Number(sampleWeightKg) / Number(sampleCount)).toFixed(3)} KG / পিস
                      </span>
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddWeight(false)}
                      className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl text-xs"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg"
                    >
                      ওজন রেকর্ড করুন
                    </button>
                  </div>
                </form>
              )}

              {/* Weight Log Table */}
              <div className="bg-[#181e2e] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#131722] text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">বয়স (দিন)</th>
                      <th className="p-3">স্যাম্পল সংখ্যা</th>
                      <th className="p-3">স্যাম্পল মোট ওজন</th>
                      <th className="p-3 text-emerald-400 font-bold">গড় ওজন (Avg Wt)</th>
                      <th className="p-3 text-rose-400">মরা বাচ্চা</th>
                      <th className="p-3">নোট</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {batchWeightLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-gray-500">
                          {"কোনো নমুনা ওজন ইনপুট দেওয়া হয়নি। + স্যাম্পল ওজন এন্ট্রি বোতামে ক্লিক করুন।"}
                        </td>
                      </tr>
                    ) : (
                      batchWeightLogs.map(item => (
                        <tr key={item.id} className="hover:bg-gray-800/40 transition">
                          <td className="p-3 font-mono text-gray-300">{formatDate(item.date)}</td>
                          <td className="p-3 font-mono font-bold text-white">{item.ageDays} দিন</td>
                          <td className="p-3 text-gray-300">{item.sampleBirdCount} টি</td>
                          <td className="p-3 font-mono text-gray-200">{item.sampleTotalWeightKg} KG</td>
                          <td className="p-3 font-mono font-bold text-emerald-300 text-sm">
                            {item.avgWeightKg.toFixed(3)} KG
                          </td>
                          <td className="p-3 font-mono text-rose-400">{item.mortalityCount || 0} টি</td>
                          <td className="p-3 text-gray-400">{item.notes || '-'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm('আপনি কি এই ওজনের রেকর্ডটি মুছতে চান?')) {
                                  farmStore.deleteItem('batchWeightLogs', item.id);
                                }
                              }}
                              className="text-rose-400 hover:text-rose-300 font-medium text-[11px]"
                            >
                              মুছুন
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 4: EXPENSES BREAKDOWN */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'EXPENSES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#181e2e] p-4 rounded-xl border border-gray-800">
                <div>
                  <h3 className="text-base font-extrabold text-rose-400 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span>সম্পূর্ণ খরচের খাতা (Batch Expenses Ledger)</span>
                  </h3>
                  <p className="text-xs text-gray-400">বাচ্চা কেনা, খাদ্য (বস্তা ও রেট), মেডিসিন, তুষ/গুঁড়া এবং অন্যান্য খরচের বিস্তারিত এন্ট্রি।</p>
                </div>
                <button
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ নতুন খরচের এন্ট্রি</span>
                </button>
              </div>

              {/* Add Expense Form */}
              {showAddExpense && (
                <form onSubmit={handleAddExpenseSubmit} className="bg-[#181e2e] border border-rose-500/40 p-4 rounded-2xl space-y-4 animate-fadeIn">
                  <h4 className="text-sm font-bold text-rose-300 border-b border-gray-800 pb-2">নতুন খরচের হিসাব ইনপুট</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">খরচের ক্যাটাগরি *</label>
                      <select
                        value={expCategory}
                        onChange={e => setExpCategory(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="খাদ্য বাবদ খরচ">খাদ্য বাবদ খরচ</option>
                        <option value="মেডিসিন বাবদ খরচ">মেডিসিন ও ভ্যাকসিন</option>
                        <option value="গুঁড়া বাবদ খরচ">গুঁড়া / তুষের খরচ</option>
                        <option value="বিদ্যুৎ ও জ্বালানি">বিদ্যুৎ ও জ্বালানি</option>
                        <option value="পরিবহন খরচ">পরিবহন খরচ</option>
                        <option value="অন্যান্য খরচ">অন্যান্য খরচ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">তারিখ</label>
                      <input
                        type="date"
                        value={expDate}
                        onChange={e => setExpDate(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    {(expCategory === 'খাদ্য বাবদ খরচ' || expCategory === 'গুঁড়া বাবদ খরচ') ? (
                      <>
                        <div>
                          <label className="block text-xs text-rose-400 mb-1">বস্তার সংখ্যা (Bag Qty) *</label>
                          <input
                            type="number"
                            placeholder="যেমন: ১০"
                            value={expBagQty}
                            onChange={e => setExpBagQty(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-[#131722] border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-300 font-bold"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-rose-400 mb-1">বস্তা প্রতি দাম (৳) *</label>
                          <input
                            type="number"
                            placeholder="যেমন: ২৫০০"
                            value={expPricePerBag}
                            onChange={e => setExpPricePerBag(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-[#131722] border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-300 font-bold"
                            required
                          />
                        </div>

                        {expCategory === 'খাদ্য বাবদ খরচ' && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">ফিডের নাম/টাইপ</label>
                            <input
                              type="text"
                              placeholder="যেমন: স্টার্টার / গ্রোয়ার"
                              value={expFeedType}
                              onChange={e => setExpFeedType(e.target.value)}
                              className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <label className="block text-xs text-rose-400 mb-1">মোট খরচের পরিমাণ (৳) *</label>
                        <input
                          type="number"
                          placeholder="যেমন: ১৫০০"
                          value={expAmount}
                          onChange={e => setExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-[#131722] border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-300 font-bold"
                          required
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">নোট / মন্তব্য</label>
                      <input
                        type="text"
                        placeholder="খরচ সম্পর্কিত অতিরিক্ত তথ্য"
                        value={expNote}
                        onChange={e => setExpNote(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(false)}
                      className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl text-xs"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg"
                    >
                      খরচ যোগ করুন
                    </button>
                  </div>
                </form>
              )}

              {/* Expense Table */}
              <div className="bg-[#181e2e] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#131722] text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">ক্যাটাগরি</th>
                      <th className="p-3">পরিমাণ / বস্তা</th>
                      <th className="p-3">বস্তা প্রতি রেট</th>
                      <th className="p-3 text-rose-400 font-bold">মোট খরচ (৳)</th>
                      <th className="p-3">নোট</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {/* Chick Cost Row */}
                    {chickCost > 0 && (
                      <tr className="bg-emerald-950/20 font-medium">
                        <td className="p-3 font-mono text-gray-300">{formatDate(flock.startDate)}</td>
                        <td className="p-3 font-bold text-emerald-400">বাচ্চা কেনা (Initial Chicks)</td>
                        <td className="p-3 text-gray-200">{flock.initialQty} পিস</td>
                        <td className="p-3 font-mono text-gray-300">৳{flock.unitPrice}</td>
                        <td className="p-3 font-mono font-extrabold text-rose-400">{formatCurrency(chickCost)}</td>
                        <td className="p-3 text-gray-400">প্রাথমিক বাচ্চার ক্রয়ামূল্য</td>
                        <td className="p-3 text-right text-[10px] text-gray-500">ব্যাচ এডিট</td>
                      </tr>
                    )}

                    {batchExpenses.length === 0 && chickCost === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-gray-500">
                          {"কোনো খরচের এন্ট্রি পাওয়া যায়নি। + নতুন খরচের এন্ট্রি বোতামে ক্লিক করুন।"}
                        </td>
                      </tr>
                    ) : (
                      batchExpenses.map(item => (
                        <tr key={item.id} className="hover:bg-gray-800/40 transition">
                          <td className="p-3 font-mono text-gray-300">{formatDate(item.date)}</td>
                          <td className="p-3 font-bold text-white">{item.category}</td>
                          <td className="p-3 text-gray-300">{item.bagQty ? `${item.bagQty} বস্তা` : '-'}</td>
                          <td className="p-3 font-mono text-gray-300">{item.pricePerBag ? formatCurrency(item.pricePerBag) : '-'}</td>
                          <td className="p-3 font-mono font-bold text-rose-400">{formatCurrency(item.amount)}</td>
                          <td className="p-3 text-gray-400">{item.note || '-'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm('আপনি কি এই খরচের এন্ট্রিটি মুছতে চান?')) {
                                  farmStore.deleteItem('batchExpenses', item.id);
                                }
                              }}
                              className="text-rose-400 hover:text-rose-300 font-medium text-[11px]"
                            >
                              মুছুন
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 5: SALES ACCOUNTING */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'SALES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#181e2e] p-4 rounded-xl border border-gray-800">
                <div>
                  <h3 className="text-base font-extrabold text-teal-400 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    <span>মুরগি বিক্রি ও লাভ-ক্ষতির হিসাব (Chicken Sales Ledger)</span>
                  </h3>
                  <p className="text-xs text-gray-400">কেজি বা পিস হিসেবে বিক্রির তথ্য, ক্রেতার নাম এবং প্রাপ্ত ও বকেয়া পাওনার হিসাব।</p>
                </div>
                <button
                  onClick={() => setShowAddSale(!showAddSale)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ মুরগি বিক্রির এন্ট্রি</span>
                </button>
              </div>

              {/* Add Sale Form */}
              {showAddSale && (
                <form onSubmit={handleAddSaleSubmit} className="bg-[#181e2e] border border-teal-500/40 p-4 rounded-2xl space-y-4 animate-fadeIn">
                  <h4 className="text-sm font-bold text-teal-300 border-b border-gray-800 pb-2">নতুন মুরগি বিক্রয় এন্ট্রি ইনপুট</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">ক্রেতার নাম (Buyer Name) *</label>
                      <input
                        type="text"
                        placeholder="যেমন: পাইকারী করিম ভাই"
                        value={saleBuyer}
                        onChange={e => setSaleBuyer(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">বিক্রির তারিখ</label>
                      <input
                        type="date"
                        value={saleDate}
                        onChange={e => setSaleDate(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-teal-400 mb-1">মুরগির সংখ্যা (পিস) *</label>
                      <input
                        type="number"
                        placeholder="যেমন: ৫০"
                        value={saleBirdQty}
                        onChange={e => setSaleBirdQty(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#131722] border border-teal-500/40 rounded-xl px-3 py-2 text-xs text-teal-300 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-teal-400 mb-1">মোট বিক্রয় ওজন (কেজি) *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="যেমন: ১০০.৫"
                        value={saleTotalWeight}
                        onChange={e => setSaleTotalWeight(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#131722] border border-teal-500/40 rounded-xl px-3 py-2 text-xs text-teal-300 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-teal-400 mb-1">কেজি প্রতি দাম (৳/KG) *</label>
                      <input
                        type="number"
                        placeholder="যেমন: ১৬০"
                        value={salePricePerKg}
                        onChange={e => setSalePricePerKg(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#131722] border border-teal-500/40 rounded-xl px-3 py-2 text-xs text-teal-300 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-emerald-400 mb-1">প্রাপ্ত টাকা (Paid Amount) ৳</label>
                      <input
                        type="number"
                        placeholder="সম্পূর্ণ বা আংশিক নগদ প্রাপ্তি"
                        value={salePaid}
                        onChange={e => setSalePaid(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#131722] border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold"
                      />
                    </div>
                  </div>

                  {/* Calculated Sale Preview */}
                  {saleTotalWeight && salePricePerKg ? (
                    <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 font-bold flex justify-between">
                      <span>মোট বিক্রয় মূল্যের পরিমাণ:</span>
                      <span className="font-mono text-sm">
                        ৳ {(Number(saleTotalWeight) * Number(salePricePerKg)).toLocaleString()}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddSale(false)}
                      className="px-4 py-2 border border-gray-700 text-gray-300 rounded-xl text-xs"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-lg"
                    >
                      বিক্রি এন্ট্রি সংরক্ষণ
                    </button>
                  </div>
                </form>
              )}

              {/* Sales Table */}
              <div className="bg-[#181e2e] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#131722] text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">ক্রেতার নাম</th>
                      <th className="p-3">সংখ্যা (পিস)</th>
                      <th className="p-3">ওজন (কেজি)</th>
                      <th className="p-3">রেট (৳/কেজি)</th>
                      <th className="p-3 text-teal-300 font-bold">মোট টাকা</th>
                      <th className="p-3 text-emerald-400">প্রাপ্তি</th>
                      <th className="p-3 text-amber-400">বকেয়া</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {batchSales.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-gray-500">
                          {"কোনো বিক্রয় এন্ট্রি পাওয়া যায়নি। + মুরগি বিক্রির এন্ট্রি বোতামে ক্লিক করুন।"}
                        </td>
                      </tr>
                    ) : (
                      batchSales.map(item => {
                        const paid = item.paidAmount !== undefined ? item.paidAmount : item.totalAmount;
                        const due = item.dueAmount !== undefined ? item.dueAmount : Math.max(0, item.totalAmount - paid);

                        return (
                          <tr key={item.id} className="hover:bg-gray-800/40 transition">
                            <td className="p-3 font-mono text-gray-300">{formatDate(item.date)}</td>
                            <td className="p-3 font-bold text-white">{item.buyerName}</td>
                            <td className="p-3 text-gray-300">{item.birdQty} পিস</td>
                            <td className="p-3 font-mono text-gray-200">{item.totalWeight} KG</td>
                            <td className="p-3 font-mono text-gray-300">৳{item.pricePerKg}</td>
                            <td className="p-3 font-mono font-bold text-teal-300">{formatCurrency(item.totalAmount)}</td>
                            <td className="p-3 font-mono font-bold text-emerald-400">{formatCurrency(paid)}</td>
                            <td className="p-3 font-mono font-bold text-amber-400">{due > 0 ? formatCurrency(due) : '৳0'}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm('আপনি কি এই বিক্রয় রেকর্ডটি মুছতে চান?')) {
                                    farmStore.deleteItem('batchSales', item.id);
                                  }
                                }}
                                className="text-rose-400 hover:text-rose-300 font-medium text-[11px]"
                              >
                                মুছুন
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

function totalLaborBagsLabel(bags: number) {
  return bags > 0 ? `${bags} বস্তা ফিড` : 'নিয়মিত ফিড';
}
