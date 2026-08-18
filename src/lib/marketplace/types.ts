import type { MarketplaceImageRole, MarketplaceProductStatus } from '@prisma/client';

export type MarketplaceProductImageView = {
  id: string;
  url: string;
  altText: string | null;
  role: MarketplaceImageRole;
  sortOrder: number;
};

export type MarketplaceProductSizeView = {
  id: string;
  label: string;
  sortOrder: number;
  active: boolean;
};

export type MarketplaceProductView = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string;
  badge: string | null;
  category: string | null;
  currency: string;
  priceCents: number | null;
  status: MarketplaceProductStatus;
  featured: boolean;
  inStock: boolean;
  messageEyebrow: string | null;
  messageTitle: string | null;
  messageSubtitle: string | null;
  messageBody: string | null;
  createdAt: Date;
  updatedAt: Date;
  images: MarketplaceProductImageView[];
  sizes: MarketplaceProductSizeView[];
};

export type MarketplaceCartItem = {
  productId: string;
  slug: string;
  name: string;
  size: string;
  imageUrl: string;
  priceCents: number | null;
  currency: string;
  quantity: number;
};

export const MARKETPLACE_SIZE_OPTIONS = ['S', 'M', 'L', 'XL', '2XL'] as const;
export const MARKETPLACE_CART_STORAGE_KEY = 'lovecry_marketplace_cart_v1';
