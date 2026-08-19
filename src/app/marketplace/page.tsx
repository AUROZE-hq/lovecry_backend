import MarketplaceLanding from '@/components/marketplace/MarketplaceLanding';
import { getFeaturedProduct, getPublishedProducts } from '@/lib/marketplace/service';
import type { MarketplaceProductView } from '@/lib/marketplace/types';
import { isUnreachableDatabase } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Marketplace | LoveCry',
  description:
    'Explore LoveCry collections created to support children, families, community programs, and meaningful change.',
};

export default async function MarketplacePage() {
  let products: MarketplaceProductView[] = [];
  let featured: MarketplaceProductView | null = null;
  try {
    [products, featured] = await Promise.all([getPublishedProducts(), getFeaturedProduct()]);
  } catch (err) {
    if (!isUnreachableDatabase(err)) throw err;
  }

  return <MarketplaceLanding products={products} featuredProduct={featured} />;
}
