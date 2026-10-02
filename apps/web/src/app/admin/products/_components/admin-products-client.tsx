'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, Edit, ExternalLink, Package, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/store/price-tag';

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
            className="pl-9 bg-slate-50 border-slate-200 h-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-purple-600"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select
            value={currentType}
            onChange={(e) => handleTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-purple-600"
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
              <tr className="border-b border-slate-200 bg-purple-50/50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3 rounded-l-lg">Product</th>
                <th className="p-3">Type</th>
                <th className="p-3">Price (Inc. GST)</th>
                <th className="p-3">Stock</th>
                <th className="p-3">GST Rate</th>
                <th className="p-3 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-purple-50/50 transition-colors">
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
                      <Link
                        href={`/product/${p.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-purple-700 transition-colors"
                        title="View on Storefront"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-purple-700 transition-colors"
                        title="Edit Product"
                      >
                        <Edit size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto text-purple-700">
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
                <Button className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl px-6 py-2.5 flex items-center gap-2 mx-auto shadow-sm shadow-purple-900/20">
                  <Plus size={16} /> Upload First Product
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
