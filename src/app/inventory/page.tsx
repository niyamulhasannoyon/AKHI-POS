'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, Trash2 } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const update = () => setProducts(farmStore.getState().products || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleAddProduct = () => {
    const name = prompt('Product Name (e.g. Broiler Growth Vitamin):');
    if (!name) return;
    const price = Number(prompt('Selling Price (৳):', '2500')) || 0;
    const cost = Number(prompt('Cost Price (৳):', '2200')) || 0;
    const stock = Number(prompt('Stock Quantity:', '100')) || 0;

    farmStore.addItem('products', {
      id: `PRD-${Date.now().toString().slice(-4)}`,
      name,
      category: 'Feed & Gura',
      price,
      cost,
      stock,
      unit: 'Bag',
      minStock: 15
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this product from catalog?')) {
      farmStore.deleteItem('products', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-400" />
            <span>Product & Stock Catalog</span>
          </h2>
          <p className="text-xs text-gray-400">Manage inventory items, pricing, reorder thresholds, and stock levels.</p>
        </div>
        <button
          onClick={handleAddProduct}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Selling Price</th>
                <th>Cost Price</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isLow = p.stock <= p.minStock;
                return (
                  <tr key={p.id}>
                    <td className="font-bold text-gray-400">{p.id}</td>
                    <td className="font-bold text-white">{p.name}</td>
                    <td><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-gray-300">{p.category}</span></td>
                    <td className="font-bold text-emerald-400">{formatCurrency(p.price)}</td>
                    <td>{formatCurrency(p.cost)}</td>
                    <td className={`font-extrabold text-base ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>{p.stock}</td>
                    <td>{p.unit}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isLow ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {isLow ? '⚠ Low Stock' : '✓ Normal'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
