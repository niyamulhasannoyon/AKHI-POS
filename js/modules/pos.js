/* ==========================================================================
   AKHI POULTRY FARM - SMART POS & FARM MANAGEMENT SYSTEM 4.0
   POS Checkout Register & Thermal Printing Engine
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, showToast, showModal, hideModal } from '../app.js';

let cart = [];
let selectedCategory = 'ALL';
let searchQuery = '';

export function initPOSModule() {
  renderPOSView();

  // Listen to store updates
  store.subscribe(() => {
    renderProductGrid();
    renderCustomerOptions();
  });

  // Re-render when switching to POS view
  window.addEventListener('view-changed', (e) => {
    if (e.detail.viewId === 'pos-view') {
      renderPOSView();
    }
  });
}

function renderPOSView() {
  const container = document.getElementById('pos-view');
  if (!container) return;

  container.innerHTML = `
    <div class="pos-container">
      <!-- Left Column: Products Register -->
      <div class="glass-card flex flex-col h-full" style="display: flex; flex-direction: column;">
        <!-- Filter Bar -->
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center;">
          <input type="text" id="pos-search-input" class="form-input" style="flex: 1; min-width: 200px;" placeholder="🔍 Search product by name or category..." value="${searchQuery}">
          <div id="pos-category-filters" style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.25rem;">
            <button class="btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}" data-cat="ALL">All</button>
            <button class="btn btn-sm ${selectedCategory === 'Feed & Gura' ? 'btn-primary' : 'btn-secondary'}" data-cat="Feed & Gura">Feed & Gura</button>
            <button class="btn btn-sm ${selectedCategory === 'Eggs' ? 'btn-primary' : 'btn-secondary'}" data-cat="Eggs">Eggs</button>
            <button class="btn btn-sm ${selectedCategory === 'Live Birds' ? 'btn-primary' : 'btn-secondary'}" data-cat="Live Birds">Live Birds</button>
            <button class="btn btn-sm ${selectedCategory === 'Medicines' ? 'btn-primary' : 'btn-secondary'}" data-cat="Medicines">Medicines</button>
          </div>
        </div>

        <!-- Product Grid -->
        <div id="pos-product-grid" class="product-grid" style="flex: 1;">
          <!-- Dynamically Rendered -->
        </div>
      </div>

      <!-- Right Column: Cart & Checkout Register -->
      <div class="glass-card cart-panel">
        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
          <h3 style="font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>🛒</span> Current Cart
          </h3>
          <button id="pos-clear-cart-btn" class="btn btn-sm btn-secondary" style="color: var(--accent-red);">Clear</button>
        </div>

        <!-- Customer Select -->
        <div class="form-group" style="margin-top: 0.75rem;">
          <label class="form-label">Customer</label>
          <div style="display: flex; gap: 0.5rem;">
            <select id="pos-customer-select" class="form-select"></select>
            <button id="pos-add-customer-btn" class="btn btn-sm btn-secondary" title="Add Customer">+</button>
          </div>
        </div>

        <!-- Cart Items List -->
        <div id="pos-cart-items" class="cart-items-list"></div>

        <!-- Summary & Totals -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-top: auto; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted);">
            <span>Subtotal</span>
            <span id="pos-subtotal-val">৳ 0</span>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <div style="flex: 1;">
              <label class="form-label">Discount (৳)</label>
              <input type="number" id="pos-discount-input" class="form-input" value="0" min="0">
            </div>
            <div style="flex: 1;">
              <label class="form-label">Paid Amount (৳)</label>
              <input type="number" id="pos-paid-input" class="form-input" value="0" min="0">
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 800; color: #fff; margin-top: 0.25rem; background: rgba(16, 185, 129, 0.1); padding: 0.6rem 0.8rem; border-radius: var(--radius-md);">
            <span>Net Payable</span>
            <span id="pos-net-val" style="color: var(--emerald-primary);">৳ 0</span>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted);">
            <span>Due Balance</span>
            <span id="pos-due-val" style="color: var(--gold-primary);">৳ 0</span>
          </div>

          <div class="form-group" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
            <label class="form-label">Payment Method</label>
            <select id="pos-payment-method" class="form-select">
              <option value="Cash">Cash Payment</option>
              <option value="Bkash">Bkash Mobile Banking</option>
              <option value="Nagad">Nagad Mobile Banking</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Due">Credit Sale (Full Due)</option>
            </select>
          </div>

          <button id="pos-checkout-btn" class="btn btn-primary" style="width: 100%; padding: 0.85rem; font-size: 1rem;">
            ⚡ Complete Sale & Print Receipt (F2)
          </button>
        </div>
      </div>
    </div>
  `;

  attachPOSEvents();
  renderProductGrid();
  renderCustomerOptions();
  updateCartUI();
}

function attachPOSEvents() {
  const searchInput = document.getElementById('pos-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderProductGrid();
    });
  }

  const categoryFilters = document.getElementById('pos-category-filters');
  if (categoryFilters) {
    categoryFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        selectedCategory = btn.getAttribute('data-cat');
        categoryFilters.querySelectorAll('button').forEach(b => {
          b.className = `btn btn-sm ${b.getAttribute('data-cat') === selectedCategory ? 'btn-primary' : 'btn-secondary'}`;
        });
        renderProductGrid();
      }
    });
  }

  const clearBtn = document.getElementById('pos-clear-cart-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      cart = [];
      updateCartUI();
    });
  }

  const discountInput = document.getElementById('pos-discount-input');
  const paidInput = document.getElementById('pos-paid-input');
  if (discountInput) discountInput.addEventListener('input', updateCartUI);
  if (paidInput) paidInput.addEventListener('input', updateCartUI);

  const checkoutBtn = document.getElementById('pos-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }
}

function renderProductGrid() {
  const grid = document.getElementById('pos-product-grid');
  if (!grid) return;

  const products = store.get('products') || [];
  const filtered = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery) || p.category.toLowerCase().includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem 0;">No products found matching filters.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="product-card" onclick="window.addToPOSCart('${p.id}')">
      <div>
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Stock: <b style="color: ${p.stock <= p.minStock ? '#ef4444' : '#10b981'};">${p.stock} ${p.unit}</b></div>
      </div>
      <div class="product-price">${formatCurrency(p.price)}</div>
    </div>
  `).join('');
}

window.addToPOSCart = (productId) => {
  const product = store.get('products').find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(c => c.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      qty: 1
    });
  }

  updateCartUI();
  showToast(`Added ${product.name} to cart`);
};

function renderCustomerOptions() {
  const select = document.getElementById('pos-customer-select');
  if (!select) return;

  const customers = store.get('customers') || [];
  select.innerHTML = customers.map(c => `
    <option value="${c.id}">${c.name} ${c.due > 0 ? `(Due: ${formatCurrency(c.due)})` : ''}</option>
  `).join('');
}

function updateCartUI() {
  const container = document.getElementById('pos-cart-items');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: 0.85rem;">Cart is empty. Click items on the left to add.</div>`;
  } else {
    container.innerHTML = cart.map((item, idx) => `
      <div class="cart-item">
        <div>
          <div style="font-weight: 700; font-size: 0.85rem;">${item.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${formatCurrency(item.price)} / ${item.unit}</div>
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="window.updatePOSQty(${idx}, -1)">-</button>
          <span style="font-weight: 700; width: 24px; text-align: center; font-size: 0.9rem;">${item.qty}</span>
          <button class="qty-btn" onclick="window.updatePOSQty(${idx}, 1)">+</button>
          <button style="background: transparent; border: none; color: #ef4444; margin-left: 0.5rem; cursor: pointer;" onclick="window.removePOSItem(${idx})">✕</button>
        </div>
      </div>
    `).join('');
  }

  // Totals calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountInput = document.getElementById('pos-discount-input');
  const discount = Number(discountInput?.value) || 0;

  const netPayable = Math.max(0, subtotal - discount);

  const paidInput = document.getElementById('pos-paid-input');
  // Auto-fill paid amount if not touched by user
  if (paidInput && (!paidInput.value || paidInput.value === '0' || Number(paidInput.value) > netPayable)) {
    paidInput.value = netPayable;
  }
  const paid = Number(paidInput?.value) || 0;
  const due = Math.max(0, netPayable - paid);

  document.getElementById('pos-subtotal-val').innerText = formatCurrency(subtotal);
  document.getElementById('pos-net-val').innerText = formatCurrency(netPayable);
  document.getElementById('pos-due-val').innerText = formatCurrency(due);
}

window.updatePOSQty = (index, delta) => {
  if (cart[index]) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    updateCartUI();
  }
};

window.removePOSItem = (index) => {
  if (cart[index]) {
    cart.splice(index, 1);
    updateCartUI();
  }
};

function handleCheckout() {
  if (cart.length === 0) {
    showToast('Cannot complete sale with an empty cart!', 'error');
    return;
  }

  const customerSelect = document.getElementById('pos-customer-select');
  const customerId = customerSelect?.value;
  const customer = store.get('customers').find(c => c.id === customerId) || { id: 'CUST-001', name: 'Walk-in Retail' };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = Number(document.getElementById('pos-discount-input')?.value) || 0;
  const grandTotal = Math.max(0, subtotal - discount);
  const paidAmount = Number(document.getElementById('pos-paid-input')?.value) || 0;
  const dueAmount = Math.max(0, grandTotal - paidAmount);
  const paymentMethod = document.getElementById('pos-payment-method')?.value || 'Cash';

  const saleRecord = {
    id: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    customerId: customer.id,
    customerName: customer.name,
    items: [...cart],
    subtotal,
    discount,
    grandTotal,
    paidAmount,
    dueAmount,
    paymentMethod,
    status: dueAmount === 0 ? 'Paid' : (paidAmount === 0 ? 'Due' : 'Partial')
  };

  // 1. Save Sale Transaction
  store.addItem('sales', saleRecord);

  // 2. Deduct Inventory Stock
  cart.forEach(cartItem => {
    const product = store.get('products').find(p => p.id === cartItem.id);
    if (product) {
      const newStock = Math.max(0, product.stock - cartItem.qty);
      store.updateItem('products', product.id, { stock: newStock });
    }
  });

  // 3. Update Customer Due Balance
  if (dueAmount > 0) {
    store.updateItem('customers', customer.id, {
      due: (customer.due || 0) + dueAmount
    });
  }

  // 4. Record Income Entry in Accounting
  store.addItem('accounting', {
    id: `ACC-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().slice(0, 10),
    type: 'Income',
    category: 'POS Sales',
    amount: paidAmount,
    note: `Sale #${saleRecord.id} (${customer.name})`
  });

  showToast(`Sale completed! Invoice #${saleRecord.id}`);

  // 5. Trigger Thermal Receipt Print
  triggerThermalReceiptPrint(saleRecord);

  // Reset Cart
  cart = [];
  document.getElementById('pos-discount-input').value = '0';
  document.getElementById('pos-paid-input').value = '0';
  updateCartUI();
}

function triggerThermalReceiptPrint(sale) {
  let receiptEl = document.getElementById('thermal-receipt');
  if (!receiptEl) {
    receiptEl = document.createElement('div');
    receiptEl.id = 'thermal-receipt';
    document.body.appendChild(receiptEl);
  }

  const farm = store.get('settings');

  receiptEl.innerHTML = `
    <div class="receipt-header">
      <h2>${farm.farmName || 'AKHI POULTRY FARM'}</h2>
      <div>${farm.address}</div>
      <div>Mob: ${farm.phone}</div>
      <div style="margin-top: 5px; font-weight: bold;">INVOICE: ${sale.id}</div>
      <div>Date: ${new Date(sale.date).toLocaleString()}</div>
      <div>Customer: ${sale.customerName}</div>
    </div>

    <table class="receipt-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Price</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${sale.items.map(i => `
          <tr>
            <td>${i.name}</td>
            <td class="num">${i.qty}</td>
            <td class="num">${i.price}</td>
            <td class="num">${i.qty * i.price}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="border-top: 1px dashed #000; padding-top: 5px;">
      <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>৳ ${sale.subtotal}</span></div>
      ${sale.discount > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Discount:</span><span>- ৳ ${sale.discount}</span></div>` : ''}
      <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Net Payable:</span><span>৳ ${sale.grandTotal}</span></div>
      <div style="display: flex; justify-content: space-between;"><span>Paid (${sale.paymentMethod}):</span><span>৳ ${sale.paidAmount}</span></div>
      ${sale.dueAmount > 0 ? `<div style="display: flex; justify-content: space-between; font-weight: bold; color: red;"><span>Due Balance:</span><span>৳ ${sale.dueAmount}</span></div>` : ''}
    </div>

    <div class="receipt-footer">
      <div>*** Thank You For Your Business ***</div>
      <div>Powered by Akhi POS 4.0 System</div>
    </div>
  `;

  // Trigger Print
  window.print();
}
