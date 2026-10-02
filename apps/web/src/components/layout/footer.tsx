import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Mail, Phone, ShieldCheck, Truck, RefreshCw, CreditCard } from 'lucide-react';
import { BUSINESS_INFO } from '@ttrc/shared';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-24 md:pb-12 mt-auto">
      {/* Trust Badges Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 mb-10 border-b border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-900/40 text-purple-400 border border-purple-800/40">
            <Truck size={24} />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-white">India-Wide Shipping</h4>
            <p className="text-xs text-slate-400">Fast delivery via Shiprocket</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-900/40 text-purple-400 border border-purple-800/40">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-white">100% Genuine Components</h4>
            <p className="text-xs text-slate-400">Directly sourced & tested</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-900/40 text-purple-400 border border-purple-800/40">
            <RefreshCw size={24} />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-white">7-Day Replacement</h4>
            <p className="text-xs text-slate-400">For defective components</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-900/40 text-purple-400 border border-purple-800/40">
            <CreditCard size={24} />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-white">Secure Checkout</h4>
            <p className="text-xs text-slate-400">UPI, Cards, NetBanking, COD</p>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="space-y-4 md:col-span-1">
          <Link href="/" className="inline-block" aria-label="TTRC Store Home">
            <Image
              src="/brand/ttrc-logo.png"
              alt="Tamizh Tech Robotics Club Logo"
              width={160}
              height={44}
              className="object-contain"
            />
          </Link>
          <p className="text-xs leading-relaxed text-slate-400">
            TTRC Store is the official e-commerce platform of <span className="text-white font-semibold">Tamizh Tech</span>, dedicated to empowering STEM students, roboticists, and makers across India with high-quality components.
          </p>
          <div className="space-y-1.5 text-xs">
            <p className="flex items-center gap-2 text-slate-300">
              <MapPin size={14} className="text-purple-400" />
              <span>{BUSINESS_INFO.address}</span>
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <Mail size={14} className="text-purple-400" />
              <span>{BUSINESS_INFO.email}</span>
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <Phone size={14} className="text-purple-400" />
              <span>{BUSINESS_INFO.phone}</span>
            </p>
            <p className="text-purple-400 font-mono text-[11px]">GSTIN: {BUSINESS_INFO.gstin}</p>
          </div>
        </div>

        {/* Quick Category Links */}
        <div>
          <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-purple-500 pl-2">
            Categories
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/category/gamified-robots" className="hover:text-purple-400 transition-colors">Gamified Robots (Robo Race / Soccer)</Link></li>
            <li><Link href="/category/stem-kits" className="hover:text-purple-400 transition-colors">STEM Kits</Link></li>
            <li><Link href="/category/motors" className="hover:text-purple-400 transition-colors">BO & DC Motors</Link></li>
            <li><Link href="/category/sensors" className="hover:text-purple-400 transition-colors">IR & Ultrasonic Sensors</Link></li>
            <li><Link href="/category/batteries" className="hover:text-purple-400 transition-colors">LiPo & Li-ion Batteries</Link></li>
            <li><Link href="/category/drones" className="hover:text-purple-400 transition-colors">Drone Components</Link></li>
          </ul>
        </div>

        {/* Quick Links & Legal */}
        <div>
          <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-purple-500 pl-2">
            Company & Policies
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/about" className="hover:text-purple-400 transition-colors">About Tamizh Tech</Link></li>
            <li><Link href="/contact" className="hover:text-purple-400 transition-colors">Contact Us</Link></li>
            <li><Link href="/bulk-enquiry" className="hover:text-purple-400 transition-colors">Bulk / Institutional Enquiry</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-purple-400 transition-colors">Privacy Policy (DPDP 2023)</Link></li>
            <li><Link href="/terms" className="hover:text-purple-400 transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/shipping-policy" className="hover:text-purple-400 transition-colors">Shipping Policy</Link></li>
            <li><Link href="/return-refund-policy" className="hover:text-purple-400 transition-colors">Return & Refund Policy</Link></li>
            <li><Link href="/cancellation-policy" className="hover:text-purple-400 transition-colors">Cancellation Policy</Link></li>
            <li><Link href="/grievance-officer" className="hover:text-purple-400 transition-colors">Grievance Officer Contact</Link></li>
            <li><Link href="/faq" className="hover:text-purple-400 transition-colors">FAQ & Support</Link></li>
            <li><Link href="/warranty" className="hover:text-purple-400 transition-colors">Warranty Information</Link></li>
          </ul>
        </div>

        {/* Store Trust & Country of Origin */}
        <div className="space-y-4">
          <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider border-l-2 border-purple-500 pl-2">
            Country of Origin
          </h4>
          <p className="text-xs text-slate-400">
            All products listed explicitly declare their Country of Origin in compliance with the Consumer Protection (E-Commerce) Rules 2020.
          </p>

          <div className="pt-2">
            <h5 className="text-xs font-bold text-white mb-2">Accepted Payment Options</h5>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">UPI (GPay / PhonePe)</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">Visa / MasterCard</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">Netbanking</span>
              <span className="px-2 py-1 rounded bg-purple-900/40 text-purple-300 border border-purple-800">Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <p>© {new Date().getFullYear()} Tamizh Tech (tamizhtech.in). All rights reserved.</p>
        <p>Built for public launch on <span className="text-purple-400 font-mono font-bold">ttrc.store</span></p>
      </div>
    </footer>
  );
}
