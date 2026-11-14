import * as React from 'react';
export const revalidate = 60;

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
  ChevronRight,
  Target,
  Rocket,
  Calendar,
  MapPin,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryCard } from '@/components/store/category-card';
import { HomeTabs } from '@/components/home/home-tabs';
import { HeroBannerSlider } from '@/components/home/hero-banner-slider';
import { getActiveHeroBannersAction } from '@/actions/banners';
import { NewsletterForm } from '@/components/home/newsletter-form';
import {
  getStoreCategories,
  getStoreProducts,
  toStoreProductCardProps,
} from '@/lib/mongodb/catalog';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/json-ld';

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
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

// ─── Hero — dynamic banner slider with admin support ──────────────────────────

async function HeroSection() {
  const banners = await getActiveHeroBannersAction();

  return (
    <section
      className="relative overflow-hidden bg-white border-b border-[#E5E7EB] lg:min-h-[calc(100vh-140px)] flex items-center"
      aria-label="TTRC Store hero"
    >
      {/* Subtle clean background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #14141A 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

          {/* Left: Hero Copy */}
          <div className="lg:col-span-6 space-y-4 lg:space-y-4 text-left">

            {/* Brand Ecosystem Tagline Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] shadow-2xs hover:border-[#E3132A]/30 transition-colors">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E3132A] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E3132A]" />
              </span>
              <span className="text-xs text-[#14141A] font-medium tracking-tight">
                <span className="font-bold text-[#14141A]">Build, repair, upgrade, innovate:</span>{' '}
                <span className="text-[#6B7280]">one trusted robotics ecosystem</span>
              </span>
            </div>

            {/* H1 */}
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold tracking-tight text-[#14141A] leading-[1.12]">
              Engineering Robotics &amp;<br />
              <span className="text-[#E3132A]">Electronics &amp; Components</span>
            </h1>

            <p className="text-[#6B7280] text-sm sm:text-base max-w-xl leading-relaxed">
              TTRC is India’s one-stop robotics platform: our own robots plus every compatible component, from the smallest screw to complete robotic systems, so anyone can build, repair, upgrade and innovate from one trusted source.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <Link href="/search">
                <Button
                  size="default"
                  className="gap-2 bg-[#E3132A] hover:bg-[#B80F21] text-white font-extrabold text-xs sm:text-sm px-6 h-10 sm:h-11 shadow-md shadow-red-900/10 rounded-xl transition-all hover:shadow-red-900/20 hover:-translate-y-px"
                  id="hero-shop-products"
                >
                  <span>Shop Category</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/events/shaastra-roborun-2027">
                <Button
                  variant="outline"
                  size="default"
                  className="gap-2 border-[#E5E7EB] hover:border-[#E3132A] text-[#14141A] hover:text-[#E3132A] bg-white font-extrabold text-xs sm:text-sm px-5 h-10 sm:h-11 rounded-xl transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-[#E3132A]" />
                  <span>Shaastra 2027 RoboRun</span>
                </Button>
              </Link>
            </div>

            {/* Trust micro-strip */}
            <div className="pt-3 flex flex-wrap items-center gap-4 sm:gap-5 text-xs font-bold text-[#14141A] border-t border-[#E5E7EB]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#E3132A]" />
                <span>GST Invoices</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#E3132A]" />
                <span>Dispatch within 10 days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck size={14} className="text-[#E3132A]" />
                <span>Pan-India Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building size={14} className="text-[#E3132A]" />
                <span>Bulk Orders Welcome</span>
              </div>
            </div>
          </div>

          {/* Right: Auto-rotating Special Offer Poster Slider (3s interval) */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <HeroBannerSlider banners={banners} />
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
      title: 'Dispatch Within 10 Days',
      sub: 'All orders dispatched within 10 days across India',
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
    <section className="border-y border-[#E5E7EB] bg-white" aria-label="Service highlights">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FDECEE] text-[#E3132A] flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-[#14141A] leading-snug">{item.title}</p>
                <p className="text-[11px] text-[#6B7280] leading-tight">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── IIT Madras Shaastra 2027 RoboRun Spotlight ──────────────────────────────

function ShaastraRoboRunSpotlight() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Shaastra 2027 RoboRun Competition">
      <div className="relative overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-xs hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Banner Graphic */}
          <div className="lg:col-span-7 relative aspect-[21/9] sm:aspect-[2.3/1] lg:aspect-auto lg:h-full min-h-[220px] sm:min-h-[280px] bg-[#14141A] overflow-hidden">
            <Image
              src="/banners/shaastra-roborun-2027.webp"
              alt="IIT Madras Shaastra 2027 RoboRun Competition"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#E3132A] text-white shadow-md">
                Live Event
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#14141A]/80 backdrop-blur-md text-white border border-white/20">
                IIT Madras SAC
              </span>
            </div>
          </div>

          {/* Event Content & Action */}
          <div className="lg:col-span-5 p-6 sm:p-8 space-y-4 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E3132A]">
                  Autonomous Line Follower Challenge
                </span>
              </div>
              <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#14141A] tracking-tight leading-tight">
                RoboRun 2027
              </h3>
              <p className="text-xs font-semibold text-[#6B7280]">
                Shaastra 2027 · Indian Institute of Technology (IIT) Madras
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#14141A] leading-relaxed">
              Build your autonomous line follower bot with TTRC kits and components. Compete at the Student Activity Centre, IIT Madras with ₹60,000 in prizes.
            </p>

            <div className="grid grid-cols-2 gap-2.5 py-1">
              <div className="p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider flex items-center gap-1">
                  <Trophy size={11} className="text-[#E3132A]" />
                  <span>Prize Pool</span>
                </p>
                <p className="text-sm font-extrabold text-[#E3132A]">₹60,000</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider flex items-center gap-1">
                  <Calendar size={11} className="text-[#6B7280]" />
                  <span>Video Deadline</span>
                </p>
                <p className="text-sm font-extrabold text-[#14141A]">15 Dec 2026</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider flex items-center gap-1">
                  <Calendar size={11} className="text-[#6B7280]" />
                  <span>Main Event</span>
                </p>
                <p className="text-sm font-extrabold text-[#14141A]">06 Jan 2027</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider flex items-center gap-1">
                  <MapPin size={11} className="text-[#6B7280]" />
                  <span>Bot Size</span>
                </p>
                <p className="text-sm font-extrabold text-[#14141A]">&lt; 20 × 20 cm</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/events/shaastra-roborun-2027" className="flex-1 min-w-[140px]">
                <Button className="w-full bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold text-xs h-10 rounded-xl shadow-xs transition-all">
                  <span>Build with TTRC</span>
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
              <a
                href="https://unstop.com/competitions/roborun-2027-iit-madras-1775922"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px]"
              >
                <Button
                  variant="outline"
                  className="w-full border-[#E5E7EB] hover:border-[#14141A] text-[#14141A] font-bold text-xs h-10 rounded-xl bg-white"
                >
                  Register on Unstop
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Categories section ────────────────────────────────────────────────────────

async function CategoriesSection() {
  const categories = await getStoreCategories({ mainOnly: true });
  const visibleCategories = categories.filter((cat) => cat.productCount > 0 || cat.imageUrl);

  return (
    <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
      {/* Section header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold text-[#E3132A] uppercase tracking-widest mb-1">Catalog</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#14141A] tracking-tight">
            Shop Electronics &amp; Components
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            Browse verified sensors, motor drivers, controllers, and hardware modules.
          </p>
        </div>
        {visibleCategories.length > 0 && (
          <Link
            href="/category/gamified-robots"
            className="text-xs font-bold text-[#E3132A] hover:text-[#B80F21] inline-flex items-center gap-1 group"
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
        <div className="p-10 text-center rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-2">
          <Package size={32} className="mx-auto text-[#E3132A]" />
          <p className="text-sm font-bold text-[#14141A]">
            Categories will appear here once configured.
          </p>
        </div>
      )}
    </section>
  );
}

// ─── Product collections (Featured / Best Sellers / New Arrivals) ───────────

async function ProductCollectionsSection() {
  const [allProductsRes, featuredRes, bestSellersRes, newArrivalsRes] = await Promise.all([
    getStoreProducts({ limit: 100, sort: 'order_added' }),
    getStoreProducts({ isFeatured: true, limit: 100, sort: 'order_added' }),
    getStoreProducts({ isBestseller: true, limit: 100, sort: 'order_added' }),
    getStoreProducts({ isNewArrival: true, limit: 100, sort: 'order_added' }),
  ]);

  const allProducts = allProductsRes.products;

  const featuredMap = new Map(featuredRes.products.map((p) => [p.id, p]));
  const combinedFeatured = [
    ...featuredRes.products,
    ...allProducts.filter((p) => !featuredMap.has(p.id)),
  ];

  const featuredCards = (combinedFeatured.length > 0 ? combinedFeatured : allProducts).map(toStoreProductCardProps);
  const bestSellerCards = (
    bestSellersRes.products.length > 0 ? bestSellersRes.products : allProducts
  ).map(toStoreProductCardProps);
  const newArrivalCards = (
    newArrivalsRes.products.length > 0 ? newArrivalsRes.products : allProducts
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
  const collections = [
    {
      id: 'gamified-robots',
      title: 'Competition Robots',
      sub: 'Robo Race · Line Follower · Soccer',
      href: '/category/gamified-robots',
    },
    {
      id: 'stem-kits',
      title: 'STEM Learning Kits',
      sub: 'School & club essentials',
      href: '/category/stem-kits',
    },
    {
      id: 'fasteners',
      title: 'Fasteners & Hardware',
      sub: 'M2 · M3 · M4 screws, standoffs',
      href: '/category/fasteners',
    },
    {
      id: 'motors',
      title: 'Motors & Drivers',
      sub: 'BO, DC, servo, stepper, BLDC',
      href: '/category/motors',
    },
    {
      id: 'batteries',
      title: 'Batteries & Power',
      sub: 'LiPo 2S/3S/4S · Li-ion · Chargers',
      href: '/category/batteries',
    },
  ];

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5"
      aria-label="Engineering collections"
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold text-[#E3132A] uppercase tracking-widest mb-1">Curated Catalog</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#14141A] tracking-tight">
            Engineering Collections
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            Explore engineering electronics &amp; components built for competition robots and STEM projects.
          </p>
        </div>
        <Link
          href="/category/gamified-robots"
          className="text-xs font-bold text-[#E3132A] hover:text-[#B80F21] inline-flex items-center gap-1 group"
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
            className="group relative overflow-hidden rounded-2xl bg-white text-[#14141A] border border-[#E5E7EB] hover:border-[#E3132A] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            aria-label={col.title}
          >
            <div className="p-5 space-y-3 min-h-[120px] flex flex-col justify-between">
              <div>
                <p className="font-heading text-sm font-bold leading-snug">{col.title}</p>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">{col.sub}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#E3132A] group-hover:text-[#B80F21] transition-colors">
                <span>Explore {col.title}</span>
                <ChevronRight
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </div>
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
        <div className="relative overflow-hidden rounded-2xl bg-[#14141A] text-white p-7 border border-[#E5E7EB]">
          <div className="relative z-10 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E3132A] bg-[#E3132A]/10 px-2.5 py-1 rounded border border-[#E3132A]/20">
              Precision Fasteners
            </span>
            <h3 className="font-heading text-xl font-bold">M2 / M3 / M4 Screws,<br />Standoffs &amp; Spacers</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
              Engineering-grade fasteners for robot chassis, PCB standoffs, and frames. Build securely without stripped screws.
            </p>
            <Link href="/category/fasteners">
              <Button className="bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold text-xs rounded-xl h-9 px-5 mt-2">
                Explore Fasteners
              </Button>
            </Link>
          </div>
        </div>

        {/* Batteries promo */}
        <div className="relative overflow-hidden rounded-2xl bg-[#14141A] text-white p-7 border border-[#E5E7EB]">
          <div className="relative z-10 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E3132A] bg-[#E3132A]/10 px-2.5 py-1 rounded border border-[#E3132A]/20">
              Power Systems
            </span>
            <h3 className="font-heading text-xl font-bold">LiPo Batteries<br />&amp; Charging Systems</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
              Power your competition robots with high-C LiPo packs and Li-ion cells. Tested chargers and safe battery accessories.
            </p>
            <Link href="/category/batteries">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 rounded-xl font-bold text-xs h-9 px-5 mt-2"
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

// ─── Vision & Mission section ─────────────────────────────────────────────────

function VisionMissionSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Our Vision and Mission">
      <div className="rounded-3xl border border-[#E5E7EB] bg-[#F7F7F8] p-6 sm:p-10 shadow-2xs space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] shadow-2xs">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E3132A] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E3132A]" />
              </span>
              <span className="text-xs text-[#14141A] font-medium tracking-tight">
                <span className="font-bold text-[#14141A]">Build, repair, upgrade, innovate:</span>{' '}
                <span className="text-[#6B7280]">one trusted robotics ecosystem</span>
              </span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#14141A] tracking-tight">
              Our Vision &amp; Mission
            </h2>
            <p className="text-xs sm:text-base text-[#6B7280] max-w-2xl leading-relaxed">
              TTRC is India’s one-stop robotics platform: our own robots plus every compatible component, from the smallest screw to complete robotic systems, so anyone can build, repair, upgrade and innovate from one trusted source.
            </p>
          </div>
          <Link
            href="/about"
            className="text-xs sm:text-sm font-bold text-[#E3132A] hover:text-[#B80F21] inline-flex items-center gap-1.5 group self-start md:self-auto shrink-0"
          >
            <span>Read Complete Mission &amp; Pillars</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Vision Card */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 sm:p-7 space-y-4 shadow-2xs hover:border-[#E3132A]/40 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E3132A] text-white flex items-center justify-center shadow-xs">
                <Target size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E3132A]">The Goal</span>
                <h3 className="font-heading text-lg sm:text-xl font-extrabold text-[#14141A]">OUR VISION</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#14141A] leading-relaxed">
              To establish TTRC as <strong className="text-[#14141A]">India&apos;s leading competition-robotics platform</strong> and a globally recognized robotics brand, empowering students, engineers, and innovators to design, build, repair, and advance robots through <strong className="text-[#14141A]">one trusted ecosystem</strong>.
            </p>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Bringing everything needed to build a robot—from the smallest fastener to advanced actuators and complete systems—into one accessible platform.
            </p>
          </div>

          {/* Mission Card */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 sm:p-7 space-y-4 shadow-2xs hover:border-[#E3132A]/40 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14141A] text-[#E3132A] flex items-center justify-center shadow-xs">
                <Rocket size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6B7280]">The Action</span>
                <h3 className="font-heading text-lg sm:text-xl font-extrabold text-[#14141A]">OUR MISSION</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#14141A] leading-relaxed">
              To design, develop, and deliver <strong className="text-[#14141A]">innovative, high-quality robotics products</strong> while building a comprehensive, one-stop platform for every component needed to build a robot—from screws, fasteners, wires, and electronics to motor drivers, sensors, and full kits.
            </p>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Enabling everyone to <strong className="text-[#14141A]">build, repair, upgrade, and innovate with confidence</strong> through reliable products and fast nationwide delivery.
            </p>
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
      <div className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F7F7F8] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left max-w-xl relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#E3132A] bg-white px-2.5 py-1 rounded-lg border border-[#E5E7EB] shadow-2xs">
              Institutional &amp; Club Orders
            </span>
            <span className="text-xs text-[#6B7280] font-semibold">· GST Invoicing Guaranteed</span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#14141A]">
            Buying for a Team, Lab or School?
          </h2>
          <p className="text-xs text-[#6B7280] leading-relaxed max-w-lg">
            Need robotics electronics &amp; components for an innovation lab or team? We provide formal quotations, institutional POs, GST invoices, and custom bundles for schools across India.
          </p>
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
          <Link href="/bulk-enquiry">
            <Button
              className="w-full sm:w-auto bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold text-xs h-11 px-6 rounded-xl shadow-xs"
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
              className="w-full sm:w-auto border-[#E5E7EB] text-[#14141A] hover:bg-white font-bold text-xs h-11 px-5 rounded-xl bg-white"
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
      <div className="p-8 text-center rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-3">
        <Award size={32} className="mx-auto text-[#E3132A]" />
        <h2 className="font-heading text-base font-bold text-[#14141A]">
          Verified Buyer Reviews — Displayed After Purchase Verification
        </h2>
        <p className="text-xs text-[#6B7280] max-w-lg mx-auto leading-relaxed">
          In compliance with Consumer Protection E-Commerce Rules 2020, TTRC Store only displays reviews from authenticated customer orders. Consequently, buyers receive honest feedback without incentivised or mock ratings.
        </p>
      </div>
    </section>
  );
}

// ─── Newsletter section ────────────────────────────────────────────────────────

function NewsletterSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Newsletter signup">
      <div className="relative overflow-hidden rounded-3xl bg-[#14141A] text-white p-8 sm:p-10 border border-[#E5E7EB] shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-left space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#E3132A] font-bold">
                Stay Connected
              </span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              Get TTRC Updates
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Get timely updates on new motor batches, sensor arrays, and STEM electronics &amp; components. We guarantee zero spam.
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
    <div className="space-y-12 sm:space-y-16 pb-20 bg-transparent text-[#14141A]">
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      {/* 1. Hero — static, renders immediately */}
      <HeroSection />

      {/* 2. Trust strip — static, instant */}
      <TrustStrip />

      {/* 3. Shaastra 2027 RoboRun Spotlight */}
      <ShaastraRoboRunSpotlight />

      {/* 4. Categories — streams in */}
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

      {/* 5. Product collections — streams in, parallel queries */}
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

      {/* 6. Engineering collections */}
      <EngineeringCollections />

      {/* 7. Promo blocks */}
      <EngineeringSpotlight />

      {/* 8. Vision & Mission Section */}
      <VisionMissionSection />

      {/* 9. B2B / Bulk CTA */}
      <B2BSection />

      {/* 10. Reviews policy note */}
      <ReviewsNote />

      {/* 11. Newsletter */}
      <NewsletterSection />
    </div>
  );
}
