/* ==========================================================================
   AKHI POULTRY FARM - SMART POS & FARM MANAGEMENT SYSTEM 4.0
   Executive Analytics Dashboard & Visual Performance Charts
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, formatDate, showView } from '../app.js';

export function initAnalyticsModule() {
  renderDashboardView();
  renderAnalyticsView();

  store.subscribe(() => {
    renderDashboardView();
    renderAnalyticsView();
  });

  window.addEventListener('view-changed', (e) => {
    if (e.detail.viewId === 'dashboard-view') renderDashboardView();
    if (e.detail.viewId === 'analytics-view') renderAnalyticsView();
  });
}

// --------------------------------------------------------------------------
// 1. Dashboard Main View
// --------------------------------------------------------------------------
function renderDashboardView() {
  const container = document.getElementById('dashboard-view');
  if (!container) return;

  const state = store.state;
  const sales = state.sales || [];
  const acc = state.accounting || [];
  const flocks = state.flocks || [];
  const khamari = state.khamariLogs || [];

  // KPI Calculations
  const totalRevenue = sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalIncome = acc.filter(a => a.type === 'Income').reduce((sum, a) => sum + a.amount, 0);
  const totalExpense = acc.filter(a => a.type === 'Expense').reduce((sum, a) => sum + a.amount, 0);
  const netProfit = (totalRevenue + totalIncome) - totalExpense;

  const activeBirds = flocks.filter(f => f.status === 'Active').reduce((sum, f) => sum + f.currentQty, 0);
  
  // Egg Yield Today
  const latestLog = khamari[0] || {};
  const todayEggs = latestLog.eggGood || 0;

  container.innerHTML = `
    <!-- Top Executive KPIs -->
    <div class="kpi-grid">
      <div class="glass-card kpi-card">
        <div class="kpi-icon emerald">💵</div>
        <div>
          <div class="kpi-label">Total Sales Revenue</div>
          <div class="kpi-val">${formatCurrency(totalRevenue)}</div>
        </div>
      </div>

      <div class="glass-card kpi-card">
        <div class="kpi-icon gold">📊</div>
        <div>
          <div class="kpi-label">Estimated Net Profit</div>
          <div class="kpi-val" style="color: ${netProfit >= 0 ? '#34d399' : '#f87171'};">${formatCurrency(netProfit)}</div>
        </div>
      </div>

      <div class="glass-card kpi-card">
        <div class="kpi-icon blue">🐔</div>
        <div>
          <div class="kpi-label">Active Farm Flock Count</div>
          <div class="kpi-val">${activeBirds.toLocaleString()} Birds</div>
        </div>
      </div>

      <div class="glass-card kpi-card">
        <div class="kpi-icon purple">🥚</div>
        <div>
          <div class="kpi-label">Daily Egg Production</div>
          <div class="kpi-val">${todayEggs.toLocaleString()} Eggs</div>
        </div>
      </div>
    </div>

    <!-- Quick Action Launchpad -->
    <div class="glass-card" style="margin-bottom: 1.5rem;">
      <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>🚀</span> Quick Action Launchpad
      </h3>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="window.navigateToView('pos-view')">⚡ Open POS Register (F2)</button>
        <button class="btn btn-gold" onclick="window.navigateToView('khamari-view')">📝 Log Daily Production</button>
        <button class="btn btn-secondary" onclick="window.navigateToView('feed-gura-mgmt-view')">🌾 Formulate Feed</button>
        <button class="btn btn-secondary" onclick="window.navigateToView('customers-view')">💳 Receive Customer Due</button>
      </div>
    </div>

    <!-- Charts & Analytics Preview -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
      <!-- Recent POS Transactions -->
      <div class="glass-card">
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem;">Recent Sales Transactions</h3>
        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              ${sales.slice(0, 5).map(s => `
                <tr>
                  <td><b>${s.id}</b></td>
                  <td>${s.customerName}</td>
                  <td><b style="color: var(--emerald-primary);">${formatCurrency(s.grandTotal)}</b></td>
                  <td><span class="badge badge-success">${s.paymentMethod}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Active Shed Status Summary -->
      <div class="glass-card">
        <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem;">Active Shed Status</h3>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${flocks.filter(f => f.status === 'Active').map(f => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(15,23,42,0.6); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div>
                <div style="font-weight: 700;">${f.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${f.breed} (${f.houseNo}) • Age ${f.ageDays} Days</div>
              </div>
              <div style="text-align: right;">
                <b style="color: var(--emerald-primary); font-size: 1.1rem;">${f.currentQty}</b>
                <div style="font-size: 0.65rem; color: var(--text-muted);">Birds Remaining</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

window.navigateToView = (viewId) => {
  showView(viewId);
};

// --------------------------------------------------------------------------
// 2. Full Analytics & Reports View
// --------------------------------------------------------------------------
function renderAnalyticsView() {
  const container = document.getElementById('analytics-view');
  if (!container) return;

  const state = store.state;
  const sales = state.sales || [];
  const acc = state.accounting || [];

  container.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <h2 style="font-weight: 800; font-size: 1.4rem;">📈 Farm Business Intelligence & Analytics</h2>
      <p style="font-size: 0.85rem; color: var(--text-muted);">Comprehensive financial summaries, egg production yield metrics, and mortality ratios.</p>
    </div>

    <!-- Profit & Loss Statement Card -->
    <div class="glass-card" style="margin-bottom: 1.5rem;">
      <h3 style="font-weight: 700; font-size: 1.2rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
        Income & Expense Financial Statement
      </h3>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div>
          <h4 style="color: #34d399; font-weight: 700; margin-bottom: 0.5rem;">Total Revenue & Inflows</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between;">
              <span>POS Sales Invoices:</span>
              <b>${formatCurrency(sales.reduce((sum, s) => sum + s.grandTotal, 0))}</b>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Other Farm Income:</span>
              <b>${formatCurrency(acc.filter(a => a.type === 'Income').reduce((sum, a) => sum + a.amount, 0))}</b>
            </div>
          </div>
        </div>

        <div>
          <h4 style="color: #f87171; font-weight: 700; margin-bottom: 0.5rem;">Operating Expenses & Outflows</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between;">
              <span>Feed & Medicine Expenses:</span>
              <b>${formatCurrency(acc.filter(a => a.type === 'Expense').reduce((sum, a) => sum + a.amount, 0))}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
