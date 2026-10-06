import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Mail, Phone, ShieldCheck, Truck, RefreshCw, CreditCard, Package, Users, BookOpen } from 'lucide-react';
import { BUSINESS_INFO } from '@ttrc/shared';
import {
  WhatsAppIcon,
  InstagramIcon,
  UpiLogo,
  RupayLogo,
  VisaLogo,
  MastercardLogo,
  NetBankingIcon,
  CodBadgeIcon,
} from '@/components/ui/brand-icons';

export default function Footer() {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 pt-12 pb-24 md:pb-12 mt-auto">
      {/* Trust Badges Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 mb-10 border-b border-slate-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EEE8FA] text-[#844AFB] flex-shrink-0">
              <Truck size={22} />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-slate-900">India-Wide Delivery</h4>
              <p className="text-xs text-slate-500">Fast via Shiprocket courier</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EEE8FA] text-[#844AFB] flex-shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-slate-900">100% Genuine Parts</h4>
              <p className="text-xs text-slate-500">Directly sourced & tested</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EEE8FA] text-[#844AFB] flex-shrink-0">
              <RefreshCw size={22} />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-slate-900">7-Day Replacement</h4>
              <p className="text-xs text-slate-500">For defective components</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EEE8FA] text-[#844AFB] flex-shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-slate-900">Secure Checkout</h4>
              <p className="text-xs text-slate-500">UPI, Cards, NetBanking, COD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-10">

        {/* Brand column (spans 2 on md) */}
        <div className="col-span-2 md:col-span-1 space-y-4">
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
            Official e-commerce platform of{' '}
            <a href="https://tamizhtech.in" target="_blank" rel="noopener noreferrer" className="text-slate-900 font-semibold hover:text-[#844AFB] transition-colors">
              Tamizh Tech
            </a>
            , empowering STEM students, roboticists, and makers across India.
          </p>
          <div className="space-y-1.5 text-xs">
            <p className="flex items-start gap-2 text-slate-600">
              <MapPin size={13} className="text-[#844AFB] flex-shrink-0 mt-0.5" />
              <span>{BUSINESS_INFO.address}</span>
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <Mail size={13} className="text-[#844AFB] flex-shrink-0" />
              <a href={`mailto:${BUSINESS_INFO.email}`} className="hover:text-[#844AFB] transition-colors">
                {BUSINESS_INFO.email}
              </a>
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <Phone size={13} className="text-[#844AFB] flex-shrink-0" />
              <a href="tel:+917904902978" className="hover:text-[#844AFB] transition-colors font-medium">
                {BUSINESS_INFO.phone}
              </a>
            </p>
          </div>
          {/* Social */}
          <div className="flex items-center gap-2.5 pt-1">
            <a
              href={BUSINESS_INFO.whatsapp || 'https://wa.me/917904902978'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
              aria-label="Chat on WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
            </a>
            <a
              href={BUSINESS_INFO.instagram || 'https://www.instagram.com/ttrc.store/'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
              aria-label="Follow TTRC Store on Instagram"
            >
              <InstagramIcon className="w-4 h-4 text-white" />
            </a>
          </div>
        </div>

        {/* Shop column */}
        <div>
          <h4 className="font-heading text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <Package size={13} className="text-[#844AFB]" />
            Shop
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/category/gamified-robots" className="text-slate-600 hover:text-[#844AFB] transition-colors">Gamified Robots</Link></li>
            <li><Link href="/category/stem-kits" className="text-slate-600 hover:text-[#844AFB] transition-colors">STEM Kits</Link></li>
            <li><Link href="/category/motors" className="text-slate-600 hover:text-[#844AFB] transition-colors">Motors & Drivers</Link></li>
            <li><Link href="/category/sensors" className="text-slate-600 hover:text-[#844AFB] transition-colors">Sensors</Link></li>
            <li><Link href="/category/batteries" className="text-slate-600 hover:text-[#844AFB] transition-colors">Batteries & Power</Link></li>
            <li><Link href="/category/fasteners" className="text-slate-600 hover:text-[#844AFB] transition-colors">Fasteners</Link></li>
            <li><Link href="/category/drones" className="text-slate-600 hover:text-[#844AFB] transition-colors">Drones</Link></li>
            <li><Link href="/category/wires-connectors" className="text-slate-600 hover:text-[#844AFB] transition-colors">Wires & Connectors</Link></li>
          </ul>
        </div>

        {/* Customer column */}
        <div>
          <h4 className="font-heading text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <Users size={13} className="text-[#844AFB]" />
            Customer
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/account" className="text-slate-600 hover:text-[#844AFB] transition-colors">My Account</Link></li>
            <li><Link href="/orders" className="text-slate-600 hover:text-[#844AFB] transition-colors">Track Orders</Link></li>
            <li><Link href="/account/wishlist" className="text-slate-600 hover:text-[#844AFB] transition-colors">Wishlist</Link></li>
            <li><Link href="/cart" className="text-slate-600 hover:text-[#844AFB] transition-colors">Shopping Cart</Link></li>
            <li><Link href="/shipping-policy" className="text-slate-600 hover:text-[#844AFB] transition-colors">Shipping Info</Link></li>
            <li><Link href="/return-refund-policy" className="text-slate-600 hover:text-[#844AFB] transition-colors">Returns & Refunds</Link></li>
            <li><Link href="/faq" className="text-slate-600 hover:text-[#844AFB] transition-colors">FAQ & Support</Link></li>
            <li><Link href="/contact" className="text-slate-600 hover:text-[#844AFB] transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* Business column */}
        <div>
          <h4 className="font-heading text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <BookOpen size={13} className="text-[#844AFB]" />
            Business
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/bulk-enquiry" className="text-slate-600 hover:text-[#844AFB] transition-colors">Bulk / Institutional Orders</Link></li>
            <li><Link href="/bulk-orders" className="text-slate-600 hover:text-[#844AFB] transition-colors">Wholesale Pricing</Link></li>
            <li><Link href="/about" className="text-slate-600 hover:text-[#844AFB] transition-colors">About Tamizh Tech</Link></li>
            <li>
              <a
                href="https://tamizhtech.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-[#844AFB] transition-colors"
              >
                Company Website ↗
              </a>
            </li>
          </ul>
        </div>

        {/* Legal column */}
        <div>
          <h4 className="font-heading text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#844AFB]" />
            Legal
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/privacy-policy" className="text-slate-600 hover:text-[#844AFB] transition-colors">Privacy Policy (DPDP 2023)</Link></li>
            <li><Link href="/terms" className="text-slate-600 hover:text-[#844AFB] transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/shipping-policy" className="text-slate-600 hover:text-[#844AFB] transition-colors">Shipping Policy</Link></li>
            <li><Link href="/return-refund-policy" className="text-slate-600 hover:text-[#844AFB] transition-colors">Return & Refund Policy</Link></li>
            <li><Link href="/cancellation-policy" className="text-slate-600 hover:text-[#844AFB] transition-colors">Cancellation Policy</Link></li>
            <li><Link href="/grievance-officer" className="text-slate-600 hover:text-[#844AFB] transition-colors">Grievance Officer</Link></li>
            <li><Link href="/warranty" className="text-slate-600 hover:text-[#844AFB] transition-colors">Warranty Information</Link></li>
          </ul>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-700 mb-2">Payment Methods</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="h-7 px-2.5 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-xs" title="UPI">
                <UpiLogo className="h-3.5 w-auto" />
              </div>
              <div className="h-7 px-2 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-xs" title="RuPay">
                <RupayLogo className="h-3.5 w-auto" />
              </div>
              <div className="h-7 px-2 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-xs" title="Visa">
                <VisaLogo className="h-2.5 w-auto" />
              </div>
              <div className="h-7 px-2 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-xs" title="Mastercard">
                <MastercardLogo className="h-4 w-auto" />
              </div>
              <div className="h-7 px-2 rounded-md bg-white border border-slate-200 flex items-center gap-1 text-[10px] font-semibold text-slate-700 shadow-xs" title="NetBanking">
                <NetBankingIcon className="h-3.5 w-3.5 text-slate-700" />
                <span>NetBanking</span>
              </div>
              <div className="h-7 px-2.5 rounded-md bg-[#EEE8FA] border border-[#AF87F8]/40 flex items-center gap-1 text-[10px] font-bold text-[#6721F2] shadow-xs" title="Cash on Delivery">
                <CodBadgeIcon className="h-3.5 w-3.5" />
                <span>COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 mt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© {new Date().getFullYear()} Tamizh Tech (tamizhtech.in). All rights reserved.</p>
        <p>
          Country of Origin declared per Consumer Protection (E-Commerce) Rules 2020.{' '}
          <span className="text-[#844AFB] font-mono font-bold">ttrc.store</span>
        </p>
      </div>
    </footer>
  );
}
