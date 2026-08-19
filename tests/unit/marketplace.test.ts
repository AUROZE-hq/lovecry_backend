import { describe, expect, it } from 'vitest';
import { cartCount, mergeCartItem, parseStoredCart } from '@/lib/marketplace/cart';
import { formatMarketplacePrice } from '@/lib/marketplace/display';
import { parsePriceToCents, marketplaceProductWriteSchema, centsToPriceInput } from '@/lib/marketplace/schemas';
import { roleHasPermission } from '@/lib/auth/permissions';
import type { MarketplaceCartItem } from '@/lib/marketplace/types';

const sample: Omit<MarketplaceCartItem, 'quantity'> = {
  productId: 'p1',
  slug: 'lovecry-soul-family-tee',
  name: 'LoveCry Soul Family Tee',
  size: 'S',
  imageUrl: '/ProductImageFront.png',
  priceCents: null,
  currency: 'CAD',
};

describe('marketplace display', () => {
  it('renders a dash when price is null', () => {
    expect(formatMarketplacePrice(null)).toBe('CA$ —');
  });

  it('formats CAD cents as dollars', () => {
    expect(formatMarketplacePrice(2800)).toContain('28');
  });
});

describe('marketplace cart', () => {
  it('counts total quantity, not line count', () => {
    const items = mergeCartItem([], { ...sample, quantity: 2 });
    const withSecondSize = mergeCartItem(items, { ...sample, size: 'M', quantity: 1 });
    expect(cartCount(withSecondSize)).toBe(3);
  });

  it('increments the same product and size', () => {
    const once = mergeCartItem([], sample);
    const twice = mergeCartItem(once, sample);
    expect(twice).toHaveLength(1);
    expect(twice[0]?.quantity).toBe(2);
  });

  it('resets invalid stored JSON-like payloads to empty', () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart({ bad: true })).toEqual([]);
  });
});

describe('marketplace validation', () => {
  it('parses optional dollar prices into cents', () => {
    expect(parsePriceToCents('')).toBeNull();
    expect(parsePriceToCents('28.00')).toBe(2800);
    expect(parsePriceToCents('-1')).toBe(-100);
  });

  it('converts cents back to a dollar input value', () => {
    expect(centsToPriceInput(null)).toBe('');
    expect(centsToPriceInput(2999)).toBe('29.99');
    expect(centsToPriceInput(2800)).toBe('28.00');
  });

  it('requires name, slug, description, images, and a size', () => {
    const parsed = marketplaceProductWriteSchema.safeParse({
      name: 'Tee',
      slug: 'lovecry-soul-family-tee',
      description: 'Official LoveCry merchandise tee.',
      currency: 'CAD',
      priceCents: null,
      frontImageUrl: '/ProductImageFront.png',
      backImageUrl: '/ProductImageBack.png',
      sizes: ['S'],
      status: 'PUBLISHED',
      featured: true,
      inStock: false,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects unsafe slugs', () => {
    const parsed = marketplaceProductWriteSchema.safeParse({
      name: 'Tee',
      slug: 'Not A Slug',
      description: 'Official LoveCry merchandise tee.',
      currency: 'CAD',
      priceCents: null,
      frontImageUrl: '/ProductImageFront.png',
      backImageUrl: '/ProductImageBack.png',
      sizes: ['S'],
      status: 'DRAFT',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('marketplace permissions', () => {
  it('grants write to ADMIN and SUPER_ADMIN only', () => {
    expect(roleHasPermission('SUPER_ADMIN', 'marketplace.write')).toBe(true);
    expect(roleHasPermission('ADMIN', 'marketplace.write')).toBe(true);
    expect(roleHasPermission('COUNSELLOR_ADMIN', 'marketplace.write')).toBe(false);
    expect(roleHasPermission('READ_ONLY', 'marketplace.write')).toBe(false);
  });
});
