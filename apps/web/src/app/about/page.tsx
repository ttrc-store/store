import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | Tamizh Tech & TTRC Store',
  description: 'Learn about Tamizh Tech (tamizhtech.in) and TTRC Store — India\'s trusted robotics & STEM kits platform.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-slate-200 pb-6">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900">About Tamizh Tech</h1>
          <p className="text-xs text-red-600 mt-2 font-mono">Company: Tamizh Tech (tamizhtech.in) | Store: ttrc.store</p>
        </div>

        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
          <p>
            Welcome to <strong className="text-slate-900">TTRC Store</strong>, the dedicated e-commerce platform operated by <strong className="text-slate-900">Tamizh Tech</strong> based in Tamil Nadu, India.
            We specialize in providing high-precision robotics components, gamified competition kits (Robo Race, Line Follower, Robo Soccer), STEM education kits, lithium batteries, motors, sensors, microcontrollers, and hardware fasteners to students, engineers, schools, and robotics competitors across India.
          </p>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h2 className="font-heading font-bold text-lg text-red-600">Our Mission</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              To empower India&apos;s next generation of roboticists and hardware innovators by providing authentic, high-quality robotics components, complete assembly kits, compatible spare parts, and fast nationwide shipping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Gamified Robotics</h3>
              <p className="text-xs text-slate-500">Robo Race, Line Follower &amp; Robo Soccer competition kits and dedicated spare parts.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Nationwide Delivery</h3>
              <p className="text-xs text-slate-500">Serviceable pincode checks and courier tracking across all Indian states.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Institutional Supply</h3>
              <p className="text-xs text-slate-500">Bulk ordering support for schools, STEM labs, and robotics clubs.</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <p>Need custom bulk orders?</p>
          <Link href="/bulk-enquiry" className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-md shadow-red-600/20">
            Submit Bulk Enquiry
          </Link>
        </div>
      </div>
    </div>
  );
}
