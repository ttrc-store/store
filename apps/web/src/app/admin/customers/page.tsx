'use client';

import * as React from 'react';
import { Search, User } from 'lucide-react';

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'staff' | 'admin';
  ordersCount: number;
  joinedDate: string;
}

const CUSTOMERS_LIST: CustomerUser[] = [
  { id: '1', name: 'Tamizh Tech Admin', email: 'admin@tamizhtech.in', phone: '+91 98765 00000', role: 'admin', ordersCount: 12, joinedDate: 'Aug 2025' },
  { id: '2', name: 'Karthik Raja', email: 'karthik@example.com', phone: '+91 98765 43210', role: 'customer', ordersCount: 4, joinedDate: 'Sep 2026' },
  { id: '3', name: 'Anitha V.', email: 'anitha@example.com', phone: '+91 98765 11223', role: 'customer', ordersCount: 1, joinedDate: 'Sep 2026' },
  { id: '4', name: 'Robotics Club Lead', email: 'staff@tamizhtech.in', phone: '+91 94433 11223', role: 'staff', ordersCount: 8, joinedDate: 'Jan 2026' },
];

export default function AdminCustomersPage() {
  const [customers, setCustomers] = React.useState<CustomerUser[]>(CUSTOMERS_LIST);
  const [search, setSearch] = React.useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const toggleRole = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextRole = c.role === 'customer' ? 'staff' : c.role === 'staff' ? 'admin' : 'customer';
          return { ...c, role: nextRole };
        }
        return c;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Customer & Staff Management ({customers.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View registered user profiles, order history, and promote/demote admin & staff roles.
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
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-purple-50/50 text-slate-600 font-bold uppercase tracking-wider">
              <th className="p-3 rounded-l-lg">User</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Total Orders</th>
              <th className="p-3">Role</th>
              <th className="p-3 text-right rounded-r-lg">Role Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-purple-50/50 transition-colors">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 font-mono text-slate-700">{user.phone}</td>
                <td className="py-3 text-slate-500">{user.joinedDate}</td>
                <td className="py-3 font-mono font-bold text-slate-900">{user.ordersCount} orders</td>
                <td className="py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    user.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : user.role === 'staff'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => toggleRole(user.id)}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-[11px] font-bold border border-slate-200 hover:border-purple-200 transition-colors"
                  >
                    Change Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
