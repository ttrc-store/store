import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, HelpCircle, ArrowRight, ShieldCheck, Cpu, Zap, Thermometer } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { BreadcrumbJsonLd, ArticleJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Motor Driver Selection Guide: TB6612FNG vs L298N vs DRV8833 | TTRC Store',
  description:
    'Detailed engineering comparison of robotics motor drivers: TB6612FNG, L298N, and DRV8833. MOSFET vs bipolar H-bridge, voltage drops, thermal dissipation, and PWM frequency.',
  alternates: {
    canonical: 'https://www.ttrc.store/guides/motor-driver-selection-guide',
  },
  openGraph: {
    title: 'Motor Driver Selection Guide: TB6612FNG vs L298N vs DRV8833 | TTRC Store',
    description:
      'Verified comparison of robotics motor drivers by Tamizh Tech engineers for DIY projects and university competitions.',
    url: 'https://www.ttrc.store/guides/motor-driver-selection-guide',
    images: [{ url: 'https://www.ttrc.store/brand/ttrc-logo.png', width: 1200, height: 630 }],
  },
};

const FAQS = [
  {
    question: 'Why does the L298N motor driver generate so much heat compared to the TB6612FNG?',
    answer:
      'The L298N uses obsolete bipolar junction transistors (BJTs) inside its H-bridge. BJTs have an internal collector-emitter saturation voltage drop of 1.8V to 2.5V. When pushing 1.5A per channel, this produces up to 3.75W of wasted heat per channel. The TB6612FNG uses low-resistance MOSFETs (RDS(on) ≈ 0.5Ω), causing a voltage drop under 0.5V and dissipating less than 0.6W at 1.2A.',
  },
  {
    question: 'Can the TB6612FNG motor driver run directly with 3.3V logic (ESP32 / Raspberry Pi Pico / STM32)?',
    answer:
      'Yes. The TB6612FNG logic supply pin (VCC) accepts 2.7V to 5.5V, making it fully compatible with both 3.3V microcontrollers (ESP32, RP2040, STM32) and 5.0V microcontrollers (Arduino Uno, Nano) without logic level converters.',
  },
  {
    question: 'When should I choose the DRV8833 instead of the TB6612FNG?',
    answer:
      'The DRV8833 operates down to a motor voltage of 2.7V (up to 10.8V), making it ideal for low-voltage battery projects powered by a single 3.7V 1S LiPo or two AA batteries. The TB6612FNG motor voltage (VM) starts at 4.5V (up to 15V), making it superior for 2S (7.4V) and 3S (11.1V) robotics systems.',
  },
  {
    question: 'What happens if I stall a motor connected to a TB6612FNG?',
    answer:
      'The TB6612FNG features built-in thermal shutdown (TSD) circuitry that safely disables driver outputs when die temperature exceeds approximately 175°C, as well as under-voltage lockout (UVLO). However, sustained stall currents exceeding the 3.2A peak limit can still damage the module, so current-limiting resistors or quick-response fuses are recommended.',
  },
];

export default function MotorDriverGuidePage() {
  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.ttrc.store' },
    { name: 'Engineering Guides', url: 'https://www.ttrc.store/guides' },
    { name: 'Motor Driver Selection Guide', url: 'https://www.ttrc.store/guides/motor-driver-selection-guide' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 pt-6">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ArticleJsonLd
        headline="Motor Driver Selection Guide: TB6612FNG vs L298N vs DRV8833"
        description="Detailed engineering comparison of robotics motor drivers: TB6612FNG, L298N, and DRV8833. MOSFET vs bipolar H-bridge, voltage drops, thermal dissipation, and PWM frequency."
        url="https://www.ttrc.store/guides/motor-driver-selection-guide"
        datePublished="2026-10-21T10:00:00+05:30"
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
              <BreadcrumbPage>Motor Driver Selection</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Block */}
        <header className="space-y-4 border-b border-[#E5E7EB] pb-8 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FDECEE] text-[#E3132A] border border-[#E3132A]/20">
              Power Electronics &amp; Actuation
            </span>
            <span className="text-xs text-[#6B7280]">7 min read • Verified by Tamizh Tech Engineers</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#14141A] tracking-tight leading-tight">
            Motor Driver Selection Guide: TB6612FNG vs L298N vs DRV8833
          </h1>

          <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed">
            Selecting the wrong motor driver causes excessive heat, lost battery voltage, and sluggish acceleration in mobile robots. This engineering guide compares the electrical characteristics, MOSFET vs BJT topologies, and thermal constraints of the three most popular dual-channel DC motor drivers in India.
          </p>
        </header>

        {/* Section 1: Topologies */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Zap className="text-[#E3132A]" size={26} />
            1. H-Bridge Topologies: MOSFET vs BJT
          </h2>
          <p className="text-sm sm:text-base text-[#14141A] leading-relaxed">
            The core function of an H-bridge is allowing bidirectional current flow through inductive motor windings. The fundamental performance difference between modern and legacy drivers stems from their semiconductor switches:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-3">
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-[#FDECEE] text-[#E3132A]">
                Modern: MOSFET H-Bridge (TB6612FNG / DRV8833)
              </span>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                MOSFETs behave as pure low-resistance channels (RDS(on) typically 0.3Ω–0.5Ω). As current flows, voltage drop follows Ohm&apos;s law: Vdrop = I × RDS(on). At 1A, the total drop across upper and lower MOSFETs is approximately 0.5V, delivering over 93% of battery voltage directly to the motor terminals.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-3">
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700">
                Legacy: BJT H-Bridge (L298N / L293D)
              </span>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Bipolar transistors maintain a fixed junction saturation voltage drop (Vce(sat)) plus diode drops. In an L298N, the cumulative drop across high-side and low-side BJTs is between 1.8V and 2.5V, regardless of current. On a 7.4V 2S LiPo battery, the motors receive only ~5.2V.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Comprehensive Comparison Table */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Thermometer className="text-[#E3132A]" size={26} />
            2. Detailed Electrical Specifications Comparison
          </h2>

          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F7F7F8] text-[#14141A] border-b border-[#E5E7EB]">
                <tr>
                  <th className="p-3 font-bold">Parameter</th>
                  <th className="p-3 font-bold text-[#E3132A]">TB6612FNG</th>
                  <th className="p-3 font-bold text-slate-700">DRV8833</th>
                  <th className="p-3 font-bold text-[#6B7280]">L298N</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr>
                  <td className="p-3 font-medium">Motor Supply Voltage (VM)</td>
                  <td className="p-3 text-[#14141A]">4.5V to 15.0V</td>
                  <td className="p-3 text-[#14141A]">2.7V to 10.8V</td>
                  <td className="p-3 text-[#6B7280]">4.8V to 35.0V</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Logic Voltage (VCC)</td>
                  <td className="p-3 text-[#14141A]">2.7V to 5.5V (3.3V/5V compatible)</td>
                  <td className="p-3 text-[#14141A]">2.7V to 10.8V</td>
                  <td className="p-3 text-[#6B7280]">5.0V (onboard 7805 regulator)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Continuous Current / Channel</td>
                  <td className="p-3 text-[#14141A]">1.2 A</td>
                  <td className="p-3 text-[#14141A]">1.5 A</td>
                  <td className="p-3 text-[#6B7280]">2.0 A (with bulky heatsink)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Peak Current / Channel</td>
                  <td className="p-3 text-[#14141A]">3.2 A</td>
                  <td className="p-3 text-[#14141A]">2.0 A (internal current limiting)</td>
                  <td className="p-3 text-[#6B7280]">3.0 A</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">PWM Frequency</td>
                  <td className="p-3 text-[#14141A]">Up to 100 kHz</td>
                  <td className="p-3 text-[#14141A]">Up to 50 kHz</td>
                  <td className="p-3 text-[#6B7280]">Up to 25 kHz</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Weight &amp; Form Factor</td>
                  <td className="p-3 text-[#14141A]">4 grams (SSOP-24)</td>
                  <td className="p-3 text-[#14141A]">3 grams (TSSOP-16)</td>
                  <td className="p-3 text-[#6B7280]">30+ grams (Multiwatt15 + Al heatsink)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Recommendations */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Cpu className="text-[#E3132A]" size={26} />
            3. Engineering Recommendations by Robot Class
          </h2>
          <div className="space-y-3">
            <div className="p-5 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB]">
              <h3 className="font-heading text-base font-bold text-[#14141A]">
                Competition Line Follower &amp; Micro Robo Race (Under 400g):
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
                Choose <strong>TB6612FNG</strong>. The ultra-low weight, negligible internal voltage loss, and 100 kHz PWM capability allow silent high-frequency motor control without audible PWM whine.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB]">
              <h3 className="font-heading text-base font-bold text-[#14141A]">
                1S LiPo / Battery-Operated STEM Toys (3.7V - 5V):
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
                Choose <strong>DRV8833</strong>. Operates reliably down to 2.7V without brownouts when battery levels drop during motor startup surges.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB]">
              <h3 className="font-heading text-base font-bold text-[#14141A]">
                High-Voltage 12V–24V Heavy Duty Rovers:
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
                Choose high-current discrete MOSFET drivers (e.g. BTS7960 43A or VNH2SP30). Avoid the L298N unless legacy educational kits strictly mandate it.
              </p>
            </div>
          </div>
        </section>

        {/* Callout */}
        <div className="p-8 rounded-2xl bg-[#FDECEE] border border-[#E3132A]/20 space-y-4 mb-12">
          <div className="flex items-center gap-2 text-[#E3132A] font-bold text-xs uppercase tracking-wider">
            <ShieldCheck size={16} />
            Authentic Motor Drivers from TTRC
          </div>
          <h3 className="font-heading text-xl font-bold text-[#14141A]">
            Source Genuine TB6612FNG and DC Motors with GST Invoice
          </h3>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Every motor driver module and N20 gearmotor shipped by TTRC Store is verified for authentic IC silicon and thermal dissipation compliance. Fast dispatch across India.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/category/motors"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E3132A] text-white text-xs font-bold hover:bg-[#B80F21] transition-colors"
            >
              Browse Motors &amp; Motor Drivers
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* FAQs */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <HelpCircle className="text-[#E3132A]" size={26} />
            Frequently Asked Power Electronics Questions
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
            href="/guides/line-follower-robot-components"
            className="text-xs font-bold text-[#6B7280] hover:text-[#14141A] transition-colors"
          >
            ← Previous: Line Follower Robot Components
          </Link>
          <Link
            href="/guides/how-to-choose-robotics-kit"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#E3132A] hover:text-[#B80F21]"
          >
            Next: How to Choose a Robotics Kit
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
