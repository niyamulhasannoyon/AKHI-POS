/* ==========================================================================
   AKHI POULTRY FARM - SMART POS & FARM MANAGEMENT SYSTEM 4.0
   Product Catalog & Inventory Management Engine
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, showToast, showModal, hideModal } from '../app.js';

export function initInventoryModule() {
  renderInventoryView();

  store.subscribe(() => {
    renderInventoryTable();
  });

  window.addEventListener('view-changed', (e) => {
    if (e.detail.viewId === 'inventory-view') renderInventoryView();
  });
}

function renderInventoryView() {
  const container = document.getElementById('inventory-view');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-weight: 800; font-size: 1.4rem;">📦 Product & Stock Catalog</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Manage inventory items, pricing, reorder thresholds, and stock levels.</p>
      </div>
      <button id="add-product-btn" class="btn btn-primary">
        <span>+</span> Add New Product
      </button>
    </div>

    <!-- Table -->
    <div class="glass-card">
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Selling Price</th>
              <th>Cost Price</th>
              <th>Current Stock</th>
              <th>Unit</th>
              <th>Stock Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="inventory-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-product-btn')?.addEventListener('click', showAddProductModal);
  renderInventoryTable();
}

function renderInventoryTable() {
  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;

  const products = store.get('products') || [];
  tbody.innerHTML = products.map(p => {
    const isLow = p.stock <= p.minStock;
    return `
      <tr>
        <td><b style="color: var(--text-muted);">${p.id}</b></td>
        <td><b>${p.name}</b></td>
        <td><span class="badge badge-neutral">${p.category}</span></td>
        <td><b style="color: var(--emerald-primary);">${formatCurrency(p.price)}</b></td>
        <td>${formatCurrency(p.cost)}</td>
        <td><b style="font-size: 1rem; color: ${isLow ? '#ef4444' : '#10b981'};">${p.stock}</b></td>
        <td>${p.unit}</td>
        <td>
          <span class="badge ${isLow ? 'badge-danger' : 'badge-success'}">
            ${isLow ? '⚠ Low Stock' : '✓ Normal'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-sm btn-secondary" onclick="window.editProductStock('${p.id}')">Adjust</button>
            <button class="btn btn-sm btn-secondary" style="color: #ef4444;" onclick="window.deleteProduct('${p.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function showAddProductModal() {
  let modal = document.getElementById('add-product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'add-product-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 style="font-weight: 700;">📦 Add New Inventory Product</h3>
        <button class="modal-close-btn">&times;</button>
      </div>
      <form id="product-form">
        <div class="form-group">
          <label class="form-label">Product Title / Name</label>
          <input type="text" id="prd-name" class="form-input" placeholder="e.g. Broiler Growth Vitamin" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="prd-category" class="form-select" required>
              <option value="Feed & Gura">Feed & Gura</option>
              <option value="Eggs">Eggs</option>
              <option value="Live Birds">Live Birds</option>
              <option value="Medicines">Medicines & Vaccines</option>
              <option value="Equipment">Farm Equipment</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Unit Type</label>
            <select id="prd-unit" class="form-select" required>
              <option value="Bag">Bag (50kg)</option>
              <option value="KG">Kilogram (KG)</option>
              <option value="Crate">Crate (30 Pcs)</option>
              <option value="Pcs">Pieces (Pcs)</option>
              <option value="Bottle">Bottle / Liter</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Selling Price (৳)</label>
            <input type="number" id="prd-price" class="form-input" placeholder="2500" required>
          </div>
          <div class="form-group">
            <label class="form-label">Cost Price (৳)</label>
            <input type="number" id="prd-cost" class="form-input" placeholder="2200" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Initial Stock Qty</label>
            <input type="number" id="prd-stock" class="form-input" placeholder="100" required>
          </div>
          <div class="form-group">
            <label class="form-label">Min Stock Alert Threshold</label>
            <input type="number" id="prd-min" class="form-input" value="15" required>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Save Product</button>
      </form>
    </div>
  `;

  showModal('add-product-modal');

  document.getElementById('product-form').onsubmit = (e) => {
    e.preventDefault();
    const newProduct = {
      id: `PRD-${Date.now().toString().slice(-4)}`,
      name: document.getElementById('prd-name').value,
      category: document.getElementById('prd-category').value,
      unit: document.getElementById('prd-unit').value,
      price: Number(document.getElementById('prd-price').value),
      cost: Number(document.getElementById('prd-cost').value),
      stock: Number(document.getElementById('prd-stock').value),
      minStock: Number(document.getElementById('prd-min').value)
    };

    store.addItem('products', newProduct);
    showToast('Product added to inventory!');
    hideModal('add-product-modal');
  };
}

window.editProductStock = (id) => {
  const prd = store.get('products').find(p => p.id === id);
  if (!prd) return;
  const newStock = prompt(`Update stock quantity for ${prd.name} (${prd.unit}):`, prd.stock);
  if (newStock !== null) {
    store.updateItem('products', id, { stock: Number(newStock) || 0 });
    showToast('Stock quantity updated');
  }
};

window.deleteProduct = (id) => {
  if (confirm('Delete this product from catalog?')) {
    store.deleteItem('products', id);
    showToast('Product deleted');
  }
};
