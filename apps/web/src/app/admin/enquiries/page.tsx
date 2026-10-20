import * as React from 'react';
import { getAdminEnquiriesAction, EnquiryTypeParam, EnquiryStatusParam } from '@/actions/enquiries';
import AdminEnquiriesClient from './_components/admin-enquiries-client';

export const revalidate = 0;

export const metadata = {
  title: 'Enquiries & RFQ Management | TTRC Admin',
};

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const type = (params.type?.toUpperCase() || 'ALL') as EnquiryTypeParam;
  const status = (params.status?.toUpperCase() || 'ALL') as EnquiryStatusParam;
  const search = params.search || '';
  const page = Number(params.page || 1);

  const result = await getAdminEnquiriesAction({
    type,
    status,
    search,
    page,
    limit: 15,
  });

  if ('error' in result && !result.enquiries) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Enquiries &amp; Request for Quote (RFQ)
        </h1>
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          Failed to load enquiries: {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Enquiries &amp; Request for Quote (RFQ)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review customer support submissions, institutional bulk quotations, and technical RFQs.
          </p>
        </div>
      </div>

      <AdminEnquiriesClient
        initialEnquiries={result.enquiries || []}
        total={result.total || 0}
        page={result.page || 1}
        totalPages={result.totalPages || 1}
        counts={
          result.counts || {
            total: 0,
            newCount: 0,
            inProgressCount: 0,
            respondedCount: 0,
            closedCount: 0,
            contactCount: 0,
            rfqCount: 0,
          }
        }
        currentType={type}
        currentStatus={status}
        currentSearch={search}
      />
    </div>
  );
}
