import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { CartProvider } from './context/CartContext.js';
import { WishlistProvider } from './context/WishlistContext.js';
import { Category, Brand, StoreSettings } from './types/index.js';
import { api } from './lib/api.js';

// Store Components
import { Navbar } from './components/store/Navbar.js';
import { HomePage } from './components/store/HomePage.js';
import { ShopPage } from './components/store/ShopPage.js';
import { ProductDetailPage } from './components/store/ProductDetailPage.js';
import { CartDrawer } from './components/store/CartDrawer.js';
import { CheckoutPage } from './components/store/CheckoutPage.js';
import { CustomerAccountPage } from './components/store/CustomerAccountPage.js';
import { AuthPage } from './components/store/AuthPage.js';
import { Footer } from './components/store/Footer.js';

// Admin Components
import { AdminLayout } from './components/admin/AdminLayout.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { AdminCategories } from './components/admin/AdminCategories.js';
import { AdminProducts } from './components/admin/AdminProducts.js';
import { AdminOrders } from './components/admin/AdminOrders.js';
import { AdminInventory } from './components/admin/AdminInventory.js';
import { AdminBrands } from './components/admin/AdminBrands.js';
import { AdminCoupons } from './components/admin/AdminCoupons.js';
import { AdminUsers } from './components/admin/AdminUsers.js';
import { AdminSettings } from './components/admin/AdminSettings.js';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs.js';
import { AdminHomepage } from './components/admin/AdminHomepage.js';
import { AdminSlider } from './components/admin/AdminSlider.js';

function StoreApp() {
  const { user, isStaff } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<Record<string, any>>({});
  const [adminTab, setAdminTab] = useState<string>('dashboard');

  const loadInitialData = async () => {
    try {
      const [catData, brandData, settingsData] = await Promise.all([
        api.getCategories(false), // active only for storefront
        api.getBrands(),
        api.getSettings(),
      ]);
      setCategories(catData);
      setBrands(brandData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Error loading initial store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleNavigate = (view: string, params?: Record<string, any>) => {
    setCurrentView(view);
    setViewParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-bold tracking-wider uppercase text-slate-300">
          Loading NexTech Pro Store...
        </div>
      </div>
    );
  }

  // ADMIN MODE ROUTE
  if (currentView === 'admin') {
    return (
      <AdminLayout
        currentTab={adminTab}
        onSelectTab={(tab) => setAdminTab(tab)}
        onExitAdmin={() => handleNavigate('home')}
      >
        {adminTab === 'dashboard' && <AdminDashboard onNavigateTab={(tab) => setAdminTab(tab)} />}
        {adminTab === 'homepage' && (
          <AdminHomepage
            categories={categories}
            onRefreshSettings={loadInitialData}
            onRefreshCategories={loadInitialData}
          />
        )}
        {adminTab === 'sliders' && (
          <AdminSlider
            onRefreshSettings={loadInitialData}
            onNavigate={handleNavigate}
          />
        )}
        {adminTab === 'categories' && <AdminCategories onRefreshCategories={loadInitialData} />}
        {adminTab === 'products' && <AdminProducts categories={categories} brands={brands} />}
        {adminTab === 'orders' && <AdminOrders />}
        {adminTab === 'inventory' && <AdminInventory />}
        {adminTab === 'brands' && <AdminBrands onRefreshBrands={loadInitialData} />}
        {adminTab === 'coupons' && <AdminCoupons />}
        {adminTab === 'users' && <AdminUsers />}
        {adminTab === 'settings' && <AdminSettings onRefreshSettings={loadInitialData} />}
        {adminTab === 'audit' && <AdminAuditLogs />}
      </AdminLayout>
    );
  }

  // CUSTOMER FRONTEND ROUTE
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navbar with auto-suggest, dynamic categories, cart and account */}
      <Navbar
        categories={categories}
        settings={settings}
        onNavigate={handleNavigate}
        activeView={currentView}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            categories={categories}
            brands={brands}
            settings={settings}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'shop' && (
          <ShopPage
            categories={categories}
            brands={brands}
            initialCategory={viewParams.category}
            initialCondition={viewParams.condition}
            initialSearch={viewParams.search}
            initialFeatured={viewParams.featured}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'product' && (
          <ProductDetailPage
            productId={viewParams.id || viewParams.slug}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutPage onNavigate={handleNavigate} />
        )}

        {currentView === 'account' && (
          <CustomerAccountPage onNavigate={handleNavigate} initialTab="profile" />
        )}

        {currentView === 'orders' && (
          <CustomerAccountPage onNavigate={handleNavigate} initialTab="orders" />
        )}

        {currentView === 'track-order' && (
          <CustomerAccountPage onNavigate={handleNavigate} initialTab="orders" />
        )}

        {currentView === 'wishlist' && (
          <CustomerAccountPage onNavigate={handleNavigate} initialTab="wishlist" />
        )}

        {currentView === 'auth' && (
          <AuthPage
            onSuccess={() => handleNavigate('home')}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Slide-over Cart Drawer (available throughout store) */}
      <CartDrawer onNavigate={handleNavigate} />

      {/* Professional Storefront Footer */}
      <Footer
        categories={categories}
        brands={brands}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <StoreApp />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
