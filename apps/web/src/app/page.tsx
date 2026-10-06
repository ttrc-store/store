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
  Wrench,
  Package,
  Award,
  Sparkles,
  ChevronRight,
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

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-slate-100 animate-pulse aspect-[3/4]" />
      ))}
    </div>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-slate-100 animate-pulse h-40" />
      ))}
    </div>
  );
}


// ─── Hero — static, no DB, renders immediately ────────────────────────────────

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[#EEE8FA]/70 via-[#FDFDFD] to-[#F8F4FF]/50 border-b border-purple-100/80 lg:min-h-[calc(100vh-140px)] flex items-center"
      aria-label="TTRC Store hero"
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #844AFB 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-5 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

          {/* Left: Hero Copy */}
          <div className="lg:col-span-6 space-y-4 lg:space-y-4 text-left">

            {/* H1 */}
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold tracking-tight text-[#050507] leading-[1.12]">
              Engineering Products<br />
              <span className="text-[#844AFB]">Built to Create More</span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base max-w-lg leading-relaxed">
              Robotics kits, precision motors, industrial sensors, LiPo batteries, fasteners
              and STEM hardware — from Tamizh Tech, delivered pan-India.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <Link href="/category/gamified-robots">
                <Button
                  size="default"
                  className="gap-2 bg-[#844AFB] hover:bg-[#6721F2] text-white font-extrabold text-xs sm:text-sm px-6 h-10 sm:h-11 shadow-md shadow-purple-900/20 rounded-xl transition-all hover:shadow-purple-900/35 hover:-translate-y-px"
                  id="hero-shop-products"
                >
                  <span>Shop Products</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="#categories-section">
                <Button
                  variant="outline"
                  size="default"
                  className="border-[#AF87F8]/60 text-[#1E0D45] hover:bg-[#EEE8FA] rounded-xl font-bold text-xs sm:text-sm px-5 h-10 sm:h-11 transition-all"
                  id="hero-explore-categories"
                >
                  Explore Categories
                </Button>
              </Link>
            </div>

            {/* Trust micro-strip */}
            <div className="pt-3 flex flex-wrap items-center gap-4 sm:gap-5 text-xs font-bold text-slate-700 border-t border-[#EEE8FA]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#844AFB]" />
                <span>GST Invoices</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#844AFB]" />
                <span>Same-Day Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck size={14} className="text-[#844AFB]" />
                <span>Pan-India Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building size={14} className="text-[#844AFB]" />
                <span>Bulk Orders Welcome</span>
              </div>
            </div>
          </div>

          {/* Right: Hero Product Image */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[420px]">
              {/* Subtle background glow */}
              <div
                className="absolute inset-0 rounded-3xl bg-[#844AFB]/10 blur-2xl scale-95 pointer-events-none"
                aria-hidden="true"
              />
              {/* Product image */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl bg-white max-h-[calc(100vh-200px)] flex items-center justify-center">
                <Image
                  src="/products/lfr6.0.png"
                  alt="TTRC LFR 6.0 — Line Follower Robot Competition Kit"
                  width={550}
                  height={550}
                  priority
                  className="w-full h-auto max-h-[calc(100vh-200px)] object-contain block"
                  sizes="(max-width: 1024px) 100vw, 420px"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Trust / service strip ─────────────────────────────────────────────────────

function TrustStrip() {
  const items = [
    {
      icon: <Truck size={22} />,
      title: 'Fast Courier Dispatch',
      sub: 'Same-day across India via Shiprocket',
    },
    {
      icon: <ShieldCheck size={22} />,
      title: 'GST Compliant Invoices',
      sub: 'Official tax invoices on every order',
    },
    {
      icon: <Wrench size={22} />,
      title: 'Engineering Grade Parts',
      sub: 'Tested & verified components',
    },
    {
      icon: <Building size={22} />,
      title: 'Wholesale & B2B',
      sub: 'Volume pricing for teams & labs',
    },
  ];

  return (
    <section className="border-y border-slate-100 bg-white" aria-label="Service highlights">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EEE8FA] text-[#844AFB] flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-snug">{item.title}</p>
                <p className="text-[11px] text-slate-500 leading-tight">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Categories section ────────────────────────────────────────────────────────

async function CategoriesSection() {
  const categories = await getStoreCategories();
  // Only show categories that have products or have a configured image
  const visibleCategories = categories.filter((cat) => cat.productCount > 0 || cat.imageUrl);

  return (
    <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
      {/* Section header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold text-[#844AFB] uppercase tracking-widest mb-1">Catalog</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#050507] tracking-tight">
            Shop by Category
          </h2>
        </div>
        {visibleCategories.length > 0 && (
          <Link
            href="/category/gamified-robots"
            className="text-xs font-bold text-[#844AFB] hover:text-[#6721F2] inline-flex items-center gap-1 group"
            aria-label="View all categories"
          >
            <span>All Categories</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {visibleCategories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {visibleCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              slug={cat.slug}
              name={cat.name}
              description={cat.description}
              itemCount={cat.productCount}
              imageUrl={cat.imageUrl}
            />
          ))}
        </div>
      ) : (
        <div className="p-10 text-center rounded-2xl bg-[#EEE8FA]/30 border border-purple-100 space-y-2">
          <Package size={32} className="mx-auto text-[#844AFB]" />
          <p className="text-sm font-bold text-slate-700">
            Categories will appear here once configured.
          </p>
        </div>
      )}
    </section>
  );
}

// ─── Product collections (Featured / Best Sellers / New Arrivals) ───────────

async function ProductCollectionsSection() {
  const [featuredRes, bestSellersRes, newArrivalsRes] = await Promise.all([
    getStoreProducts({ isFeatured: true, limit: 10 }),
    getStoreProducts({ isBestseller: true, limit: 10 }),
    getStoreProducts({ isNewArrival: true, limit: 10 }),
  ]);

  const needsFallback =
    featuredRes.products.length === 0 &&
    bestSellersRes.products.length === 0 &&
    newArrivalsRes.products.length === 0;

  const fallbackProducts = needsFallback
    ? (await getStoreProducts({ limit: 10 })).products
    : [];

  const featuredCards = (
    featuredRes.products.length > 0 ? featuredRes.products : fallbackProducts
  ).map(toStoreProductCardProps);
  const bestSellerCards = (
    bestSellersRes.products.length > 0 ? bestSellersRes.products : fallbackProducts
  ).map(toStoreProductCardProps);
  const newArrivalCards = (
    newArrivalsRes.products.length > 0 ? newArrivalsRes.products : fallbackProducts
  ).map(toStoreProductCardProps);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
      <HomeTabs
        featuredProducts={featuredCards}
        bestSellers={bestSellerCards}
        newArrivals={newArrivalCards}
      />
    </section>
  );
}

// ─── Engineering Collections ─────────────────────────────────────────────────

function EngineeringCollections() {
  // These link to REAL category slugs — only shown because those categories exist
  const collections = [
    {
      id: 'gamified-robots',
      title: 'Competition Robots',
      sub: 'Robo Race · Line Follower · Soccer',
      href: '/category/gamified-robots',
      accent: '#844AFB',
      bgGradient: 'linear-gradient(135deg, #1E0D45 0%, #2D1260 100%)',
    },
    {
      id: 'stem-kits',
      title: 'STEM Learning Kits',
      sub: 'School & club essentials',
      href: '/category/stem-kits',
      accent: '#AF87F8',
      bgGradient: 'linear-gradient(135deg, #150A38 0%, #1E0D45 100%)',
    },
    {
      id: 'fasteners',
      title: 'Fasteners & Hardware',
      sub: 'M2 · M3 · M4 screws, standoffs',
      href: '/category/fasteners',
      accent: '#6721F2',
      bgGradient: 'linear-gradient(135deg, #1A0B3B 0%, #240E55 100%)',
    },
    {
      id: 'motors',
      title: 'Motors & Drivers',
      sub: 'BO, DC, servo, stepper, BLDC',
      href: '/category/motors',
      accent: '#844AFB',
      bgGradient: 'linear-gradient(135deg, #1E0D45 0%, #2D1260 100%)',
    },
    {
      id: 'batteries',
      title: 'Batteries & Power',
      sub: 'LiPo 2S/3S/4S · Li-ion · Chargers',
      href: '/category/batteries',
      accent: '#AF87F8',
      bgGradient: 'linear-gradient(135deg, #150A38 0%, #1E0D45 100%)',
    },
  ];

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5"
      aria-label="Engineering collections"
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold text-[#844AFB] uppercase tracking-widest mb-1">Explore</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#050507] tracking-tight">
            Engineering Collections
          </h2>
        </div>
        <Link
          href="/category/gamified-robots"
          className="text-xs font-bold text-[#844AFB] hover:text-[#6721F2] inline-flex items-center gap-1 group"
        >
          <span>View All</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={col.href}
            className="group relative overflow-hidden rounded-2xl bg-[#1E0D45] text-white border border-purple-900/50 hover:border-[#AF87F8] transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/40 hover:-translate-y-0.5"
            style={{ background: col.bgGradient }}
            aria-label={col.title}
          >
            <div className="p-5 space-y-3 min-h-[120px] flex flex-col justify-between">
              <div>
                <p className="font-heading text-sm font-bold leading-snug">{col.title}</p>
                <p className="text-[11px] text-purple-200/80 mt-1 leading-relaxed">{col.sub}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#AF87F8] group-hover:text-white transition-colors">
                <span>Explore</span>
                <ChevronRight
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </div>
            {/* Corner accent */}
            <div
              className="absolute bottom-0 right-0 w-24 h-24 rounded-full opacity-20 blur-xl pointer-events-none"
              style={{ background: col.accent }}
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Engineering Spotlight promo ──────────────────────────────────────────────

function EngineeringSpotlight() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Featured engineering hardware">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fasteners promo */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E0D45] to-[#0A041B] text-white p-7 border border-purple-900/40">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#844AFB]/20 rounded-full blur-2xl" aria-hidden="true" />
          <div className="relative z-10 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#AF87F8] bg-purple-950 px-2.5 py-1 rounded border border-purple-800">
              Precision Fasteners
            </span>
            <h3 className="font-heading text-xl font-bold">M2 / M3 / M4 Screws,<br />Standoffs & Spacers</h3>
            <p className="text-xs text-purple-200/90 leading-relaxed max-w-xs">
              Engineering-standard fasteners for competition chassis, PCB standoffs and
              structural robotics. Never strip a screw during a match.
            </p>
            <Link href="/category/fasteners">
              <Button className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs rounded-xl h-9 px-5 mt-2">
                Explore Fasteners
              </Button>
            </Link>
          </div>
        </div>

        {/* Batteries promo */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D1260] to-[#1E0D45] text-white p-7 border border-purple-900/40">
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#6721F2]/20 rounded-full blur-2xl" aria-hidden="true" />
          <div className="relative z-10 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#AF87F8] bg-purple-950 px-2.5 py-1 rounded border border-purple-800">
              Power Systems
            </span>
            <h3 className="font-heading text-xl font-bold">LiPo Batteries<br />& Charging Systems</h3>
            <p className="text-xs text-purple-200/90 leading-relaxed max-w-xs">
              High-C LiPo 2S/3S/4S packs, Li-ion 18650 cells, balance chargers and
              BMS modules selected for robotics competition stress.
            </p>
            <Link href="/category/batteries">
              <Button
                variant="outline"
                className="border-purple-700 text-purple-200 hover:bg-purple-900/60 rounded-xl font-bold text-xs h-9 px-5 mt-2"
              >
                Explore Batteries
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── B2B / Bulk section ────────────────────────────────────────────────────────

function B2BSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Bulk and institutional orders">
      <div className="relative overflow-hidden rounded-2xl border border-[#AF87F8]/30 bg-gradient-to-r from-[#EEE8FA]/80 to-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#EEE8FA]/60 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="space-y-2 text-left max-w-xl relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#6721F2] bg-white px-2.5 py-1 rounded-lg border border-[#AF87F8]/40 shadow-sm">
              Institutional & Club Orders
            </span>
            <span className="text-xs text-slate-500 font-semibold">· GST Invoicing Guaranteed</span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            Buying for a Team, Lab or School?
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
            We provide formal quotations, institutional POs, GST tax invoices and customised kit
            bundles for schools, colleges and innovation labs across India.
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
          <Link href="/bulk-enquiry">
            <Button
              className="w-full sm:w-auto bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs h-11 px-6 rounded-xl shadow-md"
              id="b2b-request-quote"
            >
              Request Bulk Quote
            </Button>
          </Link>
          <a
            href="https://wa.me/917904902978?text=Hello%20TTRC%20Store%2C%20I%20need%20a%20bulk%20institutional%20quotation"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="w-full sm:w-auto border-[#AF87F8]/60 text-[#1E0D45] hover:bg-white font-bold text-xs h-11 px-5 rounded-xl"
              id="b2b-whatsapp"
            >
              Chat on WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Reviews placeholder (no fake data) ───────────────────────────────────────

function ReviewsNote() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Customer reviews policy">
      <div className="p-8 text-center rounded-2xl bg-[#EEE8FA]/30 border border-purple-100 space-y-3">
        <Award size={32} className="mx-auto text-[#844AFB]" />
        <h2 className="font-heading text-base font-bold text-slate-900">
          Verified Buyer Reviews — Displayed After Purchase Verification
        </h2>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
          In compliance with Consumer Protection E-Commerce Rules 2020, TTRC Store only displays
          reviews authenticated through customer order records. No incentivised or mock reviews.
        </p>
      </div>
    </section>
  );
}

// ─── Newsletter section ────────────────────────────────────────────────────────

function NewsletterSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Newsletter signup">
      <div className="relative overflow-hidden rounded-3xl bg-[#1E0D45] text-white p-8 sm:p-10 border border-purple-900 shadow-xl">
        {/* Background blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#844AFB]/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#6721F2]/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-left space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#AF87F8]" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#AF87F8]">
                Stay Connected
              </span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              Get TTRC Updates
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
              Product launches, new motor batches, sensor arrays, competition kit releases
              and engineering resources. Zero spam.
            </p>
          </div>
          <div className="w-full md:w-auto md:min-w-[360px]">
            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Root Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="space-y-12 sm:space-y-16 pb-20 bg-transparent text-[#050507]">
        {/* 1. Hero — static, renders immediately */}
        <HeroSection />

        {/* 2. Trust strip — static, instant */}
        <TrustStrip />

        {/* 3. Categories — streams in */}
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse w-52" />
              <CategoryGridSkeleton />
            </div>
          }
        >
          <CategoriesSection />
        </Suspense>

        {/* 4. Product collections — streams in, parallel queries */}
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-64" />
              <ProductGridSkeleton />
            </div>
          }
        >
          <ProductCollectionsSection />
        </Suspense>

        {/* 5. Engineering collections */}
        <EngineeringCollections />

        {/* 6. Promo blocks */}
        <EngineeringSpotlight />

        {/* 7. B2B / Bulk CTA */}
        <B2BSection />

        {/* 8. Reviews policy note */}
        <ReviewsNote />

        {/* 9. Newsletter */}
        <NewsletterSection />
      </div>
  );
}
