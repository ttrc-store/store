import * as React from 'react';
import { redirect } from 'next/navigation';
import { LogOut, User, Shield } from 'lucide-react';
import { signOutAction } from '@/actions/auth';
import { requireAuth } from '@/lib/auth-helpers';
import { Button } from '@/components/ui/button';
import { AccountNav } from '@/components/account/account-nav';

export default async function UserDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const auth = await requireAuth();

  if ('error' in auth) {
    redirect(`/login?redirect=/${userId}`);
  }

  // Security guard: Ensure customer only accesses their own user-id route
  if (auth.user.id !== userId && auth.user.role !== 'admin' && auth.user.role !== 'staff') {
    redirect(`/${auth.user.id}`);
  }

  const isAdmin = auth.user.role === 'admin' || auth.user.role === 'staff';

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Profile Header Bar */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#844AFB] font-bold shadow-xs">
              <User size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
                  My Account
                </h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#14141A] text-white flex items-center gap-1">
                    <Shield size={10} /> Admin
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-[#844AFB] font-mono text-[11px] font-bold">
                  User ID: {userId}
                </span>
                <span className="text-xs text-slate-500">
                  Signed in as <span className="font-mono font-semibold text-slate-800">{auth.user.email}</span>
                </span>
              </div>
            </div>
          </div>

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-700 hover:text-[#844AFB] hover:bg-purple-50 text-xs gap-2 rounded-xl cursor-pointer"
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

          {/* Main Content Area */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
