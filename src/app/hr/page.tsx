'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Employee } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { 
  UserCheck, 
  Plus, 
  DollarSign, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Phone,
  Calendar,
  Wallet,
  Building,
  UserPlus,
  ArrowUpRight
} from 'lucide-react';

function generateId(prefix: string, sliceLength: number): string {
  return `${prefix}-${Date.now().toString().slice(-sliceLength)}`;
}

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Employee Form State
  const [empForm, setEmpForm] = useState<{
    id?: string;
    name: string;
    phone: string;
    role: string;
    salary: number;
    advance: number;
    joiningDate: string;
    status: 'Active' | 'On Leave' | 'Terminated';
    notes: string;
  }>({
    name: '',
    phone: '',
    role: 'Shed Caretaker',
    salary: 15000,
    advance: 0,
    joiningDate: new Date().toISOString().slice(0, 10),
    status: 'Active',
    notes: ''
  });

  // Salary Form State
  const [salaryForm, setSalaryForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    month: new Date().toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' }),
    bonus: 0,
    deductAdvance: 0,
    paymentMethod: 'Cash',
    note: ''
  });

  // Advance Form State
  const [advanceAmount, setAdvanceAmount] = useState<number>(1000);
  const [advanceNote, setAdvanceNote] = useState<string>('জরুরি প্রয়োজন');

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const update = () => setEmployees(farmStore.getState().employees || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.phone && emp.phone.includes(searchQuery));
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculations
  const activeStaffCount = employees.filter(e => e.status === 'Active').length;
  const totalMonthlyPayroll = employees.filter(e => e.status === 'Active').reduce((sum, e) => sum + e.salary, 0);
  const totalAdvanceOutstanding = employees.reduce((sum, e) => sum + (e.advance || 0), 0);

  // Open modal to create new employee
  const handleOpenCreateModal = () => {
    setSelectedEmp(null);
    setEmpForm({
      name: '',
      phone: '',
      role: 'Shed Caretaker',
      salary: 16000,
      advance: 0,
      joiningDate: new Date().toISOString().slice(0, 10),
      status: 'Active',
      notes: ''
    });
    setIsEmployeeModalOpen(true);
  };

  // Open modal to edit existing employee
  const handleOpenEditModal = (emp: Employee) => {
    setSelectedEmp(emp);
    setEmpForm({
      id: emp.id,
      name: emp.name,
      phone: emp.phone || '',
      role: emp.role,
      salary: emp.salary,
      advance: emp.advance || 0,
      joiningDate: emp.joiningDate || new Date().toISOString().slice(0, 10),
      status: emp.status,
      notes: emp.notes || ''
    });
    setIsEmployeeModalOpen(true);
  };

  // Save employee (create or update)
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name.trim()) {
      showToast('অনুগ্রহ করে কর্মচারীর নাম লিখুন', 'error');
      return;
    }

    if (empForm.id) {
      // Update
      farmStore.updateItem('employees', empForm.id, {
        name: empForm.name.trim(),
        phone: empForm.phone.trim(),
        role: empForm.role,
        salary: Number(empForm.salary) || 0,
        advance: Number(empForm.advance) || 0,
        joiningDate: empForm.joiningDate,
        status: empForm.status,
        notes: empForm.notes.trim()
      });
      showToast(`কর্মচারী "${empForm.name}" এর তথ্য আপডেট করা হয়েছে!`);
    } else {
      // Create
      const newEmp: Employee = {
        id: generateId('EMP', 4),
        name: empForm.name.trim(),
        phone: empForm.phone.trim(),
        role: empForm.role,
        salary: Number(empForm.salary) || 0,
        advance: Number(empForm.advance) || 0,
        joiningDate: empForm.joiningDate,
        status: empForm.status,
        notes: empForm.notes.trim()
      };
      farmStore.addItem('employees', newEmp);
      showToast(`নতুন কর্মচারী "${newEmp.name}" যুক্ত করা হয়েছে!`);
    }

    setIsEmployeeModalOpen(false);
  };

  // Open Pay Salary Modal
  const handleOpenSalaryModal = (emp: Employee) => {
    setSelectedEmp(emp);
    setSalaryForm({
      date: new Date().toISOString().slice(0, 10),
      month: new Date().toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' }),
      bonus: 0,
      deductAdvance: emp.advance || 0,
      paymentMethod: 'Cash',
      note: `${emp.name} এর বেতন পরিশোধ (${emp.role})`
    });
    setIsSalaryModalOpen(true);
  };

  // Execute Salary Disbursement
  const handleDisburseSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    const baseSalary = selectedEmp.salary;
    const bonus = Number(salaryForm.bonus) || 0;
    const deductAdvance = Math.min(selectedEmp.advance || 0, Number(salaryForm.deductAdvance) || 0);
    const netPayable = Math.max(0, (baseSalary + bonus) - deductAdvance);

    // 1. Update employee advance balance
    const remainingAdvance = Math.max(0, (selectedEmp.advance || 0) - deductAdvance);
    farmStore.updateItem('employees', selectedEmp.id, { advance: remainingAdvance });

    // 2. Add accounting expense entry
    farmStore.addItem('accounting', {
      id: generateId('ACC', 5),
      date: salaryForm.date,
      type: 'Expense',
      category: 'Employee Salary',
      amount: netPayable,
      note: `${selectedEmp.name} (${selectedEmp.role}) - বেতন পরিশোধ ${salaryForm.note ? `[${salaryForm.note}]` : ''}`
    });

    setIsSalaryModalOpen(false);
    showToast(`কর্মচারী "${selectedEmp.name}" কে ${formatCurrency(netPayable)} সফলভাবে পরিশোধ করা হয়েছে!`);
  };

  // Open Advance Salary Modal
  const handleOpenAdvanceModal = (emp: Employee) => {
    setSelectedEmp(emp);
    setAdvanceAmount(2000);
    setAdvanceNote('জরুরি প্রয়োজন');
    setIsAdvanceModalOpen(true);
  };

  // Execute Advance Disburse
  const handleGiveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    const currentAdvance = selectedEmp.advance || 0;
    const newTotalAdvance = currentAdvance + (Number(advanceAmount) || 0);

    farmStore.updateItem('employees', selectedEmp.id, { advance: newTotalAdvance });

    // Record accounting expense for advance
    farmStore.addItem('accounting', {
      id: generateId('ACC', 5),
      date: new Date().toISOString().slice(0, 10),
      type: 'Expense',
      category: 'Employee Salary Advance',
      amount: Number(advanceAmount) || 0,
      note: `${selectedEmp.name} (${selectedEmp.role}) - বেতন অগ্রিম/অ্যাডভান্স [${advanceNote}]`
    });

    setIsAdvanceModalOpen(false);
    showToast(`কর্মচারী "${selectedEmp.name}" কে ${formatCurrency(advanceAmount)} অগ্রিম প্রদান করা হয়েছে!`);
  };

  // Confirm and delete employee
  const handleConfirmDelete = () => {
    if (!selectedEmp) return;
    farmStore.deleteItem('employees', selectedEmp.id);
    setIsDeleteModalOpen(false);
    showToast(`কর্মচারী "${selectedEmp.name}" কে রিমুভ করা হয়েছে।`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-bold border transition-all ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-emerald-400" />
            <span>এইচ আর এবং বেতন ব্যবস্থাপনা (HR & Payroll)</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            ফার্মের কর্মচারী প্রোফাইল, মাসিক বেতন স্কেল, অগ্রিম কর্তন ও পে-রোল শীট পরিচালনা করুন।
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ নতুন কর্মচারী যোগ করুন</span>
        </button>
      </div>

      {/* Executive Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card p-4 sm:p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">সক্রিয় কর্মচারী (Active Staff)</p>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {activeStaffCount} <span className="text-xs font-normal text-gray-400">জন</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">মাসিক মোট বেতন স্কেল (Payroll Base)</p>
            <h3 className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">
              {formatCurrency(totalMonthlyPayroll)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">অগ্রিম প্রদান (Advance Outstanding)</p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {formatCurrency(totalAdvanceOutstanding)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="কর্মচারীর নাম, পদবী বা ফোন দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#090d16] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end overflow-x-auto">
          {['ALL', 'Active', 'On Leave', 'Terminated'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {st === 'ALL' ? 'সকল কর্মচারী' : st === 'Active' ? 'কর্মরত (Active)' : st === 'On Leave' ? 'ছুটিতে (On Leave)' : 'অব্যাহতি (Terminated)'}
            </button>
          ))}
        </div>
      </div>

      {/* Employee List Table */}
      <div className="glass-card overflow-hidden">
        <div className="responsive-table-container">
          <table className="custom-table w-full">
            <thead>
              <tr>
                <th>আইডি</th>
                <th>কর্মচারীর নাম ও বিবরণ</th>
                <th>পদবী / রোল</th>
                <th>যোগদানের তারিখ</th>
                <th>মাসিক স্কেল বেতন</th>
                <th>অগ্রিম জমার ব্যালেন্স</th>
                <th>স্ট্যাটাস</th>
                <th className="text-right">একশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400 text-sm">
                    কোন কর্মচারী পাওয়া যায়নি। নতুন কর্মচারী যুক্ত করতে "+ নতুন কর্মচারী যোগ করুন" বাটনে ক্লিক করুন।
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/5 transition">
                    <td className="font-mono text-xs font-bold text-gray-400">{emp.id}</td>
                    <td>
                      <div>
                        <div className="font-bold text-white text-sm">{emp.name}</div>
                        {emp.phone && (
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-300">
                        {emp.role}
                      </span>
                    </td>
                    <td className="text-xs text-gray-400">
                      {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('bn-BD') : 'N/A'}
                    </td>
                    <td className="font-extrabold text-emerald-400">{formatCurrency(emp.salary)}</td>
                    <td className={emp.advance > 0 ? 'text-amber-400 font-extrabold' : 'text-gray-400'}>
                      {formatCurrency(emp.advance || 0)}
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        emp.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : emp.status === 'On Leave'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {emp.status === 'Active' ? 'কর্মরত' : emp.status === 'On Leave' ? 'ছুটিতে' : 'অব্যাহতি'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSalaryModal(emp)}
                          className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          title="মাসিক বেতন পরিশোধ করুন"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">বেতন দিন</span>
                        </button>

                        <button
                          onClick={() => handleOpenAdvanceModal(emp)}
                          className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          title="বেতন অগ্রিম / অ্যাডভান্স প্রদান করুন"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">অ্যাডভান্স</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-1.5 bg-white/10 hover:bg-white/20 text-gray-200 rounded-lg transition"
                          title="কর্মচারীর তথ্য এডিট করুন"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-400" />
                        </button>

                        <button
                          onClick={() => { setSelectedEmp(emp); setIsDeleteModalOpen(true); }}
                          className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition"
                          title="কর্মচারী প্রোফাইল রিমুভ করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
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

      {/* 1. ADD / EDIT EMPLOYEE MODAL */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-[#101522] border border-emerald-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 my-auto relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>{empForm.id ? 'কর্মচারীর তথ্য এডিট করুন' : 'নতুন কর্মচারী নাম লেখুন'}</span>
              </h3>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">কর্মচারীর পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মালেক হোসেন"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">ফোন নম্বর</label>
                  <input
                    type="text"
                    placeholder="01700-000000"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">পদবী / ভূমিকা</label>
                  <select
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Farm Manager">ফার্ম ম্যানেজার (Farm Manager)</option>
                    <option value="Shed Caretaker">শেড কেয়ারটেকার (Shed Caretaker)</option>
                    <option value="Feed Mill Operator">ফিড মিল অপারেটর (Feed Operator)</option>
                    <option value="Delivery Driver">ডেলিভারি ড্রাইভার (Delivery Driver)</option>
                    <option value="Sales Operator">ক্যাশিয়ার / বিক্রয় কর্মী (Sales Staff)</option>
                    <option value="Poultry Technician">পোল্ট্রি স্যানিটেশন টেকনিশিয়ান</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">মাসিক মূল বেতন (৳) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={empForm.salary}
                    onChange={(e) => setEmpForm({ ...empForm, salary: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">বর্তমান অগ্রিম গ্রহণ balance (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={empForm.advance}
                    onChange={(e) => setEmpForm({ ...empForm, advance: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-amber-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">যোগদানের তারিখ</label>
                  <input
                    type="date"
                    value={empForm.joiningDate}
                    onChange={(e) => setEmpForm({ ...empForm, joiningDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">স্ট্যাটাস</label>
                  <select
                    value={empForm.status}
                    onChange={(e) => setEmpForm({ ...empForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Active">কর্মরত (Active)</option>
                    <option value="On Leave">ছুটিতে (On Leave)</option>
                    <option value="Terminated">অব্যাহতি (Terminated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">নোট / বিস্তারিত বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="অতিরিক্ত কোনো তথ্য থাকলে লিখুন..."
                  value={empForm.notes}
                  onChange={(e) => setEmpForm({ ...empForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#090d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl font-bold transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg transition"
                >
                  {empForm.id ? 'আপডেট সংরক্ষণ করুন' : 'কর্মচারী যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PAY SALARY DISBURSEMENT MODAL */}
      {isSalaryModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-[#101522] border border-emerald-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 my-auto relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">মাসিক বেতন পরিশোধ মেমো</h3>
                  <p className="text-xs text-emerald-400 font-semibold">{selectedEmp.name} ({selectedEmp.role})</p>
                </div>
              </div>
              <button onClick={() => setIsSalaryModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisburseSalary} className="space-y-4 text-xs sm:text-sm">
              {/* Calculations Header Box */}
              <div className="p-4 bg-[#090d16] border border-white/10 rounded-2xl space-y-2">
                <div className="flex justify-between text-gray-300">
                  <span>মাসিক স্কেল বেতন:</span>
                  <span className="font-bold text-white">{formatCurrency(selectedEmp.salary)}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>অগ্রিম কর্তন (Advance Deduct):</span>
                  <span className="font-bold">- {formatCurrency(Math.min(selectedEmp.advance || 0, Number(salaryForm.deductAdvance) || 0))}</span>
                </div>
                {Number(salaryForm.bonus) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>বোনাস / এলাউন্স:</span>
                    <span className="font-bold">+ {formatCurrency(Number(salaryForm.bonus))}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="font-extrabold text-white text-base">মোট নিট পরিশোধযোগ্য:</span>
                  <span className="font-black text-emerald-400 text-xl">
                    {formatCurrency(Math.max(0, (selectedEmp.salary + (Number(salaryForm.bonus) || 0)) - Math.min(selectedEmp.advance || 0, Number(salaryForm.deductAdvance) || 0)))}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">পরিশোধের তারিখ</label>
                  <input
                    type="date"
                    required
                    value={salaryForm.date}
                    onChange={(e) => setSalaryForm({ ...salaryForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">বোনাস / অতিরিক্ত পারিশ্রমিক (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={salaryForm.bonus}
                    onChange={(e) => setSalaryForm({ ...salaryForm, bonus: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">অগ্রিম থেকে কত টাকা কর্তন করবেন?</label>
                  <input
                    type="number"
                    min={0}
                    max={selectedEmp.advance || 0}
                    value={salaryForm.deductAdvance}
                    onChange={(e) => setSalaryForm({ ...salaryForm, deductAdvance: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-amber-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={salaryForm.paymentMethod}
                    onChange={(e) => setSalaryForm({ ...salaryForm, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Cash">ক্যাশ নগদ</option>
                    <option value="Bkash">বিকাশ (Bkash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                    <option value="Bank">ব্যাংক ট্রান্সফার</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">নোট / বিষয়</label>
                <input
                  type="text"
                  placeholder="যেমন: জুলাই ২০২৬ মাসের মূল বেতন পরিশোধ"
                  value={salaryForm.note}
                  onChange={(e) => setSalaryForm({ ...salaryForm, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl font-bold transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>বেতন কনফার্ম করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. GIVE ADVANCE SALARY MODAL */}
      {isAdvanceModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-[#101522] border border-amber-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 my-auto relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">বেতন অগ্রিম (Advance) প্রদান</h3>
                  <p className="text-xs text-amber-400 font-semibold">{selectedEmp.name}</p>
                </div>
              </div>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGiveAdvance} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-[#090d16] border border-white/10 rounded-xl flex justify-between items-center text-xs">
                <span className="text-gray-400">বর্তমান অগ্রিম জমা:</span>
                <span className="font-bold text-amber-400">{formatCurrency(selectedEmp.advance || 0)}</span>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">অ্যাডভান্স টাকা পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  min={100}
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-amber-400 text-lg font-black focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">অ্যাডভান্স নেওয়ার কারণ / নোট</label>
                <input
                  type="text"
                  placeholder="যেমন: পারিবারিক প্রয়োজনে অগ্রিম"
                  value={advanceNote}
                  onChange={(e) => setAdvanceNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl font-bold transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold rounded-xl shadow-lg transition"
                >
                  অ্যাডভান্স প্রদান সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-[#101522] border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 my-auto text-center relative">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">কর্মচারী রিমুভ নিশ্চিতকরণ</h3>
              <p className="text-xs text-gray-300 mt-1">
                আপনি কি নিশ্চিত যে কর্মচারী <span className="font-bold text-white">"{selectedEmp.name}"</span> কে তালিকা থেকে মুছে ফেলতে চান?
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl font-bold text-xs transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-lg transition"
              >
                হ্যাঁ, রিমুভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
