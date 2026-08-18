'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { backImage, frontImage, imageCaption } from '@/lib/marketplace/display';
import type { MarketplaceProductImageView, MarketplaceProductView } from '@/lib/marketplace/types';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]';

export default function ProductGallery({ product }: { product: MarketplaceProductView }) {
  const images = useMemo(() => {
    const ordered = [frontImage(product), backImage(product)].filter(
      (image): image is MarketplaceProductImageView => Boolean(image)
    );
    return ordered.length ? ordered : product.images;
  }, [product]);
  const [activeId, setActiveId] = useState(images[0]?.id);

  const active = images.find((image) => image?.id === activeId) || images[0];

  if (!active) return null;

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        {images.map((image) =>
          image ? (
            <figure key={image.id} className="hidden lg:block">
              <div className="relative aspect-square overflow-hidden rounded-[20px] border border-white/10 bg-[#ececec]">
                <Image
                  src={image.url}
                  alt={image.altText || product.name}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  unoptimized={!image.url.startsWith('/')}
                />
              </div>
              <figcaption className="mt-3 text-xs uppercase tracking-[0.16em] text-white/45">
                {imageCaption(image)}
              </figcaption>
            </figure>
          ) : null
        )}
      </div>

      <div className="lg:hidden">
        <div className="relative aspect-square overflow-hidden rounded-[20px] border border-white/10 bg-[#ececec]">
          <Image
            src={active.url}
            alt={active.altText || product.name}
            fill
            className="object-contain p-5"
            sizes="100vw"
            unoptimized={!active.url.startsWith('/')}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {images.map((image) =>
            image ? (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveId(image.id)}
                aria-pressed={image.id === active.id}
                aria-label={image.altText || imageCaption(image)}
                className={`relative aspect-square overflow-hidden rounded-xl bg-[#ececec] ${FOCUS} ${
                  image.id === active.id ? 'ring-2 ring-[#f1328b] ring-offset-2 ring-offset-[#050505]' : 'border border-white/10'
                }`}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="40vw"
                  unoptimized={!image.url.startsWith('/')}
                />
              </button>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
