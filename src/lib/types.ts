export interface Setting {
  farmName: string;
  phone: string;
  address: string;
  currency: string;
  taxRate: number;
  printerWidth: string;
  theme: string;
}

export interface Flock {
  id: string;
  name: string;
  breed: string;
  companyName?: string;
  unitPrice?: number;
  initialQty: number;
  currentQty: number;
  startDate: string;
  ageDays: number;
  status: 'Active' | 'Closed' | 'Quarantine';
  houseNo: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Feed & Gura' | 'Eggs' | 'Live Birds' | 'Medicines' | 'Equipment';
  price: number;
  cost: number;
  stock: number;
  unit: 'Bag' | 'KG' | 'Crate' | 'Pcs' | 'Bottle';
  minStock: number;
}

export interface KhamariLog {
  id: string;
  flockId: string;
  date: string;
  eggGood: number;
  eggDamaged: number;
  feedBags: number;
  mortality: number;
  temperature: number;
  notes?: string;
}

export interface FeedIngredient {
  id: string;
  name: string;
  stockKg: number;
  costPerKg: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  due: number;
  totalPurchases: number;
  address?: string;
  category?: 'পাইকারী (Wholesale)' | 'খুচরা (Retailer)' | 'ডিলার (Dealer)' | 'হোটেল/রেস্টুরেন্ট' | string;
  email?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  balance: number;
  address?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  qty: number;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  status: 'Paid' | 'Due' | 'Partial';
}

export interface AccountingEntry {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  note?: string;
}

export interface Loan {
  id: string;
  lender: string;
  amount: number;
  interestRate: number;
  emi: number;
  remaining: number;
  nextDueDate: string;
}

export interface Installment {
  id: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  installmentCount: number;
  nextDate: string;
}

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  role: string;
  salary: number;
  advance: number;
  joiningDate?: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  notes?: string;
}

export interface KhamarProfile {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  farmType: 'ব্রয়লার' | 'সোনালী' | 'লেয়ার' | 'মিক্সড';
  capacity: number;
  notes?: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  paymentMethod: string;
  note?: string;
}

export interface BatchSale {
  id: string;
  flockId: string;
  date: string;
  buyerName: string;
  birdQty: number;
  originalWeight?: number;
  totalWeight: number;
  pricePerKg: number;
  totalAmount: number;
  paidAmount?: number;
  dueAmount?: number;
}

export interface BatchExpense {
  id: string;
  flockId: string;
  date: string;
  category: string;
  amount: number;
  bagQty?: number;
  pricePerBag?: number;
  feedType?: string;
  note?: string;
}

export interface BatchLabor {
  id: string;
  flockId: string;
  date: string;
  staffName: string;
  workDescription: string;
  paidAmount: number;
  dueAmount: number;
  notes?: string;
}

export interface BatchWeightLog {
  id: string;
  flockId: string;
  date: string;
  ageDays: number;
  sampleBirdCount: number;
  sampleTotalWeightKg: number;
  avgWeightKg: number;
  mortalityCount: number;
  notes?: string;
}

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  role?: string;
  idToken?: string;
}

export interface PosAuthorizedEmail {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Cashier' | 'Sales Operator';
  status: 'Active' | 'Inactive';
  addedDate: string;
}

export interface FarmState {
  settings: Setting;
  flocks: Flock[];
  products: Product[];
  khamariLogs: KhamariLog[];
  feedIngredients: FeedIngredient[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  accounting: AccountingEntry[];
  loans: Loan[];
  installments: Installment[];
  employees: Employee[];
  batchSales: BatchSale[];
  batchExpenses: BatchExpense[];
  batchLabor: BatchLabor[];
  batchWeightLogs: BatchWeightLog[];
  khamars: KhamarProfile[];
  customerPayments: CustomerPayment[];
  posAuthorizedEmails: PosAuthorizedEmail[];
  currentUser?: AuthUser | null;
}
