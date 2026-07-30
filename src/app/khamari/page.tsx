'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { KhamariLog, Flock, KhamarProfile, BatchSale, BatchExpense } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  CalendarCheck, Plus, Trash2, Home, User, Phone, MapPin,
  TrendingUp, Activity, Egg, Layers, FileText, ArrowLeft, RefreshCw, Layers3
} from 'lucide-react';

export default function KhamariPage() {
  const [khamars, setKhamars] = useState<KhamarProfile[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [logs, setLogs] = useState<KhamariLog[]>([]);
  const [batchSales, setBatchSales] = useState<BatchSale[]>([]);
  const [batchExpenses, setBatchExpenses] = useState<BatchExpense[]>([]);

  // Active Khamar Profile Selection
  const [selectedKhamarId, setSelectedKhamarId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'LOGS' | 'BATCHES' | 'FINANCIALS'>('LOGS');

  // Modals
  const [showAddKhamarModal, setShowAddKhamarModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  // Form State: Add Khamar Profile
  const [khamarName, setKhamarName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [farmType, setFarmType] = useState<'ব্রয়লার' | 'সোনালী' | 'লেয়ার' | 'মিক্সড'>('সোনালী');
  const [capacity, setCapacity] = useState<number | ''>('');

  // Form State: Add Daily Production Log
  const [selectedFlockId, setSelectedFlockId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [eggGood, setEggGood] = useState<number | ''>('');
  const [eggDamaged, setEggDamaged] = useState<number | ''>('');
  const [feedBags, setFeedBags] = useState<number | ''>('');
  const [mortality, setMortality] = useState<number | ''>('');
  const [temperature, setTemperature] = useState<number | ''>(28);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const update = () => {
      const state = farmStore.getState();
      const loadedKhamars = state.khamars || [];
      setKhamars(loadedKhamars);
      setFlocks(state.flocks || []);
      setLogs(state.khamariLogs || []);
      setBatchSales(state.batchSales || []);
      setBatchExpenses(state.batchExpenses || []);

      if (!selectedKhamarId && loadedKhamars.length > 0) {
        setSelectedKhamarId(loadedKhamars[0].id);
      }
    };
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, [selectedKhamarId]);

  const handleCreateKhamar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!khamarName.trim()) return alert('অনুগ্রহ করে খামারের নাম লিখুন');
    if (!ownerName.trim()) return alert('অনুগ্রহ করে মালিকের নাম লিখুন');

    const newKhamar: KhamarProfile = {
      id: `KHM-${Date.now().toString().slice(-4)}`,
      name: khamarName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim() || 'N/A',
      address: address.trim() || 'N/A',
      farmType,
      capacity: capacity ? Number(capacity) : 2000
    };

    farmStore.addItem('khamars', newKhamar);
    setSelectedKhamarId(newKhamar.id);
    setKhamarName('');
    setOwnerName('');
    setPhone('');
    setAddress('');
    setCapacity('');
    setShowAddKhamarModal(false);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlockId) return alert('অনুগ্রহ করে একটি ব্যাচ সিলেক্ট করুন');

    const goodEggs = eggGood ? Number(eggGood) : 0;
    const damagedEggs = eggDamaged ? Number(eggDamaged) : 0;
    const feed = feedBags ? Number(feedBags) : 0;
    const deadCount = mortality ? Number(mortality) : 0;

    const newLog: KhamariLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      flockId: selectedFlockId,
      date: logDate,
      eggGood: goodEggs,
      eggDamaged: damagedEggs,
      feedBags: feed,
      mortality: deadCount,
      temperature: temperature ? Number(temperature) : 28,
      notes: notes || 'দৈনিক খামার এন্টি'
    };

    farmStore.addItem('khamariLogs', newLog);

    // Deduct mortality from target flock
    const targetFlock = flocks.find(f => f.id === selectedFlockId);
    if (targetFlock && deadCount > 0) {
      farmStore.updateItem('flocks', selectedFlockId, {
        currentQty: Math.max(0, targetFlock.currentQty - deadCount)
      });
    }

    // Auto-update Egg Product Stock if good eggs collected
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
    setMortality('');
    setNotes('');
    setShowAddLogModal(false);
    alert('দৈনিক খামার এন্ট্রি সংরক্ষণ করা হয়েছে!');
  };

  const handleDeleteLog = (id: string) => {
    if (confirm('এই এন্ট্রিটি মুছে ফেলতে চান?')) {
      farmStore.deleteItem('khamariLogs', id);
    }
  };

  // Selected Khamar
  const activeKhamar = khamars.find(k => k.id === selectedKhamarId) || khamars[0];

  // Helper calculations for active khamar profile
  const khamarFlocks = flocks; // Can filter by khamarId if set
  const khamarFlockIds = khamarFlocks.map(f => f.id);

  const khamarLogs = logs.filter(l => khamarFlockIds.includes(l.flockId));
  const khamarSales = batchSales.filter(s => khamarFlockIds.includes(s.flockId));
  const khamarExpenses = batchExpenses.filter(e => khamarFlockIds.includes(e.flockId));

  const totalBirds = khamarFlocks.reduce((acc, f) => acc + f.currentQty, 0);
  const totalEggsCollected = khamarLogs.reduce((acc, l) => acc + l.eggGood, 0);
  const totalFeedBags = khamarLogs.reduce((acc, l) => acc + l.feedBags, 0);
  const totalRevenue = khamarSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalExpenses = khamarExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121620] p-5 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-amber-400" />
            <span>প্রফেশনাল খামার প্রোফাইল ও দৈনিক প্রোডাকশন ম্যানেজার</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">প্রতিটি খামারের পৃথক প্রোফাইল, শেড ট্র্যাকিং, ডিম সংগ্রহ ও ফিড হিসাব।</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddKhamarModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-950/50 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন খামার যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* KHAMAR PROFILE SELECTOR TABS */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 flex-shrink-0">
          <Home className="w-4 h-4 text-emerald-400" /> খামার নির্বাচন করুন:
        </span>
        {khamars.map(k => (
          <button
            key={k.id}
            onClick={() => setSelectedKhamarId(k.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
              selectedKhamarId === k.id
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-gray-300 hover:bg-slate-800 border border-gray-800'
            }`}
          >
            <span>{k.name}</span>
            <span className="text-[10px] opacity-75">({k.farmType})</span>
          </button>
        ))}
      </div>

      {/* ACTIVE KHAMAR SEPARATE PROFILE HEADER CARD */}
      {activeKhamar && (
        <div className="bg-[#121620] border border-amber-500/30 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {activeKhamar.farmType} খামার
                </span>
                <span className="text-xs text-gray-400">ID: {activeKhamar.id}</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white mt-1">{activeKhamar.name}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                <span className="flex items-center gap-1 text-gray-300 font-medium">
                  <User className="w-3.5 h-3.5 text-amber-400" /> মালিক: {activeKhamar.ownerName}
                </span>
                <span className="flex items-center gap-1 text-gray-300 font-medium">
                  <Phone className="w-3.5 h-3.5 text-amber-400" /> {activeKhamar.phone}
                </span>
                <span className="flex items-center gap-1 text-gray-300 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> {activeKhamar.address}
                </span>
                <span className="flex items-center gap-1 text-gray-300 font-medium">
                  <Layers3 className="w-3.5 h-3.5 text-amber-400" /> ধারণক্ষমতা: {activeKhamar.capacity.toLocaleString()} টি
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowAddLogModal(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition self-start md:self-auto"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>+ দৈনিক হিসেব এন্ট্রি</span>
            </button>
          </div>

          {/* Key Metrics Cards for Selected Khamar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> জীবন্ত মোট মুরগি
              </div>
              <div className="text-xl font-extrabold text-white mt-1">{totalBirds.toLocaleString()} টি</div>
              <div className="text-[10px] text-amber-400 mt-0.5">{khamarFlocks.length} টি সক্রিয় ব্যাচ</div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Egg className="w-3.5 h-3.5 text-emerald-400" /> সংগৃহীত মোট ডিম
              </div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">{totalEggsCollected.toLocaleString()} টি</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{Math.floor(totalEggsCollected / 30)} ক্যারেট</div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-400" /> মোট খাদ্য খরচ (ফিড)
              </div>
              <div className="text-xl font-extrabold text-amber-400 mt-1">{totalFeedBags} বস্তা</div>
              <div className="text-[10px] text-gray-400 mt-0.5">দৈনিক খামার ব্যবহার</div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" /> নিট খামার লাভ/ক্ষতি
              </div>
              <div className={`text-xl font-extrabold mt-1 ${netProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                ৳ {netProfit.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">আয়: ৳{totalRevenue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* KHAMAR TABS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'LOGS'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>দৈনিক প্রোডাকশন লগ</span>
          </button>

          <button
            onClick={() => setActiveTab('BATCHES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'BATCHES'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>খামারের ব্যাচ সমূহ ({khamarFlocks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('FINANCIALS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'FINANCIALS'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>আর্থিক বিবরণী</span>
          </button>
        </div>

        {/* TAB 1: DAILY LOGS TABLE */}
        {activeTab === 'LOGS' && (
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
                    <th>তাপমাত্রা</th>
                    <th>নোট</th>
                    <th>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {khamarLogs.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-6 text-gray-500">কোন দৈনিক রেকর্ড পাওয়া যায়নি</td></tr>
                  ) : (
                    khamarLogs.map(log => {
                      const flock = flocks.find(f => f.id === log.flockId);
                      return (
                        <tr key={log.id}>
                          <td className="font-bold text-white">{formatDate(log.date)}</td>
                          <td className="font-bold text-amber-400">{flock ? flock.name : log.flockId}</td>
                          <td className="font-extrabold text-emerald-400">🥚 {log.eggGood}</td>
                          <td className="text-rose-400">{log.eggDamaged}</td>
                          <td className="font-bold text-amber-400">🌾 {log.feedBags} বস্তা</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${log.mortality > 3 ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-800 text-gray-300'}`}>
                              ☠ {log.mortality}
                            </span>
                          </td>
                          <td className="text-xs text-gray-300">{log.temperature || 28}°C</td>
                          <td className="text-xs text-gray-400">{log.notes || '-'}</td>
                          <td>
                            <button onClick={() => handleDeleteLog(log.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg">
                              <Trash2 className="w-4 h-4" />
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

        {/* TAB 2: BATCHES LIST */}
        {activeTab === 'BATCHES' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {khamarFlocks.map(f => (
              <div key={f.id} className="glass-card bg-slate-900/90 border-l-4 border-l-amber-500 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">{f.status}</span>
                    <h4 className="font-bold text-white text-base mt-1">{f.name}</h4>
                    <div className="text-xs text-gray-400">{f.breed} • {f.companyName || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-amber-400">{f.ageDays}</span>
                    <div className="text-[10px] text-gray-400 uppercase">দিন বয়স</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-white/5 text-xs">
                  <div>
                    <div className="text-gray-400 text-[10px]">মুরগির সংখ্যা</div>
                    <div className="font-bold text-white">{f.currentQty} / {f.initialQty}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[10px]">শুরুর তারিখ</div>
                    <div className="font-semibold text-amber-400">{formatDate(f.startDate)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: FINANCIALS */}
        {activeTab === 'FINANCIALS' && (
          <div className="glass-card p-6 space-y-6">
            <h4 className="font-bold text-white text-base border-b border-gray-800 pb-3">
              খামারের মোট আয়-ব্যয় সামারী
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 rounded-xl border border-gray-800">
                <div className="text-xs text-gray-400">সর্বমোট মুরগি বিক্রয় (আয়)</div>
                <div className="text-2xl font-extrabold text-teal-400 mt-1">৳ {totalRevenue.toLocaleString()}</div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-gray-800">
                <div className="text-xs text-gray-400">সর্বমোট খামার খরচ (ব্যয়)</div>
                <div className="text-2xl font-extrabold text-rose-400 mt-1">৳ {totalExpenses.toLocaleString()}</div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-gray-800">
                <div className="text-xs text-gray-400">নিট খামার লাভ/ক্ষতি</div>
                <div className={`text-2xl font-extrabold mt-1 ${netProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                  ৳ {netProfit.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW KHAMAR PROFILE */}
      {showAddKhamarModal && (
        <div className="bg-[#121620] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-6 max-w-xl mx-auto">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-xl font-bold text-amber-400">নতুন খামার প্রোফাইল যোগ করুন</h3>
            <button onClick={() => setShowAddKhamarModal(false)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
          </div>

          <form onSubmit={handleCreateKhamar} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">খামারের নাম</label>
              <input
                type="text"
                placeholder="যেমন: ইব্রাহিম খামার পিটালতলা"
                value={khamarName}
                onChange={(e) => setKhamarName(e.target.value)}
                className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">মালিকের নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: ইব্রাহিম হোসেন"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  placeholder="01711-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">খামারের ধরন</label>
                <select
                  value={farmType}
                  onChange={(e) => setFarmType(e.target.value as any)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-amber-300 focus:outline-none text-sm"
                >
                  <option value="সোনালী">সোনালী</option>
                  <option value="ব্রয়লার">ব্রয়লার</option>
                  <option value="লেয়ার">লেয়ার</option>
                  <option value="মিক্সড">মিক্সড</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">ধারণক্ষমতা (মুরগির সংখ্যা)</label>
                <input
                  type="number"
                  placeholder="যেমন: 3000"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">ঠিকানা / লোকেশন</label>
              <input
                type="text"
                placeholder="যেমন: পিটালতলা, গাজীপুর"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg text-sm mt-2"
            >
              + খামার প্রোফাইল সংরক্ষণ করুন
            </button>
          </form>
        </div>
      )}

      {/* MODAL 2: ADD DAILY PRODUCTION LOG */}
      {showAddLogModal && (
        <div className="bg-[#121620] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-6 max-w-xl mx-auto">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-xl font-bold text-amber-400">দৈনিক প্রোডাকশন এন্ট্রি</h3>
            <button onClick={() => setShowAddLogModal(false)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
          </div>

          <form onSubmit={handleAddLog} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">ব্যাচ নির্বাচন করুন</label>
              <select
                value={selectedFlockId}
                onChange={(e) => setSelectedFlockId(e.target.value)}
                className="w-full bg-[#1a1f2c] border border-amber-500/50 rounded-xl px-4 py-2.5 text-amber-300 font-bold text-sm focus:outline-none"
              >
                <option value="">-- ব্যাচ নির্বাচন করুন --</option>
                {flocks.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.breed}) - অবশিষ্ট: {f.currentQty} টি
                  </option>
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
                  value={mortality}
                  onChange={(e) => setMortality(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">নোট / মন্তব্য</label>
              <input
                type="text"
                placeholder="যেমন: আবহাওয়া স্বাভাবিক"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
      )}
    </div>
  );
}
