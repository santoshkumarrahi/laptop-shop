import React, { useState } from 'react';
import {
  Laptop,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ArrowRight
} from 'lucide-react';
import { Category, Brand } from '../../types/index.js';

interface FooterProps {
  categories: Category[];
  brands: Brand[];
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const Footer: React.FC<FooterProps> = ({ categories, brands, onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  // Top 8 categories
  const featuredCats = categories.slice(0, 8);

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      {/* Newsletter Section */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Join the NexTech Insider VIP Club
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Receive secret drop alerts on RTX 50-Series, M-Series deals, and $50 off your first laptop purchase.
              </p>
            </div>

            <div className="w-full md:w-auto">
              {subscribed ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-4 py-2.5 rounded-xl">
                  <Check className="w-4 h-4" />
                  <span>Welcome aboard! Check your inbox for your $50 coupon code.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 w-full max-w-md">
                  <input
                    type="email"
                    required
                    placeholder="Enter your corporate or personal email..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Subscribe &rarr;
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                NEXT<span className="text-blue-500">ECH</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
              The premier destination for high-end laptops, custom workstations, audiophile speakers, and cutting-edge electronics with factory-backed warranties and pro support.
            </p>

            <div className="space-y-2 text-xs text-slate-300 pt-2">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>+1 (800) 555-TECH (Mon-Fri 8am-8pm EST)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>sales@nextech-store.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>100 Silicon Way, Suite 400, San Francisco, CA 94107</span>
              </div>
            </div>
          </div>

          {/* Dynamic Categories Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Shop Categories
            </h4>
            <ul className="space-y-2">
              {featuredCats.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => onNavigate('shop', { category: cat.slug })}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  View all 24 categories &rarr;
                </button>
              </li>
            </ul>
          </div>

          {/* Brands Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Featured Brands
            </h4>
            <ul className="space-y-2">
              {brands.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => onNavigate('shop', { brand: b.slug })}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {b.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('orders')} className="hover:text-white cursor-pointer">
                  Track Package
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('account')} className="hover:text-white cursor-pointer">
                  My Profile &amp; Invoices
                </button>
              </li>
              <li>
                <span className="text-slate-400">Official 2-Year Warranty</span>
              </li>
              <li>
                <span className="text-slate-400">30-Day Return Policy</span>
              </li>
              <li>
                <span className="text-slate-400">Terms of Service &amp; Privacy</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} NexTech Electronics Inc. All rights reserved. Full relational database backend.
          </div>
          <div className="flex items-center gap-4">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>American Express</span>
            <span>PayPal</span>
            <span>COD Available</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
