'use client';

import { FarmState } from './types';

const STORAGE_KEY = 'AKHI_POULTRY_NEXTJS_DATA_V4';
const SNAPSHOT_KEY = 'AKHI_POULTRY_PRE_RESET_SNAPSHOT';

export const EMPTY_STATE: FarmState = {
  settings: {
    farmName: 'Akhi Poultry Farm & Feed Mills',
    phone: '+880 1700-000000',
    address: 'Khamar Road, Gazipur, Bangladesh',
    currency: '৳',
    taxRate: 0,
    printerWidth: '80mm',
    theme: 'dark'
  },
  flocks: [],
  products: [],
  khamariLogs: [],
  feedIngredients: [],
  customers: [],
  suppliers: [],
  sales: [],
  accounting: [],
  loans: [],
  installments: [],
  employees: [],
  batchSales: [],
  batchExpenses: [],
  khamars: [],
  customerPayments: [],
  posAuthorizedEmails: [
    { id: 'POS-ACC-1', email: 'admin@akhipos.com', name: 'অ্যাডমিন অ্যাকাউন্ট', role: 'Admin', status: 'Active', addedDate: '2026-07-01' },
    { id: 'POS-ACC-2', email: 'noyon@akhipos.com', name: 'নিয়ামুল হাসান (মালিক)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-3', email: 'niyamulhasannoyon@gmail.com', name: 'নিয়ামুল হাসান (মালিক জিমেইল)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-4', email: 'niyamulhasan@gmail.com', name: 'নিয়ামুল হাসান (মালিক)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-5', email: 'cashier@akhipos.com', name: 'ক্যাশিয়ার ডেস্ক-১', role: 'Cashier', status: 'Active', addedDate: '2026-07-20' }
  ]
};

export const DEFAULT_SEED: FarmState = {
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
    { id: 'CUST-001', name: 'Walk-in Retail Customer', phone: 'N/A', due: 0, totalPurchases: 15400, address: 'Counter Sale', category: 'খুচরা (Retailer)' },
    { id: 'CUST-002', name: 'Rahim Wholesale Egg Trader', phone: '01819-112233', due: 4200, totalPurchases: 128000, address: 'Gazipur Sadar Market', category: 'পাইকারী (Wholesale)' },
    { id: 'CUST-003', name: 'Alam Broiler House', phone: '01712-445566', due: 15000, totalPurchases: 245000, address: 'Tongi Bazar', category: 'ডিলার (Dealer)' }
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
        { id: 'PRD-003', name: 'Layer Fresh Eggs (Crate 30 pcs)', qty: 50, price: 360, unit: 'Crate' }
      ],
      subtotal: 18000,
      discount: 500,
      grandTotal: 17500,
      paidAmount: 13300,
      dueAmount: 4200,
      paymentMethod: 'Bkash',
      status: 'Partial'
    }
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
  ],
  batchSales: [
    { id: 'BS-01', flockId: 'FL-101', date: '2026-07-25', buyerName: 'Alam Poultry Dealer', birdQty: 200, totalWeight: 440, pricePerKg: 210, totalAmount: 92400 }
  ],
  batchExpenses: [
    { id: 'EXP-01', flockId: 'FL-101', date: '2026-06-01', category: 'বাচ্চা বাবদ খরচ', amount: 52500, note: '1500 chicks @ 35 tk' },
    { id: 'EXP-02', flockId: 'FL-101', date: '2026-06-15', category: 'খাদ্য বাবদ খরচ', amount: 35000, note: 'Starter Feed 14 bags' }
  ],
  khamars: [
    { id: 'KHM-01', name: 'ইব্রাহিম খামার পিটালতলা', ownerName: 'ইব্রাহিম হোসেন', phone: '01711-889900', address: 'পিটালতলা, গাজীপুর', farmType: 'সোনালী', capacity: 3000, notes: 'শেড ১ ও ২ সার্ভিস রানিং' },
    { id: 'KHM-02', name: 'আখি পোল্ট্রি ফার্ম (প্রধান শাখা)', ownerName: 'নিয়ামুল হাসান', phone: '01700-000000', address: 'খামার রোড, গাজীপুর', farmType: 'ব্রয়লার', capacity: 5000, notes: 'হাই-টেক কন্ট্রোল শেড' }
  ],
  customerPayments: [
    { id: 'PAY-01', customerId: 'CUST-002', date: '2026-07-29', amount: 13300, paymentMethod: 'Bkash', note: 'Invoice INV-2026-001 partial payment' }
  ],
  posAuthorizedEmails: [
    { id: 'POS-ACC-1', email: 'admin@akhipos.com', name: 'অ্যাডমিন অ্যাকাউন্ট', role: 'Admin', status: 'Active', addedDate: '2026-07-01' },
    { id: 'POS-ACC-2', email: 'noyon@akhipos.com', name: 'নিয়ামুল হাসান (মালিক)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-3', email: 'niyamulhasannoyon@gmail.com', name: 'নিয়ামুল হাসান (মালিক জিমেইল)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-4', email: 'niyamulhasan@gmail.com', name: 'নিয়ামুল হাসান (মালিক)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-5', email: 'cashier@akhipos.com', name: 'ক্যাশিয়ার ডেস্ক-১', role: 'Cashier', status: 'Active', addedDate: '2026-07-20' }
  ]
};

type Listener = (state: FarmState) => void;

class FarmStore {
  private state: FarmState;
  private listeners: Listener[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.state = DEFAULT_SEED;
    if (typeof window !== 'undefined') {
      this.state = this.loadFromLocalStorage();
      this.initRealtimeListeners();
      this.syncWithCloudDb();
    }
  }

  private initRealtimeListeners() {
    if (typeof window === 'undefined') return;

    // 1. HTML5 BroadcastChannel for multi-tab real-time sync
    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('AKHI_POS_BROADCAST_CHANNEL');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'REALTIME_STATE_UPDATE' && event.data.state) {
            this.state = { ...DEFAULT_SEED, ...event.data.state };
            this.notifyLocal();
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel initialization failed:', e);
    }

    // 2. Storage event listener fallback for cross-tab updates
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          this.state = { ...DEFAULT_SEED, ...JSON.parse(e.newValue) };
          this.notifyLocal();
        } catch (_) {}
      }
    });

    // 3. Document visibility change listener to pull updates on tab focus
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.syncWithCloudDb();
      }
    });

    // 4. Periodic background polling every 15 seconds when active
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          this.syncWithCloudDb();
        }
      }, 15000);
    }
  }

  private loadFromLocalStorage(): FarmState {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        return { ...DEFAULT_SEED, ...JSON.parse(item) };
      }
    } catch (e) {
      console.warn('Failed to load local storage state:', e);
    }
    return DEFAULT_SEED;
  }

  public async syncWithCloudDb(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const dbData = json.data;
          this.state = {
            ...this.state,
            ...dbData,
            settings: { ...this.state.settings, ...(dbData.settings || {}) },
            flocks: dbData.flocks && dbData.flocks.length > 0 ? dbData.flocks : this.state.flocks,
            products: dbData.products && dbData.products.length > 0 ? dbData.products : this.state.products,
            customers: dbData.customers && dbData.customers.length > 0 ? dbData.customers : this.state.customers,
            suppliers: dbData.suppliers && dbData.suppliers.length > 0 ? dbData.suppliers : this.state.suppliers,
            sales: dbData.sales && dbData.sales.length > 0 ? dbData.sales : this.state.sales,
            accounting: dbData.accounting && dbData.accounting.length > 0 ? dbData.accounting : this.state.accounting,
            khamariLogs: dbData.khamariLogs && dbData.khamariLogs.length > 0 ? dbData.khamariLogs : this.state.khamariLogs,
            feedIngredients: dbData.feedIngredients && dbData.feedIngredients.length > 0 ? dbData.feedIngredients : this.state.feedIngredients,
            loans: dbData.loans && dbData.loans.length > 0 ? dbData.loans : this.state.loans,
            installments: dbData.installments && dbData.installments.length > 0 ? dbData.installments : this.state.installments,
            employees: dbData.employees && dbData.employees.length > 0 ? dbData.employees : this.state.employees,
            batchSales: dbData.batchSales && dbData.batchSales.length > 0 ? dbData.batchSales : this.state.batchSales,
            batchExpenses: dbData.batchExpenses && dbData.batchExpenses.length > 0 ? dbData.batchExpenses : this.state.batchExpenses,
            khamars: dbData.khamars && dbData.khamars.length > 0 ? dbData.khamars : this.state.khamars,
            customerPayments: dbData.customerPayments && dbData.customerPayments.length > 0 ? dbData.customerPayments : this.state.customerPayments,
            posAuthorizedEmails: dbData.posAuthorizedEmails && dbData.posAuthorizedEmails.length > 0 ? dbData.posAuthorizedEmails : this.state.posAuthorizedEmails,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
          this.notifyLocal();
          return true;
        }
      }
    } catch (e) {
      console.warn('Neon DB Sync unavailable, using local storage:', e);
    }
    return false;
  }

  public async pushToCloudDb() {
    if (typeof window === 'undefined') return;
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state)
      });
    } catch (e) {
      console.warn('Failed to push state to Neon DB:', e);
    }
  }

  private debouncePushToCloud() {
    if (this.pushTimer) {
      clearTimeout(this.pushTimer);
    }
    this.pushTimer = setTimeout(() => {
      this.pushToCloudDb();
    }, 800);
  }

  public getState(): FarmState {
    return this.state;
  }

  public saveState(broadcast = true) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notifyLocal();

        if (broadcast && this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'REALTIME_STATE_UPDATE',
            state: this.state
          });
        }

        this.debouncePushToCloud();
      } catch (e) {
        console.error('Error saving state to localStorage:', e);
      }
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyLocal() {
    this.listeners.forEach(l => l(this.state));
  }


  public setCurrentUser(user: any) {
    this.state = { ...this.state, currentUser: user };
    this.saveState();
  }

  public logout() {
    this.state = { ...this.state, currentUser: null };
    this.saveState();
  }

  // Mutations
  public addItem<K extends keyof FarmState>(key: K, item: FarmState[K] extends (infer T)[] ? T : FarmState[K]) {
    const list = this.state[key];
    if (Array.isArray(list)) {
      (list as unknown as unknown[]).unshift(item);
      this.syncCurrentUserRole();
      this.saveState();
    }
  }

  public updateItem<K extends keyof FarmState>(
    key: K,
    id: string,
    updatedFields: Partial<FarmState[K] extends (infer T)[] ? T : Record<string, unknown>>
  ) {
    const list = this.state[key];
    if (Array.isArray(list)) {
      const idx = (list as unknown as { id: string }[]).findIndex(x => x.id === id);
      if (idx !== -1) {
        (list as unknown as Record<string, unknown>[])[idx] = {
          ...(list as unknown as Record<string, unknown>[])[idx],
          ...updatedFields
        };
        this.syncCurrentUserRole();
        this.saveState();
      }
    }
  }

  public deleteItem<K extends keyof FarmState>(key: K, id: string) {
    const list = this.state[key];
    if (Array.isArray(list)) {
      this.state[key] = (list as unknown as { id: string }[]).filter(x => x.id !== id) as unknown as FarmState[K];
      this.syncCurrentUserRole();
      this.saveState();
      this.pushToCloudDb();
    }
  }

  private syncCurrentUserRole() {
    if (this.state.currentUser && this.state.currentUser.email) {
      const currentRole = getActiveUserRole(this.state);
      if (currentRole === 'Guest') {
        this.state.currentUser = null;
      } else {
        this.state.currentUser = { ...this.state.currentUser, role: currentRole };
      }
    }
  }

  public createSnapshot(): boolean {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(this.state));
        return true;
      } catch (e) {
        console.error('Failed to create pre-reset snapshot:', e);
      }
    }
    return false;
  }

  public hasPreResetSnapshot(): boolean {
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem(SNAPSHOT_KEY);
        return !!item;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  public restorePreResetSnapshot(): boolean {
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem(SNAPSHOT_KEY);
        if (item) {
          const snapshotState = JSON.parse(item);
          this.state = { ...DEFAULT_SEED, ...snapshotState };
          this.saveState();
          return true;
        }
      } catch (e) {
        console.error('Failed to restore snapshot:', e);
      }
    }
    return false;
  }

  public clearAllData() {
    this.createSnapshot();
    this.state = { ...EMPTY_STATE };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(EMPTY_STATE));
        this.notifyLocal();
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'REALTIME_STATE_UPDATE',
            state: EMPTY_STATE
          });
        }
      } catch (e) {
        console.error('Error clearing data:', e);
      }
    }
  }

  public resetToDemoSeed() {
    this.state = { ...DEFAULT_SEED };
    this.saveState();
  }

  public exportBackupJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importBackupJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        this.state = { ...DEFAULT_SEED, ...parsed };
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('Failed to import JSON backup:', e);
    }
    return false;
  }
}

export const farmStore = new FarmStore();

export function getActiveUserRole(state: FarmState): string {
  const user = state.currentUser;
  if (!user || !user.email) return 'Guest';

  const list = state.posAuthorizedEmails || [];
  const match = list.find(e => e.email.toLowerCase() === user.email.toLowerCase() && e.status === 'Active');

  if (match) {
    return match.role;
  }

  return 'Guest';
}
