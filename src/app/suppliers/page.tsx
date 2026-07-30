'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Supplier } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Building2, Plus, DollarSign, Edit, Trash2, Phone, MapPin } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);

  // Form State: Add Supplier
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | ''>('');

  // Form State: Edit Supplier
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBalance, setEditBalance] = useState<number | ''>('');

  // Form State: Supplier Payment
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payNote, setPayNote] = useState('');

  useEffect(() => {
    const update = () => setSuppliers(farmStore.getState().suppliers || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('অনুগ্রহ করে সাপ্লায়ার কোম্পানীর নাম লিখুন');

    const newSup: Supplier = {
      id: `SUP-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      phone: phone.trim() || 'N/A',
      address: address.trim() || 'N/A',
      balance: initialBalance ? Number(initialBalance) : 0
    };

    farmStore.addItem('suppliers', newSup);

    if (newSup.balance > 0) {
      farmStore.addItem('accounting', {
        id: `ACC-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'Expense',
        category: 'Opening Supplier Payable',
        amount: newSup.balance,
        note: `Opening balance payable to ${name}`
      });
    }

    setName('');
    setPhone('');
    setAddress('');
    setInitialBalance('');
    setShowAddModal(false);
    alert('নতুন সাপ্লায়ার অ্যাকাউন্ট যুক্ত করা হয়েছে!');
  };

  const openEditModal = (s: Supplier) => {
    setActiveSupplier(s);
    setEditName(s.name);
    setEditPhone(s.phone);
    setEditAddress(s.address || '');
    setEditBalance(s.balance);
    setShowEditModal(true);
  };

  const handleUpdateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupplier) return;
    if (!editName.trim()) return alert('অনুগ্রহ করে সাপ্লায়ারের নাম দিন');

    farmStore.updateItem('suppliers', activeSupplier.id, {
      name: editName.trim(),
      phone: editPhone.trim() || 'N/A',
      address: editAddress.trim() || 'N/A',
      balance: editBalance !== '' ? Number(editBalance) : activeSupplier.balance
    });

    setShowEditModal(false);
    alert('সাপ্লায়ারের তথ্য আপডেট করা হয়েছে!');
  };

  const handlePaySupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupplier) return;
    if (!payAmount || Number(payAmount) <= 0) return alert('অনুগ্রহ করে টাকার পরিমাণ দিন');

    const amt = Number(payAmount);
    const newBal = Math.max(0, activeSupplier.balance - amt);

    farmStore.updateItem('suppliers', activeSupplier.id, { balance: newBal });

    farmStore.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Expense',
      category: 'Supplier Payment',
      amount: amt,
      note: payNote || `Paid to supplier ${activeSupplier.name}`
    });

    setShowPayModal(false);
    setPayAmount('');
    setPayNote('');
    alert(`সাপ্লায়ার ${activeSupplier.name}-কে ৳${amt.toLocaleString()} টাকা পরিশোধের রেকর্ড যোগ করা হয়েছে!`);
  };

  const handleDelete = (id: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই সাপ্লায়ারকে মুছে ফেলতে চান?')) {
      farmStore.deleteItem('suppliers', id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121620] p-5 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span>সাপ্লায়ার ডিরেক্টরি ও দেনা-পাওনা হিসাব</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">ফিড মিল, হ্যচারি ও ওষধ সরবরাহকারী প্রতিষ্ঠানের হিসাব খাতা।</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন সাপ্লায়ার যোগ করুন</span>
        </button>
      </div>

      {/* Supplier List Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>আইডি</th>
                <th>সাপ্লায়ার / কোম্পানীর নাম</th>
                <th>ফোন নম্বর</th>
                <th>ঠিকানা</th>
                <th>বকেয়া দেনা (Payable)</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td className="font-bold text-gray-400">{s.id}</td>
                  <td className="font-bold text-white text-sm">{s.name}</td>
                  <td className="text-xs text-gray-300">{s.phone}</td>
                  <td className="text-xs text-gray-400">{s.address || '-'}</td>
                  <td>
                    <span className={`font-extrabold px-2.5 py-1 rounded-full text-xs ${s.balance > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {formatCurrency(s.balance)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition"
                        title="এডিট করুন"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>

                      <button
                        onClick={() => {
                          setActiveSupplier(s);
                          setPayAmount(s.balance > 0 ? s.balance : '');
                          setShowPayModal(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-500/30 transition"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>বিল পরিশোধ</span>
                      </button>

                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121620] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-xl w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold text-emerald-400">নতুন সাপ্লায়ার যোগ করুন</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">কোম্পানী / সাপ্লায়ারের নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: নাহার ফিড মিলস লিঃ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">মোবাইল ফোন</label>
                <input
                  type="text"
                  placeholder="01800-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  placeholder="যেমন: চট্টগ্রাম রোড, ঢাকা"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">প্রারম্ভিক বকেয়া দেনা (যদি থাকে)</label>
                <input
                  type="number"
                  placeholder="৳ 0"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg text-sm"
              >
                + সাপ্লায়ার সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUPPLIER MODAL */}
      {showEditModal && activeSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121620] border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-xl w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold text-blue-400">সাপ্লায়ারের তথ্য এডিট / আপডেট করুন</h3>
              <button onClick={() => setShowEditModal(false)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">কোম্পানী / সাপ্লায়ারের নাম</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">মোবাইল ফোন</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">বর্তমান বকেয়া দেনা (৳)</label>
                <input
                  type="number"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-rose-400 font-bold focus:outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg text-sm"
                >
                  ✓ আপডেট নিশ্চিত করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-3 border border-gray-700 hover:bg-gray-800 text-gray-300 rounded-xl text-sm"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAY SUPPLIER MODAL */}
      {showPayModal && activeSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121620] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-lg w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold text-emerald-400">সাপ্লায়ারকে বিল পরিশোধ করুন</h3>
              <button onClick={() => setShowPayModal(false)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-gray-800 text-sm">
              <div className="text-gray-400 text-xs">সাপ্লায়ার: <b className="text-white">{activeSupplier.name}</b></div>
              <div className="text-rose-400 font-bold mt-1">বর্তমান পাওনা বাকি: ৳ {activeSupplier.balance.toLocaleString()}</div>
            </div>

            <form onSubmit={handlePaySupplier} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">পরিশোধিত টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3 text-emerald-400 font-extrabold text-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">নোট / মেমো বিবরণ (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: ক্যাশ ভাউচার #402"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg text-sm"
              >
                ✓ বিল পরিশোধ সম্পন্ন করুন
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
