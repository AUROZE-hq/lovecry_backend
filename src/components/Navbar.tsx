'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { orgInfo } from '@/lib/org-info';
import { aboutSubLinks } from '@/lib/about-nav';
import { useIntro } from '@/context/IntroContext';
import { useMarketplaceCart } from '@/context/MarketplaceCartContext';

type NavLink = {
  label: string;
  href: string;
  children?: readonly { label: string; href: string }[];
};

const navLinks: NavLink[] = [
  { label: 'Home', href: '/#home' },
  { label: 'About Us', href: '/about', children: aboutSubLinks },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Events', href: '/events' },
  { label: 'News', href: '/news' },
  { label: 'Book Now', href: '/book-now' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { cartCount } = useMarketplaceCart();
  const { isHomeIntroActive } = useIntro();
  const isHome = pathname === '/';
  const hiddenForIntro = isHome && isHomeIntroActive;
  const [isVisible, setIsVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setIsVisible(true);
    setHoveredIndex(null);
    setMobileAboutOpen(false);
    setAboutMenuOpen(false);
  };

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Do not hide navbar while mobile menu is open
      if (mobileOpen) {
        setIsVisible(true);
        lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 100) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mobileOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu when hash navigation changes, for /#about, /#home, /#book
  useEffect(() => {
    const handleHashChange = () => {
      setMobileOpen(false);
      setIsVisible(true);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Lock page scroll while mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      setIsVisible(true);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close mobile menu using Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const headerVisible = !hiddenForIntro && (isVisible || mobileOpen);

  return (
    <motion.header
      initial={false}
      animate={{
        y: headerVisible ? 0 : '-100%',
        opacity: headerVisible ? 1 : 0,
      }}
      transition={{
        duration: hiddenForIntro ? 0 : 0.95,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="site-header-gradient fixed top-0 left-0 right-0 z-50 pointer-events-none shadow-[0_4px_24px_rgba(76,29,111,0.35)]"
    >
      <nav className="pointer-events-auto relative w-full border-b border-white/15 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-px bg-white/25" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-px bg-black/20" aria-hidden />

        <div className="relative mx-auto flex h-[var(--site-header-height)] max-w-7xl items-center justify-between gap-4 lg:gap-6">
        <Link
          href="/#home"
          onClick={closeMobileMenu}
          className="flex items-center gap-2 text-white relative group/logo shrink-0"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex size-[1.95rem] items-center justify-center"
          >
            <div className="absolute inset-0 bg-[#f1328b] blur-[15px] opacity-20 group-hover/logo:opacity-50 transition-opacity" />
            <Image
              src="/LoveCryLogo.png"
              alt="LoveCry logo"
              width={32}
              height={32}
              className="relative z-10 size-[1.95rem] object-contain"
              priority
            />
          </motion.div>

          <div className="hidden min-w-0 flex-col leading-none xl:flex">
            <span className="text-lg font-black tracking-tighter whitespace-nowrap text-white brand-script">
              {orgInfo.shortName}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/85 mt-0.5">
              The Street Kids Organization
            </span>
          </div>
          <span className="text-lg font-black tracking-tighter whitespace-nowrap text-white brand-script xl:hidden">
            {orgInfo.shortName}
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex flex-1 items-center justify-center relative py-1">
          {navLinks.map((link, i) =>
            link.children ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  setAboutMenuOpen(true);
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  setAboutMenuOpen(false);
                }}
              >
                <Link
                  href={link.href}
                  className="relative flex items-center gap-1 px-3 py-2 text-[11px] font-bold text-white/90 hover:text-white uppercase tracking-[0.18em] transition-colors z-10 xl:px-4 xl:text-xs xl:tracking-widest"
                  aria-haspopup="menu"
                  aria-expanded={aboutMenuOpen}
                >
                  <span className="relative z-10">{link.label}</span>
                  <ChevronDown
                    className={`relative z-10 h-3 w-3 transition-transform ${aboutMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />

                  <AnimatePresence>
                    {hoveredIndex === i && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white/15 rounded-full z-0 border border-white/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </AnimatePresence>
                </Link>

                <AnimatePresence>
                  {aboutMenuOpen && (
                    <motion.div
                      role="menu"
                      aria-label="About Us submenu"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/90 p-2 shadow-2xl backdrop-blur-xl"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          role="menuitem"
                          className="block rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative px-3 py-2 text-[11px] font-bold text-white/90 hover:text-white uppercase tracking-[0.18em] transition-colors z-10 xl:px-4 xl:text-xs xl:tracking-widest"
              >
                <span className="relative z-10">{link.label}</span>

                <AnimatePresence>
                  {hoveredIndex === i && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/15 rounded-full z-0 border border-white/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </AnimatePresence>
              </Link>
            ),
          )}
        </div>

        {/* Right Actions — cart only; portal buttons live in FixedPortalActions */}
        <div className="hidden lg:flex items-center shrink-0">
          <Link
            href="/marketplace"
            className="relative text-white/90 hover:text-white p-2 transition-colors group/cart"
            aria-label={`Marketplace cart, ${cartCount} items`}
          >
            <ShoppingCart className="w-4 h-4 group-hover/cart:text-[#f1328b] transition-colors" />
            <span className="absolute top-1 right-1 min-w-3.5 h-3.5 px-0.5 bg-gradient-to-br from-[#f1328b] to-[#693492] text-white rounded-full text-[8px] font-black flex items-center justify-center border border-black/20">
              {cartCount}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden shrink-0">
          <Link
            href="/marketplace"
            className="relative text-white/90 hover:text-white p-2 transition-colors"
            aria-label={`Marketplace cart, ${cartCount} items`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute top-1 right-1 min-w-3.5 h-3.5 px-0.5 bg-gradient-to-br from-[#f1328b] to-[#693492] text-white rounded-full text-[8px] font-black flex items-center justify-center border border-black/20">
              {cartCount}
            </span>
          </Link>
          <button
            type="button"
            className="text-white p-2"
            onClick={() => {
              setMobileOpen((prev) => !prev);
              setIsVisible(true);
            }}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-navigation-menu"
            className="pointer-events-auto fixed left-0 right-0 lg:hidden bg-black/90 backdrop-blur-2xl border-y border-white/10 p-6 sm:p-8 shadow-2xl z-50 max-h-[calc(100svh-var(--site-header-height))] overflow-y-auto"
            style={{ top: 'var(--site-header-height)' }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col gap-5">
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label} className="border-b border-white/5 pb-4">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-white font-bold text-lg sm:text-xl uppercase tracking-widest active:text-[#f1328b] transition-colors"
                      aria-expanded={mobileAboutOpen}
                      aria-controls="mobile-about-submenu"
                      onClick={() => setMobileAboutOpen((prev) => !prev)}
                    >
                      {link.label}
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${mobileAboutOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>

                    <AnimatePresence>
                      {mobileAboutOpen && (
                        <motion.div
                          id="mobile-about-submenu"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 flex flex-col gap-2 overflow-hidden pl-4"
                        >
                          {link.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="py-2 text-sm font-bold uppercase tracking-widest text-white/70 active:text-[#f1328b] transition-colors"
                              onClick={closeMobileMenu}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-white font-bold text-lg sm:text-xl uppercase tracking-widest border-b border-white/5 pb-4 active:text-[#f1328b] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ),
              )}

              <Link
                href="/marketplace"
                onClick={closeMobileMenu}
                className="mt-2 flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white"
              >
                <ShoppingCart className="w-4 h-4" />
                Marketplace Cart
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}