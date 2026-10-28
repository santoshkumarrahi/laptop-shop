import React, { useState, useEffect, useRef } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit3,
  MoveUp,
  MoveDown,
  Eye,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Tag,
  ArrowRight,
  ExternalLink,
  Layers,
  Save,
  RotateCcw,
  Check,
  X,
  Laptop,
  Volume2,
  Monitor,
  Flame,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { PromoSlide, Category } from '../../types/index.js';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';

interface AdminSliderProps {
  onRefreshSettings?: () => void;
  onNavigate?: (view: string, params?: Record<string, any>) => void;
}

// Curated high-resolution presets for laptops & electronics
const IMAGE_PRESETS = [
  {
    name: 'Flagship Laptop & Workspace',
    category: 'Laptops',
    url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1800&q=85'
  },
  {
    name: 'Pro Esports Battle Rig',
    category: 'Gaming',
    url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1800&q=85'
  },
  {
    name: 'Hi-Fi Wireless Audio',
    category: 'Speakers',
    url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1800&q=85'
  },
  {
    name: 'Studio Desk & 4K Monitor',
    category: 'Displays',
    url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1800&q=85'
  },
  {
    name: 'Certified Refurbished Laptop',
    category: 'Refurbished',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=85'
  },
  {
    name: 'Mechanical Keyboard Setup',
    category: 'Peripherals',
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1800&q=85'
  },
  {
    name: 'Ultra-thin MacBook Pro Workstation',
    category: 'Laptops',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1800&q=85'
  },
  {
    name: 'Audiophile Sound Studio',
    category: 'Audio',
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1800&q=85'
  }
];

const ACCENT_COLORS = [
  { id: 'blue', label: 'Tech Electric Blue', class: 'bg-blue-600', ring: 'ring-blue-500' },
  { id: 'indigo', label: 'Deep Indigo', class: 'bg-indigo-600', ring: 'ring-indigo-500' },
  { id: 'emerald', label: 'Vibrant Emerald', class: 'bg-emerald-600', ring: 'ring-emerald-500' },
  { id: 'amber', label: 'Solar Amber', class: 'bg-amber-500', ring: 'ring-amber-500' },
  { id: 'purple', label: 'Cyber Purple', class: 'bg-purple-600', ring: 'ring-purple-500' },
  { id: 'cyan', label: 'Neon Cyan', class: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { id: 'rose', label: 'Vivid Rose', class: 'bg-rose-600', ring: 'ring-rose-500' }
];

export const AdminSlider: React.FC<AdminSliderProps> = ({ onRefreshSettings, onNavigate }) => {
  const { user } = useAuth();
  const [slides, setSlides] = useState<PromoSlide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit / Add Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<PromoSlide | null>(null);
  const [editingSlide, setEditingSlide] = useState<Partial<PromoSlide> | null>(null);
  const [isNewSlide, setIsNewSlide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial promo slides and categories
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedSlides, fetchedCategories] = await Promise.all([
        api.getPromoSlides(),
        api.getCategories(true)
      ]);
      setSlides(fetchedSlides || []);
      setCategories(fetchedCategories || []);
    } catch (err: any) {
      console.error('Failed to load promo slides:', err);
      showNotification('error', 'Failed to load slider configuration from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Open Editor for Creating New Slide
  const handleAddNew = () => {
    const newSlideDraft: Partial<PromoSlide> = {
      id: 'promo_slide_' + Date.now(),
      badge: 'LIMITED TIME SALE',
      title: 'New Promotional Offer',
      subtitle: 'Highlight your featured laptops, audio devices, or seasonal deals with high-resolution imagery and instant purchasing links.',
      discount_tag: 'Save Up to 25% OFF',
      image: IMAGE_PRESETS[0].url,
      buttonText: 'Shop Deal Now',
      buttonLink: 'laptops',
      secondaryButtonText: 'View All Electronics',
      secondaryButtonLink: 'shop',
      accentColor: 'blue',
      display_order: slides.length + 1,
      is_active: 1
    };
    setEditingSlide(newSlideDraft);
    setIsNewSlide(true);
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Slide
  const handleEdit = (slide: PromoSlide) => {
    setEditingSlide({ ...slide });
    setIsNewSlide(false);
    setIsEditorOpen(true);
  };

  // Toggle Active / Disabled
  const handleToggleActive = async (slide: PromoSlide) => {
    const updatedStatus = slide.is_active === 1 || slide.is_active === true ? 0 : 1;
    try {
      const res = await api.updatePromoSlide(slide.id, {
        is_active: updatedStatus,
        adminName: user?.name || 'Alexander Vance'
      });
      setSlides(res.slides);
      showNotification('success', `Slide status changed to ${updatedStatus ? 'Active' : 'Disabled'}.`);
      if (onRefreshSettings) onRefreshSettings();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update slide status');
    }
  };

  // Move slide up in display order
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...slides];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;

    const orderedIds = newOrder.map((s) => s.id);
    try {
      const res = await api.reorderPromoSlides(orderedIds, user?.name);
      setSlides(res.slides);
      showNotification('success', 'Slide order updated successfully.');
      if (onRefreshSettings) onRefreshSettings();
    } catch (err: any) {
      showNotification('error', 'Failed to update slide order');
    }
  };

  // Move slide down in display order
  const handleMoveDown = async (index: number) => {
    if (index === slides.length - 1) return;
    const newOrder = [...slides];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;

    const orderedIds = newOrder.map((s) => s.id);
    try {
      const res = await api.reorderPromoSlides(orderedIds, user?.name);
      setSlides(res.slides);
      showNotification('success', 'Slide order updated successfully.');
      if (onRefreshSettings) onRefreshSettings();
    } catch (err: any) {
      showNotification('error', 'Failed to update slide order');
    }
  };

  // Delete Slide
  const handleDelete = async (slide: PromoSlide) => {
    if (!window.confirm(`Are you sure you want to delete the slide: "${slide.title}"?`)) {
      return;
    }
    try {
      const res = await api.deletePromoSlide(slide.id, user?.name);
      setSlides(res.slides);
      showNotification('success', 'Slide deleted successfully.');
      if (onRefreshSettings) onRefreshSettings();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete slide');
    }
  };

  // Handle Image File Upload to Server
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'File size exceeds 10MB limit.');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await api.uploadImage({
            data: base64Data,
            filename: file.name
          });
          if (res.success && res.url) {
            setEditingSlide((prev) => (prev ? { ...prev, image: res.url } : null));
            showNotification('success', 'Image uploaded successfully to server!');
          }
        } catch (uploadErr: any) {
          showNotification('error', uploadErr.message || 'Image upload failed.');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showNotification('error', 'Could not read file.');
      setUploadingImage(false);
    }
  };

  // Save current slide from editor modal
  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    if (!editingSlide.title || !editingSlide.image) {
      showNotification('error', 'Slide Heading and Background Image are required.');
      return;
    }

    setSaving(true);
    try {
      if (isNewSlide) {
        const res = await api.createPromoSlide({
          ...editingSlide,
          adminName: user?.name || 'Alexander Vance'
        });
        setSlides(res.slides);
        showNotification('success', 'New promotional slide created successfully!');
      } else if (editingSlide.id) {
        const res = await api.updatePromoSlide(editingSlide.id, {
          ...editingSlide,
          adminName: user?.name || 'Alexander Vance'
        });
        setSlides(res.slides);
        showNotification('success', 'Promotional slide updated successfully!');
      }
      setIsEditorOpen(false);
      setEditingSlide(null);
      if (onRefreshSettings) onRefreshSettings();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  // Quick live preview trigger
  const handleOpenPreview = (slide: PromoSlide) => {
    setPreviewSlide(slide);
    setPreviewModalOpen(true);
  };

  const activeCount = slides.filter((s) => s.is_active === 1 || s.is_active === true).length;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Dedicated Slider Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Promotional &amp; Product Slider Studio
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Control the high-impact promotional carousel displayed directly below the homepage hero section. Add, edit, reorder slides, upload high-res banners, configure promotional badges, and preview in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Reload from database"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Slide</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase">Total Slides</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{slides.length}</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Configured in store database</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase">Active on Homepage</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Displayed in live slider</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase">Disabled / Drafts</div>
            <div className="text-2xl font-black text-slate-500 mt-1">{slides.length - activeCount}</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Hidden from customer view</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
            <X className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SLIDES MANAGEMENT LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Configured Promotional Slides</h2>
            <p className="text-xs text-slate-600">
              Drag or use the up/down arrows to reorder. Toggle status to instantly show or hide on the storefront.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Live Changes Synchronized with Database</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-600 font-medium text-sm">
            Loading promotional slides...
          </div>
        ) : slides.length === 0 ? (
          <div className="p-12 text-center">
            <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Slides Configured Yet</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              Create your first promotional slide to showcase laptops, audio gear, or current sales campaigns below the hero section.
            </p>
            <button
              onClick={handleAddNew}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Slide</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {slides.map((slide, index) => {
              const isActive = slide.is_active === 1 || slide.is_active === true;
              return (
                <div
                  key={slide.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isActive ? 'hover:bg-slate-50/80' : 'bg-slate-50/50 opacity-75'
                  }`}
                >
                  {/* Left: Reorder Controls & Thumbnail */}
                  <div className="flex items-center gap-3">
                    {/* Order Controls */}
                    <div className="flex flex-col gap-1 items-center">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                          index === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 cursor-pointer'
                        }`}
                        title="Move Slide Up"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] font-mono font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === slides.length - 1}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                          index === slides.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 cursor-pointer'
                        }`}
                        title="Move Slide Down"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="relative w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-200 group/img">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                      />
                      <button
                        onClick={() => handleOpenPreview(slide)}
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white"
                        title="Quick Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Slide Information */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {slide.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                            {slide.badge}
                          </span>
                        )}
                        {slide.discount_tag && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            {slide.discount_tag}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {slide.title}
                      </h3>

                      <p className="text-xs text-slate-600 truncate max-w-md sm:max-w-lg mt-0.5">
                        {slide.subtitle || 'No description provided'}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                        <span className="font-semibold text-blue-600">
                          CTA: {slide.buttonText} &rarr; /{slide.buttonLink}
                        </span>
                        {slide.secondaryButtonText && (
                          <span>
                            • 2nd: {slide.secondaryButtonText} &rarr; /{slide.secondaryButtonLink}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Status Toggle Button */}
                    <button
                      onClick={() => handleToggleActive(slide)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                      title={isActive ? 'Click to disable' : 'Click to enable'}
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    {/* Preview Button */}
                    <button
                      onClick={() => handleOpenPreview(slide)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Preview Slide"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(slide)}
                      className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                      title="Edit Slide"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(slide)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK PRESETS INSPIRATION BAR */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Quick Preset Asset Library</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              High-Resolution Laptop &amp; Electronics Photographs
            </h3>
            <p className="text-xs text-slate-400">
              One-click imagery to immediately create or refresh your promotional slider with studio-grade photography.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {IMAGE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                const newDraft: Partial<PromoSlide> = {
                  id: 'promo_slide_' + Date.now(),
                  badge: `${preset.category.toUpperCase()} SHOWCASE`,
                  title: preset.name,
                  subtitle: `Discover elite performance with official manufacturer warranty and same-day express shipping.`,
                  discount_tag: 'Seasonal Promo',
                  image: preset.url,
                  buttonText: `Shop ${preset.category}`,
                  buttonLink: preset.category.toLowerCase().replace(/\s+/g, '-'),
                  secondaryButtonText: 'Browse Catalog',
                  secondaryButtonLink: 'shop',
                  accentColor: 'blue',
                  display_order: slides.length + 1,
                  is_active: 1
                };
                setEditingSlide(newDraft);
                setIsNewSlide(true);
                setIsEditorOpen(true);
              }}
              className="relative rounded-xl overflow-hidden group/card border border-slate-800 hover:border-blue-500 text-left transition-all cursor-pointer h-24"
            >
              <img
                src={preset.url}
                alt={preset.name}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-2.5 flex flex-col justify-end">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  {preset.category}
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {preset.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FULL SLIDE EDIT / CREATE MODAL */}
      {isEditorOpen && editingSlide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isNewSlide ? 'Create New Promotional Slide' : 'Edit Promotional Slide'}
                </h3>
                <p className="text-xs text-slate-600">
                  Customize image, promotional copy, buttons, destination links, and accents.
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditor} className="p-6 space-y-6">
              {/* LIVE REAL-TIME PREVIEW CARD */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Live Slide Preview (Storefront Rendering)</span>
                  </label>
                  <span className="text-[11px] text-slate-600">
                    Updates live as you type
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-slate-950 h-56 sm:h-64 border border-slate-800 shadow-inner group">
                  <img
                    src={editingSlide.image || IMAGE_PRESETS[0].url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if URL is invalid
                      (e.target as HTMLImageElement).src = IMAGE_PRESETS[0].url;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent w-full sm:w-3/4" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                  {/* Content Preview Overlay */}
                  <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      {editingSlide.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                          {editingSlide.badge}
                        </span>
                      )}
                      {editingSlide.discount_tag && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-semibold">
                          {editingSlide.discount_tag}
                        </span>
                      )}
                    </div>

                    <div className="my-auto py-2">
                      <h4 className="text-lg sm:text-2xl font-black text-white leading-tight">
                        {editingSlide.title || 'Slide Title Placeholder'}
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-slate-200 line-clamp-2 font-normal">
                        {editingSlide.subtitle || 'Slide subtitle description placeholder'}
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md">
                          <span>{editingSlide.buttonText || 'Shop Now'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        {editingSlide.secondaryButtonText && (
                          <div className="px-3 py-2 rounded-lg bg-white/10 text-white font-semibold text-xs border border-white/20">
                            {editingSlide.secondaryButtonText}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-1.5 rounded-full bg-blue-500"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BACKGROUND IMAGE PICKER & UPLOAD */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Background Image (Upload or Preset)</span>
                    </label>
                    <p className="text-[11px] text-slate-600">
                      Upload from your device (JPG, PNG, WebP) or choose from high-res presets.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Direct Image URL input */}
                <div className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={editingSlide.image || ''}
                      onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                      placeholder="https://images.unsplash.com/... or /uploads/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* One-Click Presets Strip */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 mb-2">
                    Quick Presets:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingSlide({ ...editingSlide, image: preset.url })}
                        className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          editingSlide.image === preset.url
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-slate-800 truncate">
                            {preset.category}
                          </div>
                          <div className="text-[9px] text-slate-600 truncate">
                            {preset.name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SLIDE HEADINGS & COPY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Slide Heading / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSlide.title || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                    placeholder="e.g. Next-Gen Intel Core Ultra & M3 Max Flagships"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Description / Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={editingSlide.subtitle || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                    placeholder="e.g. Experience extreme mobile computing with aerospace-grade CNC aluminum chassis..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Top Badge Text
                  </label>
                  <input
                    type="text"
                    value={editingSlide.badge || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                    placeholder="e.g. SUMMER SALE • SAVE UP TO $400"
                    className="w-full px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Discount / Price Highlight Tag
                  </label>
                  <input
                    type="text"
                    value={editingSlide.discount_tag || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, discount_tag: e.target.value })}
                    placeholder="e.g. From $1,299 • Free 3-Yr Warranty"
                    className="w-full px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* BUTTONS & LINKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* Primary Button */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={editingSlide.buttonText || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, buttonText: e.target.value })}
                    placeholder="e.g. Shop Flagship Laptops"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Primary Button Destination Link / Category
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={categories.some((c) => c.slug === editingSlide.buttonLink) ? editingSlide.buttonLink : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setEditingSlide({ ...editingSlide, buttonLink: e.target.value });
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose Category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editingSlide.buttonLink || ''}
                      onChange={(e) => setEditingSlide({ ...editingSlide, buttonLink: e.target.value })}
                      placeholder="laptops or /shop"
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Secondary Button */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Secondary Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.secondaryButtonText || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, secondaryButtonText: e.target.value })}
                    placeholder="e.g. Business Workstations"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Secondary Button Link / Category
                  </label>
                  <input
                    type="text"
                    value={editingSlide.secondaryButtonLink || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, secondaryButtonLink: e.target.value })}
                    placeholder="e.g. business-laptops or shop"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* ACCENT COLOR & STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Accent Theme Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map((accent) => (
                      <button
                        key={accent.id}
                        type="button"
                        onClick={() => setEditingSlide({ ...editingSlide, accentColor: accent.id })}
                        className={`w-7 h-7 rounded-full ${accent.class} transition-all cursor-pointer flex items-center justify-center text-white ${
                          editingSlide.accentColor === accent.id
                            ? 'ring-2 ring-offset-2 ' + accent.ring + ' scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={accent.label}
                      >
                        {editingSlide.accentColor === accent.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-center pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSlide.is_active === 1 || editingSlide.is_active === true}
                      onChange={(e) =>
                        setEditingSlide({ ...editingSlide, is_active: e.target.checked ? 1 : 0 })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Enable Slide on Storefront
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Slide will be visible in the homepage promo carousel.
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save & Publish Slide'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PREVIEW POPUP MODAL */}
      {previewModalOpen && previewSlide && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Full Storefront Slide Preview: {previewSlide.title}</span>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-[380px] sm:h-[420px] w-full overflow-hidden">
              <img
                src={previewSlide.image}
                alt={previewSlide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent w-full sm:w-3/4" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

              <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-between max-w-2xl">
                <div className="flex items-center gap-2">
                  {previewSlide.badge && (
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
                      {previewSlide.badge}
                    </span>
                  )}
                  {previewSlide.discount_tag && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                      {previewSlide.discount_tag}
                    </span>
                  )}
                </div>

                <div className="my-auto">
                  <h2 className="text-2xl sm:text-4xl font-black text-white">
                    {previewSlide.title}
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-slate-200">
                    {previewSlide.subtitle}
                  </p>

                  <div className="mt-6 flex items-center gap-3">
                    <div className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center gap-2">
                      <span>{previewSlide.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    {previewSlide.secondaryButtonText && (
                      <div className="px-5 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/20">
                        {previewSlide.secondaryButtonText}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  Slide Order: #{previewSlide.display_order} • Status:{' '}
                  {previewSlide.is_active ? 'Active' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
