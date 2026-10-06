'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GitCompare, ShoppingBag, Trash2, ArrowLeft, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useCompareStore, CompareProductItem } from '@/store/use-compare';
import { useCartStore } from '@/store/use-cart';
import { PriceTag } from '@/components/store/price-tag';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function ProductComparePage() {
  const { items, removeFromCompare, clearCompare } = useCompareStore();
  const { addItem, openDrawer } = useCartStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FDFDFD]">
        <div className="w-8 h-8 rounded-full border-2 border-[#844AFB] border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleAddToCart = (product: CompareProductItem) => {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      pricePaise: product.pricePaise,
      mrpPaise: product.mrpPaise,
      imageUrl: product.imageUrl,
      quantity: 1,
      gstPercent: 18,
      stockQty: product.stockQty,
      productType: product.productType || 'standard',
      unit: product.unit || 'Piece',
      bulkPriceTiers: product.bulkPriceTiers,
    });
    openDrawer();
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#050507] pb-24 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList className="text-xs text-slate-500">
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="hover:text-[#844AFB]">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-slate-900">
                Product Comparison
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-[#EEE8FA] text-[#6721F2]">
                <GitCompare size={18} />
              </span>
              <span className="text-xs font-mono font-bold text-[#6721F2] uppercase tracking-wider">
                Technical Comparison
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#050507] tracking-tight">
              PRODUCT COMPARISON
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Compare specifications, technical dimensions, electrical parameters, and pricing side-by-side.
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">
                {items.length} of 4 products selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompare}
                className="text-xs font-bold border-slate-200 hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
                <Trash2 size={14} className="mr-1.5" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#EEE8FA] text-[#844AFB] flex items-center justify-center mx-auto mb-2">
              <GitCompare size={28} />
            </div>
            <h2 className="font-heading text-xl font-bold text-[#050507]">
              No Products to Compare
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore our catalog of robotics kits, motors, sensors, and power systems. Click the comparison icon on any product card or detail page to compare up to 4 items simultaneously.
            </p>
            <div className="pt-2">
              <Link href="/category/gamified-robots">
                <Button className="bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-purple-900/20">
                  Browse Robotics Kits <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Technical Comparison Matrix Table */
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="p-4 w-48 text-xs font-bold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Product Overview
                  </th>
                  {items.map((item) => (
                    <th key={item.id} className="p-4 w-64 align-top border-r border-slate-100 last:border-r-0">
                      <div className="space-y-3">
                        {/* Remove Action */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeFromCompare(item.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                            title="Remove product"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Image */}
                        <div className="relative w-full aspect-square rounded-xl bg-[#EEE8FA]/40 overflow-hidden border border-slate-100 p-2">
                          <Image
                            src={item.imageUrl || '/brand/ttrc-logo.png'}
                            alt={item.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>

                        {/* Details */}
                        <div>
                          {item.brand && (
                            <span className="text-[10px] font-bold text-[#844AFB] uppercase tracking-wider block mb-0.5">
                              {item.brand}
                            </span>
                          )}
                          <Link
                            href={`/product/${item.slug}`}
                            className="font-heading font-bold text-sm text-[#050507] hover:text-[#844AFB] line-clamp-2 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="text-[11px] font-mono text-slate-400 mt-1">
                            SKU: {item.sku}
                          </p>
                        </div>

                        {/* Price */}
                        <div>
                          <PriceTag pricePaise={item.pricePaise} mrpPaise={item.mrpPaise} size="default" />
                        </div>

                        {/* Add to Cart CTA */}
                        <Button
                          onClick={() => handleAddToCart(item)}
                          disabled={item.stockQty <= 0}
                          className="w-full bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs h-9 rounded-xl shadow-xs"
                        >
                          <ShoppingBag size={14} className="mr-1.5" />
                          {item.stockQty > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {/* Availability Row */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/50 sticky left-0 border-r border-slate-200">
                    Stock Availability
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 border-r border-slate-100 last:border-r-0">
                      {item.stockQty > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                          <CheckCircle2 size={14} />
                          <span>In Stock ({item.stockQty} units)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-600 font-bold">
                          <XCircle size={14} />
                          <span>Out of Stock</span>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Product Type Row */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/50 sticky left-0 border-r border-slate-200">
                    Category Classification
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 border-r border-slate-100 last:border-r-0">
                      <Badge className="bg-[#EEE8FA] text-[#6721F2] border-[#AF87F8]/40 font-bold text-[10px] uppercase">
                        {item.productType === 'kit' ? 'Complete Robot Kit' : item.productType === 'spare_part' ? 'Spare Part' : 'Standard Component'}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Voltage Row (if any product has it) */}
                {items.some((i) => i.voltage) && (
                  <tr>
                    <td className="p-4 font-bold text-slate-700 bg-slate-50/50 sticky left-0 border-r border-slate-200">
                      Operating Voltage
                    </td>
                    {items.map((item) => (
                      <td key={item.id} className="p-4 border-r border-slate-100 last:border-r-0 font-medium text-slate-900">
                        {item.voltage || '—'}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Current Row (if any product has it) */}
                {items.some((i) => i.current) && (
                  <tr>
                    <td className="p-4 font-bold text-slate-700 bg-slate-50/50 sticky left-0 border-r border-slate-200">
                      Operating Current
                    </td>
                    {items.map((item) => (
                      <td key={item.id} className="p-4 border-r border-slate-100 last:border-r-0 font-medium text-slate-900">
                        {item.current || '—'}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Power Row (if any product has it) */}
                {items.some((i) => i.power) && (
                  <tr>
                    <td className="p-4 font-bold text-slate-700 bg-slate-50/50 sticky left-0 border-r border-slate-200">
                      Rated Power
                    </td>
                    {items.map((item) => (
                      <td key={item.id} className="p-4 border-r border-slate-100 last:border-r-0 font-medium text-slate-900">
                        {item.power || '—'}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Dimensions Row (if any product has it) */}
                {items.some((i) => i.dimensions) && (
                  <tr>
                    <td className="p-4 font-bold text-slate-700 bg-slate-50/50 sticky left-0 border-r border-slate-200">
                      Dimensions / Form Factor
                    </td>
                    {items.map((item) => (
                      <td key={item.id} className="p-4 border-r border-slate-100 last:border-r-0 font-medium text-slate-900">
                        {item.dimensions || '—'}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Material Row (if any product has it) */}
                {items.some((i) => i.material) && (
                  <tr>
                    <td className="p-4 font-bold text-slate-700 bg-slate-50/50 sticky left-0 border-r border-slate-200">
                      Material Specification
                    </td>
                    {items.map((item) => (
                      <td key={item.id} className="p-4 border-r border-slate-100 last:border-r-0 font-medium text-slate-900">
                        {item.material || '—'}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Operating Temperature (if any product has it) */}
                {items.some((i) => i.operatingTemperature) && (
                  <tr>
                    <td className="p-4 font-bold text-slate-700 bg-slate-50/50 sticky left-0 border-r border-slate-200">
                      Operating Temperature
                    </td>
                    {items.map((item) => (
                      <td key={item.id} className="p-4 border-r border-slate-100 last:border-r-0 font-medium text-slate-900">
                        {item.operatingTemperature || '—'}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Bulk Pricing Tiers Row */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/50 sticky left-0 border-r border-slate-200">
                    Bulk Institutional Pricing
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 border-r border-slate-100 last:border-r-0">
                      {item.bulkPriceTiers && item.bulkPriceTiers.length > 0 ? (
                        <div className="space-y-1">
                          {item.bulkPriceTiers.map((tier, idx) => (
                            <span
                              key={idx}
                              className="inline-block mr-1 text-[11px] font-mono bg-purple-50 text-[#844AFB] px-1.5 py-0.5 rounded border border-purple-200"
                            >
                              {tier.minQuantity}+ pcs: ₹{(tier.unitPricePaise / 100).toLocaleString('en-IN')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Standard retail pricing</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
