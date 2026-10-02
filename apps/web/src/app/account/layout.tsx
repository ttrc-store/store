import * as React from 'react';
import { redirect } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { signOutAction } from '@/actions/auth';
import { requireAuth } from '@/lib/auth-helpers';
import { Button } from '@/components/ui/button';
import { AccountNav } from '@/components/account/account-nav';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth();
  if ('error' in auth) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold shadow-xs">
              <User size={22} />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
                My Account
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Signed in as <span className="font-mono font-semibold text-slate-800">{auth.user.email}</span>
              </p>
            </div>
          </div>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-700 hover:text-red-600 hover:bg-red-50 text-xs gap-2 rounded-xl"
            >
              <LogOut size={14} />
              Sign Out
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <aside className="lg:col-span-1">
            <AccountNav />
          </aside>

          {/* Main Account Area */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
