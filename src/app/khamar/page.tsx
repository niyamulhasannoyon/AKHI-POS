'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Flock, BatchSale, BatchExpense, KhamariLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Plus, Trash2, Bird, ArrowLeft, RefreshCw, Calendar,
  ShoppingCart, DollarSign, Activity, FileText, CheckCircle2, TrendingUp, TrendingDown
} from 'lucide-react';

export default function KhamarPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [batchSales, setBatchSales] = useState<BatchSale[]>([]);
  const [batchExpenses, setBatchExpenses] = useState<BatchExpense[]>([]);
  const [khamariLogs, setKhamariLogs] = useState<KhamariLog[]>([]);

  // Active Modals: null | 'NEW_BATCH' | 'BIRD_SALE' | 'EXPENSE' | 'MORTALITY' | 'REPORT'
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedFlock, setSelectedFlock] = useState<Flock | null>(null);

  // Form State 1: New Batch
  const [batchName, setBatchName] = useState('');
  const [chickType, setChickType] = useState('ব্রয়লার');
  const [companyName, setCompanyName] = useState('');
  const [chickCount, setChickCount] = useState<number | ''>('');
  const [pricePerChick, setPricePerChick] = useState<number | ''>('');
  const [batchStartDate, setBatchStartDate] = useState(new Date().toISOString().slice(0, 10));

  // Form State 2: Bird Sale (Matching Screenshot 1)
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [buyerName, setBuyerName] = useState('');
  const [birdQtyPcs, setBirdQtyPcs] = useState<number | ''>('');
  const [totalWeightKg, setTotalWeightKg] = useState<number | ''>('');
  const [pricePerKg, setPricePerKg] = useState<number | ''>('');

  // Form State 3: Expenses (Matching Screenshot 2)
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');

  // Form State 4: Mortality
  const [mortalityCount, setMortalityCount] = useState<number | ''>('');
  const [mortalityNotes, setMortalityNotes] = useState('');

  useEffect(() => {
    const update = () => {
      const state = farmStore.getState();
      setFlocks(state.flocks || []);
      setBatchSales(state.batchSales || []);
      setBatchExpenses(state.batchExpenses || []);
      setKhamariLogs(state.khamariLogs || []);
    };
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  // Handlers for New Batch
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

    if (pcs > selectedFlock.currentQty) {
      if (!confirm(`সতর্কতা: বিক্রয়ের সংখ্যা (${pcs}) বর্তমান মুরগির সংখ্যা (${selectedFlock.currentQty}) এর চেয়ে বেশি। তাও চালিয়ে যেতে চান?`)) {
        return;
      }
    }

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

    // Auto deduct bird count from flock
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

    // Auto record in main Accounting
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

  // Handler for Mortality Logging
  const handleRecordMortality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlock) return;
    if (!mortalityCount || Number(mortalityCount) <= 0) return alert('অনুগ্রহ করে মরা বাচ্চার সংখ্যা দিন');

    const deadPcs = Number(mortalityCount);
    const newQty = Math.max(0, selectedFlock.currentQty - deadPcs);

    farmStore.updateItem('flocks', selectedFlock.id, { currentQty: newQty });

    // Add log in khamariLogs
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

    alert(`সাফল্যের সাথে ${deadPcs} টি মরা বাচ্চা হিসাব থেকে বাদ দেওয়া হয়েছে।`);
    setMortalityCount('');
    setMortalityNotes('');
    setActiveModal(null);
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121620] p-5 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bird className="w-6 h-6 text-emerald-400" />
            <span>প্রফেশনাল ফার্ম ব্যাচ ও লাভ-ক্ষতি ম্যানেজার</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">প্রতিটি ব্যাচের বাচ্চা, মুরগি বিক্রয়, মরা বাচ্চা ও খরচের হিসাব রাখার স্মার্ট সিস্টেম।</p>
        </div>
        <button
          onClick={() => {
            handleResetNewBatch();
            setActiveModal('NEW_BATCH');
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন ব্যাচ বানান</span>
        </button>
      </div>

      {/* 1. NEW BATCH FORM MODAL */}
      {activeModal === 'NEW_BATCH' && (
        <div className="bg-[#121620] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveModal(null)} className="p-2 bg-gray-800/60 hover:bg-gray-800 text-gray-300 rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-emerald-400">নতুন ব্যাচ বানান</h3>
            </div>
            <button onClick={() => setActiveModal(null)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
          </div>

          <form onSubmit={handleCreateBatch} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="ব্যাচের নাম দিন"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1.5">বাচ্চার ধরন</label>
              <select
                value={chickType}
                onChange={(e) => setChickType(e.target.value)}
                className="w-full bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3 text-emerald-300 focus:outline-none focus:border-emerald-400 text-sm font-medium"
              >
                <option value="ব্রয়লার">ব্রয়লার</option>
                <option value="সোনালী">সোনালী</option>
                <option value="লেয়ার">লেয়ার</option>
                <option value="কক">কক</option>
                <option value="দেশী">দেশী</option>
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
            </div>

            <div>
              <input
                type="text"
                placeholder="বাচ্চার কোম্পানীর নাম"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  placeholder="বাচ্চার সংখ্যা"
                  value={chickCount}
                  onChange={(e) => setChickCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="বাচ্চা প্রতি দাম"
                  value={pricePerChick}
                  onChange={(e) => setPricePerChick(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="relative">
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

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-5 rounded-full flex items-center justify-center gap-2 shadow-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ ব্যাচ যোগ করুন</span>
              </button>
              <button
                type="button"
                onClick={handleResetNewBatch}
                className="px-5 py-3 border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>রিসেট করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. BIRD SALE MODAL (Matches Screenshot 1) */}
      {activeModal === 'BIRD_SALE' && selectedFlock && (
        <div className="bg-[#121620] border border-teal-500/30 rounded-2xl p-6 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveModal(null)} className="p-2 bg-gray-800/60 hover:bg-gray-800 text-gray-300 rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-teal-400">মুরগি বিক্রয়</h3>
            </div>
            <button onClick={() => setActiveModal(null)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl text-sm">
            <span className="text-emerald-400 font-medium">ব্যাচ এর নাম: </span>
            <span className="text-white font-bold">{selectedFlock.name}</span>
            <span className="text-xs text-gray-400 ml-2">(বর্তমান অবশিষ্ট: {selectedFlock.currentQty} টি)</span>
          </div>

          <form onSubmit={handleCreateSale} className="space-y-4">
            {/* Date Field */}
            <div className="flex items-center gap-3 bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3">
              <Calendar className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full bg-transparent text-emerald-400 font-medium focus:outline-none text-sm cursor-pointer"
              />
            </div>

            {/* Buyer Name */}
            <div>
              <input
                type="text"
                placeholder="ক্রেতার নাম"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>

            {/* Side-by-side: Bird Qty & Total Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  placeholder="মুরগির সংখ্যা (পিস)"
                  value={birdQtyPcs}
                  onChange={(e) => setBirdQtyPcs(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="মোট ওজন (কেজি)"
                  value={totalWeightKg}
                  onChange={(e) => setTotalWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
            </div>

            {/* Price Per KG */}
            <div>
              <input
                type="number"
                placeholder="কেজি প্রতি দাম"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>

            {/* Total Amount Preview */}
            {totalWeightKg && pricePerKg ? (
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between text-sm">
                <span className="text-gray-300">মোট বিক্রয় মূল্য:</span>
                <span className="text-xl font-extrabold text-teal-400">
                  ৳ {(Number(totalWeightKg) * Number(pricePerKg)).toLocaleString()}
                </span>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-5 rounded-full flex items-center justify-center gap-2 shadow-lg text-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>বিক্রয়ের অন্তর্ভুক্ত করুন</span>
              </button>
              <button
                type="button"
                onClick={handleResetSale}
                className="px-5 py-3 border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>রিসেট করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. BATCH EXPENSE MODAL (Matches Screenshot 2) */}
      {activeModal === 'EXPENSE' && selectedFlock && (
        <div className="bg-[#121620] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveModal(null)} className="p-2 bg-gray-800/60 hover:bg-gray-800 text-gray-300 rounded-xl">
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
            {/* Date Field */}
            <div className="flex items-center gap-3 bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3">
              <Calendar className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-transparent text-emerald-400 font-medium focus:outline-none text-sm cursor-pointer"
              />
            </div>

            {/* Expense Category Dropdown (Exact Screenshot Options) */}
            <div>
              <label className="block text-xs font-semibold text-rose-400 mb-1.5">খরচের ধরন</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3 text-rose-300 focus:outline-none focus:border-rose-400 text-sm font-medium"
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

            {/* Expense Amount */}
            <div>
              <input
                type="number"
                placeholder="খরচের পরিমাণ"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-5 rounded-full flex items-center justify-center gap-2 shadow-lg text-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>খরচ যোগ করুন</span>
              </button>
              <button
                type="button"
                onClick={handleResetExpense}
                className="px-5 py-3 border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>রিসেট করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. MORTALITY MODAL */}
      {activeModal === 'MORTALITY' && selectedFlock && (
        <div className="bg-[#121620] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveModal(null)} className="p-2 bg-gray-800/60 hover:bg-gray-800 text-gray-300 rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-amber-400">মরা বাচ্চা হিসাবভুক্ত করুন</h3>
            </div>
            <button onClick={() => setActiveModal(null)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
          </div>

          <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl text-sm">
            <span className="text-amber-400 font-medium">ব্যাচ এর নাম: </span>
            <span className="text-white font-bold">{selectedFlock.name}</span>
            <span className="text-xs text-gray-400 ml-2">(বর্তমান জীবন্ত মুরগি: {selectedFlock.currentQty} টি)</span>
          </div>

          <form onSubmit={handleRecordMortality} className="space-y-4">
            <div>
              <input
                type="number"
                placeholder="মরা বাচ্চার সংখ্যা (পিস)"
                value={mortalityCount}
                onChange={(e) => setMortalityCount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="কারণ / নোট (ঐচ্ছিক)"
                value={mortalityNotes}
                onChange={(e) => setMortalityNotes(e.target.value)}
                className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>মরা বাচ্চা সংরক্ষণ করুন</span>
            </button>
          </form>
        </div>
      )}

      {/* 5. BATCH DETAILED LEDGER REPORT MODAL */}
      {activeModal === 'REPORT' && selectedFlock && (
        <div className="bg-[#121620] border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>ব্যাচ রিপোর্ট: {selectedFlock.name}</span>
              </h3>
              <p className="text-xs text-gray-400">{selectedFlock.breed} • {selectedFlock.companyName || 'N/A'}</p>
            </div>
            <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-xl text-xs">
              ✕ বন্ধ করুন
            </button>
          </div>

          {(() => {
            const metrics = getFlockMetrics(selectedFlock.id);
            return (
              <div className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-gray-800">
                    <div className="text-xs text-gray-400">শুরুর বাচ্চার সংখ্যা</div>
                    <div className="text-lg font-bold text-white mt-1">{selectedFlock.initialQty} টি</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">অবশিষ্ট: {selectedFlock.currentQty} টি</div>
                  </div>
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-gray-800">
                    <div className="text-xs text-gray-400">মোট বিক্রয় (ইনকাম)</div>
                    <div className="text-lg font-bold text-emerald-400 mt-1">৳ {metrics.totalSales.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{metrics.sales.length} টি ইনভয়েস</div>
                  </div>
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-gray-800">
                    <div className="text-xs text-gray-400">মোট খরচ</div>
                    <div className="text-lg font-bold text-rose-400 mt-1">৳ {metrics.totalExpenses.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{metrics.expenses.length} টি খরচ রেকর্ড</div>
                  </div>
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-gray-800">
                    <div className="text-xs text-gray-400">নিট লাভ / ক্ষতি</div>
                    <div className={`text-lg font-extrabold mt-1 flex items-center gap-1 ${metrics.profitOrLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {metrics.profitOrLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>৳ {metrics.profitOrLoss.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Sales History */}
                <div>
                  <h4 className="font-bold text-teal-400 text-sm mb-2">মুরগি বিক্রয়ের হিসেব</h4>
                  <div className="overflow-x-auto border border-gray-800 rounded-xl">
                    <table className="w-full text-xs text-left text-gray-300">
                      <thead className="bg-slate-900 text-gray-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">তারিখ</th>
                          <th className="p-3">ক্রেতার নাম</th>
                          <th className="p-3">সংখ্যা (পিস)</th>
                          <th className="p-3">ওজন (কেজি)</th>
                          <th className="p-3">দর (কেজি)</th>
                          <th className="p-3">মোট দাম</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {metrics.sales.length === 0 ? (
                          <tr><td colSpan={6} className="p-4 text-center text-gray-500">কোন বিক্রয় রেকর্ড নেই</td></tr>
                        ) : (
                          metrics.sales.map(s => (
                            <tr key={s.id}>
                              <td className="p-3">{formatDate(s.date)}</td>
                              <td className="p-3 font-semibold text-white">{s.buyerName}</td>
                              <td className="p-3">{s.birdQty}</td>
                              <td className="p-3">{s.totalWeight} kg</td>
                              <td className="p-3">৳ {s.pricePerKg}</td>
                              <td className="p-3 font-bold text-teal-400">৳ {s.totalAmount.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Expense History */}
                <div>
                  <h4 className="font-bold text-rose-400 text-sm mb-2">ব্যাচের খরচের হিসেব</h4>
                  <div className="overflow-x-auto border border-gray-800 rounded-xl">
                    <table className="w-full text-xs text-left text-gray-300">
                      <thead className="bg-slate-900 text-gray-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">তারিখ</th>
                          <th className="p-3">খরচের ধরন</th>
                          <th className="p-3">নোট</th>
                          <th className="p-3">পরিমাণ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {metrics.expenses.length === 0 ? (
                          <tr><td colSpan={4} className="p-4 text-center text-gray-500">কোন খরচ রেকর্ড নেই</td></tr>
                        ) : (
                          metrics.expenses.map(e => (
                            <tr key={e.id}>
                              <td className="p-3">{formatDate(e.date)}</td>
                              <td className="p-3 font-semibold text-rose-300">{e.category}</td>
                              <td className="p-3 text-gray-400">{e.note || '-'}</td>
                              <td className="p-3 font-bold text-rose-400">৳ {e.amount.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* FLOCK BATCH CARDS (All Active Batches) */}
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

                {/* Metrics grid inside card */}
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
                    onClick={() => {
                      setSelectedFlock(f);
                      setActiveModal('REPORT');
                    }}
                    className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>রিপোর্ট</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOCK RECORD SUMMARY TABLE */}
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
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedFlock(f);
                            setActiveModal('REPORT');
                          }}
                          className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs"
                          title="রিপোর্ট দেখুন"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFlock(f.id)}
                          className="p-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
