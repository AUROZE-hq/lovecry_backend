import Image from 'next/image';
import Link from 'next/link';
import { formatMarketplacePrice, frontImage } from '@/lib/marketplace/display';
import type { MarketplaceProductView } from '@/lib/marketplace/types';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]';

export default function ProductCard({ product }: { product: MarketplaceProductView }) {
  const image = frontImage(product);

  return (
    <article className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0c0a12]">
      <div className="relative aspect-square bg-[#ececec]">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || product.name}
            fill
            className="object-contain p-6"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={!image.url.startsWith('/')}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-black/40">No image</div>
        )}
      </div>
      <div className="p-5">
        {product.badge ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f1328b]">{product.badge}</p>
        ) : null}
        <h3 className="font-hero mt-2 text-xl font-bold text-white">{product.name}</h3>
        {product.subtitle ? <p className="mt-1 text-sm text-white/55">{product.subtitle}</p> : null}
        <p className="mt-3 font-semibold text-white">
          {formatMarketplacePrice(product.priceCents, product.currency)}
        </p>
        <Link
          href={`/marketplace/${product.slug}`}
          className={`mt-4 inline-flex rounded-xl bg-[#f1328b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white ${FOCUS}`}
        >
          See Product
        </Link>
      </div>
    </article>
  );
}
