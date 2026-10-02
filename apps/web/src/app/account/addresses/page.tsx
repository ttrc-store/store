'use client';

import * as React from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getAddressesAction,
  addAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from '@/actions/account';

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [pincode, setPincode] = React.useState('');
  const [city, setCity] = React.useState('Coimbatore');
  const [state, setState] = React.useState('Tamil Nadu');

  const loadAddresses = React.useCallback(async () => {
    setLoading(true);
    const res = await getAddressesAction();
    if ('addresses' in res) {
      setAddresses(res.addresses ?? []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setPincode(val);
    if (val.length === 6) {
      if (val.startsWith('60') || val.startsWith('64')) {
        setCity('Coimbatore');
        setState('Tamil Nadu');
      } else if (val.startsWith('56')) {
        setCity('Bengaluru');
        setState('Karnataka');
      } else if (val.startsWith('40')) {
        setCity('Mumbai');
        setState('Maharashtra');
      } else if (val.startsWith('11')) {
        setCity('New Delhi');
        setState('Delhi');
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('city', city);
    formData.set('state', state);

    const res = await addAddressAction(formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setShowAddForm(false);
      setPincode('');
      await loadAddresses();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this delivery address?')) return;
    await deleteAddressAction(id);
    await loadAddresses();
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddressAction(id);
    await loadAddresses();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="text-red-600" size={22} />
            Address Book
          </h2>
          <p className="text-xs text-slate-500">Save delivery addresses for quick 1-click checkout</p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-red-600 text-white font-bold text-xs hover:bg-red-700 rounded-full shadow-sm"
        >
          <Plus size={16} className="mr-1" />
          Add New Address
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600 font-semibold">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add New Address Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900">Add Delivery Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Full Name</label>
              <Input name="fullName" required placeholder="Recipient Name" className="bg-slate-50 border-slate-200 h-10 focus:border-red-600 focus:ring-red-600" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Phone Number</label>
              <Input name="phone" required placeholder="+91 98765 43210" className="bg-slate-50 border-slate-200 h-10 focus:border-red-600 focus:ring-red-600" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Street Address &amp; Landmark</label>
              <Input name="line1" required placeholder="House/Flat No., Building Name, Street" className="bg-slate-50 border-slate-200 h-10 focus:border-red-600 focus:ring-red-600" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Pincode</label>
              <Input
                name="pincode"
                value={pincode}
                onChange={handlePincodeChange}
                maxLength={6}
                required
                placeholder="6-digit Indian Pincode"
                className="bg-slate-50 border-slate-200 h-10 font-mono focus:border-red-600 focus:ring-red-600"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">City &amp; State (Auto-filled)</label>
              <Input value={`${city}, ${state}`} readOnly className="bg-slate-100 border-slate-200 h-10 text-slate-500 cursor-not-allowed" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isDefault" name="isDefault" value="true" className="rounded text-red-600 focus:ring-red-600" />
            <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700">Set as Default Delivery Address</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddForm(false)}
              className="border-slate-200 text-slate-700 text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-red-600 text-white font-bold text-xs hover:bg-red-700 rounded-full shadow-sm">
              {submitting ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </form>
      )}

      {/* Address List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading saved addresses...</div>
      ) : addresses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 relative hover:border-red-200 transition-colors">
              <div className="flex items-center justify-between">
                {addr.is_default ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 size={12} /> Default Address
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[11px] font-bold text-slate-500 hover:text-red-600 underline"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                  title="Delete address"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
                <p className="font-bold text-slate-900 text-sm">{addr.full_name}</p>
                <p>{addr.line1} {addr.line2 ? `, ${addr.line2}` : ''}</p>
                <p>{addr.city}, {addr.state} — {addr.pincode}</p>
                <p className="text-slate-500 font-mono pt-1">Phone: {addr.phone}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 space-y-2">
          <MapPin size={28} className="mx-auto text-slate-400 opacity-60" />
          <p className="text-sm font-bold text-slate-900">No Saved Addresses</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            You haven&apos;t saved any shipping addresses yet. Add your address for faster checkout!
          </p>
        </div>
      )}
    </div>
  );
}
