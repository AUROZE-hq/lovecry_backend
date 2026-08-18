import type { MarketplaceProductImageView, MarketplaceProductView } from './types';

export function formatMarketplacePrice(priceCents: number | null, currency = 'CAD'): string {
  const prefix = currency.toUpperCase() === 'CAD' ? 'CA$' : `${currency} `;
  if (priceCents == null) return `${prefix} —`;
  const dollars = priceCents / 100;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency.toUpperCase() === 'CAD' ? 'CAD' : currency,
    currencyDisplay: 'narrowSymbol',
  })
    .format(dollars)
    .replace(/^\$/, 'CA$');
}

export function frontImage(product: MarketplaceProductView): MarketplaceProductImageView | undefined {
  return product.images.find((image) => image.role === 'FRONT') || product.images[0];
}

export function backImage(product: MarketplaceProductView): MarketplaceProductImageView | undefined {
  return product.images.find((image) => image.role === 'BACK');
}

export function imageCaption(image: MarketplaceProductImageView): string {
  if (image.role === 'FRONT') return 'FRONT — LoveCry heart mark';
  if (image.role === 'BACK') return 'BACK — Soul Family message';
  return image.altText || 'Product image';
}

export function uniqueCategories(products: Array<{ category: string | null }>): string[] {
  return Array.from(
    new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))
  );
}

export function cartLineKey(productId: string, size: string): string {
  return `${productId}::${size}`;
}
