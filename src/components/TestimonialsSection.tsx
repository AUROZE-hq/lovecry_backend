'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const commitmentCards = [
  {
    title: 'Safe and Respectful Support',
    text: 'We aim to create welcoming spaces where people feel heard, respected, and supported.',
  },
  {
    title: 'Trauma-Informed Care',
    text: 'Our programs are being developed around compassion, dignity, safety, and individual needs.',
  },
  {
    title: 'Stronger Communities',
    text: 'We work to connect individuals and families with guidance, wellness services, and meaningful community support.',
  },
];

function CardBooster() {
  return (
    <div
      style={{ right: '-238px', top: '68%' }}
      className="absolute -translate-y-1/2 w-[300px] h-[300px] pointer-events-none hidden lg:block z-30 overflow-visible"
    >
      <motion.div
        animate={{
          y: [-2, 2, -2],
          x: [-1, 1, -1],
        }}
        transition={{
          repeat: Infinity,
          duration: 0.18,
          ease: 'linear',
        }}
        className="flex h-full w-full items-center justify-center"
      >
        <video
          src="/walk video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-contain"
          style={{
            filter: 'brightness(1.6) contrast(2.2)',
            mixBlendMode: 'screen',
          }}
        />
      </motion.div>
    </div>
  );
}

function CommitmentCard({
  card,
  index,
}: {
  card: (typeof commitmentCards)[0];
  index: number;
}) {
  const isLast = index === commitmentCards.length - 1;

  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      className="relative mx-6 h-[390px] w-[310px] shrink-0 overflow-visible shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-shadow group hover:shadow-[#835BAF]/20"
    >
      {isLast && <CardBooster />}

      <div className="pointer-events-none absolute inset-0 z-10 rounded-[8px] border border-white/10 bg-gradient-to-br from-[#121212]/90 to-[#050505]/95 backdrop-blur-md" />

      <div className="absolute left-0 right-0 top-0 z-20 h-[2px] rounded-t-[8px] bg-gradient-to-r from-[#835BAF] via-[#DE517D] to-[#835BAF] opacity-70 transition-opacity group-hover:opacity-100" />

      <div className="relative z-20 flex h-full flex-col justify-end p-8">
        <h3 className="mb-4 text-xl font-black tracking-tight text-white md:text-2xl">{card.title}</h3>
        <p className="text-base leading-relaxed text-white/75 md:text-lg">{card.text}</p>
      </div>

      <div className="pointer-events-none absolute -bottom-24 -left-24 z-20 h-48 w-48 rounded-full bg-[#DE517D]/10 blur-[80px] transition-colors group-hover:bg-[#DE517D]/20" />
    </motion.div>
  );
}

export default function TestimonialsSection() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const sArrivalY = useTransform(scrollYProgress, [0, 0.25], [-280, 0]);
  const sArrivalX = useTransform(scrollYProgress, [0, 0.25], [120, 0]);
  const sArrivalScale = useTransform(scrollYProgress, [0, 0.25], [1.5, 1]);
  const sArrivalOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);

  const headingOpacity = useTransform(scrollYProgress, [0.15, 0.3], [0, 1]);
  const headingLiftY = useTransform(scrollYProgress, [0.25, 0.4], [0, -280]);
  const impactRotate = useTransform(scrollYProgress, [0.32, 0.45], [0, 90]);
  const impactX = useTransform(scrollYProgress, [0.32, 0.45], [0, 40]);
  const impactY = useTransform(scrollYProgress, [0.32, 0.45], [0, -40]);
  const trackX = useTransform(scrollYProgress, [0.48, 0.98], ['100vw', '-200vw']);

  return (
    <section ref={containerRef} className="relative h-[600vh] bg-[#050505]">
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_50%,rgba(164,87,219,0.05)_0%,transparent_50%)]" />
        </div>

        <motion.div
          style={{ x: trackX }}
          className="absolute top-[60%] z-10 flex -translate-y-1/2 items-center pl-[45vw]"
        >
          {commitmentCards.map((card, index) => (
            <CommitmentCard key={card.title} card={card} index={index} />
          ))}
        </motion.div>

        <div className="relative z-20 mx-auto flex h-full w-full max-w-7xl items-center px-6 pt-44">
          <motion.div
            className="relative z-20 flex flex-col items-start pointer-events-none"
            style={{ y: headingLiftY }}
          >
            <motion.span
              className="mb-6 block text-xs font-bold uppercase tracking-[0.6em] text-[#e8d5ff] drop-shadow-[0_0_15px_rgba(232,213,255,0.3)]"
              style={{ opacity: headingOpacity }}
            >
              Legacy of Compassion
            </motion.span>

            <motion.h2 className="relative m-0 flex flex-col items-start justify-start px-4 text-5xl font-black uppercase leading-[0.8] tracking-tighter text-white md:text-[6rem] lg:text-[8rem]">
              <div className="flex items-center">
                <motion.span
                  style={{
                    display: 'inline-block',
                    y: sArrivalY,
                    x: sArrivalX,
                    scale: sArrivalScale,
                    opacity: sArrivalOpacity,
                    transformOrigin: 'center center',
                  }}
                >
                  S
                </motion.span>
                <motion.span className="inline-block" style={{ opacity: headingOpacity }}>
                  TORIES
                </motion.span>
              </div>

              <div className="flex items-center">
                <motion.span className="inline-block" style={{ opacity: headingOpacity }}>
                  OF
                </motion.span>
                <motion.span
                  className="inline-block"
                  style={{
                    opacity: headingOpacity,
                    rotate: impactRotate,
                    x: impactX,
                    y: impactY,
                    transformOrigin: 'left center',
                    marginLeft: '0.4em',
                  }}
                >
                  IMPACT
                </motion.span>
              </div>
            </motion.h2>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-64 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-64 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-48 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
    </section>
  );
}
