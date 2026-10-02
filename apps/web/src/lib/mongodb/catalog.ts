import { connectToDatabase } from './client';
import {
  CategoryModel,
  ProductModel,
  ProductCompatibilityModel,
  SiteSettingModel,
  ManufacturerModel,
  IProduct,
  ICategory,
} from './models';
import { ensureDatabaseSeeded } from './seed';
import { ProductCardProps } from '@/components/store/product-card';

export interface StoreCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount: number;
}

export interface StoreProductItem {
  id: string;
  slug: string;
  sku: string;
  name: string;
  type: 'kit' | 'spare_part' | 'standard';
  brand: string;
  categoryId?: string;
  shortDescription: string;
  longDescription: string;
  pricePaise: number;
  mrpPaise: number;
  discountPct: number;
  gstPercent: number;
  hsnCode: string;
  stockQty: number;
  lowStockThreshold: number;
  weightGrams: number;
  countryOfOrigin: string;
  rating: number;
  reviewCount: number;
  imageUrls: string[];
  bulkPriceTiers?: Array<{ minQuantity: number; maxQuantity?: number; unitPricePaise: number }>;
  technicalSpecs?: Array<{ key: string; value: string }>;
  modelNumber?: string;
  partNumber?: string;
  voltage?: string;
  current?: string;
  power?: string;
  material?: string;
  dimensions?: string;
  warranty?: string;
  manufacturer?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function toStoreProductCardProps(product: StoreProductItem): ProductCardProps {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    productType: product.type,
    pricePaise: product.pricePaise,
    mrpPaise: product.mrpPaise,
    rating: product.rating,
    reviewCount: product.reviewCount,
    imageUrl: product.imageUrls?.[0] || '/brand/ttrc-logo.png',
    stockQty: product.stockQty,
  };
}

function mapProductDoc(p: any, manufacturerDoc?: any): StoreProductItem {
  const pricePaise = p.price ?? 0;
  const mrpPaise = p.compare_at_price ?? pricePaise;
  const discountPct = mrpPaise > pricePaise ? Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100) : 0;

  return {
    id: p._id.toString(),
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    type: p.product_type === 'general' ? 'standard' : p.product_type,
    brand: p.brand || 'Tamizh Tech',
    categoryId: p.category_id,
    shortDescription: p.short_description || p.name,
    longDescription: p.description || p.short_description || p.name,
    pricePaise,
    mrpPaise,
    discountPct,
    gstPercent: p.gst_percent ?? 18,
    hsnCode: p.hsn_code ?? '8542',
    stockQty: p.stock_quantity ?? 0,
    lowStockThreshold: p.low_stock_threshold ?? 5,
    weightGrams: p.weight_grams ?? 100,
    countryOfOrigin: p.country_of_origin ?? 'India',
    rating: p.rating ?? 0,
    reviewCount: p.review_count ?? 0,
    imageUrls: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['/brand/ttrc-logo.png'],
    bulkPriceTiers: p.bulk_price_tiers || [],
    technicalSpecs: p.technical_specs || [],
    modelNumber: p.model_number,
    partNumber: p.part_number,
    voltage: p.voltage,
    current: p.current,
    power: p.power,
    material: p.material,
    dimensions: p.dimensions,
    warranty: p.warranty,
    manufacturer: manufacturerDoc
      ? {
          id: manufacturerDoc._id.toString(),
          name: manufacturerDoc.name,
          slug: manufacturerDoc.slug,
          logo: manufacturerDoc.logo,
          country: manufacturerDoc.country,
        }
      : undefined,
    createdAt: p.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: p.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function getStoreCategories(): Promise<StoreCategoryItem[]> {
  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const categories = await CategoryModel.find({ is_active: true })
      .sort({ sort_order: 1 })
      .lean();

    // Compute real product count for each category
    const categoryItems = await Promise.all(
      categories.map(async (cat) => {
        const count = await ProductModel.countDocuments({
          $or: [
            { category_id: cat.slug },
            { category_id: cat._id.toString() },
          ],
          is_active: true,
        });

        return {
          id: cat._id.toString(),
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          imageUrl: cat.image_url,
          productCount: count,
        };
      })
    );

    return categoryItems;
  } catch (err) {
    console.error('[MongoDB Catalog] Error loading store categories:', err);
    return [];
  }
}

export async function getStoreProducts(opts?: {
  categorySlug?: string;
  productType?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  limit?: number;
  page?: number;
  sort?: string;
}): Promise<{ products: StoreProductItem[]; total: number }> {
  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const query: Record<string, any> = { is_active: true };

    if (opts?.categorySlug && opts.categorySlug !== 'all') {
      // Find category by slug
      const cat = await CategoryModel.findOne({ slug: opts.categorySlug }).lean();
      if (cat) {
        query.$or = [
          { category_id: cat.slug },
          { category_id: cat._id.toString() },
        ];
      } else {
        query.category_id = opts.categorySlug;
      }
    }

    if (opts?.productType && opts.productType !== 'all') {
      query.product_type = opts.productType;
    }

    if (opts?.isFeatured) {
      query.is_featured = true;
    }

    if (opts?.isBestseller) {
      query.is_bestseller = true;
    }

    if (opts?.isNewArrival) {
      query.is_new_arrival = true;
    }

    const sortOption: Record<string, any> = {};
    if (opts?.sort === 'price_asc') {
      sortOption.price = 1;
    } else if (opts?.sort === 'price_desc') {
      sortOption.price = -1;
    } else if (opts?.sort === 'rating') {
      sortOption.rating = -1;
      sortOption.created_at = -1;
    } else if (opts?.sort === 'newest') {
      sortOption.created_at = -1;
    } else {
      sortOption.is_featured = -1;
      sortOption.created_at = -1;
    }

    const limit = opts?.limit ?? 50;
    const page = opts?.page ?? 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      ProductModel.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments(query),
    ]);

    const products = docs.map((doc) => mapProductDoc(doc));
    return { products, total };
  } catch (err) {
    console.error('[MongoDB Catalog] Error loading store products:', err);
    return { products: [], total: 0 };
  }
}

export async function getProductBySlug(slug: string): Promise<StoreProductItem | null> {
  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const productDoc = await ProductModel.findOne({ slug, is_active: true }).lean();
    if (!productDoc) return null;

    let manufacturerDoc = null;
    if (productDoc.manufacturer_id) {
      manufacturerDoc = await ManufacturerModel.findById(productDoc.manufacturer_id).lean();
    }

    return mapProductDoc(productDoc, manufacturerDoc);
  } catch (err) {
    console.error(`[MongoDB Catalog] Error loading product ${slug}:`, err);
    return null;
  }
}

export async function getProductById(id: string): Promise<StoreProductItem | null> {
  try {
    await connectToDatabase();
    const productDoc = await ProductModel.findById(id).lean();
    if (!productDoc) return null;

    let manufacturerDoc = null;
    if (productDoc.manufacturer_id) {
      manufacturerDoc = await ManufacturerModel.findById(productDoc.manufacturer_id).lean();
    }

    return mapProductDoc(productDoc, manufacturerDoc);
  } catch (err) {
    console.error(`[MongoDB Catalog] Error loading product by id ${id}:`, err);
    return null;
  }
}

export async function getCompatibleProducts(
  productId: string,
  type: string
): Promise<{ compatibleSpares: StoreProductItem[]; compatibleKits: StoreProductItem[] }> {
  try {
    await connectToDatabase();

    if (type === 'kit') {
      const compatLinks = await ProductCompatibilityModel.find({ kit_id: productId }).lean();
      const spareIds = compatLinks.map((c) => c.spare_part_id);
      if (spareIds.length === 0) return { compatibleSpares: [], compatibleKits: [] };

      const spareDocs = await ProductModel.find({
        _id: { $in: spareIds },
        is_active: true,
      }).lean();

      return {
        compatibleSpares: spareDocs.map((d) => mapProductDoc(d)),
        compatibleKits: [],
      };
    } else if (type === 'spare_part') {
      const compatLinks = await ProductCompatibilityModel.find({ spare_part_id: productId }).lean();
      const kitIds = compatLinks.map((c) => c.kit_id);
      if (kitIds.length === 0) return { compatibleSpares: [], compatibleKits: [] };

      const kitDocs = await ProductModel.find({
        _id: { $in: kitIds },
        is_active: true,
      }).lean();

      return {
        compatibleSpares: [],
        compatibleKits: kitDocs.map((d) => mapProductDoc(d)),
      };
    }

    return { compatibleSpares: [], compatibleKits: [] };
  } catch (err) {
    console.error('[MongoDB Catalog] Error fetching compatible products:', err);
    return { compatibleSpares: [], compatibleKits: [] };
  }
}

export async function searchStoreProducts(
  searchTerm: string,
  opts?: { limit?: number }
): Promise<StoreProductItem[]> {
  const queryText = (searchTerm || '').trim();
  if (!queryText) return [];

  try {
    await connectToDatabase();

    const limit = opts?.limit ?? 20;
    const regex = new RegExp(queryText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');

    const docs = await ProductModel.find({
      is_active: true,
      $or: [
        { name: regex },
        { sku: regex },
        { slug: regex },
        { short_description: regex },
        { brand: regex },
      ],
    })
      .limit(limit)
      .lean();

    return docs.map((d) => mapProductDoc(d));
  } catch (err) {
    console.error('[MongoDB Catalog] Error searching products:', err);
    return [];
  }
}

export async function getStoreSiteSettings() {
  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const settingsDocs = await SiteSettingModel.find({}).lean();
    const map = new Map<string, any>();
    settingsDocs.forEach((s) => map.set(s.key, s.value));

    return {
      storeName: map.get('store_name') || 'Tamizh Tech Robotics & Components Store',
      supportPhone: map.get('support_phone') || '+91 7904902978',
      supportEmail: map.get('support_email') || 'support@ttrc.store',
      storeAddress: map.get('store_address') || 'Tamizh Tech, Tamil Nadu, India',
      freeShippingThresholdPaise: map.get('free_shipping_threshold_paise') ?? 99900,
      standardShippingFeePaise: map.get('standard_shipping_fee_paise') ?? 5000,
      codLimitPaise: map.get('cod_limit_paise') ?? 500000,
      codFeePaise: map.get('cod_fee_paise') ?? 4900,
      gstEnabled: Boolean(map.get('gst_enabled')),
      razorpayEnabled: Boolean(map.get('razorpay_enabled')),
      gstin: map.get('gstin') || '',
    };
  } catch (err) {
    console.error('[MongoDB Catalog] Error fetching site settings:', err);
    return {
      storeName: 'Tamizh Tech Robotics & Components Store',
      supportPhone: '+91 7904902978',
      supportEmail: 'support@ttrc.store',
      storeAddress: 'Tamizh Tech, Tamil Nadu, India',
      freeShippingThresholdPaise: 99900,
      standardShippingFeePaise: 5000,
      codLimitPaise: 500000,
      codFeePaise: 4900,
      gstEnabled: false,
      razorpayEnabled: false,
      gstin: '',
    };
  }
}
