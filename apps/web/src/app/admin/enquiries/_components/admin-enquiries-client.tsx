'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  Building,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MessageSquareQuote,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WhatsAppIcon } from '@/components/ui/brand-icons';
import {
  AdminEnquiryItem,
  EnquiryCounts,
  EnquiryTypeParam,
  EnquiryStatusParam,
  updateAdminEnquiryStatusAction,
} from '@/actions/enquiries';

interface Props {
  initialEnquiries: AdminEnquiryItem[];
  total: number;
  page: number;
  totalPages: number;
  counts: EnquiryCounts;
  currentType: EnquiryTypeParam;
  currentStatus: EnquiryStatusParam;
  currentSearch: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  NEW: { label: 'New', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  RESPONDED: { label: 'Responded', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  CLOSED: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

function StatusBadge({ status }: { status: string }) {
  const conf = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
    >
      {conf.label}
    </span>
  );
}

function TypeBadge({ type }: { type: 'CONTACT' | 'RFQ' }) {
  if (type === 'RFQ') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#EEE8FA] text-[#6721F2] border border-purple-200">
        <FileText size={11} /> RFQ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
      <Mail size={11} /> Contact
    </span>
  );
}

export default function AdminEnquiriesClient({
  initialEnquiries,
  total,
  page,
  totalPages,
  counts,
  currentType,
  currentStatus,
  currentSearch,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [enquiries, setEnquiries] = React.useState<AdminEnquiryItem[]>(initialEnquiries);
  const [search, setSearch] = React.useState(currentSearch);
  const [selectedEnquiry, setSelectedEnquiry] = React.useState<AdminEnquiryItem | null>(null);

  // Modal editing state
  const [editStatus, setEditStatus] = React.useState<'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED'>('NEW');
  const [editAdminNotes, setEditAdminNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<{ text: string; isError?: boolean } | null>(null);

  React.useEffect(() => {
    setEnquiries(initialEnquiries);
  }, [initialEnquiries]);

  // Sync selected enquiry when opening modal
  const openDetailModal = (enquiry: AdminEnquiryItem) => {
    setSelectedEnquiry(enquiry);
    setEditStatus(enquiry.status);
    setEditAdminNotes(enquiry.adminNotes || '');
    setSaveMessage(null);
  };

  const closeDetailModal = () => {
    setSelectedEnquiry(null);
    setSaveMessage(null);
  };

  const updateFilters = (newParams: {
    type?: string;
    status?: string;
    search?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams();

    const t = newParams.type !== undefined ? newParams.type : currentType;
    const s = newParams.status !== undefined ? newParams.status : currentStatus;
    const q = newParams.search !== undefined ? newParams.search : search;
    const p = newParams.page !== undefined ? newParams.page : page;

    if (t && t !== 'ALL') params.set('type', t);
    if (s && s !== 'ALL') params.set('status', s);
    if (q) params.set('search', q);
    if (p && p > 1) params.set('page', String(p));

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search, page: 1 });
  };

  const handleSaveStatus = async () => {
    if (!selectedEnquiry) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await updateAdminEnquiryStatusAction({
        id: selectedEnquiry.id,
        status: editStatus,
        adminNotes: editAdminNotes,
      });

      if (res.success && res.enquiry) {
        setSaveMessage({ text: 'Enquiry updated successfully!' });
        // Update local items
        setEnquiries((prev) =>
          prev.map((item) => (item.id === selectedEnquiry.id ? res.enquiry! : item))
        );
        setSelectedEnquiry(res.enquiry);
        router.refresh();
      } else {
        setSaveMessage({ text: res.error || 'Failed to update enquiry', isError: true });
      }
    } catch {
      setSaveMessage({ text: 'Network error updating enquiry', isError: true });
    } finally {
      setSaving(false);
    }
  };

  // Clean international phone for tel/whatsapp links
  const getCleanMobile = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  return (
    <div className="space-y-6">
      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          onClick={() => updateFilters({ status: 'ALL', page: 1 })}
          className={`p-4 rounded-2xl bg-white border text-left transition-all cursor-pointer ${
            currentStatus === 'ALL'
              ? 'border-purple-600 ring-2 ring-purple-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Enquiries</span>
            <MessageSquareQuote size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{counts.total}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span>{counts.contactCount} Contact</span>
            <span>•</span>
            <span>{counts.rfqCount} RFQ</span>
          </div>
        </button>

        <button
          onClick={() => updateFilters({ status: 'NEW', page: 1 })}
          className={`p-4 rounded-2xl bg-white border text-left transition-all cursor-pointer ${
            currentStatus === 'NEW'
              ? 'border-amber-500 ring-2 ring-amber-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">New / Unread</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{counts.newCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting review</p>
        </button>

        <button
          onClick={() => updateFilters({ status: 'IN_PROGRESS', page: 1 })}
          className={`p-4 rounded-2xl bg-white border text-left transition-all cursor-pointer ${
            currentStatus === 'IN_PROGRESS'
              ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">In Progress</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{counts.inProgressCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Under technical review</p>
        </button>

        <button
          onClick={() => updateFilters({ status: 'RESPONDED', page: 1 })}
          className={`p-4 rounded-2xl bg-white border text-left transition-all cursor-pointer ${
            currentStatus === 'RESPONDED'
              ? 'border-purple-600 ring-2 ring-purple-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Responded</span>
            <CheckCircle2 size={16} className="text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-700 mt-1">{counts.respondedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Quote sent / contacted</p>
        </button>
      </div>

      {/* ─── FILTERS & SEARCH BAR ─── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter size={13} /> Type:
            </span>
            {(['ALL', 'CONTACT', 'RFQ'] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateFilters({ type: t, page: 1 })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  currentType === t
                    ? 'bg-purple-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'ALL' ? `All Types (${counts.total})` : t === 'CONTACT' ? `Contact Us (${counts.contactCount})` : `RFQ (${counts.rfqCount})`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or mobile..."
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl focus:border-purple-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    updateFilters({ search: '', page: 1 });
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Button
              type="submit"
              className="bg-purple-700 hover:bg-purple-800 text-white h-9 px-3 rounded-xl text-xs font-bold"
            >
              Search
            </Button>
          </form>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-1">Status:</span>
          {(['ALL', 'NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => updateFilters({ status: st, page: 1 })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'All Statuses'
                : st === 'NEW'
                ? `New (${counts.newCount})`
                : st === 'IN_PROGRESS'
                ? `In Progress (${counts.inProgressCount})`
                : st === 'RESPONDED'
                ? `Responded (${counts.respondedCount})`
                : `Closed (${counts.closedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ENQUIRIES TABLE ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {enquiries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MessageSquareQuote size={40} className="mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-800 text-base">No enquiries found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no submissions matching your current search or filter criteria.
            </p>
            {(currentType !== 'ALL' || currentStatus !== 'ALL' || currentSearch) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  updateFilters({ type: 'ALL', status: 'ALL', search: '', page: 1 });
                }}
                className="mt-2 text-xs rounded-xl"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Message / Product</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    onClick={() => openDetailModal(enquiry)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 align-top">
                      <TypeBadge type={enquiry.type} />
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <p className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                        {enquiry.name}
                      </p>
                      {enquiry.organization && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building size={11} /> {enquiry.organization}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top space-y-0.5">
                      <p className="font-mono text-slate-800 text-[11px]">{enquiry.mobile}</p>
                      <p className="text-slate-500 text-[11px] truncate max-w-[160px]">
                        {enquiry.email}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 align-top max-w-[280px]">
                      {enquiry.productName && (
                        <div className="font-semibold text-purple-700 text-[11px] truncate flex items-center gap-1 mb-0.5">
                          <Package size={12} className="shrink-0" />
                          <span>{enquiry.productName}</span>
                          {enquiry.quantity && (
                            <span className="text-slate-500">({enquiry.quantity} pcs)</span>
                          )}
                        </div>
                      )}
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">
                        {enquiry.message}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <StatusBadge status={enquiry.status} />
                    </td>

                    <td className="py-3.5 px-4 align-top text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(enquiry.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailModal(enquiry);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                        title="View details"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── PAGINATION ─── */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {enquiries.length} of {total} enquiries
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: page - 1 })}
                className="h-8 text-xs rounded-xl"
              >
                <ChevronLeft size={14} className="mr-1" /> Previous
              </Button>
              <span className="font-bold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: page + 1 })}
                className="h-8 text-xs rounded-xl"
              >
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── DETAIL & STATUS MANAGEMENT MODAL ─── */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <TypeBadge type={selectedEnquiry.type} />
                <h3 className="font-heading font-extrabold text-slate-900 text-base">
                  Enquiry Details
                </h3>
                <StatusBadge status={selectedEnquiry.status} />
              </div>
              <button
                onClick={closeDetailModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Customer Contact Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedEnquiry.name}</h4>
                    {selectedEnquiry.organization && (
                      <p className="text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Building size={13} className="text-slate-400" />
                        {selectedEnquiry.organization}
                      </p>
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono">
                    ID: {selectedEnquiry.id}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-purple-700" />
                      <span className="font-mono text-slate-900">{selectedEnquiry.mobile}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${selectedEnquiry.mobile}`}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                        title="Call Customer"
                      >
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${getCleanMobile(selectedEnquiry.mobile)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11px] font-bold flex items-center gap-1"
                        title="Chat on WhatsApp"
                      >
                        <WhatsAppIcon className="w-3 h-3 text-white" /> WhatsApp
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-2 truncate mr-2">
                      <Mail size={14} className="text-purple-700 shrink-0" />
                      <span className="text-slate-900 truncate">{selectedEnquiry.email}</span>
                    </div>
                    <a
                      href={`mailto:${selectedEnquiry.email}?subject=${encodeURIComponent(
                        `Regarding your ${selectedEnquiry.type === 'RFQ' ? 'quotation request' : 'inquiry'} on TTRC Store`
                      )}`}
                      className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold shrink-0"
                    >
                      Email
                    </a>
                  </div>
                </div>
              </div>

              {/* Product Reference Card if RFQ */}
              {(selectedEnquiry.productName ||
                selectedEnquiry.sku ||
                selectedEnquiry.quantity ||
                selectedEnquiry.product_details) && (
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Package size={14} className="text-purple-700" />
                    Quotation &amp; Product Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                    {selectedEnquiry.productName && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Product Name
                        </span>
                        <span className="font-semibold text-slate-900">
                          {selectedEnquiry.productName}
                        </span>
                      </div>
                    )}
                    {selectedEnquiry.sku && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          SKU / Part No.
                        </span>
                        <span className="font-mono text-slate-900">{selectedEnquiry.sku}</span>
                      </div>
                    )}
                    {selectedEnquiry.quantity && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Target Quantity
                        </span>
                        <span className="font-bold text-purple-700">
                          {selectedEnquiry.quantity} Units
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Complete Message */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Customer Message / Specifications
                </label>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* Submission Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                <div>
                  <span className="font-bold text-slate-600 block">Submitted At</span>
                  <span>
                    {new Date(selectedEnquiry.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {selectedEnquiry.sourcePage && (
                  <div>
                    <span className="font-bold text-slate-600 block">Source Page</span>
                    <span className="font-mono text-slate-700">{selectedEnquiry.sourcePage}</span>
                  </div>
                )}
                {selectedEnquiry.ip_address && (
                  <div>
                    <span className="font-bold text-slate-600 block">Client IP</span>
                    <span className="font-mono text-slate-700">{selectedEnquiry.ip_address}</span>
                  </div>
                )}
              </div>

              {/* ─── STATUS & ADMIN NOTES MANAGEMENT ─── */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Admin Follow-up &amp; Workflow</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 text-[11px]">Enquiry Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(e.target.value as 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED')
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl h-10 px-3 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-semibold"
                    >
                      <option value="NEW">NEW — Unread / Awaiting Review</option>
                      <option value="IN_PROGRESS">IN_PROGRESS — Technical Review Underway</option>
                      <option value="RESPONDED">RESPONDED — Quotation Sent / Contacted</option>
                      <option value="CLOSED">CLOSED — Resolved / Deal Completed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px]">
                    Internal Notes (Only visible to Administrators)
                  </label>
                  <textarea
                    rows={3}
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    placeholder="Add notes about quote price sent, customer discussion, callback date..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-200"
                  />
                </div>

                {saveMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold ${
                      saveMessage.isError
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {saveMessage.text}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDetailModal}
                    className="text-xs rounded-xl"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveStatus}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {saving ? 'Saving...' : 'Save Status & Notes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
