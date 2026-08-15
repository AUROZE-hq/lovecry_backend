'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Calendar,
  Tag,
  ChevronRight,
  BookOpen,
  Newspaper,
  Heart,
} from 'lucide-react';
import Link from 'next/link';

const ease = [0.22, 1, 0.36, 1] as const;

/* ── DATA ─────────────────────────────────────────────────────────────── */
const allNews: Array<{
  id: number;
  category: string;
  date: string;
  title: string;
  subtitle: string;
  excerpt: string;
  body: string;
  image: string;
  tag: string;
  featured: boolean;
  readTime: string;
}> = [];

const categories = ['All'];

const categoryColors: Record<string, string> = {
  Education: '#835BAF',
  Healthcare: '#DE517D',
  Nutrition: '#16a34a',
  Events: '#d97706',
  'Success Stories': '#0891b2',
  'Volunteer Impact': '#7c3aed',
};

/* ── ARTICLE MODAL ────────────────────────────────────────────────────── */
function ArticleModal({ article, onClose }: { article: typeof allNews[0]; onClose: () => void }) {
  const color = categoryColors[article.category] ?? '#835BAF';
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="relative bg-white rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        initial={{ scale: 0.9, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 40, opacity: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        {/* Hero image */}
        <div className="relative h-64">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span
            className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-[11px] font-bold text-white uppercase tracking-wider"
            style={{ backgroundColor: color }}
          >
            {article.category}
          </span>
        </div>
        {/* Body */}
        <div className="p-8">
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{article.date}</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{article.readTime}</span>
            <span className="flex items-center gap-1.5" style={{ color }}><Tag className="w-3.5 h-3.5" />{article.tag}</span>
          </div>
          <h2 className="font-newspaper text-2xl md:text-3xl text-gray-900 leading-tight mb-2">{article.title}</h2>
          <p className="text-base font-semibold text-gray-500 mb-6">{article.subtitle}</p>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{article.excerpt}</p>
          <div
            className="w-12 h-1 rounded-full mb-4"
            style={{ background: `linear-gradient(to right, ${color}, #835BAF)` }}
          />
          <p className="text-sm text-gray-600 leading-relaxed">{article.body}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── MAIN PAGE ────────────────────────────────────────────────────────── */
export default function NewsPageClient() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<typeof allNews[0] | null>(null);
  const categoryNavRef = useRef<HTMLElement>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const nav = categoryNavRef.current;
    if (!nav) return;

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const idleDelay = 5000;
    const slowSpeedPxPerSec = 12;
    const resetDuration = 320;

    let idleTimer: number | null = null;
    let edgeTimer: number | null = null;
    let frameId: number | null = null;
    let resetFrameId: number | null = null;
    let lastFrameTime: number | null = null;
    let isAutoScrolling = false;
    let isResetting = false;

    const clearAllTimers = () => {
      if (idleTimer) {
        window.clearTimeout(idleTimer);
        idleTimer = null;
      }
      if (edgeTimer) {
        window.clearTimeout(edgeTimer);
        edgeTimer = null;
      }
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      if (resetFrameId !== null) {
        window.cancelAnimationFrame(resetFrameId);
        resetFrameId = null;
      }
      isAutoScrolling = false;
      isResetting = false;
      lastFrameTime = null;
    };

    const startIdleTimer = () => {
      if (!mobileQuery.matches) return;

      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }

      idleTimer = window.setTimeout(() => {
        const maxScrollLeft = nav.scrollWidth - nav.clientWidth;
        if (maxScrollLeft <= 1) return;

        isAutoScrolling = true;
        scrollPositionRef.current = nav.scrollLeft;
        lastFrameTime = null;

        const step = (now: number) => {
          if (!mobileQuery.matches || isResetting) {
            isAutoScrolling = false;
            lastFrameTime = null;
            return;
          }

          const max = nav.scrollWidth - nav.clientWidth;
          if (lastFrameTime === null) {
            lastFrameTime = now;
          }

          const elapsed = Math.max(0, (now - lastFrameTime) / 1000);
          lastFrameTime = now;

          scrollPositionRef.current = Math.min(max, scrollPositionRef.current + (slowSpeedPxPerSec * elapsed));
          nav.scrollLeft = Math.round(scrollPositionRef.current);

          if (scrollPositionRef.current >= max - 0.5) {
            scrollPositionRef.current = max;
            nav.scrollLeft = Math.round(max);
            isAutoScrolling = false;
            lastFrameTime = null;
            edgeTimer = window.setTimeout(() => {
              if (!mobileQuery.matches) return;

              isResetting = true;
              const start = scrollPositionRef.current;
              const delta = start || 1;
              const startedAt = performance.now();

              const animateReset = (now: number) => {
                const progress = Math.min((now - startedAt) / resetDuration, 1);
                const nextPosition = start - (delta * progress);
                scrollPositionRef.current = nextPosition;
                nav.scrollLeft = Math.round(nextPosition);

                if (progress < 1) {
                  resetFrameId = window.requestAnimationFrame(animateReset);
                  return;
                }

                scrollPositionRef.current = 0;
                nav.scrollLeft = 0;
                isResetting = false;
                startIdleTimer();
              };

              resetFrameId = window.requestAnimationFrame(animateReset);
            }, idleDelay);
            return;
          }

          frameId = window.requestAnimationFrame(step);
        };

        frameId = window.requestAnimationFrame(step);
      }, idleDelay);
    };

    const resetOnInteraction = () => {
      clearAllTimers();
      scrollPositionRef.current = nav.scrollLeft;
      startIdleTimer();
    };

    const pauseOnInteraction = () => {
      clearAllTimers();
      scrollPositionRef.current = nav.scrollLeft;
      startIdleTimer();
    };

    const handleScroll = () => {
      scrollPositionRef.current = nav.scrollLeft;
      if (!isAutoScrolling && !isResetting) {
        pauseOnInteraction();
      }
    };

    const handleTouchStart = () => {
      resetOnInteraction();
    };

    const handleTouchMove = () => {
      resetOnInteraction();
    };

    const handlePointerDown = () => {
      resetOnInteraction();
    };

    const handleWheel = () => {
      resetOnInteraction();
    };

    if (mobileQuery.matches) {
      scrollPositionRef.current = nav.scrollLeft;
      startIdleTimer();
    }

    nav.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });

    const handleMediaChange = () => {
      clearAllTimers();
      scrollPositionRef.current = nav.scrollLeft;
      if (mobileQuery.matches) {
        startIdleTimer();
      }
    };

    mobileQuery.addEventListener('change', handleMediaChange);

    return () => {
      clearAllTimers();
      nav.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('wheel', handleWheel);
      mobileQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const filtered = allNews.filter((n) => {
    const matchCat = activeCategory === 'All' || n.category === activeCategory;
    const matchSearch =
      search === '' ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const headline = filtered[0];
  const secondary = filtered.slice(1, 3);
  const grid = filtered.slice(3);

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  } as const;

  const cardVariant = {
    hidden: { opacity: 0, y: 12, scale: 0.995 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
    hover: { y: -6, scale: 1.03, transition: { duration: 0.25, ease } },
  } as const;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#040206] via-[#050305] to-[#050505] font-sans pt-20 text-white">

        {/* ── NEWSPAPER MASTHEAD ─────────────────────────────────────────── */}
        <header className="bg-transparent border-b border-white/5 relative">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {/* Top strip */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200 text-[11px] text-gray-400 font-medium">
              <span className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-1.5 hover:text-[#835BAF] transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back to Home
                </Link>
              </span>
              <span className="hidden md:block tracking-widest uppercase text-[10px]">
                &ldquo;Building Trust · Restoring Hope · Empowering the Future&rdquo;
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                April 10, 2026 · Issue No. 38
              </span>
            </div>

            {/* Masthead title area */}
              <div className="py-6 text-center relative">
                <motion.div
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.25, 0.6, 0.25], x: [0, -12, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                  className="pointer-events-none absolute -left-24 -top-16 z-0 w-48 h-48 rounded-full bg-gradient-to-tr from-[#693492]/30 to-[#f1328b]/18 blur-3xl"
                />
                <motion.div
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.12, 0.4, 0.12], x: [0, 12, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                  className="pointer-events-none absolute -right-32 -top-6 z-0 w-72 h-72 rounded-full bg-gradient-to-bl from-[#f1328b]/22 to-[#693492]/16 blur-4xl"
                />
              {/* Decorative rule lines */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#835BAF]" />
                <Newspaper className="w-5 h-5 text-[#835BAF]" />
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#835BAF]" />
              </div>
              <motion.h1
                className="font-newspaper text-4xl md:text-7xl tracking-tight text-white leading-none mb-1 relative z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
              >
                <span className="gradient-text brand-script">LoveCry</span>{' '}
                <span className="text-white/90 italic">Chronicle</span>
              </motion.h1>
              <p className="text-xs text-white/60 uppercase tracking-[0.3em] mt-2 relative z-10">
                The Official Journal of LoveCry Charitable Trust
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-[3px] bg-gradient-to-r from-transparent via-[#835BAF] to-transparent" />
              </div>
            </div>

            {/* Category Nav */}
            <nav ref={categoryNavRef} className="flex flex-wrap md:flex-nowrap w-full touch-pan-x items-center gap-2 md:gap-1 overflow-x-auto no-scrollbar pb-3 pt-1 [-webkit-overflow-scrolling:touch] relative z-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative px-4 py-1.5 text-xs font-bold whitespace-nowrap rounded-full transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-[#835BAF] to-[#DE517D] text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {/* Search */}
              <div className="ml-auto md:ml-0 w-full md:w-auto flex items-center justify-end md:justify-start">
                <div className="w-full md:w-auto flex items-center gap-2 bg-white/5 rounded-full px-3 py-2 md:py-1.5 min-w-0 md:min-w-[160px]">
                  <Search className="w-4 h-4 text-white/60 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search stories…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-sm md:text-xs text-white outline-none placeholder-white/60 w-full"
                  />
                </div>
              </div>
            </nav>
          </div>
        </header>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                className="text-center py-24 text-gray-400"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold">Organizational updates coming soon.</p>
                <p className="text-sm mt-1 max-w-md mx-auto">
                  News and program updates from LoveCry will be published here as they become available.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={activeCategory + search}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* ── ROW 1: HEADLINE + 2 SECONDARY ─────────────────────── */}
                {headline && (
                  <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 mb-8">
                    {/* HEADLINE */}
                    <motion.article
                      key={headline.id}
                      className="group cursor-pointer"
                      onClick={() => setSelectedArticle(headline)}
                      variants={cardVariant}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                    >
                      <div className="relative rounded-3xl overflow-hidden bg-[#070607] border border-white/6 shadow-[0_10px_60px_rgba(105,52,146,0.12)] h-full flex flex-col">
                        <div className="relative h-56 sm:h-64 md:h-72 lg:h-80 overflow-hidden shrink-0">
                          <img
                            src={headline.image}
                            alt={headline.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          {/* EXCLUSIVE badge */}
                          <div className="absolute top-4 left-4 flex items-center gap-2">
                            <span className="px-3 py-1 bg-gradient-to-r from-[#835BAF] to-[#DE517D] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                              ★ Exclusive
                            </span>
                            <span
                              className="px-3 py-1 text-white text-[10px] font-bold uppercase tracking-widest rounded-full"
                              style={{ backgroundColor: categoryColors[headline.category] ?? '#835BAF' }}
                            >
                              {headline.category}
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                            <h2
                              className="font-newspaper text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white leading-tight mb-2 group-hover:text-purple-200 transition-colors"
                              style={{ textShadow: '0 6px 24px rgba(9,6,12,0.6)' }}
                            >
                              {headline.title}
                            </h2>
                            <p className="text-white/80 text-sm sm:text-base line-clamp-3">{headline.excerpt}</p>
                          </div>
                        </div>
                        <div className="p-4 sm:p-5 flex items-center justify-between border-t border-white/6">
                          <div className="flex items-center gap-4 text-xs text-white/60">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{headline.date}</span>
                            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{headline.readTime}</span>
                          </div>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-[#835BAF] group-hover:gap-2.5 transition-all text-white/90">
                            Read Full Story <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </motion.article>

                    {/* SECONDARY 2 */}
                    <div className="flex flex-col gap-6">
                      {secondary.map((item, i) => {
                        const color = categoryColors[item.category] ?? '#835BAF';
                        return (
                              <motion.article
                            key={item.id}
                            className="group cursor-pointer flex-1 bg-[#080708] rounded-3xl overflow-hidden border border-white/6 shadow-[0_6px_30px_rgba(105,52,146,0.06)] flex flex-col"
                            onClick={() => setSelectedArticle(item)}
                            variants={cardVariant}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            transition={{ duration: 0.5, delay: i * 0.08, ease }}
                          >
                                  <div className="relative h-40 md:h-44 overflow-hidden shrink-0">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                              <span
                                className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                                style={{ backgroundColor: color }}
                              >
                                {item.category}
                              </span>
                            </div>
                            <div className="p-4 flex flex-col flex-1 justify-between">
                              <div>
                                <h3 className="font-newspaper text-sm text-white leading-snug mb-1 group-hover:text-[#835BAF] transition-colors line-clamp-2">
                                  {item.title}
                                </h3>
                                <p className="text-xs text-white/70 line-clamp-2">{item.excerpt}</p>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-[11px] text-white/60 flex items-center gap-1"><Calendar className="w-3 h-3" />{item.date}</span>
                                <span className="text-[11px] font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color }}>
                                  Read <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ── HORIZONTAL DIVIDER ────────────────────────────────── */}
                {grid.length > 0 && (
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-400">More Stories</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}

                {/* ── GRID: remaining articles ──────────────────────────── */}
                {grid.length > 0 && (
                  <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {grid.map((item, i) => {
                      const color = categoryColors[item.category] ?? '#835BAF';
                      return (
                        <motion.article
                          key={item.id}
                          className="group cursor-pointer bg-[#080708] rounded-2xl overflow-hidden border border-white/6 shadow-[0_6px_26px_rgba(105,52,146,0.06)] flex flex-col"
                          onClick={() => setSelectedArticle(item)}
                          variants={cardVariant}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          transition={{ duration: 0.5, delay: i * 0.08, ease }}
                        >
                          <div className="relative h-40 sm:h-44 overflow-hidden shrink-0">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <span
                              className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                              style={{ backgroundColor: color }}
                            >
                              {item.category}
                            </span>
                          </div>
                          <div className="p-5 flex flex-col flex-1 justify-between">
                            <div>
                              <h3 className="font-newspaper text-base text-white leading-snug mb-2 group-hover:text-[#835BAF] transition-colors line-clamp-2">
                                {item.title}
                              </h3>
                              <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">{item.excerpt}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2 text-[11px] text-white/60">
                                <Calendar className="w-3 h-3" />{item.date}
                              </div>
                              <span className="text-[11px] font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color }}>
                                Read <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                          <div
                            className="h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: `linear-gradient(to right, ${color}, #835BAF)` }}
                          />
                        </motion.article>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>

      {/* ── ARTICLE MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
