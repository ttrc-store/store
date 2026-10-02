import * as React from 'react';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Truck,
  Building,
  Award,
  Wrench,
  PhoneCall,
  Bot,
  Cpu,
  BatteryCharging,
  Radio,
  Cable,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryCard } from '@/components/store/category-card';
import { HomeTabs } from '@/components/home/home-tabs';
import { NewsletterForm } from '@/components/home/newsletter-form';
import {
  getStoreCategories,
  getStoreProducts,
  toStoreProductCardProps,
} from '@/lib/mongodb/catalog';

// ─── Skeleton components for Suspense fallbacks ──────────────────────────────

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-slate-100 animate-pulse aspect-[3/4]" />
      ))}
    </div>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-slate-100 animate-pulse h-32" />
      ))}
    </div>
  );
}

// ─── Above-fold: Hero + Trust strip — purely static, zero DB calls ────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#EEE8FA]/60 via-[#FDFDFD] to-[#EEE8FA]/30 border-b border-purple-100 pt-8 sm:pt-12 pb-14 sm:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEE8FA] text-[#6721F2] text-xs font-bold tracking-wider uppercase border border-[#AF87F8]/40">
              <span>ENGINEERING • ROBOTICS • ELECTRONICS</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#050507] leading-[1.1]">
              Build Better. <br />
              <span className="text-[#844AFB]">Build Smarter.</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed">
              Explore pro-grade robotics kits, high-drain batteries, sensors, precision motors, and
              100% compatible spare parts from Tamizh Tech. Engineered for competition teams, makers,
              and innovative labs across India.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/category/gamified-robots">
                <Button
                  size="lg"
                  className="gap-2 bg-[#844AFB] hover:bg-[#6721F2] text-white font-extrabold text-sm sm:text-base px-6 h-12 shadow-lg shadow-purple-900/20 rounded-xl transition-all"
                >
                  <span>SHOP PRODUCTS</span>
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="#categories-section">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-purple-300 text-[#1E0D45] hover:bg-[#EEE8FA] rounded-xl font-bold text-sm sm:text-base px-6 h-12"
                >
                  EXPLORE CATEGORIES
                </Button>
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-bold text-slate-600 border-t border-purple-100">
              <div className="flex items-center gap-1.5 text-slate-800">
                <ShieldCheck size={16} className="text-[#844AFB]" />
                <span>GST Compliant Invoices</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-800">
                <Zap size={16} className="text-[#844AFB]" />
                <span>Same-Day Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-800">
                <Truck size={16} className="text-[#844AFB]" />
                <span>Pan-India Courier</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual — pure CSS/HTML, zero image weight */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-gradient-to-tr from-[#1E0D45] via-[#2A135F] to-[#1E0D45] p-6 sm:p-8 text-white shadow-2xl border border-purple-900/40 overflow-hidden">
              {/* Decorative background glow — CSS only, no image */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#844AFB]/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#6721F2]/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-widest uppercase text-[#AF87F8] bg-purple-950/80 px-3 py-1 rounded-md border border-purple-800/60">
                    TTRC HARDWARE HUB
                  </span>
                  <span className="text-xs text-purple-200 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    Live Inventory
                  </span>
                </div>

                <div className="text-left space-y-2">
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold leading-snug">
                    High-Precision Robo Race &amp; STEM Architecture
                  </h2>
                  <p className="text-xs text-purple-200/90 leading-relaxed">
                    Custom laser-cut acrylic chassis, high-RPM metal gear motors, and calibrated
                    sensor arrays tested for extreme track conditions.
                  </p>
                </div>

                {/* Spec grid — text only, fast */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/40">
                    <span className="text-[10px] text-purple-300 uppercase block font-semibold">Chassis Tolerance</span>
                    <span className="font-mono text-sm font-bold text-white">&lt; 0.2mm Precision</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/40">
                    <span className="text-[10px] text-purple-300 uppercase block font-semibold">Motor Drivers</span>
                    <span className="font-mono text-sm font-bold text-white">Dual H-Bridge MOSFET</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    href="/category/gamified-robots"
                    className="text-xs font-bold text-white hover:text-[#AF87F8] flex items-center gap-1 group"
                  >
                    <span>Explore Gamified Robots</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <span className="text-[11px] font-mono text-[#AF87F8]">100% Genuine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {[
          { icon: <Truck size={20} />, title: 'Fast Courier Dispatch', sub: 'Same-day across India' },
          { icon: <ShieldCheck size={20} />, title: 'GST Compliant', sub: 'Official tax invoices' },
          { icon: <Wrench size={20} />, title: 'Engineering Grade', sub: 'Zero duplicate parts' },
          { icon: <Building size={20} />, title: 'Wholesale & B2B', sub: 'Volume tiered discounts' },
          { icon: <PhoneCall size={20} />, title: 'Engineer Support', sub: '+91 7904902978', colSpan: true },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-3 ${item.colSpan ? 'col-span-2 md:col-span-1' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-[#EEE8FA] text-[#844AFB] flex items-center justify-center flex-shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{item.title}</p>
              <p className="text-[11px] text-slate-500">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Data-fetching section components (server, stream independently) ──────────

async function CategoriesSection() {
  const categories = await getStoreCategories();

  return (
    <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-purple-100 pb-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#050507] tracking-tight">
            Shop by Category
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse precision robotics kits, industrial hardware, and compatible spare parts.
          </p>
        </div>
        <Link
          href="/category/gamified-robots"
          className="text-xs font-bold text-[#844AFB] hover:text-[#6721F2] inline-flex items-center gap-1 group"
        >
          <span>All Categories ({categories.length})</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              slug={cat.slug}
              name={cat.name}
              description={cat.description || `Browse ${cat.name} hardware`}
              itemCount={cat.productCount}
              imageUrl={cat.imageUrl}
            />
          ))}
        </div>
      ) : (
        <div className="p-10 text-center rounded-2xl bg-[#EEE8FA]/30 border border-purple-100 space-y-2">
          <Package size={32} className="mx-auto text-[#844AFB]" />
          <p className="text-sm font-bold text-slate-700">Categories will appear here once configured.</p>
        </div>
      )}
    </section>
  );
}

async function ProductCollectionsSection() {
  // All 3 product collection queries run in parallel — single round-trip to MongoDB
  const [featuredRes, bestSellersRes, newArrivalsRes] = await Promise.all([
    getStoreProducts({ isFeatured: true, limit: 8 }),
    getStoreProducts({ isBestseller: true, limit: 8 }),
    getStoreProducts({ isNewArrival: true, limit: 8 }),
  ]);

  // Shared fallback: one extra query only if ALL three returned empty
  const needsFallback =
    featuredRes.products.length === 0 &&
    bestSellersRes.products.length === 0 &&
    newArrivalsRes.products.length === 0;

  const fallbackProducts = needsFallback
    ? (await getStoreProducts({ limit: 8 })).products
    : [];

  const featuredCards = (featuredRes.products.length > 0 ? featuredRes.products : fallbackProducts).map(toStoreProductCardProps);
  const bestSellerCards = (bestSellersRes.products.length > 0 ? bestSellersRes.products : fallbackProducts).map(toStoreProductCardProps);
  const newArrivalCards = (newArrivalsRes.products.length > 0 ? newArrivalsRes.products : fallbackProducts).map(toStoreProductCardProps);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <HomeTabs
        featuredProducts={featuredCards}
        bestSellers={bestSellerCards}
        newArrivals={newArrivalCards}
      />
    </section>
  );
}

// ─── Static sections (no DB) ──────────────────────────────────────────────────

function EngineeringSpotlight() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#1E0D45] to-[#0A041B] text-white shadow-xl border border-purple-900/40 relative overflow-hidden">
        <div className="max-w-3xl relative z-10 space-y-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#AF87F8] bg-purple-950 px-3 py-1 rounded-md border border-purple-800">
            TAMIZH TECH FABRICATION &amp; HARDWARE
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
            Precision Screws, Standoffs, LiPo Packs &amp; Custom Drive Motors
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
            Don&apos;t compromise on loose chassis or stripped screw heads during critical match rounds.
            TTRC stocks engineering-standard M2/M3/M4 fasteners, high-C LiPo batteries, and industrial
            sensors selected specifically for robotics competition stress.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/category/fasteners">
              <Button className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl h-10 px-5">
                Explore Fasteners &amp; Hardware
              </Button>
            </Link>
            <Link href="/category/batteries">
              <Button
                variant="outline"
                className="border-purple-700 text-purple-200 hover:bg-purple-900/60 rounded-xl font-bold text-xs h-10 px-5"
              >
                Explore Batteries &amp; Power
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function B2BSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-purple-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#6721F2] bg-[#EEE8FA] px-2.5 py-1 rounded-md border border-[#AF87F8]/40">
              Institutional &amp; Club Orders
            </span>
            <span className="text-xs text-slate-500 font-semibold">• GST Invoicing Guaranteed</span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            Need 50+ Units for Schools, STEM Labs, or Robotics Clubs?
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            We provide formal commercial quotations, institutional purchase orders, GST tax invoices,
            and customized kit bundles for schools, colleges, and innovation labs across India.
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link href="/bulk-enquiry">
            <Button className="w-full sm:w-auto bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs h-11 px-6 rounded-xl shadow-md">
              Request Volume Quote
            </Button>
          </Link>
          <a
            href="https://wa.me/917904902978?text=Hello%20TTRC%20Store%2C%20I%20need%20a%20bulk%20institutional%20quotation"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="w-full sm:w-auto border-purple-200 text-purple-950 hover:bg-purple-50 font-bold text-xs h-11 px-5 rounded-xl"
            >
              Chat on WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
      <div className="flex items-center justify-between border-b border-purple-100 pb-3">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            Verified Customer Reviews
          </h2>
          <p className="text-xs text-slate-500">
            Genuine feedback submitted strictly by verified buyers after receiving their kits.
          </p>
        </div>
      </div>
      <div className="p-10 text-center rounded-2xl bg-[#EEE8FA]/30 border border-purple-100 space-y-3">
        <Award size={36} className="mx-auto text-[#844AFB]" />
        <h3 className="font-heading text-base font-bold text-slate-900">
          Official Buyer Reviews Displayed Upon Purchase Verification
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          In compliance with Consumer Protection E-Commerce Rules 2020, TTRC Store never posts
          incentivized or mock reviews. All feedback is authenticated through customer order records.
        </p>
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="p-8 sm:p-10 rounded-3xl bg-[#1E0D45] text-white text-center space-y-4 border border-purple-900 shadow-xl">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#AF87F8]">
          STAY CONNECTED WITH TTRC
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
          New Robotics Components &amp; Technical Bulletins
        </h2>
        <p className="text-xs sm:text-sm text-purple-200 max-w-lg mx-auto leading-relaxed">
          Get notified when new motor batches, sensor arrays, and competition kits are released in
          stock. Zero spam.
        </p>
        <NewsletterForm />
      </div>
    </section>
  );
}

// ─── Root Page — Server Component, streamed ───────────────────────────────────

export default function HomePage() {
  return (
    <div className="space-y-12 sm:space-y-16 pb-20 bg-[#FDFDFD] text-[#050507]">
      {/* 1. Hero — renders immediately (static HTML, no DB) */}
      <HeroSection />

      {/* 2. Trust strip — static, instant */}
      <TrustStrip />

      {/* 3. Categories — streams in after DB responds */}
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><CategoryGridSkeleton /></div>}>
        <CategoriesSection />
      </Suspense>

      {/* 4. Product collections — streams in, parallel queries */}
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-72" />
            <ProductGridSkeleton />
          </div>
        }
      >
        <ProductCollectionsSection />
      </Suspense>

      {/* 5–7. Static sections — no DB, render immediately alongside streaming */}
      <EngineeringSpotlight />
      <B2BSection />
      <ReviewsSection />
      <NewsletterSection />
    </div>
  );
}
