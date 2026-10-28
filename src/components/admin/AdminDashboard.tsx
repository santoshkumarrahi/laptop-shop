import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  Laptop,
  Layers,
  AlertTriangle,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { DashboardStats } from '../../types/index.js';
import { api } from '../../lib/api.js';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats(range);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-32 border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const { metrics, statusCounts, salesTimeline, bestSellers, categoryRevenue, lowStockProducts, recentOrders } = stats;

  return (
    <div className="space-y-8">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Store Performance &amp; Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real database analytics computed live from orders, cost of goods, and inventory records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <button
            onClick={fetchStats}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. FINANCIAL METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Sales Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Total Sales Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Today: ${metrics.todayRevenue.toLocaleString()}</span>
              <span>&bull;</span>
              <span>Month: ${metrics.monthlyRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Real Gross Profit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Calculated Gross Profit</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-600">
              ${metrics.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{metrics.profitMarginPercent}% Gross Margin</span>
              <span className="text-slate-400 font-normal">(Revenue - Product Costs)</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Customer Orders</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{metrics.totalOrders}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-semibold text-amber-600">{statusCounts.Processing || 0} Processing</span>
              <span>&bull;</span>
              <span className="font-semibold text-emerald-600">{statusCounts.Delivered || 0} Delivered</span>
            </div>
          </div>
        </div>

        {/* Catalog & Inventory Health */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Inventory Health</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              metrics.lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{metrics.totalProducts}</span>
              <span className="text-xs text-slate-400">Total Products</span>
            </div>
            <div className="text-[11px] mt-1 flex items-center gap-2">
              {metrics.lowStockCount > 0 ? (
                <span className="text-amber-600 font-bold">{metrics.lowStockCount} Low Stock Alert</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Stock Levels Healthy</span>
              )}
              {metrics.outOfStockCount > 0 && (
                <span className="text-rose-600 font-bold">({metrics.outOfStockCount} Out)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SALES & PROFIT TIMELINE + REVENUE BY CATEGORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Timeline Bar/Card (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Revenue &amp; Profit Trends</h3>
              <p className="text-xs text-slate-400">Daily sales performance and calculated net profit</p>
            </div>
          </div>

          {/* Simple clean visual bars */}
          <div className="space-y-3 pt-4">
            {salesTimeline.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No sales recorded in this period</div>
            ) : (
              salesTimeline.map((day) => {
                const maxVal = Math.max(...salesTimeline.map((s) => s.revenue), 1);
                const revWidth = Math.round((day.revenue / maxVal) * 100);
                const profitWidth = Math.round((day.profit / maxVal) * 100);

                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{day.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">${day.revenue.toLocaleString()} Rev</span>
                        <span className="font-semibold text-emerald-600">${day.profit.toLocaleString()} Profit</span>
                        <span className="text-[11px] text-slate-400">({day.orders} ord)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${revWidth}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Revenue by Category Breakdown (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Revenue by Category</h3>
              <button
                onClick={() => onNavigateTab('categories')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Manage
              </button>
            </div>
            <p className="text-xs text-slate-400">Top earning product categories</p>
          </div>

          <div className="space-y-3 my-2">
            {categoryRevenue.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{cat.name}</span>
                  <span className="font-extrabold text-slate-900">${cat.value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (cat.value / (metrics.totalRevenue || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
            <span>Dynamic DB categories: {metrics.totalCategories}</span>
            <span>Total Brands: {metrics.totalBrands}</span>
          </div>
        </div>
      </div>

      {/* 3. BEST SELLERS & RECENT ORDERS & LOW STOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Best-Selling Electronics</h3>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View Products
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {bestSellers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No sales recorded yet</div>
            ) : (
              bestSellers.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{item.name}</h5>
                    <span className="text-[11px] text-slate-400">{item.units} units sold</span>
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    ${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">Low Stock Watchlist</h3>
              {lowStockProducts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {lowStockProducts.length} items
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Restock All
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> All product stock quantities are above threshold
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <img
                    src={p.primary_image}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{p.name}</h5>
                    <span className="text-[11px] text-slate-400">SKU: {p.sku}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        p.stock_quantity <= 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {p.stock_quantity <= 0 ? 'Out of Stock' : `${p.stock_quantity} left`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
