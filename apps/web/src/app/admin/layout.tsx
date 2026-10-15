import * as React from 'react';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { requireAdmin } from '@/lib/auth-helpers';

export const metadata = {
  title: 'TTRC Admin Dashboard | Tamizh Tech Store Management',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    redirect('/login?redirectTo=/admin');
  }

  return <AdminShell>{children}</AdminShell>;
}
