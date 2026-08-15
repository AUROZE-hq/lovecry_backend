'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { animate, motion, useInView, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { Heart } from 'lucide-react';
import CinematicSequence from './CinematicSequence';

const premium = [0.6, 0.01, 0.05, 0.95] as const;
const standard = [0.4, 0, 0.2, 1] as const;

const headlineLines = [
  { text: 'Building Trust,', delay: 0.1 },
  { text: 'Restoring Hope,', delay: 0.25 },
  { text: 'Empowering the Future', delay: 0.4 },
];

type ImpactStat = {
  label: string;
  description?: string;
  hideValue?: boolean;
  value?: number;
  suffix?: string;
};

const stats: ImpactStat[] = [
  {
    label: 'Compassionate Support',
    description:
      'Expanding access to compassionate counselling and emotional support for individuals, youth, and families experiencing trauma, hardship, or crisis.',
    hideValue: true,
  },
  {
    label: 'Community Connection',
    description:
      'Building partnerships that strengthen mental-health awareness, volunteer engagement, outreach, and access to community resources.',
    hideValue: true,
  },
  {
    label: 'Accessible Wellness Services',
    description:
      'Developing accessible counselling, wellness, education, and support services for people from diverse circumstances and backgrounds.',
    hideValue: true,
  },
];

type SlotRect = { x: number; y: number; w: number; h: number };
type Slots = { hero: SlotRect; stats: SlotRect };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

function AnimatedCounter({ value, suffix, shouldStart }: { value: number; suffix: string; shouldStart: boolean }) {
  const [displayValue, setDisplayValue] = useState("0");
  const count = useMotionValue(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Sync the motion value to a display string for React to render
    return count.on('change', (latest) => {
      setDisplayValue(Math.floor(latest).toLocaleString());
    });
  }, [count]);

  useEffect(() => {
    if (shouldStart && !hasStarted) {
      setHasStarted(true);
      animate(count, value, {
        duration: 5.0,
        ease: [0.16, 1, 0.3, 1], // Premium expo-out ease
      });
    }
  }, [shouldStart, hasStarted, count, value]);

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  );
}

export default function HeroImpactSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const heroSlotRef = useRef<HTMLDivElement | null>(null);
  const statsSlotRef = useRef<HTMLDivElement | null>(null);
  const [slots, setSlots] = useState<Slots | null>(null);
  const [sectionSize, setSectionSize] = useState({ w: 1200, h: 2400 });
  const [windowSize, setWindowSize] = useState({ w: 1200, h: 800 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120, // High viscosity "Mercury" feel
    damping: 45,    // Heavy damping to eliminate all bounce
    mass: 1,
  });

  const measureSlots = useCallback(() => {
    if (!sectionRef.current || !heroSlotRef.current || !statsSlotRef.current) return;

    const sectionRect = sectionRef.current.getBoundingClientRect();
    const heroRect = heroSlotRef.current.getBoundingClientRect();
    const statsRect = statsSlotRef.current.getBoundingClientRect();
    setSectionSize({
      w: sectionRect.width,
      h: sectionRect.height,
    });
    setWindowSize({
      w: window.innerWidth,
      h: window.innerHeight,
    });

    setSlots({
      hero: {
        x: heroRect.left - sectionRect.left,
        y: heroRect.top - sectionRect.top,
        w: heroRect.width,
        h: heroRect.height,
      },
      stats: {
        x: statsRect.left - sectionRect.left,
        y: statsRect.top - sectionRect.top,
        w: statsRect.width,
        h: statsRect.height,
      },
    });
  }, []);

  const scrollAnimationRef = useRef<any>(null);

  const stopScrollAnimation = useCallback(() => {
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.stop();
      scrollAnimationRef.current = null;
    }
    isAssisting.current = false;
  }, []);

  const scrollToStats = useCallback(() => {
    if (sectionRef.current && slots) {
      const statsTop = sectionRef.current.offsetTop + slots.stats.y;
      const centerOffset = (window.innerHeight - slots.stats.h) / 2;
      const target = statsTop - centerOffset;

      isAssisting.current = true;
      (window as any).lenis?.scrollTo(target, {
        duration: 4.5, // Harmonized with global smoothness
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
        onComplete: () => { isAssisting.current = false; }
      });
    }
  }, [slots]);

  const scrollToHero = useCallback(() => {
    if (sectionRef.current) {
      const target = sectionRef.current.offsetTop;
      isAssisting.current = true;
      (window as any).lenis?.scrollTo(target, {
        duration: 3.5,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        onComplete: () => { isAssisting.current = false; }
      });
    }
  }, []);

  const lastScrollY = useRef(0);
  const isAssisting = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      lastScrollY.current = currentScrollY;

      // Extract raw progress from the motion value
      const progress = scrollYProgress.get();

      // Lock-in logic: Trigger almost immediately for a "direct" transition
      if (!isAssisting.current) {
        if (direction === 'down' && progress > 0.005 && progress < 0.35) {
          scrollToStats();
        } else if (direction === 'up' && progress > 0.02 && progress < 0.5) {
          scrollToHero();
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Stop programmatic assist if the user manual scrolls
    const interrupt = () => {
      if (isAssisting.current) {
        (window as any).lenis?.stop();
        (window as any).lenis?.start();
        isAssisting.current = false;
      }
    };

    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('mousedown', interrupt, { passive: true });
    window.addEventListener('keydown', interrupt, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('mousedown', interrupt);
      window.removeEventListener('keydown', interrupt);
    };
  }, [scrollYProgress, scrollToStats, scrollToHero]);

  useEffect(() => {
    measureSlots();
    window.addEventListener('resize', measureSlots);

    const observer = new ResizeObserver(() => measureSlots());
    if (sectionRef.current) observer.observe(sectionRef.current);
    if (heroSlotRef.current) observer.observe(heroSlotRef.current);
    if (statsSlotRef.current) observer.observe(statsSlotRef.current);

    return () => {
      window.removeEventListener('resize', measureSlots);
      observer.disconnect();
    };
  }, [measureSlots]);

  const syncProgress = useTransform(smoothProgress, (value) =>
    clamp((value - 0.02) / 0.96, 0, 1)
  );
  // High-performance line timing: finishes at 48%, before image stabilizes at 55%
  const lineProgress = useTransform(syncProgress, [0, 0.48], [0, 1]);

  const imageTravel = useTransform(syncProgress, [0, 0.55], [0, 1]); // Synced arrival at 55% of scroll
  const statsArrival = useTransform(syncProgress, [0.55, 0.65], [0, 1]); // Quick rise into hold position
  const statsExit = useTransform(syncProgress, [0.88, 1], [0, 1]); // Cinematic Hold until the very end

  const linePath = useMemo(() => {
    if (!slots) {
      return 'M-120,420 C120,280 320,260 500,300 C760,360 900,520 850,820 C790,1160 640,1420 660,1960 C675,2150 700,2310 725,2460';
    }

    const { hero, stats } = slots;
    const startX = -120;
    const startY = hero.y + hero.h * 0.4;
    const loopTopY = hero.y - 40;
    const loopBottomY = hero.y + hero.h + 80;
    const loopRightX = hero.x + hero.w + 120;
    const loopLeftX = hero.x - 80;

    const downX = stats.x + stats.w * 0.56;
    const downY = stats.y + 60;
    const tailY = Math.min(sectionSize.h + 260, downY + 520);
    const tailX = sectionSize.w + 140; // Aiming for the far right edge

    return [
      `M${startX},${startY}`,
      // Entry curve towards the loop
      `C${startX + 200},${startY} ${loopLeftX - 100},${loopBottomY - 40} ${loopLeftX},${loopBottomY}`,
      // The drawing's clockwise loop (Bottom -> Right -> Top -> Left)
      `C${loopRightX},${loopBottomY + 40} ${loopRightX + 100},${loopTopY} ${hero.x + hero.w * 0.5},${loopTopY}`,
      `C${loopLeftX},${loopTopY} ${loopLeftX - 50},${hero.y + hero.h * 0.4} ${hero.x + 120},${hero.y + hero.h * 0.6}`,
      // Descent into section 2 (Crossing the entry path)
      `C${hero.x + 300},${hero.y + hero.h + 100} ${downX},${downY - 200} ${downX},${downY}`,
      // Tail sweep to the right edge
      `C${downX},${downY + 140} ${tailX - 200},${tailY - 200} ${tailX},${tailY}`,
    ].join(' ');
  }, [slots, sectionSize.h]);

  const imageX = useTransform(imageTravel, (travel) => {
    if (!slots) return 0;
    const slotWidth = lerp(slots.hero.w, slots.stats.w, travel);
    return lerp(slots.hero.x, slots.stats.x, travel) + slotWidth * 0.05;
  });

  const imageY = useTransform(syncProgress, (progress) => {
    if (!slots) return 0;

    // True Viewport height mathematically handles 1080p, 1024px, and mobile
    const vh = windowSize.h;
    const arrivalPoint = 0.55;
    const travelProgress = Math.min(progress / arrivalPoint, 1);

    // Center point logic: (Viewport Height - Element Height) / 2
    // Factoring in 0.9 scale for overall 10% reduction
    const currentSlotHeight = lerp(slots.hero.h, slots.stats.h, travelProgress);
    const centeredY = (vh - currentSlotHeight * 0.9) / 2;
    const startY = slots.hero.y + slots.hero.h * 0.05;

    if (progress >= arrivalPoint) {
      return (vh - slots.stats.h * 0.9) / 2;
    }

    // Direct "Elastic" path
    return lerp(startY, centeredY, travelProgress);
  });

  const imageWidth = useTransform(imageTravel, (travel) => {
    if (!slots) return 0;
    return lerp(slots.hero.w, slots.stats.w, travel) * 0.9;
  });

  const imageHeight = useTransform(imageTravel, (travel) => {
    if (!slots) return 0;
    return lerp(slots.hero.h, slots.stats.h, travel) * 0.9;
  });

  // Liquid Flow Engine: Replaces Squash/Stretch with Metamorphic Depth
  const imageScaleX = useTransform(imageTravel, [0, 0.5, 1], [1, 0.92, 1]); // Slight narrowing mid-flow
  const imageScaleY = useTransform(imageTravel, [0, 0.5, 1], [1, 1.08, 1]); // Slight elongation
  const imageOpacity = useTransform(imageTravel, [0, 0.4, 0.6, 1], [1, 0.7, 0.7, 1]); // Ghostly portal effect
  const motionBlur = useTransform(imageTravel, [0, 0.2, 0.5, 0.8, 1], [0, 4, 12, 4, 0]); // Cinematic blur

  const imageRadius = useTransform(imageTravel, [0, 1], [24, 32]);
  const imageScale = useTransform(imageTravel, [0, 0.3, 0.72, 1], [1, 1.12, 1.03, 1]);
  const imageOverlayOpacity = useTransform(syncProgress, [0, 0.4, 0.55, 0.72], [0.12, 0.2, 0.35, 0.5]);

  // Dimensional Flip: 360 degree card flip mid-flight (returns to front side)
  const paperRotateX = useTransform(imageTravel, [0, 0.5, 1], [0, 15, 0]);
  const paperRotateY = useTransform(imageTravel, [0, 1], [0, 360]); // Full revolution
  const paperRotateZ = useTransform(imageTravel, [0, 0.5, 1], [0, 10, 0]);

  // Dynamic Shadow Engine: Blooms and softens based on "height"
  const paperShadow = useTransform(imageTravel, (t) => {
    const height = Math.sin(t * Math.PI); // 0 -> 1 -> 0
    const blur = 10 + height * 60;
    const spread = height * 10;
    const opacity = 0.1 + height * 0.15;
    return `0 ${20 + height * 40}px ${blur}px ${spread}px rgba(0,0,0,${opacity})`;
  });

  // Mercury Displacement Filter: Stronger ripple mid-flight, must return to EXACT 0
  const waveScale = useTransform(imageTravel, [0, 0.2, 0.5, 0.8, 1], [0, 15, 35, 10, 0]);

  // Combined Opacity: Fades in during arrival, holds through cinematic phase, fades out during exit
  const statsContentOpacity = useTransform(syncProgress, [0.55, 0.65, 0.88, 1], [0, 1, 1, 0]);
  const statsContentY = useTransform(statsArrival, [0, 1], [120, 0]);
  const statsContentX = useTransform(statsExit, [0, 1], [0, 450]); // More distinct right-side departure
  const lineExitX = useTransform(statsExit, [0, 1], [0, 600]); // Fast sweep to the right

  // Staggered Hero Exit: Using smoothProgress for consistent "Liquid" feel
  const h1Exit1Y = useTransform(smoothProgress, [0, 0.15], [0, -140]);
  const h1Exit2Y = useTransform(smoothProgress, [0.005, 0.155], [0, -140]);
  const h1Exit3Y = useTransform(smoothProgress, [0.01, 0.16], [0, -140]);

  const h1Exit1Op = useTransform(smoothProgress, [0, 0.12], [1, 0]);
  const h1Exit2Op = useTransform(smoothProgress, [0.005, 0.125], [1, 0]);
  const h1Exit3Op = useTransform(smoothProgress, [0.01, 0.13], [1, 0]);
  
  const h1ExitScale = useTransform(smoothProgress, [0, 0.15], [1, 0.85]);

  // Subtext and Buttons move LEFT with consistent smoothness
  const subExitX = useTransform(smoothProgress, [0, 0.08], [0, -220]);
  const subExitOp = useTransform(smoothProgress, [0, 0.05], [1, 0]);

  const btnRowExitX = useTransform(smoothProgress, [0.01, 0.09], [0, -220]);
  const btnRowExitOp = useTransform(smoothProgress, [0.01, 0.06], [1, 0]);

  const h1PointerEvents1 = useTransform(h1Exit1Op, (v) => (v === 0 ? 'none' : 'auto'));
  const h1PointerEvents2 = useTransform(h1Exit2Op, (v) => (v === 0 ? 'none' : 'auto'));
  const h1PointerEvents3 = useTransform(h1Exit3Op, (v) => (v === 0 ? 'none' : 'auto'));

  const h1Exits = [
    { y: h1Exit1Y, opacity: h1Exit1Op, scale: h1ExitScale, pointerEvents: h1PointerEvents1 },
    { y: h1Exit2Y, opacity: h1Exit2Op, scale: h1ExitScale, pointerEvents: h1PointerEvents2 },
    { y: h1Exit3Y, opacity: h1Exit3Op, scale: h1ExitScale, pointerEvents: h1PointerEvents3 },
  ];

  const subPointerEvents = useTransform(subExitOp, (v) => (v === 0 ? 'none' : 'auto'));
  const btnRowPointerEvents = useTransform(btnRowExitOp, (v) => (v === 0 ? 'none' : 'auto'));

  const combinedFilter = useTransform(motionBlur, (v) => `blur(${v}px) url(#hero-image-wave)`);

  const [shouldStartCounters, setShouldStartCounters] = useState(false);
  useEffect(() => {
    return statsArrival.on('change', (v) => {
      if (v > 0.1) setShouldStartCounters(true);
    });
  }, [statsArrival]);

  return (
    <section id="home" ref={sectionRef} className="relative overflow-clip bg-gradient-to-b from-gray-50 to-white">
      <div className="absolute inset-x-0 top-0 h-[220vh] z-0 pointer-events-none opacity-85">
        <svg viewBox={`0 0 ${sectionSize.w} ${sectionSize.h}`} fill="none" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <filter id="hero-impact-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="#3B82F6" floodOpacity="0.95" />
            </filter>
            <filter id="hero-image-wave" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04 0.08" numOctaves="2" result="noise" />
              <motion.feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={waveScale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
          <motion.path
            d={linePath}
            stroke="#4D8DFF"
            strokeWidth="24"
            strokeLinecap="round"
            filter="url(#hero-impact-glow)"
            style={{ pathLength: lineProgress, x: lineExitX }}
          />
        </svg>
      </div>

      {/* Sticky Centering Engine - Using absolute wrapper to fix "Blank Page" push */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ perspective: 1000 }}>
          {slots && (
            <motion.div
              className="absolute left-0 top-0 overflow-hidden shadow-black/20"
              style={{
                x: imageX,
                y: imageY,
                width: imageWidth,
                height: imageHeight,
                borderRadius: imageRadius,
                scale: imageScale,
                rotateX: paperRotateX,
                rotateY: paperRotateY,
                rotateZ: paperRotateZ,
                scaleX: imageScaleX,
                scaleY: imageScaleY,
                opacity: imageOpacity,
                boxShadow: paperShadow,
                filter: combinedFilter,
                willChange: 'transform, width, height, border-radius, opacity',
                transform: 'translateZ(0)', // Force GPU layer
                backfaceVisibility: 'visible'
              }}
            >
              <CinematicSequence progress={imageTravel} />
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/0"
                style={{ opacity: imageOverlayOpacity }}
              />
            </motion.div>
          )}
        </div>
      </div>

      <div className="relative z-10 min-h-screen">
        <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-16 px-6 pt-32 pb-24 md:grid-cols-2">
          <div>
            <h1 className="mb-8 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
              {headlineLines.map((line, i) => (
                <motion.div
                  key={line.text}
                  style={{
                    y: h1Exits[i].y,
                    opacity: h1Exits[i].opacity,
                    scale: h1Exits[i].scale,
                    pointerEvents: h1Exits[i].pointerEvents
                  }}
                >
                  <motion.span
                    className="gradient-text block"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: line.delay, ease: premium }}
                  >
                    {line.text}
                  </motion.span>
                </motion.div>
              ))}
            </h1>

            <motion.div style={{
              x: subExitX,
              opacity: subExitOp,
              pointerEvents: subPointerEvents
            }}>
              <motion.p
                className="mb-10 max-w-xl text-xl leading-relaxed text-gray-600 md:text-2xl"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.6, ease: premium }}
              >
                Join us in creating lasting change for youth and families in the Greater Toronto Area
              </motion.p>
            </motion.div>

            <motion.div
              className="flex flex-col gap-4 sm:flex-row"
              style={{
                x: btnRowExitX,
                opacity: btnRowExitOp,
                pointerEvents: btnRowPointerEvents
              }}
            >
              <motion.a
                href="#donate"
                className="rounded-full bg-gradient-to-r from-[#835BAF] to-[#DE517D] px-8 py-4 text-center font-semibold text-white shadow-xl"
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
                className="rounded-full border-2 border-[#835BAF] bg-white px-8 py-4 text-center font-semibold text-[#835BAF] shadow-lg"
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
                className="rounded-full bg-gradient-to-r from-[#DE517D] to-[#835BAF] px-8 py-4 text-center font-semibold text-white shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1, ease: premium }}
                whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(222, 81, 125, 0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                Explore Events
              </motion.a>
            </motion.div>
          </div>

          <div ref={heroSlotRef} className="h-[400px] w-full rounded-3xl md:h-[500px]" />
        </div>
      </div>

      <div className="relative z-50 min-h-screen px-6 pb-24 pt-20">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center">
          <div ref={statsSlotRef} className="relative h-[600px] w-full overflow-hidden rounded-3xl">
            {/* The background shadow and gradient are now handled dynamically by the traveling image and stats opacity */}

            <motion.div
              className="absolute bottom-0 left-0 right-0 p-8"
              style={{
                opacity: statsContentOpacity,
                y: statsContentY,
                x: statsContentX
              }}
            >
              {/* Branding Header Area */}
              <motion.div 
                className="mb-12 flex flex-col items-center justify-center text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: premium }}
              >
                <div className="relative mb-4">
                  <motion.div
                    className="absolute inset-0 bg-white/40 blur-2xl"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <Heart className="relative h-16 w-16 fill-white text-white drop-shadow-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-white drop-shadow-md">Our Growing Impact</h3>
                <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-white/0 via-white/40 to-white/0" />
              </motion.div>

              <div className="grid gap-8 md:grid-cols-3">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 p-8 text-center text-white backdrop-blur-lg"
                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(131, 91, 175, 0.5)' }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-[#835BAF]/20 to-[#DE517D]/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                      style={{ backgroundSize: '200% 200%' }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="relative z-10">
                      {!stat.hideValue && (
                        <div className="mb-2 text-5xl font-bold">
                          <AnimatedCounter value={stat.value!} suffix={stat.suffix ?? ''} shouldStart={shouldStartCounters} />
                        </div>
                      )}
                      <div className={`font-medium opacity-90 ${stat.hideValue ? 'text-xl font-bold mb-3' : 'text-lg'}`}>{stat.label}</div>
                      {stat.description && (
                        <p className="text-sm leading-relaxed text-white/75">{stat.description}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
