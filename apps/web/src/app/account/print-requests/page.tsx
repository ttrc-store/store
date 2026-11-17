import React from 'react';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PrintRequestModel } from '@/lib/mongodb/models';
import { Box, ArrowRight, Clock, Plus, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'My 3D Print Requests | TTRC Store',
};

export default async function CustomerPrintRequestsPage() {
  const auth = await requireAuth();
  if ('error' in auth) {
    return null;
  }

  await connectToDatabase();
  const userId = auth.user.id;
  const email = auth.user.email.toLowerCase();

  const requests = await PrintRequestModel.find({
    $or: [{ user_id: userId }, { 'customer.email': email }],
  })
    .sort({ created_at: -1 })
    .lean();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">3D Print Quotations &amp; Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your custom CAD model print requests, quotations, and manufacturing status.
          </p>
        </div>
        <Link
          href="/3d-printing/request"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E3132A] hover:bg-[#B80F21] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New 3D Print Request</span>
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E3132A] flex items-center justify-center mx-auto mb-4">
            <Box className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No 3D print requests yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Upload your STL or STEP files to receive precision FDM manufacturing quotations from our engineering team.
          </p>
          <Link
            href="/3d-printing/request"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E3132A] hover:bg-[#B80F21] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <span>Upload CAD Model</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <div
              key={req._id.toString()}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-slate-900">{req.request_number}</strong>
                  <span className="text-[11px] text-slate-500">
                    &bull; {new Date(req.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </span>
                </div>
                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">{req.file.original_filename}</span> ({req.file.format}) &bull;{' '}
                  <span className="text-slate-600">{req.configuration.material} ({req.configuration.color})</span> &bull;{' '}
                  <span className="font-bold text-[#E3132A]">{req.configuration.quantity} Unit(s)</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Dimensions: {req.analysis.normalized_dimensions_mm.x} &times; {req.analysis.normalized_dimensions_mm.y} &times; {req.analysis.normalized_dimensions_mm.z} mm
                  {req.analysis.volume_cm3 && ` | Vol: ${req.analysis.volume_cm3} cm³`}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status</span>
                  <div className="flex gap-1.5 mt-0.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-[#E3132A] border border-red-200">
                      {req.quotation_status.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {req.production_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/3d-printing/quote/${req._id.toString()}`}
                  className="px-4 py-2 bg-slate-100 hover:bg-[#E3132A] hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>Track</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
