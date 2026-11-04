import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Tag, Sparkles, Zap, ShieldCheck, Truck, Percent, Gift, ChevronRight, HelpCircle } from 'lucide-react';
import { getStoreProducts } from '@/lib/mongodb/catalog';
import { ProductCard } from '@/components/store/product-card';
import { Button } from '@/components/ui/button';

export const revalidate = 1800; // 30 minutes ISR

const CANONICAL_URL = 'https://www.ttrc.store/offers';

export const metadata: Metadata = {
  title: 'Diwali Robotics Offers & Discounts | TTRC Store India',
  description:
    'Explore exclusive Diwali robotics offers and festive discounts at TTRC Store India. Flat savings on Line Follower Robot kits, Arduino & ESP32 STEM kits, LiPo batteries, and robotics sensors with fast pan-India delivery.',
  keywords: [
    'diwali robotics offers',
    'diwali robot kit discount',
    'robotics diwali sale india',
    'line follower robot diwali offer',
    'ttrc store diwali offers',
    'festive robotics deals',
    'stem kit diwali coupon',
    'arduino kit diwali sale',
    'esp32 robot kit diwali discount',
    'competition line follower robot discount',
  ],
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: 'Diwali Robotics Offers & Festive Sale — TTRC Store India',
    description:
      'Celebrate Diwali with special robotics deals. Flat discounts on competition Line Follower Robots, STEM kits, motors, sensors, and LiPo batteries.',
    url: CANONICAL_URL,
    siteName: 'TTRC Store',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://www.ttrc.store/brand/ttrc-logo.png',
        width: 1200,
        height: 630,
        alt: 'TTRC Store Diwali Robotics Offers & Festive Sale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diwali Robotics Offers & Festive Sale | TTRC Store',
    description:
      'Save big this festive season on genuine Indian robotics kits, high-speed line followers, sensors, and controllers.',
    images: ['https://www.ttrc.store/brand/ttrc-logo.png'],
  },
};

const DIWALI_FAQS = [
  {
    question: 'What are the top Diwali robotics offers available on TTRC Store?',
    answer:
      'TTRC Store offers festive discounts across all competition robotics kits including the TTRC LF 6.0 Line Follower Robot (Diwali offer at ₹2,999), TTRC LF-6.0 PRO at ₹4,999, and the championship-grade LINE X PRO at ₹8,999. In addition, customers receive festive bundle discounts on LiPo batteries, QTR sensor arrays, and N20 motor packages.',
  },
  {
    question: 'Are Line Follower Robot kits eligible for festive coupon codes?',
    answer:
      'Yes! All line follower kits, STEM educational kits, and robotic chassis are eligible for active festive coupon codes. Enter coupon code FESTIVE10 at checkout for an instant 10% discount on orders above ₹1,999.',
  },
  {
    question: 'How fast is delivery for Diwali robotics orders in India?',
    answer:
      'TTRC Store provides same-day dispatch for orders placed before 2:00 PM IST from our Tamil Nadu tech hub. Standard delivery across South India takes 1–3 business days, and Express Priority Air delivery reaches major Indian metro cities (Bengaluru, Chennai, Hyderabad, Mumbai, Delhi, Pune) in 24–48 hours.',
  },
  {
    question: 'Can schools, colleges, and Atal Tinkering Labs (ATL) get bulk Diwali discounts?',
    answer:
      'Yes, we provide institutional festive pricing and customized GST bills of supply for schools, STEM clubs, Atal Tinkering Labs, and engineering colleges. Contact our institutional sales team via the Bulk Enquiry page for immediate formal quotations.',
  },
  {
    question: 'Are TTRC robotics products covered under warranty during the Diwali sale?',
    answer:
      'All products purchased during the Diwali festive sale include our standard 100% pre-dispatch quality verification, technical support, and component replacement guarantee for transit defects under the TTRC Warranty & Return Policy.',
  },
];

export default async function OffersPage() {
  const { products } = await getStoreProducts({ limit: 24, sort: 'price-desc' });

  // AEO (Answer Engine Optimization) & Google Search Console Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${CANONICAL_URL}#webpage`,
        url: CANONICAL_URL,
        name: 'Diwali Robotics Offers & Discounts | TTRC Store India',
        description:
          'Explore exclusive Diwali robotics offers and festive discounts at TTRC Store India. Flat savings on Line Follower Robot kits, Arduino & ESP32 STEM kits, and LiPo batteries.',
        breadcrumb: {
          '@id': `${CANONICAL_URL}#breadcrumb`,
        },
      },
      {
        '@type': 'SaleEvent',
        '@id': `${CANONICAL_URL}#saleEvent`,
        name: 'TTRC Store Diwali Robotics Festive Mega Sale',
        description:
          'Annual Diwali mega sale featuring robotics competition kits, line followers, STEM education sets, and electronics components.',
        url: CANONICAL_URL,
        startDate: '2026-10-01',
        endDate: '2026-11-30',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        location: {
          '@type': 'VirtualLocation',
          url: CANONICAL_URL,
        },
        organizer: {
          '@type': 'Organization',
          name: 'Tamizh Tech Robotics Company (TTRC Store)',
          url: 'https://www.ttrc.store',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${CANONICAL_URL}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://www.ttrc.store',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Offers & Diwali Deals',
            item: CANONICAL_URL,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${CANONICAL_URL}#faq`,
        mainEntity: DIWALI_FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Breadcrumb Bar */}
        <div className="bg-[#F7F7F8] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="text-[#E3132A] font-bold">Diwali &amp; Festive Offers</span>
            </nav>
          </div>
        </div>

        {/* Festive Mega Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-[#FDECEE]/40 to-[#F7F7F8] border-b border-slate-200 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FDECEE] border border-red-200 text-[#E3132A] text-xs font-bold uppercase tracking-wider shadow-xs">
                <Sparkles size={14} className="text-[#E3132A]" />
                Diwali Festive Mega Sale &bull; Up to 40% Off
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-[#14141A] tracking-tight font-heading">
                TTRC Diwali Robotics Offers &amp; Festive Deals
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Elevate your robotics game this festival season. Get exclusive festive discounts on competition-proven
                Line Follower Robots, high-speed controllers, LiPo battery packs, and STEM kits with fast pan-India delivery.
              </p>

              {/* Active Coupons Strip */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border-2 border-dashed border-[#E3132A] shadow-xs">
                  <Percent size={16} className="text-[#E3132A]" />
                  <div className="text-left">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">Storewide 10% Off</span>
                    <span className="text-xs font-black text-[#E3132A] font-mono">FESTIVE10</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border-2 border-dashed border-slate-300 shadow-xs">
                  <Gift size={16} className="text-slate-700" />
                  <div className="text-left">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">Orders &gt; ₹999</span>
                    <span className="text-xs font-black text-slate-800 font-mono">FREE SHIPPING</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Festive Spotlight Kits */}
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#E3132A] uppercase tracking-wider">Festival Highlights</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14141A] mt-1 font-heading">
                  Diwali Special Edition Robotics Platforms
                </h2>
              </div>
              <Link
                href="/category/gamified-robots"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E3132A] hover:text-[#B80F21] transition-colors"
              >
                View all competition kits <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-[#F7F7F8] border border-slate-200 flex flex-col justify-between hover:border-red-300 transition-all hover:shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-[#FDECEE] text-[#E3132A] text-[11px] font-bold">
                      Save ₹800
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Bestseller</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#14141A]">TTRC LF 6.0 Line Follower Robot</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    High precision PID line follower robot with optical reflectance array. Perfect for beginners and school competitions.
                  </p>
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#E3132A]">₹2,999</span>
                    <span className="text-sm text-slate-400 line-through">₹3,799</span>
                  </div>
                </div>
                <div className="pt-6">
                  <Link
                    href="/product/ttrc-lfr-6-0"
                    className="block w-full py-2.5 text-center text-xs font-bold text-white bg-[#E3132A] hover:bg-[#B80F21] rounded-xl transition-colors shadow-xs"
                  >
                    View Diwali Deal
                  </Link>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-[#F7F7F8] border-2 border-[#E3132A]/30 relative flex flex-col justify-between hover:border-[#E3132A] transition-all hover:shadow-lg">
                <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-[#E3132A] text-white text-[10px] font-bold uppercase tracking-wider">
                  Most Popular
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-[#FDECEE] text-[#E3132A] text-[11px] font-bold">
                      Save ₹1,000
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Pro Platform</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#14141A]">TTRC LF-6.0 PRO Line Follower</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Upgraded coreless high-RPM motors, reinforced CNC chassis, and ultra-fast dynamic PID algorithm response.
                  </p>
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#E3132A]">₹4,999</span>
                    <span className="text-sm text-slate-400 line-through">₹5,999</span>
                  </div>
                </div>
                <div className="pt-6">
                  <Link
                    href="/product/ttrc-lf-6-0-pro-line-follower-robot"
                    className="block w-full py-2.5 text-center text-xs font-bold text-white bg-[#E3132A] hover:bg-[#B80F21] rounded-xl transition-colors shadow-xs"
                  >
                    View Diwali Deal
                  </Link>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-[#F7F7F8] border border-slate-200 flex flex-col justify-between hover:border-red-300 transition-all hover:shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-[#FDECEE] text-[#E3132A] text-[11px] font-bold">
                      Save ₹2,000
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Championship</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#14141A]">TTRC LINE X PRO High Speed</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    National championship grade line follower with ultra-light carbon chassis, custom MOSFET motor drivers, and telemetry support.
                  </p>
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#E3132A]">₹8,999</span>
                    <span className="text-sm text-slate-400 line-through">₹10,999</span>
                  </div>
                </div>
                <div className="pt-6">
                  <Link
                    href="/product/ttrc-line-x-pro-line-follower-robot"
                    className="block w-full py-2.5 text-center text-xs font-bold text-white bg-[#E3132A] hover:bg-[#B80F21] rounded-xl transition-colors shadow-xs"
                  >
                    View Diwali Deal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Catalog Discount Rail */}
        <section className="py-12 bg-[#F7F7F8] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#14141A] font-heading">
                  All Diwali Robotics Deals &amp; Components
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Genuine robotics motors, sensors, microcontrollers, and hardware eligible for festive discounts.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Showing {products.length} verified products
              </span>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Tag size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-700">No products available at this moment.</p>
                <p className="text-xs text-slate-500 mt-1">Check back shortly as festive stock is updated.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    name={p.name}
                    brand={p.brand}
                    pricePaise={p.pricePaise}
                    mrpPaise={p.mrpPaise}
                    stockQty={p.stockQty}
                    imageUrl={p.imageUrls?.[0]}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Trust Badges Strip */}
        <section className="py-10 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Truck size={22} className="mx-auto text-[#E3132A]" />
                <h4 className="text-xs font-bold text-[#14141A]">Pan-India Delivery</h4>
                <p className="text-[11px] text-slate-500">Same-day dispatch for all festival orders</p>
              </div>
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <ShieldCheck size={22} className="mx-auto text-[#E3132A]" />
                <h4 className="text-xs font-bold text-[#14141A]">100% Tested Components</h4>
                <p className="text-[11px] text-slate-500">Bench-tested before safe packaging</p>
              </div>
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Zap size={22} className="mx-auto text-[#E3132A]" />
                <h4 className="text-xs font-bold text-[#14141A]">Competition Ready</h4>
                <p className="text-[11px] text-slate-500">Built for Technoxian, Robofest, &amp; Techfests</p>
              </div>
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Tag size={22} className="mx-auto text-[#E3132A]" />
                <h4 className="text-xs font-bold text-[#14141A]">Official GST Invoices</h4>
                <p className="text-[11px] text-slate-500">Full tax breakdown for schools &amp; makers</p>
              </div>
            </div>
          </div>
        </section>

        {/* AEO (Answer Engine Optimization) & Google Search Console Q&A Section */}
        <section className="py-12 sm:py-16 bg-[#F7F7F8]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E3132A] uppercase tracking-wider">
                <HelpCircle size={14} /> Frequently Asked Questions
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14141A] font-heading">
                Diwali Robotics Offers &amp; Ordering FAQs
              </h2>
              <p className="text-xs text-slate-600 max-w-xl mx-auto">
                Everything you need to know about festive discounts, shipping schedules, and technical support.
              </p>
            </div>

            <div className="space-y-4">
              {DIWALI_FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
                >
                  <h3 className="text-sm font-bold text-[#14141A] flex items-start gap-2">
                    <span className="text-[#E3132A] font-mono text-xs mt-0.5">Q{idx + 1}.</span>
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <p className="text-xs text-slate-500">
                Need customized festival robotics packages for your institution or club?{' '}
                <Link href="/bulk-enquiry" className="text-[#E3132A] font-bold hover:underline">
                  Submit a Bulk RFQ Enquiry
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
