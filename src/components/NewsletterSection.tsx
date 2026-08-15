'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue, useMotionValue } from 'framer-motion';
import InteractiveButton from './InteractiveButton';

const slides = [
  {
    title: "PROGRAM\nFOCUS:\nCOMPASSIONATE\nSUPPORT",
    description: "Expanding access to compassionate counselling and emotional support for individuals, youth, and families experiencing trauma, hardship, or crisis.",
    backImg: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80",
    midImg: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&q=80",
    frontImg: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80"
  },
  {
    title: "COMMUNITY\nFOCUS:\nCONNECTION",
    description: "Building partnerships that strengthen mental-health awareness, volunteer engagement, outreach, and access to community resources.",
    backImg: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    midImg: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80",
    frontImg: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
  },
  {
    title: "SERVICE\nFOCUS:\nACCESSIBLE\nWELLNESS",
    description: "Developing accessible counselling, wellness, education, and support services for people from diverse circumstances and backgrounds.",
    backImg: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
    midImg: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    frontImg: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"
  }
];

// The parallax composite photo layout logic with staggered depth reveal
function ImageComposite({ data, progress, revealProgress }: { data: typeof slides[0], progress: MotionValue<number>, revealProgress?: MotionValue<number> }) {
  // True Parallax: Background moves extremely slow, foreground leaps faster.
  const bgY = useTransform(progress, [0, 1], ['-5%', '5%']);
  const midY = useTransform(progress, [0, 1], ['-15%', '15%']);
  const frontY = useTransform(progress, [0, 1], ['-25%', '25%']);

  // Reveal transforms (if revealProgress is provided, otherwise fully visible)
  const fallbackReveal = useMotionValue(1);
  const safeReveal = revealProgress || fallbackReveal;
  
  const bgOpacity = useTransform(safeReveal, [0, 0.4], [0, 0.8]);
  const bgScale = useTransform(safeReveal, [0, 0.4], [1.1, 1]);
  
  const midOpacity = useTransform(safeReveal, [0.3, 0.7], [0, 1]);
  const midScale = useTransform(safeReveal, [0.3, 0.7], [1.1, 1]);
  
  const frontOpacity = useTransform(safeReveal, [0.6, 1.0], [0, 1]);
  const frontScale = useTransform(safeReveal, [0.6, 1.0], [1.1, 1]);

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">

      {/* Background Image: Tall, aligns top-right, moves slowest */}
      <motion.div 
        style={{ opacity: bgOpacity, scale: bgScale }}
        className="absolute top-[5%] right-[5%] w-[65%] h-[85%] shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden rounded-[4px]"
      >
        <motion.img
          src={data.backImg}
          alt=""
          className="absolute top-[-10%] left-0 w-full h-[120%] object-cover grayscale-[30%]"
          style={{ y: bgY }}
        />
      </motion.div>

      {/* Middle Image: Overlaps center-left, moves medium speed */}
      <motion.div 
        style={{ opacity: midOpacity, scale: midScale }}
        className="absolute top-[25%] left-[8%] w-[45%] h-[55%] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden rounded-[2px] border border-white/5"
      >
        <motion.img
          src={data.midImg}
          alt=""
          className="absolute top-[-20%] left-0 w-full h-[140%] object-cover"
          style={{ y: midY }}
        />
      </motion.div>

      {/* Foreground Image: Small, bottom right/center, moves fastest */}
      <motion.div 
        style={{ opacity: frontOpacity, scale: frontScale, zIndex: 10 }}
        className="absolute bottom-[10%] right-[20%] w-[35%] aspect-[4/4] shadow-[0_30px_90px_rgba(0,0,0,1)] overflow-hidden rounded-[2px] border border-white/10"
      >
        <motion.img
          src={data.frontImg}
          alt=""
          className="absolute top-[-30%] left-0 w-full h-[160%] object-cover"
          style={{ y: frontY }}
        />
      </motion.div>

    </div>
  );
}

function DepthTransition({ index, data, progress }: { index: number, data: typeof slides[0], progress: MotionValue<number> }) {
  const slideStart = (index - 1) * 0.4 + 0.15;
  const slideEnd = slideStart + 0.3;

  // Track the reveal progress for the entire composite
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const revealProgress = useTransform(progress, [slideStart, slideEnd], [0, 1]);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <ImageComposite data={data} progress={progress} revealProgress={revealProgress} />
    </div>
  );
}

function SlideModule({ index, data, progress }: { index: number, data: typeof slides[0], progress: MotionValue<number> }) {
  // Always map onto the explicit guaranteed safe scroll bounds to prevent WAAPI clamping crash
  const safeInputs = [0, 0.4, 0.8];

  // The master tracks (5 stages: Far Future, Next, Active, Previous, Far Past)
  const masterY = [550, 350, 0, -350, -550];
  const masterX = ["0vw", "0vw", "0vw", "18vw", "25vw"];
  const masterScale = [0.4, 0.5, 1, 0.4, 0.3];
  const masterOpacity = [0, 0.3, 1, 0.3, 0];
  const masterParaOpacity = [-2, -2, 1, -2, -2];

  const sliceStart = 2 - index;

  const y = useTransform(progress, safeInputs, masterY.slice(sliceStart, sliceStart + 3));
  const x = useTransform(progress, safeInputs, masterX.slice(sliceStart, sliceStart + 3));
  const scale = useTransform(progress, safeInputs, masterScale.slice(sliceStart, sliceStart + 3));
  const opacity = useTransform(progress, safeInputs, masterOpacity.slice(sliceStart, sliceStart + 3));
  const paraOpacity = useTransform(progress, safeInputs, masterParaOpacity.slice(sliceStart, sliceStart + 3));

  // The "S" Flight Logic [ONLY FOR THE FINAL SLIDE]
  const isFinalSlide = index === 2;
  const sMorphY = useTransform(progress, [0.88, 1.0], [0, 600]); // Reduced for slower speed
  const sMorphX = useTransform(progress, [0.88, 1.0], [0, -380]); // Reduced for slower speed
  const sMorphScale = useTransform(progress, [0.88, 1.0], [1, 2.8]); // Refined smaller scale
  const sMorphOpacity = useTransform(progress, [0.93, 1.0], [1, 0]); // Fade late to handover

  return (
    <motion.div
      className="absolute top-1/2 left-0 w-full pointer-events-none"
      style={{ x, y, scale, opacity, transformOrigin: 'left center' }}
    >
      <div className="-translate-y-1/2 w-full flex flex-col pl-8 lg:pl-10">

        {/* Heading Box - Conditional splitting for the "S" morph */}
        <h2 className="text-[2.8rem] lg:text-[3.5rem] xl:text-[4rem] font-serif font-light text-white uppercase tracking-[0.1em] leading-[1.15] whitespace-pre-wrap drop-shadow-2xl mb-8">
          {isFinalSlide ? (
            <>
              {data.title.slice(0, -1)}
              <motion.span
                className="inline-block"
                style={{
                  x: sMorphX,
                  y: sMorphY,
                  scale: sMorphScale,
                  opacity: sMorphOpacity,
                  display: 'inline-block',
                  transformOrigin: 'center center'
                }}
              >
                {data.title.slice(-1)}
              </motion.span>
            </>
          ) : (
            data.title
          )}
        </h2>

        {/* Paragraph Box */}
        <motion.div
          className="w-full flex justify-end"
          style={{ opacity: paraOpacity }}
        >
          <p className="text-[#a0a0a0] text-sm lg:text-[16px] xl:text-[18px] leading-[1.9] font-sans mix-blend-plus-lighter w-[85%] max-w-sm drop-shadow-md">
            {data.description}
          </p>
        </motion.div>

      </div>
    </motion.div>
  );
}

export default function NewsletterSection() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  return (
    <section ref={containerRef} className="relative bg-[#111] h-[300vh] w-full">
      {/* Sticky layout locking onto screen while users scroll through 300vh */}
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden border-box">

        {/* Left Side: Text anchored to the exact global max-w-7xl grid limits */}
        <div className="absolute inset-0 w-full max-w-7xl mx-auto px-6 h-full flex pointer-events-none z-20">
          <div className="w-full lg:w-1/2 h-full flex flex-col justify-center relative pointer-events-auto pt-20">
            {/* Central Anchor Window guiding the Carousel path tracks */}
            <div className="relative w-full h-[500px]">
              {slides.map((s, i) => (
                <SlideModule key={`mod-${i}`} index={i} data={s} progress={scrollYProgress} />
              ))}
            </div>

            {/* More News CTA - Placed at the area marked by the user */}
            <div className="mt-10 flex justify-center lg:justify-start">
              <InteractiveButton 
                text="More News" 
                href="/news" 
                className="px-12 py-4 shadow-xl ml-8 lg:ml-10" // Larger size for premium feel, aligned roughly to title
              />
            </div>
          </div>
        </div>

        {/* Right Side: Triple Image Collage with Glitch Parallax transition */}
        <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full z-0 lg:z-10 opacity-20 sm:opacity-30 lg:opacity-100 pointer-events-none lg:pointer-events-auto transition-opacity duration-700">
          {/* Base Layer */}
          <div className="absolute inset-0">
            <ImageComposite data={slides[0]} progress={scrollYProgress} />
          </div>

          {/* Depth Transition Overlays */}
          <DepthTransition index={1} data={slides[1]} progress={scrollYProgress} />
          <DepthTransition index={2} data={slides[2]} progress={scrollYProgress} />
        </div>

      </div>
    </section>
  );
}
