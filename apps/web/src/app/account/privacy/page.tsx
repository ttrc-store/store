'use client';

import * as React from 'react';
import { ShieldCheck, Download, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPersonalDataExportAction, requestAccountDeletionAction } from '@/actions/account';

export default function AccountPrivacyPage() {
  const [downloading, setDownloading] = React.useState(false);
  const [requestingDeletion, setRequestingDeletion] = React.useState(false);
  const [deletionMessage, setDeletionMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleExportData = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await getPersonalDataExportAction();
      if ('error' in res && res.error) {
        setError(res.error);
      } else if (res.exportData) {
        const blob = new Blob([JSON.stringify(res.exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ttrc-dpdp-data-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to generate personal data export.');
    }
    setDownloading(false);
  };

  const handleRequestDeletion = async () => {
    if (!confirm('Are you sure you want to request permanent account deletion under DPDP Act 2023?')) {
      return;
    }
    setRequestingDeletion(true);
    setError(null);
    const res = await requestAccountDeletionAction();
    if (res && 'error' in res && typeof res.error === 'string') {
      setError(res.error);
    } else if (res && 'success' in res && typeof res.success === 'string') {
      setDeletionMessage(res.success);
    }
    setRequestingDeletion(false);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="text-[#844AFB]" size={22} />
          Privacy &amp; Data Rights (DPDP Act 2023)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          In accordance with India&apos;s Digital Personal Data Protection Act 2023, you have full control over your personal data.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600 font-semibold">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Export Data Box */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-[#844AFB] border border-purple-200">
            <Download size={20} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900">Export Personal Data</h3>
            <p className="text-xs text-slate-500">
              Download a complete JSON export of your profile, saved addresses, order history, and product reviews.
            </p>
          </div>
        </div>

        <Button
          onClick={handleExportData}
          disabled={downloading}
          variant="outline"
          className="border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 rounded-xl"
        >
          {downloading ? 'Preparing Export...' : 'Download Personal Data (JSON)'}
        </Button>
      </div>

      {/* Delete Account Request Box */}
      <div className="p-6 rounded-2xl bg-red-50/50 border border-red-200 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900">Request Account &amp; Data Deletion</h3>
            <p className="text-xs text-slate-500">
              Permanently remove your account profile, addresses, and wishlist. Historical tax invoices required for statutory GST compliance are retained per legal requirements.
            </p>
          </div>
        </div>

        {deletionMessage ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 size={16} />
            <span>{deletionMessage}</span>
          </div>
        ) : (
          <Button
            onClick={handleRequestDeletion}
            disabled={requestingDeletion}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
          >
            {requestingDeletion ? 'Submitting Request...' : 'Request Permanent Account Deletion'}
          </Button>
        )}
      </div>
    </div>
  );
}
