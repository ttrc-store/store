'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Truck,
  Building,
  Award,
  BookOpen,
  Wrench,
  Bot,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryCard } from '@/components/store/category-card';
import { ProductCard } from '@/components/store/product-card';
import { CATALOG_PRODUCTS, toProductCardProps } from '@/lib/catalog-data';

export default function HomePage() {
  const [activeTab, setActiveTab] = React.useState<'featured' | 'new' | 'best'>('featured');
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = React.useState(false);
  const [newsletterError, setNewsletterError] = React.useState('');

  const getCategoryCount = (slug: string) => {
    return CATALOG_PRODUCTS.filter(
      (p) => p.categoryId === slug || p.tags?.includes(slug) || p.slug?.includes(slug)
    ).length;
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError('');
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterError('Please enter a valid email address');
      return;
    }
    setNewsletterSubmitted(true);
  };

  // Filter products based on active tab
  const tabProducts = React.useMemo(() => {
    if (activeTab === 'new') {
      return [...CATALOG_PRODUCTS].reverse();
    }
    if (activeTab === 'best') {
      return CATALOG_PRODUCTS.filter((p) => p.stockQty > 0);
    }
    return CATALOG_PRODUCTS;
  }, [activeTab]);

  return (
    <div className="space-y-12 pb-16 bg-white text-slate-900">
      {/* 1. HERO BANNER SECTION (Clean White + Purple Marketplace Style) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50/70 via-white to-purple-50/20 border-b border-purple-100 pt-8 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-tight">
                PRO-GRADE <span className="text-purple-700">ROBOTICS</span> &amp; HARDWARE COMPONENTS
              </h1>

              <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed">
                Empowering students, robotics clubs, and hardware innovators across India with precision competition kits, motors, sensors, fasteners, and 100% compatible spare parts.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/category/gamified-robots">
                  <Button size="lg" className="gap-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-sm sm:text-base shadow-md shadow-purple-900/20 rounded-xl glow-purple-sm">
                    Shop Robo Race Kits <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link href="/category/stem-kits">
                  <Button variant="outline" size="lg" className="border-purple-200 text-purple-950 hover:bg-purple-50 rounded-xl font-bold text-sm sm:text-base">
                    Explore STEM Kits
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-600 border-t border-purple-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <ShieldCheck size={16} className="text-purple-700" />
                  <span>GST Tax Invoice</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Zap size={16} className="text-purple-700" />
                  <span>Same-Day Dispatch</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Truck size={16} className="text-purple-700" />
                  <span>Pan-India Courier</span>
                </div>
              </div>
            </div>

            {/* Right Hero Showcase Card */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-2xl bg-purple-950 p-8 border border-purple-900 shadow-2xl flex flex-col items-center justify-center text-center overflow-hidden group">
                <div className="absolute top-4 right-4 bg-purple-700 text-white font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  Featured Series
                </div>
                <Image
                  src="/brand/ttrc-logo.png"
                  alt="TTRC Store Hero"
                  width={240}
                  height={100}
                  priority
                  className="object-contain mb-6 drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                />
                <h3 className="font-heading text-xl font-bold text-white mb-2">Robo Race &amp; Line Follower Kits</h3>
                <p className="text-xs text-purple-200 mb-6 max-w-xs">Complete competition kits with guaranteed spare parts compatibility</p>
                <Link href="/category/gamified-robots">
                  <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md rounded-xl px-6">
                    View Competition Kits
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY / DEPARTMENT STRIP (Fact-driven counts) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">Shop By Department</h2>
            <p className="text-xs sm:text-sm text-slate-500">Browse robotics components and kits by category</p>
          </div>
          <Link href="/category/gamified-robots" className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1">
            All Categories <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <CategoryCard slug="gamified-robots" name="Gamified Robots" itemCount={getCategoryCount('gamified-robots')} iconName="robot" />
          <CategoryCard slug="stem-kits" name="STEM Kits" itemCount={getCategoryCount('stem-kits')} iconName="stem" />
          <CategoryCard slug="fasteners" name="Fasteners & Screws" itemCount={getCategoryCount('fasteners')} iconName="fastener" />
          <CategoryCard slug="batteries" name="Batteries & Power" itemCount={getCategoryCount('batteries')} iconName="battery" />
          <CategoryCard slug="motors" name="Motors & Drivers" itemCount={getCategoryCount('motors')} iconName="motor" />
          <CategoryCard slug="sensors" name="Sensors Array" itemCount={getCategoryCount('sensors')} iconName="sensor" />
          <CategoryCard slug="drones" name="Drone Parts" itemCount={getCategoryCount('drones')} iconName="drone" />
          <CategoryCard slug="wires-connectors" name="Wires & Connectors" itemCount={getCategoryCount('wires-connectors')} iconName="wire" />
        </div>
      </section>

      {/* 3. PROMOTIONAL BANNERS ROW (3-Card Marketplace Feature Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Promo Card 1 */}
          <div className="p-6 rounded-2xl bg-purple-50/80 border border-purple-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                Robotics Competition
              </span>
              <h3 className="font-heading font-bold text-lg text-slate-900">Robo Race &amp; Line Follower Kits</h3>
              <p className="text-xs text-slate-600">Built for speed, accuracy, and quick component replacement on field.</p>
            </div>
            <Link href="/category/gamified-robots" className="mt-4 inline-flex items-center text-xs font-bold text-purple-700 hover:underline gap-1">
              Explore Kits <ArrowRight size={14} />
            </Link>
          </div>

          {/* Promo Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-slate-200 px-2.5 py-0.5 rounded-full">
                Precision Hardware
              </span>
              <h3 className="font-heading font-bold text-lg text-slate-900">Fasteners, Bolts &amp; Standoffs</h3>
              <p className="text-xs text-slate-600">M2, M3 stainless steel screws, nylon standoffs, and hex nuts for chassis assembly.</p>
            </div>
            <Link href="/category/fasteners" className="mt-4 inline-flex items-center text-xs font-bold text-purple-700 hover:underline gap-1">
              Shop Fasteners <ArrowRight size={14} />
            </Link>
          </div>

          {/* Promo Card 3 */}
          <div className="p-6 rounded-2xl bg-purple-950 text-white flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest bg-purple-900 px-2.5 py-0.5 rounded-full border border-purple-800">
                Institutional B2B
              </span>
              <h3 className="font-heading font-bold text-lg text-white">STEM Lab &amp; Bulk Orders</h3>
              <p className="text-xs text-purple-200">Special institutional quotes and GST invoices for Schools &amp; STEM Labs.</p>
            </div>
            <Link href="/bulk-enquiry" className="mt-4 inline-flex items-center text-xs font-bold text-purple-300 hover:text-white hover:underline gap-1">
              Request B2B Quote <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. TODAY'S FEATURED DEALS & CATALOG PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">Featured Products &amp; Kits</h2>
            <p className="text-xs sm:text-sm text-slate-500">Live components and kits in store catalog</p>
          </div>
          <Link href="/category/gamified-robots" className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1">
            Browse All <ArrowRight size={14} />
          </Link>
        </div>

        {CATALOG_PRODUCTS.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {CATALOG_PRODUCTS.slice(0, 10).map((product) => (
              <ProductCard key={product.id} {...toProductCardProps(product)} />
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-2xl bg-purple-50/40 border border-purple-100 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2">
              <Sparkles size={24} />
            </div>
            <p className="font-bold text-slate-900 text-base">Store Catalog Ready — No Products Added Yet</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Products are managed live through the Admin Panel (`/admin`). Create products or import catalog CSV in `/admin/products` to populate the storefront.
            </p>
            <Link href="/admin/products" className="inline-block px-5 py-2.5 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 shadow-sm transition-colors">
              Manage Products in Admin
            </Link>
          </div>
        )}
      </section>

      {/* 5. PROMOTIONAL CAMPAIGN BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950 p-8 sm:p-12 text-white border border-purple-800 overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-widest bg-purple-900/80 px-3 py-1 rounded-full border border-purple-700">
              Technical Engineering Store
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold leading-tight">
              Build Your Next Robotics Project with Verified Components
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
              Every motor, sensor, battery, and chassis on TTRC Store is tested for voltage tolerance, mechanical compatibility, and pin configuration accuracy.
            </p>
            <div className="pt-2">
              <Link href="/category/gamified-robots">
                <Button className="bg-purple-700 hover:bg-purple-800 text-white font-bold h-11 px-6 rounded-xl glow-purple-sm text-xs">
                  Explore Full Catalog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRENDING PRODUCTS WITH TAB FILTERING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">Trending Products</h2>
            <p className="text-xs text-slate-500">Popular items across competition &amp; learning kits</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'featured' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Featured
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'new' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Arrivals
            </button>
            <button
              onClick={() => setActiveTab('best')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'best' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Stock
            </button>
          </div>
        </div>

        {tabProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tabProducts.slice(0, 10).map((product) => (
              <ProductCard key={product.id} {...toProductCardProps(product)} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 text-xs text-slate-500">
            No products available under this filter yet.
          </div>
        )}
      </section>

      {/* 7. TRUST / SERVICE BENEFITS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-start gap-3">
            <ShieldCheck size={24} className="text-purple-700 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-slate-900 text-xs">GST Tax Invoice</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Compliant bill of supply / tax invoices for institutional filing.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap size={24} className="text-purple-700 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Dispatch Efficiency</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Orders dispatched within 24–48 hours from Coimbatore warehouse.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck size={24} className="text-purple-700 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Surface Battery Delivery</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Safe surface shipping for high-capacity LiPo &amp; Li-ion batteries.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Award size={24} className="text-purple-700 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Technical Support</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Direct guidance on kit assembly and pinout compatibility.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. IDEAS / COLLECTIONS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">Ideas for Your Next Upgrade</h2>
            <p className="text-xs sm:text-sm text-slate-500">Explore tailored component configurations for robotics builds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/category/gamified-robots">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-purple-600 transition-all hover:shadow-lg space-y-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Bot size={20} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                Robo Race Setup
              </h3>
              <p className="text-xs text-slate-500">Dual BO motor configurations, high-torque wheels, and lightweight chassis options.</p>
              <div className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-1">
                Explore Setup <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          <Link href="/category/stem-kits">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-purple-600 transition-all hover:shadow-lg space-y-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <BookOpen size={20} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                STEM School Lab Config
              </h3>
              <p className="text-xs text-slate-500">Complete practical kits for hands-on electronics &amp; robotics learning modules.</p>
              <div className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-1">
                Explore STEM <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          <Link href="/category/drones">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-purple-600 transition-all hover:shadow-lg space-y-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Wrench size={20} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                Custom Drone Frames
              </h3>
              <p className="text-xs text-slate-500">Carbon fiber arms, BLDC motors, ESC controllers, and flight accessories.</p>
              <div className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-1">
                Explore Drone Parts <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          <Link href="/bulk-enquiry">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-purple-600 transition-all hover:shadow-lg space-y-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Building size={20} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                Institutional Bulk Supply
              </h3>
              <p className="text-xs text-slate-500">Custom quotations, formal purchase orders, and tax invoices for engineering colleges.</p>
              <div className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-1">
                Request Quote <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 9. EXCLUSIVE DEALS & NEWSLETTER SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Feature Box */}
          <div className="lg:col-span-5 p-8 rounded-3xl bg-purple-700 text-white flex flex-col justify-between shadow-lg">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest bg-purple-800 px-3 py-1 rounded-full inline-block">
                Institutional Orders
              </span>
              <h3 className="font-heading text-2xl font-extrabold text-white">
                B2B &amp; STEM Lab Bulk Discounts
              </h3>
              <p className="text-xs text-purple-100 leading-relaxed">
                Order complete kits, spare parts, and fasteners in quantity for your school, college robotics team, or STEM club.
              </p>
            </div>
            <div className="pt-6">
              <Link href="/bulk-enquiry">
                <Button className="bg-white text-purple-900 hover:bg-purple-50 font-bold h-11 px-6 rounded-xl text-xs">
                  Request Quotation Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Newsletter Card */}
          <div className="lg:col-span-7 p-8 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <h3 className="font-heading text-2xl font-bold text-slate-900">Get Tech &amp; Stock Updates</h3>
              <p className="text-xs text-slate-500">
                Subscribe to receive notifications when new robotics kits, microcontrollers, and spare parts arrive in stock.
              </p>
            </div>

            <div className="mt-6">
              {newsletterSubmitted ? (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 flex items-center gap-3 text-xs font-bold">
                  <CheckCircle2 size={18} className="text-purple-700 flex-shrink-0" />
                  <span>You&apos;re subscribed! We will keep you updated on new robotics releases.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Enter your official or personal email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="flex-1 h-11 px-4 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                    />
                    <Button type="submit" className="h-11 px-6 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 glow-purple-sm">
                      <Send size={14} /> Subscribe
                    </Button>
                  </div>
                  {newsletterError && (
                    <p className="text-[11px] font-bold text-red-600">{newsletterError}</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
