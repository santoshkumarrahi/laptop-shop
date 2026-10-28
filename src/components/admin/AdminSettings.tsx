import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, RefreshCw, Megaphone, DollarSign, Truck, Shield } from 'lucide-react';
import { StoreSettings } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';

interface AdminSettingsProps {
  onRefreshSettings: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onRefreshSettings }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [storeName, setStoreName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [currency, setCurrency] = useState('$');
  const [taxRate, setTaxRate] = useState<number>(0.08);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(1500);
  const [standardShippingRate, setStandardShippingRate] = useState<number>(25);
  const [expressShippingRate, setExpressShippingRate] = useState<number>(45);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
      setStoreName(data.store_name);
      setStoreEmail(data.store_email);
      setStorePhone(data.store_phone);
      setCurrency(data.currency || '$');
      setTaxRate(data.tax_rate);
      setFreeShippingThreshold(data.free_shipping_threshold);
      setStandardShippingRate(data.standard_shipping_rate);
      setExpressShippingRate(data.express_shipping_rate);
      setAnnouncementText(data.announcement_text || '');
      setAnnouncementEnabled(data.announcement_enabled === 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      await api.updateSettings({
        store_name: storeName,
        store_email: storeEmail,
        store_phone: storePhone,
        currency,
        tax_rate: Number(taxRate),
        free_shipping_threshold: Number(freeShippingThreshold),
        standard_shipping_rate: Number(standardShippingRate),
        express_shipping_rate: Number(expressShippingRate),
        announcement_text: announcementText,
        announcement_enabled: announcementEnabled ? 1 : 0,
        adminName: user?.name || 'Alexander Vance',
      });

      setSuccessMsg('Store settings and announcement banner updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      onRefreshSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Store Settings &amp; Website Content
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure announcement bar promotions, currency, tax rates, and free shipping tiers.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Promotional Announcement Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Megaphone className="w-4 h-4 text-blue-600" />
            <span>Storefront Top Announcement Bar</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Banner Message Text (Displays on top of every customer page)
            </label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={announcementEnabled}
              onChange={(e) => setAnnouncementEnabled(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Enable Announcement Bar on Storefront</span>
          </label>
        </div>

        {/* Financial & Shipping Rules */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Taxation &amp; Shipping Calculations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sales Tax Rate (e.g. 0.08 for 8%)
              </label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Free Express Shipping Threshold ($)
              </label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standard Shipping Rate ($)
              </label>
              <input
                type="number"
                value={standardShippingRate}
                onChange={(e) => setStandardShippingRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Express Priority Air Rate ($)
              </label>
              <input
                type="number"
                value={expressShippingRate}
                onChange={(e) => setExpressShippingRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Store Contact & Metadata */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Settings className="w-4 h-4 text-slate-600" />
            <span>Store Profile &amp; Contact</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Toll-Free Phone</label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </form>
    </div>
  );
};
