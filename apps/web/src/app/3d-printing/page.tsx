import React from 'react';
import Link from 'next/link';
import {
  Box,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Truck,
  Sparkles,
  Zap,
  RotateCcw,
  Scale,
  Award,
} from 'lucide-react';

export const metadata = {
  title: 'On-Demand Precision 3D Printing Services | TTRC Store',
  description:
    'Industrial FDM 3D printing in Tamil Nadu, India. Upload your STL or STEP files for instant interactive 3D inspection and verified engineering quotations.',
};

const MATERIALS = [
  {
    name: 'PLA (Polylactic Acid)',
    tag: 'Rapid Prototyping',
    strength: 'High Rigidity',
    heat: '55°C',
    finish: 'Smooth surface, crisp details',
    applications: 'Visual prototypes, architectural models, robotic brackets & jigs.',
  },
  {
    name: 'PETG',
    tag: 'Functional Parts',
    strength: 'High Toughness',
    heat: '75°C',
    finish: 'Semi-gloss, chemical resistant',
    applications: 'Drone arms, motor mounts, battery enclosures, snap-fits.',
  },
  {
    name: 'ABS',
    tag: 'Mechanical Grade',
    strength: 'Impact Resistant',
    heat: '95°C',
    finish: 'Acetone vapor smoothable',
    applications: 'High-temperature housings, gears, automotive prototypes.',
  },
  {
    name: 'ASA',
    tag: 'Outdoor & UV Resistant',
    strength: 'High Durability',
    heat: '95°C',
    finish: 'Matte, UV-stable',
    applications: 'Outdoor rovers, solar tracking brackets, agricultural robotics.',
  },
  {
    name: 'TPU 95A',
    tag: 'Flexible & Elastic',
    strength: 'Rubber-like Shock Absorber',
    heat: '80°C',
    finish: 'High friction, flexible',
    applications: 'Grommets, vibration dampeners, robotic gripper pads, tires.',
  },
  {
    name: 'Nylon PA12',
    tag: 'High Performance',
    strength: 'Extreme Wear Resistance',
    heat: '110°C',
    finish: 'Durable, low friction',
    applications: 'Heavy-duty gears, drive shafts, mechanical snap-locks.',
  },
];

export default function ThreeDPrintingLandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEE8FA] border border-[#AF87F8]/40 text-[#844AFB] text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4 text-[#844AFB]" />
              <span>Precision FDM Manufacturing &bull; Tamil Nadu, India</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              From CAD to Real Parts in{' '}
              <span className="text-[#844AFB]">Record Time</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Upload your <strong>STL</strong> or <strong>STEP</strong> designs to our interactive 3D studio.
              Get automated dimensional checks, multi-material FDM configurations, and verified engineering quotations.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/3d-printing/request"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>Upload CAD &amp; Inspect Model</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#materials"
                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Explore Materials &amp; Specs
              </a>
            </div>

            {/* Quick Badges */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEE8FA] text-[#844AFB] flex items-center justify-center shrink-0">
                  <Box className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <strong className="block font-semibold text-slate-900">STL &amp; STEP Support</strong>
                  <span className="text-slate-500">Full 3D WebGL preview</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEE8FA] text-[#844AFB] flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <strong className="block font-semibold text-slate-900">0.10 &ndash; 0.28 mm</strong>
                  <span className="text-slate-500">Configurable layer heights</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEE8FA] text-[#844AFB] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <strong className="block font-semibold text-slate-900">100% Private CAD</strong>
                  <span className="text-slate-500">Encrypted signed storage</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEE8FA] text-[#844AFB] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <strong className="block font-semibold text-slate-900">All-India Delivery</strong>
                  <span className="text-slate-500">Dispatched via courier</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-[#F7F7F8] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How the TTRC 3D Printing Service Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A transparent, engineering-first workflow designed for robotics teams, STEM institutions, and makers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative">
              <span className="text-3xl font-extrabold text-[#844AFB] block mb-2">01</span>
              <h3 className="font-bold text-slate-900 text-base mb-1">Upload CAD Design</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag and drop your STL or STEP CAD file up to 50 MB into our secure private storage.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative">
              <span className="text-3xl font-extrabold text-[#844AFB] block mb-2">02</span>
              <h3 className="font-bold text-slate-900 text-base mb-1">Inspect 3D Geometry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rotate, zoom, pan, and verify physical dimensions ($X \times Y \times Z$), volume, and watertight mesh integrity.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative">
              <span className="text-3xl font-extrabold text-[#844AFB] block mb-2">03</span>
              <h3 className="font-bold text-slate-900 text-base mb-1">Configure Parameters</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose FDM polymer (PLA, PETG, ABS, TPU, Nylon), layer resolution, infill %, and fill in mandatory contact info.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative">
              <span className="text-3xl font-extrabold text-[#844AFB] block mb-2">04</span>
              <h3 className="font-bold text-slate-900 text-base mb-1">Verified Quotation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                TTRC engineers review slicing and machine compatibility, then issue an itemized quotation in integer paise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Materials Comparison Table */}
      <section id="materials" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Engineering FDM Material Guide
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Select the optimal filament for mechanical properties, heat tolerance, and environmental resistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MATERIALS.map((mat) => (
              <div
                key={mat.name}
                className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between hover:border-[#844AFB] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-base">{mat.name}</h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#EEE8FA] text-[#844AFB]">
                      {mat.tag}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-3 mb-4">
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500">Strength:</span>
                      <strong className="text-slate-800">{mat.strength}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500">Heat Deflection:</span>
                      <strong className="text-slate-800">{mat.heat}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500">Finish:</span>
                      <span className="text-slate-800">{mat.finish}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    <strong>Typical Uses:</strong> {mat.applications}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200">
                  <Link
                    href={`/3d-printing/request`}
                    className="text-xs font-semibold text-[#844AFB] hover:underline flex items-center gap-1"
                  >
                    <span>Print with {mat.name.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="bg-slate-900 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
            Ready to manufacture your robotics components?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mb-6">
            Upload your CAD file now to inspect in our 3D WebGL viewer and receive your tailored quotation.
          </p>
          <Link
            href="/3d-printing/request"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold rounded-xl transition-all shadow-lg"
          >
            <span>Launch CAD Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

