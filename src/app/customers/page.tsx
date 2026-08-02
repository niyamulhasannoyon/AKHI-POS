'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Customer, Sale, CustomerPayment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users, Plus, DollarSign, Search, Phone, MapPin, Tag,
  FileText, ArrowLeft, CheckCircle2, History, CreditCard, UserCheck, Edit, Trash2
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals & Notifications
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Toast & Delete Modal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteCustId, setDeleteCustId] = useState<Customer | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Form State: Edit Customer
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCategory, setEditCategory] = useState<any>('পাইকারী (Wholesale)');
  const [editDue, setEditDue] = useState<number | ''>('');

  // Form State: Add Customer
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCategory, setCustCategory] = useState<'পাইকারী (Wholesale)' | 'খুচরা (Retailer)' | 'ডিলার (Dealer)' | 'হোটেল/রেস্টুরেন্ট'>('পাইকারী (Wholesale)');
  const [custInitialDue, setCustInitialDue] = useState<number | ''>('');

  // Form State: Receive Payment
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNote, setPayNote] = useState('');

  useEffect(() => {
    const update = () => {
      const state = farmStore.getState();
      setCustomers(state.customers || []);
      setSales(state.sales || []);
      setCustomerPayments(state.customerPayments || []);
    };
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      showToast('অনুগ্রহ করে গ্রাহকের নাম লিখুন', 'error');
      return;
    }

    const dueAmount = custInitialDue ? Number(custInitialDue) : 0;
    const newCustomer: Customer = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      name: custName.trim(),
      phone: custPhone.trim() || 'N/A',
      address: custAddress.trim() || 'N/A',
      category: custCategory,
      due: dueAmount,
      totalPurchases: 0
    };

    farmStore.addItem('customers', newCustomer);

    if (dueAmount > 0) {
      farmStore.addItem('accounting', {
        id: `ACC-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'Income',
        category: 'Opening Customer Due',
        amount: dueAmount,
        note: `Opening due for customer ${custName}`
      });
    }

    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustInitialDue('');
    setShowAddModal(false);
    showToast(`নতুন গ্রাহক "${newCustomer.name}" সফলভাবে যুক্ত করা হয়েছে!`);
  };

  const openEditCustomerModal = (c: Customer) => {
    setActiveCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditAddress(c.address || '');
    setEditCategory(c.category || 'পাইকারী (Wholesale)');
    setEditDue(c.due);
    setShowEditModal(true);
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    if (!editName.trim()) {
      showToast('অনুগ্রহ করে কাস্টমারের নাম দিন', 'error');
      return;
    }

    farmStore.updateItem('customers', activeCustomer.id, {
      name: editName.trim(),
      phone: editPhone.trim() || 'N/A',
      address: editAddress.trim() || 'N/A',
      category: editCategory,
      due: editDue !== '' ? Number(editDue) : activeCustomer.due,
    });

    setShowEditModal(false);
    showToast('কাস্টমারের তথ্য সফলভাবে আপডেট করা হয়েছে!');
  };

  const confirmDeleteCustomer = () => {
    if (deleteCustId) {
      farmStore.deleteItem('customers', deleteCustId.id);
      showToast(`কাস্টমার "${deleteCustId.name}" কে মুছে ফেলা হয়েছে!`);
      setDeleteCustId(null);
    }
  };

  const handleReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    if (!payAmount || Number(payAmount) <= 0) {
      showToast('অনুগ্রহ করে টাকার পরিমাণ লিখুন', 'error');
      return;
    }

    const amt = Number(payAmount);
    const newDue = Math.max(0, activeCustomer.due - amt);

    // Update customer due
    farmStore.updateItem('customers', activeCustomer.id, { due: newDue });

    // Add payment log
    const paymentRecord: CustomerPayment = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      customerId: activeCustomer.id,
      date: payDate,
      amount: amt,
      paymentMethod: payMethod,
      note: payNote || `Due payment received from ${activeCustomer.name}`
    };
    farmStore.addItem('customerPayments', paymentRecord);

    // Add accounting income entry
    farmStore.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-4)}`,
      date: payDate,
      type: 'Income',
      category: 'Customer Due Collection',
      amount: amt,
      note: `Due received from ${activeCustomer.name} (${payMethod})`
    });

    // Refresh active customer state
    setActiveCustomer({ ...activeCustomer, due: newDue });
    setPayAmount('');
    setPayNote('');
    setShowPaymentModal(false);
    showToast(`সাফল্যের সাথে ৳${amt.toLocaleString()} টাকার বাকি আদায় সম্পন্ন হয়েছে!`);
  };

  // Filtered Customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.phone.includes(searchQuery) ||
                          (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Aggregates
  const totalCustomers = customers.length;
  const totalPurchasesSum = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);
  const totalDuesSum = customers.reduce((sum, c) => sum + (c.due || 0), 0);

  // Customer Profile helper data
  const getCustomerHistory = (custId: string) => {
    const custSales = sales.filter(s => s.customerId === custId);
    const custPays = customerPayments.filter(p => p.customerId === custId);
    return { custSales, custPays };
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121620] p-5 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>গ্রাহক ও কাস্টমার প্রোফাইল ডিরেক্টরি</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">পাইকারী ও খুচরা খামারি/ক্রেতাদের প্রোফাইল, বেচা-কেনা এবং বকেয়া বাকি খাতা।</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন গ্রাহক যোগ করুন</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card bg-slate-900/80 border-l-4 border-l-emerald-500">
          <div className="text-xs text-gray-400 font-medium">মোট নথিভুক্ত গ্রাহক</div>
          <div className="text-2xl font-extrabold text-white mt-1">{totalCustomers} জন</div>
          <div className="text-[10px] text-emerald-400 mt-1">সক্রিয় ডিরেক্টরি প্রোফাইল</div>
        </div>
        <div className="glass-card bg-slate-900/80 border-l-4 border-l-teal-500">
          <div className="text-xs text-gray-400 font-medium">সর্বমোট বিক্রিয় হিসেব</div>
          <div className="text-2xl font-extrabold text-teal-400 mt-1">{formatCurrency(totalPurchasesSum)}</div>
          <div className="text-[10px] text-gray-400 mt-1">লাইফটাইম খামার বিক্রি</div>
        </div>
        <div className="glass-card bg-slate-900/80 border-l-4 border-l-rose-500">
          <div className="text-xs text-gray-400 font-medium">মোট অবশিষ্ট পাওনা বকেয়া</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{formatCurrency(totalDuesSum)}</div>
          <div className="text-[10px] text-rose-400 mt-1">গ্রাহকদের নিকট বাকি</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121620] p-4 rounded-xl border border-gray-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl pl-9 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-400 flex-shrink-0">ক্যাটাগরি:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-3 py-2 text-emerald-300 text-xs focus:outline-none"
          >
            <option value="All">সকল ক্যাটাগরি</option>
            <option value="পাইকারী (Wholesale)">পাইকারী (Wholesale)</option>
            <option value="খুচরা (Retailer)">খুচরা (Retailer)</option>
            <option value="ডিলার (Dealer)">ডিলার (Dealer)</option>
            <option value="হোটেল/রেস্টুরেন্ট">হোটেল/রেস্টুরেন্ট</option>
          </select>
        </div>
      </div>

      {/* Customers Table List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>আইডি</th>
                <th>গ্রাহকের নাম ও ধরন</th>
                <th>ফোন নম্বর</th>
                <th>ঠিকানা</th>
                <th>মোট ক্রয়</th>
                <th>বর্তমান বকেয়া (বাকি)</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500 text-sm">
                    কোন গ্রাহক পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td className="font-bold text-gray-400">{c.id}</td>
                    <td>
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[10px] text-emerald-400">{c.category || 'সাধারণ গ্রাহক'}</div>
                    </td>
                    <td className="text-xs text-gray-300 font-medium">{c.phone}</td>
                    <td className="text-xs text-gray-400">{c.address || '-'}</td>
                    <td className="font-bold text-teal-400">{formatCurrency(c.totalPurchases || 0)}</td>
                    <td>
                      <span className={`font-extrabold px-2.5 py-1 rounded-full text-xs ${c.due > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {formatCurrency(c.due)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveCustomer(c);
                            setShowProfileModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-500/30 transition"
                          title="প্রোফাইল"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>প্রোফাইল</span>
                        </button>

                        <button
                          onClick={() => openEditCustomerModal(c)}
                          className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-blue-500/30 transition"
                          title="এডিট"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-400" />
                          <span>এডিট</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveCustomer(c);
                            setPayAmount(c.due > 0 ? c.due : '');
                            setShowPaymentModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-amber-500/30 transition"
                          title="বাকি আদায়"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                          <span>আদায়</span>
                        </button>

                        <button
                          onClick={() => setDeleteCustId(c)}
                          className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. ADD NEW CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121620] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-emerald-400">নতুন কাস্টমার যোগ করুন</h3>
                  <p className="text-xs text-gray-400">পাইকারী, খুচরা বা ডিলারের বিস্তারিত নাম ও বিবরণ প্রদান করুন</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">গ্রাহক / প্রতিষ্ঠানের নাম <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  placeholder="যেমন: রাহিম পোল্ট্রি ট্রেডার্স"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">মোবাইল ফোন নম্বর</label>
                  <input
                    type="text"
                    placeholder="01700-000000"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">ক্যাটাগরি</label>
                  <select
                    value={custCategory}
                    onChange={(e) => setCustCategory(e.target.value as any)}
                    className="w-full bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3 text-emerald-300 focus:outline-none focus:border-emerald-400 text-sm font-medium transition"
                  >
                    <option value="পাইকারী (Wholesale)">পাইকারী (Wholesale)</option>
                    <option value="খুচরা (Retailer)">খুচরা (Retailer)</option>
                    <option value="ডিলার (Dealer)">ডিলার (Dealer)</option>
                    <option value="হোটেল/রেস্টুরেন্ট">হোটেল/রেস্টুরেন্ট</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">ঠিকানা / এলাকা</label>
                <input
                  type="text"
                  placeholder="যেমন: গাজীপুর সদর মার্কেট"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">পূর্বের প্রারম্ভিক বকেয়া (যদি থাকে ৳)</label>
                <input
                  type="number"
                  placeholder="৳ 0"
                  value={custInitialDue}
                  onChange={(e) => setCustInitialDue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-rose-400 font-bold placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-5 rounded-full flex items-center justify-center gap-2 shadow-lg text-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ গ্রাহক সংরক্ষণ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3.5 border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium rounded-xl text-sm transition"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121620] border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-blue-400">গ্রাহকের তথ্য এডিট করুন</h3>
                  <p className="text-xs text-gray-400">ID: {activeCustomer.id}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">গ্রাহকের নাম</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">মোবাইল ফোন</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">ক্যাটাগরি</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full bg-[#1a1f2c] border border-emerald-500/50 rounded-xl px-4 py-3 text-emerald-300 focus:outline-none text-sm font-medium transition"
                  >
                    <option value="পাইকারী (Wholesale)">পাইকারী (Wholesale)</option>
                    <option value="খুচরা (Retailer)">খুচরা (Retailer)</option>
                    <option value="ডিলার (Dealer)">ডিলার (Dealer)</option>
                    <option value="হোটেল/রেস্টুরেন্ট">হোটেল/রেস্টুরেন্ট</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">বর্তমান বকেয়া (৳)</label>
                <input
                  type="number"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-rose-400 font-bold focus:outline-none focus:border-blue-500 text-sm transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 px-5 rounded-full flex items-center justify-center gap-2 shadow-lg text-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ আপডেট সংরক্ষণ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-3.5 border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium rounded-xl text-sm transition"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RECEIVE PAYMENT MODAL */}
      {showPaymentModal && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121620] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-amber-400">বাকি টাকা আদায় (Due Collection)</h3>
                  <p className="text-xs text-gray-400">কাস্টমারের থেকে দেনা বুঝে পাওয়ার এন্ট্রি দিন</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 text-sm">
              <div className="text-gray-300 text-xs font-medium">গ্রাহকের নাম: <b className="text-white text-sm">{activeCustomer.name}</b></div>
              <div className="text-rose-400 font-extrabold text-base mt-1">বর্তমান মোট বকেয়া: ৳ {activeCustomer.due.toLocaleString()}</div>
            </div>

            <form onSubmit={handleReceivePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">আদায়কৃত টাকার পরিমাণ (৳) <span className="text-rose-400">*</span></label>
                <input
                  type="number"
                  placeholder="যেমন: 5000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#1a1f2c] border border-amber-500/50 rounded-xl px-4 py-3 text-amber-300 font-extrabold text-xl focus:outline-none focus:border-amber-400 transition"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="Cash">ক্যাশ (নগদ)</option>
                    <option value="Bkash">বিকাশ (bKash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                    <option value="Bank">ব্যাংক ট্রান্সফার</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-amber-400 text-sm font-medium focus:outline-none transition cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">নোট / বিবরণ (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: রসিদ নং #104"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 px-5 rounded-full flex items-center justify-center gap-2 shadow-lg text-sm transition"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>✓ টাকা জমা নিশ্চিত করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-3.5 border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium rounded-xl text-sm transition"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DELETE CUSTOMER CONFIRMATION MODAL */}
      {deleteCustId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121620] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-md w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold text-rose-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <span>কাস্টমার মুছে ফেলবেন?</span>
              </h3>
              <button onClick={() => setDeleteCustId(null)} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-sm">✕</button>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              আপনি কি নিশ্চিতভাবে <b className="text-white">{deleteCustId.name}</b> কে মুছে ফেলতে চান? এই কাজটি আর ফেরানো যাবে না।
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={confirmDeleteCustomer}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-full shadow-lg text-sm transition"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
              <button
                type="button"
                onClick={() => setDeleteCustId(null)}
                className="px-5 py-3.5 border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium rounded-xl text-sm transition"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CUSTOMER SEPARATE DETAILED PROFILE MODAL */}
      {showProfileModal && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121620] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowProfileModal(false)} className="p-2 bg-gray-800/60 hover:bg-gray-800 text-gray-300 rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{activeCustomer.name}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {activeCustomer.category || 'কাস্টমার প্রোফাইল'}
                  </span>
                </h3>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-400" /> {activeCustomer.phone}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> {activeCustomer.address || 'ঠিকানা দেওয়া হয়নি'}</span>
                </div>
              </div>
            </div>

            <button onClick={() => setShowProfileModal(false)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400">মোট ক্রয় (Total Purchased)</div>
              <div className="text-xl font-extrabold text-teal-400 mt-1">
                ৳ {(activeCustomer.totalPurchases || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400">মোট পরিশোধিত টাকা (Total Paid)</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                ৳ {Math.max(0, (activeCustomer.totalPurchases || 0) - activeCustomer.due).toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400">বর্তমান পাওনা বকেয়া (Current Due)</div>
              <div className={`text-xl font-extrabold mt-1 ${activeCustomer.due > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ৳ {activeCustomer.due.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Customer History & Ledger Tables */}
          {(() => {
            const { custSales, custPays } = getCustomerHistory(activeCustomer.id);
            return (
              <div className="space-y-6">
                {/* Sales Invoices */}
                <div>
                  <h4 className="font-bold text-teal-400 text-sm mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>ক্রয় ইনভয়েস ও মেমো সমূহ</span>
                  </h4>
                  <div className="overflow-x-auto border border-gray-800 rounded-xl">
                    <table className="w-full text-xs text-left text-gray-300">
                      <thead className="bg-slate-900 text-gray-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">ইনভয়েস আইডি</th>
                          <th className="p-3">তারিখ</th>
                          <th className="p-3">পণ্য বিবরণী</th>
                          <th className="p-3">মোট টাকা</th>
                          <th className="p-3">পরিশোধিত</th>
                          <th className="p-3">অবশিষ্ট বাকি</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {custSales.length === 0 ? (
                          <tr><td colSpan={6} className="p-4 text-center text-gray-500">কোন বিক্রয় ইনভয়েস নেই</td></tr>
                        ) : (
                          custSales.map(s => (
                            <tr key={s.id}>
                              <td className="p-3 font-bold text-emerald-400">{s.id}</td>
                              <td className="p-3">{formatDate(s.date)}</td>
                              <td className="p-3 text-gray-300">
                                {s.items.map(i => `${i.name} (${i.qty} ${i.unit})`).join(', ')}
                              </td>
                              <td className="p-3 font-bold text-white">৳ {s.grandTotal.toLocaleString()}</td>
                              <td className="p-3 font-semibold text-emerald-400">৳ {s.paidAmount.toLocaleString()}</td>
                              <td className={`p-3 font-bold ${s.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                ৳ {s.dueAmount.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Due Payment History */}
                <div>
                  <h4 className="font-bold text-amber-400 text-sm mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span>বাকি আদায়ের প্রাপ্তি স্বীকার রেজিস্টার</span>
                  </h4>
                  <div className="overflow-x-auto border border-gray-800 rounded-xl">
                    <table className="w-full text-xs text-left text-gray-300">
                      <thead className="bg-slate-900 text-gray-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">পেমেন্ট আইডি</th>
                          <th className="p-3">তারিখ</th>
                          <th className="p-3">পেমেন্ট মাধ্যম</th>
                          <th className="p-3">বিবরণ / নোট</th>
                          <th className="p-3">আদায়কৃত পরিমাণ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {custPays.length === 0 ? (
                          <tr><td colSpan={5} className="p-4 text-center text-gray-500">কোন জমা পেমেন্ট রেকর্ড নেই</td></tr>
                        ) : (
                          custPays.map(p => (
                            <tr key={p.id}>
                              <td className="p-3 font-bold text-amber-400">{p.id}</td>
                              <td className="p-3">{formatDate(p.date)}</td>
                              <td className="p-3 font-semibold text-white">{p.paymentMethod}</td>
                              <td className="p-3 text-gray-400">{p.note || '-'}</td>
                              <td className="p-3 font-extrabold text-amber-400">৳ {p.amount.toLocaleString()}</td>
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
      </div>
    )}
    </div>
  );
}
