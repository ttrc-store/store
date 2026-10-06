'use client';

import * as React from 'react';
import { MapPin, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PincodeResult {
  pincode: string;
  isServiceable: boolean;
  city?: string;
  state?: string;
  estimatedDays?: string;
  courierName?: string;
  codAvailable?: boolean;
}

export function PincodeChecker() {
  const [pincode, setPincode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<PincodeResult | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setResult({
        pincode,
        isServiceable: false,
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/pincode/check?pincode=${encodeURIComponent(pincode)}`);
      const data = await res.json();
      if (res.ok && data.isServiceable) {
        setResult(data);
      } else {
        setResult({
          pincode,
          isServiceable: false,
        });
      }
    } catch {
      setResult({
        pincode,
        isServiceable: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
        <MapPin size={16} className="text-[#844AFB]" />
        <span>Check Delivery &amp; Pincode Serviceability</span>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter 6-digit Pincode (e.g. 641001)"
          value={pincode}
          maxLength={6}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
          className="bg-white border-slate-200 text-sm h-10 text-slate-900 focus:border-[#844AFB] focus:ring-[#844AFB]"
        />
        <Button
          type="submit"
          disabled={loading || pincode.length !== 6}
          variant="outline"
          className="h-10 px-4 text-xs font-bold whitespace-nowrap border-[#844AFB] text-[#844AFB] hover:bg-purple-50"
        >
          {loading ? 'Checking...' : 'Check'}
        </Button>
      </form>

      {result && (
        <div className="pt-2 text-xs border-t border-slate-200">
          {result.isServiceable ? (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>Serviceable to {result.city} ({result.pincode})</span>
              </p>
              <div className="flex items-center gap-2 text-slate-600 pl-5">
                <Truck size={14} className="text-[#844AFB]" />
                <span>Estimated Delivery: <strong className="text-slate-900">{result.estimatedDays}</strong> via {result.courierName}</span>
              </div>
              {result.codAvailable && (
                <p className="pl-5 text-[11px] text-slate-500">⚡ Cash on Delivery Available</p>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-1.5 font-semibold text-rose-600">
              <AlertCircle size={15} />
              <span>Please enter a valid 6-digit Indian Pincode.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
