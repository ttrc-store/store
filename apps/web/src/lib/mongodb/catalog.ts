import mongoose from 'mongoose';
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
  parentId?: string | null;
  productCount: number;
}

export interface StoreProductItem {
  id: string;
  slug: string;
  sku: string;
  name: string;
  type: 'kit' | 'spare_part' | 'standard';
  unit: string;
  status: 'draft' | 'published' | 'archived';
  brand: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  subCategorySlug?: string;
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
  documents?: Array<{
    id: string;
    type: 'datasheet' | 'manual' | 'schematic' | 'pinout' | 'in_box' | 'other';
    title: string;
    fileUrl: string;
    fileFormat?: string;
    fileSizeBytes?: number;
    version?: string;
    sortOrder?: number;
    isVerified?: boolean;
  }>;
  inBoxItems?: Array<{
    itemName: string;
    quantity: number;
    notes?: string;
  }>;
  applications?: string[];
  certifications?: string[];
  modelNumber?: string;
  partNumber?: string;
  voltage?: string;
  current?: string;
  power?: string;
  material?: string;
  dimensions?: string;
  warranty?: string;
  showManufacturerPublicly: boolean;
  attributes?: Record<string, any>;
  metaTitle?: string;
  metaDescription?: string;
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
    unit: product.unit || 'Piece',
    bulkPriceTiers: product.bulkPriceTiers,
    rating: product.rating,
    reviewCount: product.reviewCount,
    imageUrl: product.imageUrls?.[0] || '/brand/ttrc-logo.png',
    stockQty: product.stockQty,
  };
}

function mapProductDoc(
  p: any,
  manufacturerDoc?: any,
  categoryInfo?: { categoryName?: string; categorySlug?: string; subCategoryName?: string; subCategorySlug?: string }
): StoreProductItem {
  const pricePaise = p.price ?? 0;
  const mrpPaise = p.compare_at_price ?? pricePaise;
  const discountPct = mrpPaise > pricePaise ? Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100) : 0;
  const showManufacturer = p.show_manufacturer_publicly ?? true;

  const isCatIdOid = p.category_id && mongoose.Types.ObjectId.isValid(p.category_id) && p.category_id.length === 24;
  const isSubCatIdOid = p.sub_category_id && mongoose.Types.ObjectId.isValid(p.sub_category_id) && p.sub_category_id.length === 24;

  return {
    id: p._id.toString(),
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    type: p.product_type === 'general' ? 'standard' : p.product_type,
    unit: p.unit || 'Piece',
    status: p.status || 'published',
    brand: p.brand || 'Tamizh Tech',
    categoryId: p.category_id,
    categoryName: categoryInfo?.categoryName,
    categorySlug: categoryInfo?.categorySlug || (!isCatIdOid ? p.category_id : undefined),
    subCategoryId: p.sub_category_id,
    subCategoryName: categoryInfo?.subCategoryName,
    subCategorySlug: categoryInfo?.subCategorySlug || (!isSubCatIdOid ? p.sub_category_id : undefined),
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
    documents: Array.isArray(p.documents)
      ? p.documents
          .filter((d: any) => d && d.is_verified !== false && d.file_url)
          .map((d: any) => ({
            id: d.id,
            type: d.type,
            title: d.title,
            fileUrl: d.file_url,
            fileFormat: d.file_format || 'pdf',
            fileSizeBytes: d.file_size_bytes,
            version: d.version,
            sortOrder: d.sort_order || 0,
            isVerified: d.is_verified ?? true,
          }))
          .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
      : [],
    inBoxItems: Array.isArray(p.in_box_items)
      ? p.in_box_items.map((item: any) => ({
          itemName: item.item_name,
          quantity: item.quantity,
          notes: item.notes,
        }))
      : [],
    applications: p.applications || [],
    certifications: p.certifications || [],
    modelNumber: p.model_number,
    partNumber: p.part_number,
    voltage: p.voltage,
    current: p.current,
    power: p.power,
    material: p.material,
    dimensions: p.dimensions,
    warranty: p.warranty,
    showManufacturerPublicly: showManufacturer,
    attributes: p.attributes || {},
    metaTitle: p.meta_title,
    metaDescription: p.meta_description,
    manufacturer:
      showManufacturer && (manufacturerDoc || p.manufacturer_id)
        ? {
            id: manufacturerDoc?._id?.toString() || p.manufacturer_id,
            name: manufacturerDoc?.name || p.manufacturer_id,
            slug: manufacturerDoc?.slug || String(p.manufacturer_id).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            logo: manufacturerDoc?.logo,
            country: manufacturerDoc?.country || 'India',
          }
        : undefined,
    createdAt: p.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: p.updated_at?.toISOString() || new Date().toISOString(),
  };
}

async function findManufacturerSafely(manufacturerId?: string): Promise<any> {
  if (!manufacturerId || typeof manufacturerId !== 'string') return null;
  const trimmed = manufacturerId.trim();
  if (!trimmed) return null;

  try {
    if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
      const doc = await ManufacturerModel.findById(trimmed).lean();
      if (doc) return doc;
    }

    const bySlugOrName = await ManufacturerModel.findOne({
      $or: [
        { slug: trimmed.toLowerCase() },
        { name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    }).lean();

    if (bySlugOrName) return bySlugOrName;

    return {
      _id: trimmed,
      name: trimmed,
      slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      country: 'India',
    };
  } catch (err) {
    console.warn(`[MongoDB Catalog] Could not resolve manufacturer '${manufacturerId}':`, err);
    return {
      _id: trimmed,
      name: trimmed,
      slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      country: 'India',
    };
  }
}

let cachedCategories: StoreCategoryItem[] | null = null;
let cachedCategoriesTime = 0;
let cachedAllCategories: any[] | null = null;
let cachedAllCategoriesTime = 0;
const CATEGORIES_CACHE_TTL_MS = 60 * 1000;

export function invalidateCatalogCache() {
  cachedCategories = null;
  cachedCategoriesTime = 0;
  cachedAllCategories = null;
  cachedAllCategoriesTime = 0;
}

async function getAllCategoriesCached(): Promise<any[]> {
  const now = Date.now();
  if (cachedAllCategories && now - cachedAllCategoriesTime < CATEGORIES_CACHE_TTL_MS) {
    return cachedAllCategories;
  }
  const all = await CategoryModel.find().lean();
  cachedAllCategories = all;
  cachedAllCategoriesTime = now;
  return all;
}

export async function getStoreCategories(): Promise<StoreCategoryItem[]> {
  const now = Date.now();
  if (cachedCategories && now - cachedCategoriesTime < CATEGORIES_CACHE_TTL_MS) {
    return cachedCategories;
  }

  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const categories = await CategoryModel.find({ is_active: true })
      .sort({ sort_order: 1 })
      .lean();

    // Compute real product count for each category (including subcategories for parents)
    const categoryItems = await Promise.all(
      categories.map(async (cat) => {
        const subCats = categories.filter(
          (s) => s.parent_id === cat._id.toString() || s.parent_id === cat.slug
        );
        const allCatIds = [
          cat.slug,
          cat._id.toString(),
          ...subCats.map((s) => s.slug),
          ...subCats.map((s) => s._id.toString()),
        ];

        const count = await ProductModel.countDocuments({
          $or: [
            { category_id: { $in: allCatIds } },
            { sub_category_id: { $in: allCatIds } },
            { category_ids: { $in: allCatIds } },
          ],
          is_active: true,
        });

        return {
          id: cat._id.toString(),
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          imageUrl: cat.image_url,
          parentId: cat.parent_id || null,
          productCount: count,
        };
      })
    );

    cachedCategories = categoryItems;
    cachedCategoriesTime = Date.now();
    return categoryItems;
  } catch (err) {
    console.error('[MongoDB Catalog] Error loading store categories:', err);
    return [];
  }
}

async function resolveCategoryInfo(catId?: string, subCatId?: string): Promise<{
  categoryName?: string;
  categorySlug?: string;
  subCategoryName?: string;
  subCategorySlug?: string;
}> {
  if (!catId && !subCatId) return {};

  try {
    let categoryName: string | undefined = undefined;
    let categorySlug: string | undefined = undefined;
    let subCategoryName: string | undefined = undefined;
    let subCategorySlug: string | undefined = undefined;

    const mainCat = catId
      ? await CategoryModel.findOne({
          $or: [
            { slug: catId },
            ...(mongoose.Types.ObjectId.isValid(catId) && catId.length === 24 ? [{ _id: catId }] : []),
          ],
        }).lean()
      : null;

    const subCat = subCatId
      ? await CategoryModel.findOne({
          $or: [
            { slug: subCatId },
            ...(mongoose.Types.ObjectId.isValid(subCatId) && subCatId.length === 24 ? [{ _id: subCatId }] : []),
          ],
        }).lean()
      : null;

    if (mainCat) {
      if (mainCat.parent_id && !subCat) {
        const isParentIdOid = mongoose.Types.ObjectId.isValid(mainCat.parent_id) && mainCat.parent_id.length === 24;
        const parentCat = await CategoryModel.findOne({
          $or: [
            { slug: mainCat.parent_id },
            ...(isParentIdOid ? [{ _id: mainCat.parent_id }] : []),
          ],
        }).lean();

        categoryName = parentCat ? parentCat.name : mainCat.name;
        categorySlug = parentCat ? parentCat.slug : mainCat.slug;
        subCategoryName = mainCat.name;
        subCategorySlug = mainCat.slug;
      } else {
        categoryName = mainCat.name;
        categorySlug = mainCat.slug;
      }
    }

    if (subCat) {
      subCategoryName = subCat.name;
      subCategorySlug = subCat.slug;
      if (!categoryName && subCat.parent_id) {
        const isParentIdOid = mongoose.Types.ObjectId.isValid(subCat.parent_id) && subCat.parent_id.length === 24;
        const parentCat = await CategoryModel.findOne({
          $or: [
            { slug: subCat.parent_id },
            ...(isParentIdOid ? [{ _id: subCat.parent_id }] : []),
          ],
        }).lean();
        if (parentCat) {
          categoryName = parentCat.name;
          categorySlug = parentCat.slug;
        }
      }
    }

    return { categoryName, categorySlug, subCategoryName, subCategorySlug };
  } catch (err) {
    console.warn('[MongoDB Catalog] Error resolving category info:', err);
    return {};
  }
}

export async function getStoreProducts(opts?: {
  categorySlug?: string;
  subcategorySlug?: string;
  productType?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  minPricePaise?: number;
  maxPricePaise?: number;
  inStockOnly?: boolean;
  brand?: string;
  limit?: number;
  page?: number;
  sort?: string;
}): Promise<{ products: StoreProductItem[]; total: number }> {
  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const query: Record<string, any> = { is_active: true };

    if (opts?.subcategorySlug) {
      const subcat = await CategoryModel.findOne({ slug: opts.subcategorySlug }).lean();
      const subCatIds = subcat ? [subcat.slug, subcat._id.toString()] : [opts.subcategorySlug];
      const isLfr = opts.subcategorySlug === 'line-follower';

      query.$or = [
        { category_id: { $in: subCatIds } },
        { sub_category_id: { $in: subCatIds } },
        { category_ids: { $in: subCatIds } },
        { 'attributes.subcategory': opts.subcategorySlug },
        ...(isLfr
          ? [
              { slug: { $regex: 'lfr|line-follower', $options: 'i' } },
              { name: { $regex: 'line follower|lfr', $options: 'i' } },
            ]
          : []),
      ];
    } else if (opts?.categorySlug && opts.categorySlug !== 'all') {
      const cat = await CategoryModel.findOne({ slug: opts.categorySlug }).lean();
      if (cat) {
        const subCats = await CategoryModel.find({
          $or: [{ parent_id: cat._id.toString() }, { parent_id: cat.slug }],
        }).lean();
        const allCatIds = [
          cat.slug,
          cat._id.toString(),
          ...subCats.map((s) => s.slug),
          ...subCats.map((s) => s._id.toString()),
        ];
        query.$or = [
          { category_id: { $in: allCatIds } },
          { sub_category_id: { $in: allCatIds } },
          { category_ids: { $in: allCatIds } },
        ];
      } else {
        query.$or = [
          { category_id: opts.categorySlug },
          { category_ids: opts.categorySlug },
        ];
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

    if (opts?.minPricePaise != null || opts?.maxPricePaise != null) {
      query.price = {};
      if (opts.minPricePaise != null) query.price.$gte = opts.minPricePaise;
      if (opts.maxPricePaise != null) query.price.$lte = opts.maxPricePaise;
    }

    if (opts?.inStockOnly) {
      query.stock_quantity = { $gt: 0 };
    }

    if (opts?.brand && opts.brand !== 'all') {
      query.brand = opts.brand;
    }

    const sortOption: Record<string, any> = {};
    if (opts?.sort === 'price_asc') {
      sortOption.price = 1;
    } else if (opts?.sort === 'price_desc') {
      sortOption.price = -1;
    } else if (opts?.sort === 'rating') {
      sortOption.rating = -1;
      sortOption.created_at = 1;
    } else if (opts?.sort === 'newest') {
      sortOption.created_at = -1;
    } else if (opts?.sort === 'oldest' || opts?.sort === 'order_added') {
      sortOption.created_at = 1;
      sortOption._id = 1;
    } else {
      // Default: order-wise added (first added first, newly added products appear at the end/last)
      sortOption.created_at = 1;
      sortOption._id = 1;
    }

    const limit = opts?.limit ?? 50;
    const page = opts?.page ?? 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      ProductModel.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments(query),
    ]);

    const allCategories = await getAllCategoriesCached();
    const catMap = new Map<string, any>();
    allCategories.forEach((c) => {
      catMap.set(c._id.toString(), c);
      catMap.set(c.slug, c);
    });

    const products = docs.map((doc) => {
      const mainCat = doc.category_id ? catMap.get(doc.category_id) : null;
      const subCat = doc.sub_category_id ? catMap.get(doc.sub_category_id) : null;
      let categoryName = mainCat?.name;
      let categorySlug = mainCat?.slug;
      let subCategoryName = subCat?.name;
      let subCategorySlug = subCat?.slug;

      if (mainCat?.parent_id && !subCat) {
        const parentCat = catMap.get(mainCat.parent_id);
        if (parentCat) {
          categoryName = parentCat.name;
          categorySlug = parentCat.slug;
          subCategoryName = mainCat.name;
          subCategorySlug = mainCat.slug;
        }
      }

      return mapProductDoc(doc, undefined, { categoryName, categorySlug, subCategoryName, subCategorySlug });
    });
    return { products, total };
  } catch (err) {
    console.error('[MongoDB Catalog] Error loading store products:', err);
    return { products: [], total: 0 };
  }
}

export async function getProductBySlug(slug: string, allowInactive = false): Promise<StoreProductItem | null> {
  try {
    await connectToDatabase();
    await ensureDatabaseSeeded();

    const query: Record<string, any> = {
      $or: [
        { slug },
        { slug: slug.toLowerCase() },
        { sku: slug.toUpperCase() },
      ],
    };

    if (!allowInactive) {
      query.is_active = true;
    }

    if (mongoose.Types.ObjectId.isValid(slug) && slug.length === 24) {
      query.$or.push({ _id: slug });
    }

    let productDoc = await ProductModel.findOne(query).lean();
    if (!productDoc && (slug === 'n20-micro-gear-motor' || slug === 'ttrc-n20-micro-gear-motor')) {
      productDoc = await ProductModel.findOne({ slug: 'ttrc-n20-micro-gear-motor-6v-600rpm', is_active: true }).lean();
    }
    if (!productDoc) return null;

    const [manufacturerDoc, categoryInfo] = await Promise.all([
      productDoc.manufacturer_id ? findManufacturerSafely(productDoc.manufacturer_id) : Promise.resolve(null),
      resolveCategoryInfo(productDoc.category_id, productDoc.sub_category_id),
    ]);

    return mapProductDoc(productDoc, manufacturerDoc, categoryInfo);
  } catch (err) {
    console.error(`[MongoDB Catalog] Error loading product ${slug}:`, err);
    return null;
  }
}

export async function getProductById(id: string): Promise<StoreProductItem | null> {
  try {
    await connectToDatabase();
    let productDoc = null;
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      productDoc = await ProductModel.findById(id).lean();
    }
    if (!productDoc) {
      productDoc = await ProductModel.findOne({
        $or: [{ _id: id }, { slug: id }, { sku: id }],
      }).lean();
    }
    if (!productDoc) return null;

    const [manufacturerDoc, categoryInfo] = await Promise.all([
      productDoc.manufacturer_id ? findManufacturerSafely(productDoc.manufacturer_id) : Promise.resolve(null),
      resolveCategoryInfo(productDoc.category_id, productDoc.sub_category_id),
    ]);

    return mapProductDoc(productDoc, manufacturerDoc, categoryInfo);
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

export interface SearchStoreProductsOptions {
  limit?: number;
  skip?: number;
  productType?: string;
  voltage?: string;
  inStockOnly?: boolean;
  minPricePaise?: number;
  maxPricePaise?: number;
  brand?: string;
  category?: string;
  sort?: string;
}

// Domain-specific robotics and electronics synonym & typo mapping dictionary
const ROBOTICS_TYPO_DICTIONARY: Record<string, string[]> = {
  arduino: ['ardunio', 'arduno', 'audrino', 'aduino', 'ardwin', 'ardunio-uno'],
  sensor: ['sesnor', 'senser', 'senosr', 'sensr', 'snr'],
  sensors: ['sesnors', 'sensers', 'senosrs'],
  motor: ['moter', 'motr', 'mottor', 'motur'],
  motors: ['moters', 'motrs', 'mottors'],
  chassis: ['chasis', 'chasi', 'chasiss', 'chassi'],
  battery: ['battry', 'batry', 'batery', 'batteri', 'battrey'],
  batteries: ['battries', 'batries', 'bateries'],
  bluetooth: ['blutooth', 'blue tooth', 'bluetoth', 'bleutooth'],
  esp32: ['esp-32', 'esp 32', 'espressif32'],
  tb6612fng: ['tb6612', 'tb-6612', 'tb 6612'],
  tb6612: ['tb6612fng', 'tb-6612', 'tb 6612'],
  driver: ['drivr', 'drivar', 'draiver'],
  wheel: ['whel', 'weel', 'whele'],
  wheels: ['whels', 'weels'],
  fastener: ['fastner', 'fastners', 'fasteners'],
  screw: ['screws', 'skrew', 'skrews'],
  screws: ['screw', 'skrews'],
  servo: ['servos', 'survo', 'serwo'],
  shield: ['sheild', 'sheeld', 'shild'],
  follower: ['folower', 'follwer', 'folowr'],
  connector: ['conector', 'connecter', 'conecter'],
  ultrasonic: ['ultra sonic', 'ultra-sonic', 'ultrasonik'],
  lipo: ['li-po', 'li po', 'lithium polymer'],
  wire: ['wires', 'wyr', 'wyre'],
  wires: ['wire', 'wyres'],
};

// Build reverse lookup index for fast token normalization
const REVERSE_TYPO_LOOKUP: Map<string, string> = new Map();
for (const [canonical, typos] of Object.entries(ROBOTICS_TYPO_DICTIONARY)) {
  for (const typo of typos) {
    REVERSE_TYPO_LOOKUP.set(typo.toLowerCase(), canonical);
  }
}

export async function searchStoreProducts(
  searchTerm: string,
  opts?: SearchStoreProductsOptions
): Promise<StoreProductItem[]> {
  const queryText = (searchTerm || '').trim();
  if (!queryText) return [];

  // Protect against regex DoS / query abuse
  const sanitizedQuery = queryText.slice(0, 80).replace(/[-/\\^$*+?.()|[\]{}]/g, ' ').trim();
  if (!sanitizedQuery) return [];

  try {
    await connectToDatabase();

    const limit = opts?.limit ?? 20;

    // 1. Tokenize query into distinct search terms
    const rawTokens = sanitizedQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);

    if (rawTokens.length === 0) return [];

    // 2. Expand tokens with canonical corrections and synonyms
    const expandedTokens: string[] = [];
    for (const token of rawTokens) {
      expandedTokens.push(token);
      const canonical = REVERSE_TYPO_LOOKUP.get(token);
      if (canonical && !expandedTokens.includes(canonical)) {
        expandedTokens.push(canonical);
      }
      const knownTypos = ROBOTICS_TYPO_DICTIONARY[token];
      if (knownTypos) {
        for (const typo of knownTypos) {
          if (!expandedTokens.includes(typo)) {
            expandedTokens.push(typo);
          }
        }
      }
    }

    // 3. Construct regex patterns for tokens (including 1-char wildcard for tokens >= 4 chars)
    const regexConditions = expandedTokens.map((token) => {
      // Escape for regex
      const escaped = token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      return new RegExp(escaped, 'i');
    });

    // 4. Base filter: strictly published & active products only (Requirement 12)
    const filterQuery: any = {
      is_active: true,
      status: 'published',
    };

    if (opts?.productType && opts.productType !== 'all') {
      filterQuery.product_type = opts.productType;
    }
    if (opts?.voltage) {
      filterQuery.voltage = new RegExp(opts.voltage.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    }
    if (opts?.inStockOnly) {
      filterQuery.stock_quantity = { $gt: 0 };
    }
    if (opts?.minPricePaise != null || opts?.maxPricePaise != null) {
      filterQuery.price = {};
      if (opts.minPricePaise != null) filterQuery.price.$gte = opts.minPricePaise;
      if (opts.maxPricePaise != null) filterQuery.price.$lte = opts.maxPricePaise;
    }
    if (opts?.brand && opts.brand !== 'all') {
      filterQuery.brand = opts.brand;
    }

    // 5. Build $or array searching name, SKU, slug, brand, technical_specs, voltage, part_number
    const orClauses: any[] = [];
    for (const r of regexConditions) {
      orClauses.push(
        { name: r },
        { sku: r },
        { slug: r },
        { brand: r },
        { short_description: r },
        { part_number: r },
        { model_number: r },
        { voltage: r },
        { material: r },
        { 'technical_specs.key': r },
        { 'technical_specs.value': r },
        { 'in_box_items.item_name': r }
      );
    }

    const finalQuery = {
      ...filterQuery,
      $or: orClauses,
    };

    const docs = await ProductModel.find(finalQuery)
      .limit(limit * 3) // Fetch slightly more to perform relevance scoring
      .lean();

    // 6. Relevance Scoring and Ranking
    const queryLower = sanitizedQuery.toLowerCase();
    const scoredDocs = docs.map((doc: any) => {
      let score = 0;
      const skuLower = (doc.sku || '').toLowerCase();
      const nameLower = (doc.name || '').toLowerCase();
      const brandLower = (doc.brand || '').toLowerCase();

      // Highest score: Exact SKU match
      if (skuLower === queryLower) score += 100;
      else if (skuLower.startsWith(queryLower)) score += 60;
      else if (skuLower.includes(queryLower)) score += 40;

      // Exact name match or startsWith
      if (nameLower === queryLower) score += 90;
      else if (nameLower.startsWith(queryLower)) score += 50;
      else if (nameLower.includes(queryLower)) score += 35;

      // Token matches
      let matchedTokens = 0;
      for (const t of rawTokens) {
        if (nameLower.includes(t) || skuLower.includes(t)) {
          matchedTokens++;
          score += 15;
        }
      }
      if (matchedTokens === rawTokens.length) {
        score += 25; // Bonus for containing all query tokens
      }

      // Brand match
      if (brandLower.includes(queryLower)) score += 10;

      // Stock availability boost
      if ((doc.stock_quantity || 0) > 0) score += 5;

      return { doc, score };
    });

    // 7. Sort by score or requested sort
    if (opts?.sort === 'price_asc') {
      scoredDocs.sort((a, b) => (a.doc.price || 0) - (b.doc.price || 0));
    } else if (opts?.sort === 'price_desc') {
      scoredDocs.sort((a, b) => (b.doc.price || 0) - (a.doc.price || 0));
    } else if (opts?.sort === 'rating') {
      scoredDocs.sort((a, b) => (b.doc.rating || 0) - (a.doc.rating || 0));
    } else if (opts?.sort === 'newest') {
      scoredDocs.sort(
        (a, b) => new Date(b.doc.created_at).getTime() - new Date(a.doc.created_at).getTime()
      );
    } else {
      scoredDocs.sort((a, b) => b.score - a.score);
    }

    const sliced = scoredDocs.slice(0, limit).map((s) => s.doc);
    return sliced.map((d) => mapProductDoc(d));
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
      // Announcement bar
      announcementEnabled: Boolean(map.get('announcement_enabled')),
      announcementText: (map.get('announcement_text') as string | undefined) || '',
      announcementLink: (map.get('announcement_link') as string | undefined) || '',
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
      announcementEnabled: false,
      announcementText: '',
      announcementLink: '',
    };
  }
}
