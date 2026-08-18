import type { MarketplaceCartItem } from './types';
import { cartLineKey } from './display';

export function mergeCartItem(
  items: MarketplaceCartItem[],
  incoming: Omit<MarketplaceCartItem, 'quantity'> & { quantity?: number }
): MarketplaceCartItem[] {
  const quantity = Math.max(1, incoming.quantity ?? 1);
  const key = cartLineKey(incoming.productId, incoming.size);
  const existing = items.find((item) => cartLineKey(item.productId, item.size) === key);
  if (!existing) {
    return [...items, { ...incoming, quantity }];
  }
  return items.map((item) =>
    cartLineKey(item.productId, item.size) === key
      ? { ...item, quantity: item.quantity + quantity }
      : item
  );
}

export function cartCount(items: MarketplaceCartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function parseStoredCart(raw: unknown): MarketplaceCartItem[] {
  if (!Array.isArray(raw)) return [];
  const items: MarketplaceCartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const value = entry as Record<string, unknown>;
    if (typeof value.productId !== 'string' || typeof value.slug !== 'string') continue;
    if (typeof value.name !== 'string' || typeof value.size !== 'string') continue;
    if (typeof value.imageUrl !== 'string' || typeof value.currency !== 'string') continue;
    const quantity = Number(value.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) continue;
    const priceCents =
      value.priceCents == null ? null : Number.isInteger(value.priceCents) ? Number(value.priceCents) : null;
    items.push({
      productId: value.productId,
      slug: value.slug,
      name: value.name,
      size: value.size,
      imageUrl: value.imageUrl,
      priceCents,
      currency: value.currency,
      quantity,
    });
  }
  return items;
}
