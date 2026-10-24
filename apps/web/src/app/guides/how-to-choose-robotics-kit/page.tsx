import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, HelpCircle, ArrowRight, ShieldCheck, Wrench, Layers, Award } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { BreadcrumbJsonLd, ArticleJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'How to Choose a Robotics Kit for Engineering Students & Competitions | TTRC Store',
  description:
    'Complete guide for schools, engineering colleges, and makers selecting robotics kits in India. Robo Race, Line Follower, STEM curriculum kits, and modular spare parts.',
  alternates: {
    canonical: 'https://www.ttrc.store/guides/how-to-choose-robotics-kit',
  },
  openGraph: {
    title: 'How to Choose a Robotics Kit for Engineering Students & Competitions | TTRC Store',
    description:
      'Verified robotics kit selection guide by Tamizh Tech engineers for academic labs and competition teams.',
    url: 'https://www.ttrc.store/guides/how-to-choose-robotics-kit',
    images: [{ url: 'https://www.ttrc.store/brand/ttrc-logo.png', width: 1200, height: 630 }],
  },
};

const FAQS = [
  {
    question: 'What is the difference between a beginner STEM kit and a competition robotics kit?',
    answer:
      'Beginner STEM kits emphasize plug-and-play modules, block coding, and durable plastic frames to teach foundational electronics concepts. Competition robotics kits (e.g. Robo Race, Line Follower, Robo Soccer) feature precision CNC chassis, high-RPM metal gear motors, analog sensor arrays, and direct C/C++ firmware customization for maximum track speed and maneuverability.',
  },
  {
    question: 'Why is spare parts availability important when purchasing robotics kits in India?',
    answer:
      'During competition trials and student lab experiments, wheels wear out, motor gears strip under stall torque, and sensor arrays suffer accidental physical impacts. Kits from generic importers often lack replacement parts. TTRC provides individual replacement spare parts (brackets, tires, carrier boards, and sensors) for every kit sold.',
  },
  {
    question: 'Can schools and engineering colleges get GST invoices and bulk procurement discounts?',
    answer:
      'Yes. TTRC Store supplies educational institutions, STEM innovation hubs, and Atal Tinkering Labs (ATL) across India with valid GST tax invoices, formal quotations, warranty coverage, and quantity-tiered discounts.',
  },
];

export default function HowToChooseRoboticsKitGuidePage() {
  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.ttrc.store' },
    { name: 'Engineering Guides', url: 'https://www.ttrc.store/guides' },
    { name: 'How to Choose a Robotics Kit', url: 'https://www.ttrc.store/guides/how-to-choose-robotics-kit' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 pt-6">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ArticleJsonLd
        headline="How to Choose a Robotics Kit for Engineering Students & Competitions"
        description="Complete guide for schools, engineering colleges, and makers selecting robotics kits in India. Robo Race, Line Follower, STEM curriculum kits, and modular spare parts."
        url="https://www.ttrc.store/guides/how-to-choose-robotics-kit"
        datePublished="2026-10-22T08:00:00+05:30"
        dateModified="2026-10-24T12:00:00+05:30"
      />
      <FAQJsonLd faqs={FAQS} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/guides">Guides</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Robotics Kit Selection</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Block */}
        <header className="space-y-4 border-b border-[#E5E7EB] pb-8 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FDECEE] text-[#E3132A] border border-[#E3132A]/20">
              STEM &amp; Academic Robotics
            </span>
            <span className="text-xs text-[#6B7280]">6 min read • Verified by Tamizh Tech Engineers</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#14141A] tracking-tight leading-tight">
            How to Choose a Robotics Kit for Engineering Students &amp; Competitions
          </h1>

          <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed">
            From university tech fests to Atal Tinkering Labs, selecting the right robotics kit determines whether students master practical hardware engineering or face frustrating roadblocks. Here is how to evaluate chassis design, microcontrollers, modularity, and competition rules before buying.
          </p>
        </header>

        {/* Section 1: Kit Categories */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Award className="text-[#E3132A]" size={26} />
            1. Matching Kit Architecture to Learning Goals
          </h2>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-2">
              <h3 className="font-heading text-lg font-bold text-[#14141A]">
                Gamified Competition Kits (Robo Race / Line Follower / Robo Soccer)
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Designed for high performance under strict competitive constraints. Focus on chassis rigidity, low center of gravity, high-RPM micro gearmotors, and open microcontroller pinouts. These kits provide the exact foundation required for national robotics challenges in India.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-2">
              <h3 className="font-heading text-lg font-bold text-[#14141A]">
                Foundation STEM Kits for Schools (K-12 &amp; ATL Labs)
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Focus on fundamental sensor interfacing (ultrasonic obstacle avoidance, light detection, buzzer alarms) and visual or block-based programming. Chassis parts are solderless and safe for young learners.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Four Selection Pillars */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Layers className="text-[#E3132A]" size={26} />
            2. Four Crucial Selection Pillars
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2">
              <h3 className="font-heading text-base font-bold text-[#14141A]">1. Microcontroller Ecosystem</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Choose platforms with extensive documentation and open-source toolchains, such as Arduino, RP2040, or ESP32. Avoid proprietary closed-source controllers that prevent code inspection.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2">
              <h3 className="font-heading text-base font-bold text-[#14141A]">2. Spare Parts Modularity</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Ensure every component (motor brackets, wheels, sensors, screws) is available individually. If a motor strips during testing, a student should not have to buy a whole new kit.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2">
              <h3 className="font-heading text-base font-bold text-[#14141A]">3. Power System Safety</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Check whether the kit supports balanced LiPo charging and reverse-polarity protection. Power switches and fused lines prevent accidental short-circuits.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2">
              <h3 className="font-heading text-base font-bold text-[#14141A]">4. Documentation &amp; Schematics</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Legitimate engineering kits supply clear circuit diagrams, pinout guides, and verified test firmware to verify each subsystem step-by-step.
              </p>
            </div>
          </div>
        </section>

        {/* Institutional Callout */}
        <div className="p-8 rounded-2xl bg-[#FDECEE] border border-[#E3132A]/20 space-y-4 mb-12">
          <div className="flex items-center gap-2 text-[#E3132A] font-bold text-xs uppercase tracking-wider">
            <ShieldCheck size={16} />
            Institutional STEM Procurement
          </div>
          <h3 className="font-heading text-xl font-bold text-[#14141A]">
            Equipping a Robotics Lab or University Team?
          </h3>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Tamizh Tech partners with educational institutions across India. We provide customized component kits, GST invoicing, official seller registration, and dedicated technical support.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/bulk-enquiry"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E3132A] text-white text-xs font-bold hover:bg-[#B80F21] transition-colors"
            >
              Request Institutional Quotation
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/category/gamified-robots"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#14141A] border border-[#E5E7EB] text-xs font-bold hover:bg-[#F7F7F8] transition-colors"
            >
              View Competition Robotics Kits
            </Link>
          </div>
        </div>

        {/* FAQs */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <HelpCircle className="text-[#E3132A]" size={26} />
            Frequently Asked Kit Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-2">
                <h3 className="font-heading text-base sm:text-lg font-bold text-[#14141A]">
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Back Link */}
        <div className="pt-6 border-t border-[#E5E7EB] flex items-center justify-between">
          <Link
            href="/guides/motor-driver-selection-guide"
            className="text-xs font-bold text-[#6B7280] hover:text-[#14141A] transition-colors"
          >
            ← Previous: Motor Driver Selection Guide
          </Link>
          <Link
            href="/guides/robotics-sensors-guide"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#E3132A] hover:text-[#B80F21]"
          >
            Next: Robotics Sensors Guide
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
