import * as React from 'react';
export const dynamic = 'force-dynamic';
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
  HelpCircle,
  Home,
  ChevronRight,
  FileText,
  Download,
  ExternalLink,
  PackageCheck,
} from 'lucide-react';
import {
  getProductBySlug,
  getCompatibleProducts,
  getStoreProducts,
  toStoreProductCardProps,
} from '@/lib/mongodb/catalog';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { ReviewModel } from '@/lib/mongodb/models';
import { PriceTag } from '@/components/store/price-tag';
import { RatingStars } from '@/components/store/rating-stars';
import { ProductCard } from '@/components/store/product-card';
import { PincodeChecker } from '@/components/store/pincode-checker';
import { ProductOrderBox } from '@/components/store/product-order-box';
import { ProductShareButton } from '@/components/store/product-share-button';
import { ProductGallery } from '@/components/store/product-gallery';
import { ProductBundleBox } from '@/components/store/product-bundle-box';
import { ProductCompatibilityChecker } from '@/components/store/product-compatibility-checker';
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
import { ProductJsonLd, BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found | TTRC Store' };
  }

  const title = product.metaTitle || `${product.name} | TTRC Store`;
  const description = product.metaDescription || product.shortDescription;
  const canonicalUrl = `https://www.ttrc.store/product/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'TTRC Store',
      type: 'website',
      images: [
        {
          url: product.imageUrls?.[0]?.startsWith('http')
            ? product.imageUrls[0]
            : `https://www.ttrc.store${product.imageUrls?.[0] || '/brand/ttrc-logo.png'}`,
          width: 2560,
          height: 1440,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        product.imageUrls?.[0]?.startsWith('http')
          ? product.imageUrls[0]
          : `https://www.ttrc.store${product.imageUrls?.[0] || '/brand/ttrc-logo.png'}`,
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const auth = await getAuthenticatedUser();
  const isAdminOrStaff = 'user' in auth && (auth.user?.role === 'admin' || auth.user?.role === 'staff');
  const product = await getProductBySlug(slug, isAdminOrStaff);

  if (!product) {
    notFound();
  }

  // Fetch real verified buyer reviews from MongoDB
  const reviews = await ReviewModel.find({ product_id: product.id, status: 'approved' })
    .sort({ created_at: -1 })
    .lean();

  // Find real compatible spare parts & kits from MongoDB
  const { compatibleSpares, compatibleKits } = await getCompatibleProducts(product.id, product.type);

  // Fetch real related products from same category in MongoDB
  const categoryName = product.categoryName || 'Robotics & STEM';
  const categorySlug = product.categorySlug || 'gamified-robots';
  const subCategoryName = product.subCategoryName;
  const subCategorySlug = product.subCategorySlug;

  const { products: relatedProducts } = await getStoreProducts({
    categorySlug: product.categorySlug || product.categoryId,
    limit: 4,
  });
  const filteredRelated = relatedProducts.filter((p) => p.id !== product.id).slice(0, 4);

  // Bundle calculation (Kit + top 2 spare parts)
  const bundleSpares = compatibleSpares.slice(0, 2);
  const bundleTotalPricePaise =
    product.pricePaise + bundleSpares.reduce((acc, s) => acc + s.pricePaise, 0);

  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.ttrc.store' },
    { name: categoryName, url: `https://www.ttrc.store/category/${categorySlug}` },
    ...(subCategoryName && subCategorySlug
      ? [{ name: subCategoryName, url: `https://www.ttrc.store/category/${categorySlug}?sub=${subCategorySlug}` }]
      : []),
    { name: product.name, url: `https://www.ttrc.store/product/${slug}` },
  ];

  const productFaqs = [
    {
      question: `What is included in the ${product.name} package?`,
      answer: product.type === 'kit'
        ? `The ${product.name} package includes the core platform components: ${product.technicalSpecs && product.technicalSpecs.length > 0 ? product.technicalSpecs.map((s) => s.value).join(', ') : 'competition-ready mechanical and electronic modules'}. Assembly hardware and connectivity are supplied.`
        : `The package includes 1x ${product.name} (${product.unit || 'Piece'}) with verified technical specifications.`,
    },
    {
      question: `Is a battery included with ${product.name}?`,
      answer: product.attributes?.configurations?.some((c: any) => c.name?.toLowerCase().includes('battery') && c.is_default)
        ? `Yes, the default package includes the matching battery pack.`
        : `By default, this platform is supplied in the standard competition package without a battery so builders can use their preferred LiPo battery packs (7.4V 2S / 11.1V 3S compatible).`,
    },
    {
      question: `Who is this ${product.name} designed for?`,
      answer: product.applications && product.applications.length > 0
        ? `This platform is engineered for: ${product.applications.join(', ')}.`
        : `Designed for engineering students, competition robotics teams, STEM laboratories, and embedded systems developers.`,
    },
    {
      question: `What warranty and quality guarantee does TTRC provide?`,
      answer: `TTRC Store guarantees 100% genuine Tamizh Tech components. Every unit undergoes functional bench testing prior to dispatch, backed by a 7-day replacement window for verified transit or manufacturing defects.`,
    },
    {
      question: `What are shipping timelines and delivery coverage across India?`,
      answer: `Orders dispatch within 10 days from Coimbatore, Tamil Nadu with India-wide tracked express shipping (typically 2-5 days delivery transit across all serviceable Indian pincodes). TTRC Store operates exclusively with secure online payments via Razorpay. GST tax invoices are provided.`,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 pt-6">
      {isAdminOrStaff && product.status !== 'published' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-950 text-[10px] uppercase tracking-wider font-extrabold">
                Admin Preview Mode
              </span>
              <span>This product is currently in <strong>{product.status || 'draft'}</strong> status. Only store administrators can preview it.</span>
            </div>
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="text-amber-900 hover:text-amber-950 font-bold underline flex items-center gap-1 shrink-0"
            >
              <span>Edit Product in Admin</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
      <ProductJsonLd
        name={product.name}
        description={product.longDescription || product.shortDescription}
        images={product.imageUrls}
        sku={product.sku}
        brand={product.brand || 'Tamizh Tech'}
        pricePaise={product.pricePaise}
        inStock={product.stockQty > 0}
        url={`https://www.ttrc.store/product/${slug}`}
        rating={product.rating}
        reviewCount={product.reviewCount}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <FAQJsonLd faqs={productFaqs} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Catchy, modern, accessible Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center flex-wrap gap-1.5 text-xs font-medium text-slate-500">
            <li>
              <Link
                href="/"
                className="group inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-slate-600 hover:text-[#E3132A] hover:bg-red-50/70 border border-transparent hover:border-red-100 transition-all font-semibold"
              >
                <Home size={13} className="text-slate-400 group-hover:text-[#E3132A] transition-colors" />
                <span>Home</span>
              </Link>
            </li>

            <li className="text-slate-300" aria-hidden="true">
              <ChevronRight size={13} />
            </li>

            <li>
              <Link
                href={`/category/${categorySlug}`}
                className="inline-flex items-center py-1 px-2.5 rounded-lg text-slate-700 hover:text-[#E3132A] bg-slate-50 hover:bg-red-50/70 border border-slate-200/80 hover:border-red-200 font-bold transition-all shadow-2xs"
              >
                {categoryName}
              </Link>
            </li>

            {subCategoryName && subCategorySlug && (
              <>
                <li className="text-slate-300" aria-hidden="true">
                  <ChevronRight size={13} />
                </li>
                <li>
                  <Link
                    href={`/category/${categorySlug}?sub=${subCategorySlug}`}
                    className="inline-flex items-center py-1 px-2 rounded-lg text-slate-600 hover:text-[#E3132A] hover:bg-red-50/70 transition-all font-medium"
                  >
                    {subCategoryName}
                  </Link>
                </li>
              </>
            )}

            <li className="text-slate-300" aria-hidden="true">
              <ChevronRight size={13} />
            </li>

            <li className="max-w-xs sm:max-w-md truncate">
              <span
                className="inline-flex items-center py-1 px-3 rounded-lg bg-[#FAF9FC] text-slate-900 border border-purple-100 font-bold tracking-tight truncate shadow-2xs"
                aria-current="page"
              >
                {product.name}
              </span>
            </li>
          </ol>
        </nav>

        {/* Top Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16 items-start">
          {/* Gallery Column (5 cols) */}
          <div className="lg:col-span-5">
            <ProductGallery
              images={product.imageUrls || []}
              productName={product.name}
              productType={product.type as any}
              slug={slug}
              pricePaise={product.pricePaise}
            />
          </div>

          {/* Product Details & Ordering Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              {/* Manufacturer & Brand Ribbon (Strictly Public Fields Only) */}
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {product.showManufacturerPublicly && product.manufacturer ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EEE8FA] text-[#6721F2] text-xs font-bold border border-[#AF87F8]/40">
                    <Factory size={13} />
                    <span>Manufacturer: {product.manufacturer.name}</span>
                    <CheckCircle2 size={12} className="text-[#844AFB]" />
                  </div>
                ) : null}

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                  <span>Sold by: <strong>TTRC Store</strong></span>
                </div>

                <Link
                  href={`/category/${categorySlug}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-[#E3132A] text-xs font-semibold border border-slate-200 transition-colors"
                  title={`Browse all ${categoryName}`}
                >
                  <Layers size={13} className="text-[#E3132A]" />
                  <span>Category: <strong>{categoryName}</strong></span>
                </Link>

                {subCategoryName && (
                  <Link
                    href={`/category/${categorySlug}?sub=${subCategorySlug}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FDECEE] hover:bg-red-100/70 text-[#E3132A] text-xs font-bold border border-red-200 transition-colors"
                    title={`Browse ${subCategoryName}`}
                  >
                    <span>Subcategory: <strong>{subCategoryName}</strong></span>
                  </Link>
                )}

                {product.brand && (!product.manufacturer || product.brand !== product.manufacturer?.name) && (
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
              unit={product.unit}
              bulkPriceTiers={product.bulkPriceTiers}
              configurations={product.attributes?.configurations}
            />

            {/* B2B Wholesale / Larger Quantity CTA (Requirement 78, 158) */}
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-900">Need larger business quantities (50+ units)?</p>
                <p className="text-slate-500">Get custom institutional procurement quotations with GST invoices.</p>
              </div>
              <Link
                href="/bulk-orders"
                className="px-3.5 py-2 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-bold flex-shrink-0 transition-colors shadow-xs"
              >
                Request Quote →
              </Link>
            </div>

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
                <span className="font-semibold text-slate-800">Dispatch in 10 Days</span>
                <span className="text-[10px] text-slate-400">Pan-India Tracked</span>
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
            {/* Interactive Frequently Bought Together Bundle Box */}
            {bundleSpares.length > 0 && (
              <ProductBundleBox
                kit={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  pricePaise: product.pricePaise,
                  mrpPaise: product.mrpPaise,
                  imageUrl: product.imageUrls?.[0],
                  gstPercent: product.gstPercent,
                  unit: product.unit,
                  stockQty: product.stockQty,
                  type: 'kit',
                }}
                spares={bundleSpares.map((spare) => ({
                  id: spare.id,
                  name: spare.name,
                  slug: spare.slug,
                  pricePaise: spare.pricePaise,
                  mrpPaise: spare.mrpPaise,
                  imageUrl: spare.imageUrls?.[0],
                  gstPercent: spare.gstPercent,
                  unit: spare.unit,
                  stockQty: spare.stockQty,
                  type: 'spare_part',
                }))}
              />
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

        {/* Interactive Robotics Component Compatibility Checker */}
        <div className="mb-10">
          <ProductCompatibilityChecker
            productName={product.name}
            sku={product.sku}
            slug={slug}
            voltage={product.voltage}
            current={product.current}
            power={product.power}
            productType={product.type}
            technicalSpecs={product.technicalSpecs}
          />
        </div>

        {/* Specifications & Tabbed Information (JetBrains Mono for Specs) */}
        <div className="mb-16">
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className="bg-purple-50/60 border border-purple-100 p-1 rounded-xl mb-6 flex flex-wrap h-auto gap-1">
              <TabsTrigger value="specs" className="text-xs font-bold px-4 py-2">
                Technical Specifications
              </TabsTrigger>
              <TabsTrigger value="docs" className="text-xs font-bold px-4 py-2">
                Datasheets &amp; Manuals ({product.documents?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="inbox" className="text-xs font-bold px-4 py-2">
                In The Box ({product.inBoxItems?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="description" className="text-xs font-bold px-4 py-2">
                Description &amp; Applications
              </TabsTrigger>
              <TabsTrigger value="manufacturer" className="text-xs font-bold px-4 py-2">
                Manufacturer &amp; Provenance
              </TabsTrigger>
              <TabsTrigger value="faqs" className="text-xs font-bold px-4 py-2">
                Buyer Q&amp;A / FAQs
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs font-bold px-4 py-2">
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

            {/* Datasheets & Documentation Tab (Requirement 1, 5, 6, 8) */}
            <TabsContent
              value="docs"
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6"
            >
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="text-[#844AFB]" size={20} /> Official Engineering Documentation &amp; Schematics
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verified product manuals, pinout schematics, and technical datasheets for robotics engineering.
                </p>
              </div>

              {product.documents && product.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-red-100/80 text-[#E3132A] flex items-center justify-center font-bold text-xs shrink-0">
                            PDF
                          </div>
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 mb-1">
                              {doc.type}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">{doc.title}</h4>
                            {doc.version && (
                              <span className="text-[11px] font-mono text-slate-500">
                                Revision: {doc.version}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-purple-600 text-slate-800 font-bold hover:text-purple-700 transition-colors shadow-xs"
                        >
                          <ExternalLink size={13} /> View / Open
                        </a>
                        <a
                          href={doc.fileUrl}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#844AFB] font-bold transition-colors"
                        >
                          <Download size={13} /> Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <FileText className="mx-auto text-slate-400" size={36} />
                  <p className="font-bold text-slate-700 text-sm">No Technical Documents Published</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Official datasheets and wiring pinouts for this component are currently being cataloged by our technical team.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* In The Box Package Checklist Tab */}
            <TabsContent
              value="inbox"
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-4"
            >
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="text-[#844AFB]" size={20} /> Verified In-Box Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Guaranteed package contents included inside the factory sealed parcel.
                </p>
              </div>

              {product.inBoxItems && product.inBoxItems.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs sm:text-sm">
                  {product.inBoxItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.quantity}×
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900 block">{item.itemName}</span>
                          {item.notes && <span className="text-slate-500 text-xs block">{item.notes}</span>}
                        </div>
                      </div>
                      <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={13} /> Included
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <PackageCheck className="mx-auto text-slate-400" size={36} />
                  <p className="font-bold text-slate-700 text-sm">Standard Unit Packaging</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Contains 1× primary {product.name} with anti-static packaging and warranty seal.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Description Tab */}
            <TabsContent
              value="description"
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 text-sm text-slate-700 leading-relaxed"
            >
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">Product Overview</h3>
                <p className="whitespace-pre-line">{product.longDescription || product.shortDescription}</p>
              </div>

              {product.applications && product.applications.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-heading text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#844AFB]" /> Verified Applications &amp; Use Cases
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    {product.applications.map((app, i) => (
                      <li key={i} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0" />
                        <span>{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.certifications && product.certifications.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-heading text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Award size={16} className="text-[#844AFB]" /> Compliance &amp; Certifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.certifications.map((cert, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Manufacturer Tab (Requirement 15, 31, 92, 93) */}
            <TabsContent
              value="manufacturer"
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-4 text-sm text-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-bold overflow-hidden relative">
                  {product.showManufacturerPublicly && product.manufacturer?.logo ? (
                    <Image src={product.manufacturer.logo} alt={product.manufacturer.name} fill className="object-contain p-1" />
                  ) : (
                    <Factory size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900">
                    {product.showManufacturerPublicly && product.manufacturer
                      ? product.manufacturer.name
                      : product.brand || 'Tamizh Tech / TTRC'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Country of Origin: {product.countryOfOrigin || 'India'} • Distributed &amp; Sold by TTRC Store
                  </p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p><strong>Merchant of Record:</strong> TTRC Store (Tamizh Tech Robotics Company, Tamil Nadu, India)</p>
                <p>All items undergo rigorous quality verification and functional bench-testing, and are dispatched within 10 days.</p>
              </div>
            </TabsContent>

            {/* Buyer Q&A / FAQs Tab (AEO / GEO Knowledge Base) */}
            <TabsContent
              value="faqs"
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6"
            >
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="text-[#844AFB]" size={20} /> Verified Technical Q&amp;A &amp; FAQs
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Accurate, engineering-verified answers to common buyer, competition, and integration questions.
                </p>
              </div>

              <div className="space-y-4">
                {productFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2"
                  >
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                      <span className="text-purple-600 font-mono">Q{idx + 1}.</span>
                      <span>{faq.question}</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed pl-5">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
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

              {/* Real Reviews or Authentic Empty State */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r: any) => (
                    <div
                      key={r._id.toString()}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{r.user_name}</span>
                          {r.is_verified_purchase && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Verified Buyer
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(r.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <RatingStars rating={r.rating} size="sm" />
                      {r.title && <p className="text-xs font-bold text-slate-800">{r.title}</p>}
                      <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                      {r.admin_reply && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-xs text-purple-950 mt-2">
                          <span className="font-bold text-purple-900">
                            Tamizh Tech Support:
                          </span>{' '}
                          {r.admin_reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2 bg-slate-50/60 rounded-xl border border-slate-200">
                  <Award size={36} className="mx-auto text-purple-400" />
                  <p className="font-bold text-slate-700 text-sm">No reviews yet for this product</p>
                  <p className="max-w-md mx-auto text-slate-500">
                    Only customers who have purchased this component through TTRC Store can submit verified buyer reviews.
                  </p>
                </div>
              )}
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
