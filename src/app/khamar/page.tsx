'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Flock, BatchSale, BatchExpense, KhamariLog, KhamarProfile } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Plus, Trash2, Bird, ArrowLeft, RefreshCw, Calendar, Clock,
  ShoppingCart, DollarSign, Activity, FileText, CheckCircle2, TrendingUp, TrendingDown, Egg, Home, Layers
} from 'lucide-react';

export default function KhamarPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [batchSales, setBatchSales] = useState<BatchSale[]>([]);
  const [batchExpenses, setBatchExpenses] = useState<BatchExpense[]>([]);
  const [khamariLogs, setKhamariLogs] = useState<KhamariLog[]>([]);
  const [khamars, setKhamars] = useState<KhamarProfile[]>([]);

  // Navigation Tab inside Khamar: 'BATCHES' | 'DAILY_LOGS' | 'FINANCIALS'
  const [mainTab, setMainTab] = useState<'BATCHES' | 'DAILY_LOGS' | 'FINANCIALS'>('BATCHES');

  // Active Modal: null | 'NEW_BATCH' | 'BIRD_SALE' | 'EXPENSE' | 'MORTALITY' | 'DAILY_LOG' | 'REPORT'
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedFlock, setSelectedFlock] = useState<Flock | null>(null);

  // Form State 1: New Batch (Matching User Screenshot with live time & date)
  const [batchName, setBatchName] = useState('');
  const [chickType, setChickType] = useState('ব্রয়লার');
  const [companyName, setCompanyName] = useState('');
  const [chickCount, setChickCount] = useState<number | ''>('');
  const [pricePerChick, setPricePerChick] = useState<number | ''>('');
  const [batchStartDate, setBatchStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchStartTime, setBatchStartTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

  // Form State 2: Bird Sale (Screenshot 1)
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [buyerName, setBuyerName] = useState('');
  const [birdQtyPcs, setBirdQtyPcs] = useState<number | ''>('');
  const [totalWeightKg, setTotalWeightKg] = useState<number | ''>('');
  const [pricePerKg, setPricePerKg] = useState<number | ''>('');

  // Form State 3: Expenses (Screenshot 2)
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');

  // Form State 4: Mortality
  const [mortalityCount, setMortalityCount] = useState<number | ''>('');
  const [mortalityNotes, setMortalityNotes] = useState('');

  // Form State 5: Daily Khamari Log (Egg & Feed)
  const [logFlockId, setLogFlockId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [eggGood, setEggGood] = useState<number | ''>('');
  const [eggDamaged, setEggDamaged] = useState<number | ''>('');
  const [feedBags, setFeedBags] = useState<number | ''>('');
  const [logMortality, setLogMortality] = useState<number | ''>('');
  const [logNotes, setLogNotes] = useState('');

  useEffect(() => {
    const update = () => {
      const state = farmStore.getState();
      setFlocks(state.flocks || []);
      setBatchSales(state.batchSales || []);
      setBatchExpenses(state.batchExpenses || []);
      setKhamariLogs(state.khamariLogs || []);
      setKhamars(state.khamars || []);
    };
    update();
    const unsub = farmStore.subscribe(update);

    const timer = setInterval(() => {
      setBatchStartTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  // Handlers for New Batch Modal
  const handleResetNewBatch = () => {
    setBatchName('');
    setChickType('ব্রয়লার');
    setCompanyName('');
    setChickCount('');
    setPricePerChick('');
    setBatchStartDate(new Date().toISOString().slice(0, 10));
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) return alert('অনুগ্রহ করে ব্যাচের নাম লিখুন');
    if (!chickCount || Number(chickCount) <= 0) return alert('অনুগ্রহ করে বাচ্চার সংখ্যা উল্লেখ করুন');

    const count = Number(chickCount);
    const unitPrice = pricePerChick ? Number(pricePerChick) : 0;
    const flockId = `FL-${Date.now().toString().slice(-4)}`;

    const newFlock: Flock = {
      id: flockId,
      name: batchName,
      breed: chickType,
      companyName: companyName || undefined,
      unitPrice: unitPrice > 0 ? unitPrice : undefined,
      houseNo: 'Shed 1',
      initialQty: count,
      currentQty: count,
      startDate: batchStartDate || new Date().toISOString().slice(0, 10),
      ageDays: 1,
      status: 'Active'
    };

    farmStore.addItem('flocks', newFlock);

    // If unit price entered, auto add chick purchase expense
    if (unitPrice > 0) {
      const totalChickCost = count * unitPrice;
      const initialExp: BatchExpense = {
        id: `EXP-${Date.now().toString().slice(-4)}`,
        flockId,
        date: batchStartDate,
        category: 'বাচ্চা বাবদ খরচ',
        amount: totalChickCost,
        note: `Initial Chick Purchase: ${count} pcs @ ৳${unitPrice}`
      };
      farmStore.addItem('batchExpenses', initialExp);

      // Add to accounting
      farmStore.addItem('accounting', {
        id: `ACC-${Date.now().toString().slice(-4)}`,
        date: batchStartDate,
        type: 'Expense',
        category: 'Chick Purchase',
        amount: totalChickCost,
        note: `Batch: ${batchName} (${count} chicks)`
      });
    }

    handleResetNewBatch();
    setActiveModal(null);
    alert('নতুন ব্যাচ সফলভাবে যুক্ত করা হয়েছে!');
  };

  // Handlers for Bird Sale (Screenshot 1)
  const handleResetSale = () => {
    setSaleDate(new Date().toISOString().slice(0, 10));
    setBuyerName('');
    setBirdQtyPcs('');
    setTotalWeightKg('');
    setPricePerKg('');
  };

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlock) return;
    if (!buyerName.trim()) return alert('অনুগ্রহ করে ক্রেতার নাম দিন');
    if (!birdQtyPcs || Number(birdQtyPcs) <= 0) return alert('অনুগ্রহ করে মুরগির সংখ্যা দিন');
    if (!totalWeightKg || Number(totalWeightKg) <= 0) return alert('অনুগ্রহ করে মোট ওজন দিন');
    if (!pricePerKg || Number(pricePerKg) <= 0) return alert('অনুগ্রহ করে কেজি প্রতি দাম দিন');

    const pcs = Number(birdQtyPcs);
    const weight = Number(totalWeightKg);
    const rate = Number(pricePerKg);
    const totalAmount = weight * rate;

    const newSale: BatchSale = {
      id: `BS-${Date.now().toString().slice(-4)}`,
      flockId: selectedFlock.id,
      date: saleDate,
      buyerName: buyerName.trim(),
      birdQty: pcs,
      totalWeight: weight,
      pricePerKg: rate,
      totalAmount
    };

    farmStore.addItem('batchSales', newSale);

    // Auto deduct bird count
    const newQty = Math.max(0, selectedFlock.currentQty - pcs);
    farmStore.updateItem('flocks', selectedFlock.id, { currentQty: newQty });

    // Auto record in main Accounting
    farmStore.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-4)}`,
      date: saleDate,
      type: 'Income',
      category: 'Live Bird Sales',
      amount: totalAmount,
      note: `Batch: ${selectedFlock.name} - ${pcs} pcs (${weight}kg)`
    });

    alert(`সাফল্যের সাথে ৳${totalAmount.toLocaleString()} টাকার বিক্রয় সংরক্ষণ করা হয়েছে!`);
    handleResetSale();
    setActiveModal(null);
  };

  // Handlers for Batch Expense (Screenshot 2)
  const handleResetExpense = () => {
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setExpenseCategory('');
    setExpenseAmount('');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlock) return;
    if (!expenseCategory) return alert('অনুগ্রহ করে খরচের ধরন বাছাই করুন');
    if (!expenseAmount || Number(expenseAmount) <= 0) return alert('অনুগ্রহ করে খরচের পরিমাণ দিন');

    const amount = Number(expenseAmount);

    const newExp: BatchExpense = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      flockId: selectedFlock.id,
      date: expenseDate,
      category: expenseCategory,
      amount
    };

    farmStore.addItem('batchExpenses', newExp);

    farmStore.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-4)}`,
      date: expenseDate,
      type: 'Expense',
      category: expenseCategory,
      amount,
      note: `Batch: ${selectedFlock.name}`
    });

    alert(`সাফল্যের সাথে ৳${amount.toLocaleString()} টাকার খরচ যুক্ত করা হয়েছে!`);
    handleResetExpense();
    setActiveModal(null);
  };

  // Handler for Mortality
  const handleRecordMortality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlock) return;
    if (!mortalityCount || Number(mortalityCount) <= 0) return alert('অনুগ্রহ করে মরা বাচ্চার সংখ্যা দিন');

    const deadPcs = Number(mortalityCount);
    const newQty = Math.max(0, selectedFlock.currentQty - deadPcs);

    farmStore.updateItem('flocks', selectedFlock.id, { currentQty: newQty });

    farmStore.addItem('khamariLogs', {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      flockId: selectedFlock.id,
      date: new Date().toISOString().slice(0, 10),
      eggGood: 0,
      eggDamaged: 0,
      feedBags: 0,
      mortality: deadPcs,
      temperature: 28,
      notes: mortalityNotes || 'মরা বাচ্চা রেকর্ড'
    });

    alert(`সাফল্যের সাথে ${deadPcs} টি মরা বাচ্চা রেকর্ড করা হয়েছে।`);
    setMortalityCount('');
    setMortalityNotes('');
    setActiveModal(null);
  };

  // Handler for Daily Khamari Log (Egg & Feed)
  const handleCreateDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logFlockId) return alert('অনুগ্রহ করে ব্যাচ সিলেক্ট করুন');

    const goodEggs = eggGood ? Number(eggGood) : 0;
    const damagedEggs = eggDamaged ? Number(eggDamaged) : 0;
    const feed = feedBags ? Number(feedBags) : 0;
    const dead = logMortality ? Number(logMortality) : 0;

    const newLog: KhamariLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      flockId: logFlockId,
      date: logDate,
      eggGood: goodEggs,
      eggDamaged: damagedEggs,
      feedBags: feed,
      mortality: dead,
      temperature: 28,
      notes: logNotes || 'দৈনিক ডিম ও খাবার এন্ট্রি'
    };

    farmStore.addItem('khamariLogs', newLog);

    if (dead > 0) {
      const target = flocks.find(f => f.id === logFlockId);
      if (target) {
        farmStore.updateItem('flocks', logFlockId, { currentQty: Math.max(0, target.currentQty - dead) });
      }
    }

    if (goodEggs > 0) {
      const eggProduct = farmStore.getState().products.find(p => p.id === 'PRD-003');
      if (eggProduct) {
        const addedCrates = Math.floor(goodEggs / 30);
        if (addedCrates > 0) {
          farmStore.updateItem('products', eggProduct.id, { stock: eggProduct.stock + addedCrates });
        }
      }
    }

    setEggGood('');
    setEggDamaged('');
    setFeedBags('');
    setLogMortality('');
    setLogNotes('');
    setActiveModal(null);
    alert('দৈনিক খামার এন্ট্রি সংরক্ষণ করা হয়েছে!');
  };

  const handleDeleteFlock = (id: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই ব্যাচটি মুছে ফেলতে চান?')) {
      farmStore.deleteItem('flocks', id);
    }
  };

  // Helper calculations for a flock
  const getFlockMetrics = (flockId: string) => {
    const sales = batchSales.filter(s => s.flockId === flockId);
    const expenses = batchExpenses.filter(e => e.flockId === flockId);
    const logs = khamariLogs.filter(l => l.flockId === flockId);

    const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalMortality = logs.reduce((acc, l) => acc + (l.mortality || 0), 0);
    const profitOrLoss = totalSales - totalExpenses;

    return { totalSales, totalExpenses, totalMortality, profitOrLoss, sales, expenses };
  };

  // Overall Khamar Metrics
  const totalLiveBirds = flocks.reduce((acc, f) => acc + f.currentQty, 0);
  const totalRevenueAll = batchSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalExpenseAll = batchExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfitAll = totalRevenueAll - totalExpenseAll;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121620] p-5 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bird className="w-6 h-6 text-emerald-400" />
            <span>খামার ও ব্যাচ ম্যানেজমেন্ট (Unified Khamar Dashboard)</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">ব্যাচ ক্রিয়েশন, মুরগি বিক্রি, খরচ ইনপুট, মরা বাচ্চা ও দৈনিক ডিম-খাবারের সমন্বিত সিস্টেম।</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              handleResetNewBatch();
              setActiveModal('NEW_BATCH');
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন ব্যাচ বানান</span>
          </button>

          <button
            onClick={() => setActiveModal('DAILY_LOG')}
            className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
          >
            <Egg className="w-4 h-4 text-amber-400" />
            <span>+ দৈনিক এন্ট্রি (ডিম/খাবার)</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card bg-slate-900/90 border-l-4 border-l-emerald-500 p-4">
          <div className="text-xs text-gray-400 font-medium">সক্রিয় ব্যাচ সংখ্যা</div>
          <div className="text-2xl font-extrabold text-white mt-1">{flocks.length} টি ব্যাচ</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">মোট জীবন্ত: {totalLiveBirds.toLocaleString()} টি</div>
        </div>

        <div className="glass-card bg-slate-900/90 border-l-4 border-l-teal-500 p-4">
          <div className="text-xs text-gray-400 font-medium">সর্বমোট মুরগি বিক্রয় (আয়)</div>
          <div className="text-2xl font-extrabold text-teal-400 mt-1">{formatCurrency(totalRevenueAll)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{batchSales.length} টি বিক্রয় মেমো</div>
        </div>

        <div className="glass-card bg-slate-900/90 border-l-4 border-l-rose-500 p-4">
          <div className="text-xs text-gray-400 font-medium">সর্বমোট খামার খরচ (ব্যয়)</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{formatCurrency(totalExpenseAll)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{batchExpenses.length} টি খরচের এন্ট্রি</div>
        </div>

        <div className="glass-card bg-slate-900/90 border-l-4 border-l-amber-500 p-4">
          <div className="text-xs text-gray-400 font-medium">নিট খামার লাভ / ক্ষতি</div>
          <div className={`text-2xl font-extrabold mt-1 ${netProfitAll >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netProfitAll)}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">রিয়েল-টাইম লাভ-ক্ষতি</div>
        </div>
      </div>

      {/* TABS NAVIGATION INSIDE KHAMAR */}
      <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
        <button
          onClick={() => setMainTab('BATCHES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            mainTab === 'BATCHES'
              ? 'bg-emerald-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>সকল ব্যাচ ম্যানেজমেন্ট ({flocks.length})</span>
        </button>

        <button
          onClick={() => setMainTab('DAILY_LOGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            mainTab === 'DAILY_LOGS'
              ? 'bg-emerald-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-gray-400 hover:text-white'
          }`}
        >
          <Egg className="w-4 h-4" />
          <span>দৈনিক ডিম ও খাবার রেজিস্টার ({khamariLogs.length})</span>
        </button>

        <button
          onClick={() => setMainTab('FINANCIALS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            mainTab === 'FINANCIALS'
              ? 'bg-emerald-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>আর্থিক হিসাব-নিকাশ</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. PROFESSIONAL MODAL: NEW BATCH CREATION (Professional Dialog & Live Time) */}
      {/* ========================================================================= */}
      {activeModal === 'NEW_BATCH' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121620] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-xl transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-xl font-extrabold text-emerald-400">নতুন ব্যাচ বানান</h3>
                  <p className="text-xs text-gray-400">নতুন বাচ্চার ধরন, সংখ্যা ও মূল্য ইনপুট দিন</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              {/* Live Time Banner */}
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs">
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> সময় ও তারিখ:
                </span>
                <span className="text-white font-mono font-bold">
                  {formatDate(batchStartDate)} | {batchStartTime}
                </span>
              </div>

              {/* Field 1: Batch Name */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">ব্যাচের নাম দিন</label>
                <input
                  type="text"
                  placeholder="যেমন: ব্যাচ-১০১ (ব্রয়লার সিজন-১)"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition"
                />
              </div>

              {/* Field 2: Chick Type (Drop down) */}
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1.5">বাচ্চার ধরন</label>
                <select
                  value={chickType}
                  onChange={(e) => setChickType(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3 text-emerald-300 focus:outline-none focus:border-emerald-400 text-sm font-medium transition"
                >
                  <option value="ব্রয়লার">ব্রয়লার</option>
                  <option value="সোনালী">সোনালী</option>
                  <option value="লেয়ার">লেয়ার</option>
                  <option value="কক">কক</option>
                  <option value="দেশী">দেশী</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </div>

              {/* Field 3: Company Name */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">বাচ্চার কোম্পানীর নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: কাজী ফার্মস / সিপি হ্যচারি"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition"
                />
              </div>

              {/* Field 4 & 5: Side by side Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">বাচ্চার সংখ্যা (পিস)</label>
                  <input
                    type="number"
                    placeholder="বাচ্চার সংখ্যা"
                    value={chickCount}
                    onChange={(e) => setChickCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">বাচ্চা প্রতি দাম (৳)</label>
                  <input
                    type="number"
                    placeholder="বাচ্চা প্রতি দাম"
                    value={pricePerChick}
                    onChange={(e) => setPricePerChick(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition"
                  />
                </div>
              </div>

              {/* Total Purchase Preview */}
              {chickCount && pricePerChick ? (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-sm">
                  <span className="text-gray-300 font-medium">মোট বাচ্চা কেনার খরচ:</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    ৳ {(Number(chickCount) * Number(pricePerChick)).toLocaleString()}
                  </span>
                </div>
              ) : null}

              {/* Field 6: Date Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">শুরুর তারিখ</label>
                <div className="flex items-center gap-3 bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3">
                  <Calendar className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={batchStartDate}
                    onChange={(e) => setBatchStartDate(e.target.value)}
                    className="w-full bg-transparent text-emerald-400 font-medium focus:outline-none text-sm cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-5 rounded-full flex items-center justify-center gap-2 shadow-lg text-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ব্যাচ যোগ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetNewBatch}
                  className="px-5 py-3.5 border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 text-sm transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>রিসেট করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. BIRD SALE MODAL (Matches Screenshot 1) */}
      {activeModal === 'BIRD_SALE' && selectedFlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121620] border border-teal-500/30 rounded-2xl p-6 shadow-2xl space-y-6 max-w-2xl w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveModal(null)} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-teal-400">মুরগি বিক্রয়</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl text-sm">
              <span className="text-emerald-400 font-medium">ব্যাচ এর নাম: </span>
              <span className="text-white font-bold">{selectedFlock.name}</span>
              <span className="text-xs text-gray-400 ml-2">(অবশিষ্ট: {selectedFlock.currentQty} টি)</span>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4">
              <div className="flex items-center gap-3 bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3">
                <Calendar className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full bg-transparent text-emerald-400 font-medium focus:outline-none text-sm cursor-pointer"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="ক্রেতার নাম"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    placeholder="মুরগির সংখ্যা (পিস)"
                    value={birdQtyPcs}
                    onChange={(e) => setBirdQtyPcs(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="মোট ওজন (কেজি)"
                    value={totalWeightKg}
                    onChange={(e) => setTotalWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <input
                  type="number"
                  placeholder="কেজি প্রতি দাম"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-sm"
                />
              </div>

              {totalWeightKg && pricePerKg ? (
                <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between text-sm">
                  <span className="text-gray-300">মোট বিক্রয় মূল্য:</span>
                  <span className="text-xl font-extrabold text-teal-400">
                    ৳ {(Number(totalWeightKg) * Number(pricePerKg)).toLocaleString()}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 text-sm shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>বিক্রয়ের অন্তর্ভুক্ত করুন</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetSale}
                  className="px-5 py-3.5 border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium rounded-xl text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>রিসেট করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. BATCH EXPENSE MODAL (Matches Screenshot 2) */}
      {activeModal === 'EXPENSE' && selectedFlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121620] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-6 max-w-2xl w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveModal(null)} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-rose-400">খরচ সমূহ</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl text-sm">
              <span className="text-emerald-400 font-medium">ব্যাচ এর নাম: </span>
              <span className="text-white font-bold">{selectedFlock.name}</span>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="flex items-center gap-3 bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3">
                <Calendar className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-transparent text-emerald-400 font-medium focus:outline-none text-sm cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-400 mb-1.5">খরচের ধরন</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3 text-rose-300 focus:outline-none text-sm font-medium"
                >
                  <option value="">--খরচ বাছাই করুন--</option>
                  <option value="খাদ্য বাবদ খরচ">খাদ্য বাবদ খরচ</option>
                  <option value="মেডিসিন খরচ">মেডিসিন খরচ</option>
                  <option value="পরিবহন খরচ">পরিবহন খরচ</option>
                  <option value="লিটার/তুষ খরচ">লিটার/তুষ খরচ</option>
                  <option value="শ্রমিকের বেতন">শ্রমিকের বেতন</option>
                  <option value="বিদ্যুৎ বিল">বিদ্যুৎ বিল</option>
                  <option value="অন্যান্য খরচ">অন্যান্য খরচ</option>
                  <option value="বাচ্চা বাবদ খরচ">বাচ্চা বাবদ খরচ</option>
                </select>
              </div>

              <div>
                <input
                  type="number"
                  placeholder="খরচের পরিমাণ"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 text-sm shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>খরচ যোগ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetExpense}
                  className="px-5 py-3.5 border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium rounded-xl text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>রিসেট করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DAILY EGG & FEED LOG MODAL */}
      {activeModal === 'DAILY_LOG' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121620] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-6 max-w-xl w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold text-amber-400">দৈনিক ডিম ও খাবার এন্ট্রি</h3>
              <button onClick={() => setActiveModal(null)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
            </div>

            <form onSubmit={handleCreateDailyLog} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">ব্যাচ নির্বাচন করুন</label>
                <select
                  value={logFlockId}
                  onChange={(e) => setLogFlockId(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-amber-500/50 rounded-xl px-4 py-2.5 text-amber-300 font-bold text-sm focus:outline-none"
                >
                  <option value="">-- ব্যাচ নির্বাচন করুন --</option>
                  {flocks.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.breed})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ভালো ডিম (পিস)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={eggGood}
                    onChange={(e) => setEggGood(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ফাটা / নষ্ট ডিম (পিস)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={eggDamaged}
                    onChange={(e) => setEggDamaged(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">খাদ্য ব্যবহার (বস্তা)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="যেমন: 4.5"
                    value={feedBags}
                    onChange={(e) => setFeedBags(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">মরা বাচ্চা (পিস)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={logMortality}
                    onChange={(e) => setLogMortality(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">নোট / মন্তব্য</label>
                <input
                  type="text"
                  placeholder="যেমন: আবহাওয়া স্বাভাবিক"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg text-sm"
              >
                ✓ এন্ট্রি সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. MORTALITY MODAL */}
      {activeModal === 'MORTALITY' && selectedFlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121620] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-6 max-w-lg w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold text-amber-400">মরা বাচ্চা হিসাবভুক্ত করুন</h3>
              <button onClick={() => setActiveModal(null)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
            </div>

            <form onSubmit={handleRecordMortality} className="space-y-4">
              <div>
                <input
                  type="number"
                  placeholder="মরা বাচ্চার সংখ্যা (পিস)"
                  value={mortalityCount}
                  onChange={(e) => setMortalityCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="কারণ / নোট (ঐচ্ছিক)"
                  value={mortalityNotes}
                  onChange={(e) => setMortalityNotes(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl shadow-lg text-sm"
              >
                ✓ মরা বাচ্চা সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN TAB CONTENT DISPLAY */}
      {mainTab === 'BATCHES' && (
        <div className="space-y-6">
          {/* FLOCK BATCH CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {flocks.map(f => {
              const metrics = getFlockMetrics(f.id);
              const totalDead = (f.initialQty - f.currentQty);
              const mortalityPct = ((totalDead / f.initialQty) * 100).toFixed(1);

              return (
                <div key={f.id} className="glass-card border-l-4 border-l-emerald-500 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">{f.status}</span>
                        <h3 className="font-bold text-white text-base mt-1">{f.name}</h3>
                        <div className="text-xs text-gray-400">
                          {f.breed} {f.companyName ? `(${f.companyName})` : ''} • {f.houseNo}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-amber-400">{f.ageDays}</span>
                        <div className="text-[10px] text-gray-400 uppercase">দিন বয়স</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-900/80 rounded-xl border border-white/5 text-xs my-3">
                      <div>
                        <div className="text-gray-400 text-[10px]">মুরগির সংখ্যা</div>
                        <div className="font-bold text-white mt-0.5">{f.currentQty} / {f.initialQty}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-[10px]">মৃত্যুর হার</div>
                        <div className={`font-bold mt-0.5 ${Number(mortalityPct) > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {totalDead} টি ({mortalityPct}%)
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-[10px]">মোট বিক্রীত</div>
                        <div className="font-bold text-teal-400 mt-0.5">৳ {metrics.totalSales.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-[10px]">নিট লাভ/ক্ষতি</div>
                        <div className={`font-extrabold mt-0.5 ${metrics.profitOrLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ৳ {metrics.profitOrLoss.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons for each batch */}
                  <div className="space-y-2 pt-1 border-t border-gray-800">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedFlock(f);
                          handleResetSale();
                          setActiveModal('BIRD_SALE');
                        }}
                        className="px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-teal-400" />
                        <span>মুরগি বিক্রয়</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedFlock(f);
                          handleResetExpense();
                          setActiveModal('EXPENSE');
                        }}
                        className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                        <span>খরচ ইনপুট</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedFlock(f);
                          setActiveModal('MORTALITY');
                        }}
                        className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        <span>মরা বাচ্চা</span>
                      </button>

                      <button
                        onClick={() => handleDeleteFlock(f.id)}
                        className="px-3 py-2 bg-white/5 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>মুছে ফেলুন</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FLOCK SUMMARY TABLE */}
          <div className="glass-card overflow-hidden">
            <h3 className="font-bold text-white text-base mb-4">সকল ব্যাচের পূর্ণাঙ্গ বিবরণী (All Flock Summary Table)</h3>
            <div className="overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>ব্যাচ & কোম্পানী</th>
                    <th>শুরুর তারিখ</th>
                    <th>বয়স</th>
                    <th>প্রাথমিক সংখ্যা</th>
                    <th>অবশিষ্ট</th>
                    <th>মৃত্যু</th>
                    <th>মোট বিক্রয়</th>
                    <th>মোট খরচ</th>
                    <th>লাভ/ক্ষতি</th>
                    <th>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {flocks.map(f => {
                    const metrics = getFlockMetrics(f.id);
                    const dead = f.initialQty - f.currentQty;
                    return (
                      <tr key={f.id}>
                        <td className="font-bold text-emerald-400">{f.id}</td>
                        <td><b>{f.name}</b><br/><small className="text-gray-400">{f.breed} ({f.companyName || 'N/A'})</small></td>
                        <td>{formatDate(f.startDate)}</td>
                        <td><b>{f.ageDays} দিন</b></td>
                        <td>{f.initialQty} টি</td>
                        <td className="font-bold text-emerald-400">{f.currentQty} টি</td>
                        <td className="text-red-400 font-semibold">{dead} টি</td>
                        <td className="font-bold text-teal-400">৳ {metrics.totalSales.toLocaleString()}</td>
                        <td className="font-bold text-rose-400">৳ {metrics.totalExpenses.toLocaleString()}</td>
                        <td className={`font-extrabold ${metrics.profitOrLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ৳ {metrics.profitOrLoss.toLocaleString()}
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteFlock(f.id)}
                            className="p-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg"
                            title="মুছে ফেলুন"
                          >
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
      )}

      {/* TAB 2: DAILY LOGS */}
      {mainTab === 'DAILY_LOGS' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>ব্যাচের নাম</th>
                  <th>ভালো ডিম (পিস)</th>
                  <th>ফাটা ডিম</th>
                  <th>খাদ্য (বস্তা)</th>
                  <th>মৃত্যু (পিস)</th>
                  <th>নোট</th>
                </tr>
              </thead>
              <tbody>
                {khamariLogs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-500">কোন দৈনিক রেকর্ড পাওয়া যায়নি</td></tr>
                ) : (
                  khamariLogs.map(log => {
                    const flock = flocks.find(f => f.id === log.flockId);
                    return (
                      <tr key={log.id}>
                        <td className="font-bold text-white">{formatDate(log.date)}</td>
                        <td className="font-bold text-amber-400">{flock ? flock.name : log.flockId}</td>
                        <td className="font-extrabold text-emerald-400">🥚 {log.eggGood}</td>
                        <td className="text-rose-400">{log.eggDamaged}</td>
                        <td className="font-bold text-amber-400">🌾 {log.feedBags} বস্তা</td>
                        <td className="text-rose-400">☠ {log.mortality}</td>
                        <td className="text-xs text-gray-400">{log.notes || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIALS */}
      {mainTab === 'FINANCIALS' && (
        <div className="glass-card p-6 space-y-6">
          <h4 className="font-bold text-white text-base border-b border-gray-800 pb-3">
            খামারের সর্বমোট আর্থিক লাভ-ক্ষতি হিসাব
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400">সর্বমোট মুরগি বিক্রয় (ইনকাম)</div>
              <div className="text-2xl font-extrabold text-teal-400 mt-1">৳ {totalRevenueAll.toLocaleString()}</div>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400">সর্বমোট খামার খরচ (ব্যয়)</div>
              <div className="text-2xl font-extrabold text-rose-400 mt-1">৳ {totalExpenseAll.toLocaleString()}</div>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400">নিট খামার লাভ/ক্ষতি</div>
              <div className={`text-2xl font-extrabold mt-1 ${netProfitAll >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                ৳ {netProfitAll.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
