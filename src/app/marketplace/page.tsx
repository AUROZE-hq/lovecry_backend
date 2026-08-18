import Image from 'next/image';
import Link from 'next/link';
import MarketplaceHero from '@/components/marketplace/MarketplaceHero';
import ProductCard from '@/components/marketplace/ProductCard';
import { formatMarketplacePrice, frontImage, uniqueCategories } from '@/lib/marketplace/display';
import { getFeaturedProduct, getPublishedProducts } from '@/lib/marketplace/service';
import type { MarketplaceProductView } from '@/lib/marketplace/types';
import { isUnreachableDatabase } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Marketplace | LoveCry',
  description: 'Official LoveCry merchandise made to carry the message beyond the moment.',
};

export default async function MarketplacePage() {
  let products: MarketplaceProductView[] = [];
  let featured: MarketplaceProductView | null = null;
  try {
    [products, featured] = await Promise.all([getPublishedProducts(), getFeaturedProduct()]);
  } catch (err) {
    if (!isUnreachableDatabase(err)) throw err;
  }
  const featuredProduct = featured || products[0] || null;
  const remaining = featuredProduct ? products.filter((product) => product.id !== featuredProduct.id) : products;
  const categories = uniqueCategories(products);
  const featuredFront = featuredProduct ? frontImage(featuredProduct) : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <MarketplaceHero />

      <section className="px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {!featuredProduct ? (
            <div className="rounded-[20px] border border-white/[0.08] bg-[#0c0a12] px-6 py-16 text-center">
              <p className="font-hero text-2xl font-bold">New LoveCry merchandise is coming soon.</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
                Official products will appear here once they are published.
              </p>
            </div>
          ) : (
            <>
              <article className="grid items-center gap-8 overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0c0a12] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="relative aspect-square bg-[#ececec] lg:aspect-[4/5]">
                  {featuredFront ? (
                    <Image
                      src={featuredFront.url}
                      alt={featuredFront.altText || featuredProduct.name}
                      fill
                      className="object-contain p-8"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                      unoptimized={!featuredFront.url.startsWith('/')}
                    />
                  ) : null}
                </div>
                <div className="px-6 pb-8 lg:py-10 lg:pr-10">
                  {featuredProduct.badge ? (
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f1328b]">
                      {featuredProduct.badge}
                    </p>
                  ) : null}
                  <h2 className="font-hero mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    {featuredProduct.name}
                  </h2>
                  {featuredProduct.subtitle ? (
                    <p className="mt-2 text-white/70">{featuredProduct.subtitle}</p>
                  ) : null}
                  <p className="mt-4 text-xl font-bold">
                    {formatMarketplacePrice(featuredProduct.priceCents, featuredProduct.currency)}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-white/60">{featuredProduct.description}</p>
                  <Link
                    href={`/marketplace/${featuredProduct.slug}`}
                    className="mt-6 inline-flex rounded-xl bg-[#f1328b] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]"
                  >
                    See Product
                  </Link>
                </div>
              </article>

              {categories.length > 1 ? (
                <div className="mt-10 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/45"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              ) : null}

              {remaining.length ? (
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {remaining.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
