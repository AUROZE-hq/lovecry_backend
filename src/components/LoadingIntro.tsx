'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const LOADING_VIDEO_SRC = '/videos/lovecryloading.mp4';

type LoadingIntroProps = {
  onComplete: () => void;
  onExitComplete: () => void;
};

export default function LoadingIntro({ onComplete, onExitComplete }: LoadingIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const finishIntro = () => {
    if (isExiting) return;
    setIsExiting(true);
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden={isExiting}
      onAnimationComplete={() => {
        if (isExiting) {
          onExitComplete();
        }
      }}
    >
      <video
        ref={videoRef}
        src={LOADING_VIDEO_SRC}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
        onEnded={finishIntro}
        onError={finishIntro}
      />

      <button
        type="button"
        onClick={finishIntro}
        className="absolute bottom-6 right-6 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80 backdrop-blur transition hover:bg-black/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Skip
      </button>
    </motion.div>
  );
}
