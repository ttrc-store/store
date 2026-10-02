import * as React from 'react';
import type { Metadata } from 'next';
import { ShieldCheck, Mail, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Grievance Officer | Consumer Protection Compliance | TTRC Store',
  description: 'Grievance Redressal Mechanism and Grievance Officer details under Consumer Protection (E-Commerce) Rules 2020.',
};

export default function GrievanceOfficerPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="text-purple-700" size={32} />
            Grievance Officer & Compliance
          </h1>
          <p className="text-xs text-purple-700 font-mono font-bold mt-1">Consumer Protection (E-Commerce) Rules, 2020</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700">
          <p>
            In accordance with the Information Technology Act 2000 and Consumer Protection (E-Commerce) Rules 2020, the contact details of the Grievance Officer for Tamizh Tech (ttrc.store) are published below:
          </p>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <p><strong className="text-slate-900">Name:</strong> Mr. Grievance Officer (Tamizh Tech Compliance)</p>
            <p><strong className="text-slate-900">Designation:</strong> Nodal Grievance Redressal Officer</p>
            <p><strong className="text-slate-900">Company:</strong> Tamizh Tech (tamizhtech.in)</p>

            <div className="flex items-center gap-2 pt-2 text-slate-600">
              <MapPin size={16} className="text-purple-700" />
              <span>12/42 Peelamedu, Coimbatore, Tamil Nadu — 641004, India</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Mail size={16} className="text-purple-700" />
              <span>grievance@tamizhtech.in</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500">
            Grievances will be acknowledged within 48 hours and resolved within 1 month from receipt date per statutory mandates.
          </div>
        </div>
      </div>
    </div>
  );
}
