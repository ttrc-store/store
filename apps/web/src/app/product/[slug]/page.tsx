import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RefreshCw,
  Cpu,
  Layers,
  Video,
  Award,
  Factory,
  Globe,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  getProductBySlug,
  getCompatibleProducts,
  getStoreProducts,
  toStoreProductCardProps,
} from '@/lib/mongodb/catalog';
import { PriceTag } from '@/components/store/price-tag';
import { RatingStars } from '@/components/store/rating-stars';
import { ProductCard } from '@/components/store/product-card';
import { PincodeChecker } from '@/components/store/pincode-checker';
import { ProductOrderBox } from '@/components/store/product-order-box';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found | TTRC Store' };
  }

  return {
    title: `${product.name} | TTRC Store`,
    description: product.shortDescription,
    alternates: {
      canonical: `https://ttrc.store/product/${slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [
        {
          url: product.imageUrls?.[0] || '/brand/ttrc-logo.png',
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Find real compatible spare parts & kits from MongoDB
  const { compatibleSpares, compatibleKits } = await getCompatibleProducts(product.id, product.type);

  // Fetch real related products from same category in MongoDB
  const { products: relatedProducts } = await getStoreProducts({
    categorySlug: product.categoryId,
    limit: 4,
  });
  const filteredRelated = relatedProducts.filter((p) => p.id !== product.id).slice(0, 4);

  // Bundle calculation (Kit + top 2 spare parts)
  const bundleSpares = compatibleSpares.slice(0, 2);
  const bundleTotalPricePaise =
    product.pricePaise + bundleSpares.reduce((acc, s) => acc + s.pricePaise, 0);

  const breadcrumbItems = [
    { name: 'Home', url: 'https://ttrc.store' },
    { name: 'Catalog', url: 'https://ttrc.store/category/gamified-robots' },
    { name: product.name, url: `https://ttrc.store/product/${slug}` },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 pt-6">
      <ProductJsonLd
        name={product.name}
        description={product.longDescription || product.shortDescription}
        images={product.imageUrls}
        sku={product.sku}
        brand={product.brand || 'Tamizh Tech'}
        pricePaise={product.pricePaise}
        inStock={product.stockQty > 0}
        rating={product.rating}
        reviewCount={product.reviewCount}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/category/${product.categoryId || 'gamified-robots'}`}>
                {product.categoryId ? product.categoryId.replace(/-/g, ' ') : 'Catalog'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-xs">{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Top Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16 items-start">
          {/* Gallery Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square rounded-2xl bg-[#FDFDFD] border border-slate-200 overflow-hidden flex items-center justify-center group shadow-xs">
              <Image
                src={product.imageUrls?.[0] || '/brand/ttrc-logo.png'}
                alt={product.name}
                fill
                priority
                className="object-contain p-8 group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-4 left-4">
                <Badge variant={product.type === 'kit' ? 'purple' : 'default'}>
                  {product.type === 'kit' ? 'Complete Kit' : product.type === 'spare_part' ? 'Spare Part' : 'Standard Component'}
                </Badge>
              </span>
            </div>

            {/* Thumbnail Row */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.imageUrls.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-xl bg-purple-50/40 border border-purple-100 overflow-hidden cursor-pointer hover:border-[#844AFB] transition-colors flex-shrink-0"
                  >
                    <Image src={img} alt="" fill className="object-contain p-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Ordering Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              {/* Manufacturer & Brand Ribbon (Requirement 15: Manufacturer Entity) */}
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EEE8FA] text-[#6721F2] text-xs font-bold border border-[#AF87F8]/40">
                  <Factory size={13} />
                  <span>Manufacturer: {product.manufacturer?.name || product.brand || 'Tamizh Tech / TTRC'}</span>
                  <CheckCircle2 size={12} className="text-[#844AFB]" />
                </div>

                {product.brand && product.brand !== product.manufacturer?.name && (
                  <span className="text-xs text-slate-500 font-medium">
                    Brand: <strong className="text-slate-800">{product.brand}</strong>
                  </span>
                )}

                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  SKU: {product.sku}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#050507] tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating Summary */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <RatingStars rating={product.rating} size="sm" />
                  <span className="text-xs font-bold text-slate-800">
                    {product.rating > 0 ? product.rating.toFixed(1) : 'New'}
                  </span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">
                  {product.reviewCount > 0 ? `${product.reviewCount} verified reviews` : 'Zero buyer reviews yet'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Globe size={12} /> Origin: {product.countryOfOrigin}
                </span>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Interactive Order Box (Bulk Pricing, Dynamic Tiers, Add to Cart) */}
            <ProductOrderBox
              id={product.id}
              slug={product.slug}
              name={product.name}
              sku={product.sku}
              basePricePaise={product.pricePaise}
              mrpPaise={product.mrpPaise}
              stockQty={product.stockQty}
              gstPercent={product.gstPercent}
              imageUrl={product.imageUrls[0]}
              productType={product.type}
              bulkPriceTiers={product.bulkPriceTiers}
            />

            {/* Pincode Serviceability Check */}
            <div className="pt-2">
              <PincodeChecker />
            </div>

            {/* Guarantee / Value Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck size={20} className="text-[#844AFB]" />
                <span className="font-semibold text-slate-800">100% Genuine</span>
                <span className="text-[10px] text-slate-400">Direct from Maker</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck size={20} className="text-[#844AFB]" />
                <span className="font-semibold text-slate-800">Pan-India Courier</span>
                <span className="text-[10px] text-slate-400">Insured Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RefreshCw size={20} className="text-[#844AFB]" />
                <span className="font-semibold text-slate-800">7-Day Replacement</span>
                <span className="text-[10px] text-slate-400">For transit defects</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SPECIAL KIT SECTION: Spare Parts & Frequently Bought Together Bundle ─── */}
        {product.type === 'kit' && compatibleSpares.length > 0 && (
          <div className="space-y-10 mb-16">
            {/* Frequently Bought Together Bundle Box */}
            {bundleSpares.length > 0 && (
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-50/50 via-white to-purple-50/50 border border-purple-200 shadow-xs space-y-6">
                <div className="flex items-center gap-2">
                  <Badge variant="purple">Frequently Bought Together Bundle</Badge>
                  <span className="text-xs text-slate-500">• Save time &amp; guarantee 100% compatibility</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  {/* Bundle Product 1: Main Kit */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 flex-shrink-0">
                      <Image src={product.imageUrls?.[0] || '/brand/ttrc-logo.png'} alt="" fill className="object-contain p-2" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-2">{product.name}</p>
                      <PriceTag pricePaise={product.pricePaise} size="sm" />
                    </div>
                  </div>

                  {/* Bundle Spares */}
                  {bundleSpares.map((spare) => (
                    <div key={spare.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        +
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 flex-shrink-0">
                          <Image src={spare.imageUrls?.[0] || '/brand/ttrc-logo.png'} alt="" fill className="object-contain p-2" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-2">{spare.name}</p>
                          <PriceTag pricePaise={spare.pricePaise} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Bundle Total & Add Button */}
                  <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 space-y-2">
                    <p className="text-xs text-slate-500 font-semibold">Total Bundle Price:</p>
                    <PriceTag pricePaise={bundleTotalPricePaise} size="lg" />
                    <Button className="w-full bg-[#844AFB] hover:bg-[#6721F2] text-white font-bold text-xs h-10 shadow-md shadow-purple-900/20 rounded-xl">
                      Add All {1 + bundleSpares.length} Items to Cart
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Spare Parts Grid for this Kit */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="text-[#844AFB]" size={22} />
                    Compatible Spare Parts for this Kit
                  </h2>
                  <p className="text-xs text-slate-500">Guaranteed replacement parts tested for {product.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {compatibleSpares.map((spare) => (
                  <ProductCard key={spare.id} {...toStoreProductCardProps(spare)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── SPECIAL SPARE PART SECTION: Compatible Kits Back-Link ─── */}
        {product.type === 'spare_part' && compatibleKits.length > 0 && (
          <div className="space-y-6 mb-16">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="text-[#844AFB]" size={22} />
                  Compatible Kits
                </h2>
                <p className="text-xs text-slate-500">Kits that use or support this spare part</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {compatibleKits.map((kit) => (
                <ProductCard key={kit.id} {...toStoreProductCardProps(kit)} />
              ))}
            </div>
          </div>
        )}

        {/* Specifications & Tabbed Information (JetBrains Mono for Specs) */}
        <div className="mb-16">
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className="bg-purple-50/60 border border-purple-100 p-1 rounded-xl mb-6">
              <TabsTrigger value="specs" className="text-xs font-bold px-6">
                Technical Specifications
              </TabsTrigger>
              <TabsTrigger value="description" className="text-xs font-bold px-6">
                Description &amp; Applications
              </TabsTrigger>
              <TabsTrigger value="manufacturer" className="text-xs font-bold px-6">
                Manufacturer &amp; Provenance
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs font-bold px-6">
                Reviews ({product.reviewCount})
              </TabsTrigger>
            </TabsList>

            {/* Technical Specifications Tab */}
            <TabsContent
              value="specs"
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-4"
            >
              <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="text-[#844AFB]" size={20} /> Engineering &amp; Hardware Specifications
              </h3>
              <div className="max-w-3xl divide-y divide-slate-100 text-xs sm:text-sm">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-500">SKU / Part Code</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {product.sku}
                  </span>
                </div>
                {product.modelNumber && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Model Number</span>
                    <span className="font-mono text-slate-900">{product.modelNumber}</span>
                  </div>
                )}
                {product.voltage && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Operating Voltage</span>
                    <span className="font-mono text-slate-900">{product.voltage}</span>
                  </div>
                )}
                {product.current && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Operating Current</span>
                    <span className="font-mono text-slate-900">{product.current}</span>
                  </div>
                )}
                {product.power && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Power Rating</span>
                    <span className="font-mono text-slate-900">{product.power}</span>
                  </div>
                )}
                {product.material && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Material Composition</span>
                    <span className="font-mono text-slate-900">{product.material}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Dimensions</span>
                    <span className="font-mono text-slate-900">{product.dimensions}</span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Net Weight</span>
                  <span className="font-mono text-slate-900">{product.weightGrams} grams</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Harmonized Tariff (HSN)</span>
                  <span className="font-mono text-slate-900">{product.hsnCode}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Applicable GST Rate</span>
                  <span className="font-mono text-slate-900">{product.gstPercent}% (Inclusive)</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Country of Origin</span>
                  <span className="font-mono text-slate-900">{product.countryOfOrigin}</span>
                </div>

                {/* Dynamic Specs Array from DB */}
                {product.technicalSpecs?.map((spec, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">{spec.key}</span>
                    <span className="font-mono text-slate-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Description Tab */}
            <TabsContent
              value="description"
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-4 text-sm text-slate-700 leading-relaxed"
            >
              <h3 className="font-heading text-lg font-bold text-slate-900">Product Overview</h3>
              <p className="whitespace-pre-line">{product.longDescription || product.shortDescription}</p>
            </TabsContent>

            {/* Manufacturer Tab (Requirement 15) */}
            <TabsContent
              value="manufacturer"
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-4 text-sm text-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-bold">
                  <Factory size={24} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900">
                    {product.manufacturer?.name || product.brand || 'Tamizh Tech / TTRC'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Origin: {product.manufacturer?.country || product.countryOfOrigin || 'India'} • Verified Maker
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Tamizh Tech engineers robotics kits, precision drive systems, and modular STEM components
                designed specifically for national competitions and STEM lab environments.
              </p>
            </TabsContent>

            {/* Reviews Tab (Requirement 29: No fake reviews, only verified buyers) */}
            <TabsContent
              value="reviews"
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900">Customer Reviews</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <RatingStars rating={product.rating} size="default" />
                    <span className="text-xs font-bold text-slate-900">
                      {product.rating > 0 ? `${product.rating.toFixed(1)} out of 5` : 'No ratings yet'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Zero-Fake Reviews Empty State */}
              <div className="p-8 text-center text-xs text-slate-500 space-y-2 bg-slate-50/60 rounded-xl border border-slate-200">
                <Award size={36} className="mx-auto text-purple-400" />
                <p className="font-bold text-slate-700 text-sm">No reviews yet for this product</p>
                <p className="max-w-md mx-auto text-slate-500">
                  Only customers who have purchased this component through TTRC Store can submit verified buyer reviews.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products ("You May Also Like") from MongoDB */}
        {filteredRelated.length > 0 && (
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-bold text-slate-900 uppercase tracking-wider border-l-4 border-[#844AFB] pl-3">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredRelated.map((p) => (
                <ProductCard key={p.id} {...toStoreProductCardProps(p)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
