'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CADViewerDynamic } from '@/components/cad/cad-viewer-client';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  RotateCcw,
  MessageSquare,
  Send,
  Loader2,
  Box,
  Truck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function CustomerQuoteTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<any | null>(null);
  const [activeQuote, setActiveQuote] = useState<any | null>(null);

  // Clarification reply input
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Revision request modal state
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [requestingRevision, setRequestingRevision] = useState(false);

  // Accept quote loading
  const [acceptingQuote, setAcceptingQuote] = useState(false);

  const fetchRequestDetails = async () => {
    try {
      const res = await fetch(`/api/3d-printing/requests/${id}`);
      if (!res.ok) {
        throw new Error('Failed to load print quotation request.');
      }
      const data = await res.json();
      setRequest(data.request);
      setActiveQuote(data.quote || null);
    } catch (err: any) {
      setError(err.message || 'Error loading request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  // Handle Clarification Message Submission
  const handleSendClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/3d-printing/requests/${id}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });
      if (!res.ok) {
        throw new Error('Failed to send message.');
      }
      setReplyMessage('');
      await fetchRequestDetails();
    } catch (err: any) {
      alert(err.message || 'Error sending reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Handle Request Revision
  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) return;

    setRequestingRevision(true);
    try {
      const res = await fetch(`/api/3d-printing/requests/${id}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: revisionNotes }),
      });
      if (!res.ok) {
        throw new Error('Failed to submit revision request.');
      }
      setShowRevisionModal(false);
      setRevisionNotes('');
      await fetchRequestDetails();
    } catch (err: any) {
      alert(err.message || 'Error requesting revision');
    } finally {
      setRequestingRevision(false);
    }
  };

  // Handle Accept Quote & Convert to Order
  const handleAcceptQuote = async () => {
    setAcceptingQuote(true);
    try {
      const res = await fetch(`/api/3d-printing/requests/${id}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept quotation.');
      }
      // Redirect to checkout or refresh
      if (data.checkoutUrl) {
        router.push(data.checkoutUrl);
      } else {
        await fetchRequestDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Error accepting quote.');
    } finally {
      setAcceptingQuote(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-[#844AFB] animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading Quotation Status...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md text-center shadow-xs">
          <AlertTriangle className="w-12 h-12 text-[#844AFB] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Request Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'This 3D print request does not exist or has expired.'}</p>
          <Link
            href="/3d-printing"
            className="px-4 py-2 bg-[#844AFB] hover:bg-[#6721F2] text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Back to 3D Printing Service
          </Link>
        </div>
      </div>
    );
  }

  const formatPaise = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500 font-medium">Request Reference:</span>
              <strong className="text-sm font-bold text-slate-900">{request.request_number}</strong>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              3D Print Quotation Tracker
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitted on {new Date(request.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quotation Status Badge */}
            <div className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#EEE8FA] text-[#844AFB] border border-[#AF87F8]/40">
              Quote: {request.quotation_status.replace(/_/g, ' ')}
            </div>

            {/* Production Status Badge */}
            <div className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              Prod: {request.production_status.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Dual Lifecycle Stepper */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Quotation &amp; Production Progress
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className={`p-3 rounded-lg border ${request.quotation_status === 'PENDING_REVIEW' || request.quotation_status === 'UNDER_REVIEW' ? 'border-[#844AFB] bg-[#EEE8FA]/50' : 'border-slate-100 bg-slate-50'}`}>
              <Clock className="w-5 h-5 mx-auto mb-1 text-slate-700" />
              <span className="text-xs font-bold block text-slate-900">1. Engineering Review</span>
              <span className="text-[10px] text-slate-500">Checking printability</span>
            </div>

            <div className={`p-3 rounded-lg border ${request.quotation_status === 'QUOTE_SENT' ? 'border-[#844AFB] bg-[#EEE8FA]/50' : request.quotation_status === 'ACCEPTED' ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'}`}>
              <FileText className="w-5 h-5 mx-auto mb-1 text-slate-700" />
              <span className="text-xs font-bold block text-slate-900">2. Official Quotation</span>
              <span className="text-[10px] text-slate-500">{request.quotation_status === 'QUOTE_SENT' ? 'Quote Ready' : 'Pending Quote'}</span>
            </div>

            <div className={`p-3 rounded-lg border ${request.production_status === 'PAYMENT_PENDING' || request.production_status === 'PAID' ? 'border-[#844AFB] bg-[#EEE8FA]/50' : 'border-slate-100 bg-slate-50'}`}>
              <CreditCard className="w-5 h-5 mx-auto mb-1 text-slate-700" />
              <span className="text-xs font-bold block text-slate-900">3. Payment &amp; Slicing</span>
              <span className="text-[10px] text-slate-500">{request.production_status === 'PAID' ? 'Payment Verified' : 'Awaiting Payment'}</span>
            </div>

            <div className={`p-3 rounded-lg border ${request.production_status === 'IN_PRODUCTION' || request.production_status === 'DISPATCHED' || request.production_status === 'DELIVERED' ? 'border-[#844AFB] bg-[#EEE8FA]/50' : 'border-slate-100 bg-slate-50'}`}>
              <Truck className="w-5 h-5 mx-auto mb-1 text-slate-700" />
              <span className="text-xs font-bold block text-slate-900">4. Print &amp; Dispatch</span>
              <span className="text-[10px] text-slate-500">{request.production_status === 'DISPATCHED' ? 'Shipped via Courier' : 'In Manufacturing'}</span>
            </div>
          </div>
        </div>

        {/* Needs Clarification Banner */}
        {request.quotation_status === 'NEEDS_CLARIFICATION' && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-amber-900 mb-1">
                  Clarification Required by TTRC Engineering Team
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed mb-4">
                  Our engineers reviewed your model and need additional technical clarification before finalizing the quotation.
                </p>

                {/* Conversation Thread */}
                {request.clarification_thread && request.clarification_thread.length > 0 && (
                  <div className="space-y-3 mb-4 bg-white/70 p-4 rounded-lg border border-amber-200">
                    {request.clarification_thread.map((msg: any, i: number) => (
                      <div
                        key={i}
                        className={`text-xs p-3 rounded-lg ${
                          msg.sender === 'admin'
                            ? 'bg-amber-100 text-amber-950 font-medium'
                            : 'bg-white text-slate-800 border border-slate-200 ml-4'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                          <strong>{msg.sender === 'admin' ? 'TTRC Engineer' : 'You (Customer)'}</strong>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p>{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <form onSubmit={handleSendClarification} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type your response or clarification here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1 text-xs bg-white border border-amber-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Reply</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid: Quotation Breakdown on Left, Model Specs on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Official Quotation Details (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {activeQuote ? (
              <div className="bg-white border-2 border-[#844AFB] rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#844AFB]" />
                    <span className="font-bold text-slate-900 text-base">
                      Official Quotation ({activeQuote.quote_number})
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Version {activeQuote.version}
                  </span>
                </div>

                {/* Pricing Table */}
                <div className="space-y-2 text-xs text-slate-700 mb-6">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Material Cost ({request.configuration.material} Filament):</span>
                    <strong className="text-slate-900">{formatPaise(activeQuote.breakdown.material_cost_paise)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Machine Runtime &amp; Operating Cost:</span>
                    <strong className="text-slate-900">{formatPaise(activeQuote.breakdown.machine_cost_paise)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Labor &amp; Post-Processing:</span>
                    <strong className="text-slate-900">{formatPaise(activeQuote.breakdown.labour_cost_paise + activeQuote.breakdown.finishing_cost_paise)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Protective Packaging &amp; Courier Shipping:</span>
                    <strong className="text-slate-900">{formatPaise(activeQuote.breakdown.packaging_cost_paise + activeQuote.breakdown.shipping_cost_paise)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Applicable Taxes (GST):</span>
                    <strong className="text-slate-900">{formatPaise(activeQuote.breakdown.tax_paise)}</strong>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200 text-base">
                    <span className="font-bold text-slate-900">Total Payable Amount:</span>
                    <span className="font-extrabold text-[#844AFB] text-xl">
                      {formatPaise(activeQuote.breakdown.total_paise)}
                    </span>
                  </div>
                </div>

                {/* Lead Time & Remarks */}
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 mb-6 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Lead Time:</span>
                    <strong className="text-slate-800">{activeQuote.lead_time_days} Working Days</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quote Valid Until:</span>
                    <strong className="text-slate-800">{new Date(activeQuote.valid_until).toLocaleDateString('en-IN')}</strong>
                  </div>
                  {activeQuote.technical_remarks && (
                    <div className="pt-2 border-t border-slate-200 mt-2">
                      <span className="text-slate-500 block mb-0.5">Engineering Remarks:</span>
                      <p className="text-slate-800 italic">{activeQuote.technical_remarks}</p>
                    </div>
                  )}
                </div>

                {/* Actions: Accept or Revise */}
                {request.quotation_status === 'QUOTE_SENT' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAcceptQuote}
                      disabled={acceptingQuote}
                      className="flex-1 py-3 px-4 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {acceptingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Accept Quotation &amp; Proceed to Payment</span>
                    </button>

                    <button
                      onClick={() => setShowRevisionModal(true)}
                      className="py-3 px-4 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Revision</span>
                    </button>
                  </div>
                )}

                {request.quotation_status === 'ACCEPTED' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Quotation accepted! Your order is currently queued for payment and production.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Quotation Under Review
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Our engineering team in Tamil Nadu is inspecting your model dimensions, wall thickness, and production settings.
                  You will receive an official itemized quotation shortly.
                </p>
                <div className="text-[11px] text-slate-400">
                  Target turnaround: within 4 to 8 business hours.
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Model Specifications & Technical Summary (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Box className="w-4 h-4 text-[#844AFB]" />
                <span>Requested Technical Specifications</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">File Name:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[180px]">{request.file.original_filename}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Format:</span>
                  <span className="font-semibold text-slate-900">{request.file.format}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Dimensions:</span>
                  <span className="font-semibold text-slate-900">
                    {request.analysis.normalized_dimensions_mm.x} &times; {request.analysis.normalized_dimensions_mm.y} &times; {request.analysis.normalized_dimensions_mm.z} mm
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Volume:</span>
                  <span className="font-semibold text-slate-900">
                    {request.analysis.volume_cm3 !== null ? `${request.analysis.volume_cm3} cm³` : 'Non-solid'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Material:</span>
                  <span className="font-semibold text-slate-900">{request.configuration.material} ({request.configuration.color})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Layer Resolution:</span>
                  <span className="font-semibold text-slate-900">{request.configuration.layer_height} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Infill:</span>
                  <span className="font-semibold text-slate-900">{request.configuration.infill_percentage}% ({request.configuration.infill_pattern})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="font-bold text-[#844AFB]">{request.configuration.quantity} Unit(s)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Finish:</span>
                  <span className="font-semibold text-slate-900 capitalize">{request.configuration.finish.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Customer Contact Summary */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-800 block mb-2">Customer &amp; Delivery Destination</span>
                <p className="text-slate-600 leading-relaxed">
                  <strong>{request.customer.name}</strong><br />
                  {request.customer.email} &bull; {request.customer.mobile}<br />
                  Destination: {request.customer.city}
                  {request.customer.company && <><br />Institution: {request.customer.company}</>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Request Quotation Revision</h3>
            <p className="text-xs text-slate-500 mb-4">
              Specify requested changes in quantity, infill percentage, material type, or target turnaround.
            </p>
            <form onSubmit={handleRequestRevision} className="space-y-4">
              <textarea
                required
                rows={4}
                placeholder="e.g., Can we reduce quantity to 2 and change material to PETG instead of PLA?"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#844AFB]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingRevision || !revisionNotes.trim()}
                  className="px-4 py-2 bg-[#844AFB] hover:bg-[#6721F2] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {requestingRevision ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Submit Revision Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

