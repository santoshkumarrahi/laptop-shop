import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  DollarSign,
  Layers,
  History
} from 'lucide-react';
import { Product, InventoryLog } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';

export const AdminInventory: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [metrics, setMetrics] = useState({
    lowStockCount: 0,
    outOfStockCount: 0,
    totalStockItems: 0,
    totalInventoryValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewTab, setViewTab] = useState<'levels' | 'logs'>('levels');

  // Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(10);
  const [reason, setReason] = useState('Restock Shipment Received');
  const [adjusting, setAdjusting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [invData, logData] = await Promise.all([
        api.getInventory(),
        api.getInventoryLogs(),
      ]);
      setProducts(invData.products);
      setMetrics(invData.metrics);
      setLogs(logData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setAdjusting(true);
    try {
      await api.adjustInventory({
        productId: selectedProduct.id,
        adjustmentAmount: Number(adjustmentAmount),
        reason: reason.trim(),
        adminName: user?.name || 'Alexander Vance',
      });

      setSelectedProduct(null);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Inventory &amp; Stock Levels
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {metrics.totalStockItems} Total Units
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor low-stock alerts, adjust quantities with audit reasons, and review historical movement logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTab(viewTab === 'levels' ? 'logs' : 'levels')}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>{viewTab === 'levels' ? 'View Movement Logs' : 'View Stock Levels'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Total Units in Stock</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalStockItems} units</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Total Valuation (At Cost)</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            ${metrics.totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Low Stock Items</span>
          <div className={`text-2xl font-black mt-1 ${metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {metrics.lowStockCount}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Out of Stock</span>
          <div className={`text-2xl font-black mt-1 ${metrics.outOfStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {metrics.outOfStockCount}
          </div>
        </div>
      </div>

      {/* VIEW 1: Stock Levels Table */}
      {viewTab === 'levels' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search inventory by product or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Retail Price</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock_quantity <= p.low_stock_threshold;
                  const isOut = p.stock_quantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.primary_image}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                          />
                          <span className="font-extrabold text-slate-900 truncate max-w-xs">{p.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{p.sku}</td>
                      <td className="py-3 px-4 text-slate-600">${p.purchase_cost.toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">${(p.sale_price || p.regular_price).toLocaleString()}</td>

                      <td className="py-3 px-4 font-black text-slate-900">
                        {p.stock_quantity}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isOut ? 'Depleted' : isLow ? 'Low Stock' : 'Optimal'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setAdjustmentAmount(10);
                            setReason('Restock Shipment Received');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors cursor-pointer"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Movement Logs Table */}
      {viewTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Stock Movement &amp; Restock History
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Previous</th>
                  <th className="py-3 px-4">Adjustment</th>
                  <th className="py-3 px-4">New Stock</th>
                  <th className="py-3 px-4">Reason / Source</th>
                  <th className="py-3 px-4">Staff Member</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((lg) => (
                  <tr key={lg.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(lg.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{lg.product_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{lg.sku}</td>
                    <td className="py-3 px-4 text-slate-600">{lg.previous_stock}</td>
                    <td className="py-3 px-4 font-bold">
                      <span className={lg.adjustment_amount > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {lg.adjustment_amount > 0 ? `+${lg.adjustment_amount}` : lg.adjustment_amount}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">{lg.new_stock}</td>
                    <td className="py-3 px-4 text-slate-600">{lg.reason}</td>
                    <td className="py-3 px-4 text-slate-500">{lg.admin_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT DIALOG */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Adjust Stock: {selectedProduct.name}
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div>
                Current Available Stock: <strong className="text-slate-900">{selectedProduct.stock_quantity} units</strong>
              </div>
              <div>SKU: <span className="font-mono">{selectedProduct.sku}</span></div>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity Adjustment (+ to restock, - to write off)
                </label>
                <input
                  type="number"
                  required
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Restock Shipment Received">Restock Shipment Received</option>
                  <option value="Physical Warehouse Audit Correction">Physical Warehouse Audit Correction</option>
                  <option value="Damaged Stock Write-off">Damaged Stock Write-off</option>
                  <option value="Demo Floor Unit Allocation">Demo Floor Unit Allocation</option>
                  <option value="Supplier Return">Supplier Return</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {adjusting ? 'Saving...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
