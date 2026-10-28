import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Save,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Laptop,
  Layers,
  Star,
  Eye,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { HeroSlide, Category, Product, StoreSettings } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';

interface AdminHomepageProps {
  categories: Category[];
  onRefreshSettings: () => void;
  onRefreshCategories: () => void;
}

// Curated high-resolution studio and modern workspace laptop photographs
const LAPTOP_PRESET_IMAGES = [
  {
    name: 'MacBook Pro Aluminum Studio Setup',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=85',
  },
  {
    name: 'Minimal Dark Desk & Keyboard Lighting',
    url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1600&q=85',
  },
  {
    name: 'Clean Creator Workstation with Ultra-wide Display',
    url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1600&q=85',
  },
  {
    name: 'Cyberpunk RGB Gaming Battle Station',
    url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1600&q=85',
  },
  {
    name: 'Modern Executive Thin Laptop Open on Wood Desk',
    url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1600&q=85',
  },
  {
    name: 'Audiophile Sound Stage with Studio Monitors',
    url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1600&q=85',
  }
];

export const AdminHomepage: React.FC<AdminHomepageProps> = ({
  categories,
  onRefreshSettings,
  onRefreshCategories,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'hero' | 'categories' | 'products' | 'banner'>('hero');
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Products for feature picker
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch settings & products
  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, prodData] = await Promise.all([
        api.getSettings(),
        api.getProducts({ limit: 50 }),
      ]);
      setSettings(settingsData);
      setSlides(
        settingsData.hero_slides && settingsData.hero_slides.length > 0
          ? settingsData.hero_slides
          : [
              {
                id: 'slide_1',
                tag: 'FLAGSHIP COMPUTING 2026',
                title: 'Unleash Next-Gen Laptop Performance',
                subtitle:
                  'From ultra-powerful M3 Max workstations to RTX 4090 gaming rigs with 240Hz Nebula HDR displays.',
                image:
                  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=85',
                buttonText: 'Shop Flagship Laptops',
                buttonLink: 'laptops',
              },
            ]
      );
      setProducts(prodData.products);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load homepage configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentSlide = slides[activeSlideIndex] || slides[0];

  const updateCurrentSlide = (fields: Partial<HeroSlide>) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (updated[activeSlideIndex]) {
        updated[activeSlideIndex] = { ...updated[activeSlideIndex], ...fields };
      }
      return updated;
    });
  };

  // Handle genuine file upload for hero background
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setErrorMsg('Only JPG, PNG, and WebP images are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 10MB maximum limit.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const uploadRes = await api.uploadImage({
            data: base64,
            filename: file.name,
          });

          if (uploadRes.success && uploadRes.url) {
            updateCurrentSlide({ image: uploadRes.url });
            setSuccessMsg('Hero background image uploaded successfully! Click "Save Homepage Changes" below to apply.');
            setTimeout(() => setSuccessMsg(''), 4000);
          } else {
            setErrorMsg('Failed to upload image. Please try again.');
          }
        } catch (uploadErr: any) {
          setErrorMsg(uploadErr.message || 'Image upload failed');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to read image file');
      setUploading(false);
    }
  };

  // Save hero slides to database
  const handleSaveHeroSlides = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.updateSettings({
        hero_slides: slides,
        adminName: user?.name || 'Alexander Vance',
      });

      setSuccessMsg('Hero section changes saved! The storefront hero now reflects your updated laptop background and text.');
      setTimeout(() => setSuccessMsg(''), 5000);
      onRefreshSettings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save hero section.');
    } finally {
      setSaving(false);
    }
  };

  // Add a new hero slide
  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: 'slide_' + Date.now(),
      tag: 'NEW COLLECTION 2026',
      title: 'Experience Precision Engineering',
      subtitle: 'Engineered for performance creators and power users.',
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1600&q=85',
      buttonText: 'Shop Now',
      buttonLink: 'laptops',
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  // Remove slide
  const handleRemoveSlide = (idx: number) => {
    if (slides.length <= 1) {
      setErrorMsg('At least one hero slide is required.');
      return;
    }
    const updated = slides.filter((_, i) => i !== idx);
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, idx - 1));
  };

  // Toggle category featured
  const handleToggleCategoryFeatured = async (cat: Category) => {
    try {
      await api.updateCategory(cat.id, {
        is_featured: cat.is_featured === 1 ? 0 : 1,
        adminName: user?.name || 'Alexander Vance',
      });
      onRefreshCategories();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update category.');
    }
  };

  // Toggle product badge
  const handleToggleProductBadge = async (
    p: Product,
    badge: 'is_featured' | 'is_best_seller' | 'is_new_arrival'
  ) => {
    try {
      const newVal = p[badge] === 1 ? 0 : 1;
      await api.updateProduct(p.id, {
        [badge]: newVal,
        adminName: user?.name || 'Alexander Vance',
      });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, [badge]: newVal } : item))
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update product badge.');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading Homepage Manager...</div>;
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand_name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Storefront Content &amp; Media Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Homepage &amp; Hero Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize the laptop hero banner, high-res background photography, headlines, featured categories, and product showcases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold overflow-x-auto">
        {[
          { id: 'hero', label: '1. Hero Section & Laptop Background', icon: Laptop },
          { id: 'categories', label: '2. Featured Categories on Homepage', icon: Layers },
          { id: 'products', label: '3. Featured Products Showcase', icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HERO SECTION & BACKGROUND */}
      {activeTab === 'hero' && (
        <div className="space-y-8">
          {/* Slide selector bar */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 mr-1">Hero Slides:</span>
              {slides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSlideIndex === idx
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Slide #{idx + 1}
                </button>
              ))}
              <button
                onClick={handleAddSlide}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slide</span>
              </button>
            </div>

            {slides.length > 1 && (
              <button
                onClick={() => handleRemoveSlide(activeSlideIndex)}
                className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer px-2 py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Slide</span>
              </button>
            )}
          </div>

          {/* TWO COLUMN: EDIT FORM + LIVE INTERACTIVE PREVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: EDIT CONTROLS */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Edit Slide Content (Slide #{activeSlideIndex + 1})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update text copy, CTA links, and replace the laptop background photography.
                </p>
              </div>

              {/* Tag / Badge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tagline / Small Badge
                </label>
                <input
                  type="text"
                  value={currentSlide.tag || ''}
                  onChange={(e) => updateCurrentSlide({ tag: e.target.value })}
                  placeholder="e.g. FLAGSHIP COMPUTING 2026"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hero Headline / Title
                </label>
                <textarea
                  rows={2}
                  value={currentSlide.title || ''}
                  onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                  placeholder="e.g. Unleash Next-Gen Laptop Performance"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtitle Description
                </label>
                <textarea
                  rows={3}
                  value={currentSlide.subtitle || ''}
                  onChange={(e) => updateCurrentSlide({ subtitle: e.target.value })}
                  placeholder="e.g. From ultra-powerful M3 Max workstations to RTX 4090 gaming rigs..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={currentSlide.buttonText || ''}
                    onChange={(e) => updateCurrentSlide({ buttonText: e.target.value })}
                    placeholder="e.g. Shop Flagship Laptops"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Destination Category / Link
                  </label>
                  <select
                    value={currentSlide.buttonLink || 'laptops'}
                    onChange={(e) => updateCurrentSlide({ buttonLink: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white font-medium"
                  >
                    <option value="">All Products</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LAPTOP HERO IMAGE UPLOAD SECTION */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-900">
                  Hero Laptop Background Photograph
                </label>
                <p className="text-[11px] text-slate-500">
                  Upload a high-resolution studio photo or modern desk setup. Supports JPG, PNG, and WebP up to 10MB.
                </p>

                {/* Upload Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-bold cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{uploading ? 'Uploading to Server...' : 'Upload Laptop Photo (File Picker)'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Or enter direct URL */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Or Image URL / Stored Path:
                  </label>
                  <input
                    type="url"
                    value={currentSlide.image || ''}
                    onChange={(e) => updateCurrentSlide({ image: e.target.value })}
                    placeholder="https://... or /uploads/..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>

                {/* Quick Presets Picker */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Or select from curated laptop studio presets:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {LAPTOP_PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => updateCurrentSlide({ image: preset.url })}
                        className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left h-16 ${
                          currentSlide.image === preset.url
                            ? 'border-blue-600 ring-2 ring-blue-500/30'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 p-1 flex items-end">
                          <span className="text-[9px] font-bold text-white line-clamp-1">
                            {preset.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSaveHeroSlides}
                  disabled={saving || uploading}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Writing to Database...' : 'Save Homepage Changes'}</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Live Storefront Hero Preview</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  (Changes reflect in real-time)
                </span>
              </div>

              {/* Interactive Mockup */}
              <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[380px] flex flex-col justify-center p-6 sm:p-8 text-white">
                {/* Background Image with Dark Vignette */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img
                    src={currentSlide.image || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=85'}
                    alt="Preview"
                    className="w-full h-full object-cover opacity-35"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-2xl" />
                </div>

                <div className="relative z-10 max-w-md">
                  {/* Tag */}
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-400 text-[10px] font-bold tracking-wider uppercase mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    {currentSlide.tag || 'FLAGSHIP COMPUTING'}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight mb-2">
                    {currentSlide.title || 'Unleash Next-Gen Laptop Performance'}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-xs text-slate-300 leading-relaxed font-light mb-5 line-clamp-3">
                    {currentSlide.subtitle || 'Experience unmatched power and design.'}
                  </p>

                  {/* Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md">
                      <span>{currentSlide.buttonText || 'Shop Now'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 text-white font-medium text-xs border border-white/20">
                      Catalog
                    </div>
                  </div>
                </div>

                {/* Trust guarantee mini bar at bottom of mockup */}
                <div className="relative z-10 mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span>✓ Free Express Courier</span>
                  <span>✓ Official Warranty</span>
                  <span>✓ 30-Day Returns</span>
                </div>
              </div>

              {/* Guidance Info Card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Verified Database Storage</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  When you click <strong>Save Homepage Changes</strong>, the settings table updates immediately. The customer homepage will dynamically load these slides on their next page view or refresh, requiring zero code adjustments.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEATURED CATEGORIES ON HOMEPAGE */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Homepage Featured Category Grid
              </h3>
              <p className="text-[11px] text-slate-500">
                Categories marked as <strong>Featured</strong> are pinned to the top of the customer homepage "Explore by Category" section.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {categories.filter((c) => c.is_featured === 1).length} Featured
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const isFeat = cat.is_featured === 1;
              return (
                <div
                  key={cat.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isFeat
                      ? 'border-blue-500 bg-blue-50/30 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isFeat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cat.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{cat.name}</h4>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {cat.slug} · {cat.product_count || 0} products
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleCategoryFeatured(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shrink-0 ml-2 ${
                      isFeat
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isFeat ? '★ Featured' : '+ Feature'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FEATURED PRODUCTS SHOWCASE */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Homepage Featured Product Badges
              </h3>
              <p className="text-[11px] text-slate-500">
                Mark products as <strong>Featured</strong>, <strong>Best Seller</strong>, or <strong>New Arrival</strong> to prioritize them across homepage showcases.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name/SKU..."
                className="w-full pl-3 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Price</th>
                  <th className="pb-3 text-center">Featured Pick</th>
                  <th className="pb-3 text-center">Best Seller</th>
                  <th className="pb-3 text-center">New Arrival</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.primary_image}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate max-w-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.sku} · {p.brand_name}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 text-slate-600 font-medium">
                      {p.category_name}
                    </td>

                    <td className="py-3 text-right font-bold text-slate-900">
                      ${p.sale_price || p.regular_price}
                    </td>

                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleProductBadge(p, 'is_featured')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          p.is_featured === 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {p.is_featured === 1 ? '★ Featured' : 'Off'}
                      </button>
                    </td>

                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleProductBadge(p, 'is_best_seller')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          p.is_best_seller === 1
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {p.is_best_seller === 1 ? '🔥 Best Seller' : 'Off'}
                      </button>
                    </td>

                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleProductBadge(p, 'is_new_arrival')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          p.is_new_arrival === 1
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {p.is_new_arrival === 1 ? '✨ New' : 'Off'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
