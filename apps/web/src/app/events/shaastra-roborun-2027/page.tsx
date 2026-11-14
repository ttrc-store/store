import * as React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Trophy,
  Users,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  Flag,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStoreProducts, toStoreProductCardProps } from '@/lib/mongodb/catalog';
import { ProductCard } from '@/components/store/product-card';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'IIT Madras Shaastra 2027 RoboRun | Build Your Line Follower with TTRC',
  description:
    'Prepare for RoboRun 2027 at Shaastra, IIT Madras. Build autonomous line follower bots compliant with competition specs (<20x20cm, 3-4cm lines, yellow block displacement). Shop competition kits, 7-array sensors, N20 motors, and LFR wheels from TTRC Store.',
  keywords: [
    'Shaastra 2027 RoboRun',
    'IIT Madras RoboRun',
    'Line Follower Robot competition',
    'RoboRun 2027 IIT Madras',
    'Shaastra robotics competition',
    'TTRC LF 6.0',
    'TTRC Line Follower',
    'Autonomous line follower kit India',
  ],
  openGraph: {
    title: 'IIT Madras Shaastra 2027 RoboRun — Build with TTRC',
    description:
      'Compete in RoboRun 2027 at Shaastra, IIT Madras (₹60K Prize Pool). Get race-ready line follower robots, spare parts, and sensor arrays at TTRC Store.',
    images: [
      {
        url: '/banners/shaastra-roborun-2027.webp',
        width: 1024,
        height: 296,
        alt: 'Shaastra 2027 RoboRun IIT Madras - TTRC Store',
      },
    ],
  },
};

export default async function ShaastraRoboRunPage() {
  // Fetch line follower kits and spare parts for the competition
  const { products } = await getStoreProducts({
    limit: 12,
  });

  const lfrProducts = products.filter(
    (p) =>
      p.slug.includes('lfr') ||
      p.slug.includes('lf-6-0') ||
      p.slug.includes('line-x') ||
      p.slug.includes('sensor') ||
      p.slug.includes('motor') ||
      p.slug.includes('wheel')
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#14141A]">
      {/* Breadcrumb Navigation */}
      <div className="bg-[#F7F7F8] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <Link href="/" className="hover:text-[#E3132A] transition-colors">
              Home
            </Link>
            <ChevronRight size={13} />
            <span className="text-[#6B7280]">Competitions &amp; Events</span>
            <ChevronRight size={13} />
            <span className="font-semibold text-[#E3132A]">Shaastra 2027 RoboRun</span>
          </nav>
        </div>
      </div>

      {/* Hero Event Banner Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
        <div className="relative rounded-3xl overflow-hidden border border-[#E5E7EB] bg-[#14141A] shadow-xl aspect-[1024/296] w-full">
          <Image
            src="/banners/shaastra-roborun-2027.webp"
            alt="Shaastra 2027 RoboRun at IIT Madras Campus"
            fill
            priority
            unoptimized
            className="object-contain"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>

        {/* Title, Badge & Quick Overview */}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-[#E5E7EB]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#FDECEE] text-[#E3132A] font-extrabold text-xs tracking-wider uppercase border border-[#E3132A]/20">
                IIT Madras Shaastra 2027
              </span>
              <span className="px-3 py-1 rounded-full bg-[#F7F7F8] text-[#14141A] font-bold text-xs border border-[#E5E7EB]">
                Student Activity Centre (SAC), Chennai
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#14141A] tracking-tight">
              RoboRun 2027
            </h1>
            <p className="text-base sm:text-lg text-[#6B7280] font-medium max-w-2xl">
              Build your autonomous line follower bot with TTRC and compete for the{' '}
              <strong className="text-[#E3132A] font-bold">₹60,000 Prize Pool</strong> at India&apos;s premier tech fest.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://unstop.com/competitions/roborun-2027-iit-madras-1775922"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold text-sm shadow-md transition-all hover:-translate-y-0.5"
            >
              <span>Register on Unstop</span>
              <ExternalLink size={16} />
            </a>
            <a
              href="https://www.shaastra.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F7F7F8] text-[#14141A] font-bold text-sm border border-[#E5E7EB] transition-colors"
            >
              <span>Shaastra Official</span>
              <ExternalLink size={15} />
            </a>
            <Link
              href="/category/gamified-robots/line-follower"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FDECEE] hover:bg-[#E3132A] text-[#E3132A] hover:text-white font-bold text-sm transition-colors"
            >
              <span>Shop LF Kits</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* 4 Key Highlight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
          <div className="p-5 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#FDECEE] text-[#E3132A] flex items-center justify-center mb-2">
              <Trophy size={20} />
            </div>
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Prize Pool</p>
            <p className="text-2xl font-black font-mono text-[#E3132A]">₹60,000</p>
            <p className="text-[11px] text-[#6B7280]">Cash prizes &amp; certificates</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#FDECEE] text-[#E3132A] flex items-center justify-center mb-2">
              <MapPin size={20} />
            </div>
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Venue</p>
            <p className="text-lg font-bold text-[#14141A] leading-snug">IIT Madras</p>
            <p className="text-[11px] text-[#6B7280]">Student Activity Centre, Chennai</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#FDECEE] text-[#E3132A] flex items-center justify-center mb-2">
              <Users size={20} />
            </div>
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Team Size</p>
            <p className="text-2xl font-black text-[#14141A]">1 – 5 Members</p>
            <p className="text-[11px] text-[#6B7280]">Robotics engineers &amp; students</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#FDECEE] text-[#E3132A] flex items-center justify-center mb-2">
              <Zap size={20} />
            </div>
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Bot Specs</p>
            <p className="text-2xl font-black text-[#14141A] font-mono">&lt; 20×20 cm</p>
            <p className="text-[11px] text-[#6B7280]">Autonomous line follower</p>
          </div>
        </div>

        {/* Timelines & Problem Statement Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-10">
          {/* Left: Event Stages & Timelines */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
                <Calendar size={18} className="text-[#E3132A]" />
                <h2 className="font-heading text-xl font-bold text-[#14141A]">
                  Stages &amp; Critical Timelines
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB]">
                  <div className="px-3 py-1.5 rounded-lg bg-[#E3132A] text-white font-mono font-bold text-xs text-center shrink-0">
                    STAGE 1
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-[#14141A]">Video Submission Round</p>
                      <span className="text-[11px] font-mono font-bold text-[#E3132A]">15 Dec 2026, 11:59 PM</span>
                    </div>
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      Online submission round. Prepare a small maze with two curves and demonstrate your autonomous line-following bot navigating it cleanly. Shoot a short video clip and attach the file on Unstop.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB]">
                  <div className="px-3 py-1.5 rounded-lg bg-[#14141A] text-white font-mono font-bold text-xs text-center shrink-0">
                    ROUND 1
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-[#14141A]">Offline First Round (Maze Run)</p>
                      <span className="text-[11px] font-mono font-semibold text-[#6B7280]">06 Jan 2027, 09:00 AM – 12:00 PM</span>
                    </div>
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      Every qualified team runs through the official maze track. Top-scoring teams with fastest completion and minimal penalty points qualify for the Grand Final.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-[#FDECEE] border border-[#E3132A]/20">
                  <div className="px-3 py-1.5 rounded-lg bg-[#E3132A] text-white font-mono font-bold text-xs text-center shrink-0">
                    FINALS
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-[#E3132A]">Grand Final (Maze + Block Displacement)</p>
                      <span className="text-[11px] font-mono font-bold text-[#E3132A]">06 Jan 2027, 12:01 PM – 06:00 PM</span>
                    </div>
                    <p className="text-xs text-[#14141A] leading-relaxed">
                      The final round track introduces <strong>yellow blocks (10cm × 10cm × 10cm)</strong> directly placed on top of yellow squares. Bots must push and completely displace these blocks from the squares to activate checkpoints!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Rules & Bot Constraints */}
            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
                <Flag size={18} className="text-[#E3132A]" />
                <h2 className="font-heading text-lg font-bold text-[#14141A]">
                  Official RoboRun Bot Rules
                </h2>
              </div>
              <ul className="space-y-2 text-xs text-[#6B7280]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-[#E3132A] shrink-0 mt-0.5" />
                  <span><strong>Bot Dimensions:</strong> Maximum 20 cm × 20 cm footprint. No height restriction.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-[#E3132A] shrink-0 mt-0.5" />
                  <span><strong>Full Autonomy:</strong> Self-contained bot only. No remote controllers, Bluetooth, or wireless override allowed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-[#E3132A] shrink-0 mt-0.5" />
                  <span><strong>Track Line:</strong> High-contrast black line on white surface, 3 cm to 4 cm line thickness.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-[#E3132A] shrink-0 mt-0.5" />
                  <span><strong>Safe Power:</strong> Battery-powered only. No combustion or hazardous fuels.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-[#E3132A] shrink-0 mt-0.5" />
                  <span><strong>Track Integrity:</strong> Must not scratch, cut, burn, or mark the arena surface.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: How TTRC Prepares You to Win */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
                <Sparkles size={18} className="text-[#E3132A]" />
                <h2 className="font-heading text-xl font-bold text-[#14141A]">
                  Build Your RoboRun Winner with TTRC
                </h2>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                TTRC designs and manufactures competition-tested Line Follower Robots engineered specifically for Indian college robotics challenges like IIT Madras Shaastra, IIT Bombay Techfest, and NIT fests.
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-[#14141A]">1. High-Density 7-Array Sensor</p>
                    <span className="text-[10px] font-mono font-bold text-[#E3132A] bg-[#FDECEE] px-2 py-0.5 rounded">3–4 cm Optimized</span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    The TTRC LF 6.0 7-Array analog sensor provides ultra-fine PID feedback across 3–4 cm competition lines and 90° hairpin turns without losing tracking.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-[#14141A]">2. Sub-20 cm Competition Chassis</p>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">100% Rule Compliant</span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    The TTRC LF-6.0 and LINE X PRO chassis measure strictly within 17 cm × 14 cm, safely passing the 20 cm × 20 cm dimension gate at Shaastra inspection.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-[#14141A]">3. Torque &amp; Traction for Block Displacement</p>
                    <span className="text-[10px] font-mono font-bold text-[#E3132A] bg-[#FDECEE] px-2 py-0.5 rounded">Finals Ready</span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    TTRC high-grip silicone LFR wheels paired with high-torque N20 600RPM gear motors provide the exact pushing force required to displace 10cm yellow blocks off checkpoints.
                  </p>
                </div>
              </div>

              {/* Coordinator Contact Box */}
              <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-[#6B7280]">
                  Official RoboRun Coordinator: <strong>Pranav (+91 9505152545)</strong>
                </span>
                <span className="text-[#6B7280]">
                  TTRC Support: <strong>+91 7904902978</strong>
                </span>
              </div>
            </div>

            {/* Direct CTA Card */}
            <div className="p-6 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-3">
              <h3 className="font-heading text-base font-bold text-[#14141A]">
                Need Custom Gearing or Institutional Bulk Kits for Your College Team?
              </h3>
              <p className="text-xs text-[#6B7280]">
                We provide discounted packages and express delivery across Tamil Nadu and all of India for collegiate teams participating in Shaastra 2027.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/contact"
                  className="px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FDECEE] text-[#E3132A] font-bold text-xs border border-[#E5E7EB] transition-colors"
                >
                  Contact Engineering Team
                </Link>
                <Link
                  href="/bulk-orders"
                  className="px-4 py-2 rounded-xl bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold text-xs transition-colors"
                >
                  Request Bulk / Team Quote
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Line Follower Kits & Compatible Components */}
        <div className="my-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5E7EB] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E3132A] uppercase tracking-wider mb-1">
                <ShieldCheck size={14} /> Competition Grade Hardware
              </div>
              <h2 className="font-heading text-2xl font-extrabold text-[#14141A]">
                Shaastra RoboRun Recommended Kits &amp; Spares
              </h2>
            </div>
            <Link
              href="/category/gamified-robots/line-follower"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E3132A] hover:underline"
            >
              <span>View all Line Follower kits &amp; spares</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {lfrProducts.slice(0, 8).map((product) => {
              const cardProps = toStoreProductCardProps(product);
              return <ProductCard key={product.id} {...cardProps} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

