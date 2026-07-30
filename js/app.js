/* ==========================================================================
   AKHI POULTRY FARM - SMART POS & FARM MANAGEMENT SYSTEM 4.0
   Application Controller, Navigation Router, & Global Utilities
   ========================================================================== */

import { store } from './store.js';

// Initialize App Controller
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHeaderClock();
  initGlobalShortcuts();
  initBackupHandlers();

  // Initial State Render
  store.subscribe((state) => {
    updateHeaderStats(state);
  });

  updateHeaderStats(store.state);
});

// --------------------------------------------------------------------------
// Navigation & View Router
// --------------------------------------------------------------------------
export function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.getElementById('menu-toggle');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      viewSections.forEach(sec => sec.classList.remove('active'));
      const activeSec = document.getElementById(targetView);
      if (activeSec) {
        activeSec.classList.add('active');
        
        // Dynamic title update
        const titleEl = document.getElementById('current-page-title');
        if (titleEl) {
          const text = item.querySelector('span')?.innerText || 'Dashboard';
          titleEl.innerText = text;
        }

        // Trigger view-specific render hooks
        window.dispatchEvent(new CustomEvent('view-changed', { detail: { viewId: targetView } }));
      }

      // Close mobile sidebar if open
      if (window.innerWidth <= 768) {
        sidebar?.classList.remove('open');
      }
    });
  });

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
    });
  }
}

export function showView(viewId) {
  const targetNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (targetNav) targetNav.click();
}

// --------------------------------------------------------------------------
// Header Real-time Clock & System Status
// --------------------------------------------------------------------------
function initHeaderClock() {
  const clockEl = document.getElementById('header-clock');
  function tick() {
    if (clockEl) {
      const now = new Date();
      clockEl.innerText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' | ' + now.toLocaleDateString();
    }
  }
  tick();
  setInterval(tick, 1000);
}

function updateHeaderStats(state) {
  const activeFlocks = state.flocks.filter(f => f.status === 'Active').length;
  const lowStockItems = state.products.filter(p => p.stock <= p.minStock).length;

  const flockBadge = document.getElementById('flock-count-badge');
  if (flockBadge) flockBadge.innerText = `${activeFlocks} Active Flocks`;

  const stockBadge = document.getElementById('stock-alert-badge');
  if (stockBadge) {
    stockBadge.innerText = `${lowStockItems} Low Stock Alerts`;
    stockBadge.style.color = lowStockItems > 0 ? '#ef4444' : '#10b981';
  }
}

// --------------------------------------------------------------------------
// Toast & Modal Utilities
// --------------------------------------------------------------------------
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function showModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('active');
}

export function hideModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

// Attach modal close buttons globally
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-close-btn') || e.target.classList.contains('modal-overlay')) {
    const modal = e.target.closest('.modal-overlay');
    if (modal) modal.classList.remove('active');
  }
});

// --------------------------------------------------------------------------
// Formatting Helpers
// --------------------------------------------------------------------------
export function formatCurrency(amount) {
  const symbol = store.state.settings?.currency || '৳';
  const val = Number(amount) || 0;
  return `${symbol} ${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// --------------------------------------------------------------------------
// Keyboard Shortcuts Listener
// --------------------------------------------------------------------------
function initGlobalShortcuts() {
  window.addEventListener('keydown', (e) => {
    // F2 to navigate to POS view
    if (e.key === 'F2') {
      e.preventDefault();
      showView('pos-view');
      showToast('POS Register Activated (F2)', 'info');
    }
    // Esc to close open modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}

// --------------------------------------------------------------------------
// Backup & CSV Export Engine
// --------------------------------------------------------------------------
function initBackupHandlers() {
  window.exportFarmData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(store.exportBackup());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Akhi_Farm_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Farm backup downloaded successfully!');
  };

  window.triggerImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const success = store.importBackup(evt.target.result);
          if (success) {
            showToast('Backup restored successfully!');
            setTimeout(() => location.reload(), 1000);
          } else {
            showToast('Failed to parse backup file', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
}

export function exportTableToCSV(filename, rows) {
  let csvContent = "data:text/csv;charset=utf-8,";
  rows.forEach(rowArray => {
    let row = rowArray.map(item => `"${(item + '').replace(/"/g, '""')}"`).join(",");
    csvContent += row + "\r\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
