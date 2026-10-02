import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Mail, Phone, ShieldCheck, Truck, RefreshCw, CreditCard } from 'lucide-react';
import { BUSINESS_INFO } from '@ttrc/shared';
import { WhatsAppIcon, InstagramIcon } from '@/components/ui/brand-icons';

export default function Footer() {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 pt-12 pb-24 md:pb-12 mt-auto">
      {/* Trust Badges Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 mb-10 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100/80 shadow-xs">
            <Truck size={24} />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-slate-900">India-Wide Shipping</h4>
            <p className="text-xs text-slate-500">Fast delivery via Shiprocket</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100/80 shadow-xs">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-slate-900">100% Genuine Components</h4>
            <p className="text-xs text-slate-500">Directly sourced & tested</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100/80 shadow-xs">
            <RefreshCw size={24} />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-slate-900">7-Day Replacement</h4>
            <p className="text-xs text-slate-500">For defective components</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100/80 shadow-xs">
            <CreditCard size={24} />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-slate-900">Secure Checkout</h4>
            <p className="text-xs text-slate-500">UPI, Cards, NetBanking, COD</p>
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
          <p className="text-xs leading-relaxed text-slate-500">
            TTRC Store is the official e-commerce platform of <span className="text-slate-900 font-semibold">Tamizh Tech</span>, dedicated to empowering STEM students, roboticists, and makers across India with high-quality components.
          </p>
          <div className="space-y-2 text-xs">
            <p className="flex items-center gap-2 text-slate-600">
              <MapPin size={14} className="text-purple-700 flex-shrink-0" />
              <span>{BUSINESS_INFO.address}</span>
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <Mail size={14} className="text-purple-700 flex-shrink-0" />
              <a href={`mailto:${BUSINESS_INFO.email}`} className="hover:text-purple-700 transition-colors">{BUSINESS_INFO.email}</a>
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <Phone size={14} className="text-purple-700 flex-shrink-0" />
              <a href="tel:+917904902978" className="hover:text-purple-700 transition-colors font-medium">{BUSINESS_INFO.phone}</a>
            </p>
            <p className="text-purple-700 font-mono text-[11px] font-semibold">GSTIN: {BUSINESS_INFO.gstin}</p>

            {/* Social Connect (Original WhatsApp & Instagram) */}
            <div className="pt-2 flex items-center gap-2.5">
              <a
                href={BUSINESS_INFO.whatsapp || 'https://wa.me/917904902978'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xs"
                aria-label="Chat on WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
              </a>
              <a
                href={BUSINESS_INFO.instagram || 'https://www.instagram.com/ttrc.store/'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xs"
                aria-label="Follow TTRC Store on Instagram"
              >
                <InstagramIcon className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Category Links */}
        <div>
          <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-l-2 border-purple-600 pl-2">
            Categories
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/category/gamified-robots" className="text-slate-600 hover:text-purple-700 transition-colors">Gamified Robots (Robo Race / Soccer)</Link></li>
            <li><Link href="/category/stem-kits" className="text-slate-600 hover:text-purple-700 transition-colors">STEM Kits</Link></li>
            <li><Link href="/category/motors" className="text-slate-600 hover:text-purple-700 transition-colors">BO &amp; DC Motors</Link></li>
            <li><Link href="/category/sensors" className="text-slate-600 hover:text-purple-700 transition-colors">IR &amp; Ultrasonic Sensors</Link></li>
            <li><Link href="/category/batteries" className="text-slate-600 hover:text-purple-700 transition-colors">LiPo &amp; Li-ion Batteries</Link></li>
            <li><Link href="/category/drones" className="text-slate-600 hover:text-purple-700 transition-colors">Drone Components</Link></li>
          </ul>
        </div>

        {/* Quick Links & Legal */}
        <div>
          <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-l-2 border-purple-600 pl-2">
            Company &amp; Policies
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/about" className="text-slate-600 hover:text-purple-700 transition-colors">About Tamizh Tech</Link></li>
            <li><Link href="/contact" className="text-slate-600 hover:text-purple-700 transition-colors">Contact Us</Link></li>
            <li><Link href="/bulk-enquiry" className="text-slate-600 hover:text-purple-700 transition-colors">Bulk / Institutional Enquiry</Link></li>
            <li><Link href="/privacy-policy" className="text-slate-600 hover:text-purple-700 transition-colors">Privacy Policy (DPDP 2023)</Link></li>
            <li><Link href="/terms" className="text-slate-600 hover:text-purple-700 transition-colors">Terms &amp; Conditions</Link></li>
            <li><Link href="/shipping-policy" className="text-slate-600 hover:text-purple-700 transition-colors">Shipping Policy</Link></li>
            <li><Link href="/return-refund-policy" className="text-slate-600 hover:text-purple-700 transition-colors">Return &amp; Refund Policy</Link></li>
            <li><Link href="/cancellation-policy" className="text-slate-600 hover:text-purple-700 transition-colors">Cancellation Policy</Link></li>
            <li><Link href="/grievance-officer" className="text-slate-600 hover:text-purple-700 transition-colors">Grievance Officer Contact</Link></li>
            <li><Link href="/faq" className="text-slate-600 hover:text-purple-700 transition-colors">FAQ &amp; Support</Link></li>
            <li><Link href="/warranty" className="text-slate-600 hover:text-purple-700 transition-colors">Warranty Information</Link></li>
          </ul>
        </div>

        {/* Store Trust & Country of Origin */}
        <div className="space-y-4">
          <h4 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider border-l-2 border-purple-600 pl-2">
            Country of Origin
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            All products listed explicitly declare their Country of Origin in compliance with the Consumer Protection (E-Commerce) Rules 2020.
          </p>

          <div className="pt-2">
            <h5 className="text-xs font-bold text-slate-900 mb-2">Accepted Payment Options</h5>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
              <span className="px-2 py-1 rounded bg-slate-50 border border-slate-200">UPI (GPay / PhonePe)</span>
              <span className="px-2 py-1 rounded bg-slate-50 border border-slate-200">Visa / MasterCard</span>
              <span className="px-2 py-1 rounded bg-slate-50 border border-slate-200">Netbanking</span>
              <span className="px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 mt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© {new Date().getFullYear()} Tamizh Tech (tamizhtech.in). All rights reserved.</p>
        <p>Built for public launch on <span className="text-purple-700 font-mono font-bold">ttrc.store</span></p>
      </div>
    </footer>
  );
}
