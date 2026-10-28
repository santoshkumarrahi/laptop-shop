import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShoppingBag,
  Printer,
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Order, UserAddress } from '../../types/index.js';
import { api } from '../../lib/api.js';

interface CheckoutPageProps {
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const {
    items,
    subtotal,
    discountTotal,
    taxTotal,
    shippingFee,
    grandTotal,
    appliedCoupon,
    clearCart,
  } = useCart();

  // Form states
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+1 (555) 019-2834');

  // Address
  const defaultAddr = user?.addresses?.[0];
  const [street, setStreet] = useState(defaultAddr?.street || '100 Silicon Way, Suite 400');
  const [city, setCity] = useState(defaultAddr?.city || 'San Francisco');
  const [state, setState] = useState(defaultAddr?.state || 'CA');
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || '94107');
  const [country, setCountry] = useState(defaultAddr?.country || 'United States');

  // Shipping Method
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  // Payment Option
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (items.length === 0 && !confirmedOrder) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-xs">
        <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 mb-6">Add products to your cart before proceeding to checkout.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  // Auto-fill test card details
  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/29');
    setCardCvc('123');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName || !customerEmail || !street || !city || !postalCode) {
      setErrorMsg('Please complete all required customer and shipping address fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const shippingAddress: UserAddress = {
        id: 'addr_' + Date.now(),
        street,
        city,
        state,
        postalCode,
        country,
      };

      const res = await api.checkout({
        customer_id: user?.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        items,
        coupon_code: appliedCoupon?.code,
        shipping_method: shippingMethod === 'express' ? 'Express Air Shipping' : 'Standard Insured Courier',
        payment_method: paymentMethod,
        payment_details: {
          last4: cardNumber.slice(-4),
        },
      });

      if (res.success && res.order) {
        setConfirmedOrder(res.order);
        clearCart();
        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed. Please check stock and parameters.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ORDER SUCCESS CONFIRMATION VIEW
  if (confirmedOrder) {
    return (
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl space-y-8">
            {/* Success Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                Order Verified &amp; Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Thank you for your order!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Order <strong className="text-slate-900">{confirmedOrder.id}</strong> has been logged to the database. We’ve sent a confirmation invoice to{' '}
                <strong className="text-slate-900">{confirmedOrder.customer_email}</strong>.
              </p>
            </div>

            {/* Tracking Timeline */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Fulfillment Timeline
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-[10px]">
                    ✓
                  </div>
                  <div className="font-bold text-slate-900">Confirmed</div>
                  <div className="text-[10px] text-slate-400">Database logged</div>
                </div>
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center mx-auto text-[10px]">
                    2
                  </div>
                  <div className="font-medium text-slate-600">Processing</div>
                  <div className="text-[10px] text-slate-400">Warehouse pack</div>
                </div>
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center mx-auto text-[10px]">
                    3
                  </div>
                  <div className="font-medium text-slate-600">Shipped</div>
                  <div className="text-[10px] text-slate-400">FedEx / UPS</div>
                </div>
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center mx-auto text-[10px]">
                    4
                  </div>
                  <div className="font-medium text-slate-600">Delivered</div>
                  <div className="text-[10px] text-slate-400">Signed &amp; tested</div>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-3">Purchased Items</h3>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {confirmedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.primaryImage}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                        <div className="text-[11px] text-slate-400">
                          SKU: {item.sku} &bull; Qty: {item.quantity}
                          {item.variantName ? ` &bull; ${item.variantName}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900">
                      ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${confirmedOrder.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {confirmedOrder.discount_total > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({confirmedOrder.coupon_code || 'Promo'})</span>
                  <span>-${confirmedOrder.discount_total.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax (8%)</span>
                <span>${confirmedOrder.tax_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping ({confirmedOrder.shipping_method})</span>
                <span>{confirmedOrder.shipping_fee === 0 ? 'FREE' : `$${confirmedOrder.shipping_fee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Paid</span>
                <span className="text-blue-600">
                  ${confirmedOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 no-print">
              <button
                onClick={() => window.print()}
                className="w-full sm:flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Official Invoice Receipt</span>
              </button>
              <button
                onClick={() => onNavigate('shop')}
                className="w-full sm:flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CHECKOUT FORM VIEW
  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <button onClick={() => onNavigate('shop')} className="hover:text-blue-600 cursor-pointer">
            Catalog
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">Secure Checkout</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Complete Your Order
        </h1>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Customer & Address & Payment Forms (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer Info */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">1. Customer Contact Details</h3>
                <span className="text-[11px] text-slate-400">Order updates will be sent here</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Courier SMS) *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Address */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">2. Shipping Destination Address</h3>
                {user?.addresses && user.addresses.length > 0 && (
                  <span className="text-[11px] text-blue-600 font-semibold">Autofilled from Saved Profile</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State / Province *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ZIP / Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">3. Payment Gateway</h3>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secure SSL Gateway</span>
                </div>
              </div>

              {/* Payment Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Credit / Debit Card</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">Visa, Mastercard, Amex</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">Cash on Delivery</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">Pay cash upon courier delivery</span>
                </button>
              </div>

              {/* Card Form */}
              {paymentMethod === 'card' && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Online Card Gateway</span>
                    <button
                      type="button"
                      onClick={fillTestCard}
                      className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-fill Test Card Details
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Security Code (CVC)</label>
                      <input
                        type="password"
                        required
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="CVC"
                        maxLength={4}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Order Summary Box (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs sticky top-24 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                Order Review ({items.length} items)
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <img
                      src={it.primaryImage}
                      alt={it.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{it.name}</h4>
                      <div className="text-[11px] text-slate-500">
                        Qty: {it.quantity} {it.variantName ? `(${it.variantName})` : ''}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      ${(it.unitPrice * it.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Method Choice */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Shipping Speed
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      shippingMethod === 'standard' ? 'border-blue-600 bg-blue-50/40' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shipMethod"
                        checked={shippingMethod === 'standard'}
                        onChange={() => setShippingMethod('standard')}
                        className="text-blue-600"
                      />
                      <span>Standard Insured (3-5 Days)</span>
                    </div>
                    <span className="font-bold">{subtotal >= 1500 ? 'FREE' : '$25.00'}</span>
                  </label>

                  <label
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      shippingMethod === 'express' ? 'border-blue-600 bg-blue-50/40' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shipMethod"
                        checked={shippingMethod === 'express'}
                        onChange={() => setShippingMethod('express')}
                        className="text-blue-600"
                      />
                      <span>Express Priority Air (Next Day)</span>
                    </div>
                    <span className="font-bold">$45.00</span>
                  </label>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-${discountTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>${taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shippingMethod === 'express'
                      ? '$45.00'
                      : subtotal >= 1500
                      ? 'FREE'
                      : '$25.00'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Due</span>
                  <span className="text-blue-600">
                    $
                    {(
                      subtotal -
                      discountTotal +
                      taxTotal +
                      (shippingMethod === 'express' ? 45 : subtotal >= 1500 ? 0 : 25)
                    ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Securing Order in Database...</span>
                ) : (
                  <>
                    <span>Place Order &amp; Pay Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Verified Server Stock &bull; Encrypted Transaction</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
