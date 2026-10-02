/**
 * Google Analytics 4 (GA4) & E-Commerce Event Tracker
 */

export interface GAItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
}

declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
  }
}

export function trackGAEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

export function trackViewItem(item: GAItem) {
  trackGAEvent('view_item', {
    currency: 'INR',
    value: item.price,
    items: [item],
  });
}

export function trackAddToCart(item: GAItem) {
  trackGAEvent('add_to_cart', {
    currency: 'INR',
    value: item.price * (item.quantity || 1),
    items: [item],
  });
}

export function trackBeginCheckout(items: GAItem[], totalValue: number) {
  trackGAEvent('begin_checkout', {
    currency: 'INR',
    value: totalValue,
    items,
  });
}

export function trackPurchase(transactionId: string, items: GAItem[], totalValue: number) {
  trackGAEvent('purchase', {
    transaction_id: transactionId,
    currency: 'INR',
    value: totalValue,
    items,
  });
}
