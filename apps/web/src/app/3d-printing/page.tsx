import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
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
  HelpCircle,
  FileCheck,
  Eye,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Best 3D Printing Service in India | Free STL & STEP Viewer | TTRC Store',
  description:
    'Best industrial-grade FDM 3D printing in India. Free interactive online STL & STEP file viewer, instant 3D geometry analysis, watertight validation, and rapid manufacturing in PLA, PETG, ABS, TPU & Nylon with pan-India fast dispatch.',
  keywords: [
    'free stl viewer',
    'free step view',
    'free step viewer',
    'free online cad viewer',
    'good quality 3d printing',
    'best 3d printing',
    'best 3d printing service india',
    'online 3d printing india',
    '3d printing online quotation',
    'instant 3d print quote',
    'fdm 3d printing service',
    'pla 3d printing india',
    'petg 3d printing service',
    'abs 3d printing online',
    'tpu flexible 3d printing',
    'custom 3d printed parts',
    'robotics 3d printing parts',
    'rapid prototyping tamil nadu',
    '3d printing coimbatore',
    '3d printing chennai',
    'stl geometry validator',
    'manifold watertight mesh check',
    'step file online viewer',
    'engineering 3d printing india',
  ],
  alternates: {
    canonical: 'https://www.ttrc.store/3d-printing',
  },
  openGraph: {
    title: 'Best 3D Printing Service in India & Free STL/STEP Viewer | TTRC Store',
    description:
      'High-precision FDM 3D printing & free interactive WebGL STL/STEP model inspection. Upload your CAD file for instant dimensioning and custom engineering quotes.',
    url: 'https://www.ttrc.store/3d-printing',
    siteName: 'TTRC Store - Tamizh Tech',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best 3D Printing Service in India & Free STL/STEP Viewer',
    description:
      'Instant 3D model inspection, dimensional analysis & industrial-quality FDM 3D printing across India.',
  },
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

      {/* AEO & SEO: Capabilities & Quality Standards Matrix */}
      <section className="py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#844AFB] bg-[#EEE8FA] px-3 py-1 rounded-full">
              Industrial Precision Benchmarks
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Good Quality 3D Printing &amp; Free CAD Inspection Standards
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Engineered for robotics developers, universities, makers, and production engineering teams across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#844AFB] flex items-center justify-center mb-3">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Free STL &amp; STEP Viewer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero installation required. View STL and STEP models online with real-time 3D WebGL orbit controls, dynamic unit switching (mm, cm, inch), and wireframe toggle.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Automated Mesh Validation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant divergence-theorem solid volume computation, watertight manifold topology checks, shell count detection, and non-manifold boundary repair.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">&plusmn;0.2mm Precision Tolerance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calibrated stepper drivers and tuned extrusion ensure tight tolerances for motor mounts, bearing housings, interlocking gearboxes, and snap-fit joints.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Best 3D Printing Service</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Human slicing verification by Tamizh Tech engineers prevents failed prints, stringing, or weak layer adhesion. Guaranteed industrial durability for functional parts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AEO: Frequently Asked Questions (Structured for AI Engine Optimization) */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#844AFB] bg-[#EEE8FA] px-3 py-1 rounded-full">
              Answer Engine Optimization &bull; Q&amp;A
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Frequently Asked Questions About 3D Printing &amp; CAD Viewing
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Everything you need to know about our free 3D model viewer, engineering validation, and rapid print delivery in India.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#844AFB] shrink-0" />
                <span>How can I use the free STL viewer and free STEP viewer online?</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Visit our <Link href="/3d-printing/request" className="text-[#844AFB] font-semibold hover:underline">3D Printing CAD Studio</Link> and upload any STL (.stl) or STEP (.step, .stp) file. The 3D model renders immediately in your browser via WebGL. You can rotate, zoom, pan, toggle wireframe, view exact length, width, and height in mm, cm, or inches, and verify whether your model is watertight and manifold—completely free without any sign-up.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#844AFB] shrink-0" />
                <span>What makes TTRC Store the best 3D printing service in India?</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unlike automated quoting platforms that use generic slicer presets, TTRC Store pairs automated geometry validation with manual review by experienced robotics engineers at Tamizh Tech. We evaluate part orientation for maximum Z-strength, recommend optimal infill patterns (Gyroid, Grid, Honeycomb), and check printer bed clearance before finalizing quotations.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#844AFB] shrink-0" />
                <span>How do you guarantee good quality 3D printing for functional parts?</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We use high-grade virgin filaments (PLA, PETG, ABS, TPU 95A, and Carbon-fiber Nylon) calibrated across high-temperature all-metal hotends. Every print is inspected for dimensional fidelity (&plusmn;0.2mm tolerance), layer adhesion, and surface finish before dispatch.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#844AFB] shrink-0" />
                <span>What file formats are accepted for online 3D printing quotations?</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We accept STL (Standard Triangle Language, both binary and ASCII) and STEP / STP (ISO 10303-21 standard for CAD solids from SolidWorks, Fusion 360, CATIA, and Inventor). Our WebAssembly CAD engine parses STEP files natively in the browser.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#844AFB] shrink-0" />
                <span>How fast is shipping across Tamil Nadu and all of India?</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prototypes in standard materials are manufactured within 24 to 48 hours. Orders deliver in 1-2 days across Tamil Nadu (Chennai, Coimbatore, Madurai, Trichy, Salem) and 2-4 days across the rest of India via express courier with real-time tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Data Scripts for SEO & Answer Engines (AEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Free Online STL & STEP 3D Viewer | TTRC Store',
            operatingSystem: 'Any (Web Browser)',
            applicationCategory: 'EngineeringApplication',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'INR',
            },
            description:
              'Free interactive WebGL 3D viewer for STL and STEP CAD files. Inspect 3D models with live bounding box dimensions, volume calculation, and watertight mesh topology checks.',
            url: 'https://www.ttrc.store/3d-printing/request',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Best Industrial FDM 3D Printing Service in India',
            serviceType: '3D Printing & Rapid Prototyping',
            provider: {
              '@type': 'Organization',
              name: 'Tamizh Tech / TTRC Store',
              url: 'https://www.ttrc.store',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Coimbatore',
                addressRegion: 'Tamil Nadu',
                addressCountry: 'IN',
              },
            },
            areaServed: {
              '@type': 'Country',
              name: 'India',
            },
            description:
              'Top-quality on-demand FDM 3D printing in PLA, PETG, ABS, TPU, and Nylon with verified human quotation, 0.1mm layer resolution, and fast dispatch across India.',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Where can I find a free STL viewer and free STEP viewer online?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'TTRC Store provides a 100% free online STL and STEP 3D viewer directly in your web browser. Upload your binary or ASCII STL, or STEP (.step, .stp) model to inspect geometry with 360-degree rotation, measure exact dimensions (X, Y, Z in mm, cm, or inches), check watertight manifold status, and compute solid volume without software installation.',
                },
              },
              {
                '@type': 'Question',
                name: 'What makes TTRC Store the best 3D printing service in India?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'TTRC Store combines an interactive 3D WebGL viewer with verified engineering review. Unlike automated engines that produce flawed slicing, our engineering team in Tamil Nadu audits orientation, wall thickness, infill density, and structural durability before quoting, delivering good quality industrial 3D prints across India.',
                },
              },
              {
                '@type': 'Question',
                name: 'How do you guarantee good quality 3D printing for functional parts?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Every model undergoes automated geometry verification for watertight manifold integrity, followed by human slicing review. We calibrate industrial FDM machines for 0.10mm to 0.28mm layer heights, maintaining dimensional tolerance of ±0.2mm using high-grade engineering polymers (PLA, PETG, ABS, TPU 95A, and Nylon).',
                },
              },
              {
                '@type': 'Question',
                name: 'What file formats are accepted for online 3D printing quotations?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We support standard CAD formats including STL (.stl, binary and ASCII) and STEP / STP (ISO 10303-21 .step, .stp). Our WebAssembly CAD engine translates STEP boundary representations into watertight polygon meshes instantly.',
                },
              },
              {
                '@type': 'Question',
                name: 'How fast is 3D print dispatch across India?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Prototype prints in PLA and PETG are typically manufactured and dispatched within 24 to 48 hours. We deliver across Tamil Nadu (Chennai, Coimbatore, Madurai, Salem) in 1-2 days and nationwide across India via express courier.',
                },
              },
            ],
          }),
        }}
      />

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

