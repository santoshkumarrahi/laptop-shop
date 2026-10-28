import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Laptop,
  ShoppingBag,
  Package,
  Award,
  Tag,
  Users,
  Settings,
  FileText,
  ArrowLeft,
  Shield,
  Search,
  Bell,
  Menu,
  X,
  Plus,
  ExternalLink,
  ChevronDown,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  children
}) => {
  const { user, switchAccount, isSuperAdmin, canManageProducts, canManageOrders, canManageInventory } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'homepage', label: 'Homepage & Hero Studio', icon: Sparkles, badge: 'Hero' },
    { id: 'sliders', label: 'Promo Slider Studio', icon: SlidersHorizontal, badge: 'New' },
    { id: 'categories', label: 'Category Management', icon: Layers, badge: 'Crucial' },
    { id: 'products', label: 'Products & Specifications', icon: Laptop },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory & Stock Logs', icon: Package },
    { id: 'brands', label: 'Brand Partners', icon: Award },
    { id: 'coupons', label: 'Coupons & Promos', icon: Tag },
    { id: 'users', label: 'Users & Staff Roles', icon: Users, restrictedToSuperAdmin: true },
    { id: 'settings', label: 'Website Settings & Banners', icon: Settings },
    { id: 'audit', label: 'Administrative Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-tight">NEXTECH ADMIN</div>
              <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
                Full Control Suite
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Role Pill */}
        <div className="p-3 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/60 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</div>
                <div className="text-[10px] text-slate-400 capitalize truncate">
                  {user?.role?.replace('_', ' ') || 'Staff'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Test role switcher"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick role switcher dropdown */}
          {roleSwitcherOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl p-2 z-50 shadow-xl space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5">Switch Test Role</div>
              {[
                { r: 'super_admin', label: 'Super Admin' },
                { r: 'product_manager', label: 'Product Manager' },
                { r: 'customer_support', label: 'Customer Support' },
              ].map((item) => (
                <button
                  key={item.r}
                  onClick={() => {
                    switchAccount(item.r as any);
                    setRoleSwitcherOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    user?.role === item.r ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Exit Admin Button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Return to Customer Store</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>Admin Panel</span>
              <span className="text-slate-300">/</span>
              <span className="capitalize text-slate-900 font-extrabold">{currentTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExitAdmin}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 cursor-pointer"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
