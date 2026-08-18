'use client';

import { useState } from 'react';
import { useMarketplaceCart } from '@/context/MarketplaceCartContext';
import { formatMarketplacePrice, frontImage } from '@/lib/marketplace/display';
import type { MarketplaceProductView } from '@/lib/marketplace/types';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]';

export default function ProductPurchasePanel({ product }: { product: MarketplaceProductView }) {
  const { addItem } = useMarketplaceCart();
  const [size, setSize] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const image = frontImage(product);

  function addToCart() {
    if (!product.inStock) return;
    if (!size) {
      setError('Please select a size.');
      setAdded(false);
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size,
      imageUrl: image?.url || '',
      priceCents: product.priceCents,
      currency: product.currency,
    });
    setError(null);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      {product.badge ? (
        <p className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f8c9de]">
          {product.badge}
        </p>
      ) : null}
      <h1 className="font-hero mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
        {product.name}
      </h1>
      {product.subtitle ? <p className="mt-2 text-lg text-white/80">{product.subtitle}</p> : null}
      <p className="mt-4 text-2xl font-bold text-white">
        {formatMarketplacePrice(product.priceCents, product.currency)}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-white/70">{product.description}</p>

      <div className="mt-6 border-t border-white/10 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Select size</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Select size">
          {product.sizes.map((option) => {
            const selected = size === option.label;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setSize(option.label);
                  setError(null);
                }}
                className={`min-w-[3rem] rounded-xl px-3 py-2.5 text-sm font-semibold ${FOCUS} ${
                  selected
                    ? 'bg-[#f1328b] text-white'
                    : 'border border-white/15 bg-[#0c0a12] text-white hover:border-white/30'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={addToCart}
        disabled={!product.inStock}
        className={`mt-6 w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white ${FOCUS} ${
          product.inStock
            ? 'bg-gradient-to-r from-[#f1328b] via-[#e42892] to-[#a52b87] hover:brightness-110'
            : 'cursor-not-allowed bg-white/15 text-white/70'
        }`}
      >
        {!product.inStock ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}
      </button>
      {added ? (
        <p role="status" className="mt-3 text-sm text-emerald-200">
          Added {product.name} ({size}) to cart.
        </p>
      ) : null}

      <p className="mt-4 text-xs text-white/40">♥ Official LoveCry merchandise · Front + back design</p>
    </div>
  );
}
