import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Package,
  MapPin,
  Heart,
  Printer,
  ChevronRight,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWishlist } from '../../context/WishlistContext.js';
import { useCart } from '../../context/CartContext.js';
import { Order, Product, UserAddress } from '../../types/index.js';
import { api } from '../../lib/api.js';

interface CustomerAccountPageProps {
  onNavigate: (view: string, params?: Record<string, any>) => void;
  initialTab?: 'profile' | 'orders' | 'addresses' | 'wishlist';
}

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({
  onNavigate,
  initialTab = 'orders'
}) => {
  const { user } = useAuth();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'wishlist'>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Address form modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newZip, setNewZip] = useState('');
  const [newCountry, setNewCountry] = useState('United States');

  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const data = await api.getOrders(user ? { customer_id: user.id } : {});
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadOrders();
  }, [user]);

  useEffect(() => {
    async function loadWishlist() {
      if (wishlistIds.length === 0) {
        setWishlistProducts([]);
        return;
      }
      try {
        const res = await api.getProducts({ limit: 50 });
        const filtered = res.products.filter((p) => wishlistIds.includes(p.id));
        setWishlistProducts(filtered);
      } catch (err) {
        console.error(err);
      }
    }
    loadWishlist();
  }, [wishlistIds]);

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Account Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user?.name || 'Customer Account'}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase border border-blue-200">
                  {user?.role?.replace('_', ' ') || 'Customer'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email || 'Logged In Account'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('shop')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
          {[
            { id: 'orders', label: 'Order History & Invoices', icon: Package, count: orders.length },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin, count: user?.addresses?.length || 0 },
            { id: 'wishlist', label: 'Saved Wishlist', icon: Heart, count: wishlistIds.length },
            { id: 'profile', label: 'Account Profile', icon: UserIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB: Order History */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">Your Orders &amp; Fulfillment Status</h2>

            {loadingOrders ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading order history...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900 mb-1">No orders placed yet</h3>
                <p className="text-xs text-slate-500 mb-4">When you place an order, it will appear here with live tracking.</p>
                <button
                  onClick={() => onNavigate('shop')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Browse Store Catalog
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <div key={ord.id} className="py-5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-600">{ord.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.fulfillment_status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ord.fulfillment_status === 'Shipped'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : ord.fulfillment_status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ord.fulfillment_status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        {ord.items.length} item(s) &bull; Payment:{' '}
                        <span className="font-semibold">{ord.payment_status}</span> ({ord.payment_method.toUpperCase()})
                      </div>

                      {ord.tracking_number && (
                        <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                          <span>Tracking: {ord.carrier} - {ord.tracking_number}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">
                          ${ord.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-slate-400">{ord.shipping_method}</div>
                      </div>

                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        View Invoice &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Saved Addresses */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Saved Addresses</h2>
                <p className="text-xs text-slate-500">Fast 1-click checkout addresses</p>
              </div>
              <button
                onClick={() => setShowAddressModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                + Add New Address
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(user?.addresses || []).map((addr) => (
                <div key={addr.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      Shipping Address
                    </span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <p>{addr.street}</p>
                    <p>
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p>{addr.country}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Saved Wishlist */}
        {activeTab === 'wishlist' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <h2 className="text-base font-extrabold text-slate-900">Saved Wishlist ({wishlistIds.length})</h2>

            {wishlistProducts.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900 mb-1">Your wishlist is empty</h3>
                <p className="text-xs text-slate-500 mb-4">Click the heart icon on any laptop or product to save it here.</p>
                <button
                  onClick={() => onNavigate('shop')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistProducts.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="aspect-square rounded-xl bg-slate-50 overflow-hidden mb-3">
                        <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{p.name}</h4>
                      <div className="text-sm font-extrabold text-slate-900 mt-2">
                        ${(p.sale_price || p.regular_price).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => addToCart(p, undefined, 1)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => toggleWishlist(p.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-200 cursor-pointer"
                        title="Remove"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Profile Details */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs max-w-xl space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">Personal Information</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  readOnly
                  value={user?.name || ''}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Role</label>
                <input
                  type="text"
                  readOnly
                  value={user?.role?.toUpperCase() || 'CUSTOMER'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ORDER INVOICE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Official Invoice</span>
                <h3 className="text-base font-extrabold text-slate-900">{selectedOrder.id}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Tracking Status */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Status: </span>
                <span className="font-bold text-slate-900">{selectedOrder.fulfillment_status}</span>
              </div>
              {selectedOrder.tracking_number && (
                <div>
                  <span className="text-slate-400">Tracking: </span>
                  <span className="font-mono font-bold text-blue-600">{selectedOrder.tracking_number}</span>
                </div>
              )}
            </div>

            {/* Line items */}
            <div className="divide-y divide-slate-100">
              {selectedOrder.items.map((it, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-bold text-slate-900">{it.name}</h5>
                    <span className="text-slate-400">Qty: {it.quantity} &bull; SKU: {it.sku}</span>
                  </div>
                  <span className="font-bold text-slate-900">${it.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total breakdown */}
            <div className="pt-4 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discount_total > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount</span>
                  <span>-${selectedOrder.discount_total.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${selectedOrder.tax_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${selectedOrder.shipping_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Paid</span>
                <span className="text-blue-600">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
