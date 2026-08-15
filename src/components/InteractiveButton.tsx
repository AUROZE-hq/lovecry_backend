'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';

interface InteractiveButtonProps {
  text: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * InteractiveButton Component
 * A premium button that integrates with the global Fluid Simulation.
 * It removes all static CSS hover colors and instead triggers real WebGL
 * fluid splats on top of the button for a high-end interactive experience.
 */
const InteractiveButton: React.FC<InteractiveButtonProps> = ({ 
  text, 
  href, 
  onClick, 
  className = "" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);

    // Trigger global fluid splat at the absolute mouse position
    if (typeof (window as any).triggerFluidSplat === 'function') {
      (window as any).triggerFluidSplat(e.clientX, e.clientY);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    // Trigger a powerful burst of fluid on entry
    if (typeof (window as any).triggerFluidSplat === 'function') {
      for(let i=0; i<4; i++) {
        (window as any).triggerFluidSplat(e.clientX, e.clientY);
      }
    }
  };

  const content = (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group px-12 py-5 rounded-full border border-white/20 bg-black/10 overflow-hidden cursor-pointer backdrop-blur-md transition-all duration-300 hover:border-white/50 shadow-2xl ${className}`}
      onClick={onClick}
    >
      {/* 
          IMPORTANT: All background 'hover colors' have been removed.
          The button is now transparent, allowing the global WebGL Fluid Simulation 
          (FluidCursor) to provide the interactive color bursts on top of the button.
      */}

      {/* Static Button Text */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <span className="text-white font-sans text-sm font-medium tracking-widest uppercase flex gap-2 items-center">
          {text}
          <motion.svg 
            width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"
            animate={{ x: isHovered ? 4 : 0 }}
          >
            <path d="M1 6H11M11 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </span>
      </div>

      {/* Subtle edge highlight shim */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-right from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block no-underline">
        {content}
      </Link>
    );
  }

  return content;
};

export default InteractiveButton;
