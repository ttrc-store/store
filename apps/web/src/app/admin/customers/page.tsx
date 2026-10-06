'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  User,
  Loader2,
  Users,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  MapPin,
  ShoppingBag,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import {
  getAdminCustomersAction,
  getAdminCustomerDetailsAction,
  createAdminCustomerAction,
  updateAdminCustomerAction,
  deleteAdminCustomerAction,
  AdminCustomerSummary,
  AdminCustomerDetails,
} from '@/actions/admin-customers';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = React.useState<AdminCustomerSummary[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Modals & Panels state
  const [viewCustomer, setViewCustomer] = React.useState<AdminCustomerDetails | null>(null);
  const [viewLoading, setViewLoading] = React.useState(false);

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [addLoading, setAddLoading] = React.useState(false);
  const [addError, setAddError] = React.useState('');
  const [addSuccess, setAddSuccess] = React.useState('');
  const [addForm, setAddForm] = React.useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    line1: '',
    line2: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
  });

  const [editCustomer, setEditCustomer] = React.useState<AdminCustomerSummary | null>(null);
  const [editLoading, setEditLoading] = React.useState(false);
  const [editError, setEditError] = React.useState('');
  const [editForm, setEditForm] = React.useState({
    full_name: '',
    email: '',
    phone: '',
  });

  const [deleteTarget, setDeleteTarget] = React.useState<AdminCustomerSummary | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  // Load customer directory
  const loadCustomers = React.useCallback(async (query = '') => {
    setLoading(true);
    try {
      const res = await getAdminCustomersAction({ search: query });
      if (res.customers) {
        setCustomers(res.customers);
        setTotalCount(res.total || res.customers.length);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadCustomers]);

  // Handle View customer full details
  const handleOpenView = async (userId: string) => {
    setViewLoading(true);
    setViewCustomer(null);
    try {
      const res = await getAdminCustomerDetailsAction(userId);
      if (res.customer) {
        setViewCustomer(res.customer);
      } else {
        alert(res.error || 'Failed to fetch customer profile.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching customer details.');
    } finally {
      setViewLoading(false);
    }
  };

  // Handle Add Customer submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');

    try {
      const payload: any = {
        full_name: addForm.full_name,
        email: addForm.email,
        phone: addForm.phone,
        password: addForm.password,
      };

      if (addForm.line1 && addForm.city && addForm.pincode) {
        payload.address = {
          line1: addForm.line1,
          line2: addForm.line2,
          city: addForm.city,
          state: addForm.state,
          pincode: addForm.pincode,
        };
      }

      const res = await createAdminCustomerAction(payload);
      if (res.error) {
        setAddError(res.error);
      } else {
        setAddSuccess(res.message || 'Customer created successfully.');
        setTimeout(() => {
          setIsAddOpen(false);
          setAddSuccess('');
          setAddForm({
            full_name: '',
            email: '',
            phone: '',
            password: '',
            line1: '',
            line2: '',
            city: '',
            state: 'Tamil Nadu',
            pincode: '',
          });
          loadCustomers(search);
        }, 1200);
      }
    } catch (err: any) {
      setAddError(err.message || 'Failed to create customer.');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Edit Customer submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;
    setEditLoading(true);
    setEditError('');

    try {
      const res = await updateAdminCustomerAction(editCustomer.id, {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
      });

      if (res.error) {
        setEditError(res.error);
      } else {
        setEditCustomer(null);
        loadCustomers(search);
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update customer.');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete Customer submit
  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const res = await deleteAdminCustomerAction(deleteTarget.id);
      if (res.error) {
        setDeleteError(res.error);
      } else {
        setDeleteTarget(null);
        loadCustomers(search);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete customer.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
            Customer Management ({totalCount})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative registered customer directory, order history, addresses, and account controls.
          </p>
        </div>

        <button
          onClick={() => {
            setAddError('');
            setAddSuccess('');
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#844AFB] hover:bg-[#6721F2] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer ID (e.g. TTRC-CUS-00001), name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#844AFB] focus:ring-1 focus:ring-[#844AFB]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-[#844AFB]" size={28} />
            <p className="text-xs font-medium">Loading customer records...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Users size={20} />
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900">No Customers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? `No registered accounts match "${search}". Try searching with another ID, name, or phone.`
                : 'No customers are registered yet. Click "Add Customer" to create the first customer account.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Customer ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Orders &amp; Spend</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Customer ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-[#6721F2] border border-purple-200 text-[11px]">
                        {c.customer_id}
                      </span>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#844AFB]/10 border border-[#844AFB]/20 flex items-center justify-center text-[#6721F2] font-bold text-xs shrink-0">
                          {c.name ? c.name[0].toUpperCase() : <User size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{c.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">{c.phone}</td>

                    {/* Orders & Spend */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-900">
                          {c.ordersCount} {c.ordersCount === 1 ? 'order' : 'orders'}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono">
                          ₹{(c.totalSpentPaise / 100).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{c.joinedDate}</td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          title="View Full Details & Orders"
                          onClick={() => handleOpenView(c.id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-[#844AFB] hover:bg-purple-50 text-slate-600 hover:text-[#6721F2] transition-colors cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          title="Edit Customer"
                          onClick={() => {
                            setEditError('');
                            setEditCustomer(c);
                            setEditForm({
                              full_name: c.name,
                              email: c.email,
                              phone: c.phone === '—' ? '' : c.phone,
                            });
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          title="Delete Customer"
                          onClick={() => {
                            setDeleteError('');
                            setDeleteTarget(c);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: VIEW CUSTOMER DETAILS (ORDERS & ADDRESSES) ─── */}
      {(viewLoading || viewCustomer) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Close button */}
            <button
              onClick={() => {
                setViewCustomer(null);
                setViewLoading(false);
              }}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {viewLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-[#844AFB]" size={32} />
                <p className="text-xs font-semibold">Retrieving customer account details...</p>
              </div>
            ) : viewCustomer ? (
              <>
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#844AFB]/10 border border-[#844AFB]/20 flex items-center justify-center text-[#6721F2] font-black text-xl">
                      {viewCustomer.full_name ? viewCustomer.full_name[0].toUpperCase() : 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading font-black text-xl text-slate-900">
                          {viewCustomer.full_name}
                        </h2>
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-purple-100 text-[#6721F2] font-bold">
                          {viewCustomer.customer_id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Mail size={12} /> {viewCustomer.email}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Phone size={12} /> {viewCustomer.phone}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} /> Joined {viewCustomer.created_at}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <ShoppingBag size={14} className="text-[#844AFB]" /> Total Orders
                    </p>
                    <p className="font-heading text-2xl font-black text-slate-900 mt-1">
                      {viewCustomer.stats.total_orders}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald-600" /> Total Spend
                    </p>
                    <p className="font-heading text-2xl font-black text-slate-900 mt-1">
                      ₹{(viewCustomer.stats.total_spent_paise / 100).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-blue-600" /> Avg Order Value
                    </p>
                    <p className="font-heading text-2xl font-black text-slate-900 mt-1">
                      ₹{(viewCustomer.stats.avg_order_value_paise / 100).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Saved Delivery Addresses */}
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                    <MapPin size={16} className="text-[#844AFB]" /> Saved Delivery Addresses (
                    {viewCustomer.addresses.length})
                  </h3>

                  {viewCustomer.addresses.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      No delivery addresses saved yet. Addresses are automatically recorded upon placing orders.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewCustomer.addresses.map((addr, idx) => (
                        <div
                          key={addr.id || idx}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-1 relative"
                        >
                          {addr.isDefault && (
                            <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#6721F2]">
                              Default
                            </span>
                          )}
                          <p className="font-bold text-slate-900">{addr.fullName}</p>
                          <p className="text-slate-600">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ''}
                          </p>
                          <p className="text-slate-600">
                            {addr.city}, {addr.state} —{' '}
                            <span className="font-mono font-bold text-slate-800">{addr.pincode}</span>
                          </p>
                          <p className="text-slate-500 font-mono text-[11px]">Phone: {addr.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Orders List */}
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#844AFB]" /> Order History (
                    {viewCustomer.recent_orders.length})
                  </h3>

                  {viewCustomer.recent_orders.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      No orders placed by this customer yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                      {viewCustomer.recent_orders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#6721F2]">
                                {ord.order_number}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500">{ord.created_at}</span>
                            </div>
                            <p className="text-slate-700">
                              <span className="font-semibold">{ord.items_count} item(s):</span>{' '}
                              <span className="text-slate-500">{ord.items_summary}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <div className="text-right">
                              <p className="font-mono font-bold text-slate-900">
                                ₹{(ord.total_paise / 100).toLocaleString('en-IN')}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  ord.status === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : ord.status === 'shipped'
                                    ? 'bg-blue-50 text-blue-700'
                                    : ord.status === 'cancelled'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {ord.status}
                              </span>
                            </div>

                            <Link
                              href={`/admin/orders/${ord.id}`}
                              className="p-2 rounded-lg border border-slate-200 hover:border-[#844AFB] hover:text-[#6721F2] transition-colors"
                              title="Inspect Order"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD NEW CUSTOMER ─── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="font-heading font-black text-xl text-slate-900">Add New Customer</h2>
              <p className="text-xs text-slate-500 mt-1">
                A sequential identifier (e.g.{' '}
                <span className="font-mono text-[#6721F2] font-semibold">TTRC-CUS-XXXXX</span>) will be
                automatically assigned.
              </p>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{addSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="10-digit Indian mobile"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                />
              </div>

              {/* Optional Initial Address */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Initial Address (Optional)
                </p>

                <div>
                  <input
                    type="text"
                    placeholder="Door No, Street Name, Landmark"
                    value={addForm.line1}
                    onChange={(e) => setAddForm({ ...addForm, line1: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={addForm.state}
                    onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                  <input
                    type="text"
                    placeholder="6-digit PIN"
                    value={addForm.pincode}
                    onChange={(e) => setAddForm({ ...addForm, pincode: e.target.value })}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {addLoading && <Loader2 size={14} className="animate-spin" />}
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: EDIT CUSTOMER ─── */}
      {editCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setEditCustomer(null)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-xl text-slate-900">Edit Customer</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-purple-100 text-[#6721F2] font-bold">
                  {editCustomer.customer_id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Update customer personal details.</p>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#844AFB]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditCustomer(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {editLoading && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: DELETE CONFIRMATION ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>

            <div className="text-center space-y-1">
              <h2 className="font-heading font-black text-lg text-slate-900">Delete Customer?</h2>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-slate-800">{deleteTarget.name}</span> (
                <span className="font-mono text-purple-700">{deleteTarget.customer_id}</span>)? This
                action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteLoading}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
