import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Cpu, Wrench, Layers, ChevronRight, Compass } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { BreadcrumbJsonLd, ItemListJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Engineering Guides & Robotics Tutorials | TTRC Store India',
  description:
    'Comprehensive technical guides for Indian robotics students, hobbyists, and lab engineers. Component selection, motor drivers, sensor arrays, and competition robot designs.',
  alternates: {
    canonical: 'https://www.ttrc.store/guides',
  },
  openGraph: {
    title: 'Engineering Guides & Robotics Tutorials | TTRC Store',
    description:
      'Authoritative robotics tutorials and hardware selection guides from Tamizh Tech engineers.',
    url: 'https://www.ttrc.store/guides',
    images: [{ url: 'https://www.ttrc.store/brand/ttrc-logo.png', width: 1200, height: 630 }],
  },
};

const GUIDES = [
  {
    slug: 'line-follower-robot-components',
    title: 'How to Choose Line Follower Robot Components: Engineering Guide',
    excerpt:
      'Comprehensive breakdown of microcontrollers, 7-array analog sensors, TB6612FNG drivers, high-grip wheels, and N20 gear motors for competition line followers.',
    readTime: '8 min read',
    topic: 'Competition Robotics',
    category: 'Gamified Robots',
    date: 'October 2026',
    icon: Compass,
  },
  {
    slug: 'motor-driver-selection-guide',
    title: 'Motor Driver Selection Guide: TB6612FNG vs L298N vs DRV8833',
    excerpt:
      'Technical comparison of MOSFET vs BJT H-bridges, internal voltage drops, thermal dissipation, logic voltage levels, and PWM frequency limits in robotics.',
    readTime: '7 min read',
    topic: 'Power Electronics',
    category: 'Motor Drivers',
    date: 'October 2026',
    icon: Cpu,
  },
  {
    slug: 'how-to-choose-robotics-kit',
    title: 'How to Choose a Robotics Kit for Engineering Students & Competitions',
    excerpt:
      'Guide for schools, colleges, and self-learners selecting STEM kits, Robo Race chassis, Line Follower kits, and modular spare parts.',
    readTime: '6 min read',
    topic: 'Kits & Education',
    category: 'STEM Kits',
    date: 'October 2026',
    icon: Wrench,
  },
  {
    slug: 'robotics-sensors-guide',
    title: 'Robotics Sensors Guide: IR, Ultrasonic, IMU Gyro & Color Sensors',
    excerpt:
      'Operating principles, wiring pinouts, sensitivity calibration, and noise mitigation for essential autonomous robotics sensors.',
    readTime: '9 min read',
    topic: 'Sensors & Perception',
    category: 'Sensors',
    date: 'October 2026',
    icon: Layers,
  },
];

export default function GuidesIndexPage() {
  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.ttrc.store' },
    { name: 'Engineering Guides', url: 'https://www.ttrc.store/guides' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 pt-6">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ItemListJsonLd
        name="TTRC Engineering Guides & Robotics Tutorials"
        description="Comprehensive technical guides for robotics students and makers."
        items={GUIDES.map((g, idx) => ({
          name: g.title,
          url: `https://www.ttrc.store/guides/${g.slug}`,
          position: idx + 1,
        }))}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Engineering Guides</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section */}
        <div className="rounded-2xl p-8 sm:p-12 mb-12 bg-[#F7F7F8] border border-[#E5E7EB]">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FDECEE] text-[#E3132A] border border-[#E3132A]/20">
              <BookOpen size={14} />
              Authoritative Technical Knowledge
            </span>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#14141A] tracking-tight">
              TTRC Engineering Guides &amp; Robotics Tutorials
            </h1>
            <p className="text-[#6B7280] text-sm sm:text-base leading-relaxed">
              Written and verified by Tamizh Tech engineers. These in-depth resources provide verified specifications, circuit selection principles, and competition robotics component guides for Indian makers, engineering students, and STEM labs.
            </p>
          </div>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <article
                key={guide.slug}
                className="group relative flex flex-col justify-between p-8 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#E3132A] transition-all duration-200 hover:shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F7F7F8] text-[#14141A] border border-[#E5E7EB]">
                      {guide.category}
                    </span>
                    <span className="text-xs text-[#6B7280] font-medium">{guide.readTime}</span>
                  </div>

                  <div className="p-3 w-fit rounded-xl bg-[#FDECEE] text-[#E3132A]">
                    <Icon size={24} />
                  </div>

                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#14141A] group-hover:text-[#E3132A] transition-colors leading-snug">
                    <Link href={`/guides/${guide.slug}`} className="focus:outline-hidden">
                      {guide.title}
                    </Link>
                  </h2>

                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {guide.excerpt}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-xs font-medium text-[#6B7280]">{guide.date}</span>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#E3132A] hover:text-[#B80F21] group-hover:translate-x-0.5 transition-transform"
                  >
                    Read Engineering Guide
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Footer Support Banner */}
        <div className="p-8 rounded-2xl bg-white border border-[#E5E7EB] text-center space-y-3">
          <h2 className="font-heading text-xl font-bold text-[#14141A]">
            Need Custom Component Guidance for Your Robotics Lab?
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] max-w-2xl mx-auto">
            Our engineering team in Tamil Nadu supports schools, universities, and competition teams with tailored BOM recommendations, bulk discounts, and GST invoicing.
          </p>
          <div className="pt-2">
            <Link
              href="/bulk-enquiry"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#E3132A] text-white text-xs font-bold hover:bg-[#B80F21] transition-colors shadow-xs"
            >
              Submit STEM Lab / Bulk Enquiry
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
