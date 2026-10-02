'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';
import { updateProductAction, deleteProductAction, getAdminProductByIdAction } from '@/actions/admin';
import { ProductType } from '@ttrc/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [productType, setProductType] = React.useState<ProductType>('general');
  const [price, setPrice] = React.useState('999');
  const [mrp, setMrp] = React.useState('');
  const [stock, setStock] = React.useState('10');
  const [gstPercent, setGstPercent] = React.useState('18');
  const [hsnCode, setHsnCode] = React.useState('84715000');
  const [brand, setBrand] = React.useState('Tamizh Tech');
  const [imageUrl, setImageUrl] = React.useState('/brand/ttrc-logo.png');

  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        const res = await getAdminProductByIdAction(productId);
        if (res.product && isMounted) {
          const p = res.product;
          setName(p.name);
          setSlug(p.slug);
          setSku(p.sku);
          setProductType((p.productType as ProductType) || 'general');
          setPrice((p.pricePaise / 100).toString());
          setMrp(p.mrpPaise ? (p.mrpPaise / 100).toString() : '');
          setStock(p.stockQty.toString());
          setGstPercent(p.gstPercent.toString());
          setHsnCode(p.hsnCode || '84715000');
          setBrand(p.brand || 'Tamizh Tech');
          setImageUrl(p.imageUrls?.[0] || '/brand/ttrc-logo.png');
        } else if (res.error && isMounted) {
          setErrorMsg(res.error);
        }
      } catch (err: any) {
        if (isMounted) setErrorMsg('Failed to load product details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const pricePaise = Math.round(parseFloat(price || '0') * 100);
    const mrpPaise = mrp ? Math.round(parseFloat(mrp) * 100) : pricePaise;

    const res = await updateProductAction(productId, {
      id: productId,
      name,
      slug,
      sku,
      productType,
      pricePaise,
      mrpPaise,
      gstPercent: parseInt(gstPercent, 10) || 18,
      hsnCode,
      stockQty: parseInt(stock, 10) || 0,
      weightGrams: 450,
      brand,
      imageUrls: imageUrl ? [imageUrl] : ['/brand/ttrc-logo.png'],
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this product from catalog?')) return;
    setDeleting(true);
    await deleteProductAction(productId);
    setDeleting(false);
    router.push('/admin/products');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-slate-900">Edit Product</h1>
            <p className="text-xs text-slate-500 font-mono">ID: {productId}</p>
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
          <span>Product updated successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            Product Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Product Title</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 h-10 text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">URL Slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 h-10 font-mono text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">SKU Code</label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
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
                <option value="kit">Robot Kit (Has Spare Parts)</option>
                <option value="spare_part">Spare Part (Links to Kit)</option>
                <option value="general">Standard Component / Accessory</option>
              </select>
            </div>

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
              <Input
                type="number"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 h-10 font-mono text-slate-900 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-xl h-11 px-4 flex items-center gap-2"
          >
            <Trash2 size={16} /> Delete Product
          </Button>

          <div className="flex gap-3">
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
              {saving ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
