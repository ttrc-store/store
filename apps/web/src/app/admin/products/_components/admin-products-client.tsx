'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, Edit, ExternalLink, Package, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/store/price-tag';
import { deleteProductAction, archiveProductAction } from '@/actions/admin';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  type: string;
  status: string;
  price_paise: number;
  mrp_paise: number | null;
  gst_percent: number;
  stock_qty: number;
  imageUrls: string[];
}

interface Props {
  products: Product[];
  total: number;
  currentSearch: string;
  currentType: string;
  typeLabel: Record<string, string>;
  typeColor: Record<string, string>;
}

export default function AdminProductsClient({
  products,
  total,
  currentSearch,
  currentType,
  typeLabel,
  typeColor,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localSearch, setLocalSearch] = React.useState(currentSearch);
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [canArchiveFallback, setCanArchiveFallback] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (localSearch) params.set('search', localSearch);
      else params.delete('search');
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);
    return () => clearTimeout(t);
  }, [localSearch]);

  const handleTypeFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'all') params.delete('type');
    else params.set('type', type);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    setCanArchiveFallback(false);

    try {
      const res = await deleteProductAction(deleteTarget.id);
      if (res.error) {
        setDeleteError(res.error);
        if ((res as any).canArchive) {
          setCanArchiveFallback(true);
        }
      } else {
        setDeleteTarget(null);
        router.refresh();
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await archiveProductAction(deleteTarget.id);
      if (res.error) {
        setDeleteError(res.error);
      } else {
        setDeleteTarget(null);
        router.refresh();
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to archive product.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by product name, SKU, or slug..."
            className="pl-9 bg-slate-50 border-slate-200 h-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-red-600"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select
            value={currentType}
            onChange={(e) => handleTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-600 focus:ring-red-600"
          >
            <option value="all">All Types</option>
            <option value="kit">Kits Only</option>
            <option value="spare_part">Spare Parts Only</option>
            <option value="general">Standard Products</option>
          </select>
        </div>
      </div>

      {/* Product Table / Empty State */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
        {products.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3 rounded-l-lg">Product</th>
                <th className="p-3">Type</th>
                <th className="p-3">Price (Excl. GST)</th>
                <th className="p-3">Stock</th>
                <th className="p-3">GST Rate</th>
                <th className="p-3 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                        <Image
                          src={p.imageUrls[0] || '/brand/ttrc-logo.png'}
                          alt={p.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">/product/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeColor[p.type] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {typeLabel[p.type] ?? p.type}
                    </span>
                  </td>
                  <td className="py-3">
                    <PriceTag pricePaise={p.price_paise} mrpPaise={p.mrp_paise ?? undefined} size="sm" />
                  </td>
                  <td className="py-3">
                    <span className={`font-mono font-bold ${p.stock_qty === 0 ? 'text-red-600' : p.stock_qty < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {p.stock_qty} units
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 font-mono">{p.gst_percent}% GST</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/product/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-[#E3132A] transition-colors"
                        title="View on Storefront (Opens in new tab)"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-[#E3132A] transition-colors"
                        title="Edit Product"
                      >
                        <Edit size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(p);
                          setDeleteError(null);
                          setCanArchiveFallback(false);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove / Delete Product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FDECEE] border border-red-200 flex items-center justify-center mx-auto text-[#E3132A]">
              <Package size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-slate-900">Store Catalog is Empty</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {currentSearch
                  ? `No products match "${currentSearch}". Try a different search term.`
                  : 'No products have been added yet. Upload your first product to get started.'}
              </p>
            </div>
            {!currentSearch && (
              <Link href="/admin/products/new" className="inline-block">
                <Button className="bg-[#E3132A] hover:bg-[#B80F21] text-white font-bold text-xs rounded-xl px-6 py-2.5 flex items-center gap-2 mx-auto shadow-sm shadow-red-900/10">
                  <Plus size={16} /> Upload First Product
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete / Remove Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E3132A] flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-slate-900">Remove Product</h3>
                <p className="text-xs text-slate-500">Confirm catalog deletion from database</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">{deleteTarget.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">SKU: {deleteTarget.sku || 'N/A'} • Slug: {deleteTarget.slug}</p>
            </div>

            {deleteError ? (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700">
                {deleteError}
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove this product? Once deleted, it will immediately disappear from the storefront, catalog, and admin inventory.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="text-xs font-bold rounded-xl h-9"
              >
                Cancel
              </Button>

              {canArchiveFallback ? (
                <Button
                  type="button"
                  disabled={deleting}
                  onClick={handleArchiveConfirm}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl h-9 gap-1.5"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                  Archive Product
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="bg-[#E3132A] hover:bg-[#B80F21] text-white text-xs font-bold rounded-xl h-9 gap-1.5 shadow-sm shadow-red-900/10"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleting ? 'Deleting...' : 'Confirm Remove'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
