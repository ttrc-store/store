import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PrintRequestModel } from '@/lib/mongodb/models';
import { Box, ArrowLeft, Filter, Search, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'All Print Quotation Requests | TTRC Store Admin',
};

export default async function AdminAllPrintRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  await requireAdmin();
  await connectToDatabase();

  const { status, search } = await searchParams;

  const query: any = {};
  if (status && status !== 'ALL') {
    query.quotation_status = status;
  }
  if (search) {
    query.$or = [
      { request_number: { $regex: search, $options: 'i' } },
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'customer.email': { $regex: search, $options: 'i' } },
      { 'customer.city': { $regex: search, $options: 'i' } },
      { 'file.original_filename': { $regex: search, $options: 'i' } },
    ];
  }

  const requests = await PrintRequestModel.find(query).sort({ created_at: -1 }).lean();

  const statuses = [
    'ALL',
    'PENDING_REVIEW',
    'UNDER_REVIEW',
    'NEEDS_CLARIFICATION',
    'QUOTE_SENT',
    'REVISION_REQUESTED',
    'ACCEPTED',
    'REJECTED',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/3d-printing"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Customer 3D Print Quotation Requests
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Found {requests.length} request(s) matching current criteria.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/3d-printing/requests?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              (status || 'ALL') === s
                ? 'bg-[#844AFB] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No requests found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Ref &bull; Date</th>
                  <th className="p-3">Customer Details</th>
                  <th className="p-3">Model &bull; Format</th>
                  <th className="p-3">Material &bull; Infill</th>
                  <th className="p-3">Dimensions</th>
                  <th className="p-3">Quote Status</th>
                  <th className="p-3">Prod Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r: any) => (
                  <tr key={r._id.toString()} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-medium">
                      <span className="font-bold text-slate-900 block">{r.request_number}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="p-3">
                      <strong className="text-slate-800 block">{r.customer.name}</strong>
                      <span className="text-[11px] text-slate-500">{r.customer.email}</span>
                      <span className="text-[10px] text-slate-400 block">{r.customer.city}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-900 truncate max-w-[150px] block">
                        {r.file.original_filename}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">
                        {r.file.format} &bull; {(r.file.file_size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800">{r.configuration.material}</span> ({r.configuration.color})
                      <span className="text-[10px] text-[#844AFB] font-bold block">
                        Qty: {r.configuration.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 font-mono">
                      {r.analysis.normalized_dimensions_mm.x} &times; {r.analysis.normalized_dimensions_mm.y} &times; {r.analysis.normalized_dimensions_mm.z} mm
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EEE8FA] text-[#844AFB] border border-[#AF87F8]/40">
                        {r.quotation_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {r.production_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/3d-printing/requests/${r._id.toString()}`}
                        className="px-3 py-1.5 bg-[#844AFB] hover:bg-[#6721F2] text-white text-[11px] font-bold rounded-lg transition-colors inline-block shadow-xs"
                      >
                        Inspect &amp; Quote
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

