import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  Shield,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Laptop,
  ArrowRight,
  LogOut,
  Package,
  Layers,
  Settings,
  Headphones
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useCart } from '../../context/CartContext.js';
import { useWishlist } from '../../context/WishlistContext.js';
import { Category, Product, StoreSettings } from '../../types/index.js';
import { CategoryIcon } from '../common/CategoryIcon.js';
import { api } from '../../lib/api.js';

interface NavbarProps {
  categories: Category[];
  settings: StoreSettings | null;
  onNavigate: (view: string, params?: Record<string, any>) => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  settings,
  onNavigate,
  activeView
}) => {
  const { user, isStaff, switchAccount, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const catMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
        setRoleSwitchOpen(false);
      }
      if (catMenuRef.current && !catMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.getProducts({ search: searchQuery.trim(), limit: 5 });
        setSearchResults(res.products);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      onNavigate('shop', { search: searchQuery.trim() });
    }
  };

  // Top level categories (no parent)
  const topCategories = categories.filter((c) => !c.parent_id);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* 1. ANNOUNCEMENT BAR */}
      {settings?.announcement_enabled ? (
        <div className="bg-slate-900 text-white text-xs sm:text-sm py-2 px-4 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white uppercase tracking-wider">
                Event
              </span>
              <span className="font-medium text-slate-200">
                {settings.announcement_text || 'Free Express Shipping on pro orders over $1,500 + 2-Year Warranty on Flagship Laptops!'}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4 text-xs text-slate-300">
              <span>Support: 1-800-555-TECH</span>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => onNavigate('track-order')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Track Order
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. MAIN NAVIGATION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">
                    NEXT<span className="text-blue-600">ECH</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider block font-semibold">
                  Laptops &amp; Electronics
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar with Autocomplete Suggestions */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-xl relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Search laptops (e.g. RTX 4090, M3 Max), speakers, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 rounded-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Live Autocomplete Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 flex justify-between items-center">
                  <span>Product Suggestions</span>
                  <span className="text-blue-600 cursor-pointer hover:underline" onClick={handleSearchSubmit}>
                    View all matching results &rarr;
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        onNavigate('product', { id: product.id, slug: product.slug });
                      }}
                      className="p-3 hover:bg-blue-50/50 flex items-center gap-3.5 cursor-pointer transition-colors"
                    >
                      <img
                        src={product.primary_image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-600 uppercase">
                            {product.brand_name || 'Tech'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {product.condition}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-900 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-slate-900">
                            ${(product.sale_price || product.regular_price).toLocaleString()}
                          </span>
                          {product.sale_price && (
                            <span className="text-[11px] text-slate-400 line-through">
                              ${product.regular_price.toLocaleString()}
                            </span>
                          )}
                          <span className="text-[11px] text-emerald-600 ml-auto font-medium">
                            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Backorder'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons: Demo Role Switcher, Wishlist, Cart, Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Role Switcher (Convenient for Reviewers) */}
            <div className="relative">
              <button
                onClick={() => setRoleSwitchOpen(!roleSwitchOpen)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                title="Switch role to test different permissions"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span className="capitalize">{user?.role?.replace('_', ' ') || 'Guest'}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {roleSwitchOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Test Permissions
                  </div>
                  {[
                    { role: 'super_admin', label: 'Super Admin', desc: 'Full system control' },
                    { role: 'product_manager', label: 'Product Manager', desc: 'Products & categories' },
                    { role: 'customer_support', label: 'Customer Support', desc: 'Orders & inquiries' },
                    { role: 'customer', label: 'Customer (Alex)', desc: 'Storefront & orders' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchAccount(r.role as any);
                        setRoleSwitchOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex flex-col ${
                        user?.role === r.role ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{r.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{r.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Dashboard shortcut if staff */}
            {isStaff && (
              <button
                onClick={() => onNavigate('admin')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}

            {/* Wishlist Button */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full relative cursor-pointer transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full relative cursor-pointer transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                  {user ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                  {user ? (
                    <>
                      <div className="p-3 border-b border-slate-100">
                        <div className="text-sm font-bold text-slate-900 truncate">{user.name}</div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="py-1">
                        {isStaff && (
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              onNavigate('admin');
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2.5"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Management Panel
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('account');
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2.5"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          My Profile &amp; Addresses
                        </button>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('orders');
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2.5"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          My Orders &amp; Invoices
                        </button>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('wishlist');
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2.5"
                        >
                          <Heart className="w-4 h-4 text-slate-400" />
                          Saved Wishlist ({wishlistCount})
                        </button>
                      </div>
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2.5"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-xs text-slate-500 mb-3">Sign in to track orders, manage addresses, and save wishlists.</p>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('auth');
                        }}
                        className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        Sign In / Register
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. SECONDARY CATEGORIES BAR & MEGA MENU */}
      <div className="border-t border-slate-100 bg-slate-50/75 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-xs font-medium text-slate-600">
            {/* Dynamic Category Dropdown Button */}
            <div ref={catMenuRef} className="relative">
              <button
                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold shadow-xs hover:border-blue-400 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>All Categories</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dynamic Mega Menu Popup */}
              {categoryMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-[720px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-50 grid grid-cols-3 gap-6">
                  {topCategories.slice(0, 12).map((cat) => {
                    const subcats = categories.filter((c) => c.parent_id === cat.id);
                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <button
                          onClick={() => {
                            setCategoryMenuOpen(false);
                            onNavigate('shop', { category: cat.slug });
                          }}
                          className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-blue-600 cursor-pointer w-full text-left"
                        >
                          <CategoryIcon iconName={cat.icon} className="w-4 h-4 text-blue-600" />
                          <span>{cat.name}</span>
                          {cat.product_count !== undefined && (
                            <span className="text-[10px] font-normal text-slate-400">
                              ({cat.product_count})
                            </span>
                          )}
                        </button>
                        {subcats.length > 0 && (
                          <div className="pl-6 space-y-1 text-[11px] text-slate-500">
                            {subcats.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setCategoryMenuOpen(false);
                                  onNavigate('shop', { category: sub.slug });
                                }}
                                className="block hover:text-blue-600 transition-colors cursor-pointer text-left w-full"
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="col-span-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total {categories.length} dynamic categories loaded from database</span>
                    <button
                      onClick={() => {
                        setCategoryMenuOpen(false);
                        onNavigate('shop');
                      }}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Browse Full Store Catalog <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => onNavigate('home')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeView === 'home' ? 'text-blue-600 font-bold bg-blue-50' : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('shop')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeView === 'shop' ? 'text-blue-600 font-bold bg-blue-50' : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => onNavigate('shop', { category: 'laptops' })}
                className="px-3 py-1 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Laptop className="w-3.5 h-3.5 text-blue-500" />
                Laptops
              </button>
              <button
                onClick={() => onNavigate('shop', { category: 'gaming-laptops' })}
                className="px-3 py-1 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Gaming Laptops
              </button>
              <button
                onClick={() => onNavigate('shop', { category: 'business-laptops' })}
                className="px-3 py-1 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Business Laptops
              </button>
              <button
                onClick={() => onNavigate('shop', { category: 'speakers' })}
                className="px-3 py-1 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Headphones className="w-3.5 h-3.5 text-indigo-500" />
                Speakers &amp; Audio
              </button>
              <button
                onClick={() => onNavigate('shop', { category: 'laptop-accessories' })}
                className="px-3 py-1 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Accessories
              </button>
              <button
                onClick={() => onNavigate('shop', { condition: 'Refurbished' })}
                className="px-3 py-1 rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Certified Refurbished
              </button>
            </div>

            {/* Special Deals Pill */}
            <button
              onClick={() => onNavigate('shop', { featured: 'true' })}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200"
            >
              🔥 Flagship Deals
            </button>
          </div>
        </div>
      </div>

      {/* 4. MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 rounded-lg outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </form>

          <div className="space-y-1 text-sm font-medium text-slate-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('home');
              }}
              className="w-full text-left py-2 px-3 hover:bg-slate-50 rounded-lg"
            >
              Home
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('shop');
              }}
              className="w-full text-left py-2 px-3 hover:bg-slate-50 rounded-lg"
            >
              All Products Catalog
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('shop', { category: 'laptops' });
              }}
              className="w-full text-left py-2 px-3 hover:bg-slate-50 rounded-lg text-blue-600 font-bold"
            >
              Laptops
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('shop', { category: 'gaming-laptops' });
              }}
              className="w-full text-left py-2 px-3 hover:bg-slate-50 rounded-lg"
            >
              Gaming Laptops
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('shop', { category: 'speakers' });
              }}
              className="w-full text-left py-2 px-3 hover:bg-slate-50 rounded-lg"
            >
              Speakers &amp; Audio
            </button>
            {isStaff && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('admin');
                }}
                className="w-full text-left py-2 px-3 bg-blue-50 text-blue-700 font-bold rounded-lg flex items-center gap-2"
              >
                <Shield className="w-4 h-4" /> Admin Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
