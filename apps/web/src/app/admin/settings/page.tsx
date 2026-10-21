'use client';

import * as React from 'react';
import {
  Save,
  CheckCircle2,
  Truck,
  CreditCard,
  Building2,
  AlertTriangle,
  Lock,
  Receipt,
  FileCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSiteSettingsAction, updateSiteSettingAction, SiteSettings } from '@/actions/settings';

export default function AdminSettingsPage() {
  const [companyName, setCompanyName] = React.useState('Tamizh Tech');
  const [gstin, setGstin] = React.useState('');
  const [gstEnabled, setGstEnabled] = React.useState(false);
  const [razorpayEnabled, setRazorpayEnabled] = React.useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = React.useState('999');
  const [baseShippingFee, setBaseShippingFee] = React.useState('120');
  const [codLimit, setCodLimit] = React.useState('5000');

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Reauth confirmation modal state for sensitive settings
  const [showReauthModal, setShowReauthModal] = React.useState(false);
  const [adminPassword, setAdminPassword] = React.useState('');
  const [reauthError, setReauthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getSiteSettingsAction().then((s) => {
      setCompanyName(s.company_name);
      setGstin(s.gstin === 'Not yet registered — add GSTIN here when available' ? '' : s.gstin);
      setGstEnabled(Boolean(s.gst_enabled));
      setRazorpayEnabled(s.razorpay_enabled);
      setFreeShippingThreshold(String(Math.round(s.free_shipping_threshold_paise / 100)));
      setBaseShippingFee(String(Math.round(s.base_shipping_paise / 100)));
      setCodLimit(String(Math.round(s.cod_max_limit_paise / 100)));
    });
  }, []);

  const saveAllSettings = async (pwd?: string) => {
    setSaving(true);
    setErrorMessage(null);
    setReauthError(null);

    const savedGstin = gstin.trim() || 'Not yet registered — add GSTIN here when available';
    const isEnablingGst = gstEnabled;

    if (isEnablingGst && (!gstin.trim() || gstin.includes('Not yet registered'))) {
      setSaving(false);
      setErrorMessage('A valid 15-character GSTIN is required before GST invoicing can be enabled.');
      return;
    }

    const payload: Array<{ key: keyof SiteSettings; value: unknown }> = [
      { key: 'company_name', value: companyName },
      { key: 'gstin', value: savedGstin },
      { key: 'gst_enabled', value: isEnablingGst },
      { key: 'razorpay_enabled', value: razorpayEnabled },
      { key: 'free_shipping_threshold_paise', value: Number(freeShippingThreshold) * 100 },
      { key: 'base_shipping_paise', value: Number(baseShippingFee) * 100 },
      { key: 'cod_max_limit_paise', value: Number(codLimit) * 100 },
    ];

    for (const item of payload) {
      const res = await updateSiteSettingAction(item.key, item.value, pwd);
      if (res.error) {
        setSaving(false);
        if ('requiresReauth' in res && res.requiresReauth) {
          setShowReauthModal(true);
          setReauthError('Administrator password confirmation required to change financial settings.');
          return;
        }
        setErrorMessage(res.error);
        return;
      }
    }

    setSaving(false);
    setSaved(true);
    setShowReauthModal(false);
    setAdminPassword('');
    setTimeout(() => setSaved(false), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAllSettings();
  };

  const handleConfirmReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setReauthError('Please enter your administrator password.');
      return;
    }
    await saveAllSettings(adminPassword);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Store Configuration & Compliance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure GST tax calculation, Bill of Supply mode, legal business entity details, and payment gateway options.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800 font-semibold shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Store settings saved successfully! {gstEnabled ? 'GST tax calculation is enabled.' : 'GST is disabled (Bill of Supply mode active).'}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-800 font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-800 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company & GST Details */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-[#844AFB]" /> Legal Entity & GST Configuration
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
                gstEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {gstEnabled ? <FileCheck size={13} /> : <Receipt size={13} />}
              {gstEnabled ? 'GST Invoicing Active' : 'GST Disabled (Bill of Supply)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Registered Business Name</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-slate-50 border-slate-300 h-10 focus:border-[#844AFB] focus:ring-[#844AFB]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">GSTIN Number (Tamil Nadu - 33)</label>
              <Input
                value={gstin}
                placeholder="Not yet registered — add GSTIN here when available"
                onChange={(e) => {
                  setGstin(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="bg-slate-50 border-slate-300 h-10 font-mono text-xs focus:border-[#844AFB] focus:ring-[#844AFB]"
              />
              <p className="text-[10px] text-slate-500">
                {gstin.trim()
                  ? '15-character Indian Goods and Services Tax Identification Number.'
                  : 'Leave empty to run the store in official Bill of Supply / Sale Receipt mode.'}
              </p>
            </div>

            {/* GST Enable / Disable Master Toggle */}
            <div
              className={`sm:col-span-2 p-4 rounded-xl border transition-all ${
                gstEnabled
                  ? 'bg-purple-50/40 border-purple-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">
                      Enable GST Invoicing & Tax Calculation (`gst_enabled`)
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        gstEnabled
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {gstEnabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {gstEnabled ? (
                      <span className="text-purple-900 font-medium">
                        Active: Taxes (CGST/SGST for Tamil Nadu, IGST for other states) are calculated and added to customer bills, cart totals, and checkout. Invoices are generated as official GST Tax Invoices.
                      </span>
                    ) : (
                      <span className="text-slate-600">
                        Disabled: <strong>Zero GST is added</strong> anywhere. Product prices are plain prices. Cart and checkout totals equal <code>Subtotal + Shipping - Discount</code> without any tax added. Invoices generate as clean <strong>Bills of Supply / Sale Receipts</strong>.
                      </span>
                    )}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={gstEnabled}
                    onChange={(e) => {
                      const willEnable = e.target.checked;
                      if (willEnable && !gstin.trim()) {
                        setErrorMessage('Please enter a valid 15-character GSTIN above before enabling GST invoicing.');
                        return;
                      }
                      setGstEnabled(willEnable);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#844AFB]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#844AFB]" />
                </label>
              </div>

              {!gstin.trim() && !gstEnabled && (
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-[11px] text-slate-600">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <span>
                    No GSTIN entered. The store is safely running in <strong>Bill of Supply mode</strong>. To enable GST in the future, enter your GSTIN and switch this toggle on.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payments Config */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <CreditCard size={18} className="text-[#844AFB]" /> Razorpay Payment Gateway Toggle (`razorpay_enabled`)
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Enable Razorpay Online Payments</p>
                <p className="text-[11px] text-slate-500">
                  Razorpay is the sole payment gateway for TTRC Store. When disabled or keys are missing, customer checkout shows a clear temporary offline notice.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={razorpayEnabled}
                  onChange={(e) => setRazorpayEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#844AFB]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#844AFB]" />
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 text-purple-900">
              <p className="font-bold text-[11px]">Online Payment Policy Enforcement</p>
              <p className="text-[10px] text-purple-700 mt-0.5">
                Cash on Delivery (COD) is permanently disabled across the storefront. All checkouts require verified online payment via UPI, Cards, NetBanking, or EMI.
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Thresholds */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <Truck size={18} className="text-[#844AFB]" /> Shipping Charges & Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Free Shipping Minimum Threshold (₹)</label>
              <Input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="bg-slate-50 border-slate-300 h-10 font-mono focus:border-[#844AFB] focus:ring-[#844AFB]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Standard Delivery Charge (₹)</label>
              <Input
                type="number"
                value={baseShippingFee}
                onChange={(e) => setBaseShippingFee(e.target.value)}
                className="bg-slate-50 border-slate-300 h-10 font-mono focus:border-[#844AFB] focus:ring-[#844AFB]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#844AFB] hover:bg-[#6e3cd4] text-white font-bold text-xs rounded-xl h-11 px-8 shadow-md shadow-purple-900/20 flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving Settings...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      {/* Sensitive Reauthentication Modal (SEC-06) */}
      {showReauthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-[#844AFB] flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Confirm Admin Password
                </h3>
                <p className="text-[11px] text-slate-500">
                  Changing sensitive store settings requires recent administrator verification.
                </p>
              </div>
            </div>

            {reauthError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {reauthError}
              </div>
            )}

            <form onSubmit={handleConfirmReauth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Your Administrator Password</label>
                <Input
                  type="password"
                  autoFocus
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="bg-slate-50 border-slate-300 h-10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowReauthModal(false);
                    setAdminPassword('');
                    setReauthError(null);
                  }}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !adminPassword}
                  className="bg-[#844AFB] hover:bg-[#6e3cd4] text-white text-xs font-bold"
                >
                  {saving ? 'Verifying & Saving...' : 'Confirm & Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
