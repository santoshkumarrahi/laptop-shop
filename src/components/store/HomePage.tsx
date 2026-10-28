import React, { useState, useEffect } from 'react';
import {
  Laptop,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Star,
  CheckCircle2,
  Headphones,
  Tv,
  Gamepad2,
  Package,
  TrendingUp,
  Award
} from 'lucide-react';
import { Product, Category, Brand, StoreSettings } from '../../types/index.js';
import { HeroBanner } from './HeroBanner.js';
import { PromoSlider } from './PromoSlider.js';
import { ProductCard } from './ProductCard.js';
import { CategoryIcon } from '../common/CategoryIcon.js';
import { api } from '../../lib/api.js';

interface HomePageProps {
  categories: Category[];
  brands: Brand[];
  settings: StoreSettings | null;
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  brands,
  settings,
  onNavigate
}) => {
  const [featuredLaptops, setFeaturedLaptops] = useState<Product[]>([]);
  const [gamingLaptops, setGamingLaptops] = useState<Product[]>([]);
  const [audioProducts, setAudioProducts] = useState<Product[]>([]);
  const [peripheralsProducts, setPeripheralsProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShowcaseData() {
      setLoading(true);
      try {
        const res = await api.getProducts({ limit: 50 });
        const all = res.products || [];

        // 1. Pro Laptops: MacBook, ThinkPad, HP Pavilion, Dell Inspiron, Acer Aspire
        const laptops = all.filter(
          (p) =>
            ['laptops', 'business-laptops', 'used-and-refurbished-laptops'].includes(p.category_slug || '') &&
            !p.name.includes('VivoBook') &&
            !p.name.includes('SCAR') &&
            !p.name.includes('Raider')
        );

        // 2. Gaming Rigs & High-Refresh Machines
        const gaming = all.filter(
          (p) =>
            p.category_slug === 'gaming-laptops' ||
            p.name.includes('SCAR') ||
            p.name.includes('Raider') ||
            p.name.includes('VivoBook')
        );

        // 3. Speakers, Headsets & Hi-Fi Audio
        const audio = all.filter(
          (p) =>
            ['speakers', 'headphones-and-earphones'].includes(p.category_slug || '') ||
            p.name.includes('Speaker') ||
            p.name.includes('Headphone') ||
            p.name.includes('Headset')
        );

        // 4. Peripherals, Storage, Fast GaN Chargers & Coolers
        const peripherals = all.filter((p) =>
          [
            'keyboards',
            'computer-mice',
            'monitors-and-displays',
            'storage-devices-and-ssds',
            'cooling-pads',
            'chargers-and-power-adapters',
          ].includes(p.category_slug || '')
        );

        setFeaturedLaptops(laptops.slice(0, 6));
        setGamingLaptops(gaming.slice(0, 4));
        setAudioProducts(audio.slice(0, 4));
        setPeripheralsProducts(peripherals.slice(0, 6));
      } catch (err) {
        console.error('Failed to load showcase products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShowcaseData();
  }, []);

  // Top featured categories
  const featuredCategories = categories.filter((c) => c.is_featured === 1 || !c.parent_id).slice(0, 8);

  return (
    <div className="space-y-16 pb-16 bg-slate-50">
      {/* 1. HERO BANNER */}
      <HeroBanner slides={settings?.hero_slides} onNavigate={onNavigate} />

      {/* 1B. SEPARATE PROMOTIONAL & PRODUCT IMAGE SLIDER */}
      <PromoSlider slides={settings?.promo_slides} onNavigate={onNavigate} />

      {/* 2. DYNAMIC CATEGORY SHOWCASE (Loaded from Database) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Dynamic Store Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Explore by Category
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View all categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {featuredCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigate('shop', { category: cat.slug })}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-600 flex items-center justify-center transition-colors mb-2.5">
                <CategoryIcon iconName={cat.icon} className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {cat.name}
              </span>
              <span className="text-[10px] text-slate-600 mt-0.5">
                {cat.product_count !== undefined ? `${cat.product_count} items` : 'Explore'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRO LAPTOPS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
              Top Workstations &amp; Ultrabooks
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Flagship Laptops
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop', { category: 'laptops' })}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View all pro laptops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredLaptops.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 4. PROMOTIONAL CALLOUT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 p-8 sm:p-12 text-white overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white mb-4 shadow-sm">
              Limited Time Special Event
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Upgrade to RTX 40-Series Power with Instant $100 Discount
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Use code <strong className="text-white underline">LAPTOP100</strong> at checkout for $100 off any gaming or workstation laptop over $1,500. Includes complimentary expedited courier delivery.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('shop', { category: 'gaming-laptops' })}
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
              >
                Shop RTX 40-Series Rigs
              </button>
              <button
                onClick={() => onNavigate('shop', { condition: 'Refurbished' })}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md transition-all cursor-pointer"
              >
                Explore Certified Refurbished
              </button>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 lg:opacity-30 pointer-events-none">
            <Laptop className="w-full h-full text-blue-400" />
          </div>
        </div>
      </section>

      {/* 5. GAMING LAPTOPS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <Gamepad2 className="w-4 h-4" />
              <span>Extreme Frame Rates</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              High-Refresh Gaming Laptops
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop', { category: 'gaming-laptops' })}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>See all gaming laptops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gamingLaptops.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 6. SPEAKERS & AUDIO GEAR SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
              <Headphones className="w-4 h-4" />
              <span>Hi-Fi Wireless Acoustics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Speakers &amp; Audio Gear
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop', { category: 'speakers' })}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Browse audio systems</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {audioProducts.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 6B. PRO PERIPHERALS, STORAGE & WORKSPACE ACCESSORIES */}
      {peripheralsProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                <Zap className="w-4 h-4" />
                <span>Productivity &amp; Battle Station Upgrades</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Keyboards, Displays &amp; Accessories
              </h2>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore all accessories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {peripheralsProducts.map((product) => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* 7. FEATURED BRANDS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Authorized Dealer</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Official Tech Partners &amp; Manufacturers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Direct partnerships ensure authentic parts, guaranteed serial numbers, and full manufacturer warranties.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {brands.slice(0, 6).map((b) => (
            <div
              key={b.id}
              onClick={() => onNavigate('shop', { brand: b.slug })}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-2 group-hover:scale-105 transition-transform">
                <img src={b.logo_url || ''} alt={b.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {b.name}
              </h4>
              <span className="text-[10px] text-slate-600 mt-0.5">{b.product_count || 0} products</span>
            </div>
          ))}
        </div>
      </section>

      {/* 8. CUSTOMER REVIEWS / TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Real Verified Experiences</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Trusted by Software Engineers, Creators, &amp; Esports Pros
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Dr. Michael Chang',
              title: 'Senior AI Engineer & Researcher',
              comment: 'The M3 Max MacBook Pro arrived within 24 hours. Compiles our local PyTorch models flawlessly. Customer service helped configure our tax exemption in minutes.',
              rating: 5,
              product: 'Apple MacBook Pro 16" (M3 Max)'
            },
            {
              name: 'Sarah K. Vance',
              title: '3D VFX Supervisor',
              comment: 'Our studio ordered four ASUS ROG SCAR 18s for on-set rendering. Liquid metal cooling keeps them whisper quiet during octane renders. Superb experience!',
              rating: 5,
              product: 'ASUS ROG Strix SCAR 18 (RTX 4090)'
            },
            {
              name: 'David R. Miller',
              title: 'Music Producer & Sound Designer',
              comment: 'The JBL Boombox 3 Wi-Fi fills our 1,500 sq ft outdoor terrace with clean, distortion-free sub bass. The AirPlay 2 connection is seamless.',
              rating: 5,
              product: 'JBL Boombox 3 Wi-Fi'
            }
          ].map((rev, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center text-amber-400 gap-1 mb-3">
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mb-4">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900">{rev.name}</div>
                <div className="text-[11px] text-slate-500">{rev.title}</div>
                <div className="text-[10px] text-blue-600 font-medium mt-1">Verified: {rev.product}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
