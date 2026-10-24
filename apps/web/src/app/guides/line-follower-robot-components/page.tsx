import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, HelpCircle, ArrowRight, ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { BreadcrumbJsonLd, ArticleJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'How to Choose Line Follower Robot Components: Engineering Guide | TTRC Store',
  description:
    'Comprehensive engineering guide for competition Line Follower Robots in India. Sensor arrays, TB6612FNG motor drivers, N20 gear motors, microcontrollers, and chassis design.',
  alternates: {
    canonical: 'https://www.ttrc.store/guides/line-follower-robot-components',
  },
  openGraph: {
    title: 'How to Choose Line Follower Robot Components: Engineering Guide | TTRC Store',
    description:
      'Verified component selection guide for competition Line Follower Robots from Tamizh Tech engineers.',
    url: 'https://www.ttrc.store/guides/line-follower-robot-components',
    images: [{ url: 'https://www.ttrc.store/brand/ttrc-logo.png', width: 1200, height: 630 }],
  },
};

const FAQS = [
  {
    question: 'Why are analog sensor arrays better than digital IR sensors for line follower robots?',
    answer:
      'Analog sensor arrays (such as 7-array or 8-array reflectance sensors) return continuous voltage levels reflecting exact line positions. This enables continuous proportional-integral-derivative (PID) control calculations. Digital sensors only output 0 or 1, producing jerky bang-bang corrections that severely limit top speed on curved tracks.',
  },
  {
    question: 'Which motor driver is best suited for competition line follower robots?',
    answer:
      'The TB6612FNG dual motor driver is widely preferred over the legacy L298N. It features ultra-low internal resistance MOSFET H-bridges with less than 0.5V internal voltage drop, compared to 2.0V+ heat drop on bipolar L298N drivers. This yields higher wheel torque, cooler operation, and smaller chassis weight.',
  },
  {
    question: 'What RPM and gear ratio should be selected for N20 micro gear motors?',
    answer:
      'For high-speed competition line followers, 600 RPM to 1000 RPM at 6V (or 1000–1500 RPM on 2S 7.4V LiPo) with 10:1 to 30:1 gear ratio is standard. For beginner kits or tight grid-based line followers, 300 RPM to 600 RPM provides easier closed-loop tuning and greater stopping control.',
  },
  {
    question: 'Which microcontroller handles PID control loops fastest for line followers?',
    answer:
      'Microcontrollers with hardware PWM and fast ADC sampling—such as the RP2040 (133 MHz dual core) or STM32F4/F1 series—execute loop frequencies exceeding 1 kHz effortlessly. Standard ATmega328P (16 MHz) microcontrollers are suitable for beginner to intermediate robots when ADC prescalers are tuned.',
  },
];

export default function LineFollowerComponentsGuidePage() {
  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.ttrc.store' },
    { name: 'Engineering Guides', url: 'https://www.ttrc.store/guides' },
    { name: 'Line Follower Robot Components', url: 'https://www.ttrc.store/guides/line-follower-robot-components' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 pt-6">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ArticleJsonLd
        headline="How to Choose Line Follower Robot Components: Engineering Guide"
        description="Comprehensive engineering guide for competition Line Follower Robots in India. Sensor arrays, TB6612FNG motor drivers, N20 gear motors, microcontrollers, and chassis design."
        url="https://www.ttrc.store/guides/line-follower-robot-components"
        datePublished="2026-10-20T09:00:00+05:30"
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
              <BreadcrumbPage>Line Follower Components</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Block */}
        <header className="space-y-4 border-b border-[#E5E7EB] pb-8 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FDECEE] text-[#E3132A] border border-[#E3132A]/20">
              Robotics Hardware Architecture
            </span>
            <span className="text-xs text-[#6B7280]">8 min read • Verified by Tamizh Tech Engineers</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#14141A] tracking-tight leading-tight">
            How to Choose Line Follower Robot Components: Engineering Guide
          </h1>

          <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed">
            Building a competition-grade Line Follower Robot (LFR) requires precise balance between sensor responsiveness, motor torque-to-weight ratio, driver efficiency, and closed-loop PID execution speed. This guide analyzes every subsystem required to engineer a fast, stable autonomous bot for Indian tech fest robotics competitions.
          </p>
        </header>

        {/* Subsystem 1: Sensor Array */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Activity className="text-[#E3132A]" size={26} />
            1. Optical Perception: Analog Sensor Arrays
          </h2>
          <p className="text-sm sm:text-base text-[#14141A] leading-relaxed">
            The foundation of high-speed tracking is the sensor array positioned at the front overhang of the chassis. While 2-sensor or 3-sensor digital modules suffice for basic classroom demonstrations, competition tracks with sharp 90-degree turns, cross intersections, and acute loops mandate a 7-array or 8-array reflectance sensor.
          </p>

          <div className="p-6 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-3">
            <h3 className="font-heading text-lg font-bold text-[#14141A]">Analog vs Digital Sensing in PID Loops</h3>
            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
              Analog arrays provide continuous ADC readings (0–1023 on 10-bit ADCs), allowing the algorithm to calculate a weighted average center-of-line position. This produces a smooth, continuous error signal e(t) required for derivative (Kd) dampening, preventing high-frequency oscillations on straight track segments.
            </p>
            <div className="pt-2">
              <Link
                href="/category/sensors"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E3132A] hover:underline"
              >
                Browse TTRC Analog Line Sensor Arrays &amp; Spares
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* Subsystem 2: Motor Drivers */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Zap className="text-[#E3132A]" size={26} />
            2. Motor Driver: TB6612FNG vs Legacy L298N
          </h2>
          <p className="text-sm sm:text-base text-[#14141A] leading-relaxed">
            The motor driver acts as the high-current interface between logic signals and electric motors. In compact robots weighing under 350 grams, power density and thermal efficiency are critical.
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F7F7F8] text-[#14141A] border-b border-[#E5E7EB]">
                <tr>
                  <th className="p-3 font-bold">Metric</th>
                  <th className="p-3 font-bold text-[#E3132A]">TB6612FNG (Recommended)</th>
                  <th className="p-3 font-bold text-[#6B7280]">L298N (Legacy)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr>
                  <td className="p-3 font-medium">H-Bridge Architecture</td>
                  <td className="p-3 text-[#14141A]">Low RDS(on) MOSFET</td>
                  <td className="p-3 text-[#6B7280]">Bipolar Transistor (BJT)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Internal Voltage Drop</td>
                  <td className="p-3 text-[#14141A]">&lt; 0.5V at 1A</td>
                  <td className="p-3 text-[#6B7280]">2.0V – 2.5V (Large heat loss)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Continuous Current</td>
                  <td className="p-3 text-[#14141A]">1.2A per channel (3.2A peak)</td>
                  <td className="p-3 text-[#6B7280]">2.0A per channel</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Driver PCB Weight</td>
                  <td className="p-3 text-[#14141A]">~4 grams</td>
                  <td className="p-3 text-[#6B7280]">~30 grams (heatsink required)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">PWM Frequency</td>
                  <td className="p-3 text-[#14141A]">Up to 100 kHz</td>
                  <td className="p-3 text-[#6B7280]">Up to 25 kHz</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Subsystem 3: Micro Metal Gear Motors & Wheels */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Cpu className="text-[#E3132A]" size={26} />
            3. Actuators: N20 Micro Metal Gearmotors &amp; High-Traction Wheels
          </h2>
          <p className="text-sm sm:text-base text-[#14141A] leading-relaxed">
            N20 micro metal gearmotors offer an exceptional torque-to-weight ratio. Standard dual-shaft or single-shaft N20s operate smoothly between 3V and 9V.
          </p>
          <ul className="space-y-3 text-sm text-[#14141A]">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#E3132A] shrink-0 mt-0.5" />
              <span>
                <strong>Track Speed Selection:</strong> For competition tracks, 600 RPM to 1000 RPM at 6V provides the optimum balance between linear velocity (1.0–1.8 m/s) and braking torque for tight hairpins.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#E3132A] shrink-0 mt-0.5" />
              <span>
                <strong>Wheel Grip &amp; Diameter:</strong> Silicone-coated aluminum rims (diameter 32mm–35mm) prevent wheel slip during rapid differential steering transients.
              </span>
            </li>
          </ul>
        </section>

        {/* Recommended Products Callout */}
        <div className="p-8 rounded-2xl bg-[#FDECEE] border border-[#E3132A]/20 space-y-4 mb-12">
          <div className="flex items-center gap-2 text-[#E3132A] font-bold text-xs uppercase tracking-wider">
            <ShieldCheck size={16} />
            Genuine TTRC Competition Hardware
          </div>
          <h3 className="font-heading text-xl font-bold text-[#14141A]">
            Build Faster with Verified TTRC Line Follower Platforms
          </h3>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Tamizh Tech manufactures precision LFR carrier boards with integrated TB6612FNG drivers, high-density sensor arrays, and mounting brackets designed specifically for Indian university competitions.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/category/gamified-robots"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E3132A] text-white text-xs font-bold hover:bg-[#B80F21] transition-colors"
            >
              Explore Line Follower Kits &amp; Spares
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/category/motors"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#14141A] border border-[#E5E7EB] text-xs font-bold hover:bg-[#F7F7F8] transition-colors"
            >
              N20 Motors &amp; Drivers
            </Link>
          </div>
        </div>

        {/* AEO FAQ Section */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <HelpCircle className="text-[#E3132A]" size={26} />
            Frequently Asked Engineering Questions
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
            href="/guides"
            className="text-xs font-bold text-[#6B7280] hover:text-[#14141A] transition-colors"
          >
            ← Back to all Guides
          </Link>
          <Link
            href="/guides/motor-driver-selection-guide"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#E3132A] hover:text-[#B80F21]"
          >
            Next: Motor Driver Selection Guide
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
