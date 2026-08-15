'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

const standard = [0.4, 0, 0.2, 1] as const;

const stats = [
  {
    label: 'Compassionate Support',
    description:
      'Expanding access to compassionate counselling and emotional support for individuals, youth, and families experiencing trauma, hardship, or crisis.',
  },
  {
    label: 'Community Connection',
    description:
      'Building partnerships that strengthen mental-health awareness, volunteer engagement, outreach, and access to community resources.',
  },
  {
    label: 'Accessible Wellness Services',
    description:
      'Developing accessible counselling, wellness, education, and support services for people from diverse circumstances and backgrounds.',
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function ImpactStats() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const imageOpacity = useTransform(scrollYProgress, [0, 0.12, 0.45, 1], [0, 0.92, 1, 1]);
  const imageScale = useTransform(scrollYProgress, [0, 0.22, 0.7, 1], [1.58, 1.36, 1.12, 1]);
  const imageY = useTransform(scrollYProgress, [0, 0.24, 1], [-220, -90, 28]);

  return (
    <section ref={ref} className="relative z-20 -mt-44 min-h-screen bg-gradient-to-b from-gray-50 to-white px-6 pt-60 pb-24 flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl shadow-2xl overflow-hidden h-[600px]">
          {/* Background Image with Parallax */}
          <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale, opacity: imageOpacity }}>
            <Image
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80"
              alt="Children standing together smiling"
              fill
              sizes="(max-width: 768px) 92vw, 80vw"
              className="object-cover"
            />
          </motion.div>

          {/* Gradient Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />

          {/* Stats Cards */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/30 text-white text-center relative overflow-hidden group"
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.9, delay: 0.2 + index * 0.1, ease: standard }}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(131, 91, 175, 0.5)' }}
                >
                  {/* Flowing gradient background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#835BAF]/20 to-[#DE517D]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    style={{ backgroundSize: '200% 200%' }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="relative z-10">
                    <div className="text-xl font-bold mb-3">{stat.label}</div>
                    <p className="text-sm leading-relaxed text-white/80">{stat.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
