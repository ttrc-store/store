'use client';

import * as React from 'react';
import { Search, User, Loader2, Users } from 'lucide-react';
import { getAdminCustomersAction } from '@/actions/orders';

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'staff' | 'admin';
  joinedDate: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = React.useState<CustomerUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const loadCustomers = React.useCallback(async (query = '') => {
    setLoading(true);
    try {
      const res = await getAdminCustomersAction({ search: query });
      if (res.customers) {
        setCustomers(
          res.customers.map((c) => ({
            id: c.id,
            name: c.full_name,
            email: c.email,
            phone: c.phone || '—',
            role: (c.user_roles?.[0]?.role as any) || 'customer',
            joinedDate: new Date(c.created_at).toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            }),
          }))
        );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Customer &amp; Staff Management ({customers.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative registered customer accounts, staff privileges, and account security.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email address, or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:ring-red-600"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-red-600" size={24} />
            <p className="text-xs">Loading customer directory...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <Users size={20} />
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900">No Customers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? `No registered accounts match "${search}". Try searching by another keyword.`
                : 'No customers have registered in the store database yet. Customer records will populate here upon registration.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3 rounded-l-lg">User</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {user.name ? user.name[0].toUpperCase() : <User size={14} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-slate-700">{user.phone}</td>
                  <td className="py-3 text-slate-500">{user.joinedDate}</td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        user.role === 'admin'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : user.role === 'staff'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
