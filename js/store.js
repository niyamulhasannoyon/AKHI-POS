/* ==========================================================================
   AKHI POULTRY FARM - SMART POS & FARM MANAGEMENT SYSTEM 4.0
   Centralized Reactive State Store & Persistence Layer
   ========================================================================== */

const STORAGE_KEY = 'AKHI_POULTRY_FARM_DATA_V4';

// Default Initial Seed Data
const DEFAULT_SEED = {
  settings: {
    farmName: 'Akhi Poultry Farm & Feed Mills',
    phone: '+880 1700-000000',
    address: 'Khamar Road, Gazipur, Bangladesh',
    currency: '৳',
    taxRate: 0,
    printerWidth: '80mm',
    theme: 'dark'
  },
  flocks: [
    { id: 'FL-101', name: 'Batch 101 - Sonali Breeder', breed: 'Sonali Classic', initialQty: 1500, currentQty: 1465, startDate: '2026-06-01', ageDays: 60, status: 'Active', houseNo: 'Shed 1' },
    { id: 'FL-102', name: 'Batch 102 - Broiler Cobb500', breed: 'Cobb 500', initialQty: 3000, currentQty: 2940, startDate: '2026-07-10', ageDays: 21, status: 'Active', houseNo: 'Shed 2' },
    { id: 'FL-103', name: 'Batch 103 - Layer Hy-Line', breed: 'Hy-Line Brown', initialQty: 2000, currentQty: 1980, startDate: '2026-04-15', ageDays: 107, status: 'Active', houseNo: 'Shed 3' }
  ],
  products: [
    { id: 'PRD-001', name: 'Sonali Starter Feed (50kg)', category: 'Feed & Gura', price: 2850, cost: 2600, stock: 120, unit: 'Bag', minStock: 20 },
    { id: 'PRD-002', name: 'Broiler Finisher Feed (50kg)', category: 'Feed & Gura', price: 3100, cost: 2850, stock: 85, unit: 'Bag', minStock: 15 },
    { id: 'PRD-003', name: 'Layer Fresh Eggs (Crate 30 pcs)', category: 'Eggs', price: 360, cost: 290, stock: 240, unit: 'Crate', minStock: 50 },
    { id: 'PRD-004', name: 'Live Sonali Chicken (per KG)', category: 'Live Birds', price: 320, cost: 240, stock: 1450, unit: 'KG', minStock: 200 },
    { id: 'PRD-005', name: 'Day Old Chicks - Sonali', category: 'Live Birds', price: 42, cost: 32, stock: 500, unit: 'Pcs', minStock: 100 },
    { id: 'PRD-006', name: 'Poultry Vitamin & Electrolyte', category: 'Medicines', price: 450, cost: 350, stock: 45, unit: 'Bottle', minStock: 10 },
    { id: 'PRD-007', name: 'Maize Powder (Gura - 50kg)', category: 'Feed & Gura', price: 1850, cost: 1650, stock: 90, unit: 'Bag', minStock: 25 }
  ],
  khamariLogs: [
    { id: 'LOG-001', flockId: 'FL-103', date: '2026-07-28', eggGood: 1620, eggDamaged: 15, feedBags: 4.5, mortality: 2, temperature: 28, notes: 'Normal egg production rate' },
    { id: 'LOG-002', flockId: 'FL-103', date: '2026-07-29', eggGood: 1645, eggDamaged: 10, feedBags: 4.5, mortality: 1, temperature: 29, notes: 'Slightly higher yield' },
    { id: 'LOG-003', flockId: 'FL-102', date: '2026-07-29', eggGood: 0, eggDamaged: 0, feedBags: 12.0, mortality: 5, temperature: 30, notes: 'Broiler growth target on track' }
  ],
  feedIngredients: [
    { id: 'ING-01', name: 'Yellow Maize (Gura)', stockKg: 4500, costPerKg: 33 },
    { id: 'ING-02', name: 'Soybean Meal (44%)', stockKg: 2800, costPerKg: 62 },
    { id: 'ING-03', name: 'Rice Polish / Bran', stockKg: 1900, costPerKg: 24 },
    { id: 'ING-04', name: 'Limestone / Calcium', stockKg: 1200, costPerKg: 12 },
    { id: 'ING-05', name: 'Premix & Enzymes', stockKg: 350, costPerKg: 180 }
  ],
  customers: [
    { id: 'CUST-001', name: 'Walk-in Retail Customer', phone: 'N/A', due: 0, totalPurchases: 15400, address: 'Counter Sale' },
    { id: 'CUST-002', name: 'Rahim Wholesale Egg Trader', phone: '01819-112233', due: 4200, totalPurchases: 128000, address: 'Gazipur Sadar Market' },
    { id: 'CUST-003', name: 'Alam Broiler House', phone: '01712-445566', due: 15000, totalPurchases: 245000, address: 'Tongi Bazar' }
  ],
  suppliers: [
    { id: 'SUP-001', name: 'Quality Feed Mills Ltd', phone: '01911-998877', balance: 35000, address: 'Dhaka Division' },
    { id: 'SUP-002', name: 'CP Hatchery Bangladesh', phone: '01812-334455', balance: 0, address: 'Bogura Depot' },
    { id: 'SUP-003', name: 'Square Agro Veterinary', phone: '01711-223344', balance: 2500, address: 'Pabna Plant' }
  ],
  sales: [
    {
      id: 'INV-2026-001',
      date: '2026-07-29T14:30:00',
      customerId: 'CUST-002',
      customerName: 'Rahim Wholesale Egg Trader',
      items: [
        { productId: 'PRD-003', name: 'Layer Fresh Eggs (Crate 30 pcs)', qty: 50, price: 360, total: 18000 }
      ],
      subtotal: 18000,
      discount: 500,
      tax: 0,
      grandTotal: 17500,
      paidAmount: 13300,
      dueAmount: 4200,
      paymentMethod: 'Bkash',
      status: 'Partial'
    }
  ],
  purchases: [
    { id: 'PUR-101', date: '2026-07-20', supplierId: 'SUP-001', item: 'Sonali Feed Ingredients', amount: 85000, paid: 50000, due: 35000, status: 'Partial' }
  ],
  accounting: [
    { id: 'ACC-01', date: '2026-07-28', type: 'Expense', category: 'Electricity & Utility', amount: 14500, note: 'July Shed Power Bill' },
    { id: 'ACC-02', date: '2026-07-29', type: 'Expense', category: 'Labor Wages', amount: 12000, note: 'Weekly Caretaker Allowance' },
    { id: 'ACC-03', date: '2026-07-29', type: 'Income', category: 'Egg Sales', amount: 17500, note: 'Invoice INV-2026-001' }
  ],
  loans: [
    { id: 'LN-01', lender: 'Krishi Bank Farm Loan', amount: 500000, interestRate: 8, emi: 22500, remaining: 380000, nextDueDate: '2026-08-15' }
  ],
  installments: [
    { id: 'INS-01', customerName: 'Alam Broiler House', totalAmount: 45000, paidAmount: 30000, remaining: 15000, installmentCount: 3, nextDate: '2026-08-05' }
  ],
  employees: [
    { id: 'EMP-01', name: 'Malek Hossain', role: 'Farm Manager', salary: 28000, advance: 3000, status: 'Active' },
    { id: 'EMP-02', name: 'Niyamul Hasan', role: 'Chief Feed Operator', salary: 25000, advance: 0, status: 'Active' },
    { id: 'EMP-03', name: 'Sultan Ahmed', role: 'Shed Caretaker', salary: 16000, advance: 1500, status: 'Active' }
  ]
};

class Store {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_SEED, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Failed to parse localStorage, resetting to seed data.', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SEED));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to persist state to localStorage', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(fn => fn(this.state));
  }

  // State Getters
  get(key) {
    return this.state[key];
  }

  // Item Adders / Updaters
  addItem(collectionKey, item) {
    if (!this.state[collectionKey]) this.state[collectionKey] = [];
    this.state[collectionKey].unshift(item);
    this.saveState();
  }

  updateItem(collectionKey, itemId, updatedFields) {
    if (!this.state[collectionKey]) return;
    const idx = this.state[collectionKey].findIndex(x => x.id === itemId);
    if (idx !== -1) {
      this.state[collectionKey][idx] = { ...this.state[collectionKey][idx], ...updatedFields };
      this.saveState();
    }
  }

  deleteItem(collectionKey, itemId) {
    if (!this.state[collectionKey]) return;
    this.state[collectionKey] = this.state[collectionKey].filter(x => x.id !== itemId);
    this.saveState();
  }

  // Backup & Reset Utilities
  exportBackup() {
    return JSON.stringify(this.state, null, 2);
  }

  importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        this.state = { ...DEFAULT_SEED, ...parsed };
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON backup file', e);
    }
    return false;
  }

  resetToSeed() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_SEED));
    this.saveState();
  }
}

export const store = new Store();
