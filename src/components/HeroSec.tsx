'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import VariableProximity from './VariableProximity';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export default function HeroSec() {
  const containerRef = useRef<HTMLElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const videoInnerRef = useRef<HTMLVideoElement>(null);

  const [showContent, setShowContent] = useState(true);

  const fromSettings = "'wght' 400, 'opsz' 9";
  const toSettings = "'wght' 1500, 'opsz' 40";
  const radius = 100;

  useGSAP(() => {
    // Scroll-based timeline for pinning and animating the hero sequence
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top", // when the top of the container hits the top of the viewport
        end: "+=250vh", // scrolling distance controls animation length
        scrub: 1, // Smooth easing and continuous interpolation (no jumps)
        pin: true, // Pin the container perfectly in place while animating
        anticipatePin: 1, // Prevent visual layout shifts before pinning
      }
    });

    // 1. Text fades away and slides up slightly on scroll
    tl.to(".hero-text-content", {
      opacity: 0,
      y: -80,
      duration: 1,
      ease: "power2.out"
    }, 0); // Start at 0 timeline

    // 2. Progressive video zoom-in to a massive floating card
    tl.to(videoWrapperRef.current, {
      width: "95vw",
      height: "90vh",
      bottom: "5vh",
      borderRadius: "40px",
      padding: "0px",
      ease: "power2.inOut",
      duration: 1,
    }, 0);

    // Map internal video border to smoothly transition along with wrapper
    tl.to(videoInnerRef.current, {
      borderRadius: "40px",
      ease: "power2.inOut",
      duration: 1,
    }, 0);

  }, { scope: containerRef });

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden"
    >
      {/* Background Masking Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-[50vh] mask-image-gradient pointer-events-none" style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 50%, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 50%, black 100%)'
      }} />

      {/* TOP LAYER: TYPOGRAPHY */}
      <div className="hero-text-content absolute top-[24vh] inset-x-0 w-full flex flex-col items-center justify-start text-center px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h1
            className="font-hero inline-block"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              marginBottom: '3rem',
              background: 'linear-gradient(90deg, #693492 0%, #f1328b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            <VariableProximity
              label="Building Trust,"
              fromFontVariationSettings={fromSettings}
              toFontVariationSettings={toSettings}
              containerRef={containerRef}
              radius={radius}
              falloff="linear"
            />
            <br />
            <VariableProximity
              label="Restoring Hope,"
              fromFontVariationSettings={fromSettings}
              toFontVariationSettings={toSettings}
              containerRef={containerRef}
              radius={radius}
              falloff="linear"
            />
            <br />
            <VariableProximity
              label="Empowering the Future"
              fromFontVariationSettings={fromSettings}
              toFontVariationSettings={toSettings}
              containerRef={containerRef}
              radius={radius}
              falloff="linear"
            />
          </h1>

          <p className="font-body-soft text-white text-base font-semibold max-w-2xl mx-auto">
            We support youth and families navigating mental health challenges, trauma, and <br /> instability
            by creating safe spaces for healing and moving forward together
          </p>
        </motion.div>
      </div>

      {/* BOTTOM LAYER: VIDEO FRAME ACCELERATOR */}
      <motion.div
        ref={videoWrapperRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={showContent ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        className="absolute bottom-[10vh] left-1/2 -translate-x-1/2 w-[240px] h-[75px] sm:w-[200px] sm:h-[90px] md:w-[270px] md:h-[100px] rounded-[100px] p-[4px] bg-white shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden z-20 cursor-pointer"
        style={{ transformOrigin: 'center center' }}
      >
        <div className="relative w-full h-full overflow-hidden isolate" style={{ borderRadius: 'inherit' }}>
          <video
            ref={videoInnerRef}
            src="videos/LOVECRY2.mp4"
            autoPlay={true}
            loop={true}
            muted={true}
            playsInline={true}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none filter brightness-90 hover:brightness-100 transition-all duration-500 rounded-[100px]"
          />
        </div>
      </motion.div>
    </section>
  );
}
