/**
 * Core product and catalog types for TTRC Store.
 * All monetary values are stored as integer paise (1 INR = 100 paise).
 */

export type ProductType = 'kit' | 'spare_part' | 'general';
export type ProductStatus = 'draft' | 'published' | 'archived';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string;
  sortOrder: number;
}

export interface ProductSpec {
  id: string;
  productId: string;
  key: string;
  value: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  pricePaise: number;
  mrpPaise: number | null;
  stockQty: number;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  type: ProductType;
  brand: string | null;
  categoryId: string;
  shortDescription: string;
  longDescription: string | null;
  pricePaise: number;      // integer — never trust client values
  mrpPaise: number | null; // original MRP; null means no discount
  gstPercent: number;      // 5 | 12 | 18 | 28
  hsnCode: string | null;
  stockQty: number;
  lowStockThreshold: number;
  weightGrams: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  tags: string[];
  status: ProductStatus;
  // SEO
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  // Relations (populated as needed)
  images?: ProductImage[];
  specs?: ProductSpec[];
  variants?: ProductVariant[];
  compatibleWith?: Pick<Product, 'id' | 'name' | 'slug' | 'type'>[];
}

/** Lightweight card representation for listing pages */
export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  type: ProductType;
  pricePaise: number;
  mrpPaise: number | null;
  primaryImageUrl: string | null;
  stockQty: number;
  averageRating: number | null;
  reviewCount: number;
}
