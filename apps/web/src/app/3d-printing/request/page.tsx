'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CADViewerDynamic } from '@/components/cad/cad-viewer-client';
import { GeometryAnalysisResult } from '@/lib/cad/geometry';
import {
  UploadCloud,
  Box,
  Layers,
  Settings2,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Loader2,
  Sparkles,
} from 'lucide-react';

const FDM_MATERIALS = [
  {
    code: 'PLA',
    name: 'PLA (Polylactic Acid)',
    desc: 'Cost-effective, high detail, ideal for rapid prototypes & models.',
    colors: ['Black', 'White', 'Signal Red', 'Grey', 'Blue', 'Yellow'],
  },
  {
    code: 'PETG',
    name: 'PETG (Polyethylene Terephthalate Glycol)',
    desc: 'Impact-resistant, durable, chemical-resistant for functional parts.',
    colors: ['Black', 'White', 'Signal Red', 'Grey', 'Translucent'],
  },
  {
    code: 'ABS',
    name: 'ABS (Acrylonitrile Butadiene Styrene)',
    desc: 'High heat & impact resistance; supports acetone vapor smoothing.',
    colors: ['Black', 'White', 'Grey', 'Signal Red'],
  },
  {
    code: 'ASA',
    name: 'ASA (Acrylonitrile Styrene Acrylate)',
    desc: 'UV-resistant, weather-resistant engineering grade for outdoor robotics.',
    colors: ['Black', 'White', 'Grey'],
  },
  {
    code: 'TPU',
    name: 'TPU 95A (Thermoplastic Polyurethane)',
    desc: 'Flexible, rubber-like damping pads, bumpers, and tires.',
    colors: ['Black', 'White', 'Signal Red'],
  },
  {
    code: 'Nylon',
    name: 'Nylon PA12',
    desc: 'Superior fatigue resistance, self-lubricating for mechanical gears.',
    colors: ['Black', 'Natural White'],
  },
] as const;

export default function CADRequestStudioPage() {
  const router = useRouter();

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<'STL' | 'STEP' | 'STP'>('STL');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Analysis state
  const [analysis, setAnalysis] = useState<GeometryAnalysisResult | null>(null);
  const [unit, setUnit] = useState<'mm' | 'cm' | 'inch'>('mm');

  // Print Configuration state
  const [material, setMaterial] = useState<string>('PLA');
  const [color, setColor] = useState<string>('Black');
  const [layerHeight, setLayerHeight] = useState<number>(0.20);
  const [infill, setInfill] = useState<number>(20);
  const [infillPattern, setInfillPattern] = useState<'grid' | 'gyroid' | 'cubic' | 'honeycomb'>('grid');
  const [supports, setSupports] = useState<'auto' | 'none' | 'admin_decision'>('admin_decision');
  const [quantity, setQuantity] = useState<number>(1);
  const [finish, setFinish] = useState<'standard' | 'sanded' | 'acetone_smooth'>('standard');
  const [purpose, setPurpose] = useState<string>('prototype');

  // Customer Contact State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerCity, setCustomerCity] = useState<string>('');
  const [customerCompany, setCustomerCompany] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-fill logged-in user profile if available
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/account/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCustomerName(data.user.full_name || '');
            setCustomerEmail(data.user.email || '');
            if (data.user.phone) setCustomerMobile(data.user.phone);
          }
        }
      } catch {
        // Guest user
      }
    }
    fetchUser();
  }, []);

  // Sync available colors when material changes
  useEffect(() => {
    const matConfig = FDM_MATERIALS.find((m) => m.code === material);
    if (matConfig && !matConfig.colors.includes(color as any)) {
      setColor(matConfig.colors[0]);
    }
    // Acetone smoothing only for ABS/ASA
    if (material !== 'ABS' && material !== 'ASA' && finish === 'acetone_smooth') {
      setFinish('standard');
    }
  }, [material, color, finish]);

  // Memoized geometry analysis handler to prevent unnecessary re-render loops
  const handleAnalysisComplete = useCallback(
    (res: GeometryAnalysisResult, confirmedUnit: 'mm' | 'cm' | 'inch') => {
      setAnalysis(res);
      setUnit((prev) => (prev !== confirmedUnit ? confirmedUnit : prev));
    },
    []
  );

  // Handle Drag & Drop / File Input
  const handleFileSelect = async (selectedFile: File) => {
    setUploadError(null);
    const name = selectedFile.name.toLowerCase();

    let fileFmt: 'STL' | 'STEP' | 'STP' | null = null;
    if (name.endsWith('.stl')) fileFmt = 'STL';
    else if (name.endsWith('.step')) fileFmt = 'STEP';
    else if (name.endsWith('.stp')) fileFmt = 'STP';

    if (!fileFmt) {
      setUploadError('Unsupported file type. Please upload a 3D model in STL (.stl) or STEP (.step, .stp) format.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setUploadError('File size exceeds the 50 MB limit. Please optimize or compress your CAD mesh.');
      return;
    }

    try {
      // 1. Immediately read local buffer for INSTANT 3D rendering in browser (sub-second!)
      const buffer = await selectedFile.arrayBuffer();
      setFile(selectedFile);
      setFileBuffer(buffer);
      setFormat(fileFmt);
      setUploading(true);

      // 2. Simultaneously upload in background to secure private server storage
      const formData = new FormData();
      formData.append('file', selectedFile);

      fetch('/api/3d-printing/upload', {
        method: 'POST',
        body: formData,
      })
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Failed to upload CAD file.');
          setFileId(json.fileId);
          setPreviewUrl(json.signedUrl);
        })
        .catch((err) => {
          console.error('[CAD Upload Background Error]', err);
          setUploadError('Warning: Server backup failed. Please try re-selecting your CAD file before submitting.');
        })
        .finally(() => {
          setUploading(false);
        });
    } catch (err: any) {
      setUploadError(err.message || 'Error reading local CAD file.');
      setFile(null);
      setFileBuffer(null);
    }
  };

  // Submit Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!fileId || !analysis) {
      setSubmitError('Please upload and verify your 3D CAD model before requesting a quote.');
      return;
    }

    if (!customerName || !customerEmail || !customerMobile || !customerCity) {
      setSubmitError('Please complete all mandatory customer contact fields (Name, Email, Mobile, City).');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(customerMobile)) {
      setSubmitError('Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        fileId,
        originalFilename: file?.name || 'model.stl',
        format,
        originalUnit: unit,
        configuration: {
          technology: 'FDM',
          material,
          color,
          layer_height: layerHeight,
          infill_percentage: infill,
          infill_pattern: infillPattern,
          supports,
          quantity,
          finish,
          purpose,
        },
        analysis: {
          normalized_dimensions_mm: analysis.dimensions,
          volume_cm3: analysis.volumeCm3,
          surface_area_cm2: analysis.surfaceAreaCm2,
          triangle_count: analysis.triangleCount,
          is_watertight: analysis.isWatertight,
          is_manifold: analysis.isManifold,
          shell_count: analysis.shellCount,
          degenerate_triangles: analysis.degenerateTriangles,
          warnings: analysis.warnings,
        },
        customer: {
          name: customerName.trim(),
          email: customerEmail.trim().toLowerCase(),
          mobile: customerMobile.trim(),
          city: customerCity.trim(),
          company: customerCompany.trim() || undefined,
          additional_requirements: customerNotes.trim() || undefined,
        },
      };

      const res = await fetch('/api/3d-printing/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit 3D printing request.');
      }

      router.push(json.trackingUrl);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error. Please try again.');
      setSubmitting(false);
    }
  };

  // Color hex mapping for viewer
  const getColorHex = (c: string) => {
    switch (c) {
      case 'Black':
        return '#1E293B';
      case 'White':
        return '#F8FAFC';
      case 'Signal Red':
        return '#E3132A';
      case 'Grey':
        return '#64748B';
      case 'Blue':
        return '#2563EB';
      case 'Yellow':
        return '#EAB308';
      default:
        return '#E3132A';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-slate-800 transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/3d-printing" className="hover:text-slate-800 transition-colors">
                3D Printing Service
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">CAD Quotation Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              3D CAD-to-Quotation Studio
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Upload your STL or STEP engineering design for instant 3D inspection, geometry analysis, and human quotation.
            </p>
          </div>
        </div>

        {/* Main Grid: Viewport on Left, Configuration & Form on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: 3D CAD Viewport & Upload (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-[#E3132A]" />
                  <span className="font-semibold text-slate-900 text-sm">
                    Interactive 3D Model Inspection
                  </span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  FDM Precision Engine
                </span>
              </div>

              {/* Viewport or Upload Dropzone */}
              {!fileBuffer ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className="w-full min-h-[460px] border-2 border-dashed border-slate-300 hover:border-[#E3132A] rounded-xl flex flex-col items-center justify-center p-8 text-center transition-colors bg-slate-50/50 cursor-pointer"
                  onClick={() => document.getElementById('cad-file-input')?.click()}
                >
                  <input
                    id="cad-file-input"
                    type="file"
                    accept=".stl,.step,.stp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-16 h-16 rounded-full bg-red-50 text-[#E3132A] flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Drop your 3D CAD Model here
                  </h4>
                  <p className="text-sm text-slate-500 mt-1 mb-4">
                    Supports <span className="font-semibold text-slate-800">.STL</span> and{' '}
                    <span className="font-semibold text-slate-800">.STEP / .STP</span> files (up to 50 MB)
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-[#E3132A] hover:bg-[#B80F21] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Browse CAD File
                  </button>

                  {uploadError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="relative w-full h-[480px]">
                    <CADViewerDynamic
                      fileBuffer={fileBuffer || undefined}
                      fileUrl={fileBuffer ? undefined : (previewUrl || undefined)}
                      fileName={file?.name || 'model.stl'}
                      fileFormat={format}
                      initialUnit={unit}
                      modelColor={getColorHex(color)}
                      onAnalysisComplete={handleAnalysisComplete}
                    />
                  </div>

                  {/* Re-upload button & background status */}
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        Loaded:{' '}
                        <strong className="text-slate-800">{file?.name}</strong> (
                        {((file?.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      {uploading && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded">
                          <Loader2 className="w-3 h-3 animate-spin text-[#E3132A]" />
                          Encrypting &amp; Syncing...
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setFileBuffer(null);
                        setFileId(null);
                        setPreviewUrl(null);
                        setAnalysis(null);
                      }}
                      className="text-[#E3132A] hover:underline font-medium"
                    >
                      Change CAD File
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Design Guidelines Note */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs text-slate-600 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  TTRC Engineering Privacy & Precision Guarantee
                </strong>
                All CAD designs are encrypted in private storage with short-lived tokens and never made public.
                Our engineering team reviews geometry for wall thickness (&ge; 1.2 mm recommended) and structural orientation before issuing your quotation.
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: FDM Configuration & Contact Form (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col gap-6">
              {/* Section 1: FDM Configuration */}
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
                  <Settings2 className="w-5 h-5 text-[#E3132A]" />
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                    1. Print Configuration
                  </h3>
                </div>

                {/* Material Selection */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    FDM Material <span className="text-[#E3132A]">*</span>
                  </label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                  >
                    {FDM_MATERIALS.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {FDM_MATERIALS.find((m) => m.code === material)?.desc}
                  </p>
                </div>

                {/* Filament Color Selection */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filament Color <span className="text-[#E3132A]">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FDM_MATERIALS.find((m) => m.code === material)?.colors.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          color === c
                            ? 'border-[#E3132A] bg-red-50 text-[#E3132A] font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layer Height & Infill Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Layer Height
                    </label>
                    <select
                      value={layerHeight}
                      onChange={(e) => setLayerHeight(parseFloat(e.target.value))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                    >
                      <option value={0.1}>0.10 mm (Ultra-Fine)</option>
                      <option value={0.16}>0.16 mm (Fine)</option>
                      <option value={0.2}>0.20 mm (Standard)</option>
                      <option value={0.28}>0.28 mm (Draft / Fast)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Infill ({infill}%)
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={infill}
                      onChange={(e) => setInfill(parseInt(e.target.value))}
                      className="w-full accent-[#E3132A] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>10% (Light)</span>
                      <span>100% (Solid)</span>
                    </div>
                  </div>
                </div>

                {/* Infill Pattern & Supports */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Infill Pattern
                    </label>
                    <select
                      value={infillPattern}
                      onChange={(e) => setInfillPattern(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                    >
                      <option value="grid">Grid (General)</option>
                      <option value="gyroid">Gyroid (High Strength)</option>
                      <option value="cubic">Cubic (Uniform 3D)</option>
                      <option value="honeycomb">Honeycomb</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Supports
                    </label>
                    <select
                      value={supports}
                      onChange={(e) => setSupports(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                    >
                      <option value="admin_decision">Admin Recommended</option>
                      <option value="auto">Generate Supports</option>
                      <option value="none">No Supports</option>
                    </select>
                  </div>
                </div>

                {/* Quantity & Finish */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quantity (Units) <span className="text-[#E3132A]">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Surface Finish
                    </label>
                    <select
                      value={finish}
                      onChange={(e) => setFinish(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                    >
                      <option value="standard">Standard Cleaned</option>
                      <option value="sanded">Sanded Support Marks</option>
                      {(material === 'ABS' || material === 'ASA') && (
                        <option value="acetone_smooth">Acetone Vapor Smoothing</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Mandatory Customer Contact Details */}
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
                  <User className="w-5 h-5 text-[#E3132A]" />
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                    2. Customer Contact Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-[#E3132A]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arun Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number <span className="text-[#E3132A]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile (e.g. 9876543210)"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-[#E3132A]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery City <span className="text-[#E3132A]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chennai, Coimbatore"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / College / Institution (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tamizh Tech Robotics Club"
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Requirements & Finishing Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specify critical tolerances, screw insert locations, or target weight constraints..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#E3132A]"
                  />
                </div>
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit CTA Gate */}
              <button
                type="submit"
                disabled={!fileId || !analysis || submitting}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                  !fileId || !analysis || submitting
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-[#E3132A] hover:bg-[#B80F21] active:scale-[0.99]'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting Engineering Request...
                  </>
                ) : (
                  <>
                    <span>Submit for Official Quotation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {!analysis && (
                <p className="text-[11px] text-center text-slate-400">
                  Upload and preview your 3D model to activate quotation submission.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
