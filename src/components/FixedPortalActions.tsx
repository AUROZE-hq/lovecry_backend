'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, HandHeart, User } from 'lucide-react';
import { useIntro } from '@/context/IntroContext';

const fixedActions = [
  {
    href: '/donate',
    label: 'Donate',
    icon: Heart,
    filled: true,
    glow: 'rgba(241,50,139,0.45)',
  },
  {
    href: '/donor',
    label: 'Donor Portal',
    icon: HandHeart,
    filled: false,
    glow: 'rgba(189,51,142,0.4)',
  },
  {
    href: '/member',
    label: 'Member Portal',
    icon: User,
    filled: false,
    glow: 'rgba(105,52,146,0.45)',
  },
] as const;

export default function FixedPortalActions() {
  const pathname = usePathname();
  const { isHomeIntroActive } = useIntro();
  const hiddenForIntro = pathname === '/' && isHomeIntroActive;

  return (
    <motion.aside
      aria-label="Quick actions"
      initial={false}
      animate={{
        x: hiddenForIntro ? 80 : 0,
        opacity: hiddenForIntro ? 0 : 1,
      }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: hiddenForIntro ? 0 : 0.15 }}
      className="fixed right-3 top-1/2 z-40 -translate-y-1/2 sm:right-4 lg:right-5"
    >
      <div className="relative">
        {/* Smoke / glow backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -inset-y-12"
        >
          <motion.div
            animate={{ opacity: [0.28, 0.5, 0.28], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-[999px] bg-[#f1328b]/25 blur-3xl"
          />
          <motion.div
            animate={{ opacity: [0.2, 0.38, 0.2], scale: [1.05, 0.92, 1.05] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            className="absolute inset-2 rounded-[999px] bg-[#693492]/30 blur-[42px]"
          />
          <motion.div
            animate={{ opacity: [0.12, 0.22, 0.12], y: [-6, 6, -6] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="absolute inset-x-2 top-1/2 h-24 -translate-y-1/2 rounded-full bg-white/10 blur-2xl"
          />
          <div className="absolute inset-0 rounded-[999px] bg-gradient-to-b from-black/20 via-transparent to-black/30 blur-xl" />
        </div>

        <div className="relative flex flex-col gap-3.5 py-1">
          {fixedActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={action.href}
                  aria-label={action.label}
                  title={action.label}
                  className="group relative flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-[0_0_22px_var(--btn-glow),0_10px_28px_rgba(0,0,0,0.55)] backdrop-blur-md transition hover:scale-105 hover:border-[#f1328b]/60 hover:bg-gradient-to-br hover:from-[#693492]/90 hover:to-[#f1328b]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]"
                  style={{ ['--btn-glow' as string]: action.glow }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-60"
                  />
                  <span
                    aria-hidden
                    className="absolute -inset-1 rounded-full opacity-0 blur-md transition group-hover:opacity-100"
                    style={{ backgroundColor: action.glow }}
                  />

                  <Icon
                    className={`relative z-10 h-5 w-5 ${action.filled ? 'fill-white' : ''}`}
                    aria-hidden
                  />

                  <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full border border-white/15 bg-black/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition group-hover:opacity-100 group-focus-visible:opacity-100 lg:block">
                    {action.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
}
