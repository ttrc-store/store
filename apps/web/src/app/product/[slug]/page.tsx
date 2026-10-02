import * as React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ShoppingBag, Zap, ShieldCheck, Truck, RefreshCw, Cpu, Layers, Video } from 'lucide-react';
import { CATALOG_PRODUCTS, toProductCardProps } from '@/lib/catalog-data';
import { PriceTag } from '@/components/store/price-tag';
import { RatingStars } from '@/components/store/rating-stars';
import { QuantitySelector } from '@/components/store/quantity-selector';
import { ProductCard } from '@/components/store/product-card';
import { PincodeChecker } from '@/components/store/pincode-checker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = CATALOG_PRODUCTS.find((p) => p.slug === slug);

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
          url: product.imageUrls?.[0] || '/brand/og-image.jpg',
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
  const product = CATALOG_PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  // Find compatible spare parts if this is a kit
  const compatibleSpares = product.type === 'kit' && product.compatibleSpareIds
    ? CATALOG_PRODUCTS.filter((p) => product.compatibleSpareIds?.includes(p.id))
    : [];

  // Find compatible kits if this is a spare part
  const compatibleKits = product.type === 'spare_part' && product.compatibleKitIds
    ? CATALOG_PRODUCTS.filter((p) => product.compatibleKitIds?.includes(p.id))
    : [];

  // Related products strategy: Admin manual list override if specified, otherwise auto-suggested from same category
  const relatedProducts = product.relatedProductIds && product.relatedProductIds.length > 0
    ? CATALOG_PRODUCTS.filter((p) => product.relatedProductIds?.includes(p.id))
    : CATALOG_PRODUCTS.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);

  // Bundle calculation (Kit + top 2 spare parts)
  const bundleSpares = compatibleSpares.slice(0, 2);
  const bundleTotalPricePaise = product.pricePaise + bundleSpares.reduce((acc, s) => acc + s.pricePaise, 0);

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
        images={product.imageUrls || ['/products/robo-race-kit.png']}
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
              <BreadcrumbPage className="truncate max-w-xs">{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Top Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Gallery & Video Embed Column */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center group shadow-sm">
              <Image
                src={product.imageUrls?.[0] || '/products/robo-race-kit.png'}
                alt={product.name}
                fill
                priority
                className="object-contain p-8 group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-4 left-4">
                <Badge variant={product.type === 'kit' ? 'kit' : 'spare'}>
                  {product.type === 'kit' ? 'Complete Kit' : 'Spare Part'}
                </Badge>
              </span>
            </div>

            {/* Thumbnail Row */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.imageUrls.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-xl bg-purple-50/40 border border-purple-100 overflow-hidden cursor-pointer hover:border-purple-600 transition-colors flex-shrink-0"
                  >
                    <Image src={img} alt="" fill className="object-contain p-2" />
                  </div>
                ))}
              </div>
            )}

            {/* Sanitized Official Video Embed Player */}
            {product.videoEmbedUrl && (
              <div className="mt-4 p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <Video size={16} className="text-purple-700" />
                  <span>Product Demonstration Video</span>
                </div>
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-purple-100 shadow-sm">
                  <iframe
                    src={product.videoEmbedUrl}
                    title={`${product.name} Video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Details & Buy Column */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-1">
                {product.brand} • SKU: {product.sku}
              </p>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-3">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-3">
                <RatingStars rating={product.rating} size="lg" />
                <span className="text-xs text-slate-500 font-semibold">
                  {product.rating} ({product.reviewCount} customer reviews)
                </span>
              </div>
            </div>

            {/* Price Box with Strikethrough & Auto-Calculated Discount */}
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
              <PriceTag
                pricePaise={product.pricePaise}
                mrpPaise={product.mrpPaise}
                size="lg"
                showDiscountBadge
              />
              <p className="text-[11px] text-slate-500">
                Inclusive of all GST ({product.gstPercent}%). Free Shipping on orders over ₹999.
              </p>
            </div>

            {/* Short Description */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Stock Availability */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  product.stockQty > 0 ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                }`}
              />
              <span className="text-xs font-semibold text-slate-700">
                {product.stockQty > 0 ? `In Stock (${product.stockQty} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity & CTA Buttons */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <QuantitySelector quantity={1} onQuantityChange={() => {}} max={product.stockQty} />
                <Button
                  size="lg"
                  className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm h-12 shadow-md shadow-purple-900/20 rounded-xl"
                >
                  <ShoppingBag size={18} className="mr-2" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 border-purple-200 text-purple-950 font-bold text-sm hover:bg-purple-50 rounded-xl"
                >
                  <Zap size={18} className="mr-1 text-purple-700" />
                  Buy Now
                </Button>
              </div>

              {/* Pincode Checker Component */}
              <PincodeChecker />
            </div>

            {/* Guarantee Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck size={20} className="text-purple-700" />
                <span>100% Genuine</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck size={20} className="text-purple-700" />
                <span>Fast India Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RefreshCw size={20} className="text-purple-700" />
                <span>7-Day Replacement</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SPECIAL KIT SECTION: Spare Parts & Frequently Bought Together Bundle ─── */}
        {product.type === 'kit' && compatibleSpares.length > 0 && (
          <div className="space-y-10 mb-16">
            {/* Frequently Bought Together Bundle Box */}
            {bundleSpares.length > 0 && (
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-50/50 via-white to-purple-50/50 border border-purple-200 shadow-md space-y-6">
                <div className="flex items-center gap-2">
                  <Badge variant="purple">Frequently Bought Together Bundle</Badge>
                  <span className="text-xs text-slate-500">• Save time &amp; guarantee 100% compatibility</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  {/* Bundle Product 1: Main Kit */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 flex-shrink-0">
                      <Image src={product.imageUrls?.[0] || ''} alt="" fill className="object-contain p-2" />
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
                          <Image src={spare.imageUrls?.[0] || ''} alt="" fill className="object-contain p-2" />
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
                    <Button className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-10 shadow-md shadow-purple-900/20 rounded-xl">
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
                    <Cpu className="text-purple-700" size={22} />
                    Compatible Spare Parts for this Kit
                  </h2>
                  <p className="text-xs text-slate-500">Guaranteed replacement parts tested for {product.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {compatibleSpares.map((spare) => (
                  <ProductCard key={spare.id} {...toProductCardProps(spare)} />
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
                  <Layers className="text-purple-700" size={22} />
                  Compatible Kits
                </h2>
                <p className="text-xs text-slate-500">Kits that use or support this spare part</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {compatibleKits.map((kit) => (
                <ProductCard key={kit.id} {...toProductCardProps(kit)} />
              ))}
            </div>
          </div>
        )}

        {/* Specifications & Tabbed Information */}
        <div className="mb-16">
          <Tabs value="description" onValueChange={() => {}} className="w-full">
            <TabsList className="bg-purple-50/60 border border-purple-100 p-1 rounded-xl mb-6">
              <TabsTrigger value="description" className="text-xs font-bold px-6">Description</TabsTrigger>
              <TabsTrigger value="specs" className="text-xs font-bold px-6">Specifications</TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs font-bold px-6">Reviews ({product.reviewCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="p-6 rounded-2xl bg-purple-50/30 border border-purple-100 space-y-4 text-sm text-slate-700 leading-relaxed">
              <h3 className="font-heading text-lg font-bold text-slate-900">Product Overview</h3>
              <p>{product.longDescription || product.shortDescription}</p>
            </TabsContent>

            <TabsContent value="specs" className="p-6 rounded-2xl bg-purple-50/30 border border-purple-100">
              <div className="max-w-2xl divide-y divide-purple-100 text-sm">
                {product.specs?.map((s, idx) => (
                  <div key={idx} className="py-3 flex justify-between">
                    <span className="font-bold text-slate-600">{s.key}</span>
                    <span className="text-slate-900 font-mono">{s.value}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="p-6 rounded-2xl bg-purple-50/30 border border-purple-100 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-100 pb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900">Customer Reviews</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <RatingStars rating={product.rating} size="default" />
                    <span className="text-xs font-bold text-slate-900">{product.rating} out of 5</span>
                  </div>
                </div>
                <Button className="bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 shadow-md shadow-purple-900/20 rounded-xl">
                  Write a Review
                </Button>
              </div>

              <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700 text-sm">Only Verified Buyers Can Submit Reviews</p>
                <p>Reviews are submitted after order completion and approved by the store administrator.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products Section ("You May Also Like") */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-bold text-slate-900 uppercase tracking-wider border-l-4 border-purple-700 pl-3">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} {...toProductCardProps(p)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
