import React, { useState, useEffect } from 'react';
import {
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  Search,
  Sparkles,
  Laptop,
  Check,
  RotateCcw
} from 'lucide-react';
import { Product, Category, Brand } from '../../types/index.js';
import { ProductCard } from './ProductCard.js';
import { CategoryIcon } from '../common/CategoryIcon.js';
import { api } from '../../lib/api.js';

interface ShopPageProps {
  categories: Category[];
  brands: Brand[];
  initialCategory?: string;
  initialCondition?: string;
  initialSearch?: string;
  initialFeatured?: string;
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  categories,
  brands,
  initialCategory,
  initialCondition,
  initialSearch,
  initialFeatured,
  onNavigate
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>(initialCondition || '');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch || '');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync with prop changes (e.g. from navbar clicks)
  useEffect(() => {
    if (initialCategory !== undefined) setSelectedCategory(initialCategory);
    if (initialCondition !== undefined) setSelectedCondition(initialCondition);
    if (initialSearch !== undefined) setSearchQuery(initialSearch);
    setCurrentPage(1);
  }, [initialCategory, initialCondition, initialSearch]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: 12,
        sort: sortBy,
      };

      if (selectedCategory) params.category = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;
      if (selectedCondition) params.condition = selectedCondition;
      if (inStockOnly) params.inStock = 'true';
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (searchQuery) params.search = searchQuery;
      if (initialFeatured === 'true') params.featured = 'true';

      const res = await api.getProducts(params);
      setProducts(res.products);
      setTotalProducts(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [
    selectedCategory,
    selectedBrand,
    selectedCondition,
    inStockOnly,
    minPrice,
    maxPrice,
    searchQuery,
    sortBy,
    currentPage,
    initialFeatured
  ]);

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedCondition('');
    setInStockOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSearchQuery('');
    setSortBy('featured');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    !!selectedCategory ||
    !!selectedBrand ||
    !!selectedCondition ||
    inStockOnly ||
    !!minPrice ||
    !!maxPrice ||
    !!searchQuery;

  // Active category details
  const currentCategoryObj = categories.find(
    (c) => c.slug === selectedCategory || c.id === selectedCategory
  );

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <button onClick={() => onNavigate('home')} className="hover:text-blue-600 cursor-pointer">
              Home
            </button>
            <span>/</span>
            <button onClick={resetFilters} className="hover:text-blue-600 cursor-pointer">
              Catalog
            </button>
            {currentCategoryObj && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-semibold">{currentCategoryObj.name}</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                {currentCategoryObj ? (
                  <>
                    <CategoryIcon iconName={currentCategoryObj.icon} className="w-7 h-7 text-blue-600" />
                    <span>{currentCategoryObj.name}</span>
                  </>
                ) : (
                  <span>All Laptops &amp; Electronics</span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {currentCategoryObj?.description ||
                  `Browse ${totalProducts} high-performance laptops, pro audio, monitors, and precision electronics.`}
              </p>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters {hasActiveFilters && '(Active)'}</span>
              </button>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                >
                  <option value="featured">Featured Picks</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="bestseller">Best Sellers</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Applied Filters:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  Category: {currentCategoryObj?.name || selectedCategory}
                  <button onClick={() => setSelectedCategory('')} className="hover:text-blue-900 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {selectedBrand && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                  Brand: {brands.find((b) => b.slug === selectedBrand || b.id === selectedBrand)?.name || selectedBrand}
                  <button onClick={() => setSelectedBrand('')} className="hover:text-slate-900 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {selectedCondition && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  Condition: {selectedCondition}
                  <button onClick={() => setSelectedCondition('')} className="hover:text-amber-900 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  In Stock Only
                  <button onClick={() => setInStockOnly(false)} className="hover:text-emerald-900 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                  Price: ${minPrice || '0'} - ${maxPrice || '∞'}
                  <button
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                    }}
                    className="hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-purple-900 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer ml-2 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset all
              </button>
            </div>
          )}
        </div>

        {/* Layout Grid: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* DESKTOP SIDEBAR FILTERS */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span>Filter Products</span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Dynamic Categories Tree */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Store Categories
                </h4>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                      !selectedCategory ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Categories</span>
                    <span className="text-[11px] text-slate-600 font-normal">{totalProducts}</span>
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCategory(c.slug);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                        selectedCategory === c.slug || selectedCategory === c.id
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CategoryIcon iconName={c.icon} className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{c.name}</span>
                      </div>
                      {c.product_count !== undefined && (
                        <span className="text-[10px] text-slate-600 font-normal shrink-0">
                          {c.product_count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands Filter */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Manufacturer Brand
                </h4>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <button
                    onClick={() => {
                      setSelectedBrand('');
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      !selectedBrand ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Brands
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBrand(b.slug);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                        selectedBrand === b.slug || selectedBrand === b.id
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{b.name}</span>
                      {b.product_count !== undefined && (
                        <span className="text-[10px] text-slate-600">{b.product_count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Condition Filter */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Condition &amp; Grade
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {['', 'New', 'Refurbished', 'Used'].map((cond) => (
                    <label
                      key={cond}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                    >
                      <input
                        type="radio"
                        name="condition"
                        checked={selectedCondition === cond}
                        onChange={() => {
                          setSelectedCondition(cond);
                          setCurrentPage(1);
                        }}
                        className="text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span>{cond === '' ? 'Any Condition' : cond}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Price Range ($)
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* In Stock Only Toggle */}
              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Exclude Out of Stock</span>
                </label>
              </div>
            </div>
          </aside>

          {/* MAIN PRODUCTS GRID */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Laptop className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No matching electronics found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                  We could not find any products matching your current search or filter criteria. Try expanding your price range or clearing filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      &larr; Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE FILTER MODAL */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Category</h4>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-lg"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Brand</h4>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-lg"
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
