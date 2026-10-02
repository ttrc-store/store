'use client';

import * as React from 'react';
import { Save, CheckCircle2, Truck, CreditCard, Building2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSiteSettingsAction, updateSiteSettingAction } from '@/actions/settings';

export default function AdminSettingsPage() {
  const [companyName, setCompanyName] = React.useState('Tamizh Tech');
  const [gstin, setGstin] = React.useState('');
  const [gstEnabled, setGstEnabled] = React.useState(false);
  const [razorpayEnabled, setRazorpayEnabled] = React.useState(false);
  const [grievanceOfficer, setGrievanceOfficer] = React.useState('Karthik Raja (support@tamizhtech.in)');
  const [freeShippingThreshold, setFreeShippingThreshold] = React.useState('999');
  const [baseShippingFee, setBaseShippingFee] = React.useState('59');
  const [codLimit, setCodLimit] = React.useState('5000');

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    getSiteSettingsAction().then((s) => {
      setCompanyName(s.company_name);
      setGstin(s.gstin === 'Not yet registered — add GSTIN here when available' ? '' : s.gstin);
      setGstEnabled(s.gst_enabled);
      setRazorpayEnabled(s.razorpay_enabled);
      setFreeShippingThreshold(String(Math.round(s.free_shipping_threshold_paise / 100)));
      setBaseShippingFee(String(Math.round(s.base_shipping_paise / 100)));
      setCodLimit(String(Math.round(s.cod_max_limit_paise / 100)));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const savedGstin = gstin.trim() || 'Not yet registered — add GSTIN here when available';

    await updateSiteSettingAction('company_name', companyName);
    await updateSiteSettingAction('gstin', savedGstin);
    await updateSiteSettingAction('gst_enabled', gstEnabled && Boolean(gstin.trim()));
    await updateSiteSettingAction('razorpay_enabled', razorpayEnabled);
    await updateSiteSettingAction('free_shipping_threshold_paise', Number(freeShippingThreshold) * 100);
    await updateSiteSettingAction('base_shipping_paise', Number(baseShippingFee) * 100);
    await updateSiteSettingAction('cod_max_limit_paise', Number(codLimit) * 100);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Store Configuration & Compliance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage Indian DPDP Act 2023 compliance, GST details, shipping thresholds, and Razorpay payment toggle.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-700">
          <CheckCircle2 size={18} />
          <span>Store settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company & GST Details */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <Building2 size={18} className="text-purple-700" /> Legal Entity & GST Registration Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Registered Business Name</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-slate-50 border-slate-300 h-10 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">GSTIN Number (Tamil Nadu - 33)</label>
              <Input
                value={gstin}
                placeholder="Not yet registered — add GSTIN here when available"
                onChange={(e) => setGstin(e.target.value)}
                className="bg-slate-50 border-slate-300 h-10 font-mono text-xs focus:border-purple-600 focus:ring-purple-600"
              />
              <p className="text-[10px] text-slate-500">Leave empty to stay in Bill of Supply / Sale Receipt mode.</p>
            </div>

            {/* GST Enable Toggle */}
            <div className="sm:col-span-2 flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Enable Full GST Invoicing (`gst_enabled`)</p>
                <p className="text-[11px] text-slate-500">
                  When enabled (with a valid GSTIN), customer invoices automatically render CGST/SGST/IGST breakdown tax invoices.
                </p>
              </div>
              <input
                type="checkbox"
                checked={gstEnabled}
                disabled={!gstin.trim()}
                onChange={(e) => setGstEnabled(e.target.checked)}
                className="w-5 h-5 accent-purple-700 cursor-pointer"
              />
            </div>
            {!gstin.trim() && (
              <p className="sm:col-span-2 text-[11px] text-amber-700 flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={14} /> Add a valid GSTIN above to unlock GST activation.
              </p>
            )}
          </div>
        </div>

        {/* Payments Config */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <CreditCard size={18} className="text-purple-700" /> Razorpay Payment Gateway Toggle (`razorpay_enabled`)
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Enable Razorpay Online Payments</p>
                <p className="text-[11px] text-slate-500">
                  When disabled (or missing API keys), checkout operates strictly in Cash on Delivery (COD) mode.
                </p>
              </div>
              <input
                type="checkbox"
                checked={razorpayEnabled}
                onChange={(e) => setRazorpayEnabled(e.target.checked)}
                className="w-5 h-5 accent-purple-700 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">COD Max Order Value Limit (₹)</label>
              <Input
                type="number"
                value={codLimit}
                onChange={(e) => setCodLimit(e.target.value)}
                className="bg-slate-50 border-slate-300 h-10 font-mono w-full sm:w-1/2 focus:border-purple-600 focus:ring-purple-600"
              />
              <p className="text-[10px] text-slate-500">Orders above this threshold require online payment.</p>
            </div>
          </div>
        </div>

        {/* Shipping Thresholds */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <Truck size={18} className="text-purple-700" /> Shipping Charges & Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Free Shipping Minimum Threshold (₹)</label>
              <Input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="bg-slate-50 border-slate-300 h-10 font-mono focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Standard Delivery Charge (₹)</label>
              <Input
                type="number"
                value={baseShippingFee}
                onChange={(e) => setBaseShippingFee(e.target.value)}
                className="bg-slate-50 border-slate-300 h-10 font-mono focus:border-purple-600 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl h-11 px-8 shadow-md shadow-purple-900/20 flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving Settings...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
