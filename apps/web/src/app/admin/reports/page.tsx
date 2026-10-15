import * as React from 'react';
import { getAdminAnalyticsReportAction } from '@/actions/orders';
import { AdminReportsClient } from './_components/admin-reports-client';

export const metadata = {
  title: 'Financial & Operational Reports | TTRC Store Admin',
  description: 'Authoritative financial performance, order status distributions, and inventory movements.',
};

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const initialReport = await getAdminAnalyticsReportAction('30d');

  if ('error' in initialReport && initialReport.error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
        Failed to load financial reports: {initialReport.error}
      </div>
    );
  }

  return <AdminReportsClient initialReport={initialReport} />;
}
