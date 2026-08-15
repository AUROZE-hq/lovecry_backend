'use client';

import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Public news surface — no invented stories, clinics, statistics, or testimonials.
 * Verified LoveCry updates will be published here when available.
 */
export default function NewsSection() {
  return (
    <section className="relative bg-[#050505] px-6 py-24 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/55"
        >
          News &amp; Updates
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.05, ease }}
          className="mt-4 text-3xl font-black tracking-tight sm:text-4xl"
        >
          Updates coming soon
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1, ease }}
          className="mt-5 text-base leading-relaxed text-white/65 sm:text-lg"
        >
          LoveCry will share verified organizational updates, community notices, and program news on
          this page as they become available. We do not publish placeholder stories or unverified
          statistics.
        </motion.p>
      </div>
    </section>
  );
}
