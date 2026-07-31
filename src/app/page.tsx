'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { farmStore, EMPTY_STATE } from '@/lib/store';
import { FarmState, PosAuthorizedEmail } from '@/lib/types';
import { formatCurrency, calculateFlockAgeDays } from '@/lib/utils';
import { 
  DollarSign, 
  TrendingUp, 
  Bird, 
  Egg, 
  ShoppingBag, 
  PlusCircle, 
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2,
  Key
} from 'lucide-react';

export default function DashboardPage() {
  const [state, setState] = useState<FarmState>(EMPTY_STATE);

  // POS Access Control Form State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Manager' | 'Cashier' | 'Sales Operator'>('Cashier');
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);

  useEffect(() => {
    setState(farmStore.getState());
    const unsub = farmStore.subscribe((s) => setState({ ...s }));
    return () => unsub();
  }, []);

  const sales = state.sales || [];
  const acc = state.accounting || [];
  const flocks = state.flocks || [];
  const khamari = state.khamariLogs || [];
  const posEmails: PosAuthorizedEmail[] = state.posAuthorizedEmails || [];

  const totalRevenue = sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalIncome = acc.filter(a => a.type === 'Income').reduce((sum, a) => sum + a.amount, 0);
  const totalExpense = acc.filter(a => a.type === 'Expense').reduce((sum, a) => sum + a.amount, 0);
  const netProfit = (totalRevenue + totalIncome) - totalExpense;

  const activeBirds = flocks.filter(f => f.status === 'Active').reduce((sum, f) => sum + f.currentQty, 0);
  const todayEggs = khamari[0]?.eggGood || 0;

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteEmailId, setDeleteEmailId] = useState<{ id: string; email: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddPosEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      showToast('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন', 'error');
      return;
    }

    const newItem: PosAuthorizedEmail = {
      id: `POS-ACC-${Date.now().toString().slice(-4)}`,
      email: newEmail.trim().toLowerCase(),
      name: newName.trim() || 'স্টাফ অপরেটর',
      role: newRole,
      status: 'Active',
      addedDate: new Date().toISOString().slice(0, 10)
    };

    farmStore.addItem('posAuthorizedEmails', newItem);
    setNewEmail('');
    setNewName('');
    setShowAddEmailModal(false);
    showToast(`ইমেইল ${newItem.email} সফলভাবে অনুমোদিত তালিকায় যুক্ত করা হয়েছে!`);
  };

  const handleToggleEmailStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    farmStore.updateItem('posAuthorizedEmails', id, { status: nextStatus });
    showToast(`ইমেইল স্ট্যাটাস ${nextStatus === 'Active' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'} করা হয়েছে!`);
  };

  const confirmDeleteEmail = () => {
    if (deleteEmailId) {
      farmStore.deleteItem('posAuthorizedEmails', deleteEmailId.id);
      showToast(`ইমেইল ${deleteEmailId.email} বাতিল করা হয়েছে।`);
      setDeleteEmailId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
          <Link href="/khamar" className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            <span>Log Daily Khamari Entry</span>
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
                  <div className="text-xs text-gray-400">{f.breed} ({f.houseNo}) • Age {calculateFlockAgeDays(f.startDate)} Days</div>
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

      {/* POS ACCESS CONTROL & EMAIL PERMISSIONS MANAGEMENT SECTION */}
      <div className="glass-card border border-emerald-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>POS সার্ভিস ও ইউজার এক্সেস পারমিশন কন্ট্রোল (POS Authorized Emails)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              যেসব ইমেইল অ্যাড্রেস POS রেজিস্টার অ্যাক্সেস করতে পারবে তা সেট করুন।
            </p>
          </div>

          <button
            onClick={() => setShowAddEmailModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 self-start sm:self-auto transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ নতুন ইমেইল পারমিশন দিন</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>অপারেটর / নাম</th>
                <th>অনুমোদিত ইমেইল (Authorized Email)</th>
                <th>পারমিশন রোল</th>
                <th>এক্সেস স্ট্যাটাস</th>
                <th>যুক্ত হওয়ার তারিখ</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {posEmails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    কোন ইমেইল পারমিশন যুক্ত করা হয়নি।
                  </td>
                </tr>
              ) : (
                posEmails.map((item) => (
                  <tr key={item.id}>
                    <td className="font-bold text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>{item.name}</span>
                    </td>
                    <td className="font-mono text-emerald-300 font-semibold">{item.email}</td>
                    <td>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {item.role}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleEmailStatus(item.id, item.status)}
                        className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition ${
                          item.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {item.status === 'Active' ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Active (অনুমোদিত)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Inactive (বন্ধ)</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="text-xs text-gray-400">{item.addedDate}</td>
                    <td>
                      <button
                        onClick={() => setDeleteEmailId({ id: item.id, email: item.email })}
                        className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        title="অ্যাক্সেস বাতিল করুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD AUTHORIZED EMAIL MODAL */}
      {showAddEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#121620] border border-emerald-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 max-w-lg w-full my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                <span>নতুন POS ইমেইল পারমিশন যোগ করুন</span>
              </h3>
              <button onClick={() => setShowAddEmailModal(false)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
            </div>

            <form onSubmit={handleAddPosEmail} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">অপারেটর / ক্যাশিয়ারের নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: নিয়ামুল হাসান (ক্যাশ কাউন্টার 1)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">অনুমোদিত ইমেইল এড্রেস (Authorized Email)</label>
                <div className="flex items-center gap-2 bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5">
                  <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="cashier@akhipos.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-transparent text-white focus:outline-none text-sm placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">অ্যাক্সেস রোল (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-emerald-300 focus:outline-none text-sm font-medium"
                >
                  <option value="Admin">Admin (ফুল পারমিশন)</option>
                  <option value="Manager">Manager (ম্যানেজার)</option>
                  <option value="Cashier">Cashier (ক্যাশ কাউন্টার)</option>
                  <option value="Sales Operator">Sales Operator (বিক্রয় সহকারী)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg text-sm"
                >
                  ✓ ইমেইল অনুমতি সংরক্ষণ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEmailModal(false)}
                  className="px-4 py-3 border border-gray-700 hover:bg-gray-800 text-gray-300 rounded-xl text-sm"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE EMAIL CONFIRMATION MODAL */}
      {deleteEmailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-[#101522] border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 my-auto text-center relative">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">অ্যাক্সেস পারমিশন বাতিল নিশ্চিতকরণ</h3>
              <p className="text-xs text-gray-300 mt-1">
                আপনি কি নিশ্চিত যে <span className="font-bold text-white">"{deleteEmailId.email}"</span> ইমেইলটির POS সিস্টেমে প্রবেশাধিকার বাতিল করতে চান?
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteEmailId(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl font-bold text-xs transition"
              >
                বাতিল
              </button>
              <button
                onClick={confirmDeleteEmail}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-lg transition"
              >
                হ্যাঁ, অ্যাক্সেস বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-bold border transition-all ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
