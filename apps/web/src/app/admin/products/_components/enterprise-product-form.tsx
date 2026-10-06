'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Video,
  Upload,
  Lock,
  Layers,
  Sparkles,
  Eye,
  Star,
  Cpu,
  Package,
  Shield,
  FileText,
  DollarSign,
  Tag,
  Factory,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { sanitizeVideoEmbedUrl } from '@/lib/video-utils';

export interface EnterpriseProductFormProps {
  initialData?: any;
  productId?: string;
  isEditMode?: boolean;
  onSubmitAction: (data: any) => Promise<{ success?: boolean; error?: string; productId?: string; slug?: string }>;
}

// 4 Initial Reference Product Presets per Master Prompt
const REFERENCE_PRESETS = [
  {
    id: 'kl-f2',
    name: 'CNKALUN KL-F2 2-Way Brass Solenoid Valve',
    sku: 'CNK-KLF2',
    unit: 'Piece',
    category: 'industrial-components',
    productType: 'standard',
    price: '1299',
    mrp: '1499',
    manufacturer: 'CNKALUN',
    brand: 'CNKALUN',
    countryOfOrigin: 'China',
    hsnCode: '84818090',
    gstPercent: '18',
    stock: '50',
    weight: '320',
    material: 'Forged Brass',
    shortDescription: 'High precision 2-way normally closed brass solenoid valve for liquid and gas flow control.',
    description: 'The CNKALUN KL-F2 is an industrial-grade 2-way brass solenoid valve designed for reliable fluid automation, water dispensing machines, coffee apparatus, and industrial pneumatic control circuits. Built with a forged brass body and corrosion-resistant plunger assembly for high-cycle longevity.',
    applications: ['Coffee machines & beverage dispensers', 'Water dispensing systems', 'Fluid automation equipment', 'Industrial pneumatic control'],
    specs: [
      { key: 'Valve Type', value: '2-Way Normally Closed (N/C)' },
      { key: 'Body Material', value: 'High Grade Forged Brass' },
      { key: 'Operating Medium', value: 'Water, Liquid, Air' },
      { key: 'Fluid Temperature Range', value: '0°C to 100°C' },
    ],
    bulkTiers: [
      { minQuantity: 5, maxQuantity: 9, unitPrice: '1199' },
      { minQuantity: 10, unitPrice: '1099' },
    ],
  },
  {
    id: 'kl-f3',
    name: 'CNKALUN KL-F3 3-Way Brass Solenoid Valve',
    sku: 'CNK-KLF3',
    unit: 'Piece',
    category: 'industrial-components',
    productType: 'standard',
    price: '1499',
    mrp: '1799',
    manufacturer: 'CNKALUN',
    brand: 'CNKALUN',
    countryOfOrigin: 'China',
    hsnCode: '84818090',
    gstPercent: '18',
    stock: '40',
    weight: '360',
    material: 'Forged Brass',
    shortDescription: 'Industrial 3-way brass solenoid valve engineered for dual-channel routing and pressure relief.',
    description: 'The CNKALUN KL-F3 is a commercial 3-way brass solenoid valve featuring precision porting for directional diversion, steam release, and automated fluid routing. Ideal for espresso boiler circuits, commercial beverage dispensers, and automated hydraulic setups.',
    applications: ['Espresso machine brew groups', 'Directional fluid routing circuits', 'Steam & condensate relief', 'Automated dispensing lines'],
    specs: [
      { key: 'Valve Type', value: '3-Way 2-Position' },
      { key: 'Body Material', value: 'Forged Brass' },
      { key: 'Port Configuration', value: 'Inlet, Outlet, Exhaust / Diverter' },
      { key: 'Operating Medium', value: 'Water, Steam, Air' },
    ],
    bulkTiers: [
      { minQuantity: 5, maxQuantity: 9, unitPrice: '1399' },
      { minQuantity: 10, unitPrice: '1299' },
    ],
  },
  {
    id: 'kp1-plastic',
    name: 'CNKALUN KP1 220–240V Solenoid Water Pump — Plastic Output',
    sku: 'CNK-KP1-PLS',
    unit: 'Piece',
    category: 'industrial-components',
    productType: 'standard',
    price: '1799',
    mrp: '2199',
    manufacturer: 'CNKALUN',
    brand: 'CNKALUN',
    countryOfOrigin: 'China',
    hsnCode: '84138190',
    gstPercent: '18',
    stock: '35',
    weight: '440',
    material: 'Engineered Polymer Housing with Plastic Output Nozzle',
    voltage: '220-240V AC 50Hz',
    shortDescription: 'Self-priming reciprocating electromagnetic solenoid water pump with durable engineered plastic output nozzle.',
    description: 'The CNKALUN KP1 (Plastic Output) is an electromagnetic solenoid plunger pump engineered for high-pressure fluid delivery in steam irons, floor steamers, garment presses, and automated liquid dispensing units. Operates directly on standard 220–240V AC electrical supplies.',
    applications: ['Garment steamers & commercial irons', 'Automated floor cleaners & mops', 'Coffee and beverage pumping', 'Precision chemical dosing apparatus'],
    specs: [
      { key: 'Pump Principle', value: 'Electromagnetic Solenoid Reciprocating' },
      { key: 'Rated Voltage', value: '220–240V AC / 50Hz' },
      { key: 'Output Fitting', value: 'Reinforced Polymer / Plastic Nozzle' },
      { key: 'Insulation Class', value: 'Class H (Thermal Protected)' },
    ],
    bulkTiers: [
      { minQuantity: 5, maxQuantity: 9, unitPrice: '1699' },
      { minQuantity: 10, unitPrice: '1599' },
    ],
  },
  {
    id: 'kp1-brass',
    name: 'CNKALUN KP1 220–240V Solenoid Water Pump — Brass Output',
    sku: 'CNK-KP1-BRS',
    unit: 'Piece',
    category: 'industrial-components',
    productType: 'standard',
    price: '2099',
    mrp: '2499',
    manufacturer: 'CNKALUN',
    brand: 'CNKALUN',
    countryOfOrigin: 'China',
    hsnCode: '84138190',
    gstPercent: '18',
    stock: '30',
    weight: '480',
    material: 'Engineered Polymer Housing with Machined Brass Output Nozzle',
    voltage: '220-240V AC 50Hz',
    shortDescription: 'Heavy-duty reciprocating electromagnetic solenoid water pump with high-strength machined brass output connector.',
    description: 'The CNKALUN KP1 (Brass Output) is a premium commercial solenoid pump fitted with a heavy-duty threaded brass output fitting. Designed for high pressure, elevated thermal environments, commercial espresso machines, and industrial steam cleaning equipment where metallic structural integrity is required.',
    applications: ['Commercial espresso machines', 'High-pressure steam generators', 'Medical sterilization autoclaves', 'Industrial fluid circulation'],
    specs: [
      { key: 'Pump Principle', value: 'Electromagnetic Solenoid Plunger' },
      { key: 'Rated Voltage', value: '220–240V AC / 50Hz' },
      { key: 'Output Fitting', value: 'Solid Machined Brass' },
      { key: 'Insulation Class', value: 'Class H (180°C)' },
    ],
    bulkTiers: [
      { minQuantity: 5, maxQuantity: 9, unitPrice: '1999' },
      { minQuantity: 10, unitPrice: '1899' },
    ],
  },
];

export function EnterpriseProductForm({
  initialData,
  productId,
  isEditMode = false,
  onSubmitAction,
}: EnterpriseProductFormProps) {
  const router = useRouter();

  // Basic Information
  const [name, setName] = React.useState(initialData?.name || '');
  const [slug, setSlug] = React.useState(initialData?.slug || '');
  const [sku, setSku] = React.useState(initialData?.sku || '');
  const [unit, setUnit] = React.useState(initialData?.unit || 'Piece');

  // Classification & Status
  const [productType, setProductType] = React.useState(initialData?.productType || 'standard');
  const [status, setStatus] = React.useState(initialData?.status || 'published');
  const [categoryId, setCategoryId] = React.useState(initialData?.categoryId || 'industrial-components');

  // Commercial Pricing & Bulk Tiers
  const [price, setPrice] = React.useState(
    initialData?.pricePaise ? (initialData.pricePaise / 100).toString() : '1299'
  );
  const [mrp, setMrp] = React.useState(
    initialData?.mrpPaise ? (initialData.mrpPaise / 100).toString() : '1499'
  );
  const [bulkTiers, setBulkTiers] = React.useState<
    Array<{ minQuantity: number; maxQuantity?: number; unitPrice: string }>
  >(
    initialData?.bulkPriceTiers && initialData.bulkPriceTiers.length > 0
      ? initialData.bulkPriceTiers.map((t: any) => ({
          minQuantity: t.minQuantity,
          maxQuantity: t.maxQuantity,
          unitPrice: (t.unitPricePaise / 100).toString(),
        }))
      : [
          { minQuantity: 5, maxQuantity: 9, unitPrice: '1199' },
          { minQuantity: 10, unitPrice: '1099' },
        ]
  );

  // Inventory
  const [stock, setStock] = React.useState(
    initialData?.stockQty !== undefined ? initialData.stockQty.toString() : '25'
  );
  const [lowStockThreshold, setLowStockThreshold] = React.useState(
    initialData?.lowStockThreshold !== undefined ? initialData.lowStockThreshold.toString() : '5'
  );

  // Media
  const [imageUrls, setImageUrls] = React.useState<string[]>(
    initialData?.imageUrls && initialData.imageUrls.length > 0
      ? initialData.imageUrls
      : []
  );
  const [primaryImageIdx, setPrimaryImageIdx] = React.useState(0);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [manualImageUrl, setManualImageUrl] = React.useState('');
  const [videoUrl, setVideoUrl] = React.useState(initialData?.videoUrl || '');

  // Descriptions & Applications
  const [shortDescription, setShortDescription] = React.useState(initialData?.shortDescription || '');
  const [longDescription, setLongDescription] = React.useState(initialData?.longDescription || '');
  const [applications, setApplications] = React.useState<string[]>(
    initialData?.applications || []
  );
  const [newApplicationInput, setNewApplicationInput] = React.useState('');

  // Hardware Specs
  const [modelNumber, setModelNumber] = React.useState(initialData?.modelNumber || '');
  const [partNumber, setPartNumber] = React.useState(initialData?.partNumber || '');
  const [voltage, setVoltage] = React.useState(initialData?.voltage || '');
  const [current, setCurrent] = React.useState(initialData?.current || '');
  const [material, setMaterial] = React.useState(initialData?.material || '');
  const [dimensions, setDimensions] = React.useState(initialData?.dimensions || '');
  const [warranty, setWarranty] = React.useState(initialData?.warranty || '1 Year Standard Warranty');
  const [specs, setSpecs] = React.useState<Array<{ key: string; value: string }>>(
    initialData?.specs || []
  );

  // Brand & Manufacturer
  const [brand, setBrand] = React.useState(initialData?.brand || 'CNKALUN');
  const [manufacturerName, setManufacturerName] = React.useState(initialData?.manufacturerName || 'CNKALUN');
  const [showManufacturerPublicly, setShowManufacturerPublicly] = React.useState(
    initialData?.showManufacturerPublicly ?? true
  );

  // Supplier / Internal Procurement (ADMIN ONLY)
  const [supplier, setSupplier] = React.useState(initialData?.supplier || 'Direct Factory Procurement');
  const [costPrice, setCostPrice] = React.useState(
    initialData?.costPricePaise ? (initialData.costPricePaise / 100).toString() : ''
  );
  const [landedCost, setLandedCost] = React.useState(
    initialData?.landedCostPaise ? (initialData.landedCostPaise / 100).toString() : ''
  );
  const [internalNotes, setInternalNotes] = React.useState(initialData?.internalNotes || '');

  // Tax & Compliance
  const [hsnCode, setHsnCode] = React.useState(initialData?.hsnCode || '84818090');
  const [gstPercent, setGstPercent] = React.useState(
    initialData?.gstPercent ? initialData.gstPercent.toString() : '18'
  );
  const [countryOfOrigin, setCountryOfOrigin] = React.useState(initialData?.countryOfOrigin || 'India');
  const [weight, setWeight] = React.useState(
    initialData?.weightGrams ? initialData.weightGrams.toString() : '350'
  );
  const [certifications, setCertifications] = React.useState<string[]>(
    initialData?.certifications || ['CE', 'RoHS']
  );
  const [newCertInput, setNewCertInput] = React.useState('');

  // SEO
  const [seoTitle, setSeoTitle] = React.useState(initialData?.seoTitle || '');
  const [seoDescription, setSeoDescription] = React.useState(initialData?.seoDescription || '');

  // Form State
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // AI & Slug Generation State
  const [autoSlugLocked, setAutoSlugLocked] = React.useState(Boolean(initialData?.slug));
  const [aiGenerating, setAiGenerating] = React.useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = React.useState<string | null>(null);
  const [hsnAiSuggestion, setHsnAiSuggestion] = React.useState<{
    confidence: string;
    reasoning: string;
  } | null>(null);

  // Live Calculations
  const numericPrice = parseFloat(price || '0');
  const numericMrp = parseFloat(mrp || '0');
  const numericCost = parseFloat(costPrice || '0');
  const discountPct =
    numericMrp > numericPrice && numericMrp > 0
      ? Math.round(((numericMrp - numericPrice) / numericMrp) * 100)
      : 0;
  const estimatedMargin =
    numericPrice > numericCost && numericCost > 0
      ? Math.round(((numericPrice - numericCost) / numericPrice) * 100)
      : null;

  // Deterministic local slug generator
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  // Auto-generate slug & SEO Meta Title from name in real-time
  const handleNameChange = (val: string) => {
    setName(val);
    if (!autoSlugLocked) {
      setSlug(slugify(val));
    }
    if (!seoTitle || seoTitle.endsWith(' | TTRC Store')) {
      setSeoTitle(val ? `${val} | TTRC Store` : '');
    }
  };

  // AI Details & SEO Generation Handler
  const handleGenerateWithAi = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter a Product Title first to generate AI details.');
      return;
    }
    setAiGenerating(true);
    setErrorMsg(null);
    setAiSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/ai/generate-product-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name,
          categoryId,
          rawNotes: shortDescription || longDescription || internalNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate details');
      }

      const { data } = json;
      if (data.seoTitle) setSeoTitle(data.seoTitle);
      if (data.seoDescription) setSeoDescription(data.seoDescription);
      if (data.shortDescription && !shortDescription) setShortDescription(data.shortDescription);
      if (data.longDescription && !longDescription) setLongDescription(data.longDescription);
      if (data.specs && data.specs.length > 0 && specs.length === 0) setSpecs(data.specs);
      if (data.applications && data.applications.length > 0 && applications.length === 0) setApplications(data.applications);
      if (data.suggestedHsn) {
        setHsnCode(data.suggestedHsn.code);
        setHsnAiSuggestion({
          confidence: data.suggestedHsn.confidence,
          reasoning: data.suggestedHsn.reasoning,
        });
      }

      setAiSuccessMsg('✨ AI Product Details & SEO generated! Review and verify before saving.');
    } catch (err: any) {
      setErrorMsg(`AI Generation error: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  // Preset Populator
  const applyPreset = (presetId: string) => {
    const p = REFERENCE_PRESETS.find((r) => r.id === presetId);
    if (!p) return;

    setName(p.name);
    setSlug(p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    setSku(p.sku);
    setUnit(p.unit);
    setCategoryId(p.category);
    setProductType(p.productType as any);
    setPrice(p.price);
    setMrp(p.mrp);
    setBrand(p.brand);
    setManufacturerName(p.manufacturer);
    setCountryOfOrigin(p.countryOfOrigin);
    setHsnCode(p.hsnCode);
    setGstPercent(p.gstPercent);
    setStock(p.stock);
    setWeight(p.weight);
    setMaterial(p.material);
    if (p.voltage) setVoltage(p.voltage);
    setShortDescription(p.shortDescription);
    setLongDescription(p.description);
    setApplications(p.applications);
    setSpecs(p.specs);
    setBulkTiers(p.bulkTiers);
    setSeoTitle(`${p.name} | TTRC Store`);
    setSeoDescription(p.shortDescription);
  };

  // Direct File Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 5) {
      setErrorMsg('Maximum 5 media items allowed total.');
      return;
    }

    setUploadingImage(true);
    setErrorMsg(null);

    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to upload image file');
        }
        uploaded.push(data.url);
      }

      setImageUrls([...imageUrls, ...uploaded]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed. Please verify format (JPEG/PNG/WebP) and size (< 5MB).');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddManualImage = () => {
    if (!manualImageUrl.trim()) return;
    if (imageUrls.length >= 5) {
      setErrorMsg('Maximum 5 media items allowed total.');
      return;
    }
    setImageUrls([...imageUrls, manualImageUrl.trim()]);
    setManualImageUrl('');
    setErrorMsg(null);
  };

  const handleRemoveImage = (index: number) => {
    const updated = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updated);
    if (primaryImageIdx >= updated.length) {
      setPrimaryImageIdx(0);
    }
  };

  const handleAddBulkTier = () => {
    const lastTier = bulkTiers[bulkTiers.length - 1];
    const nextMin = lastTier ? lastTier.minQuantity + 5 : 5;
    const nextPrice = lastTier
      ? Math.max(1, parseFloat(lastTier.unitPrice) - 100).toString()
      : Math.max(1, numericPrice - 100).toString();
    setBulkTiers([...bulkTiers, { minQuantity: nextMin, unitPrice: nextPrice }]);
  };

  const handleRemoveBulkTier = (index: number) => {
    setBulkTiers(bulkTiers.filter((_, i) => i !== index));
  };

  const handleAddSpecRow = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleAddApplication = () => {
    if (!newApplicationInput.trim()) return;
    setApplications([...applications, newApplicationInput.trim()]);
    setNewApplicationInput('');
  };

  const handleRemoveApplication = (index: number) => {
    setApplications(applications.filter((_, i) => i !== index));
  };

  const handleAddCert = () => {
    if (!newCertInput.trim()) return;
    setCertifications([...certifications, newCertInput.trim()]);
    setNewCertInput('');
  };

  const handleRemoveCert = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    if (imageUrls.length === 0) {
      setErrorMsg('At least 1 product image is required. Upload a real product image before publishing.');
      setSaving(false);
      return;
    }

    if (videoUrl.trim() && !sanitizeVideoEmbedUrl(videoUrl)) {
      setErrorMsg('Video URL must be a valid YouTube or Vimeo embed URL.');
      setSaving(false);
      return;
    }

    const pricePaise = Math.round(numericPrice * 100);
    const mrpPaise = numericMrp ? Math.round(numericMrp * 100) : pricePaise;

    if (mrpPaise < pricePaise) {
      setErrorMsg('MRP cannot be less than selling price.');
      setSaving(false);
      return;
    }

    // Sort primary image first
    const reorderedImages = [...imageUrls];
    if (primaryImageIdx > 0 && primaryImageIdx < reorderedImages.length) {
      const [primary] = reorderedImages.splice(primaryImageIdx, 1);
      reorderedImages.unshift(primary);
    }

    const formattedBulkTiers = bulkTiers
      .filter((t) => t.minQuantity >= 2 && parseFloat(t.unitPrice || '0') > 0)
      .map((t) => ({
        minQuantity: Number(t.minQuantity),
        maxQuantity: t.maxQuantity ? Number(t.maxQuantity) : undefined,
        unitPricePaise: Math.round(parseFloat(t.unitPrice) * 100),
      }))
      .sort((a, b) => a.minQuantity - b.minQuantity);

    const payload = {
      id: productId,
      name,
      slug,
      sku,
      unit,
      productType,
      status,
      categoryId,
      brand,
      manufacturerId: manufacturerName,
      showManufacturerPublicly,
      supplier,
      showSupplierPublicly: false,
      pricePaise,
      mrpPaise,
      costPricePaise: numericCost > 0 ? Math.round(numericCost * 100) : undefined,
      landedCostPaise: parseFloat(landedCost || '0') > 0 ? Math.round(parseFloat(landedCost) * 100) : undefined,
      internalNotes,
      gstPercent: parseInt(gstPercent, 10) || 18,
      hsnCode,
      stockQty: parseInt(stock, 10) || 0,
      weightGrams: parseInt(weight, 10) || 350,
      countryOfOrigin,
      shortDescription,
      longDescription,
      applications,
      certifications,
      modelNumber,
      partNumber,
      voltage,
      current,
      material,
      dimensions,
      warranty,
      imageUrls: reorderedImages,
      videoUrl: videoUrl.trim() || undefined,
      bulkPriceTiers: formattedBulkTiers,
      specs: specs.filter((s) => s.key.trim() && s.value.trim()),
      seoTitle: seoTitle.trim() || `${name} | TTRC Store`,
      seoDescription: seoDescription.trim() || shortDescription,
    };

    try {
      const res = await onSubmitAction(payload);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/products');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-4 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-extrabold text-slate-900">
              {isEditMode ? `Edit Product: ${name || 'Item'}` : 'Create Real Enterprise Product'}
            </h1>
            <p className="text-xs text-slate-500">
              Database Authority • Live Storefront Synchronization • Authoritative Server Pricing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:border-purple-600 focus:outline-none"
          >
            <option value="published">🟢 Published (Live)</option>
            <option value="draft">🟡 Draft (Admin Only)</option>
            <option value="archived">⚪ Archived (Hidden)</option>
          </select>

          <Button
            type="submit"
            disabled={saving}
            className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs h-10 px-5 gap-2 rounded-xl shadow-md shadow-purple-900/20"
          >
            <Save size={16} />
            {saving ? 'Committing to DB...' : isEditMode ? 'Save & Sync' : 'Publish Product'}
          </Button>
        </div>
      </div>

      {/* Reference Preset Quick Selector (Requirement 4 & 5-9) */}
      {!isEditMode && (
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-700" /> Quick-Populate Verified Reference Commercial Presets:
            </span>
            <span className="text-[10px] text-purple-600 font-semibold">1-Click Admin Fill</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {REFERENCE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="p-2.5 text-left rounded-xl bg-white border border-purple-100 hover:border-purple-600 hover:shadow-xs transition-all text-xs space-y-1"
              >
                <p className="font-bold text-slate-900 line-clamp-1">{preset.name}</p>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Base: ₹{preset.price}</span>
                  <span className="text-emerald-700 font-bold">10+: ₹{preset.bulkTiers[1]?.unitPrice}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-600 font-semibold">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {aiSuccessMsg && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs text-purple-900 font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#844AFB] flex-shrink-0" />
            <span>{aiSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiSuccessMsg(null)}
            className="text-purple-600 hover:text-purple-900 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* SECTION 1: Basic Information */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package size={16} className="text-[#844AFB]" /> 1. Product Identity &amp; Classification
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAi}
            disabled={aiGenerating || !name.trim()}
            className="text-xs font-bold text-[#844AFB] border-purple-200 bg-purple-50/50 hover:bg-[#844AFB] hover:text-white transition-all"
          >
            <Sparkles size={13} className={aiGenerating ? 'animate-spin' : ''} />
            {aiGenerating ? 'Generating with AI...' : '✨ Auto-Fill SEO & Specs with AI'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2 space-y-1">
            <label className="font-bold text-slate-700">Product Title *</label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. CNKALUN KL-F2 2-Way Brass Solenoid Valve"
              required
              className="h-10 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">URL Slug (Normalized) *</label>
              <button
                type="button"
                onClick={() => setAutoSlugLocked(!autoSlugLocked)}
                className="text-[10px] text-slate-500 hover:text-[#844AFB] font-medium flex items-center gap-1"
                title={autoSlugLocked ? 'Slug is locked against auto-updates' : 'Slug auto-updates with title'}
              >
                {autoSlugLocked ? '🔒 Manual' : '🔄 Auto-sync with Title'}
              </button>
            </div>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlugLocked(true);
              }}
              placeholder="cnkalun-kl-f2-2-way-brass-solenoid-valve"
              required
              className="h-10 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Unique SKU *</label>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="CNK-KLF2"
              required
              className="h-10 text-xs font-mono font-bold uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Sales Unit of Measure *</label>
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Piece, Set, Meter, Box"
              required
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Product Catalog Type *</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-xs bg-white focus:border-purple-600 focus:outline-none"
            >
              <option value="standard">Standard Component</option>
              <option value="kit">Complete Competition / Robot Kit</option>
              <option value="spare_part">Spare Part / Replacement Module</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="font-bold text-slate-700">Category Selection *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-200 text-xs bg-white focus:border-purple-600 focus:outline-none"
            >
              <option value="industrial-components">Industrial Components (Valves, Pumps, Solenoids)</option>
              <option value="gamified-robots">Gamified Robots (Robo Race, Line Follower, Soccer)</option>
              <option value="stem-kits">STEM Kits</option>
              <option value="fasteners">Fasteners (Screws, Nuts, Standoffs)</option>
              <option value="batteries">Batteries &amp; Chargers</option>
              <option value="motors">Motors &amp; Drivers</option>
              <option value="sensors">Sensors Array</option>
              <option value="drones">Drone Parts &amp; Flight Controllers</option>
              <option value="wires-connectors">Wires &amp; Connectors</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: Pricing & Bulk Tiers */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <DollarSign size={16} className="text-[#844AFB]" /> 2. Per-Piece &amp; Bulk Pricing Engine
          </h2>
          {discountPct > 0 && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
              {discountPct}% Off MRP
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Base Selling Price (₹ per unit) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              <Input
                type="number"
                min="1"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="pl-7 h-10 text-xs font-bold"
              />
            </div>
            <p className="text-[11px] text-slate-500">Customer base price for single piece (stored as integer paise)</p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Maximum Retail Price / MRP (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              <Input
                type="number"
                min="1"
                step="any"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="pl-7 h-10 text-xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">Strikethrough reference price (must be ≥ selling price)</p>
          </div>
        </div>

        {/* Bulk Pricing Tiers */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers size={14} className="text-[#844AFB]" /> Quantity Bulk Pricing Tiers
              </h3>
              <p className="text-[11px] text-slate-500">
                Authoritative server-evaluated price breaks. Tiers auto-apply in cart and checkout.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBulkTier}
              className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50 gap-1 h-8 font-bold"
            >
              <Plus size={14} /> Add Quantity Tier
            </Button>
          </div>

          <div className="space-y-2">
            {bulkTiers.map((tier, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Minimum Quantity Threshold</label>
                  <Input
                    type="number"
                    min="2"
                    value={tier.minQuantity}
                    onChange={(e) => {
                      const updated = [...bulkTiers];
                      updated[idx].minQuantity = parseInt(e.target.value, 10) || 2;
                      setBulkTiers(updated);
                    }}
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>

                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Tier Unit Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">₹</span>
                    <Input
                      type="number"
                      min="1"
                      step="any"
                      value={tier.unitPrice}
                      onChange={(e) => {
                        const updated = [...bulkTiers];
                        updated[idx].unitPrice = e.target.value;
                        setBulkTiers(updated);
                      }}
                      className="pl-6 h-8 text-xs bg-white font-mono font-bold text-purple-900"
                    />
                  </div>
                </div>

                <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveBulkTier(idx)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Customer Live Preview Table (Requirement 17, 79) */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
              Storefront Customer Bulk Pricing Preview:
            </span>
            <div className="divide-y divide-purple-100 text-xs">
              <div className="py-1.5 flex justify-between font-semibold text-slate-700">
                <span>Quantity 1 – {bulkTiers[0]?.minQuantity ? bulkTiers[0].minQuantity - 1 : 'any'} {unit.toLowerCase()}s:</span>
                <span className="font-mono font-bold text-slate-900">₹{price} / {unit.toLowerCase()}</span>
              </div>
              {bulkTiers.map((tier, i) => (
                <div key={i} className="py-1.5 flex justify-between font-semibold text-purple-900">
                  <span>
                    Quantity {tier.minQuantity}
                    {tier.maxQuantity ? `–${tier.maxQuantity}` : '+'} {unit.toLowerCase()}s:
                  </span>
                  <span className="font-mono font-bold text-[#6721F2]">
                    ₹{tier.unitPrice} / {unit.toLowerCase()} (Save ₹{Math.max(0, parseFloat(price) - parseFloat(tier.unitPrice))})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Real Product Media & Direct Upload */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Upload size={16} className="text-[#844AFB]" /> 3. Real Product Media &amp; Photos
            </h2>
            <p className="text-[11px] text-slate-500">
              Direct secure server upload. 1 to 5 images. First image serves as primary catalog thumbnail.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {imageUrls.length} / 5 Media Items
          </span>
        </div>

        {/* Direct File Uploader Box */}
        <div className="p-5 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30 flex flex-col items-center justify-center text-center space-y-3">
          <Upload size={28} className="text-purple-600" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-900">Upload Real Product Images Directly</p>
            <p className="text-[11px] text-slate-500">Supports PNG, JPEG, and WebP (Max 5MB per file)</p>
          </div>
          <label className="cursor-pointer">
            <span className="px-4 py-2 rounded-xl bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs shadow-xs inline-block transition-colors">
              {uploadingImage ? 'Uploading to Server...' : 'Select Image Files from Device'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              multiple
              disabled={uploadingImage || imageUrls.length >= 5}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Manual URL input fallback */}
        <div className="flex gap-2">
          <Input
            value={manualImageUrl}
            onChange={(e) => setManualImageUrl(e.target.value)}
            placeholder="Or enter image URL: /products/valve.png or https://..."
            className="h-9 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddManualImage}
            className="h-9 text-xs font-bold"
          >
            Add URL
          </Button>
        </div>

        {/* Uploaded Images Grid */}
        {imageUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {imageUrls.map((url, idx) => {
              const isPrimary = idx === primaryImageIdx;
              return (
                <div
                  key={idx}
                  className={`relative aspect-square rounded-xl bg-slate-50 border-2 overflow-hidden group ${
                    isPrimary ? 'border-[#844AFB] ring-2 ring-purple-200' : 'border-slate-200'
                  }`}
                >
                  <Image src={url} alt={`Product ${idx + 1}`} fill className="object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button
                      type="button"
                      onClick={() => setPrimaryImageIdx(idx)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${
                        isPrimary ? 'bg-purple-600 text-white' : 'bg-white text-slate-900 hover:bg-purple-100'
                      }`}
                    >
                      {isPrimary ? '★ Primary' : 'Set Primary'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="self-end p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-xs"
                      title="Remove image"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {isPrimary && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#844AFB] text-white">
                      PRIMARY
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Video Embed URL */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Video size={14} className="text-purple-600" /> Demonstration Video Embed (YouTube / Vimeo)
          </label>
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* SECTION 4: Inventory & Stock */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Package size={16} className="text-[#844AFB]" /> 4. Stock &amp; Inventory Management
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Available Stock Quantity *</label>
            <Input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              className="h-10 text-xs font-bold font-mono"
            />
            <p className="text-[11px] text-slate-500">Real physical inventory ready in warehouse</p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Low Stock Alert Threshold</label>
            <Input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="h-10 text-xs font-mono"
            />
            <p className="text-[11px] text-slate-500">Warn admin when stock falls below this quantity</p>
          </div>
        </div>
      </div>

      {/* SECTION 5: Brand & Manufacturer */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Factory size={16} className="text-[#844AFB]" /> 5. Manufacturer &amp; Brand System
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Manufacturer Name</label>
            <Input
              value={manufacturerName}
              onChange={(e) => setManufacturerName(e.target.value)}
              placeholder="e.g. CNKALUN or Tamizh Tech Robotics Company"
              className="h-10 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Brand Display Name</label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. CNKALUN or Tamizh Tech"
              className="h-10 text-xs font-semibold"
            />
          </div>

          <div className="sm:col-span-2 pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="showMfg"
              checked={showManufacturerPublicly}
              onChange={(e) => setShowManufacturerPublicly(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <label htmlFor="showMfg" className="text-xs font-bold text-slate-800 cursor-pointer">
              Show Manufacturer entity publicly on storefront product page (CNKALUN)
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 6: Supplier & Internal Procurement (STRICTLY PRIVATE ADMIN DATA) */}
      <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
          <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <Lock size={16} className="text-amber-700" /> 6. Supplier &amp; Internal Procurement (STRICTLY PRIVATE)
          </h2>
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-[10px]">
            ADMIN ONLY • NEVER PUBLIC
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Supplier Name / Vendor</label>
            <Input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Factory Direct / Domestic Distributor"
              className="h-10 text-xs bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Purchase / Supplier Cost (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              <Input
                type="number"
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Internal cost"
                className="pl-7 h-10 text-xs bg-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Landed Cost / Shipping &amp; Duty (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              <Input
                type="number"
                step="any"
                value={landedCost}
                onChange={(e) => setLandedCost(e.target.value)}
                placeholder="Landed cost"
                className="pl-7 h-10 text-xs bg-white font-mono"
              />
            </div>
          </div>

          {estimatedMargin !== null && (
            <div className="sm:col-span-3 p-3 rounded-xl bg-white border border-amber-200 text-xs flex items-center justify-between">
              <span className="font-bold text-amber-900">Estimated Internal Gross Margin:</span>
              <span className="font-mono font-extrabold text-emerald-700 text-sm">
                {estimatedMargin}% (₹{(numericPrice - numericCost).toFixed(2)} profit per piece)
              </span>
            </div>
          )}

          <div className="sm:col-span-3 space-y-1">
            <label className="font-bold text-slate-700">Internal Procurement Notes</label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Supplier contact, order batch number, warranty terms, internal procurement notes..."
              className="w-full p-2.5 rounded-md border border-slate-200 text-xs bg-white focus:border-purple-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 7: Hardware & Technical Specifications */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Cpu size={16} className="text-[#844AFB]" /> 7. Technical Specifications
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSpecRow}
            className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50 gap-1 h-8 font-bold"
          >
            <Plus size={14} /> Add Spec Row
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Model Number</label>
            <Input
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              placeholder="KL-F2"
              className="h-9 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Operating Voltage</label>
            <Input
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
              placeholder="220–240V AC or 12V DC"
              className="h-9 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Material Composition</label>
            <Input
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Forged Brass, Aluminum, Acrylic"
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Custom Spec Key/Value Rows */}
        <div className="space-y-2 pt-2">
          {specs.map((row, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                placeholder="Attribute / Spec Name (e.g. Fluid Medium)"
                value={row.key}
                onChange={(e) => {
                  const updated = [...specs];
                  updated[idx].key = e.target.value;
                  setSpecs(updated);
                }}
                className="h-8 text-xs font-semibold"
              />
              <Input
                placeholder="Value (e.g. Water, Gas, Air)"
                value={row.value}
                onChange={(e) => {
                  const updated = [...specs];
                  updated[idx].value = e.target.value;
                  setSpecs(updated);
                }}
                className="h-8 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => handleRemoveSpecRow(idx)}
                className="text-slate-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 8: Description & Applications */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText size={16} className="text-[#844AFB]" /> 8. Descriptions &amp; Verified Applications
        </h2>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Short Description (Catalog Summary) *</label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Concise 1-2 sentence engineering summary for search cards and previews"
              required
              className="w-full p-2.5 rounded-md border border-slate-200 text-xs bg-white focus:border-purple-600 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Detailed Technical Description</label>
            <textarea
              rows={5}
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Full product overview, operational parameters, and mechanical details..."
              className="w-full p-2.5 rounded-md border border-slate-200 text-xs bg-white focus:border-purple-600 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Applications Tag Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700">Verified Real Applications / Use Cases</label>
            <div className="flex gap-2">
              <Input
                value={newApplicationInput}
                onChange={(e) => setNewApplicationInput(e.target.value)}
                placeholder="e.g. Coffee machine fluid control"
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddApplication}
                className="h-8 text-xs font-bold"
              >
                Add Application
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {applications.map((app, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium"
                >
                  <span>{app}</span>
                  <button type="button" onClick={() => handleRemoveApplication(idx)} className="hover:text-red-600">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 9: Tax, Weight & Compliance */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield size={16} className="text-[#844AFB]" /> 9. Tax, Weight &amp; Compliance
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">HSN Code *</label>
            <Input
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              placeholder="84818090"
              required
              className="h-9 text-xs font-mono font-bold"
            />
            {hsnAiSuggestion && (
              <div className="p-2 mt-1 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-900 leading-tight">
                <span className="font-bold text-amber-800">⚠️ AI Suggestion ({hsnAiSuggestion.confidence.toUpperCase()} confidence):</span>{' '}
                {hsnAiSuggestion.reasoning}.{' '}
                <span className="font-semibold underline">Verify before publishing.</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">GST Rate (%)</label>
            <select
              value={gstPercent}
              onChange={(e) => setGstPercent(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-slate-200 text-xs bg-white focus:border-purple-600 focus:outline-none"
            >
              <option value="18">18% (Standard Hardware)</option>
              <option value="12">12%</option>
              <option value="5">5%</option>
              <option value="0">0% (Exempt)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Country of Origin *</label>
            <Input
              value={countryOfOrigin}
              onChange={(e) => setCountryOfOrigin(e.target.value)}
              placeholder="India, China, etc."
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Net Weight (grams) *</label>
            <Input
              type="number"
              min="1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* SECTION 10: SEO Metadata */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Tag size={16} className="text-[#844AFB]" /> 10. Search Engine Optimization (SEO)
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAi}
            disabled={aiGenerating || !name.trim()}
            className="text-xs font-bold text-[#844AFB] border-purple-200 bg-purple-50/50 hover:bg-[#844AFB] hover:text-white transition-all"
          >
            <Sparkles size={13} className={aiGenerating ? 'animate-spin' : ''} />
            {aiGenerating ? 'Generating...' : '✨ Generate SEO with AI'}
          </Button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">SEO Meta Title</label>
              <span className={`text-[10px] ${seoTitle.length > 60 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                {seoTitle.length}/60 chars
              </span>
            </div>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="e.g. CNKALUN KL-F2 2-Way Brass Solenoid Valve | TTRC Store"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">SEO Meta Description</label>
              <span className={`text-[10px] ${seoDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                {seoDescription.length}/160 chars
              </span>
            </div>
            <textarea
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="e.g. Industrial-grade 2-way normally closed brass solenoid valve for fluid automation. Fast India-wide delivery and GST invoices."
              className="w-full p-2.5 rounded-md border border-slate-200 text-xs bg-white focus:border-purple-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Floating Save Button */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-lg">
        <Link
          href="/admin/products"
          className="text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          Cancel and return
        </Link>
        <Button
          type="submit"
          disabled={saving}
          className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-extrabold text-sm h-11 px-8 gap-2 rounded-xl shadow-md shadow-purple-900/20"
        >
          <Save size={18} />
          {saving ? 'Saving to Database...' : isEditMode ? 'Update Product' : 'Publish Product to Storefront'}
        </Button>
      </div>
    </form>
  );
}
