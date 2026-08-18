import { notFound } from 'next/navigation';
import MarketplaceHero from '@/components/marketplace/MarketplaceHero';
import ProductGallery from '@/components/marketplace/ProductGallery';
import ProductPurchasePanel from '@/components/marketplace/ProductPurchasePanel';
import { getPublishedProductBySlug } from '@/lib/marketplace/service';
import { isUnreachableDatabase } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  try {
    const product = await getPublishedProductBySlug(slug);
    if (!product) return { title: 'Product | LoveCry Marketplace' };
    return {
      title: `${product.name} | LoveCry Marketplace`,
      description: product.description,
    };
  } catch (err) {
    if (!isUnreachableDatabase(err)) throw err;
    return { title: 'Product | LoveCry Marketplace' };
  }
}

export default async function MarketplaceProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  let product = null;
  try {
    product = await getPublishedProductBySlug(slug);
  } catch (err) {
    if (!isUnreachableDatabase(err)) throw err;
  }
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <MarketplaceHero compact />

      <section className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <ProductGallery product={product} />
          <ProductPurchasePanel product={product} />
        </div>
      </section>

      {(product.messageEyebrow || product.messageTitle || product.messageBody) && (
        <section className="border-t border-white/10 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              {product.messageEyebrow ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f1328b]">
                  {product.messageEyebrow}
                </p>
              ) : null}
              {product.messageTitle ? (
                <h2 className="font-hero mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  {product.messageTitle}
                </h2>
              ) : null}
              {product.messageSubtitle ? (
                <p className="mt-3 text-lg text-white/80">{product.messageSubtitle}</p>
              ) : null}
            </div>
            <div>
              {product.messageBody ? (
                <p className="text-sm leading-relaxed text-white/65">{product.messageBody}</p>
              ) : null}
              <p className="mt-4 text-xs text-white/40">Front: LoveCry heart · Back: Soul Family message</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
