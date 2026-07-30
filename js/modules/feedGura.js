/* ==========================================================================
   AKHI POULTRY FARM - SMART POS & FARM MANAGEMENT SYSTEM 4.0
   Feed & Gura Formulation & Mixing Calculator Engine
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, showToast } from '../app.js';

export function initFeedGuraModule() {
  renderFeedGuraView();

  store.subscribe(() => {
    renderRawIngredients();
  });

  window.addEventListener('view-changed', (e) => {
    if (e.detail.viewId === 'feed-gura-mgmt-view') renderFeedGuraView();
  });
}

function renderFeedGuraView() {
  const container = document.getElementById('feed-gura-mgmt-view');
  if (!container) return;

  container.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <h2 style="font-weight: 800; font-size: 1.4rem;">🌾 Feed & Gura Formulation Engine</h2>
      <p style="font-size: 0.85rem; color: var(--text-muted);">Manage raw feed ingredients, formulate custom feed ratios, calculate production costs, and run grinding batches.</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
      <!-- Left Column: Raw Ingredients Stock -->
      <div class="glass-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-weight: 700; font-size: 1.1rem;">Raw Ingredients Inventory</h3>
          <button id="add-ingredient-btn" class="btn btn-sm btn-secondary">+ Add Ingredient</button>
        </div>

        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Stock (KG)</th>
                <th>Cost/KG</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="raw-ingredients-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- Right Column: Mixing & Formulation Batch Register -->
      <div class="glass-card">
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem;">⚙ Feed Batch Mixing Calculator</h3>
        
        <div class="form-group">
          <label class="form-label">Target Finished Product</label>
          <select id="feed-target-product" class="form-select">
            <option value="PRD-001">Sonali Starter Feed (50kg Bag)</option>
            <option value="PRD-002">Broiler Finisher Feed (50kg Bag)</option>
            <option value="PRD-007">Maize Powder (Gura - 50kg Bag)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Batch Output Volume (Bags of 50kg)</label>
          <input type="number" id="feed-batch-bags" class="form-input" value="10" min="1" required>
        </div>

        <div style="background: rgba(15,23,42,0.6); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1rem;">
          <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--gold-primary); margin-bottom: 0.5rem;">Standard Sonali Feed Recipe (500 KG Batch)</h4>
          <ul style="font-size: 0.8rem; color: var(--text-muted); padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.25rem;">
            <li>Yellow Maize Gura: <b>275 KG (55%)</b></li>
            <li>Soybean Meal: <b>150 KG (30%)</b></li>
            <li>Rice Polish / Bran: <b>50 KG (10%)</b></li>
            <li>Premix & Calcium: <b>25 KG (5%)</b></li>
          </ul>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(16,185,129,0.1); border-radius: var(--radius-md); margin-bottom: 1rem;">
          <span style="font-size: 0.85rem; font-weight: 600;">Est. Cost per Bag:</span>
          <b id="feed-cost-per-bag" style="font-size: 1.1rem; color: var(--emerald-primary);">৳ 2,650</b>
        </div>

        <button id="run-feed-batch-btn" class="btn btn-primary" style="width: 100%;">
          ⚡ Run Grinding Batch & Generate Feed Stock
        </button>
      </div>
    </div>
  `;

  document.getElementById('add-ingredient-btn')?.addEventListener('click', showAddIngredientModal);
  document.getElementById('run-feed-batch-btn')?.addEventListener('click', handleRunFeedBatch);
  renderRawIngredients();
}

function renderRawIngredients() {
  const tbody = document.getElementById('raw-ingredients-tbody');
  if (!tbody) return;

  const ingredients = store.get('feedIngredients') || [];
  tbody.innerHTML = ingredients.map(ing => `
    <tr>
      <td><b>${ing.name}</b></td>
      <td><b style="color: ${ing.stockKg < 500 ? '#ef4444' : '#10b981'};">${ing.stockKg} KG</b></td>
      <td>${formatCurrency(ing.costPerKg)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="window.updateIngredientStock('${ing.id}')">+ Restock</button>
      </td>
    </tr>
  `).join('');
}

function showAddIngredientModal() {
  const name = prompt('Ingredient Name (e.g. Wheat Bran):');
  if (!name) return;
  const stockKg = Number(prompt('Current Stock (KG):', '1000')) || 0;
  const costPerKg = Number(prompt('Cost per KG (৳):', '30')) || 0;

  const newIng = {
    id: `ING-${Date.now().toString().slice(-4)}`,
    name,
    stockKg,
    costPerKg
  };

  store.addItem('feedIngredients', newIng);
  showToast('Raw ingredient added to stock');
}

window.updateIngredientStock = (id) => {
  const ing = store.get('feedIngredients').find(i => i.id === id);
  if (!ing) return;
  const addQty = Number(prompt(`Add stock for ${ing.name} (KG):`, '500'));
  if (addQty > 0) {
    store.updateItem('feedIngredients', id, {
      stockKg: ing.stockKg + addQty
    });
    showToast(`Added ${addQty} KG to ${ing.name}`);
  }
};

function handleRunFeedBatch() {
  const bags = Number(document.getElementById('feed-batch-bags')?.value) || 10;
  const productId = document.getElementById('feed-target-product')?.value || 'PRD-001';

  const ingredients = store.get('feedIngredients') || [];
  const maize = ingredients.find(i => i.id === 'ING-01');
  const soy = ingredients.find(i => i.id === 'ING-02');

  const requiredMaizeKg = bags * 27.5; // 55% of 50kg bag
  const requiredSoyKg = bags * 15.0;   // 30% of 50kg bag

  if (maize && maize.stockKg < requiredMaizeKg) {
    showToast(`Insufficient Yellow Maize stock! Required: ${requiredMaizeKg} KG`, 'error');
    return;
  }
  if (soy && soy.stockKg < requiredSoyKg) {
    showToast(`Insufficient Soybean stock! Required: ${requiredSoyKg} KG`, 'error');
    return;
  }

  // Deduct raw ingredients
  if (maize) store.updateItem('feedIngredients', maize.id, { stockKg: maize.stockKg - requiredMaizeKg });
  if (soy) store.updateItem('feedIngredients', soy.id, { stockKg: soy.stockKg - requiredSoyKg });

  // Add finished bags to products
  const product = store.get('products').find(p => p.id === productId);
  if (product) {
    store.updateItem('products', product.id, { stock: product.stock + bags });
  }

  showToast(`Grinding batch complete! Produced ${bags} bags of feed.`);
}
