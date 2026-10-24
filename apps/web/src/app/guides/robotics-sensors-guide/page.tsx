import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, HelpCircle, ArrowRight, ShieldCheck, Layers, Eye, Compass, Sun } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { BreadcrumbJsonLd, ArticleJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Robotics Sensors Guide: IR, Ultrasonic, IMU Gyro & Color Sensors | TTRC Store',
  description:
    'Comprehensive engineering guide to sensors used in autonomous robotics: IR reflectance arrays, HC-SR04 ultrasonic, MPU6050 6-DOF IMU, and TCS3200 color sensors.',
  alternates: {
    canonical: 'https://www.ttrc.store/guides/robotics-sensors-guide',
  },
  openGraph: {
    title: 'Robotics Sensors Guide: IR, Ultrasonic, IMU Gyro & Color Sensors | TTRC Store',
    description:
      'Verified guide to robotics sensors, wiring, calibration, and noise filtering by Tamizh Tech engineers.',
    url: 'https://www.ttrc.store/guides/robotics-sensors-guide',
    images: [{ url: 'https://www.ttrc.store/brand/ttrc-logo.png', width: 1200, height: 630 }],
  },
};

const FAQS = [
  {
    question: 'How do I protect IR reflectance sensors from ambient sunlight and stadium spotlights?',
    answer:
      'Ambient lighting emits strong infrared radiation that saturates phototransistors. Mitigate this by: (1) using a downward physical shroud around the sensor board, (2) mounting sensors at the optimal 3mm–5mm focal height above the surface, and (3) implementing dynamic software calibration routines at competition check-in that sample maximum white and minimum black surface thresholds.',
  },
  {
    question: 'What is the blind zone (minimum detection distance) of the HC-SR04 ultrasonic sensor?',
    answer:
      'The HC-SR04 has an effective blind zone of approximately 2 cm. Targets closer than 2 cm cannot be timed accurately because the receiver transducer detects ringing from the transmitter burst. The effective measurement range is 2 cm to 400 cm with approximately 3 mm accuracy under calm atmospheric conditions.',
  },
  {
    question: 'Why do MPU6050 gyro readings drift over time and how is this corrected?',
    answer:
      'MEMS gyroscopes measure angular velocity. Integrating angular velocity to calculate orientation introduces cumulative numerical integration error (drift). This is corrected using complementary filters or Kalman filters that fuse the fast-responding gyro data with gravity-referenced accelerometer readings to maintain a stable, non-drifting pitch and roll estimate.',
  },
];

export default function RoboticsSensorsGuidePage() {
  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.ttrc.store' },
    { name: 'Engineering Guides', url: 'https://www.ttrc.store/guides' },
    { name: 'Robotics Sensors Guide', url: 'https://www.ttrc.store/guides/robotics-sensors-guide' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 pt-6">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ArticleJsonLd
        headline="Robotics Sensors Guide: IR, Ultrasonic, IMU Gyro & Color Sensors"
        description="Comprehensive engineering guide to sensors used in autonomous robotics: IR reflectance arrays, HC-SR04 ultrasonic, MPU6050 6-DOF IMU, and TCS3200 color sensors."
        url="https://www.ttrc.store/guides/robotics-sensors-guide"
        datePublished="2026-10-23T08:00:00+05:30"
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
              <BreadcrumbPage>Robotics Sensors Guide</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Block */}
        <header className="space-y-4 border-b border-[#E5E7EB] pb-8 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FDECEE] text-[#E3132A] border border-[#E3132A]/20">
              Perception &amp; Signal Processing
            </span>
            <span className="text-xs text-[#6B7280]">9 min read • Verified by Tamizh Tech Engineers</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#14141A] tracking-tight leading-tight">
            Robotics Sensors Guide: IR, Ultrasonic, IMU Gyro &amp; Color Sensors
          </h1>

          <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed">
            Autonomous robots require accurate environmental perception to make split-second navigational decisions. This guide details the electrical characteristics, operating principles, and calibration protocols for the four primary sensor families in mobile robotics.
          </p>
        </header>

        {/* Sensor Family 1 */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Eye className="text-[#E3132A]" size={26} />
            1. Infrared (IR) Reflectance Arrays
          </h2>
          <p className="text-sm sm:text-base text-[#14141A] leading-relaxed">
            IR reflectance sensors pair an infrared light-emitting diode (typically 940 nm wavelength) with a phototransistor. When positioned facing downwards, dark surfaces absorb infrared light while white surfaces reflect it back into the phototransistor base.
          </p>

          <div className="p-6 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-2">
            <h3 className="font-heading text-base font-bold text-[#14141A]">Calibration &amp; Noise Immunity</h3>
            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
              Always execute an auto-calibration routine during robot startup. By sweeping the robot across the track lines for 3–5 seconds, the software records ADC_min and ADC_max for each individual sensor, compensating for manufacturing variations and ambient light bleed.
            </p>
          </div>
        </section>

        {/* Sensor Family 2 */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Sun className="text-[#E3132A]" size={26} />
            2. Ultrasonic Distance Sensors (HC-SR04)
          </h2>
          <p className="text-sm sm:text-base text-[#14141A] leading-relaxed">
            The HC-SR04 emits a 40 kHz ultrasonic acoustic burst from its transmitting transducer and counts clock cycles until the echo returns to the receiving transducer. Distance is calculated using the speed of sound (approximately 343 m/s in dry air at 20°C):
          </p>
          <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs text-center">
            Distance (cm) = (Echo Pulse Duration in microseconds × 0.0343) / 2
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Use hardware interrupts rather than blocking <code>pulseIn()</code> functions in microcontrollers to avoid freezing real-time motor control loops during distance pings.
          </p>
        </section>

        {/* Sensor Family 3 */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <Compass className="text-[#E3132A]" size={26} />
            3. Inertial Measurement Units (MPU6050 6-DOF IMU)
          </h2>
          <p className="text-sm sm:text-base text-[#14141A] leading-relaxed">
            The MPU6050 integrates a 3-axis accelerometer and a 3-axis angular velocity gyroscope over an I2C communication bus. Essential for self-balancing robots, terrain incline detection, and turning verification in Robo Race vehicles.
          </p>
          <div className="p-6 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-2">
            <h3 className="font-heading text-base font-bold text-[#14141A]">Sensor Fusion (Complementary Filter)</h3>
            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
              Combine gyro and accelerometer readings to eliminate drift while filtering motor vibration noise:
            </p>
            <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] font-mono text-xs text-slate-800">
              Angle = 0.98 × (Angle + GyroRate × dt) + 0.02 × (AccelAngle)
            </div>
          </div>
        </section>

        {/* Callout */}
        <div className="p-8 rounded-2xl bg-[#FDECEE] border border-[#E3132A]/20 space-y-4 mb-12">
          <div className="flex items-center gap-2 text-[#E3132A] font-bold text-xs uppercase tracking-wider">
            <ShieldCheck size={16} />
            Tested Robotics Sensors
          </div>
          <h3 className="font-heading text-xl font-bold text-[#14141A]">
            Source Genuine Sensors with Complete Documentation
          </h3>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            TTRC Store stocks verified analog reflectance arrays, ultrasonic modules, and I2C IMUs tested for accurate signal response. Delivered across India with GST tax invoices.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/category/sensors"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E3132A] text-white text-xs font-bold hover:bg-[#B80F21] transition-colors"
            >
              Browse Sensors &amp; Modules
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* FAQs */}
        <section className="space-y-6 mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#14141A] flex items-center gap-2">
            <HelpCircle className="text-[#E3132A]" size={26} />
            Frequently Asked Sensor Questions
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
            href="/guides/how-to-choose-robotics-kit"
            className="text-xs font-bold text-[#6B7280] hover:text-[#14141A] transition-colors"
          >
            ← Previous: How to Choose a Robotics Kit
          </Link>
          <Link
            href="/guides"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#E3132A] hover:text-[#B80F21]"
          >
            Back to All Guides
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
