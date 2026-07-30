'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, Trash2, Edit, ArrowLeft, RefreshCw } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Add Product Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Product['category']>('Feed & Gura');
  const [price, setPrice] = useState<number | ''>('');
  const [cost, setCost] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [unit, setUnit] = useState<Product['unit']>('Bag');
  const [minStock, setMinStock] = useState<number | ''>(10);

  // Edit Product Form State
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<Product['category']>('Feed & Gura');
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editCost, setEditCost] = useState<number | ''>('');
  const [editStock, setEditStock] = useState<number | ''>('');
  const [editUnit, setEditUnit] = useState<Product['unit']>('Bag');
  const [editMinStock, setEditMinStock] = useState<number | ''>(10);

  useEffect(() => {
    const update = () => setProducts(farmStore.getState().products || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('অনুগ্রহ করে পণ্যের নাম লিখুন');

    const newPrd: Product = {
      id: `PRD-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      category,
      price: price ? Number(price) : 0,
      cost: cost ? Number(cost) : 0,
      stock: stock ? Number(stock) : 0,
      unit: unit || 'Pcs',
      minStock: minStock ? Number(minStock) : 5
    };

    farmStore.addItem('products', newPrd);
    setName('');
    setPrice('');
    setCost('');
    setStock('');
    setShowAddModal(false);
    alert('নতুন পণ্য ক্যাটালগে যুক্ত করা হয়েছে!');
  };

  const openEditModal = (p: Product) => {
    setActiveProduct(p);
    setEditName(p.name);
    setEditCategory(p.category);
    setEditPrice(p.price);
    setEditCost(p.cost);
    setEditStock(p.stock);
    setEditUnit(p.unit);
    setEditMinStock(p.minStock);
    setShowEditModal(true);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    if (!editName.trim()) return alert('অনুগ্রহ করে পণ্যের নাম দিন');

    farmStore.updateItem('products', activeProduct.id, {
      name: editName.trim(),
      category: editCategory,
      price: editPrice !== '' ? Number(editPrice) : activeProduct.price,
      cost: editCost !== '' ? Number(editCost) : activeProduct.cost,
      stock: editStock !== '' ? Number(editStock) : activeProduct.stock,
      unit: editUnit || activeProduct.unit,
      minStock: editMinStock !== '' ? Number(editMinStock) : activeProduct.minStock
    });

    setShowEditModal(false);
    alert('পণ্যের তথ্য আপডেট করা হয়েছে!');
  };

  const handleDelete = (id: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই পণ্যটি মুছে ফেলতে চান?')) {
      farmStore.deleteItem('products', id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121620] p-5 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-400" />
            <span>পণ্য ও স্টক ক্যাটালগ (Product & Stock Catalog)</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">পোল্ট্রি খাদ্য, মেডিসিন, ডিম ও মুরগির স্টক ম্যানেজমেন্ট ও এডিটিং সিস্টেম।</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন পণ্য যোগ করুন</span>
        </button>
      </div>

      {/* Product List Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>আইডি</th>
                <th>পণ্যের নাম</th>
                <th>ক্যাটাগরি</th>
                <th>বিক্রয় মূল্য</th>
                <th>ক্রয় মূল্য</th>
                <th>বর্তমান স্টক</th>
                <th>একক (Unit)</th>
                <th>স্ট্যাটাস</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isLow = p.stock <= p.minStock;
                return (
                  <tr key={p.id}>
                    <td className="font-bold text-gray-400">{p.id}</td>
                    <td className="font-bold text-white text-sm">{p.name}</td>
                    <td><span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-emerald-300">{p.category}</span></td>
                    <td className="font-bold text-emerald-400">৳ {p.price.toLocaleString()}</td>
                    <td className="text-gray-300">৳ {p.cost.toLocaleString()}</td>
                    <td className={`font-extrabold text-base ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>{p.stock}</td>
                    <td className="text-xs text-gray-400">{p.unit}</td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isLow ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {isLow ? '⚠ স্টক কম' : '✓ স্বাভাবিক'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition"
                          title="এডিট করুন"
                        >
                          <Edit className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121620] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-xl w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold text-emerald-400">নতুন পণ্য ক্যাটালগে যোগ করুন</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">পণ্যের নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: ব্রয়লার গ্রোয়ার ফিড (Broiler Feed)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ক্যাটাগরি</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Product['category'])}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-emerald-300 focus:outline-none text-sm font-medium"
                  >
                    <option value="Feed & Gura">Feed & Gura (খাদ্য)</option>
                    <option value="Eggs">Eggs (ডিম)</option>
                    <option value="Live Birds">Live Birds (জীবন্ত মুরগি)</option>
                    <option value="Medicines">Medicines (ঔষধ/ভ্যাকসিন)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">একক (Unit)</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Product['unit'])}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm"
                  >
                    <option value="Bag">বস্তা (Bag)</option>
                    <option value="Crate">খাঁচা/কেস (Crate)</option>
                    <option value="KG">কেজি (KG)</option>
                    <option value="Pcs">পিস (Pcs)</option>
                    <option value="Bottle">বোতল (Bottle)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">বিক্রয় মূল্য (৳)</label>
                  <input
                    type="number"
                    placeholder="2500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-emerald-400 font-bold focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">ক্রয়/কেনা খরচ (৳)</label>
                  <input
                    type="number"
                    placeholder="2200"
                    value={cost}
                    onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">প্রাথমিক স্টক পরিমাণ</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={stock}
                    onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">সর্বনিম্ন স্টক সতর্কতা (Min Stock)</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg text-sm"
              >
                + পণ্য যোগ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121620] border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-6 max-w-xl w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-xl font-bold text-blue-400">পণ্যের তথ্য এডিট / সংশোধন করুন</h3>
              <button onClick={() => setShowEditModal(false)} className="text-xs text-gray-400 hover:text-white">✕ বন্ধ করুন</button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">পণ্যের নাম</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ক্যাটাগরি</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as Product['category'])}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-emerald-300 focus:outline-none text-sm font-medium"
                  >
                    <option value="Feed & Gura">Feed & Gura (খাদ্য)</option>
                    <option value="Eggs">Eggs (ডিম)</option>
                    <option value="Live Birds">Live Birds (জীবন্ত মুরগি)</option>
                    <option value="Medicines">Medicines (ঔষধ/ভ্যাকসিন)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">একক (Unit)</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value as Product['unit'])}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm"
                  >
                    <option value="Bag">বস্তা (Bag)</option>
                    <option value="Crate">খাঁচা/কেস (Crate)</option>
                    <option value="KG">কেজি (KG)</option>
                    <option value="Pcs">পিস (Pcs)</option>
                    <option value="Bottle">বোতল (Bottle)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">বিক্রয় মূল্য (৳)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-emerald-400 font-bold focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">ক্রয়/কেনা খরচ (৳)</label>
                  <input
                    type="number"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">স্টক পরিমাণ</label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">সর্বনিম্ন স্টক সতর্কতা (Min Stock)</label>
                  <input
                    type="number"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1a1f2c] border border-gray-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg text-sm"
                >
                  ✓ আপডেট নিশ্চিত করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-3 border border-gray-700 hover:bg-gray-800 text-gray-300 rounded-xl text-sm"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
