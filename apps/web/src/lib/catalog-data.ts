import { ProductType, ProductStatus } from '@ttrc/shared';
import { ProductCardProps } from '@/components/store/product-card';

export interface CatalogProduct {
  id: string;
  slug: string;
  sku: string;
  name: string;
  type: ProductType;
  brand: string;
  categoryId: string;
  shortDescription: string;
  longDescription: string;
  pricePaise: number;
  mrpPaise: number;
  gstPercent: number;
  hsnCode: string;
  stockQty: number;
  lowStockThreshold: number;
  weightGrams: number;
  countryOfOrigin: string;
  status: ProductStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  rating: number;
  reviewCount: number;
  imageUrls: string[];
  specs?: Array<{ key: string; value: string }>;
  compatibleSpareIds?: string[];
  compatibleKitIds?: string[];
  videoEmbedUrl?: string;
  relatedProductIds?: string[];
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [];

export function addProductToCatalog(product: CatalogProduct): void {
  const existingIdx = CATALOG_PRODUCTS.findIndex((p) => p.id === product.id || p.slug === product.slug);
  if (existingIdx >= 0) {
    CATALOG_PRODUCTS[existingIdx] = product;
  } else {
    CATALOG_PRODUCTS.unshift(product);
  }
}

export function removeProductFromCatalog(id: string): void {
  const idx = CATALOG_PRODUCTS.findIndex((p) => p.id === id);
  if (idx >= 0) {
    CATALOG_PRODUCTS.splice(idx, 1);
  }
}

export function toProductCardProps(product: CatalogProduct): ProductCardProps {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    productType: product.type === 'general' ? 'standard' : product.type,
    pricePaise: product.pricePaise,
    mrpPaise: product.mrpPaise,
    rating: product.rating,
    reviewCount: product.reviewCount,
    imageUrl: product.imageUrls?.[0] || '/products/robo-race-kit.png',
    stockQty: product.stockQty,
  };
}
