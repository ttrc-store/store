'use client';

import * as React from 'react';
import { Bell, Search, UserCheck } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Search Input */}
      <div className="relative w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search products, orders, customers..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600"
        />
      </div>

      {/* Admin Right Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <UserCheck size={18} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-900 line-clamp-1">Tamizh Tech Admin</p>
            <p className="text-[10px] text-emerald-700 font-mono">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
