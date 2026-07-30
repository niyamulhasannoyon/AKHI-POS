import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, writeBatch, serverTimestamp, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Global State
let db, auth, appId, userId;
let products = [], customers = [], sales = [], cart = [], khamars = [], chickenSales = [], feedEntries = [], purchases = [], khamariEntries = [], feedGuraEntries = [];
let accountingEntries = [], expenditures = [], installments = [], employees = [], quotations = [], filesData = [];
let reportFilter = { start: '', end: '', customer: '' };
let khamarFilter = { start: '', end: '', khamarName: 'ALL' };
let purchaseFilter = { start: '', end: '' };

let productsCollection, customersCollection, salesCollection, khamarsCollection, chickenSalesCollection, feedCollection, purchaseCollection, khamariCollection, feedGuraCollection;
let accountingCollection, expendituresCollection, installmentsCollection, employeesCollection, quotationsCollection, filesDataCollection;

let productSales = {};
let customerLedger = {};

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showView('loading-view');

    try {
        const firebaseConfig = {
            apiKey: "AIzaSyA-Gbm1uvovUY57yky6tEAOGZyqueYtMtE",
            authDomain: "akhi-poultry-feed.firebaseapp.com",
            projectId: "akhi-poultry-feed",
            storageBucket: "akhi-poultry-feed.firebasestorage.app",
            messagingSenderId: "123815603397",
            appId: "1:123815603397:web:f27ee8138767ea03bc94ac"
        };
        appId = firebaseConfig.projectId || 'default-app-id';
        const app = initializeApp(firebaseConfig);
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        });
        auth = getAuth(app);
        handleAuthentication();
    } catch (error) {
        console.error("Firebase Error: ", error);
        document.getElementById('loading-text').innerText = "Error loading app.";
    }
});

async function handleAuthentication() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            document.getElementById('user-id-display').innerText = user.email;
            await initializeFirestoreListeners();
            showView('pos-view');
        } else {
            document.getElementById('user-id-display').innerText = "Not Logged In";
            showView('login-view');
        }
    });
}

async function initializeFirestoreListeners() {
    try {
        const basePath = `artifacts/${appId}/users/${userId}`;
        productsCollection = collection(db, `${basePath}/products`);
        customersCollection = collection(db, `${basePath}/customers`);
        salesCollection = collection(db, `${basePath}/sales`);
        khamarsCollection = collection(db, `${basePath}/khamars`);
        chickenSalesCollection = collection(db, `${basePath}/chicken_sales`);
        feedCollection = collection(db, `${basePath}/feed_entries`);
        purchaseCollection = collection(db, `${basePath}/shop_purchases`);
        khamariCollection = collection(db, `${basePath}/khamari_entries`);
        accountingCollection = collection(db, `${basePath}/accounting`);
        expendituresCollection = collection(db, `${basePath}/expenditures`);
        installmentsCollection = collection(db, `${basePath}/installments`);
        employeesCollection = collection(db, `${basePath}/employees`);
        quotationsCollection = collection(db, `${basePath}/quotations`);
        filesDataCollection = collection(db, `${basePath}/files_data`);
        feedGuraCollection = collection(db, `${basePath}/feed_gura_mgmt`);

        // Optimized: Debounce rendering to prevent UI freeze on initial load
        let debounceTimer;
        const debounceRender = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                updateGlobalState();
            }, 100);
        };

        const sanitizeDoc = (doc) => {
            const escapeStr = (str) => {
                if (typeof str !== 'string') return str;
                return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
            };
            const sanitizeObj = (obj) => {
                if (typeof obj === 'string') return escapeStr(obj);
                if (Array.isArray(obj)) return obj.map(sanitizeObj);
                if (obj !== null && typeof obj === 'object') {
                    if (obj.toDate) return obj; // keep firebase timestamps
                    const newObj = {};
                    for (const k in obj) newObj[k] = sanitizeObj(obj[k]);
                    return newObj;
                }
                return obj;
            };
            return { id: doc.id, ...sanitizeObj(doc.data()) };
        };

        onSnapshot(query(productsCollection), (snapshot) => {
            try {
                products = snapshot.docs.map(sanitizeDoc).sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
                renderProductGrid();
                renderInventoryTable();
                renderPurchaseTable();
                debounceRender();
            } catch (e) { console.error("Error processing products:", e); }
        });
        onSnapshot(query(customersCollection), (snapshot) => {
            try {
                customers = snapshot.docs.map(sanitizeDoc).sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
                renderCustomerDropdown();
                renderCustomersTable();
                debounceRender();
            } catch (e) { console.error("Error processing customers:", e); }
        });
        onSnapshot(query(salesCollection), (snapshot) => {
            try {
                sales = snapshot.docs.map(sanitizeDoc);
                renderReportsTable();
                debounceRender();
            } catch (e) { console.error("Error processing sales:", e); }
        });
        onSnapshot(query(khamarsCollection), (snapshot) => {
            try {
                khamars = snapshot.docs.map(sanitizeDoc).sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
                renderKhamarUI();
                if (typeof renderKhamariTable === 'function') renderKhamariTable();
                if (typeof renderFeedGuraTable === 'function') renderFeedGuraTable();
                debounceRender();
            } catch (e) { console.error("Error processing khamars:", e); }
        });
        onSnapshot(query(chickenSalesCollection), (snapshot) => {
            try {
                chickenSales = snapshot.docs.map(sanitizeDoc);
                renderChickenSalesTable();
                debounceRender();
            } catch (e) { console.error("Error processing chicken sales:", e); }
        });
        onSnapshot(query(feedCollection), (snapshot) => {
            try {
                feedEntries = snapshot.docs.map(sanitizeDoc);
                renderFeedTable();
                renderFeedLedger();
                debounceRender();
            } catch (e) { console.error("Error processing feed entries:", e); }
        });
        onSnapshot(query(purchaseCollection), (snapshot) => {
            try {
                purchases = snapshot.docs.map(sanitizeDoc);
                renderPurchaseTable();
                debounceRender();
            } catch (e) { console.error("Error processing purchases:", e); }
        });

        onSnapshot(query(accountingCollection), (snapshot) => { try { accountingEntries = snapshot.docs.map(sanitizeDoc); if (typeof renderAccountingUI === 'function') renderAccountingUI(); } catch (e) { } });
        onSnapshot(query(expendituresCollection), (snapshot) => { try { expenditures = snapshot.docs.map(sanitizeDoc); if (typeof renderExpenditureUI === 'function') renderExpenditureUI(); } catch (e) { } });
        onSnapshot(query(installmentsCollection), (snapshot) => { try { installments = snapshot.docs.map(sanitizeDoc); if (typeof renderInstallmentsUI === 'function') renderInstallmentsUI(); } catch (e) { } });
        onSnapshot(query(employeesCollection), (snapshot) => { try { employees = snapshot.docs.map(sanitizeDoc); if (typeof renderEmployeeUI === 'function') renderEmployeeUI(); } catch (e) { } });
        onSnapshot(query(quotationsCollection), (snapshot) => { try { quotations = snapshot.docs.map(sanitizeDoc); if (typeof renderQuotationsUI === 'function') renderQuotationsUI(); } catch (e) { } });
        onSnapshot(query(filesDataCollection), (snapshot) => { try { filesData = snapshot.docs.map(sanitizeDoc); if (typeof renderFilesUI === 'function') renderFilesUI(); } catch (e) { } });

        onSnapshot(query(khamariCollection), (snapshot) => {
            try {
                khamariEntries = snapshot.docs.map(sanitizeDoc);
                if (typeof renderKhamariTable === 'function') renderKhamariTable();
                debounceRender();
            } catch (e) { console.error("Error processing khamari entries:", e); }
        });
        onSnapshot(query(feedGuraCollection), (snapshot) => {
            try {
                feedGuraEntries = snapshot.docs.map(sanitizeDoc);
                if (typeof renderFeedGuraTable === 'function') renderFeedGuraTable();
                debounceRender();
            } catch (e) { console.error("Error processing feed gura management:", e); }
        });
    } catch (err) {
        console.error("Critical error in listeners:", err);
    }
}

function updateGlobalState() {
    try {
        // Centralized update function
        calculateCustomerLedger();
        renderDashboardStats();
        calculateProductSalesReport();

        if (document.getElementById('dashboard-view') && !document.getElementById('dashboard-view').classList.contains('hidden')) {
            if (typeof renderDashboardChart === 'function') renderDashboardChart();
            if (typeof checkInventoryAlerts === 'function') checkInventoryAlerts();
        }
    } catch (error) {
        console.error("Error updating global state:", error);
    }
}

window.generatePDF = function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let data = sales.filter(s => {
        const matchesDate = isDateInRange(s.timestamp, reportFilter.start, reportFilter.end);
        const cust = customers.find(c => c.id === s.customerId);
        const custName = cust ? cust.name.toLowerCase() : 'walk-in customer';
        const matchesCustomer = reportFilter.customer === '' || custName.includes(reportFilter.customer);
        return matchesDate && matchesCustomer;
    });
    data.sort((a, b) => b.timestamp - a.timestamp);

    doc.setFontSize(18);
    doc.setTextColor(4, 120, 87);
    doc.text("AKHI POULTRY FARM 2.0", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Prop: Md. Sadikul Islam | 01732-281710", 14, 20);
    doc.text("Chapainawabganj", 14, 24);
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text("Sales Report", 14, 32);

    let dateText = "All Time";
    if (reportFilter.start && reportFilter.end) dateText = `${reportFilter.start} to ${reportFilter.end}`;
    else if (reportFilter.start) dateText = `From ${reportFilter.start}`;
    doc.setFontSize(10);
    doc.text(`Period: ${dateText}`, 14, 38);

    let totalAmount = 0;
    const tableRows = data.map(s => {
        const date = s.timestamp ? new Date(s.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '-';
        const cust = customers.find(c => c.id === s.customerId);
        const custName = cust ? cust.name : 'Walk-in';
        const itemsCount = s.items.reduce((acc, i) => acc + i.quantity, 0);
        totalAmount += s.totalAmount;
        return [date, s.id, custName, itemsCount, s.status.toUpperCase(), s.totalAmount.toFixed(2)];
    });

    doc.autoTable({
        startY: 42,
        head: [['Date', 'Sale ID', 'Customer', 'Items', 'Status', 'Total (Tk)']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105] },
        styles: { fontSize: 8 },
        foot: [['', '', '', '', 'GRAND TOTAL', totalAmount.toFixed(2)]],
        footStyles: { fillColor: [240, 253, 244], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    doc.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

function showView(viewId) {
    document.querySelectorAll('.main-view').forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    document.getElementById('mobile-sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay')?.classList.add('hidden');
}
function toggleMobileSidebar() {
    document.getElementById('mobile-sidebar').classList.toggle('-translate-x-full');
    document.getElementById('sidebar-overlay')?.classList.toggle('hidden');
}
function showModal(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); }
function hideModal(id) { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); }
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast-notification');
    t.innerText = msg;
    t.className = `fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`;
    t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 3000);
}

function isDateInRange(timestamp, start, end) {
    if (!timestamp) return false;
    const date = new Date(timestamp.seconds * 1000);
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    if (s) s.setHours(0, 0, 0, 0);
    if (e) e.setHours(23, 59, 59, 999);
    if (s && date < s) return false;
    if (e && date > e) return false;
    return true;
}

function renderDashboardStats() {
    const rev = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    document.getElementById('stat-revenue').innerText = `৳${rev.toLocaleString()}`;
    document.getElementById('stat-sales').innerText = sales.length;
    document.getElementById('stat-products').innerText = products.length;
    document.getElementById('stat-customers').innerText = customers.length;
}

function renderProductGrid() {
    const grid = document.getElementById('product-grid');
    const search = document.getElementById('product-search').value.toLowerCase();
    grid.innerHTML = '';
    const filtered = products.filter(p => p.name.toLowerCase().includes(search));
    if (filtered.length === 0) return grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-500">No products found</div>`;

    filtered.forEach(p => {
        const isOut = p.stock <= 0;
        grid.innerHTML += `
                    <div class="glass-card p-4 cursor-pointer relative ${isOut ? 'opacity-50 grayscale' : ''}" data-id="${p.id}">
                        <h3 class="font-bold text-white truncate text-lg">${p.name}</h3>
                        <p class="text-sm text-emerald-200/70 font-mono mb-0.5">${p.unit || ''}</p>
                        <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-3">${p.company || 'Generic'}</p>
                        <span class="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full ${isOut ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                            ${isOut ? 'Out Stock' : p.stock}
                        </span>
                        <div class="mt-2 flex justify-between items-end">
                            <p class="text-xl font-bold text-emerald-400">৳${p.price}</p>
                            <div class="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg btn-touch hover:scale-105 transition-transform">+</div>
                        </div>
                    </div>`;
    });
}

function renderCustomerSearchResults() {
    const input = document.getElementById('customer-search-input');
    const container = document.getElementById('customer-search-results');
    const val = input.value.toLowerCase();

    container.innerHTML = `<div class="p-4 hover:bg-white/5 cursor-pointer text-sm text-emerald-400 font-bold border-b border-white/5 flex items-center gap-2 transition-colors" onclick="selectCustomer('walk-in', 'Walk-in Customer')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Walk-in Customer
            </div>`;

    customers.filter(c => c.name.toLowerCase().includes(val) || c.phone.includes(val)).forEach(c => {
        const initial = c.name.charAt(0).toUpperCase();
        container.innerHTML += `
                <div class="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 group transition-all flex justify-between items-center" onclick="selectCustomer('${c.id}', '${c.name} (${c.phone})')">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">
                            ${initial}
                        </div>
                        <div>
                            <div class="font-bold text-gray-200 group-hover:text-white transition-colors">${c.name}</div>
                            <div class="text-[10px] text-gray-500 font-mono group-hover:text-gray-400">${c.phone}</div>
                        </div>
                    </div>
                    <svg class="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </div>`;
    });
    container.classList.remove('hidden');
}

window.selectCustomer = function (id, name) {
    document.getElementById('cart-customer-id').value = id;
    document.getElementById('customer-search-input').value = name;
    document.getElementById('customer-search-results').classList.add('hidden');
}

function renderCustomerDropdown() {
    if (document.getElementById('customer-search-input').value) renderCustomerSearchResults();
}

function renderBuyerSuggestions() {
    const input = document.getElementById('sale-buyer-name');
    const container = document.getElementById('sale-buyer-results');
    const val = input.value.toLowerCase().trim();

    if (!val) { container.classList.add('hidden'); return; }

    container.innerHTML = '';
    const matches = customers.filter(c => c.name.toLowerCase().includes(val));

    if (matches.length > 0) {
        matches.forEach(c => {
            container.innerHTML += `<div class="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b" onclick="selectBuyer('${c.name}')">${c.name} <span class="text-xs text-gray-400">(${c.phone})</span></div>`;
        });
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

window.selectBuyer = function (name) {
    document.getElementById('sale-buyer-name').value = name;
    document.getElementById('sale-buyer-results').classList.add('hidden');
}

// --- NEW: Smart Suggestions for Purchase View ---
function renderPurchaseItemSuggestions() {
    const input = document.getElementById('purchase-item-name');
    const container = document.getElementById('purchase-item-results');
    const val = input.value.toLowerCase().trim();

    if (!val) { container.classList.add('hidden'); return; }

    // Unique items from purchases
    const uniqueItems = [...new Set(purchases.map(p => p.itemName))].filter(name => name.toLowerCase().includes(val));

    if (uniqueItems.length > 0) {
        container.innerHTML = '';
        uniqueItems.forEach(name => {
            container.innerHTML += `<div class="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b" onclick="selectPurchaseItem('${name}')">${name}</div>`;
        });
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function renderPurchaseSupplierSuggestions() {
    const input = document.getElementById('purchase-supplier');
    const container = document.getElementById('purchase-supplier-results');
    const val = input.value.toLowerCase().trim();

    if (!val) { container.classList.add('hidden'); return; }

    const uniqueSuppliers = [...new Set(purchases.map(p => p.supplier).filter(s => s))].filter(name => name.toLowerCase().includes(val));

    if (uniqueSuppliers.length > 0) {
        container.innerHTML = '';
        uniqueSuppliers.forEach(name => {
            container.innerHTML += `<div class="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b" onclick="selectPurchaseSupplier('${name}')">${name}</div>`;
        });
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

window.selectPurchaseItem = function (name) {
    document.getElementById('purchase-item-name').value = name;
    document.getElementById('purchase-item-results').classList.add('hidden');
}

window.selectPurchaseSupplier = function (name) {
    document.getElementById('purchase-supplier').value = name;
    document.getElementById('purchase-supplier-results').classList.add('hidden');
}
// -----------------------------------------------

function renderCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    if (cart.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center justify-center h-32 text-gray-500 text-sm"><p>Cart is empty</p></div>`;
    } else {
        cart.forEach(item => {
            container.innerHTML += `
                        <div class="flex justify-between items-center p-3 glass-card border border-white/5 rounded-xl mb-2 hover:bg-white/5 transition-colors group">
                            <div class="flex-1">
                                <h4 class="font-bold text-gray-200 text-sm truncate w-32 group-hover:text-emerald-400 transition-colors">${item.name}</h4>
                                <p class="text-xs text-gray-500">৳${item.price} x ${item.quantity}</p>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div class="flex items-center border border-white/10 rounded-lg overflow-hidden bg-gray-900/50">
                                    <button class="px-3 py-1 text-gray-400 hover:text-white hover:bg-white/10 btn-touch transition-colors" onclick="changeQty('${item.id}', -1)">-</button>
                                    <input type="number" value="${item.quantity}" class="w-8 text-center text-sm bg-transparent border-none outline-none text-white cart-qty font-mono" data-id="${item.id}" readonly>
                                    <button class="px-3 py-1 text-gray-400 hover:text-white hover:bg-white/10 btn-touch transition-colors" onclick="changeQty('${item.id}', 1)">+</button>
                                </div>
                                <span class="font-bold text-sm w-16 text-right text-emerald-400 font-mono">৳${item.price * item.quantity}</span>
                                <button class="text-red-400 hover:text-red-300 remove-cart p-2 bg-red-500/10 rounded hover:bg-red-500/20 transition-colors" data-id="${item.id}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                            </div>
                        </div>`;
        });
    }
    const sub = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
    const disc = parseFloat(document.getElementById('cart-discount').value) || 0;
    document.getElementById('cart-subtotal').innerText = `৳${sub}`;
    document.getElementById('cart-total').innerText = `৳${Math.max(0, sub - disc)}`;
    document.getElementById('charge-btn').disabled = cart.length === 0;
}

window.changeQty = function (id, delta) {
    const item = cart.find(x => x.id === id);
    if (item) {
        const p = products.find(x => x.id === id);
        let newVal = item.quantity + delta;
        if (newVal > p.stock) { showToast('Stock Limit Reached', 'error'); newVal = p.stock; }
        if (newVal <= 0) cart = cart.filter(x => x.id !== id);
        else item.quantity = newVal;
        renderCart();
    }
}

window.openCustomerProfile = function (id) {
    const c = customers.find(x => x.id === id);
    if (!c) return;

    document.getElementById('profile-name').innerText = c.name;
    document.getElementById('profile-phone').innerText = c.phone;

    let totalBuy = 0;
    let totalPaid = 0;
    let history = [];

    // 1. Regular POS Sales
    const customerSales = sales.filter(s => s.customerId === id);
    customerSales.forEach(s => {
        totalBuy += s.totalAmount;
        if (s.status === 'paid') totalPaid += s.totalAmount;
        history.push({
            date: s.timestamp,
            type: 'Feed/Medicine Purchase',
            amount: s.totalAmount,
            status: s.status === 'paid' ? 'Paid' : 'Due',
            isCredit: s.status === 'paid'
        });
    });

    const cNameNorm = c.name.trim().toLowerCase();

    // 2. Chicken Sales
    const chickenBuys = chickenSales.filter(cs => {
        const buyerName = cs.customerName ? cs.customerName.trim().toLowerCase() : '';
        return buyerName === cNameNorm;
    });

    chickenBuys.forEach(cs => {
        if (cs.hiddenFromProfile) return;
        const amt = cs.totalAmount || 0;
        totalBuy += amt;

        const effectiveStatus = cs.status || 'due';
        const isPaid = effectiveStatus === 'paid';

        // Details string
        const details = `${cs.khamar || 'Unknown Farm'} - ${cs.quantity || 0}pc, ${cs.weight || 0}kg @ ${cs.rate}tk`;

        // Calculate Paid Amount
        let thisPaid = cs.paidAmount || 0;
        if (isPaid) thisPaid = Math.max(thisPaid, amt); // Assume full amount if marked paid

        totalPaid += thisPaid;

        if (isPaid && thisPaid >= amt) {
            // Fully Paid - Show as Paid (Green)
            history.push({
                id: cs.id,
                collection: 'chicken_sales',
                date: cs.timestamp,
                type: `[${details}]`,
                amount: amt,
                isCredit: true,
                status: 'paid'
            });
        } else {
            // Due - Show Sale (Red)
            history.push({
                id: cs.id,
                collection: 'chicken_sales',
                date: cs.timestamp,
                type: `[${details}]`,
                amount: amt,
                isCredit: false,
                status: 'due'
            });

            // If Partial Payment Exists
            if (thisPaid > 0) {
                history.push({
                    id: cs.id,
                    collection: 'chicken_sales',
                    date: cs.timestamp,
                    type: `Payment for Sell`,
                    amount: thisPaid,
                    isCredit: true,
                    status: 'paid'
                });
            }
        }
    });

    // 2b. Khamar Sales (If Profile is Farm Owner)
    // Check if this customer is a Farm owner
    // Note: khamars global must be available
    if (khamars.some(k => k.name.trim().toLowerCase() === cNameNorm)) {
        const farmSales = chickenSales.filter(cs => {
            const kn = cs.khamar ? cs.khamar.trim().toLowerCase() : '';
            return kn === cNameNorm;
        });

        farmSales.forEach(cs => {
            if (cs.hiddenFromProfile) return;

            const amt = cs.totalAmount || 0;
            let paid = cs.paidAmount || 0;
            if (cs.status === 'paid') paid = Math.max(paid, amt);

            totalPaid += paid; // Add to Total Paid (Income)

            const details = `${cs.customerName || 'Unknown'} - ${cs.quantity || 0}pc, ${cs.weight || 0}kg @ ${cs.rate}tk`;

            // Show in history
            if (cs.status === 'paid' && paid >= amt) {
                history.push({
                    id: cs.id, collection: 'chicken_sales', date: cs.timestamp,
                    type: `[${details}]`,
                    amount: amt, isCredit: true, status: 'paid'
                });
            } else {
                history.push({
                    id: cs.id, collection: 'chicken_sales', date: cs.timestamp,
                    type: `[${details}]`,
                    amount: amt, isCredit: false, status: 'due'
                });
                if (paid > 0) {
                    history.push({
                        id: cs.id, collection: 'chicken_sales', date: cs.timestamp,
                        type: `Payment for Farm Sell`,
                        amount: paid, isCredit: true, status: 'paid'
                    });
                }
            }
        });
    }

    // 3. Feed/Supply/Manual Entries
    const feedBuys = feedEntries.filter(fe => {
        const khamarName = fe.khamar ? fe.khamar.trim().toLowerCase() : '';
        return khamarName === cNameNorm;
    });

    feedBuys.forEach(fe => {
        if (fe.hiddenFromProfile) return;

        const custom = Array.isArray(fe.customFields) ? fe.customFields.reduce((a, b) => a + (b.cost || 0), 0) : 0;
        let cost = fe.cost || 0;

        // Recalculate cost if 0, to ensure Total Bought is accurate even if 'cost' field is missing/zero
        if (cost === 0) {
            cost = (fe.feedCost || 0) + (fe.guraCost || 0) + (fe.chickenCost || 0) +
                (fe.cleaningCost || 0) + (fe.vaccineCost || 0) + (fe.medicineCost || 0) + (fe.otherCost || 0) + custom;
        }

        const paid = fe.paidAmount || 0;

        totalBuy += cost;
        totalPaid += paid;

        // Bill (Debit)
        if (cost > 0) {
            let details = [];
            if (fe.feedCost) details.push(`Feed: ${fe.feedCost}`);
            if (fe.guraCost) details.push(`Gura: ${fe.guraCost}`);
            if (fe.chickenCost) details.push(`Ch: ${fe.chickenCost}`);
            if (fe.vaccineCost) details.push(`Vac: ${fe.vaccineCost}`);
            if (fe.medicineCost) details.push(`Med: ${fe.medicineCost}`);
            if (fe.cleaningCost) details.push(`Cln: ${fe.cleaningCost}`);
            if (fe.otherCost) details.push(`Oth: ${fe.otherCost}`);
            if (custom > 0) details.push(`Cus: ${custom}`); // Simplified for display

            history.push({
                id: fe.id,
                collection: 'feed_entries',
                date: fe.timestamp,
                type: `Farm Supply/Bill ${details.length ? '(' + details.join(', ') + ')' : ''}`,
                amount: cost,
                isCredit: false,
                status: 'due'
            });
        }

        // Payment (Credit)
        if (paid > 0) {
            history.push({
                id: fe.id,
                collection: 'feed_entries',
                date: fe.timestamp,
                type: 'Payment Received (Joma)',
                amount: paid,
                isCredit: true,
                status: 'paid'
            });
        }
    });

    history.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

    let historyHTML = '';
    history.forEach(h => {
        const d = h.date ? new Date(h.date.seconds * 1000).toLocaleDateString('en-GB') : '-';

        const amountClass = h.isCredit ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold';
        const sign = h.isCredit ? '+' : '-';

        // Action Buttons
        let actionBtn = '';
        if (h.collection === 'chicken_sales') {
            const isPaid = h.status === 'paid';
            actionBtn += `
                        <div class="inline-flex rounded-md shadow-sm opacity-90 scale-90 border border-white/10" role="group">
                            <button onclick="toggleTransactionStatus('${h.id}', '${h.collection}', 'due')" class="px-2 py-1 text-xs rounded-l-md transition-colors ${!isPaid ? 'bg-red-500/20 text-red-400 border-r border-red-500/30' : 'bg-gray-800 text-gray-400 border-r border-white/10 hover:bg-white/5'}">Due</button>
                            <button onclick="toggleTransactionStatus('${h.id}', '${h.collection}', 'paid')" class="px-2 py-1 text-xs rounded-r-md transition-colors ${isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400 hover:bg-white/5'}">Paid</button>
                        </div>`;
        }

        // Delete button logic: 
        // Only allow deleting feed entries easily (since they might be manual payments). 
        // Chicken sales deletion is handled by 'deleteTransaction' too but we might want to be careful.
        // The existing 'deleteTransaction' logic likely handles routing to collection.

        actionBtn += `<button onclick="deleteTransaction('${h.id}', '${h.collection}')" class="text-red-400 hover:text-red-300 font-bold px-2 ml-2 bg-red-500/10 rounded">×</button>`;

        historyHTML += `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td class="p-2 text-gray-500 text-xs">${d}</td>
                        <td class="p-2 text-sm leading-tight text-gray-300">${h.type}</td>
                        <td class="p-2 text-right font-mono ${amountClass}">${sign}৳${h.amount.toLocaleString()}</td>
                        <td class="p-2 text-right">${actionBtn}</td>
                    </tr>
                `;
    });

    const due = totalBuy - totalPaid;

    // Update Header Totals
    if (document.getElementById('profile-total-buy')) document.getElementById('profile-total-buy').innerText = `৳${totalBuy.toLocaleString()}`;
    if (document.getElementById('profile-total-paid')) document.getElementById('profile-total-paid').innerText = `৳${totalPaid.toLocaleString()}`;

    document.getElementById('profile-total-due').innerText = `৳${Math.abs(due).toLocaleString()}`;
    document.getElementById('profile-total-due').className = `text-2xl font-extrabold mt-1 ${due > 0 ? 'text-red-400' : 'text-emerald-400'}`;

    document.getElementById('profile-history-body').innerHTML = historyHTML || '<tr><td colspan="4" class="p-6 text-center text-gray-500 italic">No transaction history found</td></tr>';

    // Reset Inputs
    const mPaid = document.getElementById('manual-paid');
    if (mPaid) mPaid.value = '';

    // Set Default Date
    const mDate = document.getElementById('manual-date');
    if (mDate) mDate.valueAsDate = new Date();

    // Khamar Details Check
    const khamarMatch = khamars.find(k => k.name.trim().toLowerCase() === cNameNorm);
    let khamarHTML = '';

    if (khamarMatch) {
        const farmFeeds = feedEntries.filter(fe => fe.khamar === khamarMatch.name);
        let fCost = 0, gCost = 0, chCost = 0, clCost = 0, vCost = 0, oCost = 0, fPaid = 0, fDue = 0;

        farmFeeds.forEach(fe => {
            fCost += (fe.feedCost || 0);
            gCost += (fe.guraCost || 0);
            chCost += (fe.chickenCost || 0);
            clCost += (fe.cleaningCost || 0);
            vCost += (fe.vaccineCost || 0) + (fe.medicineCost || 0);

            const other = (fe.otherCost || 0);
            const custom = Array.isArray(fe.customFields) ? fe.customFields.reduce((a, b) => a + (b.cost || 0), 0) : 0;
            oCost += (other + custom);

            fPaid += (fe.paidAmount || 0);
            fDue += (fe.dueAmount || 0);
        });

        // Calculate Chicken Income for Farm Ledger
        const fSales = chickenSales.filter(cs => (cs.khamar ? cs.khamar.trim().toLowerCase() : '') === cNameNorm);
        let chickenIncome = 0;
        fSales.forEach(cs => {
            let p = cs.paidAmount || 0;
            if (cs.status === 'paid') p = Math.max(p, cs.totalAmount || 0);
            chickenIncome += p;
        });

        // Update Farm Due with Income
        // Total Farm Cost (Expenses) - Total Paid (Manual + Chicken Sales)
        const totalFarmCost = fCost + gCost + chCost + clCost + vCost + oCost;
        const totalFarmPaid = fPaid + chickenIncome;
        // Net Due: Positive = Debt (Red). Negative = Advance (Green).
        const netFarmDue = totalFarmCost - totalFarmPaid;

        // Color/Label logic
        const dueColorClass = netFarmDue > 0 ? 'text-red-400' : 'text-emerald-400';
        const dueBorderClass = netFarmDue > 0 ? 'border-red-500/50' : 'border-emerald-500/50';
        const dueLabel = netFarmDue > 0 ? 'Total Farm Advance (জমা)' : 'Total Farm Due (বাকি)';
        const absDue = Math.abs(netFarmDue);

        khamarHTML = `
                    <div class="mt-6 glass-card border border-orange-500/20 bg-orange-500/5 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                         <div class="absolute -right-4 -top-4 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/15 transition-all"></div>
                        <div class="flex justify-between items-start mb-4 relative z-10">
                            <h4 class="font-bold text-orange-400 text-lg flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                Farm Ledger Breakdown
                            </h4>
                            <span class="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded font-bold uppercase tracking-wide border border-orange-500/20">Verified Owner</span>
                        </div>
                        
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-4 relative z-10">
                            <div class="bg-white/5 p-2 rounded border border-orange-500/10 shadow-sm text-center">
                                <span class="block text-[10px] text-gray-500 uppercase">Feed Cost</span>
                                <span class="font-mono text-gray-300">৳${fCost}</span>
                            </div>
                            <div class="bg-white/5 p-2 rounded border border-orange-500/10 shadow-sm text-center">
                                <span class="block text-[10px] text-gray-500 uppercase">Gura Cost</span>
                                <span class="font-mono text-gray-300">৳${gCost}</span>
                            </div>
                            <div class="bg-white/5 p-2 rounded border border-orange-500/10 shadow-sm text-center">
                                <span class="block text-[10px] text-gray-500 uppercase">Meds/Vac</span>
                                <span class="font-mono text-gray-300">৳${vCost}</span>
                            </div>
                            <div class="bg-white/5 p-2 rounded border border-orange-500/10 shadow-sm text-center">
                                <span class="block text-[10px] text-gray-500 uppercase">Others</span>
                                <span class="font-mono text-gray-300">৳${oCost + chCost + clCost}</span>
                            </div>
                        </div>

                        <div class="flex justify-between items-center bg-gray-900/40 p-3 rounded-lg border border-white/5 relative z-10 backdrop-blur-sm">
                             <div>
                                 <span class="text-xs text-gray-400 block">Total Expenses</span>
                                 <span class="font-bold text-white text-lg">৳${totalFarmCost.toLocaleString()}</span>
                             </div>
                             <div>
                                 <span class="text-xs text-emerald-400 block text-right">Total Paid + Sales</span>
                                 <span class="font-bold text-emerald-400 text-lg">৳${totalFarmPaid.toLocaleString()}</span>
                             </div>
                        </div>

                         <div class="mt-3 text-center p-2 rounded border ${dueBorderClass} bg-gray-900/60 relative z-10">
                            <span class="text-xs text-gray-400 uppercase tracking-widest block mb-1">${dueLabel}</span>
                            <span class="text-2xl font-extrabold ${dueColorClass}">৳${absDue.toLocaleString()}</span>
                        </div>
                    </div>
                `;
    }

    document.getElementById('khamar-related-section').innerHTML = khamarHTML;
    document.getElementById('customer-profile-modal').classList.remove('hidden');
    document.getElementById('customer-profile-modal').classList.add('flex');

    window.currentProfileId = id;
    window.currentProfileName = c.name;
}

window.saveManualTransaction = async function () {
    const mPaid = document.getElementById('manual-paid');
    const paid = parseFloat(mPaid.value) || 0;
    const mDate = document.getElementById('manual-date').value;

    if (paid <= 0) return showToast('Please enter a valid amount', 'error');

    try {
        // Logic: "Paid money ta total due theke biyog hobe"
        // Record: Cost=0, Paid=X.
        // Effect on Due: OldDue - X.

        let ts = serverTimestamp();
        if (mDate) ts = new Date(mDate);

        await addDoc(feedCollection, {
            khamar: window.currentProfileName,
            cost: 0,
            paidAmount: paid,
            dueAmount: -paid, // For the record itself
            feedCost: 0, guraCost: 0, chickenCost: 0, cleaningCost: 0, vaccineCost: 0, medicineCost: 0, otherCost: 0,
            customFields: [{ name: 'Manual Payment', cost: 0 }],
            timestamp: ts
        });

        showToast('Payment Recorded');
        mPaid.value = '';

        // Refresh Profile
        openCustomerProfile(window.currentProfileId);

    } catch (e) {
        console.error(e);
        showToast('Error saving payment', 'error');
    }
}



function setupEventListeners() {
    // Auth Listeners
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Navigation Listeners
    document.getElementById('menu-btn').addEventListener('click', toggleMobileSidebar);
    document.getElementById('close-sidebar').addEventListener('click', toggleMobileSidebar);
    document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', e => {
        e.preventDefault();
        showView(l.dataset.view);
    }));

    document.getElementById('product-grid').addEventListener('click', e => {
        const card = e.target.closest('[data-id]');
        if (card) {
            const p = products.find(x => x.id === card.dataset.id);
            if (p && p.stock > 0) {
                const ex = cart.find(x => x.id === p.id);
                if (ex) {
                    if (ex.quantity < p.stock) { ex.quantity++; renderCart(); }
                    else showToast('Stock Limit', 'error');
                } else { cart.push({ ...p, quantity: 1 }); renderCart(); }
            } else showToast('Out of stock', 'error');
        }
    });

    const cartDiv = document.getElementById('cart-items');
    cartDiv.addEventListener('click', e => {
        if (e.target.closest('.remove-cart')) {
            const id = e.target.closest('.remove-cart').dataset.id;
            cart = cart.filter(x => x.id !== id); renderCart();
        }
    });

    document.getElementById('product-search').addEventListener('input', renderProductGrid);
    document.getElementById('cart-discount').addEventListener('input', renderCart);
    document.getElementById('clear-cart-btn').addEventListener('click', () => { cart = []; renderCart(); });
    document.getElementById('charge-btn').addEventListener('click', () => {
        document.getElementById('payment-modal-total').innerText = document.getElementById('cart-total').innerText;
        showModal('payment-modal');
    });

    const cInput = document.getElementById('customer-search-input');
    const cResults = document.getElementById('customer-search-results');
    cInput.addEventListener('focus', renderCustomerSearchResults);
    cInput.addEventListener('input', () => {
        document.getElementById('cart-customer-id').value = 'walk-in';
        renderCustomerSearchResults();
    });
    document.addEventListener('click', e => {
        if (!cInput.contains(e.target) && !cResults.contains(e.target)) cResults.classList.add('hidden');
    });

    const cViewSearch = document.getElementById('customer-search');
    if (cViewSearch) {
        cViewSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            renderCustomersTable(term);
        });
    }

    const bInput = document.getElementById('sale-buyer-name');
    const bResults = document.getElementById('sale-buyer-results');
    bInput.addEventListener('input', renderBuyerSuggestions);
    bInput.addEventListener('focus', renderBuyerSuggestions);
    document.addEventListener('click', e => {
        if (!bInput.contains(e.target) && !bResults.contains(e.target)) bResults.classList.add('hidden');
    });

    // NEW: Purchase Suggestions Listeners
    const pItemInput = document.getElementById('purchase-item-name');
    const pItemRes = document.getElementById('purchase-item-results');
    pItemInput.addEventListener('input', renderPurchaseItemSuggestions);
    pItemInput.addEventListener('focus', renderPurchaseItemSuggestions);

    const pSupInput = document.getElementById('purchase-supplier');
    const pSupRes = document.getElementById('purchase-supplier-results');
    pSupInput.addEventListener('input', renderPurchaseSupplierSuggestions);
    pSupInput.addEventListener('focus', renderPurchaseSupplierSuggestions);

    document.addEventListener('click', e => {
        if (!pItemInput.contains(e.target) && !pItemRes.contains(e.target)) pItemRes.classList.add('hidden');
        if (!pSupInput.contains(e.target) && !pSupRes.contains(e.target)) pSupRes.classList.add('hidden');
    });
    // -----------------------------------------

    document.getElementById('payment-form').addEventListener('submit', handleProcessPayment);
    document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', e => hideModal(e.target.closest('.modal-container').id)));
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);

    document.getElementById('add-product-btn').addEventListener('click', () => showModal('add-product-modal'));
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    document.getElementById('add-customer-btn').addEventListener('click', () => showModal('add-customer-modal'));
    document.getElementById('add-customer-form').addEventListener('submit', handleAddCustomer);

    document.getElementById('btn-record-sale').addEventListener('click', handleRecordChickenSale);

    // Khamari specific listeners
    const btnRecordKhamari = document.getElementById('btn-record-khamari');
    if (btnRecordKhamari) btnRecordKhamari.addEventListener('click', handleRecordKhamari);

    const khamariMedInput = document.getElementById('khamari-med-name');
    const khamariMedResults = document.getElementById('khamari-med-results');
    if (khamariMedInput) {
        khamariMedInput.addEventListener('input', renderKhamariMedSuggestions);
        khamariMedInput.addEventListener('focus', renderKhamariMedSuggestions);
        document.addEventListener('click', e => {
            if (!khamariMedInput.contains(e.target) && !khamariMedResults?.contains(e.target)) {
                khamariMedResults.classList.add('hidden');
            }
        });
    }

    const btnAddKhamariMed = document.getElementById('btn-add-khamari-med');
    if (btnAddKhamariMed) btnAddKhamariMed.addEventListener('click', handleAddKhamariMed);

    const btnSaveFgm = document.getElementById('btn-save-fgm');
    if (btnSaveFgm) btnSaveFgm.addEventListener('click', handleRecordFgm);

    document.getElementById('btn-record-feed').addEventListener('click', handleRecordFeedPurchase);
    document.getElementById('btn-add-khamar').addEventListener('click', handleAddKhamar);
    const khamarSearchInput = document.getElementById('khamar-search-input');
    if (khamarSearchInput) khamarSearchInput.addEventListener('input', renderKhamarUI);
    document.getElementById('btn-reset-data').addEventListener('click', handleResetBusinessData);
    document.getElementById('btn-save-purchase').addEventListener('click', handleSavePurchase);

    document.getElementById('inventory-table-body').addEventListener('click', e => {
        if (e.target.closest('.delete-product')) handleDeleteProduct(e.target.closest('.delete-product').dataset.id);
        if (e.target.closest('.add-stock')) handleAddStockPrompt(e.target.closest('.add-stock').dataset.id);
    });
    document.getElementById('inventory-table-body').addEventListener('change', e => {
        if (e.target.classList.contains('inventory-input')) {
            const { id, field } = e.target.dataset;
            handleUpdateProductField(id, field, e.target.value);
        }
    });

    document.getElementById('customers-table-body').addEventListener('click', e => {
        if (e.target.closest('.delete-customer')) {
            e.stopPropagation();
            handleDeleteCustomer(e.target.closest('.delete-customer').dataset.id);
        } else {
            const row = e.target.closest('.view-customer-row');
            if (row) openCustomerProfile(row.dataset.id);
        }
    });

    document.getElementById('reports-table-body').addEventListener('click', e => {
        if (e.target.closest('.delete-sale')) handleDeleteSale(e.target.closest('.delete-sale').dataset.id);
    });

    document.getElementById('chicken-sales-table-body').addEventListener('click', async (e) => {
        if (e.target.closest('.delete-chicken-sale')) {
            handleDeleteChickenSale(e.target.closest('.delete-chicken-sale').dataset.id);
        } else if (e.target.closest('.view-buyer-link')) {
            const nameFromTable = e.target.closest('.view-buyer-link').dataset.name;
            const cust = customers.find(c => c.name.trim().toLowerCase() === nameFromTable.trim().toLowerCase());
            if (cust) {
                openCustomerProfile(cust.id);
            } else {
                if (confirm(`Buyer "${nameFromTable}" is not in your customer list. Do you want to add them now?`)) {
                    try {
                        const newCustRef = await addDoc(customersCollection, {
                            name: nameFromTable,
                            phone: "",
                            email: ""
                        });
                        showToast("Customer Added!");
                        openCustomerProfile(newCustRef.id);
                    } catch (err) {
                        console.error(err);
                        showToast("Failed to add customer", 'error');
                    }
                }
            }
        }
    });

    document.getElementById('feed-table-body').addEventListener('click', e => {
        if (e.target.closest('.delete-feed')) handleDeleteFeed(e.target.closest('.delete-feed').dataset.id);
    });

    ['purchase-table-body', 'purchase-card-list'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', e => {
            if (e.target.closest('.delete-purchase')) handleDeletePurchase(e.target.closest('.delete-purchase').dataset.id);
        });
    });

    document.getElementById('khamar-list').addEventListener('click', e => {
        if (e.target.closest('.delete-khamar')) handleDeleteKhamar(e.target.closest('.delete-khamar').dataset.id);
        else if (e.target.closest('.khamar-item')) {
            khamarFilter.khamarName = e.target.closest('.khamar-item').dataset.name;
            renderKhamarUI();
            renderChickenSalesTable();
            renderFeedTable();
            renderFeedLedger();
        }
    });

    ['sale-weight', 'sale-rate'].forEach(id => document.getElementById(id).addEventListener('input', () => {
        const w = parseFloat(document.getElementById('sale-weight').value) || 0;
        const r = parseFloat(document.getElementById('sale-rate').value) || 0;
        const total = w * r;
        document.getElementById('sale-total-amount').value = total.toFixed(2);

        const paid = parseFloat(document.getElementById('sale-paid-amount').value) || 0;
        const due = total - paid;
        document.getElementById('sale-due-amount').innerText = `Due: ৳${due.toFixed(2)}`;
        document.getElementById('sale-due-amount').className = due > 0 ? "font-bold text-red-600" : "font-bold text-emerald-600";
    }));

    document.getElementById('sale-paid-amount').addEventListener('input', () => {
        const w = parseFloat(document.getElementById('sale-weight').value) || 0;
        const r = parseFloat(document.getElementById('sale-rate').value) || 0;
        const total = w * r;
        const paid = parseFloat(document.getElementById('sale-paid-amount').value) || 0;
        const due = total - paid;
        document.getElementById('sale-due-amount').innerText = `Due: ৳${due.toFixed(2)}`;
        document.getElementById('sale-due-amount').className = due > 0 ? "font-bold text-red-600" : "font-bold text-emerald-600";
    });

    // Feed Entry Cost Calculation Logic (Includes Vaccine)
    const updateFeedTotal = () => {
        const cFeed = parseFloat(document.getElementById('cost-feed').value) || 0;
        const cGura = parseFloat(document.getElementById('cost-gura').value) || 0;
        const cChicken = parseFloat(document.getElementById('cost-chicken').value) || 0;
        const cCleaning = parseFloat(document.getElementById('cost-cleaning').value) || 0;
        const cVaccine = parseFloat(document.getElementById('cost-vaccine').value) || 0; // NEW
        const cMedicine = parseFloat(document.getElementById('cost-medicine').value) || 0;
        const cOther = parseFloat(document.getElementById('cost-other').value) || 0; // NEW

        let cCustom = 0;
        document.querySelectorAll('.custom-cost-input').forEach(i => cCustom += (parseFloat(i.value) || 0));

        const total = cFeed + cGura + cChicken + cCleaning + cVaccine + cMedicine + cOther + cCustom;

        document.getElementById('feed-display-total').innerText = total.toFixed(2);

        const paid = parseFloat(document.getElementById('feed-paid').value) || 0;
        const due = total - paid;
        document.getElementById('feed-due').innerText = `Due: ৳${due.toFixed(2)}`;
        document.getElementById('feed-due').className = due > 0 ? "font-bold text-red-600 text-sm" : "font-bold text-emerald-600 text-sm";
    };

    ['cost-feed', 'cost-gura', 'cost-chicken', 'cost-cleaning', 'cost-vaccine', 'cost-medicine', 'cost-other', 'feed-paid'].forEach(id => { // Added cost-other
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateFeedTotal);
    });

    // Handle Custom Field Inputs for Total Calculation
    document.getElementById('custom-fields-container').addEventListener('input', (e) => {
        if (e.target.classList.contains('custom-cost-input')) updateFeedTotal();
    });

    document.getElementById('btn-add-custom-field').addEventListener('click', () => {
        const container = document.getElementById('custom-fields-container');
        const div = document.createElement('div');
        div.className = "flex gap-2 items-center mb-2 custom-field-row";
        div.innerHTML = `
                    <input type="text" placeholder="Custom Name" class="border p-2 rounded text-xs w-full custom-name-input">
                    <input type="number" placeholder="Cost" class="border p-2 rounded text-xs w-24 text-right custom-cost-input">
                    <button class="text-red-500 hover:text-red-700 remove-custom-field">×</button>
                `;
        container.appendChild(div);
    });

    document.getElementById('custom-fields-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-custom-field')) {
            e.target.closest('.custom-field-row').remove();
            updateFeedTotal();
        }
    });

    document.getElementById('tab-sales').addEventListener('click', () => {
        document.getElementById('section-sales').classList.remove('hidden');
        document.getElementById('section-feed').classList.add('hidden');
        document.getElementById('tab-sales').classList.replace('tab-inactive', 'tab-active');
        document.getElementById('tab-feed').classList.replace('tab-active', 'tab-inactive');
    });
    document.getElementById('tab-feed').addEventListener('click', () => {
        document.getElementById('section-sales').classList.add('hidden');
        document.getElementById('section-feed').classList.remove('hidden');
        document.getElementById('tab-feed').classList.replace('tab-inactive', 'tab-active');
        document.getElementById('tab-sales').classList.replace('tab-active', 'tab-inactive');
    });

    document.getElementById('btn-filter-reports').addEventListener('click', () => {
        reportFilter.start = document.getElementById('report-date-start').value;
        reportFilter.end = document.getElementById('report-date-end').value;
        reportFilter.customer = document.getElementById('report-customer-filter').value.toLowerCase();
        renderReportsTable();
    });
    document.getElementById('btn-reset-reports').addEventListener('click', () => {
        reportFilter = { start: '', end: '', customer: '' };
        document.getElementById('report-date-start').value = '';
        document.getElementById('report-date-end').value = '';
        document.getElementById('report-customer-filter').value = '';
        renderReportsTable();
    });
    document.getElementById('btn-download-report').addEventListener('click', window.generatePDF);

    document.getElementById('btn-filter-khamar').addEventListener('click', () => {
        khamarFilter.start = document.getElementById('khamar-date-start').value;
        khamarFilter.end = document.getElementById('khamar-date-end').value;
        renderChickenSalesTable();
        renderFeedTable();
        renderFeedLedger();
    });
    document.getElementById('btn-reset-khamar').addEventListener('click', () => {
        khamarFilter = { start: '', end: '', khamarName: 'ALL' };
        document.getElementById('khamar-date-start').value = '';
        document.getElementById('khamar-date-end').value = '';
        renderKhamarUI();
        renderChickenSalesTable();
        renderFeedTable();
        renderFeedLedger();
    });

    document.getElementById('btn-filter-purchase').addEventListener('click', () => {
        purchaseFilter.start = document.getElementById('purchase-date-start').value;
        purchaseFilter.end = document.getElementById('purchase-date-end').value;
        renderPurchaseTable();
    });
    document.getElementById('btn-reset-purchase').addEventListener('click', () => {
        purchaseFilter = { start: '', end: '' };
        document.getElementById('purchase-date-start').value = '';
        document.getElementById('purchase-date-end').value = '';
        renderPurchaseTable();
    });

    ['purchase-qty', 'purchase-buy-rate', 'purchase-paid'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const qty = parseFloat(document.getElementById('purchase-qty').value) || 0;
            const rate = parseFloat(document.getElementById('purchase-buy-rate').value) || 0;
            const paid = parseFloat(document.getElementById('purchase-paid').value) || 0;

            const total = qty * rate;
            const due = total - paid;

            document.getElementById('purchase-total-bill').value = total;
            document.getElementById('purchase-current-due').innerText = `৳${due}`;

            if (due > 0) document.getElementById('purchase-current-due').className = "font-bold text-red-600 text-lg";
            else if (due < 0) document.getElementById('purchase-current-due').className = "font-bold text-emerald-600 text-lg";
            else document.getElementById('purchase-current-due').className = "font-bold text-gray-600 text-lg";
        });
    });

    const typeSelect = document.getElementById('purchase-type');
    const qtyInput = document.getElementById('purchase-qty');
    const rateInput = document.getElementById('purchase-buy-rate');
    const itemNameInput = document.getElementById('purchase-item-name');
    const unitLabel = document.getElementById('lbl-unit');

    const updatePurchaseFormUI = () => {
        const type = typeSelect.value;

        if (type === 'Broiler' || type === 'Sonali') {
            qtyInput.placeholder = "Pcs (e.g. 100)";
            rateInput.placeholder = "Buy Rate / Pc (e.g. 120)";
            unitLabel.innerText = "Qty (Pcs)";

            if (itemNameInput.value.trim() === '' || itemNameInput.value === type) {
                itemNameInput.value = type;
            }
        } else {
            qtyInput.placeholder = "Qty (Bags/Kg)";
            rateInput.placeholder = "Cost / Unit";
            unitLabel.innerText = "Qty";
        }
    };

    if (typeSelect) {
        typeSelect.addEventListener('change', updatePurchaseFormUI);
    }
}

async function handleProcessPayment(e) {
    e.preventDefault();
    const cid = document.getElementById('cart-customer-id').value;
    const payMethod = document.querySelector('input[name="payment-method"]:checked').value;

    if (payMethod === 'Due' && cid === 'walk-in') {
        return showToast("Walk-in customers cannot have Due", 'error');
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerText = "Processing...";

    try {
        // Auto-create Customer if New
        let cid = document.getElementById('cart-customer-id').value;
        const custName = document.getElementById('customer-search-input').value.trim();

        if (custName && custName.toLowerCase() !== 'walk-in customer' && cid === 'walk-in') {
            // Check if exists case-insensitive
            const exist = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
            if (exist) {
                cid = exist.id;
            } else {
                // Create New
                const docRef = await addDoc(customersCollection, {
                    name: custName, phone: "", email: "", createdAt: serverTimestamp()
                });
                cid = docRef.id;
                showToast(`New Customer Created`);
            }
        }

        const sub = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
        const disc = parseFloat(document.getElementById('cart-discount').value) || 0;
        const total = sub - disc;

        const counterRef = doc(db, `artifacts/${appId}/users/${userId}/metadata/counters`);
        const snap = await getDoc(counterRef);
        let count = 1001;
        if (snap.exists() && snap.data().salesCount) count = snap.data().salesCount + 1;

        const batch = writeBatch(db);
        const saleRef = doc(salesCollection, `#${count}`);
        batch.set(saleRef, {
            items: cart, subtotal: sub, discount: disc, totalAmount: total,
            paymentMethod: payMethod, customerId: cid, status: payMethod === 'Due' ? 'due' : 'paid',
            timestamp: serverTimestamp()
        });
        batch.set(counterRef, { salesCount: count }, { merge: true });

        for (const i of cart) {
            const p = products.find(x => x.id === i.id);
            if (p) batch.update(doc(productsCollection, i.id), { stock: p.stock - i.quantity });
        }
        await batch.commit();
        showToast("Sale Successful");
        cart = []; renderCart();
        document.getElementById('customer-search-input').value = 'Walk-in Customer';
        document.getElementById('cart-customer-id').value = 'walk-in';
        hideModal('payment-modal');
    } catch (err) {
        console.error(err); showToast("Failed", 'error');
    } finally {
        btn.disabled = false; btn.innerText = "Confirm";
    }
}

async function handleAddProduct(e) {
    e.preventDefault();
    const f = e.target;
    await addDoc(productsCollection, {
        name: f['p-name'].value, category: f['p-cat'].value, company: f['p-comp'].value,
        unit: f['p-unit'].value, price: parseFloat(f['p-price'].value), cost: parseFloat(f['p-cost'].value),
        stock: parseInt(f['p-stock'].value)
    });
    hideModal('add-product-modal'); showToast('Saved'); f.reset();
}
async function handleAddCustomer(e) {
    e.preventDefault();
    await addDoc(customersCollection, {
        name: e.target['c-name'].value, phone: e.target['c-phone'].value, email: e.target['c-email'].value
    });
    hideModal('add-customer-modal'); showToast('Saved');
    e.target.reset();
}

async function handleAddKhamar() {
    const rawName = document.getElementById('khamar-name-input').value;
    const n = rawName ? rawName.trim() : '';

    if (n) {
        await addDoc(khamarsCollection, { name: n });
        const exists = customers.find(c => c.name.trim().toLowerCase() === n.toLowerCase());
        if (!exists) {
            try {
                await addDoc(customersCollection, { name: n, phone: "Khamar Owner", email: "" });
                showToast("Khamar & Customer Added");
            } catch (e) {
                console.error(e);
                showToast("Khamar Added, but Customer sync failed", 'error');
            }
        } else {
            showToast("Khamar Added (Customer Already Exists)");
        }
        document.getElementById('khamar-name-input').value = '';
    }
}

async function handleRecordChickenSale() {
    const dateInput = document.getElementById('sale-date').value;
    let ts = serverTimestamp();
    if (dateInput) {
        ts = new Date(dateInput);
    }

    const rawBuyer = document.getElementById('sale-buyer-name').value;
    const buyerName = rawBuyer ? rawBuyer.trim() : 'Unknown Buyer';

    const totalAmount = parseFloat(document.getElementById('sale-total-amount').value) || 0;
    const paidAmount = parseFloat(document.getElementById('sale-paid-amount').value) || 0;

    const data = {
        khamar: document.getElementById('sale-khamar-select').value,
        customerName: buyerName,
        quantity: parseInt(document.getElementById('sale-quantity').value) || 0,
        weight: parseFloat(document.getElementById('sale-weight').value) || 0,
        rate: parseFloat(document.getElementById('sale-rate').value) || 0,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        breed: document.getElementById('sale-breed-select').value,
        timestamp: ts
    };

    if (data.khamar === 'Select Farm') return showToast('Select Farm', 'error');

    const exists = customers.find(c => c.name.trim().toLowerCase() === buyerName.toLowerCase());
    if (!exists) {
        await addDoc(customersCollection, { name: buyerName, phone: "Chicken Buyer", email: "" });
    }

    await addDoc(chickenSalesCollection, { ...data, status: 'due' });
    showToast('Sale Recorded');

    document.getElementById('sale-quantity').value = '';
    document.getElementById('sale-weight').value = '';
    document.getElementById('sale-rate').value = '';
    document.getElementById('sale-total-amount').value = '';
    document.getElementById('sale-paid-amount').value = '';
    document.getElementById('sale-due-amount').innerText = '';
    document.getElementById('sale-buyer-name').value = '';
}

window.toggleTransactionStatus = async function (id, collectionName, targetStatus) {
    const col = collectionName === 'chicken_sales' ? chickenSalesCollection : feedCollection;
    const newStatus = targetStatus; // Use the explicitly passed status (paid or due)
    try {
        await updateDoc(doc(col, id), { status: newStatus });
        // Re-open profile? We need context. 
        // Since this updates realtime listeners, the UI might refresh if logic is right.
        // But `openCustomerProfile` is not a listener event handler.
        // We'll trust the global listeners to update state, but we might need to refresh the modal view if it's open.
        // Actually `openCustomerProfile` is static. We should re-call it.
        // But we need the customer ID.
        showToast(`Marked as ${newStatus.toUpperCase()}`);

        // Hacky refresh of modal if open
        if (!document.getElementById('customer-profile-modal').classList.contains('hidden')) {
            const name = document.getElementById('profile-name').innerText;
            const c = customers.find(x => x.name === name);
            if (c) openCustomerProfile(c.id);
        }
    } catch (e) {
        console.error(e);
        showToast("Error updating status", 'error');
    }
}

window.deleteTransaction = async function (id, collectionName) {
    if (!confirm("This will remove the transaction from this profile history but keep it in the Farm Ledger. Continue?")) return;
    // Default to feedCollection if not chicken_sales (covers manual entries)
    const col = collectionName === 'chicken_sales' ? chickenSalesCollection : feedCollection;
    try {
        // Soft delete: Hide from profile only
        await updateDoc(doc(col, id), { hiddenFromProfile: true });
        showToast("Removed from profile history");

        if (!document.getElementById('customer-profile-modal').classList.contains('hidden')) {
            // Refresh profile
            const name = document.getElementById('profile-name').innerText;
            // Find by ID ideally, but logic uses name here in old code. 
            // Better to use global currentProfileId if available.
            if (window.currentProfileId) openCustomerProfile(window.currentProfileId);
        }
    } catch (e) { console.error(e); showToast("Error updating status", 'error'); }
}

// UPDATED: Handle Record Feed with Vaccine Cost
async function handleRecordFeedPurchase() {
    const khamarName = document.getElementById('feed-khamar-select').value;
    const feedQty = parseInt(document.getElementById('feed-qty').value) || 0;
    const guraQty = parseInt(document.getElementById('gura-qty').value) || 0;

    // Cost Inputs
    const feedCost = parseFloat(document.getElementById('cost-feed').value) || 0;
    const guraCost = parseFloat(document.getElementById('cost-gura').value) || 0;
    const chickenCost = parseFloat(document.getElementById('cost-chicken').value) || 0;
    const cleaningCost = parseFloat(document.getElementById('cost-cleaning').value) || 0;
    const vaccineCost = parseFloat(document.getElementById('cost-vaccine').value) || 0;
    const medicineCost = parseFloat(document.getElementById('cost-medicine').value) || 0;
    const otherCost = parseFloat(document.getElementById('cost-other').value) || 0; // NEW

    let customFields = [];
    let customTotal = 0;
    document.querySelectorAll('.custom-field-row').forEach(row => {
        const name = row.querySelector('.custom-name-input').value.trim();
        const cost = parseFloat(row.querySelector('.custom-cost-input').value) || 0;
        if (name || cost > 0) {
            customFields.push({ name, cost });
            customTotal += cost;
        }
    });

    const totalCost = feedCost + guraCost + chickenCost + cleaningCost + vaccineCost + medicineCost + otherCost + customTotal;
    const paidAmount = parseFloat(document.getElementById('feed-paid').value) || 0;
    const dueAmount = totalCost - paidAmount;

    if (khamarName === 'Select Farm' || (feedQty === 0 && guraQty === 0 && totalCost === 0)) {
        return showToast("Select Farm and enter Quantity or Cost", 'error');
    }

    const data = {
        khamar: khamarName,
        feedQty: feedQty,
        guraQty: guraQty,
        feedCost: feedCost,
        guraCost: guraCost,
        chickenCost: chickenCost,
        cleaningCost: cleaningCost,
        vaccineCost: vaccineCost,
        medicineCost: medicineCost,
        otherCost: otherCost, // NEW
        customFields: customFields, // NEW
        cost: totalCost,
        paidAmount: paidAmount,
        dueAmount: dueAmount,
        timestamp: serverTimestamp()
    };

    await addDoc(feedCollection, data);
    showToast('Feed/Supply Saved');

    // Reset Form
    document.getElementById('feed-qty').value = '';
    document.getElementById('gura-qty').value = '';
    document.getElementById('cost-feed').value = '';
    document.getElementById('cost-gura').value = '';
    document.getElementById('cost-chicken').value = '';
    document.getElementById('cost-cleaning').value = '';
    document.getElementById('cost-vaccine').value = '';
    document.getElementById('cost-medicine').value = '';
    document.getElementById('cost-other').value = ''; // NEW
    document.getElementById('custom-fields-container').innerHTML = ''; // Clear Custom Fields
    document.getElementById('feed-paid').value = '';
    document.getElementById('feed-display-total').innerText = '0.00';
    document.getElementById('feed-due').innerText = 'Due: ৳0.00';
}

// UPDATED: Handle Save Purchase
async function handleSavePurchase() {
    const btn = document.getElementById('btn-save-purchase');
    btn.disabled = true; btn.innerText = "Processing...";

    try {
        const dateVal = document.getElementById('purchase-entry-date').value;
        const type = document.getElementById('purchase-type').value;
        const itemName = document.getElementById('purchase-item-name').value.trim();
        const supplier = document.getElementById('purchase-supplier').value.trim();
        const qty = parseFloat(document.getElementById('purchase-qty').value) || 0;
        const buyRate = parseFloat(document.getElementById('purchase-buy-rate').value) || 0;
        const sellRate = parseFloat(document.getElementById('purchase-sell-rate').value) || 0;
        const paid = parseFloat(document.getElementById('purchase-paid').value) || 0;

        const totalBill = qty * buyRate;
        const due = totalBill - paid;

        if (!itemName || qty <= 0) {
            btn.disabled = false; btn.innerText = "SAVE RECORD";
            return showToast("Please enter Item Name and Quantity", 'error');
        }

        const data = {
            entryDate: dateVal || new Date().toISOString().split('T')[0],
            type: type,
            itemName: itemName,
            supplier: supplier,
            quantity: qty,
            buyRate: buyRate,
            totalCost: totalBill,
            paidAmount: paid,
            dueAmount: due,
            timestamp: serverTimestamp()
        };

        const batch = writeBatch(db);
        const docRef = doc(purchaseCollection);
        batch.set(docRef, data);

        const p = products.find(x => x.name.trim().toLowerCase() === itemName.toLowerCase());

        if (p) {
            const updates = {
                stock: p.stock + qty,
                cost: buyRate > 0 ? buyRate : p.cost
            };
            if (sellRate > 0) updates.price = sellRate;

            batch.update(doc(productsCollection, p.id), updates);
            showToast("Record Saved & Stock Updated");
        } else {
            const newProdRef = doc(productsCollection);
            const unit = (type === 'Broiler' || type === 'Sonali') ? 'Pcs' : 'Bag';

            batch.set(newProdRef, {
                name: itemName,
                category: data.type,
                company: supplier,
                stock: qty,
                cost: buyRate,
                price: sellRate > 0 ? sellRate : (buyRate * 1.1),
                unit: unit
            });
            showToast("Record Saved & New Product Created");
        }

        await batch.commit();

        document.getElementById('purchase-item-name').value = '';
        document.getElementById('purchase-supplier').value = '';
        document.getElementById('purchase-qty').value = '';
        document.getElementById('purchase-buy-rate').value = '';
        document.getElementById('purchase-sell-rate').value = '';
        document.getElementById('purchase-paid').value = '';
        document.getElementById('purchase-total-bill').value = '0';
        document.getElementById('purchase-current-due').innerText = '৳0';

    } catch (error) {
        console.error(error);
        showToast("Error saving record", 'error');
    } finally {
        btn.disabled = false; btn.innerText = "SAVE RECORD";
    }
}

async function handleDeleteProduct(id) { if (confirm("Delete?")) await deleteDoc(doc(productsCollection, id)); }
async function handleDeleteCustomer(id) { if (confirm("Delete?")) await deleteDoc(doc(customersCollection, id)); }
async function handleDeleteKhamar(id) { if (confirm("Delete?")) await deleteDoc(doc(khamarsCollection, id)); }
async function handleDeleteChickenSale(id) { if (confirm("Delete?")) await deleteDoc(doc(chickenSalesCollection, id)); }
async function handleDeleteFeed(id) { if (confirm("Delete Entry?")) await deleteDoc(doc(feedCollection, id)); }
async function handleDeletePurchase(id) {
    if (confirm("Delete Record? Stock will be reverted.")) {
        await deleteDoc(doc(purchaseCollection, id));
    }
}

async function handleDeleteSale(id) {
    if (confirm("Delete Sale? Stock will be restored.")) {
        const sale = sales.find(s => s.id === id);
        if (sale) {
            const batch = writeBatch(db);
            sale.items.forEach(i => {
                const p = products.find(x => x.id === i.id);
                if (p) batch.update(doc(productsCollection, i.id), { stock: p.stock + i.quantity });
            });
            batch.delete(doc(salesCollection, id));
            await batch.commit();
            showToast("Restored & Deleted");
        }
    }
}

async function handleAddStockPrompt(id) {
    const q = prompt("Enter quantity to add:");
    if (q && parseInt(q) > 0) {
        const p = products.find(x => x.id === id);
        await updateDoc(doc(productsCollection, id), { stock: p.stock + parseInt(q) });
        showToast("Stock Updated");
    }
}

async function handleUpdateProductField(id, field, value) {
    let val = value;
    if (['price', 'cost', 'stock'].includes(field)) {
        val = parseFloat(value);
        if (isNaN(val)) return showToast('Invalid Number', 'error');
    }
    try {
        await updateDoc(doc(productsCollection, id), { [field]: val });
        showToast('Updated');
    } catch (e) { showToast('Error Updating', 'error'); }
}

async function handleResetBusinessData() {
    if (confirm("WARNING: This deletes ALL SALES & DATA. Continue?")) {
        const batch = writeBatch(db);
        const sSnap = await getDocs(salesCollection); sSnap.forEach(d => batch.delete(d.ref));
        const cSnap = await getDocs(chickenSalesCollection); cSnap.forEach(d => batch.delete(d.ref));
        const fSnap = await getDocs(feedCollection); fSnap.forEach(d => batch.delete(d.ref));
        const pSnap = await getDocs(purchaseCollection); pSnap.forEach(d => batch.delete(d.ref));
        await batch.commit();
        showToast("System Reset");
    }
}

// Fixed Login Logic
async function handleAdminLogin(e) {
    e.preventDefault();
    const p = document.getElementById('admin-password').value;
    const adminEmail = document.getElementById('admin-email').value;

    try {
        await signInWithEmailAndPassword(auth, adminEmail, p);
        showToast("Login Successful");
        document.getElementById('admin-password').value = '';
    } catch (error) {
        console.error("Authentication Error:", error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            showToast("Invalid Credentials", 'error');
        } else {
            showToast("Login Failed", 'error');
        }
    }
}

// Fixed Logout Logic
async function handleLogout() {
    try {
        await signOut(auth);
        showToast("Logged Out");
        window.location.reload(); // Refresh to ensure clean state
    } catch (error) {
        showToast("Logout Failed", 'error');
    }
}

function calculateProductSalesReport() {
    productSales = {};
    sales.forEach(s => s.items.forEach(i => {
        if (!productSales[i.id]) productSales[i.id] = { name: i.name, qty: 0, rev: 0 };
        productSales[i.id].qty += i.quantity; productSales[i.id].rev += (i.quantity * i.price);
    }));
    const tb = document.getElementById('product-sales-report-table-body');
    let html = '';
    Object.values(productSales).forEach(x => {
        html += `<tr class="border-b border-white/5 hover:bg-white/5 transition-colors"><td class="p-3 text-gray-300">${x.name}</td><td class="p-3 text-center text-white font-mono">${x.qty}</td><td class="p-3 text-right text-emerald-400 font-mono">৳${x.rev}</td></tr>`;
    });
    tb.innerHTML = html;
    document.getElementById('total-items-sold-stat').innerText = Object.values(productSales).reduce((a, b) => a + b.qty, 0);
}

function calculateCustomerLedger() {
    customerLedger = {};
    customers.forEach(c => {
        if (c && c.id) {
            customerLedger[c.id] = { name: c.name || 'Unknown', phone: c.phone || '', bill: 0, paid: 0 };
        }
    });

    sales.forEach(s => {
        if (s.customerId !== 'walk-in' && customerLedger[s.customerId]) {
            customerLedger[s.customerId].bill += (s.totalAmount || 0);
            if (s.status === 'paid') customerLedger[s.customerId].paid += (s.totalAmount || 0);
        }
    });

    chickenSales.forEach(cs => {
        const name = cs.customerName ? cs.customerName.trim().toLowerCase() : '';
        if (!name) return;
        const match = customers.find(c => c.name && c.name.trim().toLowerCase() === name);
        if (match && customerLedger[match.id]) {
            const amount = cs.totalAmount || 0;
            if (cs.status === 'paid') {
                customerLedger[match.id].paid += amount;
            }
        }
    });

    feedEntries.forEach(fe => {
        const khamarName = fe.khamar ? fe.khamar.trim().toLowerCase() : '';
        if (!khamarName) return;
        const match = customers.find(c => c.name && c.name.trim().toLowerCase() === khamarName);
        if (match && customerLedger[match.id]) {
            customerLedger[match.id].bill += (fe.cost || 0);
            customerLedger[match.id].paid += (fe.paidAmount || 0);
        }
    });

    const tb = document.getElementById('customer-ledger-table-body');
    let totalDue = 0;
    let html = '';
    Object.values(customerLedger).forEach(c => {
        const due = c.bill - c.paid; totalDue += due;
        html += `<tr class="border-b border-white/5 hover:bg-white/5 transition-colors"><td class="p-3 text-gray-300"><div class="font-bold text-white">${c.name}</div><div class="text-xs text-gray-500">${c.phone}</div></td><td class="p-3 text-right text-emerald-400 font-mono">৳${c.bill}</td><td class="p-3 text-right text-blue-400 font-mono">৳${c.paid}</td><td class="p-3 text-right font-bold text-red-500 font-mono">৳${due}</td></tr>`;
    });
    tb.innerHTML = html;
    document.getElementById('total-due-stat').innerText = `৳${totalDue}`;
}

function renderInventoryTable() {
    const tb = document.getElementById('inventory-table-body');
    let html = '';
    products.forEach(p => {
        const row = `<tr class="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                    <td class="py-3 px-4"><input class="bg-transparent border-none outline-none text-white/90 font-medium w-full" value="${p.name}" data-id="${p.id}" data-field="name"></td>
                    <td class="py-3 px-4"><input class="bg-transparent border-none outline-none text-gray-400 w-full" value="${p.unit || ''}" data-id="${p.id}" data-field="unit"></td>
                    <td class="py-3 px-4"><input class="bg-transparent border-none outline-none text-white/90 w-full" type="number" value="${p.price}" data-id="${p.id}" data-field="price"></td>
                    <td class="py-3 px-4"><input class="bg-transparent border-none outline-none font-bold w-full ${p.stock < 5 ? 'text-red-400' : 'text-emerald-400'}" type="number" value="${p.stock}" data-id="${p.id}" data-field="stock"></td>
                    <td class="py-3 px-4 text-right space-x-2">
                        <button class="text-blue-400 hover:text-blue-300 add-stock font-bold text-xs bg-blue-500/10 px-2 py-1 rounded" data-id="${p.id}" data-name="${p.name}">+ Stock</button>
                        <button class="text-red-400 hover:text-red-300 delete-product font-bold text-xs bg-red-500/10 px-2 py-1 rounded" data-id="${p.id}">Del</button>
                    </td>
                 </tr>`;
        html += row;
    });
    tb.innerHTML = html;
}

function renderKhamarUI() {
    const l = document.getElementById('khamar-list');
    const searchInput = document.getElementById('khamar-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    let html = `<div class="p-3 mb-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer khamar-item text-gray-300 hover:bg-white/10 transition-colors" data-name="ALL">All Farms</div>`;

    khamars.forEach(k => {
        if (searchTerm && !k.name.toLowerCase().includes(searchTerm)) return;
        const isActive = khamarFilter.khamarName === k.name;
        const activeWrapper = isActive ? 'ring-1 ring-orange-500 bg-orange-500/10' : 'bg-white/5 hover:bg-white/10';
        html += `<div class="p-3 mb-2 border border-white/10 rounded-lg flex justify-between items-center cursor-pointer khamar-item transition-all ${activeWrapper}" data-name="${k.name}">
                    <span class="font-medium text-gray-200">${k.name}</span>
                    <div class="flex items-center gap-1">
                         <button class="text-blue-400 hover:text-blue-300 px-2 py-1 bg-blue-500/10 rounded text-xs" onclick="event.stopPropagation(); editKhamar('${k.id}')">Edit</button>
                         <button class="text-red-400 hover:text-red-300 delete-khamar px-2" data-id="${k.id}">×</button>
                    </div>
                </div>`;
    });
    l.innerHTML = html;
    const opts = '<option class="text-gray-900">Select Farm</option>' + khamars.map(k => `<option value="${k.name}" class="text-gray-900">${k.name}</option>`).join('');
    document.getElementById('sale-khamar-select').innerHTML = opts;
    document.getElementById('feed-khamar-select').innerHTML = opts;
}

function renderChickenSalesTable() {
    const tb = document.getElementById('chicken-sales-table-body');
    const mList = document.getElementById('chicken-sales-mobile-list');
    tb.innerHTML = '';
    if (mList) mList.innerHTML = '';

    let data = chickenSales.filter(s => {
        const matchesKhamar = khamarFilter.khamarName === 'ALL' || s.khamar === khamarFilter.khamarName;
        const matchesDate = isDateInRange(s.timestamp, khamarFilter.start, khamarFilter.end);
        return matchesKhamar && matchesDate;
    });

    let totalAmount = 0;
    let totalWeight = 0;
    let totalPcs = 0;

    data.forEach(item => {
        totalAmount += (item.totalAmount || 0);
        totalWeight += (item.weight || 0);
        totalPcs += (item.quantity || 0);
    });

    const header = document.getElementById('chicken-sales-stats-container');

    if (header) {
        header.innerHTML = `
                    <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                        <span class="text-gray-300">Sales: <b class="text-white">${khamarFilter.khamarName}</b></span>
                        <div class="text-xs font-medium text-gray-400 flex flex-wrap gap-4">
                            <span class="bg-white/5 px-2 py-1 rounded">Total: <span class="text-white">৳${totalAmount.toLocaleString()}</span></span>
                            <span class="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">Weight: ${totalWeight.toLocaleString()} kg</span>
                            <span class="bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">Pcs: ${totalPcs.toLocaleString()}</span>
                        </div>
                    </div>
                `;
    }

    let tbHtml = '';
    let mListHtml = '';
    data.sort((a, b) => b.timestamp - a.timestamp).forEach(s => {
        const d = s.timestamp ? new Date(s.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '';

        // Desktop Row
        tbHtml += `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                        <td class="p-3 text-gray-400">${d}</td>
                        <td class="p-3 text-gray-300">${s.khamar}</td>
                        <td class="p-3 font-medium text-blue-400 cursor-pointer hover:underline view-buyer-link" data-name="${s.customerName}">${s.customerName}</td>
                        <td class="p-3 text-gray-400">${s.quantity} pcs</td>
                        <td class="p-3 font-bold text-gray-500">${s.weight || 0} kg</td>
                        <td class="p-3 text-gray-400">@${s.rate || 0}</td>
                        <td class="p-3 font-bold ${(s.status === 'paid') ? 'text-emerald-400' : 'text-red-400'}">৳${s.totalAmount}</td>
                        <td class="p-3">
                             <div class="inline-flex rounded-lg shadow-sm border border-white/10 bg-gray-900/50" role="group">
                                <button onclick="toggleTransactionStatus('${s.id}', 'chicken_sales', 'due')" class="px-3 py-1 text-xs rounded-l-lg transition-colors ${(s.status !== 'paid') ? 'bg-red-500/20 text-red-400 border-r border-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}">Due</button>
                                <button onclick="toggleTransactionStatus('${s.id}', 'chicken_sales', 'paid')" class="px-3 py-1 text-xs rounded-r-lg transition-colors ${(s.status === 'paid') ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-white hover:bg-white/5 border-l border-white/10'}">Paid</button>
                            </div>
                             <div class="inline-flex gap-2 ml-2">
                                <button onclick="editHistoryRecord('${s.id}', 'chicken_sales')" class="text-blue-400 hover:text-blue-300 bg-blue-500/10 p-1.5 rounded transition-colors" title="Edit Record"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                                <button class="text-red-400 hover:text-red-300 delete-chicken-sale bg-red-500/10 p-1.5 rounded hover:bg-red-500/20 transition-colors" data-id="${s.id}" title="Delete Record">×</button>
                             </div>
                        </td>
                    </tr>`;

        // Mobile Card
        if (mList) {
            mListHtml += `
                    <div class="glass-card p-4 rounded-xl border border-white/5 relative bg-white/5 relative overflow-hidden">
                        <div class="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <p class="text-[10px] text-gray-500 font-mono mb-1">${d}</p>
                                <h4 class="font-bold text-white text-lg tracking-wide">${s.customerName}</h4>
                                <p class="text-[10px] uppercase tracking-widest text-gray-500">${s.khamar}</p>
                            </div>
                            <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${s.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}">${s.status}</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-center mb-4 text-xs bg-gray-900/40 p-3 rounded-lg border border-white/5 relative z-10">
                            <div><span class="block text-gray-600 text-[10px] uppercase font-bold tracking-wider">Weight</span><span class="text-gray-300 font-mono text-sm">${s.weight}kg</span></div>
                            <div><span class="block text-gray-600 text-[10px] uppercase font-bold tracking-wider">Rate</span><span class="text-gray-300 font-mono text-sm">@${s.rate}</span></div>
                            <div><span class="block text-gray-600 text-[10px] uppercase font-bold tracking-wider">Qty</span><span class="text-gray-300 font-mono text-sm">${s.quantity}</span></div>
                        </div>
                        <div class="flex justify-between items-center relative z-10">
                             <div class="flex gap-2">
                                 <button onclick="toggleTransactionStatus('${s.id}', 'chicken_sales', 'paid')" class="text-emerald-400 hover:text-white bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></button>
                                 <button class="text-red-400 hover:text-white bg-red-500/10 p-2 rounded-lg border border-red-500/20 delete-chicken-sale" data-id="${s.id}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                             </div>
                             <div class="text-right">
                                <p class="text-[10px] text-gray-500 uppercase font-bold">Total</p>
                                <p class="text-xl font-bold text-white text-shadow-glow">৳${s.totalAmount}</p>
                             </div>
                        </div>
                    </div>`;
        }
    });

    tb.innerHTML = tbHtml;
    if (mList) mList.innerHTML = mListHtml;

    // Re-render chart if dashboard is visible
    if (!document.getElementById('dashboard-view').classList.contains('hidden')) {
        renderDashboardChart();
        checkInventoryAlerts();
    }
}

function checkInventoryAlerts() {
    const container = document.getElementById('inventory-alerts');
    if (!container) return;
    container.innerHTML = '';

    const lowStock = products.filter(p => p.stock < 5);
    if (lowStock.length > 0) {
        lowStock.forEach(p => {
            container.innerHTML += `
                        <div class="bg-red-900/20 border border-red-500/30 p-4 rounded-xl shadow-lg flex justify-between items-center backdrop-blur-md">
                            <div class="flex items-center gap-3">
                                <span class="bg-red-500/20 text-red-400 p-2 rounded-full"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></span>
                                <div>
                                    <p class="font-bold text-red-400 text-sm">Low Stock Warning</p>
                                    <p class="text-xs text-red-300/80">Product <b>${p.name}</b> has only ${p.stock} ${p.unit} remaining.</p>
                                </div>
                            </div>
                            <button onclick="showView('purchase-view')" class="text-xs font-bold text-red-400 underline hover:text-red-300">Restock Now</button>
                        </div>
                    `;
        });
    }
}

window.printInvoice = function () {
    if (cart.length === 0) return showToast("Cart is empty", 'error');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(4, 120, 87); // Primary Green
    doc.text("AKHI POULTRY FARM 2.0", 105, 20, null, null, "center");

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Proprietor: Md. Sadikul Islam", 105, 26, null, null, "center");
    doc.text("Chapainawabganj | Phone: 01732-281710", 105, 31, null, null, "center");

    doc.setLineWidth(0.5);
    doc.line(20, 36, 190, 36);

    // Customer Info
    const custName = document.getElementById('customer-search-input').value || 'Walk-in Customer';
    const dateStr = new Date().toLocaleString();

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Customer: ${custName}`, 20, 45);
    doc.text(`Date: ${dateStr}`, 140, 45);

    // Item Table
    const headers = [["Item", "Qty", "Price", "Total"]];
    const data = cart.map(item => [
        item.name,
        `${item.qty} ${item.unit}`,
        `Tk ${item.price}`,
        `Tk ${item.total}`
    ]);

    doc.autoTable({
        head: headers,
        body: data,
        startY: 55,
        theme: 'striped',
        headStyles: { fillColor: [5, 150, 105] },
        styles: { fontSize: 10 }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    const subtotal = document.getElementById('cart-subtotal').innerText;
    const discount = document.getElementById('cart-discount').value || '0';
    const total = document.getElementById('cart-total').innerText;

    doc.text(`Subtotal: ${subtotal}`, 140, finalY);
    doc.text(`Discount: Tk ${discount}`, 140, finalY + 6);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${total}`, 140, finalY + 14);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Thank you for your business!", 105, finalY + 30, null, null, "center");

    doc.save(`Invoice_${Date.now()}.pdf`);
    showToast("Invoice Downloaded!");
}

window.downloadChickenSalesPDF = function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105); // Emerald Color
    doc.text("Sales Report", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    if (khamarFilter.khamarName !== 'ALL') {
        doc.text(`Farm: ${khamarFilter.khamarName}`, 14, 33);
    }

    // Filter Data Re-logic (Safe for Mobile/Desktop)
    const data = chickenSales.filter(s => {
        const matchesKhamar = khamarFilter.khamarName === 'ALL' || s.khamar === khamarFilter.khamarName;
        const matchesDate = isDateInRange(s.timestamp, khamarFilter.start, khamarFilter.end);
        return matchesKhamar && matchesDate;
    }).sort((a, b) => b.timestamp - a.timestamp);

    const tableData = data.map(s => [
        s.timestamp ? new Date(s.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '-',
        s.khamar,
        s.customerName,
        s.quantity,
        (s.weight || 0) + ' kg',
        '@' + (s.rate || 0),
        'Tk ' + s.totalAmount
    ]);

    doc.autoTable({
        head: [['Date', 'Farm', 'Buyer', 'Qty', 'Weight', 'Rate', 'Total']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 244] }, // light green tint
        styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save(`Sales_Report_${Date.now()}.pdf`);
    showToast("Report Downloaded");
}

// Advanced Feature: Financial Chart
let financialChartInstance = null;

function renderDashboardChart() {
    const ctx = document.getElementById('financialChart');
    if (!ctx) return;

    // Aggregate Data
    // We need daily aggregation for the selected period
    // Default 30 days
    const days = parseInt(document.getElementById('chart-period')?.value || 30);
    const now = new Date();
    const labels = [];
    const revenueData = [];
    const expenseData = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toLocaleDateString('en-GB');
        labels.push(dateStr);

        // Calculate Revenue (Pos Sales + Chicken Sales) for this day
        // Note: Timestamps are seconds. 
        const startTs = new Date(date.setHours(0, 0, 0, 0)).getTime() / 1000;
        const endTs = new Date(date.setHours(23, 59, 59, 999)).getTime() / 1000;

        const posDay = sales.filter(s => s.timestamp?.seconds >= startTs && s.timestamp?.seconds <= endTs)
            .reduce((a, b) => a + (b.totalAmount || 0), 0);

        const chickDay = chickenSales.filter(s => s.timestamp?.seconds >= startTs && s.timestamp?.seconds <= endTs)
            .reduce((a, b) => a + (b.totalAmount || 0), 0);

        revenueData.push(posDay + chickDay);

        // Calculate Expenses (Feed/Supplies + Purchase Stock)
        const feedDay = feedEntries.filter(s => s.timestamp?.seconds >= startTs && s.timestamp?.seconds <= endTs)
            .reduce((a, b) => a + (b.cost || 0), 0);

        const purchDay = purchases.filter(s => s.timestamp?.seconds >= startTs && s.timestamp?.seconds <= endTs)
            .reduce((a, b) => a + (b.totalCost || 0), 0);

        expenseData.push(feedDay + purchDay);
    }

    if (financialChartInstance) {
        financialChartInstance.destroy();
    }

    financialChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue (In)',
                    data: revenueData,
                    borderColor: '#059669', // Primary Green
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Expenses (Out)',
                    data: expenseData,
                    borderColor: '#ef4444', // Red
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ৳' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f3f4f6' }
                },
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 7 }
                }
            }
        }
    });
}

// UPDATED: Render Feed Table with Vaccine Column
function renderFeedTable() {
    const tb = document.getElementById('feed-table-body');
    if (!tb) return;
    tb.innerHTML = '';

    let data = feedEntries.filter(s => {
        const matchesKhamar = khamarFilter.khamarName === 'ALL' || s.khamar === khamarFilter.khamarName;
        const matchesDate = isDateInRange(s.timestamp, khamarFilter.start, khamarFilter.end);
        return matchesKhamar && matchesDate;
    });
    let tbHtml = '';
    data.sort((a, b) => b.timestamp - a.timestamp).forEach(f => {
        const d = f.timestamp ? new Date(f.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '';
        const cost = f.cost || 0;
        const paid = f.paidAmount || 0;
        const due = f.dueAmount !== undefined ? f.dueAmount : (cost - paid);

        const fmt = (v) => v > 0 ? `৳${v.toLocaleString()}` : '-';

        const other = (f.otherCost || 0);
        const custom = Array.isArray(f.customFields) ? f.customFields.reduce((a, b) => a + (b.cost || 0), 0) : 0;
        const misc = other + custom;

        tbHtml += `<tr class="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                    <td class="p-3 text-gray-400">${d}</td>
                    <td class="p-3 font-bold text-gray-200">${f.khamar}</td>
                    <td class="p-3 text-gray-300 font-mono">${f.feedQty || '-'}</td>
                    <td class="p-3 text-gray-300 font-mono">${f.guraQty || '-'}</td>
                    <td class="p-3 text-right text-gray-500 text-xs">${fmt(f.feedCost)}</td>
                    <td class="p-3 text-right text-gray-500 text-xs">${fmt(f.guraCost)}</td>
                    <td class="p-3 text-right text-blue-400/80 font-medium text-xs">${fmt(f.chickenCost)}</td>
                    <td class="p-3 text-right text-orange-400/80 font-medium text-xs">${fmt(f.cleaningCost)}</td>
                    <td class="p-3 text-right text-purple-400/80 font-medium text-xs">${fmt((f.vaccineCost || 0) + (f.medicineCost || 0))}</td>
                    <td class="p-3 text-right text-gray-500 text-xs">${fmt(misc)}</td>
                    <td class="p-3 text-right font-bold text-white">৳${cost.toLocaleString()}</td>
                    <td class="p-3 text-right text-emerald-400">৳${paid.toLocaleString()}</td>
                    <td class="p-3 text-right text-red-400 font-bold">৳${due.toLocaleString()}</td>
                    <td class="p-3">
                         <div class="inline-flex gap-2">
                            <button onclick="editHistoryRecord('${f.id}', 'feed')" class="text-blue-400 hover:text-blue-300 bg-blue-500/10 p-1.5 rounded transition-colors" title="Edit"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                            <button class="text-red-400 hover:text-red-300 delete-feed bg-red-500/10 p-1.5 rounded hover:bg-red-500/20 transition-colors" data-id="${f.id}" title="Delete">×</button>
                         </div>
                    </td>
                </tr>`;
    });
    tb.innerHTML = tbHtml;

    const thead = document.querySelector('#section-feed table thead');
    if (thead) {
        thead.innerHTML = `
                <tr class="text-gray-400 border-b border-white/10">
                    <th class="p-3 text-xs font-bold uppercase tracking-wider">Date</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider">Khamar</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider">Feed</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider">Gura</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider text-right">Feed Tk</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider text-right">Gura Tk</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider text-right text-blue-400">Chick Tk</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider text-right text-orange-400">Clean Tk</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider text-right text-purple-400">Vac/Med</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider text-right">Misc</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider text-right text-white">Total</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider text-right text-emerald-400">Paid</th>
                    <th class="p-3 text-xs font-bold uppercase tracking-wider text-right text-red-400">Due</th>
                    <th class="p-3"></th>
                </tr>`;
    }
} // End renderFeedTable

// UPDATED: Render Feed Ledger including Vaccine
function renderFeedLedger() {
    const listId = 'feed-ledger-list';
    let listEl = document.getElementById(listId);
    if (!listEl) return;

    let data = feedEntries.filter(s => {
        const matchesKhamar = khamarFilter.khamarName === 'ALL' || s.khamar === khamarFilter.khamarName;
        const matchesDate = isDateInRange(s.timestamp, khamarFilter.start, khamarFilter.end);
        return matchesKhamar && matchesDate;
    });

    let ledger = {};
    data.forEach(f => {
        if (!ledger[f.khamar]) {
            ledger[f.khamar] = {
                totalCost: 0, totalPaid: 0, totalDue: 0,
                feedCost: 0, guraCost: 0, chickenCost: 0, cleaningCost: 0, vaccineCost: 0, medicineCost: 0
            };
        }
        ledger[f.khamar].totalCost += (f.cost || 0);
        ledger[f.khamar].totalPaid += (f.paidAmount || 0);
        ledger[f.khamar].totalDue = ledger[f.khamar].totalCost - ledger[f.khamar].totalPaid;

        ledger[f.khamar].feedCost += (f.feedCost || 0);
        ledger[f.khamar].guraCost += (f.guraCost || 0);
        ledger[f.khamar].chickenCost += (f.chickenCost || 0);
        ledger[f.khamar].cleaningCost += (f.cleaningCost || 0);
        ledger[f.khamar].vaccineCost += (f.vaccineCost || 0) + (f.medicineCost || 0);

        const other = (f.otherCost || 0);
        const custom = Array.isArray(f.customFields) ? f.customFields.reduce((a, b) => a + (b.cost || 0), 0) : 0;
        ledger[f.khamar].otherTotal = (ledger[f.khamar].otherTotal || 0) + other + custom;
    });

    let html = '';
    let gCost = 0, gPaid = 0, gDue = 0;

    Object.keys(ledger).sort().forEach(kName => {
        const l = ledger[kName];
        gCost += l.totalCost;
        gPaid += l.totalPaid;
        gDue += l.totalDue;

        html += `
                <div class="flex flex-col glass-card border border-white/5 rounded-lg mb-3 overflow-hidden hover:bg-white/5 transition-colors">
                    <div class="flex justify-between items-center p-3 border-b border-white/5">
                        <div class="font-bold text-white w-1/3 truncate text-sm">${kName}</div>
                        <div class="text-right w-2/3 font-bold text-white/90 text-sm">Total: ৳${l.totalCost.toLocaleString()}</div>
                    </div>
                    <div class="p-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-400">
                        <div class="flex justify-between"><span>Feed:</span> <span class="font-mono text-gray-300">৳${l.feedCost.toLocaleString()}</span></div>
                        <div class="flex justify-between"><span>Gura:</span> <span class="font-mono text-gray-300">৳${l.guraCost.toLocaleString()}</span></div>
                        <div class="flex justify-between text-blue-400"><span>Chicken:</span> <span class="font-mono">৳${l.chickenCost.toLocaleString()}</span></div>
                        <div class="flex justify-between text-orange-400"><span>Cleaning:</span> <span class="font-mono">৳${l.cleaningCost.toLocaleString()}</span></div>
                        <div class="flex justify-between text-purple-400"><span>Vac/Med:</span> <span class="font-mono">৳${l.vaccineCost.toLocaleString()}</span></div>
                        <div class="flex justify-between text-gray-500"><span>Misc:</span> <span class="font-mono">৳${(l.otherTotal || 0).toLocaleString()}</span></div>
                    </div>
                    <div class="flex justify-between items-center p-2 bg-white/5 border-t border-white/5 text-xs">
                        <div class="flex gap-4 pl-2 w-full justify-end">
                           <span class="text-gray-400">Paid: <b class="text-emerald-400 ml-1">৳${l.totalPaid.toLocaleString()}</b></span>
                           <span class="text-gray-400 ml-2">Due: <b class="text-red-400 ml-1">৳${l.totalDue.toLocaleString()}</b></span>
                        </div>
                    </div>
                </div>`;
    });

    listEl.innerHTML = html || '<p class="text-gray-500 text-center p-4 italic">No supply records found</p>';

    document.getElementById('feed-ledger-total-cost').innerText = `৳${gCost.toLocaleString()}`;
    document.getElementById('feed-ledger-total-paid').innerText = `৳${gPaid.toLocaleString()}`;
    document.getElementById('feed-ledger-total-due').innerText = `৳${gDue.toLocaleString()}`;
}

// Render Purchase Table
function renderPurchaseTable() {
    const tb = document.getElementById('purchase-table-body');
    const cardList = document.getElementById('purchase-card-list');
    tb.innerHTML = '';
    cardList.innerHTML = '';

    let totalCost = 0;
    let totalPaid = 0;
    let totalDue = 0;

    let data = purchases.filter(p => {
        return isDateInRange(p.timestamp, purchaseFilter.start, purchaseFilter.end);
    });

    let tbHtml = '';
    let cardListHtml = '';
    data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).forEach(p => {
        const d = p.entryDate || (p.timestamp ? new Date(p.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '-');
        const cost = p.totalCost || p.cost || 0;
        const paid = p.paidAmount !== undefined ? p.paidAmount : cost;
        const due = p.dueAmount !== undefined ? p.dueAmount : 0;
        // Calculate rate from quantity if needed
        const rate = p.buyRate || (p.quantity > 0 ? (cost / p.quantity).toFixed(2) : 0);

        totalCost += cost;
        totalPaid += paid;
        totalDue += due;

        const prod = products.find(x => x.name.trim().toLowerCase() === p.itemName.trim().toLowerCase());
        const currentStock = prod ? prod.stock : 0;
        const stockBadge = prod
            ? `<span class="text-xs px-2 py-1 rounded ${currentStock < 10 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'} font-medium border border-white/5">${currentStock}</span>`
            : `<span class="text-xs text-gray-500">N/A</span>`;

        let statusClass = 'text-gray-500';
        let statusText = '-';
        if (due > 0) { statusClass = 'text-red-400 font-bold'; statusText = `Due ${due}`; }
        else if (due < 0) { statusClass = 'text-emerald-400'; statusText = `Adv ${Math.abs(due)}`; }
        else { statusClass = 'text-emerald-400 font-bold'; statusText = 'Paid'; }

        // Desktop Row
        tbHtml += `
                <tr class="border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
                    <td class="p-4 text-gray-400 whitespace-nowrap">${d}</td>
                    <td class="p-4">
                        <div class="font-bold text-gray-200">${p.itemName}</div>
                        <div class="text-xs text-gray-500">${p.supplier || ''}</div>
                    </td>
                    <td class="p-4 text-center">
                         <span class="bg-white/5 px-2 py-1 rounded text-white font-mono border border-white/10">${p.quantity}</span>
                    </td>
                    <td class="p-4 text-right text-gray-400">৳${rate}</td>
                    <td class="p-4 text-right font-medium text-white">৳${cost.toLocaleString()}</td>
                    <td class="p-4 text-right text-emerald-400">৳${paid.toLocaleString()}</td>
                    <td class="p-4 text-right ${statusClass} text-xs">${statusText}</td>
                    <td class="p-4 text-center">${stockBadge}</td>
                    <td class="p-4 text-right">
                        <button class="text-red-400 hover:text-red-300 delete-purchase transition-transform active:scale-95 bg-red-500/10 p-2 rounded hover:bg-red-500/20" data-id="${p.id}" title="Delete">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>`;

        // Mobile Card
        cardListHtml += `
                <div class="glass-card p-4 rounded-xl border border-white/5 relative group">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">${d}</p>
                            <h4 class="font-bold text-white text-lg">${p.itemName}</h4>
                            <p class="text-xs text-gray-400">${p.supplier || 'No Supplier'}</p>
                        </div>
                        <button class="text-red-400 hover:text-red-300 p-2 delete-purchase bg-red-500/10 rounded" data-id="${p.id}">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-sm mb-3">
                         <div class="bg-white/5 p-2 rounded text-center border border-white/5">
                            <span class="block text-[10px] text-gray-500 uppercase">Qty</span>
                            <span class="font-mono font-bold text-gray-200">${p.quantity}</span>
                         </div>
                         <div class="bg-white/5 p-2 rounded text-center border border-white/5">
                            <span class="block text-[10px] text-gray-500 uppercase">Rate</span>
                            <span class="font-mono text-gray-200">৳${rate}</span>
                         </div>
                         <div class="bg-blue-500/10 p-2 rounded text-center border border-blue-500/20">
                            <span class="block text-[10px] text-blue-400 uppercase">Stock</span>
                            <span class="font-bold text-blue-300">${currentStock}</span>
                         </div>
                    </div>
                    <div class="flex justify-between items-center text-sm pt-2 border-t border-white/10 border-dashed">
                        <div>
                            <span class="text-xs text-gray-500">Total</span>
                            <p class="font-bold text-white">৳${cost.toLocaleString()}</p>
                        </div>
                        <div class="text-right">
                             <span class="text-xs text-gray-500">Status</span>
                             <p class="${statusClass}">${statusText}</p>
                        </div>
                    </div>
                </div>`;
    });

    tb.innerHTML = tbHtml;
    cardList.innerHTML = cardListHtml;

    document.getElementById('ledger-total-cost').innerText = `৳${totalCost.toLocaleString()}`;
    document.getElementById('ledger-total-paid').innerText = `৳${totalPaid.toLocaleString()}`;
    document.getElementById('ledger-total-due').innerText = `৳${totalDue.toLocaleString()}`;
}

function renderReportsTable() {
    try {
        const tb = document.getElementById('reports-table-body');
        if (!tb) return;
        tb.innerHTML = '';
        let allRecs = [];

        // 1. POS Sales
        if (Array.isArray(sales)) {
            sales.forEach(s => {
                const c = customers.find(x => x.id === s.customerId);
                allRecs.push({
                    id: s.id,
                    sortDate: (s.timestamp && s.timestamp.seconds) ? s.timestamp.seconds : 0,
                    date: s.timestamp ? new Date(s.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '',
                    customerName: c ? c.name : 'Walk-in',
                    amount: s.totalAmount || 0,
                    status: s.status || 'paid',
                    type: 'POS Sale',
                    collection: 'sales'
                });
            });
        }

        // 2. Chicken Sales
        if (Array.isArray(chickenSales)) {
            chickenSales.forEach(s => {
                allRecs.push({
                    id: s.id,
                    sortDate: (s.timestamp && s.timestamp.seconds) ? s.timestamp.seconds : 0,
                    date: s.timestamp ? new Date(s.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '',
                    customerName: s.customerName || s.khamar || 'Unknown',
                    amount: s.totalAmount || 0,
                    status: s.status || 'due',
                    type: 'Chicken Sale',
                    collection: 'chicken_sales'
                });
            });
        }

        // 3. Feed Entries (Supplies)
        if (Array.isArray(feedEntries)) {
            feedEntries.forEach(s => {
                const cost = s.cost || 0;
                if (cost > 0) {
                    allRecs.push({
                        id: s.id,
                        sortDate: (s.timestamp && s.timestamp.seconds) ? s.timestamp.seconds : 0,
                        date: s.timestamp ? new Date(s.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '',
                        customerName: s.khamar || 'Unknown Farm',
                        amount: cost,
                        status: (s.dueAmount <= 0) ? 'paid' : 'due',
                        type: 'Farm Supply',
                        collection: 'feed_entries'
                    });
                }
            });
        }

        // Filtering
        let filtered = allRecs.filter(r => {
            const tsObj = { seconds: r.sortDate };
            const matchesDate = isDateInRange(tsObj, reportFilter.start, reportFilter.end);
            const matchesCustomer = reportFilter.customer === '' || (r.customerName && r.customerName.toLowerCase().includes(reportFilter.customer));
            return matchesDate && matchesCustomer;
        });

        filtered.sort((a, b) => b.sortDate - a.sortDate).forEach(r => {
            const statusColor = r.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400';

            // Modify logic to include Edit buttons for supported records
            let opBtns = '';
            if (r.collection === 'sales') {
                opBtns = `<button onclick="editHistoryRecord('${r.id}', 'sales')" class="text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded text-xs mr-2 border border-blue-500/20">Edit</button>
                          <button class="text-red-400 hover:text-red-300 delete-sale bg-red-500/10 px-2 py-1 rounded text-xs border border-red-500/20" data-id="${r.id}">Del</button>`;
            } else if (r.collection === 'chicken_sales') {
                opBtns = `<button onclick="editHistoryRecord('${r.id}', 'chicken_sales')" class="text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded text-xs mr-2 border border-blue-500/20">Edit</button>
                          <button class="text-red-400 hover:text-red-300 delete-chicken-sale bg-red-500/10 px-2 py-1 rounded text-xs border border-red-500/20" data-id="${r.id}">Del</button>`;
            } else if (r.collection === 'feed_entries') {
                opBtns = `<button onclick="editHistoryRecord('${r.id}', 'feed')" class="text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded text-xs mr-2 border border-blue-500/20">Edit</button>
                          <button class="text-red-400 hover:text-red-300 delete-feed bg-red-500/10 px-2 py-1 rounded text-xs border border-red-500/20" data-id="${r.id}">Del</button>`;
            }

            tb.innerHTML += `<tr class="border-b border-white/5 text-sm md:text-sm text-gray-300 hover:bg-white/5 transition-colors">
                        <td class="p-3 font-mono text-xs text-gray-500">${r.type}</td>
                        <td class="p-3 text-xs text-gray-400">${r.date}</td>
                        <td class="p-3 text-white font-medium">${r.customerName}</td>
                        <td class="p-3 font-bold text-white">৳${r.amount.toLocaleString()}</td>
                        <td class="p-3"><span class="px-2 py-1 rounded-full text-xs border border-white/5 ${statusColor}">${r.status.toUpperCase()}</span></td>
                        <td class="p-3 whitespace-nowrap">${opBtns}</td>
                    </tr>`;
        });

        if (filtered.length === 0) tb.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-500 italic">No records found</td></tr>';
    } catch (e) { console.error("Error rendering reports:", e); }
}

window.editCustomer = async function (id) {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    const newName = prompt("Edit Customer Name:", c.name);
    const newPhone = prompt("Edit Phone:", c.phone);
    if (newName && newName.trim() !== "") {
        try {
            const oldName = c.name;
            const finalName = newName.trim();
            const b = writeBatch(db);

            b.update(doc(customersCollection, id), {
                name: finalName,
                phone: newPhone ? newPhone.trim() : c.phone
            });

            // Cascade to related history
            sales.filter(s => s.customerName === oldName).forEach(s => b.update(doc(salesCollection, s.id), { customerName: finalName }));
            quotations.filter(q => q.client === oldName).forEach(q => b.update(doc(quotationsCollection, q.id), { client: finalName }));
            installments.filter(i => i.party === oldName).forEach(i => b.update(doc(installmentsCollection, i.id), { party: finalName }));
            chickenSales.filter(cs => cs.customerName === oldName).forEach(cs => b.update(doc(chickenSalesCollection, cs.id), { customerName: finalName }));
            purchases.filter(p => p.supplier === oldName).forEach(p => b.update(doc(purchaseCollection, p.id), { supplier: finalName }));

            await b.commit();
            showToast("Customer Updated");
        } catch (e) { console.error(e); showToast("Update Failed", "error"); }
    }
}

window.editKhamar = async function (id) {
    const k = khamars.find(x => x.id === id);
    if (!k) return;
    const newName = prompt("Edit Farm Name:", k.name);
    if (newName && newName.trim() !== "") {
        try {
            const oldName = k.name;
            const finalName = newName.trim();
            const b = writeBatch(db);

            b.update(doc(khamarsCollection, id), { name: finalName });

            // Cascade Khamar Name
            chickenSales.filter(cs => cs.khamar === oldName).forEach(cs => b.update(doc(chickenSalesCollection, cs.id), { khamar: finalName }));
            feedEntries.filter(fe => fe.khamar === oldName).forEach(fe => b.update(doc(feedCollection, fe.id), { khamar: finalName }));
            khamariEntries.filter(k => k.khamar === oldName).forEach(k => b.update(doc(khamariCollection, k.id), { khamar: finalName }));
            feedGuraEntries.filter(fg => fg.khamarName === oldName).forEach(fg => b.update(doc(feedGuraCollection, fg.id), { khamarName: finalName }));

            // Update associated customer if exists
            const c = customers.find(x => x.name.trim().toLowerCase() === oldName.trim().toLowerCase());
            if (c) {
                b.update(doc(customersCollection, c.id), { name: finalName });
                sales.filter(s => s.customerName === oldName).forEach(s => b.update(doc(salesCollection, s.id), { customerName: finalName }));
                quotations.filter(q => q.client === oldName).forEach(q => b.update(doc(quotationsCollection, q.id), { client: finalName }));
                installments.filter(i => i.party === oldName).forEach(i => b.update(doc(installmentsCollection, i.id), { party: finalName }));
            }

            await b.commit();
            showToast("Farm Updated");
            // Refresh UI handled by snapshot
        } catch (e) { console.error(e); showToast("Update Failed", "error"); }
    }
}

function renderCustomersTable(searchTerm = '') {
    const tb = document.getElementById('customers-table-body');
    tb.innerHTML = '';
    const term = searchTerm.toLowerCase();
    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term)
    );

    let htmlRows = '';
    filtered.forEach(c => {
        htmlRows += `<tr class="border-b border-white/5 view-customer-row cursor-pointer hover:bg-white/5 transition-colors" data-id="${c.id}">
                    <td class="p-4 font-medium text-white">${c.name}</td>
                    <td class="p-4 text-gray-400">${c.phone}</td>
                    <td class="p-4 text-right space-x-2">
                        <button onclick="event.stopPropagation(); editCustomer('${c.id}')" class="text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1 rounded text-xs">Edit</button>
                        <button class="text-red-400 hover:text-red-300 delete-customer bg-red-500/10 px-3 py-1 rounded text-xs" data-id="${c.id}">Delete</button>
                    </td>
                </tr>`;
    });

    const safeSearchTerm = searchTerm.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    tb.innerHTML = htmlRows || `<tr><td colspan="3" class="p-6 text-center text-gray-500 italic">No customers found matching "${safeSearchTerm}"</td></tr>`;
}

window.toggleSalesFullscreen = function () {
    const card = document.getElementById('chicken-sales-card');
    const iconMax = document.getElementById('icon-maximize');
    const iconMin = document.getElementById('icon-minimize');

    if (card.classList.contains('fixed')) {
        // Minimize
        card.classList.remove('fixed', 'inset-0', 'z-[60]', 'bg-gray-900', 'h-full', 'rounded-none', 'border-0');
        card.classList.add('rounded-xl', 'border', 'relative');

        const inner = card.querySelector('.overflow-x-auto');
        if (inner) {
            inner.classList.remove('h-[calc(100vh-100px)]');
            inner.classList.remove('h-full');
        }

        document.body.style.overflow = '';
        iconMax.classList.remove('hidden');
        iconMin.classList.add('hidden');
    } else {
        // Maximize
        card.classList.add('fixed', 'inset-0', 'z-[60]', 'bg-gray-900', 'h-full', 'rounded-none', 'border-0');
        card.classList.remove('rounded-xl', 'border', 'relative');

        const inner = card.querySelector('.overflow-x-auto');
        if (inner) {
            inner.classList.add('h-[calc(100vh-100px)]');
        }

        document.body.style.overflow = 'hidden';
        iconMax.classList.add('hidden');
        iconMin.classList.remove('hidden');
    }
}

// --- KHAMARI LOGIC ---
window.khamariSelectedMeds = [];

window.handleAddKhamariMed = function () {
    const nameInput = document.getElementById('khamari-med-name');
    const qtyInput = document.getElementById('khamari-med-qty');
    const rateInput = document.getElementById('khamari-med-rate');

    const name = nameInput.value.trim();
    const qty = parseFloat(qtyInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;

    if (!name || qty <= 0) {
        showToast("Please enter a valid medicine name and quantity.", "error");
        return;
    }

    khamariSelectedMeds.push({ name, qty, rate, total: qty * rate });
    renderKhamariMedsList();

    nameInput.value = '';
    qtyInput.value = '';
    rateInput.value = '';
};

function renderKhamariMedsList() {
    const container = document.getElementById('khamari-added-meds');
    if (!container) return;
    container.innerHTML = '';
    khamariSelectedMeds.forEach((m, idx) => {
        const div = document.createElement('div');
        div.className = "flex justify-between items-center bg-gray-900/50 p-2 rounded border border-white/5";
        div.innerHTML = `
                    <span class="text-purple-300 font-medium">${m.name} <span class="text-gray-400 text-[10px] ml-1">x${m.qty} @৳${m.rate}</span></span>
                    <div class="flex items-center gap-3">
                        <span class="text-white font-bold tracking-wide">৳${m.total}</span>
                        <button onclick="removeKhamariMed(${idx})" class="text-red-400 hover:text-red-300">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                `;
        container.appendChild(div);
    });
};

window.removeKhamariMed = function (idx) {
    khamariSelectedMeds.splice(idx, 1);
    renderKhamariMedsList();
};

window.handleDeleteKhamariEntry = async function (id) {
    if (confirm("Are you sure you want to delete this daily account entry?")) {
        try {
            await deleteDoc(doc(khamariCollection, id));
            showToast("Entry deleted successfully.", "success");
        } catch (e) {
            console.error(e);
            showToast("Failed to delete", "error");
        }
    }
};

function renderKhamariMedSuggestions() {
    const input = document.getElementById('khamari-med-name');
    const resultsBox = document.getElementById('khamari-med-results');
    if (!input || !resultsBox) return;

    const term = input.value.toLowerCase();
    resultsBox.innerHTML = '';

    if (term.length < 1) {
        resultsBox.classList.add('hidden');
        return;
    }

    const meds = products.filter(p => p.name.toLowerCase().includes(term));
    if (meds.length === 0) {
        resultsBox.innerHTML = '<div class="p-3 text-sm text-gray-400">No medicine/product found</div>';
        resultsBox.classList.remove('hidden');
        return;
    }

    meds.forEach(p => {
        const div = document.createElement('div');
        div.className = 'p-3 hover:bg-emerald-500/20 cursor-pointer text-sm text-gray-200 border-b border-white/5 transition-colors';
        div.innerHTML = `<span class="font-bold">${p.name}</span> <span class="text-emerald-400 text-xs ml-2">Rate: ৳${p.price}</span>`;
        div.onclick = () => {
            input.value = p.name;
            document.getElementById('khamari-med-rate').value = p.price;
            resultsBox.classList.add('hidden');
        };
        resultsBox.appendChild(div);
    });
    resultsBox.classList.remove('hidden');
}

window.handleRecordKhamari = async function () {
    const dateStr = document.getElementById('khamari-date').value || new Date().toISOString().split('T')[0];
    const farmId = document.getElementById('khamari-farm-select').value;

    if (!farmId || farmId === 'Select Farm') {
        showToast("Please select a farm", "error");
        return;
    }

    const farm = khamars.find(k => k.id === farmId);
    const farmName = farm ? farm.name : "Unknown Farm";

    // Additional inputs
    const dealerName = document.getElementById('khamari-feed-dealer').value.trim();
    const companyName = document.getElementById('khamari-feed-company').value.trim();

    const sonaliFeedQty = parseFloat(document.getElementById('khamari-sonali-feed-qty').value) || 0;
    const sonaliFeedRate = parseFloat(document.getElementById('khamari-sonali-feed-rate').value) || 0;
    const broilerFeedQty = parseFloat(document.getElementById('khamari-broiler-feed-qty').value) || 0;
    const broilerFeedRate = parseFloat(document.getElementById('khamari-broiler-feed-rate').value) || 0;
    const guraQty = parseFloat(document.getElementById('khamari-gura-qty').value) || 0;
    const guraRate = parseFloat(document.getElementById('khamari-gura-rate').value) || 0;
    const sonaliChickQty = parseFloat(document.getElementById('khamari-sonali-chick-qty').value) || 0;
    const sonaliChickRate = parseFloat(document.getElementById('khamari-sonali-chick-rate').value) || 0;
    const broilerChickQty = parseFloat(document.getElementById('khamari-broiler-chick-qty').value) || 0;
    const broilerChickRate = parseFloat(document.getElementById('khamari-broiler-chick-rate').value) || 0;

    let medsTotalAmount = 0;
    khamariSelectedMeds.forEach(m => medsTotalAmount += m.total);

    const otherCost = parseFloat(document.getElementById('khamari-other-cost').value) || 0;
    const otherCostDesc = document.getElementById('khamari-other-cost-desc').value.trim();

    const totalAmount =
        (sonaliFeedQty * sonaliFeedRate) +
        (broilerFeedQty * broilerFeedRate) +
        (guraQty * guraRate) +
        (sonaliChickQty * sonaliChickRate) +
        (broilerChickQty * broilerChickRate) +
        medsTotalAmount +
        otherCost;

    if (totalAmount === 0 && sonaliFeedQty === 0 && broilerFeedQty === 0 && guraQty === 0 && medsTotalAmount === 0) {
        showToast("Entry must have some quantities or amount.", "error");
        return;
    }

    const btn = document.getElementById('btn-record-khamari');
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
        const ts = new Date(dateStr);
        ts.setHours(new Date().getHours());
        ts.setMinutes(new Date().getMinutes());

        await addDoc(khamariCollection, {
            farmId: farmId,
            farmName: farmName,
            date: dateStr,
            timestamp: ts,
            metrics: {
                feedMetadata: { dealer: dealerName, company: companyName },
                sonaliFeed: { qty: sonaliFeedQty, rate: sonaliFeedRate, total: sonaliFeedQty * sonaliFeedRate },
                broilerFeed: { qty: broilerFeedQty, rate: broilerFeedRate, total: broilerFeedQty * broilerFeedRate },
                gura: { qty: guraQty, rate: guraRate, total: guraQty * guraRate },
                sonaliChicks: { qty: sonaliChickQty, rate: sonaliChickRate, total: sonaliChickQty * sonaliChickRate },
                broilerChicks: { qty: broilerChickQty, rate: broilerChickRate, total: broilerChickQty * broilerChickRate },
                medicines: [...khamariSelectedMeds],
                other: { desc: otherCostDesc, cost: otherCost }
            },
            totalAmount: totalAmount
        });

        showToast("Daily Entry Saved Successfully!");

        // Clear fields
        document.getElementById('khamari-feed-dealer').value = '';
        document.getElementById('khamari-feed-company').value = '';
        document.getElementById('khamari-sonali-feed-qty').value = '';
        document.getElementById('khamari-sonali-feed-rate').value = '';
        document.getElementById('khamari-broiler-feed-qty').value = '';
        document.getElementById('khamari-broiler-feed-rate').value = '';
        document.getElementById('khamari-gura-qty').value = '';
        document.getElementById('khamari-gura-rate').value = '';
        document.getElementById('khamari-sonali-chick-qty').value = '';
        document.getElementById('khamari-sonali-chick-rate').value = '';
        document.getElementById('khamari-broiler-chick-qty').value = '';
        document.getElementById('khamari-broiler-chick-rate').value = '';
        document.getElementById('khamari-other-cost').value = '';
        document.getElementById('khamari-other-cost-desc').value = '';

        khamariSelectedMeds = [];
        renderKhamariMedsList();

    } catch (error) {
        console.error("Error saving Khamari Entry:", error);
        showToast("Failed to save entry", "error");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function renderKhamariTable() {
    const tb = document.getElementById('khamari-table-body');
    const select = document.getElementById('khamari-farm-select');

    // Populate select dropdown
    if (select) {
        const currentVal = select.value;
        select.innerHTML = '<option class="text-gray-900" value="">Select Farm</option>';
        khamars.forEach(k => {
            select.innerHTML += `<option class="text-gray-900" value="${k.id}">${k.name}</option>`;
        });
        select.value = currentVal;
    }
    if (!tb) return;

    // Render table
    tb.innerHTML = '';

    // Sort by latest
    const sorted = [...khamariEntries].sort((a, b) => {
        const tA = a.timestamp?.seconds || 0;
        const tB = b.timestamp?.seconds || 0;
        return tB - tA;
    });

    if (sorted.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-gray-500 italic">No entries found</td></tr>';
        return;
    }

    sorted.forEach(entry => {
        let metricsDesc = '';
        const m = entry.metrics || {};

        if (m.feedMetadata && (m.feedMetadata.dealer || m.feedMetadata.company)) {
            metricsDesc += `<span class="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[10px] mr-1 block mb-1">
                        ${m.feedMetadata.dealer ? 'Diller: ' + m.feedMetadata.dealer : ''} ${m.feedMetadata.company ? '| Co: ' + m.feedMetadata.company : ''}
                    </span>`;
        }

        if (m.sonaliFeed?.total !== 0 && m.sonaliFeed?.qty) metricsDesc += `<span class="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[10px] mr-1">Sonali Feed (${m.sonaliFeed.qty}): ৳${m.sonaliFeed.total}</span>`;
        if (m.broilerFeed?.total !== 0 && m.broilerFeed?.qty) metricsDesc += `<span class="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] mr-1">Broil Feed (${m.broilerFeed.qty}): ৳${m.broilerFeed.total}</span>`;
        if (m.gura?.total !== 0 && m.gura?.qty) metricsDesc += `<span class="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] mr-1">Gura (${m.gura.qty}): ৳${m.gura.total}</span>`;
        if (m.sonaliChicks?.total > 0) metricsDesc += `<span class="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] mr-1">S.Chicks: ৳${m.sonaliChicks.total}</span>`;
        if (m.broilerChicks?.total > 0) metricsDesc += `<span class="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[10px] mr-1">B.Chicks: ৳${m.broilerChicks.total}</span>`;

        if (m.medicines && m.medicines.length > 0) {
            m.medicines.forEach(med => {
                metricsDesc += `<span class="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[10px] mr-1">Med (${med.name} x${med.qty}): ৳${med.total}</span>`;
            });
        } else if (m.medicine?.total > 0) { // Legacy
            metricsDesc += `<span class="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[10px] mr-1">Med (${m.medicine.name}): ৳${m.medicine.total}</span>`;
        }

        if (m.other?.cost > 0) metricsDesc += `<span class="bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded text-[10px] mr-1">Other: ৳${m.other.cost}</span>`;

        tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                    <td class="p-3 text-gray-400">${entry.date || '-'}</td>
                    <td class="p-3 font-bold text-gray-200">${entry.farmName || 'Unknown'}</td>
                    <td class="p-3 flex flex-wrap gap-1 items-center max-w-[300px]">${metricsDesc}</td>
                    <td class="p-3 text-right font-bold text-white tracking-wide">৳${(entry.totalAmount || 0).toLocaleString()}</td>
                    <td class="p-3 text-center">
                        <button onclick="handleDeleteKhamariEntry('${entry.id}')" class="text-red-400 hover:text-red-300 p-1 bg-red-500/10 rounded">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>`;
    });
}

// --- FEED & GURA MANAGEMENT LOGIC ---
window.addFgmDestinationRow = function () {
    const container = document.getElementById('fgm-destinations-container');
    const row = document.createElement('div');
    row.className = "flex flex-col gap-2 p-3 bg-gray-900/50 rounded-lg border border-white/5 relative fgm-row mt-2";

    let options = '<option class="text-gray-900" value="">Select Farm</option>';
    khamars.forEach(k => {
        options += `<option class="text-gray-900" value="${k.id}">${k.name}</option>`;
    });

    row.innerHTML = `
        <div class="flex gap-2 items-center">
            <select class="fgm-khamar-select flex-1 input-field py-2 px-3 text-sm bg-gray-900/80 border-white/10 focus:border-amber-500 outline-none text-gray-300">
                ${options}
            </select>
            <input type="number" class="fgm-qty flex-[0.5] input-field py-2 px-3 text-sm bg-gray-900/80 border-white/10 focus:border-amber-500 outline-none" placeholder="Qty (Sacks)">
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="bg-red-900/50 hover:bg-red-900/80 text-white p-2 px-3 text-sm font-bold rounded-lg">&times;</button>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-2 mt-1">
            <input type="number" class="fgm-vaccine flex-1 input-field py-1.5 px-3 text-xs bg-gray-900/80 border-white/10" placeholder="Vaccine/Clean (৳)">
            <input type="text" class="fgm-med-name flex-1 input-field py-1.5 px-3 text-xs bg-gray-900/80 border-white/10" placeholder="Medicine Name">
            <input type="number" class="fgm-med-cost flex-1 input-field py-1.5 px-3 text-xs bg-gray-900/80 border-white/10" placeholder="Medicine (৳)">
            <input type="text" class="fgm-custom-desc flex-1 input-field py-1.5 px-3 text-xs bg-gray-900/80 border-white/10" placeholder="Custom Desc">
            <input type="number" class="fgm-custom-cost flex-1 input-field py-1.5 px-3 text-xs bg-gray-900/80 border-white/10" placeholder="Custom Cost (৳)">
        </div>
    `;
    container.appendChild(row);
};

function populateFgmSelects() {
    const selects = document.querySelectorAll('.fgm-khamar-select');
    selects.forEach(select => {
        const currentVal = select.value;
        select.innerHTML = '<option class="text-gray-900" value="">Select Farm</option>';
        khamars.forEach(k => {
            select.innerHTML += `<option class="text-gray-900" value="${k.id}">${k.name}</option>`;
        });
        select.value = currentVal;
    });
}

window.handleRecordFgm = async function () {
    const dateStr = document.getElementById('fgm-date').value || new Date().toISOString().split('T')[0];
    const dealerName = document.getElementById('fgm-dealer').value.trim();
    const companyName = document.getElementById('fgm-company').value.trim();
    const feedType = document.getElementById('fgm-feed-type').value;

    if (!dealerName || !companyName) {
        showToast("Please enter Dealer and Company details.", "error");
        return;
    }

    const items = [];
    let totalQty = 0;
    const rows = document.querySelectorAll('#fgm-destinations-container .fgm-row');
    rows.forEach(row => {
        const sel = row.querySelector('.fgm-khamar-select');
        const qtyInput = row.querySelector('.fgm-qty');

        const vaccineCost = parseFloat(row.querySelector('.fgm-vaccine').value) || 0;
        const medName = row.querySelector('.fgm-med-name').value.trim();
        const medCost = parseFloat(row.querySelector('.fgm-med-cost').value) || 0;
        const customDesc = row.querySelector('.fgm-custom-desc').value.trim();
        const customCost = parseFloat(row.querySelector('.fgm-custom-cost').value) || 0;

        if (sel && qtyInput) {
            const farmId = sel.value;
            const qty = parseFloat(qtyInput.value) || 0;
            if (farmId && (qty > 0 || vaccineCost > 0 || medCost > 0 || customCost > 0)) {
                const farm = khamars.find(k => k.id === farmId);
                items.push({
                    farmId: farmId,
                    farmName: farm ? farm.name : "Unknown",
                    qty: qty,
                    vaccineCost: vaccineCost,
                    medName: medName,
                    medCost: medCost,
                    customDesc: customDesc,
                    customCost: customCost
                });
                totalQty += qty;
            }
        }
    });

    if (items.length === 0) {
        showToast("Please add at least one valid destination & quantity.", "error");
        return;
    }

    const btn = document.getElementById('btn-save-fgm');
    const orig = btn.innerText;
    btn.innerText = "SAVING...";
    btn.disabled = true;

    try {
        const ts = new Date(dateStr);
        ts.setHours(new Date().getHours());
        ts.setMinutes(new Date().getMinutes());

        await addDoc(feedGuraCollection, {
            date: dateStr,
            timestamp: ts,
            dealerName,
            companyName,
            feedType,
            destinations: items,
            totalQty
        });

        // Auto-create Khamari entries for each destination
        for (const item of items) {
            let meds = [];
            if (item.vaccineCost > 0) {
                meds.push({ name: "Vaccine & Cleaning", qty: 1, rate: item.vaccineCost, total: item.vaccineCost });
            }
            if (item.medName && item.medCost > 0) {
                meds.push({ name: item.medName, qty: 1, rate: item.medCost, total: item.medCost });
            }

            let otherDesc = item.customDesc || "Auto-added from Feed/Gura Management";
            let otherCost = item.customCost || 0;
            let extraTotal = (item.vaccineCost || 0) + (item.medCost || 0) + otherCost;

            await addDoc(khamariCollection, {
                farmId: item.farmId,
                farmName: item.farmName,
                date: dateStr,
                timestamp: ts,
                metrics: {
                    feedMetadata: { dealer: dealerName, company: companyName },
                    sonaliFeed: { qty: feedType === 'Sonali Feed' ? item.qty : 0, rate: 0, total: 0 },
                    broilerFeed: { qty: feedType === 'Broiler Feed' ? item.qty : 0, rate: 0, total: 0 },
                    gura: { qty: feedType === 'Gura' ? item.qty : 0, rate: 0, total: 0 },
                    sonaliChicks: { qty: 0, rate: 0, total: 0 },
                    broilerChicks: { qty: 0, rate: 0, total: 0 },
                    medicines: meds,
                    other: { desc: otherDesc, cost: otherCost }
                },
                totalAmount: extraTotal,
                isAutoGenerated: true
            });
        }

        showToast("Distribution & Khamari Entries Saved!");

        document.getElementById('fgm-dealer').value = '';
        document.getElementById('fgm-company').value = '';

        // Clear extra rows and reset first row
        const container = document.getElementById('fgm-destinations-container');
        const allRows = container.querySelectorAll('.fgm-row');
        if (allRows.length > 1) {
            for (let i = 1; i < allRows.length; i++) {
                allRows[i].remove();
            }
        }
        allRows[0].querySelector('.fgm-khamar-select').value = '';
        allRows[0].querySelector('.fgm-qty').value = '';
        allRows[0].querySelector('.fgm-vaccine').value = '';
        allRows[0].querySelector('.fgm-med-name').value = '';
        allRows[0].querySelector('.fgm-med-cost').value = '';
        allRows[0].querySelector('.fgm-custom-desc').value = '';
        allRows[0].querySelector('.fgm-custom-cost').value = '';

    } catch (e) {
        console.error(e);
        showToast("Failed to save distribution", "error");
    } finally {
        btn.innerText = orig;
        btn.disabled = false;
    }
};

function renderFeedGuraTable() {
    populateFgmSelects();

    const tb = document.getElementById('fgm-table-body');
    if (!tb) return;
    tb.innerHTML = '';

    const sorted = [...feedGuraEntries].sort((a, b) => {
        const tA = a.timestamp?.seconds || 0;
        const tB = b.timestamp?.seconds || 0;
        return tB - tA;
    });

    if (sorted.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-500 italic">No feed/gura distributions found.</td></tr>';
        return;
    }

    sorted.forEach(entry => {
        let layout = '';
        if (entry.destinations) {
            entry.destinations.forEach(d => {
                layout += `<span class="bg-gray-800/80 border border-white/5 text-gray-300 px-2 py-1 rounded text-[10px] mr-1 mb-1 block"><b>${d.farmName}</b> : ${d.qty} sacks</span>`;
            });
        }

        tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                    <td class="p-3 text-gray-400">${entry.date || '-'}</td>
                    <td class="p-3 font-bold text-gray-200">
                        <span class="text-amber-400">${entry.dealerName || 'N/A'}</span> <br>
                        <span class="text-xs text-gray-500">${entry.companyName || 'N/A'}</span>
                    </td>
                    <td class="p-3"><span class="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs">${entry.feedType || 'N/A'}</span></td>
                    <td class="p-3">${layout}</td>
                    <td class="p-3 text-right font-bold text-emerald-400 tracking-wide">${entry.totalQty || 0}</td>
                    <td class="p-3 text-center">
                        <button onclick="handleDeleteFgmEntry('${entry.id}')" class="text-red-400 hover:text-red-300 p-1 bg-red-500/10 rounded">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>`;
    });
}

window.handleDeleteFgmEntry = async function (id) {
    if (confirm("Delete this Feed/Gura distribution log?")) {
        try {
            await deleteDoc(doc(feedGuraCollection, id));
            showToast("Deleted successfully.", "success");
        } catch (e) {
            console.error(e);
            showToast("Failed to delete", "error");
        }
    }
}

// --- ADDED BY PATCH ---
window.addAccountingEntry = async function () {
    const desc = document.getElementById('acc-desc').value.trim();
    const type = document.getElementById('acc-type').value;
    const amount = parseFloat(document.getElementById('acc-amount').value) || 0;
    if (!desc || amount <= 0) { showToast("Invalid input", "error"); return; }
    try {
        await addDoc(accountingCollection, { desc, type, amount, timestamp: serverTimestamp() });
        document.getElementById('acc-desc').value = '';
        document.getElementById('acc-amount').value = '';
        showToast("Accounting entry added");
    } catch (e) { console.error(e); showToast("Error", "error"); }
};

window.renderAccountingUI = function () {
    const tb = document.getElementById('acc-table-body');
    if (!tb) return;
    let inc = 0, exp = 0;
    tb.innerHTML = '';
    const sorted = [...accountingEntries].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    sorted.forEach(a => {
        if (a.type === 'income') inc += a.amount; else exp += a.amount;
        const d = a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '-';
        const color = a.type === 'income' ? 'text-emerald-400' : 'text-red-400';
        tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5"><td class="py-2 text-sm text-gray-400">${d}</td><td class="py-2 text-sm text-gray-200">${a.desc}</td><td class="py-2 text-sm text-gray-400 uppercase">${a.type}</td><td class="py-2 text-right text-sm font-bold ${color}">৳${a.amount}</td><td class="py-2 text-right"><button onclick="deleteDoc(doc(accountingCollection, '${a.id}'))" class="text-red-400 hover:text-red-300 text-xs">Delete</button></td></tr>`;
    });
    document.getElementById('acc-total-income').innerText = `৳${inc.toLocaleString()}`;
    document.getElementById('acc-total-expense').innerText = `৳${exp.toLocaleString()}`;
    if (document.getElementById('acc-total-balance')) {
        document.getElementById('acc-total-balance').innerText = `৳${(inc - exp).toLocaleString()}`;
    }
};

window.addExpenditureEntry = async function () {
    const cat = document.getElementById('exp-category').value.trim();
    const desc = document.getElementById('exp-desc').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
    if (!cat || !desc || amount <= 0) { showToast("Invalid input", "error"); return; }
    try {
        await addDoc(expendituresCollection, { category: cat, desc, amount, timestamp: serverTimestamp() });
        document.getElementById('exp-category').value = '';
        document.getElementById('exp-desc').value = '';
        document.getElementById('exp-amount').value = '';
        showToast("Expenditure saved");
    } catch (e) { console.error(e); }
};

window.renderExpenditureUI = function () {
    const tb = document.getElementById('exp-table-body');
    if (!tb) return;
    tb.innerHTML = '';
    const sorted = [...expenditures].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    sorted.forEach(e => {
        const d = e.timestamp ? new Date(e.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '-';
        tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5"><td class="py-2 text-sm text-gray-400">${d}</td><td class="py-2 text-sm text-gray-200">${e.category}</td><td class="py-2 text-sm text-gray-300">${e.desc}</td><td class="py-2 text-right text-sm font-bold text-white">৳${e.amount}</td><td class="py-2 text-right"><button onclick="deleteDoc(doc(expendituresCollection, '${e.id}'))" class="text-red-400 text-xs hover:text-red-300">Del</button></td></tr>`;
    });
};

window.addInstallmentEntry = async function () {
    const party = document.getElementById('inst-party').value.trim();
    const amount = parseFloat(document.getElementById('inst-amount').value) || 0;
    const dateStr = document.getElementById('inst-date').value;
    const status = document.getElementById('inst-status').value;
    if (!party || amount <= 0 || !dateStr) return;
    try {
        await addDoc(installmentsCollection, { party, amount, dueDate: dateStr, status });
        document.getElementById('inst-party').value = '';
        document.getElementById('inst-amount').value = '';
        showToast("Installment added");
    } catch (e) { console.error(e); }
};

window.renderInstallmentsUI = function () {
    const tb = document.getElementById('inst-table-body');
    if (!tb) return;
    tb.innerHTML = '';
    installments.forEach(i => {
        const col = i.status === 'paid' ? 'text-emerald-400' : 'text-orange-400';
        tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5"><td class="py-2 text-sm text-gray-300">${i.dueDate}</td><td class="py-2 text-sm font-bold text-white">${i.party}</td><td class="py-2 text-right text-sm text-gray-200">৳${i.amount}</td><td class="py-2 text-sm font-medium ${col} uppercase">${i.status}</td><td class="py-2 text-right"><button class="text-xs text-blue-400 mr-2" onclick="toggleInstStatus('${i.id}', '${i.status}')">Toggle</button> <button class="text-xs text-red-400" onclick="deleteDoc(doc(installmentsCollection, '${i.id}'))">Del</button></td></tr>`;
    });
};
window.toggleInstStatus = async function (id, cur) {
    const ns = cur === 'paid' ? 'pending' : 'paid';
    await updateDoc(doc(installmentsCollection, id), { status: ns });
};


let currentEmpImageBase64 = '';
window.previewEmpImage = function (input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            currentEmpImageBase64 = e.target.result;
            document.getElementById('emp-image-preview').src = e.target.result;
            document.getElementById('emp-image-preview').classList.remove('hidden');
            document.getElementById('emp-image-icon').classList.add('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }
};

document.getElementById('add-employee-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('emp-name-input').value.trim();
    const designation = document.getElementById('emp-designation-input').value.trim();
    const contact = document.getElementById('emp-contact-input').value.trim();
    const address = document.getElementById('emp-address-input').value.trim();
    const salaryType = document.getElementById('emp-salary-type').value;
    const salary = parseFloat(document.getElementById('emp-salary-amount').value) || 0;
    const farm = document.getElementById('emp-farm-input').value.trim();
    const startDate = document.getElementById('emp-start-date').value;

    if (!name || !designation) return;

    try {
        await addDoc(employeesCollection, {
            name, designation, contact, address, salaryType, salary, farm, startDate,
            image: currentEmpImageBase64,
            status: 'Active',
            paymentHistory: [],
            timestamp: serverTimestamp()
        });
        e.target.reset();
        currentEmpImageBase64 = '';
        document.getElementById('emp-image-preview').src = '';
        document.getElementById('emp-image-preview').classList.add('hidden');
        document.getElementById('emp-image-icon').classList.remove('hidden');
        hideModal('add-employee-modal');
        showToast("Employee added successfully!");
    } catch (err) {
        console.error("Error adding employee:", err);
    }
});

window.renderEmployeeUI = function () {
    const grid = document.getElementById('employee-grid');
    if (!grid) return;
    grid.innerHTML = '';

    employees.forEach(e => {
        const isClosed = e.status === 'Closed';
        const stBadge = isClosed ? `<span class="bg-red-500/20 text-red-400 px-2 py-1 rounded text-[10px] uppercase">Closed</span>` : `<span class="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] uppercase">Active</span>`;
        let initial = e.name.charAt(0).toUpperCase();
        let imgHtml = e.image ? `<img src="${e.image}" class="w-12 h-12 rounded object-cover border border-emerald-500/30">` : `<div class="w-12 h-12 rounded bg-gray-800 flex items-center justify-center font-bold text-gray-500">${initial}</div>`;

        grid.innerHTML += `
        <div class="glass-card p-4 rounded-xl border border-white/5 cursor-pointer hover:border-emerald-500/40 relative ${isClosed ? 'opacity-60' : ''}" onclick="window.openEmployeeProfile('${e.id}')">
            <div class="absolute top-4 right-4">${stBadge}</div>
            <div class="flex items-center gap-3 mb-3 mt-1">
                ${imgHtml}
                <div>
                    <h3 class="font-bold text-white text-lg leading-tight truncate pr-16">${e.name}</h3>
                    <p class="text-xs text-gray-400 truncate">${e.designation}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/5">
                <div>
                    <p class="text-[10px] text-gray-500 uppercase">Farm</p>
                    <p class="text-xs text-gray-300 truncate">${e.farm || '-'}</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] text-gray-500 uppercase">Salary Base</p>
                    <p class="text-sm font-bold text-emerald-400 font-mono">৳${e.salary || 0}</p>
                </div>
            </div>
        </div>`;
    });
};


window.openEmployeeProfile = function (id) {
    const e = employees.find(x => x.id === id);
    if (!e) return;

    document.getElementById('prof-current-emp-id').value = e.id;
    document.getElementById('prof-emp-name').textContent = e.name;
    document.getElementById('prof-emp-designation').textContent = e.designation || '-';
    document.getElementById('prof-emp-contact').textContent = e.contact || '-';
    document.getElementById('prof-emp-address').textContent = e.address || '-';
    document.getElementById('prof-emp-assigned-farm').textContent = e.farm || '-';

    if (e.image) {
        document.getElementById('prof-emp-image').src = e.image;
        document.getElementById('prof-emp-image').classList.remove('hidden');
        document.getElementById('prof-emp-initial').classList.add('hidden');
    } else {
        document.getElementById('prof-emp-initial').textContent = e.name.charAt(0).toUpperCase();
        document.getElementById('prof-emp-image').classList.add('hidden');
        document.getElementById('prof-emp-initial').classList.remove('hidden');
    }

    const stBadge = document.getElementById('prof-emp-status');
    if (e.status === 'Closed') {
        stBadge.textContent = 'CLOSED';
        stBadge.className = 'px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] uppercase font-bold tracking-wider';
    } else {
        stBadge.textContent = 'ACTIVE';
        stBadge.className = 'px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] uppercase font-bold tracking-wider';
    }

    document.getElementById('prof-emp-salary-type-badge').textContent = `${e.salaryType || 'Monthly'}`;
    document.getElementById('prof-emp-base-salary').textContent = `৳${e.salary || 0}`;

    const today = new Date();
    document.getElementById('prof-pay-date').value = today.toISOString().split('T')[0];
    document.getElementById('prof-pay-note').value = '';
    document.getElementById('prof-pay-amount').value = '';

    let defaultStart = e.startDate || today.toISOString().split('T')[0];
    if (e.salaryType === 'Monthly') {
        defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    }

    document.getElementById('prof-emp-period-start').textContent = defaultStart;

    window.recalculateSalaryForPeriod();

    const hBody = document.getElementById('prof-emp-history');
    if (hBody) {
        hBody.innerHTML = '';
        const hists = [...(e.paymentHistory || [])].sort((a, b) => new Date(b.datePaid) - new Date(a.datePaid));
        hists.forEach(h => {
            hBody.innerHTML += `<tr class="hover:bg-white/5"><td class="py-2.5 px-4 text-gray-400 text-xs">${h.datePaid}</td><td class="py-2.5 px-4 text-gray-300 text-xs truncate max-w-[200px]">${h.note || h.period || '-'}</td><td class="py-2.5 px-4 text-right font-mono text-emerald-400 font-bold">৳${h.amount}</td></tr>`;
        });
    }

    showModal('employee-profile-modal');

    if (window.profileSalaryInterval) clearInterval(window.profileSalaryInterval);
    window.profileSalaryInterval = setInterval(() => { window.recalculateSalaryForPeriod(true); }, 1000);
};

window.recalculateSalaryForPeriod = function (isLiveTick = false) {
    const id = document.getElementById('prof-current-emp-id').value;
    const e = employees.find(x => x.id === id);
    if (!e) return;

    const sDateText = document.getElementById('prof-emp-period-start').textContent;
    const sDate = new Date(sDateText);
    const effectEndDate = new Date(); // Calculate precise real-time up to this exact second

    let diffDays = (effectEndDate - sDate) / (1000 * 60 * 60 * 24);
    if (diffDays < 0 || isNaN(diffDays)) diffDays = 0;

    let perDay = parseFloat(e.salary || 0) / 30;
    let amtEarned = perDay * diffDays;

    // Calculate Total Paid
    let totalPaid = 0;
    if (e.paymentHistory && Array.isArray(e.paymentHistory)) {
        totalPaid = e.paymentHistory.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
    }

    let due = amtEarned - totalPaid;

    document.getElementById('prof-emp-live-days').textContent = diffDays.toFixed(6) + ' Days Worked';
    document.getElementById('prof-total-earned').textContent = `৳${amtEarned.toFixed(2)}`;
    document.getElementById('prof-total-paid').textContent = `৳${totalPaid.toFixed(2)}`;
    document.getElementById('prof-total-due').textContent = `৳${due.toFixed(2)}`;
};

window.payEmployeeSalary = async function () {
    const id = document.getElementById('prof-current-emp-id').value;
    const amount = parseFloat(document.getElementById('prof-pay-amount').value);
    const dateStr = document.getElementById('prof-pay-date').value;
    const note = document.getElementById('prof-pay-note').value;

    if (!id || !amount || !dateStr) return;

    const e = employees.find(x => x.id === id);
    let hists = e.paymentHistory || [];

    hists.push({
        datePaid: dateStr,
        note: note || `Manual Payment`,
        amount: amount
    });

    try {
        await updateDoc(doc(employeesCollection, id), { paymentHistory: hists });
        showToast("Payment Added Successfully!");
        try {
            await addDoc(accountingCollection, {
                date: dateStr,
                note: `Employee Payment: ${e.name} ${note ? '(' + note + ')' : ''}`,
                type: 'expense',
                amount: amount,
                timestamp: serverTimestamp()
            });
        } catch (err) { }

        window.openEmployeeProfile(id); // reload seamlessly
    } catch (err) {
        console.error(err);
    }
};

window.closeEmployeeAccount = async function () {
    const id = document.getElementById('prof-current-emp-id').value;
    const e = employees.find(x => x.id === id);
    if (!e) return;

    // Archive Logic
    const choice = confirm("Do you want to CLOSE/ARCHIVE the current work period? This will reset the employee's start date to today.");

    if (choice) {
        let hists = e.paymentHistory || [];
        hists.push({
            datePaid: new Date().toLocaleDateString('en-GB'),
            note: `Period Archived & Reset (Started ${e.startDate || '-'})`,
            amount: 0
        });
        try {
            await updateDoc(doc(employeesCollection, id), {
                startDate: new Date().toISOString().split('T')[0],
                paymentHistory: hists
            });
            showToast("Work Period Archived. Start Date reset to today.");
            window.openEmployeeProfile(id); // reload seamlessly
        } catch (err) { }
    }
};

let currentEditEmpImageBase64 = '';
window.previewEditEmpImage = function (input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            currentEditEmpImageBase64 = e.target.result;
            document.getElementById('edit-emp-image-preview').src = e.target.result;
            document.getElementById('edit-emp-image-preview').classList.remove('hidden');
            document.getElementById('edit-emp-image-icon').classList.add('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.openEditEmployeeModal = function () {
    const id = document.getElementById('prof-current-emp-id').value;
    const e = employees.find(x => x.id === id);
    if (!e) return;

    document.getElementById('edit-emp-id').value = e.id;
    document.getElementById('edit-emp-name-input').value = e.name || '';
    document.getElementById('edit-emp-designation-input').value = e.designation || '';
    document.getElementById('edit-emp-contact-input').value = e.contact || '';
    document.getElementById('edit-emp-address-input').value = e.address || '';
    document.getElementById('edit-emp-salary-type').value = e.salaryType || 'Monthly';
    document.getElementById('edit-emp-salary-amount').value = e.salary || 0;
    document.getElementById('edit-emp-farm-input').value = e.farm || '';
    document.getElementById('edit-emp-start-date').value = e.startDate || new Date().toISOString().split('T')[0];

    if (e.image) {
        currentEditEmpImageBase64 = e.image;
        document.getElementById('edit-emp-image-preview').src = e.image;
        document.getElementById('edit-emp-image-preview').classList.remove('hidden');
        document.getElementById('edit-emp-image-icon').classList.add('hidden');
    } else {
        currentEditEmpImageBase64 = '';
        document.getElementById('edit-emp-image-preview').src = '';
        document.getElementById('edit-emp-image-preview').classList.add('hidden');
        document.getElementById('edit-emp-image-icon').classList.remove('hidden');
    }

    hideModal('employee-profile-modal');
    showModal('edit-employee-modal');
};

document.getElementById('edit-employee-form')?.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    const id = document.getElementById('edit-emp-id').value;
    if (!id) return;

    try {
        await updateDoc(doc(employeesCollection, id), {
            name: document.getElementById('edit-emp-name-input').value.trim(),
            designation: document.getElementById('edit-emp-designation-input').value.trim(),
            contact: document.getElementById('edit-emp-contact-input').value.trim(),
            address: document.getElementById('edit-emp-address-input').value.trim(),
            salaryType: document.getElementById('edit-emp-salary-type').value,
            salary: parseFloat(document.getElementById('edit-emp-salary-amount').value) || 0,
            farm: document.getElementById('edit-emp-farm-input').value.trim(),
            startDate: document.getElementById('edit-emp-start-date').value,
            image: currentEditEmpImageBase64
        });
        hideModal('edit-employee-modal');
        showToast("Employee updated!");
        setTimeout(() => window.openEmployeeProfile(id), 500);
    } catch (err) { }
});

window.deleteEmployeeAccountFromProfile = async function () {
    const id = document.getElementById('prof-current-emp-id').value;
    if (!id) return;
    if (!confirm("Are you sure you want to permanently delete this employee? This cannot be undone.")) return;
    try {
        await deleteDoc(doc(employeesCollection, id));
        showToast("Employee deleted absolutely.");
        hideModal('employee-profile-modal');
    } catch (err) { }
};

window.deleteEmployeeAccount = async function () {
    const id = document.getElementById('edit-emp-id').value;
    if (!id) return;
    if (!confirm("Are you sure you want to permanently delete this employee?")) return;
    try {
        await deleteDoc(doc(employeesCollection, id));
        showToast("Employee deleted absolutely.");
        hideModal('edit-employee-modal');
    } catch (err) { }
};


window.addQuotationEntry = async function () {
    const client = document.getElementById('quote-client').value.trim();
    const items = document.getElementById('quote-items').value.trim();
    const amt = parseFloat(document.getElementById('quote-amount').value) || 0;
    if (!client || !items) return;
    await addDoc(quotationsCollection, { client, items, amount: amt, timestamp: serverTimestamp() });
    document.getElementById('quote-client').value = '';
    document.getElementById('quote-items').value = '';
    document.getElementById('quote-amount').value = '';
};

window.renderQuotationsUI = function () {
    const tb = document.getElementById('quote-table-body');
    if (!tb) return;
    tb.innerHTML = '';
    const sorted = [...quotations].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    sorted.forEach(q => {
        const d = q.timestamp ? new Date(q.timestamp.seconds * 1000).toLocaleDateString('en-GB') : '-';
        tb.innerHTML += `<tr class="border-b border-white/5 hover:bg-white/5"><td class="py-2 text-sm text-gray-400">${d}</td><td class="py-2 font-bold text-white text-sm">${q.client}</td><td class="py-2 text-xs text-gray-300">${q.items}</td><td class="py-2 text-right font-medium text-purple-400 text-sm">৳${q.amount}</td><td class="py-2 text-right"><button onclick="deleteDoc(doc(quotationsCollection, '${q.id}'))" class="text-xs text-red-400">Del</button></td></tr>`;
    });
};

window.addFileEntry = async function (input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    await addDoc(filesDataCollection, { name: file.name, size: file.size, type: file.type, date: new Date().toLocaleDateString('en-GB') });
    input.value = '';
    showToast("File meta saved");
};

window.renderFilesUI = function () {
    const g = document.getElementById('file-grid');
    if (!g) return;
    g.innerHTML = '';
    filesData.forEach(f => {
        const s = (f.size / 1024).toFixed(1) + ' KB';
        g.innerHTML += `<div class="bg-gray-900/50 p-4 rounded-xl border border-white/5 relative group">
                    <button class="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onclick="deleteDoc(doc(filesDataCollection, '${f.id}'))">&times;</button>
                    <svg class="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <p class="text-sm font-medium text-gray-200 truncate w-full" title="${f.name}">${f.name}</p>
                    <p class="text-xs text-gray-500">${s} &bull; ${f.date}</p>
                </div>`;
    });
};
// --- END ADDED BY PATCH ---
// --- AUTO GLOBALS EXPORT ---
window.updateGlobalState = updateGlobalState;
window.showView = showView;
window.toggleMobileSidebar = toggleMobileSidebar;
window.showModal = showModal;
window.hideModal = hideModal;
window.showToast = showToast;
window.isDateInRange = isDateInRange;
window.renderDashboardStats = renderDashboardStats;
window.renderProductGrid = renderProductGrid;
window.renderCustomerSearchResults = renderCustomerSearchResults;
window.renderCustomerDropdown = renderCustomerDropdown;
window.renderBuyerSuggestions = renderBuyerSuggestions;
window.renderPurchaseItemSuggestions = renderPurchaseItemSuggestions;
window.renderPurchaseSupplierSuggestions = renderPurchaseSupplierSuggestions;
window.renderCart = renderCart;
window.setupEventListeners = setupEventListeners;
window.calculateProductSalesReport = calculateProductSalesReport;
window.calculateCustomerLedger = calculateCustomerLedger;
window.renderInventoryTable = renderInventoryTable;
window.renderKhamarUI = renderKhamarUI;
window.renderChickenSalesTable = renderChickenSalesTable;
window.checkInventoryAlerts = checkInventoryAlerts;
window.renderDashboardChart = renderDashboardChart;
window.renderFeedTable = renderFeedTable;
window.renderFeedLedger = renderFeedLedger;
window.renderPurchaseTable = renderPurchaseTable;
window.renderReportsTable = renderReportsTable;
window.renderCustomersTable = renderCustomersTable;
window.renderKhamariMedsList = renderKhamariMedsList;
window.renderKhamariMedSuggestions = renderKhamariMedSuggestions;
window.renderKhamariTable = renderKhamariTable;
window.populateFgmSelects = populateFgmSelects;
window.renderFeedGuraTable = renderFeedGuraTable;

// Generic Edit History Record
window.editHistoryRecord = function (id, type) {
    let dataObj = null, colRef = null, fields = [];

    if (type === 'sales') {
        dataObj = sales.find(x => x.id === id);
        colRef = salesCollection;
        fields = [
            { id: 'totalAmount', label: 'Total Amount', val: dataObj?.totalAmount },
            { id: 'paidAmount', label: 'Paid Amount', val: dataObj?.paidAmount }
        ];
    } else if (type === 'chicken_sales') {
        dataObj = chickenSales.find(x => x.id === id);
        colRef = chickenSalesCollection;
        fields = [
            { id: 'quantity', label: 'Quantity', val: dataObj?.quantity },
            { id: 'weight', label: 'Weight', val: dataObj?.weight },
            { id: 'rate', label: 'Rate', val: dataObj?.rate },
            { id: 'totalAmount', label: 'Total Amount', val: dataObj?.totalAmount },
            { id: 'paidAmount', label: 'Paid Amount', val: dataObj?.paidAmount }
        ];
    } else if (type === 'feed') {
        dataObj = feedEntries.find(x => x.id === id);
        colRef = feedCollection;
        fields = [
            { id: 'feedQty', label: 'Feed Qty', val: dataObj?.feedQty },
            { id: 'guraQty', label: 'Gura Qty', val: dataObj?.guraQty },
            { id: 'feedCost', label: 'Feed Cost', val: dataObj?.feedCost },
            { id: 'guraCost', label: 'Gura Cost', val: dataObj?.guraCost },
            { id: 'chickenCost', label: 'Chicken Cost', val: dataObj?.chickenCost },
            { id: 'cleaningCost', label: 'Cleaning Cost', val: dataObj?.cleaningCost },
            { id: 'vaccineCost', label: 'Vaccine Cost', val: dataObj?.vaccineCost },
            { id: 'medicineCost', label: 'Med Cost', val: dataObj?.medicineCost },
            { id: 'cost', label: 'Total Cost', val: dataObj?.cost },
            { id: 'paidAmount', label: 'Paid Amount', val: dataObj?.paidAmount }
        ];
    }

    if (!dataObj || !colRef) return showToast('Record not found', 'error');

    let html = '<div class="grid grid-cols-2 gap-4">';
    fields.forEach(f => {
        html += `<div>
            <label class="text-[10px] text-gray-500 font-bold uppercase block mb-1">${f.label}</label>
            <input type="number" id="edit_f_${f.id}" value="${f.val || 0}" class="w-full bg-gray-900 border border-white/10 rounded p-2 text-white text-sm focus:border-blue-500 outline-none transition-colors">
        </div>`;
    });
    html += '</div>';

    document.getElementById('edit-modal-fields-container').innerHTML = html;

    // Show Modal
    const modal = document.getElementById('generic-edit-modal');
    modal.classList.remove('hidden');

    document.getElementById('btn-save-edit-record').onclick = async () => {
        const btn = document.getElementById('btn-save-edit-record');
        try {
            btn.innerText = 'Saving...';
            btn.disabled = true;
            let updates = {};
            fields.forEach(f => {
                updates[f.id] = parseFloat(document.getElementById(`edit_f_${f.id}`).value) || 0;
            });

            if (type === 'sales' || type === 'chicken_sales') {
                updates.dueAmount = updates.totalAmount - updates.paidAmount;
                updates.status = updates.dueAmount <= 0 ? 'paid' : 'due';
            } else if (type === 'feed') {
                updates.dueAmount = updates.cost - updates.paidAmount;
            }

            await updateDoc(doc(colRef, id), updates);
            modal.classList.add('hidden');
            showToast('Record updated successfully');
        } catch (e) {
            console.error("Edit History Error:", e);
            showToast('Failed to update', 'error');
        } finally {
            btn.innerText = 'Save Changes';
            btn.disabled = false;
        }
    };
};
