/* ==========================================================================
   AKHI POULTRY FARM - SMART POS & FARM MANAGEMENT SYSTEM 4.0
   Employee Management & Payroll Engine
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, showToast } from '../app.js';

export function initHRModule() {
  renderHRView();

  store.subscribe(() => {
    renderEmployeeTable();
  });

  window.addEventListener('view-changed', (e) => {
    if (e.detail.viewId === 'user-view') renderHRView();
  });
}

function renderHRView() {
  const container = document.getElementById('user-view');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-weight: 800; font-size: 1.4rem;">👨‍🌾 Employee Management & Payroll</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Manage farm caretakers, feed mill operators, monthly salaries, and advances.</p>
      </div>
      <button id="add-employee-btn" class="btn btn-primary">+ Add Employee</button>
    </div>

    <div class="glass-card">
      <div class="table-container">
        <table class="custom-table">
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
          <tbody id="employees-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-employee-btn')?.addEventListener('click', showAddEmployeeModal);
  renderEmployeeTable();
}

function renderEmployeeTable() {
  const tbody = document.getElementById('employees-tbody');
  if (!tbody) return;

  const employees = store.get('employees') || [];
  tbody.innerHTML = employees.map(emp => `
    <tr>
      <td><b>${emp.id}</b></td>
      <td><b>${emp.name}</b></td>
      <td><span class="badge badge-info">${emp.role}</span></td>
      <td><b style="color: var(--emerald-primary);">${formatCurrency(emp.salary)}</b></td>
      <td><span style="color: ${emp.advance > 0 ? '#f87171' : 'inherit'};">${formatCurrency(emp.advance)}</span></td>
      <td><span class="badge badge-success">${emp.status}</span></td>
      <td>
        <div style="display: flex; gap: 0.35rem;">
          <button class="btn btn-sm btn-gold" onclick="window.disburseSalary('${emp.id}')">Pay Salary</button>
          <button class="btn btn-sm btn-secondary" onclick="window.giveAdvance('${emp.id}')">Give Advance</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function showAddEmployeeModal() {
  const name = prompt('Employee Full Name:');
  if (!name) return;
  const role = prompt('Role (e.g. Shed Caretaker, Farm Manager):', 'Shed Caretaker') || 'Staff';
  const salary = Number(prompt('Monthly Salary (৳):', '18000')) || 0;

  const newEmp = {
    id: `EMP-${Date.now().toString().slice(-4)}`,
    name,
    role,
    salary,
    advance: 0,
    status: 'Active'
  };

  store.addItem('employees', newEmp);
  showToast('Employee registered!');
}

window.disburseSalary = (id) => {
  const emp = store.get('employees').find(e => e.id === id);
  if (!emp) return;

  const netSalary = Math.max(0, emp.salary - emp.advance);
  if (confirm(`Disburse monthly salary for ${emp.name}?\nGross Salary: ${formatCurrency(emp.salary)}\nDeduct Advance: ${formatCurrency(emp.advance)}\nNet Payable: ${formatCurrency(netSalary)}`)) {
    // Clear Advance
    store.updateItem('employees', id, { advance: 0 });

    // Record Accounting Expense
    store.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Expense',
      category: 'Employee Salary',
      amount: netSalary,
      note: `Salary disbursed to ${emp.name} (${emp.role})`
    });

    showToast(`Salary of ${formatCurrency(netSalary)} disbursed to ${emp.name}`);
  }
};

window.giveAdvance = (id) => {
  const emp = store.get('employees').find(e => e.id === id);
  if (!emp) return;

  const amount = Number(prompt(`Give salary advance to ${emp.name}:`, '2000'));
  if (amount > 0) {
    store.updateItem('employees', id, { advance: emp.advance + amount });

    store.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Expense',
      category: 'Salary Advance',
      amount,
      note: `Advance given to ${emp.name}`
    });

    showToast(`Advance of ${formatCurrency(amount)} recorded for ${emp.name}`);
  }
};
