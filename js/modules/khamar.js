/* ==========================================================================
   AKHI POULTRY FARM - SMART POS & FARM MANAGEMENT SYSTEM 4.0
   Khamar Flock Batch Management & Daily Khamari Production Engine
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, formatDate, showToast, showModal, hideModal } from '../app.js';

export function initKhamarModule() {
  renderKhamarView();
  renderKhamariView();

  store.subscribe(() => {
    renderFlockCards();
    renderKhamariTable();
  });

  window.addEventListener('view-changed', (e) => {
    if (e.detail.viewId === 'khamar-view') renderKhamarView();
    if (e.detail.viewId === 'khamari-view') renderKhamariView();
  });
}

// --------------------------------------------------------------------------
// 1. Khamar View (Flock Batches)
// --------------------------------------------------------------------------
function renderKhamarView() {
  const container = document.getElementById('khamar-view');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-weight: 800; font-size: 1.4rem;">🐔 Flock Batch Lifecycle Tracker</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Manage active poultry sheds, bird counts, age, and mortality metrics.</p>
      </div>
      <button id="add-flock-btn" class="btn btn-primary">
        <span>+</span> Add New Flock Batch
      </button>
    </div>

    <!-- Active Flocks Grid -->
    <div id="flock-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;"></div>

    <!-- Flock Records Table -->
    <div class="glass-card">
      <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1rem;">All Flock Batches</h3>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Breed & Shed</th>
              <th>Start Date</th>
              <th>Age (Days)</th>
              <th>Initial Qty</th>
              <th>Current Qty</th>
              <th>Mortality</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="flock-table-body"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-flock-btn')?.addEventListener('click', showAddFlockModal);
  renderFlockCards();
}

function renderFlockCards() {
  const grid = document.getElementById('flock-cards-grid');
  const tableBody = document.getElementById('flock-table-body');
  const flocks = store.get('flocks') || [];

  if (grid) {
    grid.innerHTML = flocks.map(f => {
      const mortalityCount = f.initialQty - f.currentQty;
      const mortalityPct = ((mortalityCount / f.initialQty) * 100).toFixed(1);

      return `
        <div class="glass-card" style="border-left: 4px solid ${f.status === 'Active' ? 'var(--emerald-primary)' : 'var(--text-muted)'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div>
              <span class="badge ${f.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${f.status}</span>
              <h3 style="font-weight: 800; font-size: 1.1rem; margin-top: 0.3rem;">${f.name}</h3>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${f.breed} • ${f.houseNo}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 1.4rem; font-weight: 800; color: var(--gold-primary);">${f.ageDays}</span>
              <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Days Old</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: rgba(15,23,42,0.5); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.85rem;">
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">Birds Count</div>
              <div style="font-weight: 700;">${f.currentQty} / ${f.initialQty}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">Mortality Rate</div>
              <div style="font-weight: 700; color: ${mortalityPct > 5 ? '#ef4444' : '#10b981'};">${mortalityCount} (${mortalityPct}%)</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  if (tableBody) {
    tableBody.innerHTML = flocks.map(f => {
      const mortalityCount = f.initialQty - f.currentQty;
      return `
        <tr>
          <td><b style="color: var(--emerald-primary);">${f.id}</b></td>
          <td><b>${f.name}</b><br><small style="color: var(--text-muted);">${f.breed} (${f.houseNo})</small></td>
          <td>${formatDate(f.startDate)}</td>
          <td><b>${f.ageDays} Days</b></td>
          <td>${f.initialQty}</td>
          <td><b style="color: var(--emerald-primary);">${f.currentQty}</b></td>
          <td><span class="badge ${mortalityCount > 50 ? 'badge-danger' : 'badge-warning'}">${mortalityCount}</span></td>
          <td><span class="badge ${f.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${f.status}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="window.deleteFlock('${f.id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function showAddFlockModal() {
  let modal = document.getElementById('add-flock-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'add-flock-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 style="font-weight: 700;">🐣 Register New Flock Batch</h3>
        <button class="modal-close-btn">&times;</button>
      </div>
      <form id="flock-form">
        <div class="form-group">
          <label class="form-label">Batch Name / Title</label>
          <input type="text" id="flock-name" class="form-input" placeholder="e.g. Batch 104 - Layer Hyline" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Breed</label>
            <input type="text" id="flock-breed" class="form-input" placeholder="e.g. Sonali Classic" required>
          </div>
          <div class="form-group">
            <label class="form-label">Shed / House No</label>
            <input type="text" id="flock-house" class="form-input" placeholder="e.g. Shed 4" required>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Initial Bird Count</label>
            <input type="number" id="flock-qty" class="form-input" placeholder="2000" min="1" required>
          </div>
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="date" id="flock-date" class="form-input" value="${new Date().toISOString().slice(0,10)}" required>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Save Flock Batch</button>
      </form>
    </div>
  `;

  showModal('add-flock-modal');

  document.getElementById('flock-form').onsubmit = (e) => {
    e.preventDefault();
    const newFlock = {
      id: `FL-${Date.now().toString().slice(-4)}`,
      name: document.getElementById('flock-name').value,
      breed: document.getElementById('flock-breed').value,
      houseNo: document.getElementById('flock-house').value,
      initialQty: Number(document.getElementById('flock-qty').value),
      currentQty: Number(document.getElementById('flock-qty').value),
      startDate: document.getElementById('flock-date').value,
      ageDays: 1,
      status: 'Active'
    };

    store.addItem('flocks', newFlock);
    showToast('Flock batch added successfully!');
    hideModal('add-flock-modal');
  };
}

window.deleteFlock = (id) => {
  if (confirm('Are you sure you want to delete this flock batch?')) {
    store.deleteItem('flocks', id);
    showToast('Flock batch removed');
  }
};

// --------------------------------------------------------------------------
// 2. Khamari Daily Entry Logger View
// --------------------------------------------------------------------------
function renderKhamariView() {
  const container = document.getElementById('khamari-view');
  if (!container) return;

  const activeFlocks = store.get('flocks')?.filter(f => f.status === 'Active') || [];

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
      <div>
        <h2 style="font-weight: 800; font-size: 1.4rem;">🥚 Khamari Daily Production Logger</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Record daily egg collection, feed intake, mortality, and shed observations.</p>
      </div>
      <button id="add-khamari-log-btn" class="btn btn-gold">
        <span>+</span> Log Today's Entry
      </button>
    </div>

    <!-- Daily Logs Table -->
    <div class="glass-card">
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Flock Batch</th>
              <th>Good Eggs</th>
              <th>Damaged Eggs</th>
              <th>Feed Consumed (Bags)</th>
              <th>Mortality</th>
              <th>Temp (°C)</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="khamari-logs-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-khamari-log-btn')?.addEventListener('click', showAddKhamariLogModal);
  renderKhamariTable();
}

function renderKhamariTable() {
  const tbody = document.getElementById('khamari-logs-tbody');
  if (!tbody) return;

  const logs = store.get('khamariLogs') || [];
  const flocks = store.get('flocks') || [];

  tbody.innerHTML = logs.map(log => {
    const flock = flocks.find(f => f.id === log.flockId);
    return `
      <tr>
        <td><b>${formatDate(log.date)}</b></td>
        <td><b style="color: var(--emerald-primary);">${flock ? flock.name : log.flockId}</b></td>
        <td><b style="color: #34d399;">🥚 ${log.eggGood}</b></td>
        <td><span style="color: #f87171;">${log.eggDamaged}</span></td>
        <td><b>🌾 ${log.feedBags} Bags</b></td>
        <td><span class="badge ${log.mortality > 3 ? 'badge-danger' : 'badge-neutral'}">☠ ${log.mortality}</span></td>
        <td>${log.temperature || '28'}°C</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${log.notes || '-'}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="window.deleteKhamariLog('${log.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function showAddKhamariLogModal() {
  const flocks = store.get('flocks')?.filter(f => f.status === 'Active') || [];
  if (flocks.length === 0) {
    showToast('Please add an active flock batch first!', 'error');
    return;
  }

  let modal = document.getElementById('add-khamari-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'add-khamari-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 style="font-weight: 700;">📝 Log Daily Production Entry</h3>
        <button class="modal-close-btn">&times;</button>
      </div>
      <form id="khamari-log-form">
        <div class="form-group">
          <label class="form-label">Select Active Flock</label>
          <select id="khamari-flock-select" class="form-select" required>
            ${flocks.map(f => `<option value="${f.id}">${f.name} (${f.currentQty} Birds)</option>`).join('')}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="khamari-date" class="form-input" value="${new Date().toISOString().slice(0,10)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Feed Consumed (Bags)</label>
            <input type="number" step="0.5" id="khamari-feed" class="form-input" placeholder="4.5" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Good Eggs Collected</label>
            <input type="number" id="khamari-egg-good" class="form-input" value="0" min="0" required>
          </div>
          <div class="form-group">
            <label class="form-label">Damaged Eggs</label>
            <input type="number" id="khamari-egg-damaged" class="form-input" value="0" min="0" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Mortality (Bird Count)</label>
            <input type="number" id="khamari-mortality" class="form-input" value="0" min="0" required>
          </div>
          <div class="form-group">
            <label class="form-label">Shed Temp (°C)</label>
            <input type="number" id="khamari-temp" class="form-input" value="28">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Remarks / Notes</label>
          <input type="text" id="khamari-notes" class="form-input" placeholder="e.g. Vaccination given today">
        </div>

        <button type="submit" class="btn btn-gold" style="width: 100%; margin-top: 1rem;">Save Production Log</button>
      </form>
    </div>
  `;

  showModal('add-khamari-modal');

  document.getElementById('khamari-log-form').onsubmit = (e) => {
    e.preventDefault();
    const flockId = document.getElementById('khamari-flock-select').value;
    const eggGood = Number(document.getElementById('khamari-egg-good').value) || 0;
    const feedBags = Number(document.getElementById('khamari-feed').value) || 0;
    const mortality = Number(document.getElementById('khamari-mortality').value) || 0;

    const newLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      flockId,
      date: document.getElementById('khamari-date').value,
      eggGood,
      eggDamaged: Number(document.getElementById('khamari-egg-damaged').value) || 0,
      feedBags,
      mortality,
      temperature: Number(document.getElementById('khamari-temp').value) || 28,
      notes: document.getElementById('khamari-notes').value
    };

    // 1. Add Log
    store.addItem('khamariLogs', newLog);

    // 2. Update Flock Current Bird Count
    const flock = store.get('flocks').find(f => f.id === flockId);
    if (flock && mortality > 0) {
      store.updateItem('flocks', flockId, {
        currentQty: Math.max(0, flock.currentQty - mortality)
      });
    }

    // 3. Auto-add Egg Crates to Inventory Stock (PRD-003)
    if (eggGood > 0) {
      const eggProduct = store.get('products').find(p => p.id === 'PRD-003');
      if (eggProduct) {
        const addedCrates = Math.floor(eggGood / 30);
        if (addedCrates > 0) {
          store.updateItem('products', eggProduct.id, {
            stock: eggProduct.stock + addedCrates
          });
        }
      }
    }

    showToast('Daily log saved! Inventory and bird counts updated.');
    hideModal('add-khamari-modal');
  };
}

window.deleteKhamariLog = (id) => {
  if (confirm('Delete this daily log record?')) {
    store.deleteItem('khamariLogs', id);
    showToast('Log removed');
  }
};
