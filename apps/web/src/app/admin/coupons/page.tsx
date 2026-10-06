'use client';

import * as React from 'react';
import {
  Ticket,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Percent,
  DollarSign,
  Calendar,
  X,
  Power,
} from 'lucide-react';
import {
  getAdminCouponsAction,
  createAdminCouponAction,
  toggleCouponStatusAction,
  deleteAdminCouponAction,
  AdminCouponSummary,
} from '@/actions/admin-coupons';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = React.useState<AdminCouponSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const [form, setForm] = React.useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minOrderRupees: 500,
    maxDiscountRupees: 200,
    usageLimit: 100,
    expiresAt: '',
  });

  const loadCoupons = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminCouponsAction();
      if (res.coupons) {
        setCoupons(res.coupons);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await createAdminCouponAction({
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderPaise: Math.round(Number(form.minOrderRupees) * 100),
        maxDiscountPaise: form.maxDiscountRupees ? Math.round(Number(form.maxDiscountRupees) * 100) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perUserLimit: 1,
        expiresAt: form.expiresAt || undefined,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(res.message || 'Coupon created successfully.');
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess('');
          setForm({
            code: '',
            discountType: 'percentage',
            discountValue: 10,
            minOrderRupees: 500,
            maxDiscountRupees: 200,
            usageLimit: 100,
            expiresAt: '',
          });
          loadCoupons();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await toggleCouponStatusAction(id, !current);
    loadCoupons();
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;
    await deleteAdminCouponAction(id);
    loadCoupons();
  };

  const totalRedemptions = coupons.reduce((sum, c) => sum + c.usageCount, 0);
  const activeCount = coupons.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="text-[#844AFB]" size={26} />
            Coupon Management ({coupons.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative promotional discount codes, usage limits, and redemption statistics.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setSuccess('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#844AFB] hover:bg-[#6721F2] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Coupons</p>
          <p className="font-heading text-2xl font-black text-slate-900 mt-1">{coupons.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Campaigns</p>
          <p className="font-heading text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Redemptions</p>
          <p className="font-heading text-2xl font-black text-[#844AFB] mt-1">{totalRedemptions}</p>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-[#844AFB]" size={28} />
            <p className="text-xs">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Ticket size={20} />
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900">No Coupons Configured</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No promotional coupons exist yet. Click &quot;Create Coupon&quot; to set up your first discount code.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min Order</th>
                  <th className="py-3.5 px-4">Max Cap</th>
                  <th className="py-3.5 px-4">Usage / Limit</th>
                  <th className="py-3.5 px-4">Expiry</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-[#6721F2] border border-purple-200 text-xs tracking-wider">
                        {c.code}
                      </span>
                    </td>

                    {/* Discount */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {c.discountType === 'percentage' ? (
                        <span className="inline-flex items-center gap-1">
                          <Percent size={13} className="text-[#844AFB]" /> {c.discountValue}% OFF
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          ₹{(c.discountValue / 100).toLocaleString('en-IN')} FLAT
                        </span>
                      )}
                    </td>

                    {/* Min Order */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {c.minOrderValuePaise > 0
                        ? `₹${(c.minOrderValuePaise / 100).toLocaleString('en-IN')}`
                        : 'No minimum'}
                    </td>

                    {/* Max Cap */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {c.maxDiscountPaise
                        ? `₹${(c.maxDiscountPaise / 100).toLocaleString('en-IN')}`
                        : 'No cap'}
                    </td>

                    {/* Usage / Limit */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{c.usageCount}</span>
                      <span className="text-slate-400"> / {c.usageLimit || '∞'}</span>
                    </td>

                    {/* Expiry */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {c.expiresAt || 'Never'}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggle(c.id, c.isActive)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border cursor-pointer transition-colors ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <Power size={11} />
                        {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="font-heading font-black text-xl text-slate-900">Create New Coupon</h2>
              <p className="text-xs text-slate-500 mt-1">Configure promotional discount parameters.</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ROBO10"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {form.discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={form.discountType === 'percentage' ? 90 : 10000}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderRupees}
                    onChange={(e) => setForm({ ...form, minOrderRupees: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional ceiling cap"
                    value={form.maxDiscountRupees}
                    onChange={(e) => setForm({ ...form, maxDiscountRupees: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitLoading && <Loader2 size={14} className="animate-spin" />}
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
