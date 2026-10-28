import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant } from '../types/index.js';
import { api } from '../lib/api.js';

interface AppliedCoupon {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  calculatedDiscount: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  removeFromCart: (productId: string, variantId?: string | null) => void;
  clearCart: () => void;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingFee: number;
  grandTotal: number;
  itemCount: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('nextech_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    const saved = localStorage.getItem('nextech_coupon');
    return saved ? JSON.parse(saved) : null;
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('nextech_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('nextech_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('nextech_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = (product: Product, variant?: ProductVariant, quantity = 1) => {
    const variantId = variant?.id || null;
    const variantName = variant?.name || null;
    const unitPrice = variant?.price || product.sale_price || product.regular_price;
    const unitCost = variant?.cost || product.purchase_cost;
    const maxStock = variant?.stock !== undefined ? variant.stock : product.stock_quantity;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === product.id && i.variantId === variantId
      );

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = Math.min(maxStock, existing.quantity + quantity);
        const updated = [...prev];
        updated[existingIndex] = { ...existing, quantity: newQty };
        return updated;
      } else {
        const newItem: CartItem = {
          productId: product.id,
          name: product.name,
          sku: variant?.sku || product.sku,
          primaryImage: product.primary_image,
          variantId,
          variantName,
          unitPrice,
          unitCost,
          quantity: Math.min(maxStock, quantity),
          maxStock,
          condition: product.condition,
        };
        return [...prev, newItem];
      }
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, variantId: string | null | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId && (item.variantId || null) === (variantId || null)) {
          return { ...item, quantity: Math.min(item.maxStock, quantity) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, variantId?: string | null) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && (item.variantId || null) === (variantId || null))
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  // Computations
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Recalculate coupon discount if subtotal changes
  let discountTotal = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountTotal = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountTotal = appliedCoupon.discountValue;
    }
    discountTotal = Math.min(subtotal, Math.round(discountTotal * 100) / 100);
  }

  // Tax rate (8%)
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxTotal = Math.round(taxableAmount * 0.08 * 100) / 100;

  // Free shipping above $1500, else $25 (free if cart empty)
  const shippingFee = items.length === 0 ? 0 : subtotal >= 1500 ? 0 : 25;
  const grandTotal = Math.round((taxableAmount + taxTotal + shippingFee) * 100) / 100;

  const applyCoupon = async (code: string) => {
    try {
      const res = await api.validateCoupon(code, subtotal);
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          description: res.description,
          discountType: res.discountType,
          discountValue: res.discountValue,
          calculatedDiscount: res.calculatedDiscount,
        });
        return { success: true, message: `Coupon ${res.code} applied successfully!` };
      }
      return { success: false, message: 'Invalid coupon' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Coupon could not be applied' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        discountTotal,
        taxTotal,
        shippingFee,
        grandTotal,
        itemCount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
