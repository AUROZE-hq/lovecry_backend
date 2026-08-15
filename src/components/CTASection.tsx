'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Heart, Users } from 'lucide-react';

const premium = [0.6, 0.01, 0.05, 0.95] as const;

export default function CTASection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [40, 0, -40]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.95, 1, 1, 0.98]);

  return (
    <section ref={ref} className="min-h-screen relative overflow-hidden flex items-center">
      {/* Animated gradient background - 3 layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#835BAF] to-[#DE517D]" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#DE517D] to-[#835BAF]"
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#835BAF] via-[#DE517D] to-[#835BAF]"
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      {/* Content */}
      <motion.div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full" style={{ y, scale }}>
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-white mb-6"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: premium }}
        >
          Make a Difference Today
        </motion.h2>

        <motion.p
          className="text-xl text-white/90 mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, delay: 0.15, ease: premium }}
        >
          Every contribution brings us one step closer to a world where everyone has the
          opportunity to thrive. Your generosity transforms lives and builds lasting hope.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, delay: 0.3, ease: premium }}
        >
          {/* Primary CTA - Donate Now */}
          <motion.a
            href="#donate"
            className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-white text-[#835BAF] font-bold shadow-xl"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 20px 60px rgba(255, 255, 255, 0.4)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Heart className="w-5 h-5" />
            Donate Now
          </motion.a>

          {/* Secondary CTA - Become a Volunteer */}
          <motion.a
            href="#volunteer"
            className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-white/20 backdrop-blur-md text-white font-bold border-2 border-white"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 20px 60px rgba(255, 255, 255, 0.3)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Users className="w-5 h-5" />
            Become a Volunteer
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
}
