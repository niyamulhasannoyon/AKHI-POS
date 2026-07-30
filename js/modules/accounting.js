/* ==========================================================================
   AKHI POULTRY FARM - SMART POS & FARM MANAGEMENT SYSTEM 4.0
   Financial Accounting, Ledgers, Loans & Installments Engine
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, formatDate, showToast, showModal, hideModal } from '../app.js';

export function initAccountingModule() {
  renderAccountingView();
  renderCustomerView();
  renderSupplierView();
  renderLoanView();
  renderInstallmentView();

  store.subscribe(() => {
    renderAccountingTable();
    renderCustomerTable();
    renderSupplierTable();
    renderLoanTable();
    renderInstallmentTable();
  });

  window.addEventListener('view-changed', (e) => {
    const v = e.detail.viewId;
    if (v === 'accounting-view') renderAccountingView();
    if (v === 'customers-view') renderCustomerView();
    if (v === 'supplier-view') renderSupplierView();
    if (v === 'loan-view') renderLoanView();
    if (v === 'installment-view') renderInstallmentView();
  });
}

// --------------------------------------------------------------------------
// 1. Accounting View (Journal Income / Expense Entries)
// --------------------------------------------------------------------------
function renderAccountingView() {
  const container = document.getElementById('accounting-view');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-weight: 800; font-size: 1.4rem;">💰 Farm Accounting & Cash Journal</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Track daily cashflow, operational expenditures, and revenue receipts.</p>
      </div>
      <button id="add-acc-entry-btn" class="btn btn-primary">
        <span>+</span> Record Income / Expense
      </button>
    </div>

    <div class="glass-card">
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Entry Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Note / Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="accounting-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-acc-entry-btn')?.addEventListener('click', showAddEntryModal);
  renderAccountingTable();
}

function renderAccountingTable() {
  const tbody = document.getElementById('accounting-tbody');
  if (!tbody) return;

  const entries = store.get('accounting') || [];
  tbody.innerHTML = entries.map(e => `
    <tr>
      <td><b>${formatDate(e.date)}</b></td>
      <td><span class="badge ${e.type === 'Income' ? 'badge-success' : 'badge-danger'}">${e.type}</span></td>
      <td><b>${e.category}</b></td>
      <td><b style="color: ${e.type === 'Income' ? '#34d399' : '#f87171'};">${formatCurrency(e.amount)}</b></td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">${e.note || '-'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="window.deleteAccountingEntry('${e.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function showAddEntryModal() {
  let modal = document.getElementById('add-entry-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'add-entry-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 style="font-weight: 700;">💳 Record Financial Transaction</h3>
        <button class="modal-close-btn">&times;</button>
      </div>
      <form id="acc-form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select id="acc-type" class="form-select" required>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="acc-date" class="form-input" value="${new Date().toISOString().slice(0,10)}" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Category</label>
            <input type="text" id="acc-cat" class="form-input" placeholder="e.g. Electricity, Feed, Labor" required>
          </div>
          <div class="form-group">
            <label class="form-label">Amount (৳)</label>
            <input type="number" id="acc-amount" class="form-input" placeholder="5000" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes / Remarks</label>
          <input type="text" id="acc-note" class="form-input" placeholder="e.g. July electricity bill paid">
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Save Transaction</button>
      </form>
    </div>
  `;

  showModal('add-entry-modal');

  document.getElementById('acc-form').onsubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `ACC-${Date.now().toString().slice(-5)}`,
      date: document.getElementById('acc-date').value,
      type: document.getElementById('acc-type').value,
      category: document.getElementById('acc-cat').value,
      amount: Number(document.getElementById('acc-amount').value),
      note: document.getElementById('acc-note').value
    };

    store.addItem('accounting', newEntry);
    showToast('Transaction saved!');
    hideModal('add-entry-modal');
  };
}

window.deleteAccountingEntry = (id) => {
  if (confirm('Delete transaction entry?')) {
    store.deleteItem('accounting', id);
    showToast('Entry deleted');
  }
};

// --------------------------------------------------------------------------
// 2. Customer Ledger View
// --------------------------------------------------------------------------
function renderCustomerView() {
  const container = document.getElementById('customers-view');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-weight: 800; font-size: 1.4rem;">👥 Customer Directory & Dues Ledger</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Manage buyer accounts, credit limits, and receive due payments.</p>
      </div>
      <button id="add-customer-btn-page" class="btn btn-primary">+ Add New Customer</button>
    </div>

    <div class="glass-card">
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Mobile Phone</th>
              <th>Address</th>
              <th>Total Purchases</th>
              <th>Outstanding Due</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="customers-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-customer-btn-page')?.addEventListener('click', showAddCustomerModal);
  renderCustomerTable();
}

function renderCustomerTable() {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  const customers = store.get('customers') || [];
  tbody.innerHTML = customers.map(c => `
    <tr>
      <td><b>${c.id}</b></td>
      <td><b>${c.name}</b></td>
      <td>${c.phone}</td>
      <td>${c.address || '-'}</td>
      <td>${formatCurrency(c.totalPurchases || 0)}</td>
      <td><b style="color: ${c.due > 0 ? '#f87171' : '#34d399'};">${formatCurrency(c.due)}</b></td>
      <td>
        <button class="btn btn-sm btn-gold" onclick="window.receiveCustomerPayment('${c.id}')">Receive Due</button>
      </td>
    </tr>
  `).join('');
}

function showAddCustomerModal() {
  const name = prompt('Customer Name:');
  if (!name) return;
  const phone = prompt('Mobile Phone:', '01700-000000') || '';
  const address = prompt('Address:', 'Gazipur') || '';

  const newCust = {
    id: `CUST-${Date.now().toString().slice(-4)}`,
    name,
    phone,
    address,
    due: 0,
    totalPurchases: 0
  };

  store.addItem('customers', newCust);
  showToast('Customer registered!');
}

window.receiveCustomerPayment = (id) => {
  const customer = store.get('customers').find(c => c.id === id);
  if (!customer || customer.due <= 0) {
    showToast('Customer has no outstanding due!', 'info');
    return;
  }

  const pay = Number(prompt(`Receive payment from ${customer.name} (Current Due: ${formatCurrency(customer.due)}):`, customer.due));
  if (pay > 0) {
    const newDue = Math.max(0, customer.due - pay);
    store.updateItem('customers', id, { due: newDue });

    // Record Income Entry
    store.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Income',
      category: 'Customer Due Collection',
      amount: pay,
      note: `Due received from ${customer.name}`
    });

    showToast(`Payment of ${formatCurrency(pay)} received!`);
  }
};

// --------------------------------------------------------------------------
// 3. Supplier Ledger View
// --------------------------------------------------------------------------
function renderSupplierView() {
  const container = document.getElementById('supplier-view');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-weight: 800; font-size: 1.4rem;">🏬 Supplier Directory & Payables</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Manage feed mill, hatchery, and medicine supplier balances.</p>
      </div>
      <button id="add-supplier-btn" class="btn btn-primary">+ Add Supplier</button>
    </div>

    <div class="glass-card">
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Supplier Name</th>
              <th>Mobile</th>
              <th>Address</th>
              <th>Payable Balance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="suppliers-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-supplier-btn')?.addEventListener('click', showAddSupplierModal);
  renderSupplierTable();
}

function renderSupplierTable() {
  const tbody = document.getElementById('suppliers-tbody');
  if (!tbody) return;

  const suppliers = store.get('suppliers') || [];
  tbody.innerHTML = suppliers.map(s => `
    <tr>
      <td><b>${s.id}</b></td>
      <td><b>${s.name}</b></td>
      <td>${s.phone}</td>
      <td>${s.address || '-'}</td>
      <td><b style="color: ${s.balance > 0 ? '#f87171' : '#34d399'};">${formatCurrency(s.balance)}</b></td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="window.paySupplier('${s.id}')">Pay Supplier</button>
      </td>
    </tr>
  `).join('');
}

function showAddSupplierModal() {
  const name = prompt('Supplier Company Name:');
  if (!name) return;
  const phone = prompt('Phone:', '01800-000000') || '';
  const address = prompt('Address:', 'Dhaka') || '';

  const newSup = {
    id: `SUP-${Date.now().toString().slice(-4)}`,
    name,
    phone,
    address,
    balance: 0
  };

  store.addItem('suppliers', newSup);
  showToast('Supplier registered!');
}

window.paySupplier = (id) => {
  const supplier = store.get('suppliers').find(s => s.id === id);
  if (!supplier || supplier.balance <= 0) {
    showToast('No outstanding payable balance for this supplier!', 'info');
    return;
  }

  const pay = Number(prompt(`Pay to ${supplier.name} (Payable: ${formatCurrency(supplier.balance)}):`, supplier.balance));
  if (pay > 0) {
    const newBal = Math.max(0, supplier.balance - pay);
    store.updateItem('suppliers', id, { balance: newBal });

    // Record Expense Entry
    store.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Expense',
      category: 'Supplier Payment',
      amount: pay,
      note: `Payment to ${supplier.name}`
    });

    showToast(`Paid ${formatCurrency(pay)} to ${supplier.name}`);
  }
};

// --------------------------------------------------------------------------
// 4. Loan & Installments View
// --------------------------------------------------------------------------
function renderLoanView() {
  const container = document.getElementById('loan-view');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-weight: 800; font-size: 1.4rem;">🏦 Farm Loan & Credit Manager</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Track bank loans, interest rates, monthly EMI schedules, and repayments.</p>
      </div>
      <button id="add-loan-btn" class="btn btn-primary">+ Add New Loan</button>
    </div>

    <div class="glass-card">
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Lender / Bank</th>
              <th>Total Principal</th>
              <th>Interest Rate</th>
              <th>Monthly EMI</th>
              <th>Remaining Balance</th>
              <th>Next Due Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="loans-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-loan-btn')?.addEventListener('click', showAddLoanModal);
  renderLoanTable();
}

function renderLoanTable() {
  const tbody = document.getElementById('loans-tbody');
  if (!tbody) return;

  const loans = store.get('loans') || [];
  tbody.innerHTML = loans.map(l => `
    <tr>
      <td><b>${l.id}</b></td>
      <td><b>${l.lender}</b></td>
      <td>${formatCurrency(l.amount)}</td>
      <td><span class="badge badge-info">${l.interestRate}% P.A.</span></td>
      <td><b>${formatCurrency(l.emi)}</b></td>
      <td><b style="color: #f87171;">${formatCurrency(l.remaining)}</b></td>
      <td>${formatDate(l.nextDueDate)}</td>
      <td>
        <button class="btn btn-sm btn-gold" onclick="window.payLoanEMI('${l.id}')">Pay EMI</button>
      </td>
    </tr>
  `).join('');
}

function showAddLoanModal() {
  const lender = prompt('Lender / Bank Name:');
  if (!lender) return;
  const amount = Number(prompt('Loan Amount (৳):', '100000')) || 0;
  const interestRate = Number(prompt('Interest Rate (%):', '9')) || 0;
  const emi = Number(prompt('Monthly EMI (৳):', '5000')) || 0;

  const newLoan = {
    id: `LN-${Date.now().toString().slice(-4)}`,
    lender,
    amount,
    interestRate,
    emi,
    remaining: amount,
    nextDueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10)
  };

  store.addItem('loans', newLoan);
  showToast('Loan account registered!');
}

window.payLoanEMI = (id) => {
  const loan = store.get('loans').find(l => l.id === id);
  if (!loan) return;

  const pay = Number(prompt(`Pay EMI for ${loan.lender}:`, loan.emi));
  if (pay > 0) {
    const newRemaining = Math.max(0, loan.remaining - pay);
    store.updateItem('loans', id, { remaining: newRemaining });

    store.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Expense',
      category: 'Loan EMI Payment',
      amount: pay,
      note: `EMI paid for ${loan.lender}`
    });

    showToast('EMI payment logged successfully!');
  }
};

function renderInstallmentView() {
  const container = document.getElementById('installment-view');
  if (!container) return;

  container.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <h2 style="font-weight: 800; font-size: 1.4rem;">📅 Customer Installment Payment Tracker</h2>
      <p style="font-size: 0.85rem; color: var(--text-muted);">Manage multi-stage installment agreements for large bird or feed orders.</p>
    </div>

    <div class="glass-card">
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Agreement Amount</th>
              <th>Paid So Far</th>
              <th>Remaining Due</th>
              <th>Installments</th>
              <th>Next Due Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="installments-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  renderInstallmentTable();
}

function renderInstallmentTable() {
  const tbody = document.getElementById('installments-tbody');
  if (!tbody) return;

  const installments = store.get('installments') || [];
  tbody.innerHTML = installments.map(ins => `
    <tr>
      <td><b>${ins.id}</b></td>
      <td><b>${ins.customerName}</b></td>
      <td>${formatCurrency(ins.totalAmount)}</td>
      <td><span style="color: #34d399;">${formatCurrency(ins.paidAmount)}</span></td>
      <td><b style="color: #f87171;">${formatCurrency(ins.remaining)}</b></td>
      <td><span class="badge badge-neutral">${ins.installmentCount} Parts</span></td>
      <td>${formatDate(ins.nextDate)}</td>
      <td>
        <button class="btn btn-sm btn-gold" onclick="window.receiveInstallment('${ins.id}')">Receive Part</button>
      </td>
    </tr>
  `).join('');
}

window.receiveInstallment = (id) => {
  const ins = store.get('installments').find(i => i.id === id);
  if (!ins) return;

  const amount = Number(prompt(`Receive installment payment from ${ins.customerName}:`, '5000'));
  if (amount > 0) {
    const newPaid = ins.paidAmount + amount;
    const newRem = Math.max(0, ins.totalAmount - newPaid);
    store.updateItem('installments', id, { paidAmount: newPaid, remaining: newRem });

    store.addItem('accounting', {
      id: `ACC-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Income',
      category: 'Installment Collection',
      amount,
      note: `Installment received from ${ins.customerName}`
    });

    showToast('Installment payment received!');
  }
};
