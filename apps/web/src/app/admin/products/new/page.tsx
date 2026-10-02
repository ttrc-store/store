'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Plus, Trash2, Video, Image as ImageIcon } from 'lucide-react';
import { ProductType } from '@ttrc/shared';
import { createProductAction } from '@/actions/admin';
import { sanitizeVideoEmbedUrl } from '@/lib/video-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [productType, setProductType] = React.useState<ProductType>('general');
  const [price, setPrice] = React.useState('1499');
  const [mrp, setMrp] = React.useState('1999');
  const [stock, setStock] = React.useState('25');
  const [gstPercent, setGstPercent] = React.useState('18');
  const [hsnCode, setHsnCode] = React.useState('84715000');
  const [weight, setWeight] = React.useState('450');
  const [brand, setBrand] = React.useState('Tamizh Tech');
  const [imageUrls, setImageUrls] = React.useState<string[]>(['/brand/ttrc-logo.png']);
  const [newImageInput, setNewImageInput] = React.useState('');
  const [videoUrl, setVideoUrl] = React.useState('');
  const [description, setDescription] = React.useState('');

  const [specs, setSpecs] = React.useState<Array<{ key: string; value: string }>>([
    { key: 'Operating Voltage', value: '6V DC' },
    { key: 'Chassis Material', value: '3mm Laser-Cut Acrylic' },
  ]);

  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Auto-calculated discount % from MRP vs Selling Price
  const numericPrice = parseFloat(price || '0');
  const numericMrp = parseFloat(mrp || '0');
  const calculatedDiscountPct =
    numericMrp > numericPrice && numericMrp > 0
      ? Math.round(((numericMrp - numericPrice) / numericMrp) * 100)
      : 0;

  // Media items count calculation (images + video embed)
  const totalMediaItems = imageUrls.length + (videoUrl.trim() ? 1 : 0);

  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSlug(generatedSlug);
    if (!sku) {
      setSku(`TTRC-${generatedSlug.slice(0, 10).toUpperCase() || 'PRD'}`);
    }
  };

  const handleAddImage = () => {
    if (!newImageInput.trim()) return;
    if (totalMediaItems >= 5) {
      setErrorMsg('Maximum 5 media items allowed total.');
      return;
    }
    setImageUrls([...imageUrls, newImageInput.trim()]);
    setNewImageInput('');
    setErrorMsg(null);
  };

  const handleRemoveImage = (index: number) => {
    if (imageUrls.length <= 1) {
      setErrorMsg('At least 1 product image is required.');
      return;
    }
    setImageUrls(imageUrls.filter((_, i) => i !== index));
    setErrorMsg(null);
  };

  const handleAddSpecRow = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    if (imageUrls.length === 0) {
      setErrorMsg('At least 1 product image is required.');
      setSaving(false);
      return;
    }

    if (totalMediaItems > 5) {
      setErrorMsg('Maximum 5 total media items allowed (images + video embed combined).');
      setSaving(false);
      return;
    }

    if (videoUrl.trim() && !sanitizeVideoEmbedUrl(videoUrl)) {
      setErrorMsg('Video URL must be a valid YouTube or Vimeo link.');
      setSaving(false);
      return;
    }

    const pricePaise = Math.round(numericPrice * 100);
    const mrpPaise = numericMrp ? Math.round(numericMrp * 100) : pricePaise;

    const res = await createProductAction({
      name,
      slug,
      sku,
      productType,
      pricePaise,
      mrpPaise,
      gstPercent: parseInt(gstPercent, 10) || 18,
      hsnCode,
      stockQty: parseInt(stock, 10) || 0,
      weightGrams: parseInt(weight, 10) || 450,
      brand,
      shortDescription: description,
      longDescription: description,
      imageUrls,
      videoUrl: videoUrl.trim() || undefined,
    });

    setSaving(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/products');
      }, 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-slate-900">Add New Product</h1>
            <p className="text-xs text-slate-500">Upload a product manually into the TTRC store catalog.</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-600 font-medium">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-700 font-medium">
          <CheckCircle2 size={18} />
          <span>Product created successfully! Redirecting to catalog...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Details Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            General Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Product Title</label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Robo Race Chassis Kit - Pro Edition"
                required
                className="bg-slate-50 border-slate-200 h-10 text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">URL Slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="robo-race-chassis-kit-pro"
                required
                className="bg-slate-50 border-slate-200 h-10 font-mono text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">SKU Code</label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="TTRC-KIT-001"
                required
                className="bg-slate-50 border-slate-200 h-10 font-mono text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Product Type</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-purple-600"
              >
                <option value="kit">Robot Kit (Has Compatible Spare Parts)</option>
                <option value="spare_part">Spare Part (Links to Kit)</option>
                <option value="general">Standard Component / Accessory</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Brand Name</label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Tamizh Tech / TTRC Spares"
                className="bg-slate-50 border-slate-200 h-10 text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Product Description (Rich Text / Details)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe product specifications, motor torque, voltage ratings, package contents..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Media Upload & Video Embed Rules */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-heading font-bold text-base text-slate-900">
              Product Media (Images &amp; Video Embed)
            </h2>
            <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full border ${
              totalMediaItems > 5 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              Media Limit: {totalMediaItems} / 5 items
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-purple-700" />
                Product Image URLs (Minimum 1, Max 5 Total)
              </label>

              <div className="space-y-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={url}
                      readOnly
                      className="bg-slate-100 border-slate-200 h-9 font-mono text-slate-700 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveImage(idx)}
                      className="h-9 px-3 text-red-600 border-slate-200 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>

              {totalMediaItems < 5 && (
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newImageInput}
                    onChange={(e) => setNewImageInput(e.target.value)}
                    placeholder="Enter additional image URL (e.g. /products/motor.png)"
                    className="bg-slate-50 border-slate-200 h-9 text-xs flex-1 text-slate-900 focus:border-purple-600 focus:ring-purple-600"
                  />
                  <Button
                    type="button"
                    onClick={handleAddImage}
                    variant="outline"
                    className="h-9 px-4 text-xs font-bold border-slate-200 text-purple-700 hover:bg-purple-50"
                  >
                    Add Image
                  </Button>
                </div>
              )}
            </div>

            {/* Video Embed Field */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Video size={14} className="text-purple-700" />
                Product Video Embed URL (YouTube or Vimeo only)
              </label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=EXAMPLE_ID or https://vimeo.com/123456"
                className="bg-slate-50 border-slate-200 h-10 font-mono text-slate-900 text-xs focus:border-purple-600 focus:ring-purple-600"
              />
              <p className="text-[11px] text-slate-500">
                Videos are validated server-side to extract clean iframe embed links (no raw HTML or unvalidated iframe src values allowed).
              </p>
            </div>
          </div>
        </div>

        {/* Pricing, Auto-Calculated Discount & Inventory */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            Pricing, Tax &amp; Auto-Calculated Discount
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Selling Price (₹)</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 h-10 font-mono text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">MRP (Strikethrough ₹)</label>
              <Input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="bg-slate-50 border-slate-200 h-10 font-mono text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Auto-Calculated Discount Badge</label>
              <div className="h-10 px-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between font-mono font-bold text-slate-900">
                <span>{calculatedDiscountPct > 0 ? `${calculatedDiscountPct}% OFF` : 'No Discount'}</span>
                {calculatedDiscountPct > 0 && (
                  <span className="px-2 py-0.5 rounded bg-purple-700 text-white text-[10px] font-extrabold uppercase">
                    Badge Preview
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Stock Quantity</label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 h-10 font-mono text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">GST Percent (%)</label>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-purple-600"
              >
                <option value="18">18% (Standard Electronics)</option>
                <option value="12">12% (STEM &amp; Educational Toys)</option>
                <option value="5">5% (Robotics Hardware)</option>
                <option value="28">28% (High Tax Items)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">HSN Code</label>
              <Input
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="bg-slate-50 border-slate-200 h-10 font-mono text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Key-Value Specifications Editor */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-heading font-bold text-base text-slate-900">
              Product Specifications (Key-Value Pairs)
            </h2>
            <Button
              type="button"
              onClick={handleAddSpecRow}
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold border-slate-200 text-purple-700 hover:bg-purple-50 flex items-center gap-1"
            >
              <Plus size={14} /> Add Row
            </Button>
          </div>

          <div className="space-y-2">
            {specs.map((spec, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder="Key (e.g. Operating Voltage)"
                  value={spec.key}
                  onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                  className="bg-slate-50 border-slate-200 h-9 text-xs text-slate-900 flex-1 focus:border-purple-600 focus:ring-purple-600"
                />
                <Input
                  placeholder="Value (e.g. 6V DC)"
                  value={spec.value}
                  onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                  className="bg-slate-50 border-slate-200 h-9 text-xs text-slate-900 flex-1 focus:border-purple-600 focus:ring-purple-600"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveSpecRow(idx)}
                  className="h-9 px-3 text-red-600 border-slate-200 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl h-11 px-6">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl h-11 px-8 shadow-md shadow-purple-900/20 flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving Product...' : 'Upload Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
