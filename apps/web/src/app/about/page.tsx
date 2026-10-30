import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Target, Rocket, ShieldCheck, Cpu, Wrench, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About Us | Vision & Mission | Tamizh Tech & TTRC Store',
  description: 'Our Vision to establish India\'s leading competition-robotics platform and Our Mission to deliver a trusted one-stop hardware ecosystem.',
  alternates: {
    canonical: 'https://www.ttrc.store/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
        
        {/* Header Breadcrumb & Title */}
        <div className="border-b border-slate-200 pb-8 space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">About &amp; Vision</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-red-600" />
            <span>Tamizh Tech Robotics Company</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Engineering Robotics for India&apos;s Innovators
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            Operated by <strong className="text-slate-900">Tamizh Tech</strong> (tamizhtech.in) in Tamil Nadu, 
            <strong className="text-slate-900"> TTRC Store</strong> (ttrc.store) is India&apos;s dedicated e-commerce platform 
            engineered to power students, competitors, robotics clubs, and institutions with high-precision components and complete robotic systems.
          </p>
        </div>

        {/* Visual Showcase Banner: Official Infographic */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-950 p-2 sm:p-4 group">
          <div className="relative w-full aspect-square sm:aspect-[4/3] md:aspect-[16/10] max-h-[620px] rounded-2xl overflow-hidden bg-slate-900">
            <Image
              src="/brand/ttrc-vision-mission.jpg"
              alt="TTRC Store Official Vision & Mission Infographic"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-contain sm:object-cover md:object-contain object-center transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </div>
          <div className="py-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span className="font-mono text-slate-300">Official TTRC Brand Statement &bull; www.ttrc.store</span>
            <span className="text-[11px] text-slate-400">Competition Robotics &bull; STEM Hardware &bull; Nationwide Supply</span>
          </div>
        </div>

        {/* Vision & Mission Detailed Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* OUR VISION */}
          <div className="rounded-3xl bg-slate-50/80 border border-slate-200 p-7 sm:p-9 space-y-5 hover:border-red-300 hover:shadow-lg hover:shadow-red-950/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30">
                <Target size={24} />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-red-600">The North Star</span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">OUR VISION</h2>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>
                To establish TTRC as <strong className="text-slate-900">India&apos;s leading competition-robotics platform</strong> and a <strong className="text-slate-900">globally recognized robotics brand</strong>, empowering students, engineers, and innovators to design, build, repair, and advance robots through <strong className="text-slate-900">one trusted ecosystem</strong>.
              </p>
              <p className="text-slate-600">
                By developing our own innovative hardware and compatible components, we aim to deliver quality, reliability, and engineering excellence while bringing everything needed to build a robot from the smallest electronic component to advanced actuator and complete robotic systems into one accessible platform.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">#CompetitionRobotics</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">#TrustedEcosystem</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">#QualityHardware</span>
            </div>
          </div>

          {/* OUR MISSION */}
          <div className="rounded-3xl bg-slate-50/80 border border-slate-200 p-7 sm:p-9 space-y-5 hover:border-red-300 hover:shadow-lg hover:shadow-red-950/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <Rocket size={24} className="text-red-500" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-slate-600">Execution &amp; Commitment</span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">OUR MISSION</h2>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>
                To design, develop, and deliver <strong className="text-slate-900">innovative, high-quality robotics products</strong> while building a comprehensive, <strong className="text-slate-900">one-stop platform</strong> for every component needed to build a robot from screws, fasteners, wires, and electronic components to motor drivers, controllers, sensors, actuator, and complete robotic systems.
              </p>
              <p className="text-slate-600">
                We are committed to empowering students, engineers, innovators, and industries through reliable products, component compatibility, accessible engineering resources, and fast, dependable delivery enabling everyone to <strong className="text-slate-900">build, repair, upgrade, and innovate with confidence</strong>.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">#OneStopRobotics</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">#ComponentCompatibility</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">#FastDelivery</span>
            </div>
          </div>

        </div>

        {/* Platform Core Pillars */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
              The TTRC Platform Standard
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              How we translate our vision and mission into real engineering value for every builder in India.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-slate-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Cpu size={18} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-sm">One-Stop Hardware</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                From precision M2/M3 standoffs to high-rate LiPo packs and dual motor drivers—everything in one cart.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-slate-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-sm">Bench-Tested Reliability</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                All components are quality tested in our Tamil Nadu facility prior to dispatch to prevent dead-on-arrival parts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-slate-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Wrench size={18} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-sm">Kit + Spare Logic</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every competition kit links directly to verified replacement parts so teams can repair and upgrade easily.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-slate-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={18} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-sm">Pan-India Delivery</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Express courier dispatch across all Indian pincodes with full tracking and GST tax invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Action Callouts */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-heading text-xl sm:text-2xl font-bold">
              Ready to Build, Upgrade, or Partner?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed">
              Explore our competition kits and verified electronics, or talk to us for school, college, and STEM lab bulk packages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/category/gamified-robots">
              <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-md shadow-red-600/30">
                Explore Catalog
              </Button>
            </Link>
            <Link href="/bulk-enquiry">
              <Button variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 font-bold text-xs h-11 px-6 rounded-xl">
                Institutional Enquiry
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
