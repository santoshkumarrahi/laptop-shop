import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';
import { HeroSlide } from '../../types/index.js';

interface HeroBannerProps {
  slides?: HeroSlide[];
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

const defaultSlides: HeroSlide[] = [
  {
    id: 'slide_1',
    tag: 'FLAGSHIP COMPUTING 2026',
    title: 'Unleash Next-Gen Laptop Performance',
    subtitle: 'From ultra-powerful M3 Max workstations to RTX 4090 gaming rigs with 240Hz Nebula HDR displays.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=85',
    buttonText: 'Shop Flagship Laptops',
    buttonLink: 'laptops'
  },
  {
    id: 'slide_2',
    tag: 'AUDIOPHILE ACOUSTICS',
    title: 'Precision Sound & High-Power Speakers',
    subtitle: 'Elevate your sound with studio-grade noise cancelling headsets and room-filling Wi-Fi acoustics.',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1600&q=85',
    buttonText: 'Discover Audio Gear',
    buttonLink: 'speakers'
  }
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ slides = defaultSlides, onNavigate }) => {
  const [current, setCurrent] = useState(0);
  const activeSlides = slides && slides.length > 0 ? slides : defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const slide = activeSlides[current];

  return (
    <div className="relative bg-slate-950 overflow-hidden">
      {/* Background with Ambient Glow */}
      <div className="absolute inset-0 z-0">
        <img
          src={slide.image}
          alt={slide.title}
          className="w-full h-full object-cover object-center opacity-30 transform scale-105 transition-all duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            {slide.tag}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-none">
            {slide.title}
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed font-light">
            {slide.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('shop', { category: slide.buttonLink })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:translate-x-0.5 cursor-pointer"
            >
              <span>{slide.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('shop')}
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            >
              Browse Full Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Slide Navigation Controls */}
      {activeSlides.length > 1 && (
        <>
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    current === idx ? 'w-6 bg-blue-500' : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % activeSlides.length)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Trust & Guarantee Bar */}
      <div className="relative z-10 border-t border-white/10 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">Free Express Courier</div>
                <div className="text-[11px] text-slate-400">On all orders over $1,500</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">Official Manufacturer Warranty</div>
                <div className="text-[11px] text-slate-400">Up to 3 years direct coverage</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">30-Day Money-Back Guarantee</div>
                <div className="text-[11px] text-slate-400">Hassle-free return policy</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">100% Certified Authentic</div>
                <div className="text-[11px] text-slate-400">Direct authorized partner</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
