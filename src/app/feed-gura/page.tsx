'use client';

import { useState, useEffect } from 'react';
import { farmStore } from '@/lib/store';
import { FeedIngredient } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Wheat, Plus, Zap } from 'lucide-react';

export default function FeedGuraPage() {
  const [ingredients, setIngredients] = useState<FeedIngredient[]>([]);
  const [batchBags, setBatchBags] = useState<number>(10);
  const [targetProduct, setTargetProduct] = useState<string>('PRD-001');

  useEffect(() => {
    const update = () => setIngredients(farmStore.getState().feedIngredients || []);
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleAddIngredient = () => {
    const name = prompt('Ingredient Name (e.g. Wheat Bran):');
    if (!name) return;
    const stockKg = Number(prompt('Current Stock (KG):', '1000')) || 0;
    const costPerKg = Number(prompt('Cost per KG (৳):', '30')) || 0;

    farmStore.addItem('feedIngredients', {
      id: `ING-${Date.now().toString().slice(-4)}`,
      name,
      stockKg,
      costPerKg
    });
  };

  const handleRunBatch = () => {
    const maize = ingredients.find(i => i.id === 'ING-01');
    const soy = ingredients.find(i => i.id === 'ING-02');

    const reqMaize = batchBags * 27.5;
    const reqSoy = batchBags * 15.0;

    if (maize && maize.stockKg < reqMaize) {
      alert(`Insufficient Maize stock! Required: ${reqMaize} KG`);
      return;
    }
    if (soy && soy.stockKg < reqSoy) {
      alert(`Insufficient Soybean stock! Required: ${reqSoy} KG`);
      return;
    }

    if (maize) farmStore.updateItem('feedIngredients', maize.id, { stockKg: maize.stockKg - reqMaize });
    if (soy) farmStore.updateItem('feedIngredients', soy.id, { stockKg: soy.stockKg - reqSoy });

    const prd = farmStore.getState().products.find(p => p.id === targetProduct);
    if (prd) {
      farmStore.updateItem('products', prd.id, { stock: prd.stock + batchBags });
    }

    alert(`Feed batch complete! Produced ${batchBags} bags.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Wheat className="w-6 h-6 text-amber-400" />
          <span>Feed & Gura Formulation Engine</span>
        </h2>
        <p className="text-xs text-gray-400">Manage raw feed ingredients, formulate mixing ratios, and run grinding production batches.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Ingredients Stock */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base">Raw Ingredients Inventory</h3>
            <button onClick={handleAddIngredient} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> <span>Add Ingredient</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Stock (KG)</th>
                  <th>Cost / KG</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map(ing => (
                  <tr key={ing.id}>
                    <td className="font-bold text-white">{ing.name}</td>
                    <td className={`font-bold ${ing.stockKg < 500 ? 'text-red-400' : 'text-emerald-400'}`}>{ing.stockKg} KG</td>
                    <td>{formatCurrency(ing.costPerKg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recipe & Batch Mixing Register */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>Feed Batch Mixing Calculator</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Target Output Product</label>
                <select
                  value={targetProduct}
                  onChange={(e) => setTargetProduct(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="PRD-001">Sonali Starter Feed (50kg Bag)</option>
                  <option value="PRD-002">Broiler Finisher Feed (50kg Bag)</option>
                  <option value="PRD-007">Maize Powder (Gura - 50kg Bag)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Batch Output Volume (Bags of 50kg)</label>
                <input
                  type="number"
                  value={batchBags}
                  onChange={(e) => setBatchBags(Number(e.target.value) || 1)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs text-gray-300">
                <div className="font-bold text-amber-400 mb-1">Standard Sonali Feed Recipe (500 KG Batch)</div>
                <ul className="list-disc pl-4 space-y-0.5 text-gray-400">
                  <li>Yellow Maize Gura: <b>275 KG (55%)</b></li>
                  <li>Soybean Meal: <b>150 KG (30%)</b></li>
                  <li>Rice Polish / Bran: <b>50 KG (10%)</b></li>
                  <li>Premix & Calcium: <b>25 KG (5%)</b></li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunBatch}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 text-sm transition mt-4"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Run Grinding Batch & Add Feed Stock</span>
          </button>
        </div>
      </div>
    </div>
  );
}
