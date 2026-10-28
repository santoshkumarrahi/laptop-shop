import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Plus,
  Edit2,
  Trash2,
  Archive,
  Search,
  Filter,
  Check,
  Download,
  Upload,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Layers,
  Star,
  Copy,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon
} from 'lucide-react';
import { Product, Category, Brand, ProductVariant, ProductSpecifications } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';

interface AdminProductsProps {
  categories: Category[];
  brands: Brand[];
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ categories, brands }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Product Editor Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editorTab, setEditorTab] = useState<'basic' | 'specs' | 'pricing' | 'variants' | 'images'>('basic');

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [condition, setCondition] = useState<'New' | 'Used' | 'Refurbished'>('New');
  const [warranty, setWarranty] = useState('1 Year Standard');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [primaryImage, setPrimaryImage] = useState('');
  const [imagesText, setImagesText] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Laptop Specs State
  const [processor, setProcessor] = useState('');
  const [ramCapacity, setRamCapacity] = useState('');
  const [storage, setStorage] = useState('');
  const [graphicsCard, setGraphicsCard] = useState('');
  const [screenSize, setScreenSize] = useState('');
  const [screenResolution, setScreenResolution] = useState('');
  const [refreshRate, setRefreshRate] = useState('');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [batteryInfo, setBatteryInfo] = useState('');
  const [color, setColor] = useState('');
  const [connectivityPorts, setConnectivityPorts] = useState('');

  // Speaker Specs
  const [speakerType, setSpeakerType] = useState('');
  const [outputPower, setOutputPower] = useState('');
  const [batteryLife, setBatteryLife] = useState('');
  const [waterproofRating, setWaterproofRating] = useState('');

  // Variants list
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Bulk actions
  const [bulkAction, setBulkAction] = useState('');
  const [bulkPercent, setBulkPercent] = useState('10');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        admin: 'true',
        limit: 100,
        search: search || undefined,
        category: selectedCategory || undefined,
        brand: selectedBrand || undefined,
        condition: selectedCondition || undefined,
      });
      setProducts(res.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedBrand, selectedCondition]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setEditorTab('basic');
    setName('');
    setSlug('');
    setSku('LAP-' + Math.floor(10000 + Math.random() * 90000));
    setBarcode('198' + Math.floor(100000000 + Math.random() * 900000000));
    setBrandId(brands[0]?.id || '');
    setCategoryId(categories.find((c) => c.slug === 'laptops')?.id || categories[0]?.id || '');
    setShortDesc('');
    setFullDesc('');
    setRegularPrice(1499.00);
    setSalePrice('');
    setPurchaseCost(1100.00);
    setStockQuantity(12);
    setLowStockThreshold(4);
    setCondition('New');
    setWarranty('1 Year Manufacturer Warranty');
    setIsFeatured(true);
    setIsBestSeller(false);
    setIsNewArrival(true);
    setIsActive(true);
    setPrimaryImage('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80');
    setImagesList([
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=80'
    ]);
    setImagesText('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80\nhttps://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=80');

    // Laptop defaults
    setProcessor('Intel Core i7-14700HX');
    setRamCapacity('32GB DDR5 5600MHz');
    setStorage('1TB NVMe PCIe Gen 4 SSD');
    setGraphicsCard('NVIDIA GeForce RTX 4070 8GB');
    setScreenSize('16.0 inch');
    setScreenResolution('2560 x 1600 (QHD+)');
    setRefreshRate('240Hz');
    setOperatingSystem('Windows 11 Pro');
    setBatteryInfo('90Whr Li-ion');
    setColor('Eclipse Black');
    setConnectivityPorts('2x Thunderbolt 4, 2x USB-A 3.2, 1x HDMI 2.1, 1x 3.5mm combo');

    // Speaker defaults
    setSpeakerType('');
    setOutputPower('');
    setBatteryLife('');
    setWaterproofRating('');

    setVariants([
      { id: 'v1', name: '16GB RAM / 512GB SSD', sku: 'LAP-VAR-01', price: 1399, cost: 1050, stock: 5 },
      { id: 'v2', name: '32GB RAM / 1TB SSD', sku: 'LAP-VAR-02', price: 1599, cost: 1150, stock: 7 },
    ]);

    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditorTab('basic');
    setName(p.name);
    setSlug(p.slug);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setBrandId(p.brand_id || '');
    setCategoryId(p.category_id);
    setShortDesc(p.short_description || '');
    setFullDesc(p.full_description || '');
    setRegularPrice(p.regular_price);
    setSalePrice(p.sale_price !== null && p.sale_price !== undefined ? p.sale_price : '');
    setPurchaseCost(p.purchase_cost);
    setStockQuantity(p.stock_quantity);
    setLowStockThreshold(p.low_stock_threshold);
    setCondition(p.condition);
    setWarranty(p.warranty_period || '');
    setIsFeatured(p.is_featured === 1);
    setIsBestSeller(p.is_best_seller === 1);
    setIsNewArrival(p.is_new_arrival === 1);
    setIsActive(p.is_active === 1);
    const prodImgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.primary_image ? [p.primary_image] : []);
    setPrimaryImage(p.primary_image || prodImgs[0] || '');
    setImagesList(prodImgs);
    setImagesText(prodImgs.join('\n'));

    const s = p.specifications || {};
    setProcessor(s.processor || '');
    setRamCapacity(s.ram_capacity || '');
    setStorage(s.storage || '');
    setGraphicsCard(s.graphics_card || '');
    setScreenSize(s.screen_size || '');
    setScreenResolution(s.screen_resolution || '');
    setRefreshRate(s.refresh_rate || '');
    setOperatingSystem(s.operating_system || '');
    setBatteryInfo(s.battery_info || '');
    setColor(s.color || '');
    setConnectivityPorts(s.connectivity_ports || '');

    setSpeakerType(s.speaker_type || '');
    setOutputPower(s.output_power || '');
    setBatteryLife(s.battery_life || '');
    setWaterproofRating(s.waterproof_rating || '');

    setVariants(p.variants || []);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorMsg('');

    try {
      const uploadPromises = Array.from(files).map((file) => {
        return new Promise<string>((resolve, reject) => {
          if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            reject(new Error(`File ${file.name} is not a supported format (JPG, PNG, WebP).`));
            return;
          }
          if (file.size > 10 * 1024 * 1024) {
            reject(new Error(`File ${file.name} exceeds 10MB limit.`));
            return;
          }
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const res = await api.uploadImage({
                data: reader.result as string,
                filename: file.name,
              });
              resolve(res.url);
            } catch (err) {
              reject(err);
            }
          };
          reader.readAsDataURL(file);
        });
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImagesList((prev) => {
        const next = [...prev, ...uploadedUrls];
        if (!primaryImage && next[0]) {
          setPrimaryImage(next[0]);
        }
        return next;
      });
      setImagesText((prev) => (prev ? prev + '\n' + uploadedUrls.join('\n') : uploadedUrls.join('\n')));
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMakePrimary = (url: string) => {
    setPrimaryImage(url);
    setImagesList((prev) => [url, ...prev.filter((u) => u !== url)]);
  };

  const handleRemoveImage = (index: number) => {
    const targetUrl = imagesList[index];
    const next = imagesList.filter((_, i) => i !== index);
    setImagesList(next);
    setImagesText(next.join('\n'));
    if (primaryImage === targetUrl) {
      setPrimaryImage(next[0] || '');
    }
  };

  const handleMoveImage = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= imagesList.length) return;
    const next = [...imagesList];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setImagesList(next);
    setImagesText(next.join('\n'));
  };

  const handleAddDirectUrl = () => {
    if (!newImageUrl.trim()) return;
    const next = [...imagesList, newImageUrl.trim()];
    setImagesList(next);
    setImagesText(next.join('\n'));
    if (!primaryImage) setPrimaryImage(newImageUrl.trim());
    setNewImageUrl('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !regularPrice || !purchaseCost || !categoryId) {
      setErrorMsg('Product name, category, regular price, and purchase cost are required.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const imgArray = imagesList.length > 0
      ? imagesList
      : imagesText
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

    const specs: ProductSpecifications = {};
    if (processor) specs.processor = processor;
    if (ramCapacity) specs.ram_capacity = ramCapacity;
    if (storage) specs.storage = storage;
    if (graphicsCard) specs.graphics_card = graphicsCard;
    if (screenSize) specs.screen_size = screenSize;
    if (screenResolution) specs.screen_resolution = screenResolution;
    if (refreshRate) specs.refresh_rate = refreshRate;
    if (operatingSystem) specs.operating_system = operatingSystem;
    if (batteryInfo) specs.battery_info = batteryInfo;
    if (color) specs.color = color;
    if (connectivityPorts) specs.connectivity_ports = connectivityPorts;

    if (speakerType) specs.speaker_type = speakerType;
    if (outputPower) specs.output_power = outputPower;
    if (batteryLife) specs.battery_life = batteryLife;
    if (waterproofRating) specs.waterproof_rating = waterproofRating;

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || null,
      brand_id: brandId || null,
      category_id: categoryId,
      short_description: shortDesc.trim() || null,
      full_description: fullDesc.trim() || null,
      regular_price: Number(regularPrice),
      sale_price: salePrice !== '' ? Number(salePrice) : null,
      purchase_cost: Number(purchaseCost),
      stock_quantity: Number(stockQuantity),
      low_stock_threshold: Number(lowStockThreshold),
      condition,
      warranty_period: warranty.trim() || null,
      is_featured: isFeatured ? 1 : 0,
      is_best_seller: isBestSeller ? 1 : 0,
      is_new_arrival: isNewArrival ? 1 : 0,
      is_active: isActive ? 1 : 0,
      primary_image: primaryImage.trim() || (imgArray[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80'),
      images: imgArray.length > 0 ? imgArray : [primaryImage],
      specifications: specs,
      variants,
      adminName: user?.name || 'Alexander Vance',
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setShowModal(false);
      await fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, permanent: boolean) => {
    if (!window.confirm(permanent ? 'Permanently delete this product? (If it exists in past orders, it will be safely archived instead)' : 'Archive this product? It will no longer show in the storefront.')) {
      return;
    }

    try {
      await api.deleteProduct(id, permanent, user?.name || 'Admin');
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0 || !bulkAction) return;

    try {
      await api.bulkProductsAction(selectedIds, bulkAction, bulkPercent, user?.name || 'Admin');
      setSelectedIds([]);
      setBulkAction('');
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Bulk action failed');
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Product Catalog Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full control over laptop hardware specs, audio acoustics, pricing, variants, and stock.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <a
            href="/api/products/export/csv"
            download="nextech-products.csv"
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Bulk Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search product, SKU, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="">All Conditions</option>
            <option value="New">New</option>
            <option value="Refurbished">Refurbished</option>
            <option value="Used">Used</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-200">
            <span className="text-xs font-bold text-blue-900">
              {selectedIds.length} product(s) selected
            </span>
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
              >
                <option value="">Select Bulk Action...</option>
                <option value="activate">Activate / Publish Selected</option>
                <option value="deactivate">Deactivate / Hide Selected</option>
                <option value="archive">Archive Selected</option>
                <option value="adjust_price_percent">Adjust Price by % (+/-)</option>
              </select>

              {bulkAction === 'adjust_price_percent' && (
                <input
                  type="number"
                  value={bulkPercent}
                  onChange={(e) => setBulkPercent(e.target.value)}
                  placeholder="%"
                  className="w-16 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-center"
                />
              )}

              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === products.length && products.length > 0}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Cost (Profit)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isChecked = selectedIds.includes(p.id);
                  const isLow = p.stock_quantity <= p.low_stock_threshold;
                  const unitPrice = p.sale_price || p.regular_price;
                  const unitProfit = unitPrice - p.purchase_cost;

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-blue-50/30' : ''}`}>
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.primary_image}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 truncate max-w-xs">{p.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              SKU: {p.sku} &bull; {p.condition}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">{p.category_name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.brand_name || 'Generic'}</td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            p.stock_quantity <= 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {p.stock_quantity <= 0 ? 'Out of Stock' : `${p.stock_quantity} in stock`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">
                          ${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {p.sale_price && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ${p.regular_price.toLocaleString()}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-600">${p.purchase_cost.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          +${unitProfit.toFixed(0)} margin
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.is_active === 1
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.is_active === 1 ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, false)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Archive Product"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, true)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUCT EDITOR MODAL (TABBED) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Product Editor</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Electronics Product'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
              {[
                { id: 'basic', label: '1. Basic Info & Categories' },
                { id: 'specs', label: '2. Tech & Laptop Specs' },
                { id: 'pricing', label: '3. Pricing & Stock' },
                { id: 'variants', label: '4. Hardware Variants' },
                { id: 'images', label: '5. Gallery Images' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditorTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    editorTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* TAB 1: BASIC INFO */}
              {editorTab === 'basic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!editingProduct) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Barcode / UPC</label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Main Category *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Brand Manufacturer</label>
                    <select
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="">No Brand Selected</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Condition Grade</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="New">New</option>
                      <option value="Refurbished">Refurbished</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Warranty Period</label>
                    <input
                      type="text"
                      value={warranty}
                      onChange={(e) => setWarranty(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
                    <input
                      type="text"
                      value={shortDesc}
                      onChange={(e) => setShortDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Description Overview</label>
                    <textarea
                      rows={4}
                      value={fullDesc}
                      onChange={(e) => setFullDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: LAPTOP & ELECTRONICS SPECIFICATIONS */}
              {editorTab === 'specs' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-200 text-xs text-blue-900">
                    Laptop and electronics hardware specifications appear automatically in the comparison table on the product page.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CPU / Processor</label>
                      <input
                        type="text"
                        value={processor}
                        onChange={(e) => setProcessor(e.target.value)}
                        placeholder="e.g. Intel Core i9-14900HX"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">GPU / Graphics Card</label>
                      <input
                        type="text"
                        value={graphicsCard}
                        onChange={(e) => setGraphicsCard(e.target.value)}
                        placeholder="e.g. NVIDIA GeForce RTX 4090 16GB"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">RAM Capacity &amp; Type</label>
                      <input
                        type="text"
                        value={ramCapacity}
                        onChange={(e) => setRamCapacity(e.target.value)}
                        placeholder="e.g. 64GB DDR5 5600MHz"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Storage SSD</label>
                      <input
                        type="text"
                        value={storage}
                        onChange={(e) => setStorage(e.target.value)}
                        placeholder="e.g. 2TB NVMe PCIe 4.0 SSD"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Display Size &amp; Panel</label>
                      <input
                        type="text"
                        value={screenSize}
                        onChange={(e) => setScreenSize(e.target.value)}
                        placeholder='e.g. 16.0" Nebula Mini LED'
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Resolution &amp; Refresh Rate</label>
                      <input
                        type="text"
                        value={screenResolution}
                        onChange={(e) => setScreenResolution(e.target.value)}
                        placeholder="e.g. 2560 x 1600 (240Hz)"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Operating System</label>
                      <input
                        type="text"
                        value={operatingSystem}
                        onChange={(e) => setOperatingSystem(e.target.value)}
                        placeholder="e.g. Windows 11 Pro / macOS Sonoma"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Battery &amp; Charger</label>
                      <input
                        type="text"
                        value={batteryInfo}
                        onChange={(e) => setBatteryInfo(e.target.value)}
                        placeholder="e.g. 99.9Whr with 330W GaN Adapter"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Connectivity &amp; Ports</label>
                      <input
                        type="text"
                        value={connectivityPorts}
                        onChange={(e) => setConnectivityPorts(e.target.value)}
                        placeholder="e.g. Thunderbolt 4, HDMI 2.1, 2.5G LAN, SDXC"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>

                    {/* Speaker Fields */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Speaker Acoustic Power</label>
                      <input
                        type="text"
                        value={outputPower}
                        onChange={(e) => setOutputPower(e.target.value)}
                        placeholder="e.g. 100W RMS"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Waterproof Rating</label>
                      <input
                        type="text"
                        value={waterproofRating}
                        onChange={(e) => setWaterproofRating(e.target.value)}
                        placeholder="e.g. IP67 Dust and Water Resistant"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING & STOCK */}
              {editorTab === 'pricing' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Regular Retail Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sale Discount Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Leave blank for regular price"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Purchase Cost ($) * <span className="text-slate-400 font-normal">(Used for Gross Profit)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={purchaseCost}
                      onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Low-Stock Alert Threshold</label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 5)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  {/* Badges / Visibility */}
                  <div className="sm:col-span-2 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Published / Visible on Storefront</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Featured Pick</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBestSeller}
                        onChange={(e) => setIsBestSeller(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Best Seller Badge</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isNewArrival}
                        onChange={(e) => setIsNewArrival(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>New Arrival Badge</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 4: VARIANTS */}
              {editorTab === 'variants' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Hardware Configurations / Options</h4>
                      <p className="text-[11px] text-slate-500">Configure different RAM/SSD capacities with distinct pricing and stock.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setVariants((prev) => [
                          ...prev,
                          {
                            id: 'v_' + Date.now(),
                            name: 'Config Option',
                            sku: `${sku}-V${prev.length + 1}`,
                            price: regularPrice,
                            cost: purchaseCost,
                            stock: 5,
                          },
                        ])
                      }
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {variants.map((v, idx) => (
                      <div key={v.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].name = e.target.value;
                            setVariants(updated);
                          }}
                          placeholder="Option Name (e.g. 32GB RAM / 1TB SSD)"
                          className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                        <input
                          type="number"
                          value={v.price || 0}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].price = parseFloat(e.target.value) || 0;
                            setVariants(updated);
                          }}
                          placeholder="Price ($)"
                          className="w-24 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-center font-bold"
                        />
                        <input
                          type="number"
                          value={v.stock || 0}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].stock = parseInt(e.target.value, 10) || 0;
                            setVariants(updated);
                          }}
                          placeholder="Stock"
                          className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: IMAGES */}
              {editorTab === 'images' && (
                <div className="space-y-6">
                  {/* Upload from Computer */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-blue-900">Upload Product Images</h4>
                        <p className="text-[11px] text-blue-700">
                          Upload high-resolution photos (JPG, PNG, WebP up to 10MB). You can select multiple files at once.
                        </p>
                      </div>
                      <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? 'Uploading...' : 'Choose Files'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={handleProductImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Add by URL */}
                    <div className="pt-2 border-t border-blue-100 flex items-center gap-2">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Or enter direct image URL (https://...)"
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-xl outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddDirectUrl}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                      >
                        + Add URL
                      </button>
                    </div>
                  </div>

                  {/* Visual Gallery List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">
                        Product Gallery ({imagesList.length} images)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Reorder or click the star to set primary display image
                      </span>
                    </div>

                    {imagesList.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                        No images uploaded yet. Use the upload button above to add product photos.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {imagesList.map((imgUrl, idx) => {
                          const isPrimary = primaryImage === imgUrl;
                          return (
                            <div
                              key={idx}
                              className={`relative rounded-2xl border p-2 bg-white flex flex-col justify-between transition-all ${
                                isPrimary
                                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-2">
                                <img
                                  src={imgUrl}
                                  alt={`Product image ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {isPrimary && (
                                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    <span>Primary Cover</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, -1)}
                                    disabled={idx === 0}
                                    title="Move Left/Up"
                                    className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, 1)}
                                    disabled={idx === imagesList.length - 1}
                                    title="Move Right/Down"
                                    className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  {!isPrimary && (
                                    <button
                                      type="button"
                                      onClick={() => handleMakePrimary(imgUrl)}
                                      className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-bold cursor-pointer"
                                    >
                                      Set Primary
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(idx)}
                                    className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                    title="Remove Image"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Writing to Database...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
