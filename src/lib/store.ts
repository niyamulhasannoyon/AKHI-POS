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
    { id: 'POS-ACC-2', email: 'noyon@akhipos.com', name: 'নিয়ামুল হাসান (মালিক)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-3', email: 'niyamulhasannoyon@gmail.com', name: 'নিয়ামুল হাসান (মালিক জিমেইল)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-4', email: 'niyamulhasan@gmail.com', name: 'নিয়ামুল হাসান (মালিক)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-5', email: 'cashier@akhipos.com', name: 'ক্যাশিয়ার ডেস্ক-১', role: 'Cashier', status: 'Active', addedDate: '2026-07-20' }
  ]
};

// DEFAULT_SEED is intentionally empty (no demo/fake data) so a fresh install
// starts clean. Real data is added by the farm owner through the app UI.
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
    { id: 'POS-ACC-2', email: 'noyon@akhipos.com', name: 'নিয়ামুল হাসান (মালিক)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-3', email: 'niyamulhasannoyon@gmail.com', name: 'নিয়ামুল হাসান (মালিক জিমেইল)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-4', email: 'niyamulhasan@gmail.com', name: 'নিয়ামুল হাসান (মালিক)', role: 'Admin', status: 'Active', addedDate: '2026-07-15' },
    { id: 'POS-ACC-5', email: 'cashier@akhipos.com', name: 'ক্যাশিয়ার ডেস্ক-১', role: 'Cashier', status: 'Active', addedDate: '2026-07-20' }
  ]
};

// IDs of the old demo/seed records that must never appear in real business data.
// These only get removed — any real records with different IDs are untouched.
const DEMO_IDS: Partial<Record<keyof FarmState, string[]>> = {
  flocks: ['FL-101', 'FL-102', 'FL-103'],
  products: ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-005', 'PRD-006', 'PRD-007'],
  khamariLogs: ['LOG-001', 'LOG-002', 'LOG-003'],
  feedIngredients: ['ING-01', 'ING-02', 'ING-03', 'ING-04', 'ING-05'],
  customers: ['CUST-001', 'CUST-002', 'CUST-003'],
  suppliers: ['SUP-001', 'SUP-002', 'SUP-003'],
  sales: ['INV-2026-001'],
  accounting: ['ACC-01', 'ACC-02', 'ACC-03'],
  loans: ['LN-01'],
  installments: ['INS-01'],
  employees: ['EMP-01', 'EMP-02', 'EMP-03'],
  batchSales: ['BS-01'],
  batchExpenses: ['EXP-01', 'EXP-02'],
  khamars: ['KHM-01', 'KHM-02'],
  customerPayments: ['PAY-01']
};

// Strips old demo/seed records from a state snapshot. Idempotent — safe to run
// repeatedly (e.g. after every cloud sync) and only ever deletes the known demo IDs.
function purgeDemoData(state: FarmState): { state: FarmState; purged: boolean } {
  let purged = false;
  const next: FarmState = { ...state };
  (Object.keys(DEMO_IDS) as (keyof FarmState)[]).forEach((key) => {
    const list = next[key];
    if (Array.isArray(list)) {
      const ids = DEMO_IDS[key] || [];
      const filtered = (list as unknown as { id: string }[]).filter(x => !ids.includes(x.id));
      if (filtered.length !== (list as unknown as unknown[]).length) purged = true;
      (next as unknown as Record<string, unknown>)[key] = filtered;
    }
  });
  return { state: next, purged };
}

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
      this.syncCurrentUserRole();
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
            const incoming = event.data.state;
            this.state = purgeDemoData({ ...DEFAULT_SEED, ...incoming }).state;
            if (incoming.posAuthorizedEmails && Array.isArray(incoming.posAuthorizedEmails)) {
              this.state.posAuthorizedEmails = incoming.posAuthorizedEmails;
            }
            this.syncCurrentUserRole();
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
          const parsed = JSON.parse(e.newValue);
          this.state = purgeDemoData({ ...DEFAULT_SEED, ...parsed }).state;
          if (parsed.posAuthorizedEmails && Array.isArray(parsed.posAuthorizedEmails)) {
            this.state.posAuthorizedEmails = parsed.posAuthorizedEmails;
          }
          this.syncCurrentUserRole();
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
        const parsed = JSON.parse(item);
        const mergedState = purgeDemoData({ ...DEFAULT_SEED, ...parsed }).state;
        if (parsed.posAuthorizedEmails && Array.isArray(parsed.posAuthorizedEmails)) {
          mergedState.posAuthorizedEmails = parsed.posAuthorizedEmails;
        }
        return mergedState;
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
          const mergeArr = <T extends { id: string }>(localArr: T[] = [], dbArr: T[] = []): T[] => {
            if (!Array.isArray(dbArr) || dbArr.length === 0) return localArr || [];
            const map = new Map<string, T>();
            dbArr.forEach(item => { if (item && item.id) map.set(item.id, item); });
            (localArr || []).forEach(item => {
              if (item && item.id && !map.has(item.id)) {
                map.set(item.id, item);
              }
            });
            return Array.from(map.values());
          };

          const merged: FarmState = {
            ...this.state,
            ...dbData,
            settings: { ...this.state.settings, ...(dbData.settings || {}) },
            flocks: mergeArr(this.state.flocks, dbData.flocks),
            products: mergeArr(this.state.products, dbData.products),
            customers: mergeArr(this.state.customers, dbData.customers),
            suppliers: mergeArr(this.state.suppliers, dbData.suppliers),
            sales: mergeArr(this.state.sales, dbData.sales),
            accounting: mergeArr(this.state.accounting, dbData.accounting),
            khamariLogs: mergeArr(this.state.khamariLogs, dbData.khamariLogs),
            feedIngredients: mergeArr(this.state.feedIngredients, dbData.feedIngredients),
            loans: mergeArr(this.state.loans, dbData.loans),
            installments: mergeArr(this.state.installments, dbData.installments),
            employees: mergeArr(this.state.employees, dbData.employees),
            batchSales: mergeArr(this.state.batchSales, dbData.batchSales),
            batchExpenses: mergeArr(this.state.batchExpenses, dbData.batchExpenses),
            khamars: mergeArr(this.state.khamars, dbData.khamars),
            customerPayments: mergeArr(this.state.customerPayments, dbData.customerPayments),
            posAuthorizedEmails: dbData.posAuthorizedEmails && dbData.posAuthorizedEmails.length > 0
              ? dbData.posAuthorizedEmails
              : this.state.posAuthorizedEmails,
          };
          const { state: purgedState, purged } = purgeDemoData(merged);
          this.state = purgedState;
          this.syncCurrentUserRole();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
          this.notifyLocal();
          if (purged) {
            this.pushToCloudDb();
          }
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
      const newList = [item, ...(list as unknown as unknown[])];
      this.state = {
        ...this.state,
        [key]: newList
      };
      this.syncCurrentUserRole();
      this.saveState();
      if (key === 'posAuthorizedEmails') {
        this.pushToCloudDb();
      }
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
        const newList = [...(list as unknown as Record<string, unknown>[])];
        newList[idx] = {
          ...newList[idx],
          ...updatedFields
        };
        this.state = {
          ...this.state,
          [key]: newList
        };
        this.syncCurrentUserRole();
        this.saveState();
        if (key === 'posAuthorizedEmails') {
          this.pushToCloudDb();
        }
      }
    } else if (typeof this.state[key] === 'object' && this.state[key] !== null) {
      this.state = {
        ...this.state,
        [key]: {
          ...(this.state[key] as unknown as Record<string, unknown>),
          ...updatedFields
        }
      };
      this.saveState();
    }
  }

  public deleteItem<K extends keyof FarmState>(key: K, id: string) {
    const list = this.state[key];
    if (Array.isArray(list)) {
      const newList = (list as unknown as { id: string }[]).filter(x => x.id !== id);
      this.state = {
        ...this.state,
        [key]: newList
      };
      this.syncCurrentUserRole();
      this.saveState();
      this.pushToCloudDb();
    }
  }

  public syncCurrentUserRole() {
    if (this.state.currentUser && this.state.currentUser.email) {
      const currentRole = getActiveUserRole(this.state);
      if (currentRole === 'Guest') {
        this.state.currentUser = null;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
          } catch (_) {}
        }
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
          this.state = purgeDemoData({ ...DEFAULT_SEED, ...snapshotState }).state;
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
        this.state = purgeDemoData({ ...DEFAULT_SEED, ...parsed }).state;
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
