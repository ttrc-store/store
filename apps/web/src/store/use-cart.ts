import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeOrderTotals, calculateGstFromInclusive, GstBreakdown } from '@ttrc/shared';

export interface BulkPriceTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPricePaise: number;
}

export interface CartItem {
  id: string; // product id
  slug: string;
  name: string;
  pricePaise: number; // currently effective unit price in integer paise
  basePricePaise?: number; // base 1-unit selling price
  bulkPriceTiers?: BulkPriceTier[];
  unit?: string; // e.g. 'Piece'
  appliedTierLabel?: string;
  mrpPaise?: number;
  imageUrl: string;
  quantity: number;
  gstPercent: number;
  stockQty: number;
  productType: 'kit' | 'spare_part' | 'standard';
}

export function computeEffectiveUnitPrice(
  basePricePaise: number,
  tiers: BulkPriceTier[] | undefined,
  quantity: number
): { unitPricePaise: number; appliedTierLabel?: string } {
  if (!tiers || tiers.length === 0) {
    return { unitPricePaise: basePricePaise };
  }

  // Sort descending by minQuantity
  const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  const matched = sorted.find((t) => quantity >= t.minQuantity);
  if (matched) {
    return {
      unitPricePaise: matched.unitPricePaise,
      appliedTierLabel: `${matched.minQuantity}+ pcs tier`,
    };
  }

  return { unitPricePaise: basePricePaise };
}

export function getNextTierIncentive(item: CartItem): string | null {
  if (!item.bulkPriceTiers || item.bulkPriceTiers.length === 0) return null;

  // Sort ascending by minQuantity
  const sorted = [...item.bulkPriceTiers].sort((a, b) => a.minQuantity - b.minQuantity);
  const nextTier = sorted.find((t) => t.minQuantity > item.quantity);
  if (!nextTier) return null;

  const diff = nextTier.minQuantity - item.quantity;
  const basePrice = item.basePricePaise || item.pricePaise;
  const savingsPerUnit = Math.round((basePrice - nextTier.unitPricePaise) / 100);

  return `Add ${diff} more to unlock ₹${Math.round(nextTier.unitPricePaise / 100)} / ${item.unit || 'piece'}${
    savingsPerUnit > 0 ? ` (Save ₹${savingsPerUnit} / unit)` : ''
  }`;
}

interface CartStore {
  items: CartItem[];
  isDrawerOpen: boolean;
  couponCode: string | null;
  discountPaise: number;
  stateCode: string; // Default '33' for Tamil Nadu

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setCoupon: (code: string, discountPaise: number) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  setStateCode: (code: string) => void;

  // Computed totals helper
  getTotals: () => {
    subtotalPaise: number;
    discountPaise: number;
    shippingPaise: number;
    totalPaise: number;
    gstBreakdown: GstBreakdown;
    isFreeShipping: boolean;
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      couponCode: null,
      discountPaise: 0,
      stateCode: '33', // Tamil Nadu default

      addItem: (newItem) => {
        set((state) => {
          const basePrice = newItem.basePricePaise || newItem.pricePaise;
          const existingIdx = state.items.findIndex((i) => i.id === newItem.id);

          if (existingIdx > -1) {
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingIdx];
            const currentQty = currentItem.quantity;
            const newQty = Math.min(currentQty + newItem.quantity, newItem.stockQty);
            const { unitPricePaise, appliedTierLabel } = computeEffectiveUnitPrice(
              currentItem.basePricePaise || basePrice,
              currentItem.bulkPriceTiers || newItem.bulkPriceTiers,
              newQty
            );

            updatedItems[existingIdx] = {
              ...currentItem,
              quantity: newQty,
              pricePaise: unitPricePaise,
              appliedTierLabel,
            };
            return { items: updatedItems, isDrawerOpen: true };
          }

          const { unitPricePaise, appliedTierLabel } = computeEffectiveUnitPrice(
            basePrice,
            newItem.bulkPriceTiers,
            newItem.quantity
          );

          const itemToAdd: CartItem = {
            ...newItem,
            basePricePaise: basePrice,
            pricePaise: unitPricePaise,
            appliedTierLabel,
          };

          return { items: [...state.items, itemToAdd], isDrawerOpen: true };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.id === id) {
                const validQty = Math.max(1, Math.min(quantity, item.stockQty));
                const basePrice = item.basePricePaise || item.pricePaise;
                const { unitPricePaise, appliedTierLabel } = computeEffectiveUnitPrice(
                  basePrice,
                  item.bulkPriceTiers,
                  validQty
                );
                return {
                  ...item,
                  quantity: validQty,
                  pricePaise: unitPricePaise,
                  appliedTierLabel,
                };
              }
              return item;
            })
            .filter((item) => item.quantity > 0),
        }));
      },

      clearCart: () => {
        set({ items: [], couponCode: null, discountPaise: 0 });
      },

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      setCoupon: (code: string, discountPaise: number) => {
        set({ couponCode: code.toUpperCase().trim(), discountPaise });
      },

      applyCoupon: (code) => {
        const clean = code.trim().toUpperCase();
        if (clean === 'TTRC10') {
          const totals = get().getTotals();
          const discount = Math.round(totals.subtotalPaise * 0.1);
          set({ couponCode: 'TTRC10', discountPaise: discount });
          return { success: true, message: 'Coupon TTRC10 applied! 10% discount added.' };
        }
        if (clean === 'FREESHIP') {
          set({ couponCode: 'FREESHIP', discountPaise: 0 });
          return { success: true, message: 'Free Shipping coupon applied!' };
        }
        return { success: false, message: 'Invalid or expired coupon code.' };
      },

      removeCoupon: () => {
        set({ couponCode: null, discountPaise: 0 });
      },

      setStateCode: (code) => set({ stateCode: code }),

      getTotals: () => {
        const { items, discountPaise } = get();
        const subtotalPaise = items.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0);
        const isFreeShipping = subtotalPaise >= 99900;
        const shippingPaise = isFreeShipping ? 0 : 5900;
        const totals = computeOrderTotals({
          itemSubtotalPaise: subtotalPaise,
          shippingPaise,
          codChargePaise: 0,
          couponDiscountPaise: discountPaise,
        });
        const gstBreakdown = calculateGstFromInclusive(subtotalPaise, 18, false);
        return {
          ...totals,
          gstBreakdown,
          isFreeShipping,
        };
      },
    }),
    {
      name: 'ttrc-cart-storage',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discountPaise: state.discountPaise,
        stateCode: state.stateCode,
      }),
    }
  )
);
