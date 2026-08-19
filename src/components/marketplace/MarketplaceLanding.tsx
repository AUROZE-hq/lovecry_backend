'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, HeartHandshake, PackageOpen, ShoppingBag } from 'lucide-react';
import { formatMarketplacePrice, frontImage, uniqueCategories } from '@/lib/marketplace/display';
import type { MarketplaceProductView } from '@/lib/marketplace/types';

const ease = [0.22, 1, 0.36, 1] as const;

const impactCards = [
  {
    icon: PackageOpen,
    title: 'Purpose-led products',
    description: 'Products selected to support LoveCry’s mission and community programs.',
  },
  {
    icon: HeartHandshake,
    title: 'Community-powered impact',
    description: 'Every Marketplace purchase helps strengthen the work LoveCry delivers.',
  },
] as const;

type Props = {
  products: MarketplaceProductView[];
  featuredProduct: MarketplaceProductView | null;
};

export default function MarketplaceLanding({ products, featuredProduct }: Props) {
  const reduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = useMemo(() => ['All', ...uniqueCategories(products)], [products]);
  const displayProducts =
    activeCategory === 'All' ? products : products.filter((product) => product.category === activeCategory);

  function scrollToGrid() {
    document.getElementById('marketplace-grid')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] font-sans pt-20 text-white">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(241,50,139,0.18) 1.5px, transparent 1.5px)',
            backgroundSize: '80px 80px',
            opacity: 0.35,
          }}
        />
        <div className="absolute top-[20%] left-[-5%] hidden select-none whitespace-nowrap text-[20rem] font-black uppercase leading-none tracking-tighter text-white/[0.02] rotate-[-15deg] md:block">
          Marketplace
        </div>
        <div className="absolute bottom-[10%] right-[-5%] hidden select-none whitespace-nowrap text-[15rem] font-black uppercase leading-none tracking-tighter text-white/[0.02] rotate-[10deg] md:block">
          Support
        </div>
        {!reduceMotion ? (
          <motion.div
            className="absolute left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-[#f1328b]/25 to-transparent"
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
        ) : null}
        <motion.div
          className="absolute right-[15%] top-[40%] h-64 w-64 rounded-full border border-[#693492]/20"
          animate={reduceMotion ? undefined : { scale: [1, 1.1, 1], rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[#f1328b]/30" />
        </motion.div>
        <div className="absolute right-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-[#693492]/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#f1328b]/10 blur-[120px]" />
        <div className="absolute left-10 top-40 hidden font-mono text-[10px] uppercase tracking-widest text-white/20 lg:block">
          Sec_Alpha / 34.0921N
        </div>
        <div className="absolute bottom-40 right-10 hidden font-mono text-[10px] uppercase tracking-widest text-white/20 lg:block">
          Impact_Node / 118.2437W
        </div>
      </div>

      <div className="relative z-10">
        <section className="relative mx-auto max-w-[1400px] px-6 pb-24 pt-16 md:pt-32">
          <div className="mb-12 hidden items-center gap-8 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 md:flex">
            <span className="text-[#c084fc]">#NewArrival</span>
            <span className="opacity-20">/</span>
            <span>#SustainableImpact</span>
            <span className="opacity-20">/</span>
            <span>#GlobalCommunity</span>
            <span className="opacity-20">/</span>
            <span className="text-[#f1328b]">#LovecryMarket</span>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease }}
            >
              <h1 className="mb-8 select-none text-[12vw] font-black uppercase leading-[0.8] tracking-tighter lg:text-[10rem]">
                Core
                <br />
                <span className="border-t-4 border-white/80 text-transparent" style={{ WebkitTextStroke: '2px rgba(255,255,255,.8)' }}>
                  Impact
                </span>
              </h1>
              <div className="flex items-end gap-12">
                <p className="max-w-[300px] text-sm font-medium leading-relaxed text-white/55 md:text-base">
                  Every product carries purpose. Explore LoveCry collections created to support children, families,
                  community programs, and meaningful change.
                </p>
                <motion.div
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: 100 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="mb-2 h-px bg-white/70"
                />
              </div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease }}
              className="group relative aspect-[4/5]"
            >
              <div className="absolute -inset-4 z-0 scale-95 -rotate-2 rounded-[3rem] bg-white/[0.04]" />
              <div className="relative z-10 h-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#ececec] shadow-2xl">
                <Image
                  src="/ProductImageFront.png"
                  alt="LoveCry featured Marketplace product"
                  fill
                  priority
                  className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>

              {featuredProduct ? (
                <motion.div whileHover={reduceMotion ? undefined : { scale: 1.1, rotate: 5 }} className="absolute bottom-8 right-8 z-20">
                  <Link
                    href={`/marketplace/${featuredProduct.slug}`}
                    className="flex items-center gap-3 overflow-hidden rounded-full bg-[#f1328b] p-6 text-white shadow-2xl"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">Featured Item</span>
                    <span className="rounded-full bg-white/20 p-2">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </Link>
                </motion.div>
              ) : null}

              <div className="absolute top-1/2 -right-8 hidden -translate-y-1/2 rounded-l-2xl bg-[#693492] px-4 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-white [writing-mode:vertical-rl] lg:block">
                Purpose with every product
              </div>
            </motion.div>
          </div>
        </section>

        <section className="sticky top-[var(--site-header-height)] z-40 border-y border-white/10 bg-[#050505]/80 py-6 backdrop-blur-xl">
          <div className="mx-auto max-w-[1400px] overflow-x-auto px-6 no-scrollbar">
            <div className="flex items-center gap-12">
              <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.4em] text-white/35">
                Browse Collections
              </span>
              <div className="flex items-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`whitespace-nowrap rounded-full px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                      activeCategory === category
                        ? 'scale-105 bg-[#f1328b] text-white shadow-lg'
                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="marketplace-grid"
          className="mx-auto max-w-[1400px] scroll-mt-[calc(var(--site-header-height)+6rem)] px-6 py-32"
        >
          {!displayProducts.length ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-8 py-20 text-center">
              <p className="text-3xl font-black uppercase tracking-tighter">New LoveCry products are coming soon.</p>
              <p className="mx-auto mt-4 max-w-lg text-sm text-white/50">
                Published Marketplace collections will appear here as they are added.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-x-12 gap-y-24 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {displayProducts.map((product, idx) => {
                  const image = frontImage(product);
                  const isStaggered = idx % 3 === 1;
                  const indexLabel = String(idx + 1).padStart(2, '0');
                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className={`group relative w-full ${isStaggered ? 'lg:translate-y-24' : ''}`}
                    >
                      <div className="pointer-events-none absolute -top-12 left-0 flex select-none items-baseline gap-4 text-[10rem] font-black leading-none text-white/[0.03]">
                        {indexLabel}
                        <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/20">
                          PRD / {indexLabel}
                        </span>
                      </div>

                      <div className="relative mb-8 aspect-[4/5] overflow-hidden rounded-[3rem] border border-white/10 bg-[#ececec] transition-all duration-700 group-hover:shadow-[0_40px_100px_rgba(241,50,139,0.12)]">
                        {image ? (
                          <Image
                            src={image.url}
                            alt={image.altText || product.name}
                            fill
                            className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            unoptimized={!image.url.startsWith('/')}
                          />
                        ) : null}

                        <Link
                          href={`/marketplace/${product.slug}`}
                          aria-label={`View ${product.name}`}
                          className="absolute bottom-6 right-6 flex h-16 w-16 translate-y-0 items-center justify-center rounded-3xl bg-white text-[#050505] opacity-100 shadow-xl transition-all duration-500 hover:bg-[#693492] hover:text-white md:translate-y-20 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
                        >
                          <ShoppingBag className="h-6 w-6" />
                        </Link>

                        {product.badge ? (
                          <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
                            {product.badge}
                          </div>
                        ) : null}
                      </div>

                      <div className="px-4">
                        <div className="mb-4 flex items-end justify-between">
                          <div className="space-y-1">
                            {product.category ? (
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f1328b]">
                                {product.category}
                              </p>
                            ) : null}
                            <h3 className="text-2xl font-black uppercase leading-none tracking-tighter text-white">
                              {product.name}
                            </h3>
                          </div>
                          <span className="text-xl font-black text-white/35">
                            / {formatMarketplacePrice(product.priceCents, product.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 border-t border-white/10 py-4">
                          <p className="flex-1 text-xs font-bold uppercase tracking-widest text-white/40">
                            {product.subtitle || 'Purpose-led LoveCry product'}
                          </p>
                          <Link
                            href={`/marketplace/${product.slug}`}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white hover:text-[#f1328b]"
                          >
                            See Product{' '}
                            <ArrowRight className="h-4 w-4 rounded-full bg-[#693492]/30 p-1 text-white" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        <section className="rounded-t-[5rem] bg-[#0c0810] px-6 py-24 text-white sm:py-32 lg:py-48">
          <div className="mx-auto grid max-w-[1400px] items-center gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <span className="mb-12 inline-block rounded-full border border-white/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.4em]">
                100% Transparency
              </span>
              <h2 className="mb-12 text-6xl font-black uppercase leading-[0.9] tracking-tighter md:text-8xl">
                Fresh drops <br />
                <span className="text-[#f1328b]">&amp;</span> All-time
                <br />
                <span className="opacity-40">Favorites</span>
              </h2>
              <button
                type="button"
                onClick={scrollToGrid}
                className="flex items-center gap-4 rounded-full bg-[#693492] px-10 py-5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:translate-x-2 hover:bg-[#693492]/90"
              >
                View All Products <ArrowRight className="h-5 w-5 rounded-full bg-white/10 p-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {impactCards.map((reason) => {
                const Icon = reason.icon;
                return (
                  <div
                    key={reason.title}
                    className="group rounded-[3rem] border border-white/10 bg-white/5 p-10 transition-colors hover:bg-white/10 sm:p-12"
                  >
                    <Icon className="mb-8 h-12 w-12 text-[#f1328b] transition-transform group-hover:scale-110" />
                    <h4 className="mb-4 text-xl font-black uppercase tracking-tighter">{reason.title}</h4>
                    <p className="text-sm font-medium leading-relaxed text-white/50">{reason.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
