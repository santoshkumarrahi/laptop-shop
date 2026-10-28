import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Zap,
  Tag,
  ShieldCheck,
  Pause,
  Play,
  Flame,
  Award
} from 'lucide-react';
import { PromoSlide } from '../../types/index.js';

interface PromoSliderProps {
  slides?: PromoSlide[];
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const PromoSlider: React.FC<PromoSliderProps> = ({ slides = [], onNavigate }) => {
  // Only display active slides
  const activeSlides = slides.filter((s) => s.is_active === 1 || s.is_active === true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // If no slides or active slides, do not render or show empty
  const count = activeSlides.length;

  // Auto-play effect
  useEffect(() => {
    if (count <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isPaused, currentIndex]);

  // Reset index if slides change and index is out of bounds
  useEffect(() => {
    if (currentIndex >= count && count > 0) {
      setCurrentIndex(0);
    }
  }, [count, currentIndex]);

  if (count === 0) {
    return null;
  }

  const currentSlide = activeSlides[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % count);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) {
      // Swiped left
      handleNext();
    } else if (distance < -50) {
      // Swiped right
      handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Helper to handle navigation link
  const handleSlideClick = (link: string) => {
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
      return;
    }
    // Clean link: remove leading '/' or '?category='
    let clean = link.replace(/^\//, '');
    if (clean.includes('category=')) {
      const match = clean.match(/category=([^&]+)/);
      if (match) {
        onNavigate('shop', { category: match[1] });
        return;
      }
    }
    if (clean.startsWith('shop')) {
      onNavigate('shop');
      return;
    }
    onNavigate('shop', { category: clean });
  };

  // Accent color mapping for subtle badges and highlights
  const getAccentStyle = (color?: string) => {
    switch (color) {
      case 'emerald':
        return {
          badgeBg: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
          btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
          glow: 'from-emerald-500/20',
          pill: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
        };
      case 'indigo':
        return {
          badgeBg: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
          btnBg: 'bg-indigo-600 hover:bg-indigo-500 text-white',
          glow: 'from-indigo-500/20',
          pill: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30'
        };
      case 'amber':
        return {
          badgeBg: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
          btnBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
          glow: 'from-amber-500/20',
          pill: 'bg-amber-950/80 text-amber-300 border-amber-500/30'
        };
      case 'purple':
        return {
          badgeBg: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
          btnBg: 'bg-purple-600 hover:bg-purple-500 text-white',
          glow: 'from-purple-500/20',
          pill: 'bg-purple-950/80 text-purple-300 border-purple-500/30'
        };
      case 'cyan':
        return {
          badgeBg: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300',
          btnBg: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
          glow: 'from-cyan-500/20',
          pill: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30'
        };
      case 'rose':
        return {
          badgeBg: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
          btnBg: 'bg-rose-600 hover:bg-rose-500 text-white',
          glow: 'from-rose-500/20',
          pill: 'bg-rose-950/80 text-rose-300 border-rose-500/30'
        };
      case 'blue':
      default:
        return {
          badgeBg: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
          btnBg: 'bg-blue-600 hover:bg-blue-500 text-white',
          glow: 'from-blue-500/20',
          pill: 'bg-blue-950/80 text-blue-300 border-blue-500/30'
        };
    }
  };

  const accent = getAccentStyle(currentSlide.accentColor);

  return (
    <section
      aria-label="Promotional Showcase Slider"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 -mb-6"
    >
      {/* SECTION HEADER / SUB-LABEL */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Featured Collections &amp; Promotional Deals
          </span>
        </div>

        {/* Slide Counter & Pause/Play toggle */}
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <span className="font-mono font-semibold">
            {String(currentIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded-md hover:bg-slate-200 text-slate-700 hover:text-slate-800 transition-colors cursor-pointer"
            title={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
            aria-label={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* MAIN SLIDER CONTAINER */}
      <div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/10 group select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Image with smooth crossfade and subtle zoom */}
        <div className="relative h-[420px] sm:h-[460px] md:h-[480px] lg:h-[500px] w-full overflow-hidden">
          {activeSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />

              {/* Gradient Overlays for High Legibility */}
              {/* Left-to-right dark gradient for text */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/20 sm:w-3/4" />
              {/* Bottom shadow for mobile */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
              {/* Ambient colored glow */}
              <div className={`absolute top-0 left-0 w-96 h-96 bg-gradient-to-br ${accent.glow} to-transparent rounded-full blur-3xl opacity-50 pointer-events-none`} />
            </div>
          ))}

          {/* CONTENT OVERLAY */}
          <div className="relative z-20 h-full flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-14 max-w-2xl sm:max-w-3xl">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {currentSlide.badge && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wider uppercase backdrop-blur-md transition-colors ${accent.badgeBg}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentSlide.badge}</span>
                </div>
              )}

              {currentSlide.discount_tag && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-md ${accent.pill}`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{currentSlide.discount_tag}</span>
                </div>
              )}
            </div>

            {/* Middle: Title & Subtitle */}
            <div className="my-auto py-4">
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight sm:leading-none drop-shadow-md">
                {currentSlide.title}
              </h3>

              {currentSlide.subtitle && (
                <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-200 font-normal line-clamp-3 leading-relaxed drop-shadow">
                  {currentSlide.subtitle}
                </p>
              )}

              {/* Action Buttons */}
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  onClick={() => handleSlideClick(currentSlide.buttonLink)}
                  className={`inline-flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-all hover:translate-x-0.5 cursor-pointer active:scale-95 ${accent.btnBg}`}
                >
                  <span>{currentSlide.buttonText || 'Shop Collection'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {currentSlide.secondaryButtonText && (
                  <button
                    onClick={() => handleSlideClick(currentSlide.secondaryButtonLink || 'shop')}
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all cursor-pointer active:scale-95"
                  >
                    <span>{currentSlide.secondaryButtonText}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Progress Bar & Indicators */}
            <div className="flex items-center justify-between pt-2">
              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {activeSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentIndex(idx)}
                    className="group py-2 px-0.5 cursor-pointer"
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentIndex
                          ? 'w-8 bg-blue-500'
                          : 'w-2 bg-white/30 group-hover:bg-white/60'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Trust Badge / Micro Benefit */}
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Official Warranty
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Same-Day Dispatch
                </span>
              </div>
            </div>
          </div>

          {/* Left Arrow Button */}
          {count > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md border border-white/10 shadow-lg opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-105 cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Right Arrow Button */}
          {count > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md border border-white/10 shadow-lg opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-105 cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* THUMBNAIL QUICK-SELECTOR STRIP */}
        {count > 1 && (
          <div className="bg-slate-950/90 border-t border-slate-800/80 p-2 sm:p-3 overflow-x-auto scrollbar-none flex items-center gap-2 sm:gap-3">
            {activeSlides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex items-center gap-2.5 p-1.5 sm:p-2 rounded-xl text-left transition-all shrink-0 cursor-pointer ${
                  idx === currentIndex
                    ? 'bg-blue-900/40 border border-blue-500/50 text-white shadow-sm'
                    : 'bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="w-10 h-7 sm:w-12 sm:h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700/50">
                  <img
                    src={slide.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="max-w-[140px] sm:max-w-[180px] overflow-hidden">
                  <div className="text-[10px] sm:text-xs font-bold truncate">
                    {slide.title}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {slide.discount_tag || slide.badge || 'Featured Collection'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
