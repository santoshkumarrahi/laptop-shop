import React from 'react';
import { Star, ShoppingCart, Heart, Check, Sparkles } from 'lucide-react';
import { Product } from '../../types/index.js';
import { useCart } from '../../context/CartContext.js';
import { useWishlist } from '../../context/WishlistContext.js';

interface ProductCardProps {
  product: Product;
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const inWishlist = isInWishlist(product.id);
  const displayPrice = product.sale_price || product.regular_price;
  const hasDiscount = !!product.sale_price && product.sale_price < product.regular_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.regular_price - product.sale_price!) / product.regular_price) * 100)
    : 0;

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;

  // Extract top 2 key specs for quick badge view
  const specs = product.specifications || {};
  const specHighlights: string[] = [];
  if (specs.processor) specHighlights.push(specs.processor.split('(')[0].trim());
  if (specs.graphics_card) specHighlights.push(specs.graphics_card.split('(')[0].trim());
  if (specs.ram_capacity && specHighlights.length < 2) specHighlights.push(specs.ram_capacity);
  if (specs.output_power && specHighlights.length < 2) specHighlights.push(specs.output_power);
  if (specs.battery_life && specHighlights.length < 2) specHighlights.push(specs.battery_life);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
        {hasDiscount && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white shadow-xs">
            SAVE {discountPercent}%
          </span>
        )}
        {product.condition === 'Refurbished' && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Refurbished
          </span>
        )}
        {product.condition === 'Used' && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-700 text-white">
            Pre-Owned
          </span>
        )}
        {product.is_new_arrival === 1 && !hasDiscount && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-600 text-white">
            NEW
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
          inWishlist
            ? 'bg-rose-50 text-rose-600 shadow-sm'
            : 'bg-white/80 hover:bg-white text-slate-400 hover:text-rose-500 shadow-xs'
        }`}
        aria-label="Toggle Wishlist"
      >
        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
      </button>

      {/* Product Image */}
      <div
        onClick={() => onNavigate('product', { id: product.id, slug: product.slug })}
        className="relative pt-[70%] w-full bg-slate-50 overflow-hidden cursor-pointer"
      >
        <img
          src={product.primary_image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 uppercase font-semibold mb-1">
            <span>{product.brand_name || 'Brand'}</span>
            <span className="text-slate-600">{product.category_name}</span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onNavigate('product', { id: product.id, slug: product.slug })}
            className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer leading-snug"
          >
            {product.name}
          </h3>

          {/* Quick Specs Chips */}
          {specHighlights.length > 0 && (
            <div className="flex flex-wrap gap-1 my-2">
              {specHighlights.map((spec, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium truncate max-w-full"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1.5 my-1.5">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {product.rating_average ? product.rating_average.toFixed(1) : '5.0'}
            </span>
            <span className="text-[11px] text-slate-600">
              ({product.rating_count || 12})
            </span>
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-3 mt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-extrabold text-slate-900">
              ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                ${product.regular_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* Stock state */}
          <div className="flex items-center justify-between mb-3 text-[11px]">
            {isOutOfStock ? (
              <span className="text-rose-600 font-semibold">Temporarily unavailable</span>
            ) : isLowStock ? (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Only {product.stock_quantity} left in stock!
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> In Stock ({product.stock_quantity})
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => addToCart(product, undefined, 1)}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-blue-600 text-white shadow-xs hover:shadow-md'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
