import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb/client';
import { PrintRequestModel, PrintPrinterModel, PrintMaterialModel } from '@/lib/mongodb/models';
import {
  Box,
  Clock,
  CheckCircle2,
  FileText,
  Truck,
  ArrowRight,
  Settings,
  Cpu,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '3D Printing CAD Management | TTRC Store Admin',
};

export default async function AdminThreeDPrintingOverviewPage() {
  await requireAdmin();
  await connectToDatabase();

  const totalRequests = await PrintRequestModel.countDocuments();
  const pendingReview = await PrintRequestModel.countDocuments({ quotation_status: 'PENDING_REVIEW' });
  const underReview = await PrintRequestModel.countDocuments({ quotation_status: 'UNDER_REVIEW' });
  const quotesSent = await PrintRequestModel.countDocuments({ quotation_status: 'QUOTE_SENT' });
  const accepted = await PrintRequestModel.countDocuments({ quotation_status: 'ACCEPTED' });
  const inProduction = await PrintRequestModel.countDocuments({ production_status: 'IN_PRODUCTION' });
  const dispatched = await PrintRequestModel.countDocuments({ production_status: 'DISPATCHED' });

  const recentRequests = await PrintRequestModel.find()
    .sort({ created_at: -1 })
    .limit(10)
    .lean();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            3D Printing &amp; CAD Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage CAD geometry analysis, printer fleet allocation, manual quotations, and manufacturing queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/3d-printing/printers"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Cpu className="w-4 h-4 text-[#844AFB]" />
            <span>Printer Fleet</span>
          </Link>

          <Link
            href="/admin/3d-printing/materials"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-[#844AFB]" />
            <span>Materials Catalog</span>
          </Link>

          <Link
            href="/admin/3d-printing/requests"
            className="px-4 py-2 bg-[#844AFB] hover:bg-[#6721F2] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            All Requests ({totalRequests})
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900">{pendingReview}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting first review</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Under Review</span>
            <Box className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900">{underReview}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">In CAD inspection</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Quotes Sent</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-black text-slate-900">{quotesSent}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Issued to customer</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Accepted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-slate-900">{accepted}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Ready for checkout</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">In Production</span>
            <Cpu className="w-4 h-4 text-[#844AFB]" />
          </div>
          <span className="text-2xl font-black text-slate-900">{inProduction}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">On printer bed</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Dispatched</span>
            <Truck className="w-4 h-4 text-slate-700" />
          </div>
          <span className="text-2xl font-black text-slate-900">{dispatched}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Shipped via courier</span>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Box className="w-4 h-4 text-[#844AFB]" />
            <span>Recent Quotation Requests</span>
          </h2>
          <Link
            href="/admin/3d-printing/requests"
            className="text-xs font-semibold text-[#844AFB] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No 3D print requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Ref &bull; Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Model &bull; Format</th>
                  <th className="p-3">Config</th>
                  <th className="p-3">Dimensions</th>
                  <th className="p-3">Quote Status</th>
                  <th className="p-3">Prod Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((r: any) => (
                  <tr key={r._id.toString()} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-medium">
                      <span className="font-bold text-slate-900 block">{r.request_number}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="p-3">
                      <strong className="text-slate-800 block">{r.customer.name}</strong>
                      <span className="text-[11px] text-slate-500">{r.customer.city}</span>
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
                      <span className="font-semibold text-slate-800">{r.configuration.material}</span>{' '}
                      ({r.configuration.color})
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

