'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Product, CartItem, Sale, Customer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Search, ShoppingCart, Plus, Minus, Zap } from 'lucide-react';

function generateId(prefix: string, sliceLength: number): string {
  const timestamp = Date.now().toString();
  return `${prefix}-${timestamp.slice(-sliceLength)}`;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [posEmails, setPosEmails] = useState<{ email: string; name: string; role: string; status: string }[]>([]);
  const [operatorEmail, setOperatorEmail] = useState<string>('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);

  useEffect(() => {
    const update = () => {
      const st = farmStore.getState();
      setProducts(st.products || []);
      setCustomers(st.customers || []);
      const emails = st.posAuthorizedEmails || [];
      setPosEmails(emails);
      if (emails.length > 0 && !operatorEmail) {
        const active = emails.find(e => e.status === 'Active');
        if (active) setOperatorEmail(active.email);
      }
    };
    update();
    return farmStore.subscribe(update);
  }, []);

  const addToCart = (product: Product) => {
    const exist = cart.find(c => c.id === product.id);
    if (exist) {
      setCart(cart.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, unit: product.unit, qty: 1 }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const nQty = c.qty + delta;
        return nQty > 0 ? { ...c, qty: nQty } : null;
      }
      return c;
    }).filter(Boolean) as CartItem[]);
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchQ = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQ;
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const customerObj: Customer = customers.find(c => c.id === selectedCustomer) || { id: 'walkin', name: 'Walk-in Retail', phone: 'N/A', due: 0, totalPurchases: 0 };

    const newSale: Sale = {
      id: generateId('INV', 6),
      date: new Date().toISOString(),
      customerId: customerObj.id,
      customerName: customerObj.name,
      items: [...cart],
      subtotal,
      discount,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentMethod,
      status: dueAmount === 0 ? 'Paid' : (paidAmount === 0 ? 'Due' : 'Partial')
    };

    // 1. Add Sale
    farmStore.addItem('sales', newSale);

    // 2. Deduct Inventory Stock
    cart.forEach(item => {
      const prd = products.find(p => p.id === item.id);
      if (prd) {
        farmStore.updateItem('products', prd.id, { stock: Math.max(0, prd.stock - item.qty) });
      }
    });

    // 3. Update Customer Due
    if (dueAmount > 0) {
      farmStore.updateItem('customers', customerObj.id, { due: (customerObj.due || 0) + dueAmount });
    }

    // 4. Record Income Entry
    farmStore.addItem('accounting', {
      id: generateId('ACC', 5),
      date: new Date().toISOString().slice(0, 10),
      type: 'Income',
      category: 'POS Sales',
      amount: paidAmount,
      note: `Invoice #${newSale.id} (${customerObj.name})`
    });

    setActiveReceipt(newSale);
    setTimeout(() => {
      window.print();
    }, 300);

    setCart([]);
    setDiscount(0);
    setPaidAmount(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-6rem)] lg:h-[calc(100vh-6rem)]">
      {/* Left 2 Columns: Catalog */}
      <div className="lg:col-span-2 glass-card flex flex-col min-h-[450px] lg:h-full overflow-hidden">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search product by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'Feed & Gura', 'Eggs', 'Live Birds', 'Medicines'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                  selectedCategory === cat 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-950/50' 
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto flex-1 pr-1">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="glass-card p-3 cursor-pointer hover:border-emerald-500/50 hover:-translate-y-1 transition flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">{product.category}</span>
                <h4 className="font-bold text-white text-sm leading-tight mt-0.5">{product.name}</h4>
                <div className="text-xs text-gray-400 mt-1">
                  Stock: <b className={product.stock <= product.minStock ? 'text-red-400' : 'text-emerald-400'}>{product.stock} {product.unit}</b>
                </div>
              </div>
              <div className="text-base font-extrabold text-emerald-400 mt-3">{formatCurrency(product.price)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Cart Register */}
      <div className="glass-card flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span>Checkout Register</span>
            </h3>
            <button onClick={() => setCart([])} className="text-xs text-red-400 hover:underline">Clear</button>
          </div>

          {/* POS Authorized Operator Selection Bar */}
          <div className="mt-2.5 p-2.5 bg-slate-900/90 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between">
            <div className="text-gray-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>অপারেটর ইমেইল:</span>
            </div>
            <select
              value={operatorEmail}
              onChange={(e) => setOperatorEmail(e.target.value)}
              className="bg-[#1a1f2c] border border-emerald-500/50 text-emerald-300 font-mono font-bold text-[11px] rounded-lg px-2.5 py-1 focus:outline-none"
            >
              {posEmails.map((e) => (
                <option key={e.email} value={e.email}>
                  {e.email} ({e.name})
                </option>
              ))}
            </select>
          </div>

          {/* Customer Selection with Live Autocomplete Suggestions */}
          <div className="mt-3 relative">
            <label className="text-xs text-gray-400 font-medium block mb-1">Customer Account (কাস্টমার সিলেক্ট বা সার্চ করুন)</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'N/A'}) {c.due > 0 ? `[বাকি: ৳${c.due}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 mt-4 max-h-[220px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">Cart is empty. Click items on the left.</div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-white/5">
                  <div>
                    <div className="font-bold text-white text-xs">{item.name}</div>
                    <div className="text-[10px] text-gray-400">{formatCurrency(item.price)} / {item.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-white/10 text-white hover:bg-emerald-500 flex items-center justify-center font-bold text-xs">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-white text-sm w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-white/10 text-white hover:bg-emerald-500 flex items-center justify-center font-bold text-xs">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calculations & Checkout */}
        <div className="border-t border-white/10 pt-3 space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 font-medium block">Discount (৳)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-medium block">Paid Amount (৳)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 my-1">
            <span className="text-xs font-semibold text-gray-300">Net Payable</span>
            <span className="text-lg font-black text-emerald-400">{formatCurrency(grandTotal)}</span>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-medium block mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
            >
              <option value="Cash">Cash Payment</option>
              <option value="Bkash">Bkash Mobile Banking</option>
              <option value="Nagad">Nagad Mobile Banking</option>
              <option value="Bank">Bank Transfer</option>
            </select>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 text-sm transition mt-2"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Complete Sale & Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Printable Thermal Receipt Component */}
      {activeReceipt && (
        <div id="thermal-receipt" className="hidden">
          <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '5px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>AKHI POULTRY FARM</h2>
            <div>Gazipur, Bangladesh</div>
            <div>INVOICE: {activeReceipt.id}</div>
            <div>Date: {new Date(activeReceipt.date).toLocaleString()}</div>
            <div>Customer: {activeReceipt.customerName}</div>
          </div>

          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left' }}>Item</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {activeReceipt.items.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td style={{ textAlign: 'right' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right' }}>৳{item.qty * item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', marginTop: '10px', paddingTop: '5px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>৳{activeReceipt.subtotal}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Net Total:</span><span>৳{activeReceipt.grandTotal}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid ({activeReceipt.paymentMethod}):</span><span>৳{activeReceipt.paidAmount}</span></div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '10px' }}>*** Thank You ***</div>
        </div>
      )}
    </div>
  );
}
