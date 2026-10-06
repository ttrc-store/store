import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareProductItem {
  id: string;
  slug: string;
  name: string;
  pricePaise: number;
  mrpPaise?: number;
  imageUrl: string;
  brand?: string;
  sku: string;
  stockQty: number;
  unit?: string;
  categorySlug?: string;
  productType?: 'kit' | 'spare_part' | 'standard';
  // Technical specs
  voltage?: string;
  current?: string;
  power?: string;
  dimensions?: string;
  material?: string;
  operatingTemperature?: string;
  warranty?: string;
  technicalSpecs?: Array<{ key: string; value: string }>;
  bulkPriceTiers?: Array<{ minQuantity: number; unitPricePaise: number }>;
}

interface CompareStore {
  items: CompareProductItem[];
  addToCompare: (product: CompareProductItem) => { success: boolean; message: string };
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
}

const MAX_COMPARE_ITEMS = 4;

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToCompare: (product: CompareProductItem) => {
        const { items } = get();

        // Check if already in compare
        if (items.some((i) => i.id === product.id)) {
          return { success: false, message: 'Product already added to comparison' };
        }

        // Check maximum limit
        if (items.length >= MAX_COMPARE_ITEMS) {
          return {
            success: false,
            message: `You can compare a maximum of ${MAX_COMPARE_ITEMS} products at a time. Remove an item to add a new one.`,
          };
        }

        set({ items: [...items, product] });
        return { success: true, message: `${product.name} added to comparison` };
      },

      removeFromCompare: (id: string) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      clearCompare: () => {
        set({ items: [] });
      },

      isInCompare: (id: string) => {
        return get().items.some((i) => i.id === id);
      },
    }),
    {
      name: 'ttrc_product_compare',
    }
  )
);
