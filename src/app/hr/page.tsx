'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Employee } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { UserCheck, Plus, DollarSign } from 'lucide-react';

function generateId(prefix: string, sliceLength: number): string {
  return `${prefix}-${Date.now().toString().slice(-sliceLength)}`;
}

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const update = () => setEmployees(farmStore.getState().employees || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleAddEmployee = () => {
    const name = prompt('Employee Name:');
    if (!name) return;
    const role = prompt('Role:', 'Shed Caretaker') || 'Staff';
    const salary = Number(prompt('Monthly Salary (৳):', '15000')) || 0;

    farmStore.addItem('employees', {
      id: generateId('EMP', 4),
      name,
      role,
      salary,
      advance: 0,
      status: 'Active'
    });
  };

  const handlePaySalary = (emp: Employee) => {
    const netSalary = Math.max(0, emp.salary - emp.advance);
    if (confirm(`Disburse salary for ${emp.name}?\nNet Payable: ${formatCurrency(netSalary)}`)) {
      farmStore.updateItem('employees', emp.id, { advance: 0 });
      farmStore.addItem('accounting', {
        id: generateId('ACC', 5),
        date: new Date().toISOString().slice(0, 10),
        type: 'Expense',
        category: 'Employee Salary',
        amount: netSalary,
        note: `Salary paid to ${emp.name} (${emp.role})`
      });
      alert(`Salary of ${formatCurrency(netSalary)} disbursed!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-400" />
            <span>Employee Directory & Payroll</span>
          </h2>
          <p className="text-xs text-gray-400">Manage farm caretakers, feed mill operators, monthly salaries, and advances.</p>
        </div>
        <button
          onClick={handleAddEmployee}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Monthly Salary</th>
                <th>Salary Advance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td className="font-bold text-gray-400">{emp.id}</td>
                  <td className="font-bold text-white">{emp.name}</td>
                  <td><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">{emp.role}</span></td>
                  <td className="font-bold text-emerald-400">{formatCurrency(emp.salary)}</td>
                  <td className={emp.advance > 0 ? 'text-red-400 font-bold' : ''}>{formatCurrency(emp.advance)}</td>
                  <td><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">{emp.status}</span></td>
                  <td>
                    <button
                      onClick={() => handlePaySalary(emp)}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> <span>Pay Salary</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
