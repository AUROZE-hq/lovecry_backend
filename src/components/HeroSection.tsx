'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

const premium = [0.6, 0.01, 0.05, 0.95] as const;

const headlineLines = [
  { text: 'Building Trust,', delay: 0.1 },
  { text: 'Restoring Hope,', delay: 0.25 },
  { text: 'Empowering the Future', delay: 0.4 },
];

export default function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.35,
  });

  const imageY = useTransform(smoothProgress, [0, 0.4, 1], [0, 150, 520]);
  const imageX = useTransform(smoothProgress, [0, 0.45, 1], [0, -70, -170]);
  const imageScale = useTransform(smoothProgress, [0, 0.45, 1], [1, 1.2, 1.55]);
  const imageOpacity = useTransform(smoothProgress, [0, 0.55, 0.82, 1], [1, 1, 0.95, 0]);
  const imageRadius = useTransform(smoothProgress, [0, 1], [24, 18]);

  return (
    <section
      id="home"
      ref={ref}
      className="min-h-screen relative bg-gradient-to-br from-gray-50 to-purple-50"
    >
      {/* Decorative gradient blob */}
      <motion.div
        className="absolute top-1/4 left-0 w-96 h-96 bg-gradient-to-br from-[#835BAF]/20 to-[#DE517D]/20 rounded-full blur-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: premium }}
      />

      {/* Decorative SVG Motion Path */}
      <div className="absolute inset-x-0 top-0 h-[300vh] z-0 pointer-events-none opacity-80 overflow-x-clip">
        <svg
          viewBox="0 0 1000 3000"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="#3B82F6" floodOpacity="0.95" />
          </filter>
          <motion.path
            d="M-50,-10 C300,300 900,200 850,700 C800,1200 100,1000 150,1600 C200,2200 950,2000 900,2600 C850,3200 50,2800 -50,3200"
            stroke="#DE517D"
            strokeWidth="24"
            strokeLinecap="round"
            filter="url(#glow)"
            style={{ pathLength: smoothProgress }}
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 min-h-screen flex items-center">
        <div className="grid md:grid-cols-2 gap-16 items-center w-full">
          {/* Left Column - Text */}
          <div>
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8">
              {headlineLines.map((line, i) => (
                <motion.span
                  key={i}
                  className="block gradient-text"
                  initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.0, delay: line.delay, ease: premium }}
                >
                  {line.text}
                </motion.span>
              ))}
            </h1>

            {/* Subtext */}
            <motion.p
              className="text-xl md:text-2xl text-gray-600 max-w-xl leading-relaxed mb-10"
              initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.6, ease: premium }}
            >
              Join us in creating lasting change for women and children worldwide
            </motion.p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.a
                href="#donate"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-[#835BAF] to-[#DE517D] text-white font-semibold shadow-xl text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8, ease: premium }}
                whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(131, 91, 175, 0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                Donate Now
              </motion.a>

              <motion.a
                href="#portal"
                className="px-8 py-4 rounded-full bg-white text-[#835BAF] font-semibold border-2 border-[#835BAF] shadow-lg text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.95, ease: premium }}
                whileHover={{ scale: 1.03, backgroundColor: '#835BAF', color: '#ffffff' }}
                whileTap={{ scale: 0.97 }}
              >
                Join Portal
              </motion.a>

              <motion.a
                href="#events"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-[#DE517D] to-[#835BAF] text-white font-semibold shadow-xl text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1, ease: premium }}
                whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(222, 81, 125, 0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                Explore Events
              </motion.a>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: premium }}
          >
            {/* Shadow layer */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#835BAF]/30 to-[#DE517D]/30 rounded-3xl blur-2xl" />

            {/* Floating light effect */}
            <motion.div
              className="absolute -inset-8 bg-white/40 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div style={{ x: imageX, y: imageY, scale: imageScale, opacity: imageOpacity }}>
              <motion.img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80"
                alt="Happy children playing together"
                className="relative rounded-3xl shadow-2xl w-full object-cover h-[400px] md:h-[500px]"
                style={{ borderRadius: imageRadius }}
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
