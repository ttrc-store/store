'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CADViewerDynamic } from '@/components/cad/cad-viewer-client';
import {
  Box,
  Download,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Send,
  Loader2,
  DollarSign,
  ArrowLeft,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

export default function AdminCADReviewAndQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<any | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);

  // Quotation Builder State (in integer paise)
  const [materialCostPaise, setMaterialCostPaise] = useState<number>(15000); // ₹150
  const [machineCostPaise, setMachineCostPaise] = useState<number>(25000); // ₹250
  const [labourCostPaise, setLabourCostPaise] = useState<number>(10000); // ₹100
  const [supportCostPaise, setSupportCostPaise] = useState<number>(5000); // ₹50
  const [finishingCostPaise, setFinishingCostPaise] = useState<number>(5000); // ₹50
  const [packagingCostPaise, setPackagingCostPaise] = useState<number>(5000); // ₹50
  const [shippingCostPaise, setShippingCostPaise] = useState<number>(10000); // ₹100
  const [leadTimeDays, setLeadTimeDays] = useState<number>(3);
  const [validityDays, setValidityDays] = useState<number>(14);
  const [technicalRemarks, setTechnicalRemarks] = useState<string>('');
  const [assignedPrinter, setAssignedPrinter] = useState<string>('');
  const [submittingQuote, setSubmittingQuote] = useState<boolean>(false);

  // Clarification Message State
  const [clarificationText, setClarificationText] = useState<string>('');
  const [sendingQuery, setSendingQuery] = useState<boolean>(false);

  // Status Updates State
  const [selectedProdStatus, setSelectedProdStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/admin/3d-printing/requests/${id}`);
      if (!res.ok) throw new Error('Failed to load request data.');
      const data = await res.json();
      setRequest(data.request);
      setQuotes(data.quotes || []);
      setSelectedProdStatus(data.request.production_status);
      if (data.request.assigned_printer_name) {
        setAssignedPrinter(data.request.assigned_printer_name);
      }

      // Fetch active printer fleet
      const printerRes = await fetch('/api/admin/3d-printing/printers');
      if (printerRes.ok) {
        const printerData = await printerRes.json();
        setPrinters(printerData.printers || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Derived Tax and Total
  const subtotalPaise =
    materialCostPaise +
    machineCostPaise +
    labourCostPaise +
    supportCostPaise +
    finishingCostPaise +
    packagingCostPaise +
    shippingCostPaise;
  const taxPaise = Math.round(subtotalPaise * 0.18); // 18% GST standard
  const totalPaise = subtotalPaise + taxPaise;

  // Handle Quotation Generation
  const handleIssueQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingQuote(true);

    try {
      const payload = {
        requestId: id,
        materialCostPaise,
        machineCostPaise,
        labourCostPaise,
        supportCostPaise,
        finishingCostPaise,
        packagingCostPaise,
        shippingCostPaise,
        taxPaise,
        totalPaise,
        leadTimeDays,
        validityDays,
        technicalRemarks,
        assignedPrinterName: assignedPrinter || undefined,
      };

      const res = await fetch('/api/admin/3d-printing/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to issue quotation.');
      }

      alert('Quotation successfully issued to customer!');
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Error creating quotation.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Handle Sending Clarification Query
  const handleSendClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationText.trim()) return;
    setSendingQuery(true);

    try {
      const res = await fetch(`/api/admin/3d-printing/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clarificationQuery: clarificationText.trim() }),
      });
      if (!res.ok) throw new Error('Failed to post query.');

      setClarificationText('');
      alert('Clarification request sent to customer. Status transitioned to NEEDS_CLARIFICATION.');
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Error posting query');
    } finally {
      setSendingQuery(false);
    }
  };

  // Handle Production Status Change
  const handleUpdateProdStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/3d-printing/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionStatus: status }),
      });
      if (!res.ok) throw new Error('Failed to update status.');
      setSelectedProdStatus(status);
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-[#E3132A] animate-spin mb-2" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertTriangle className="w-10 h-10 text-[#E3132A] mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Error Loading Request</h3>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  const formatPaise = (p: number) => `₹${(p / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/3d-printing/requests"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">
                CAD Inspection &bull; {request.request_number}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-[#E3132A] border border-red-200">
                {request.quotation_status.replace(/_/g, ' ')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                Prod: {request.production_status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <strong className="text-slate-800">{request.customer.name}</strong> ({request.customer.email}) &bull; {request.customer.city}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Original CAD Button */}
          <a
            href={`/api/3d-printing/cad/${request.file.file_id}`}
            download={request.file.original_filename}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download CAD ({request.file.format})</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Left CAD Viewer & Geometry (7 cols), Right Quotation Builder (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 3D Viewport & Geometric Inspection */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-[#E3132A]" />
              <span>3D Model Inspection Viewport</span>
            </h2>

            <div className="relative w-full h-[460px]">
              <CADViewerDynamic
                fileUrl={`/api/3d-printing/cad/${request.file.file_id}`}
                fileName={request.file.original_filename}
                fileFormat={request.file.format}
                initialUnit={request.file.original_unit || 'mm'}
              />
            </div>
          </div>

          {/* Technical Analysis & Mesh Verification Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-100">
              CAD Dimensional &amp; Mesh Validation Report
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
              <div className="bg-slate-50 p-2 rounded">
                <span className="text-slate-500 block text-[10px]">X (Length)</span>
                <strong className="text-slate-900 text-sm">{request.analysis.normalized_dimensions_mm.x} mm</strong>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="text-slate-500 block text-[10px]">Y (Width)</span>
                <strong className="text-slate-900 text-sm">{request.analysis.normalized_dimensions_mm.y} mm</strong>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="text-slate-500 block text-[10px]">Z (Height)</span>
                <strong className="text-slate-900 text-sm">{request.analysis.normalized_dimensions_mm.z} mm</strong>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="text-slate-500 block text-[10px]">Solid Volume</span>
                <strong className="text-slate-900 text-sm">
                  {request.analysis.volume_cm3 !== null ? `${request.analysis.volume_cm3} cm³` : 'N/A'}
                </strong>
              </div>
            </div>

            <div className="space-y-1.5 text-slate-600 mb-4">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Surface Area:</span>
                <strong className="text-slate-800">{request.analysis.surface_area_cm2} cm²</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Triangle Count:</span>
                <strong className="text-slate-800">{request.analysis.triangle_count.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Watertight / Manifold:</span>
                <strong className={request.analysis.is_watertight && request.analysis.is_manifold ? 'text-emerald-600' : 'text-amber-600'}>
                  {request.analysis.is_watertight && request.analysis.is_manifold ? 'Verified Watertight Solid' : 'Open Boundaries Detected'}
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Separate Solid Shells:</span>
                <strong className="text-slate-800">{request.analysis.shell_count || 1}</strong>
              </div>
            </div>

            {request.analysis.warnings && request.analysis.warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Geometry Warnings:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {request.analysis.warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Clarification Chat Thread */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#E3132A]" />
              <span>Customer Technical Clarification Thread</span>
            </h3>

            {request.clarification_thread && request.clarification_thread.length > 0 ? (
              <div className="space-y-3 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                {request.clarification_thread.map((msg: any, i: number) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg ${
                      msg.sender === 'admin'
                        ? 'bg-red-50 text-red-950 font-medium ml-4 border border-red-100'
                        : 'bg-white text-slate-800 border border-slate-200 mr-4'
                    }`}
                  >
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <strong>{msg.sender === 'admin' ? 'TTRC Admin' : request.customer.name}</strong>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p>{msg.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 mb-3 italic text-[11px]">No questions exchanged yet.</p>
            )}

            <form onSubmit={handleSendClarification} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Ask customer to clarify wall thickness, orientation, or finish..."
                value={clarificationText}
                onChange={(e) => setClarificationText(e.target.value)}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#E3132A]"
              />
              <button
                type="submit"
                disabled={sendingQuery || !clarificationText.trim()}
                className="px-4 py-2 bg-[#E3132A] hover:bg-[#B80F21] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {sendingQuery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Ask</span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Fleet Compatibility & Manual Quotation Engine */}
        <div className="lg:col-span-5 space-y-6">
          {/* Machine Assignment & Compatibility */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#E3132A]" />
              <span>Printer Fleet Compatibility</span>
            </h3>

            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Assign Manufacturing Machine:
              </label>
              <select
                value={assignedPrinter}
                onChange={(e) => setAssignedPrinter(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#E3132A]"
              >
                <option value="">-- Select Printer --</option>
                {printers.map((p) => {
                  const vol = p.build_volume_mm;
                  const fits =
                    request.analysis.normalized_dimensions_mm.x <= vol.x &&
                    request.analysis.normalized_dimensions_mm.y <= vol.y &&
                    request.analysis.normalized_dimensions_mm.z <= vol.z;
                  return (
                    <option key={p._id.toString()} value={p.name}>
                      {p.name} ({vol.x}&times;{vol.y}&times;{vol.z}mm) {fits ? '✅ Fits' : '⚠️ Size Warning'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg space-y-1">
              <div>
                <strong>Customer Config:</strong> {request.configuration.material} ({request.configuration.color})
              </div>
              <div>
                <strong>Layer Height:</strong> {request.configuration.layer_height} mm &bull; Infill: {request.configuration.infill_percentage}% ({request.configuration.infill_pattern})
              </div>
              <div>
                <strong>Quantity:</strong> {request.configuration.quantity} Piece(s)
              </div>
            </div>
          </div>

          {/* Quotation Builder Card */}
          <form onSubmit={handleIssueQuotation} className="bg-white border-2 border-[#E3132A] rounded-xl p-5 shadow-sm text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#E3132A]" />
                <span>Manual Quotation Builder</span>
              </h3>
              <span className="text-[10px] uppercase font-bold text-slate-400">Integer Paise</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Material Cost (paise):
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={materialCostPaise}
                  onChange={(e) => setMaterialCostPaise(parseInt(e.target.value) || 0)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                />
                <span className="text-[10px] text-slate-400">{formatPaise(materialCostPaise)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Machine Runtime (paise):
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={machineCostPaise}
                  onChange={(e) => setMachineCostPaise(parseInt(e.target.value) || 0)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                />
                <span className="text-[10px] text-slate-400">{formatPaise(machineCostPaise)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Labor &amp; Prep (paise):
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={labourCostPaise}
                  onChange={(e) => setLabourCostPaise(parseInt(e.target.value) || 0)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                />
                <span className="text-[10px] text-slate-400">{formatPaise(labourCostPaise)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Post-Processing (paise):
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={finishingCostPaise}
                  onChange={(e) => setFinishingCostPaise(parseInt(e.target.value) || 0)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                />
                <span className="text-[10px] text-slate-400">{formatPaise(finishingCostPaise)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Packaging &amp; Shipping:
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={shippingCostPaise}
                  onChange={(e) => setShippingCostPaise(parseInt(e.target.value) || 0)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                />
                <span className="text-[10px] text-slate-400">{formatPaise(shippingCostPaise)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Tax GST 18% (paise):
                </label>
                <input
                  type="number"
                  min={0}
                  value={taxPaise}
                  readOnly
                  className="w-full text-xs bg-slate-100 border border-slate-200 rounded p-1.5 font-bold"
                />
                <span className="text-[10px] text-slate-400">{formatPaise(taxPaise)}</span>
              </div>
            </div>

            {/* Total Display */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#E3132A] block">
                  Total Payable Amount
                </span>
                <span className="text-xl font-extrabold text-[#E3132A]">
                  {formatPaise(totalPaise)}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-600">
                Lead Time: <strong>{leadTimeDays} Days</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Lead Time (Days):
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 3)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Quote Validity (Days):
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value) || 14)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                Engineer Remarks / Advice:
              </label>
              <textarea
                rows={2}
                placeholder="Orientation recommendation, support removal notes..."
                value={technicalRemarks}
                onChange={(e) => setTechnicalRemarks(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-[#E3132A]"
              />
            </div>

            <button
              type="submit"
              disabled={submittingQuote || totalPaise <= 0}
              className="w-full py-2.5 bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submittingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>Issue Official Quotation</span>
            </button>
          </form>

          {/* Production Lifecycle Status Management */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-slate-700" />
              <span>Production Lifecycle Controller</span>
            </h3>

            <div className="flex gap-2">
              <select
                value={selectedProdStatus}
                onChange={(e) => setSelectedProdStatus(e.target.value)}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900"
              >
                <option value="NOT_STARTED">NOT_STARTED</option>
                <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
                <option value="PAID">PAID</option>
                <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>

              <button
                type="button"
                disabled={updatingStatus || selectedProdStatus === request.production_status}
                onClick={() => handleUpdateProdStatus(selectedProdStatus)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

