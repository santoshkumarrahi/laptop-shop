import React, { useState, useEffect } from 'react';
import {
  Star,
  ShoppingCart,
  Heart,
  Shield,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Share2,
  Check,
  AlertCircle,
  Laptop,
  Cpu,
  Layers,
  Monitor,
  Zap,
  MessageSquare
} from 'lucide-react';
import { Product, ProductVariant, Review } from '../../types/index.js';
import { useCart } from '../../context/CartContext.js';
import { useWishlist } from '../../context/WishlistContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate
}) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'reviews'>('specs');

  // Review form state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await api.getProduct(productId);
        setProduct(data.product);
        setRelatedProducts(data.related as any);
        setReviews(data.reviews);
        setSelectedImage(data.product.primary_image);

        if (data.product.variants && data.product.variants.length > 0) {
          setSelectedVariant(data.product.variants[0]);
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="bg-slate-200 h-96 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-24 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">The requested product could not be found or has been archived.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Store Catalog
        </button>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price || product.sale_price || product.regular_price;
  const originalPrice = product.regular_price;
  const hasDiscount = currentPrice < originalPrice;
  const currentStock = selectedVariant?.stock !== undefined ? selectedVariant.stock : product.stock_quantity;
  const isOutOfStock = currentStock <= 0;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedVariant, quantity);
    onNavigate('checkout');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      await api.createReview({
        productId: product.id,
        userId: user?.id,
        userName: user?.name || 'Verified Customer',
        rating: newRating,
        title: newTitle || undefined,
        comment: newComment.trim(),
      });

      // Reload product data to get updated review counts and averages
      const data = await api.getProduct(product.id);
      setProduct(data.product);
      setReviews(data.reviews);
      setShowReviewModal(false);
      setNewComment('');
      setNewTitle('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const specs = product.specifications || {};

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <button onClick={() => onNavigate('home')} className="hover:text-blue-600 cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => onNavigate('shop', { category: product.category_slug })}
            className="hover:text-blue-600 cursor-pointer"
          >
            {product.category_name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
        </div>

        {/* Top Product Section: Image Gallery & Buy Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Gallery Column (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails list */}
            {product.images && product.images.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-20 shrink-0">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      selectedImage === img ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt={`${product.name} - ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Display */}
            <div className="flex-1 relative aspect-square sm:aspect-4/3 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex items-center justify-center group">
              <img
                src={selectedImage || product.primary_image}
                alt={product.name}
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              />

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                {hasDiscount && (
                  <span className="px-3 py-1 rounded-md text-xs font-black bg-rose-600 text-white shadow-md">
                    SAVE ${(originalPrice - currentPrice).toFixed(0)}
                  </span>
                )}
                {product.condition === 'Refurbished' && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-white shadow-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Certified Refurbished
                  </span>
                )}
              </div>

              {/* Action buttons on image */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md backdrop-blur-xs transition-colors cursor-pointer"
                  title="Share product link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-2.5 rounded-full shadow-md backdrop-blur-xs transition-all cursor-pointer ${
                    inWishlist ? 'bg-rose-50 text-rose-600' : 'bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600'
                  }`}
                  title="Save to wishlist"
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Buy Box & Specs Summary Column (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Brand and SKU */}
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
                <span className="font-bold text-blue-600 uppercase tracking-wider">{product.brand_name || 'Brand'}</span>
                <span>SKU: {selectedVariant?.sku || product.sku}</span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {product.name}
              </h1>

              {/* Rating & Reviews counter */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating_average || 5) ? 'fill-current' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {product.rating_average ? product.rating_average.toFixed(1) : '5.0'}
                </span>
                <span className="text-xs text-slate-600">
                  ({product.rating_count || reviews.length} verified reviews)
                </span>
              </div>

              {/* Price Display */}
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-slate-400 line-through">
                        ${originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Taxes calculated at checkout. Eligible for Free Shipping.
                  </div>
                </div>

                <div className="text-right">
                  {isOutOfStock ? (
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                      Out of Stock
                    </span>
                  ) : currentStock <= 5 ? (
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                      Only {currentStock} left!
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      In Stock ({currentStock})
                    </span>
                  )}
                </div>
              </div>

              {/* Variants Selector (if any) */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Hardware Configuration:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedVariant?.id === v.id
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">{v.name}</div>
                        <div className="text-xs text-blue-600 font-semibold mt-0.5">
                          ${(v.price || product.regular_price).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector & CTAs */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-xs font-bold text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      disabled={quantity >= currentStock || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                      className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Shopping Cart</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isOutOfStock
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                  }`}
                >
                  Buy Now with 1-Click Checkout &rarr;
                </button>
              </div>
            </div>

            {/* Perks bullet bar */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Fast Insured Courier</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{product.warranty_period || '1-Year Official Warranty'}</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                <span>30-Day Money-Back Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Genuine Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specifications, Detailed Description & Customer Reviews Tabs */}
        <div className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          {/* Tab buttons */}
          <div className="flex items-center gap-6 border-b border-slate-200 pb-4">
            <button
              onClick={() => setActiveTab('specs')}
              className={`text-sm font-bold pb-2 transition-all cursor-pointer relative ${
                activeTab === 'specs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Hardware Specifications
            </button>
            <button
              onClick={() => setActiveTab('desc')}
              className={`text-sm font-bold pb-2 transition-all cursor-pointer relative ${
                activeTab === 'desc'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Overview &amp; Features
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`text-sm font-bold pb-2 transition-all cursor-pointer relative flex items-center gap-2 ${
                activeTab === 'reviews'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Customer Reviews</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                {reviews.length}
              </span>
            </button>
          </div>

          {/* TAB 1: Hardware Specifications */}
          {activeTab === 'specs' && (
            <div className="py-6">
              <h3 className="text-base font-extrabold text-slate-900 mb-4">
                Detailed Technical Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {/* Condition & Warranty */}
                <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                  <span className="font-semibold text-slate-500">Condition Grade</span>
                  <span className="font-bold text-slate-900">{product.condition}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                  <span className="font-semibold text-slate-500">Warranty Coverage</span>
                  <span className="font-bold text-slate-900">{product.warranty_period || 'Standard 1 Year'}</span>
                </div>

                {/* Dynamic Specs entries */}
                {Object.entries(specs).map(([key, val]) => {
                  const label = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase());
                  return (
                    <div key={key} className="flex justify-between py-2 border-b border-slate-100 text-xs">
                      <span className="font-semibold text-slate-500">{label}</span>
                      <span className="font-medium text-slate-900 text-right max-w-xs">{String(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Description */}
          {activeTab === 'desc' && (
            <div className="py-6 prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
              <p className="font-medium text-slate-800 text-sm leading-relaxed">
                {product.short_description}
              </p>
              <p>{product.full_description}</p>
            </div>
          )}

          {/* TAB 3: Reviews */}
          {activeTab === 'reviews' && (
            <div className="py-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-slate-900">
                      {product.rating_average ? product.rating_average.toFixed(1) : '5.0'}
                    </span>
                    <div>
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">Based on {reviews.length} reviews</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Write a Customer Review</span>
                </button>
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No customer reviews yet. Be the first to share your experience!
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-slate-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{rev.user_name}</span>
                          {rev.is_verified_purchase === 1 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-amber-400 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                      {rev.title && (
                        <h4 className="text-xs font-bold text-slate-900 mb-1">{rev.title}</h4>
                      )}
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Similar / Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-extrabold text-slate-900 mb-6">
              Similar Products in {product.category_name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onNavigate('product', { id: rel.id, slug: rel.slug })}
                  className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square rounded-xl bg-slate-50 overflow-hidden mb-3">
                      <img
                        src={rel.primary_image}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{rel.name}</h4>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-extrabold text-slate-900">
                      ${(rel.sale_price || rel.regular_price).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-blue-600 font-bold group-hover:underline">
                      View specs &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Write a Review</h3>
            <p className="text-xs text-slate-500 mb-4">Share your feedback on {product.name}</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating ? 'text-amber-400 fill-current' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Unbelievable performance and battery life"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Review</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your real-world experience with this product..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
