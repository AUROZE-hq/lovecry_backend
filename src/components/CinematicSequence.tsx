'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { MotionValue, useTransform } from 'framer-motion';

interface CinematicSequenceProps {
  progress: MotionValue<number>;
  totalFrames?: number;
}

export default function CinematicSequence({ 
  progress, 
  totalFrames = 300 
}: CinematicSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Create an array of paths for the 300 images
  const framePaths = useMemo(() => {
    return Array.from({ length: totalFrames }, (_, i) => {
      const frameNum = (i + 1).toString().padStart(3, '0');
      return `/childrenImages/ezgif-frame-${frameNum}.jpg`;
    });
  }, [totalFrames]);

  // Preload frames
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    framePaths.forEach((path, index) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setIsLoaded(true);
        }
      };
      loadedImages[index] = img;
    });

    setImages(loadedImages);
  }, [framePaths, totalFrames]);

  // Map progress (0-1) to frame index (0-299)
  const frameIndex = useTransform(progress, [0, 1], [0, totalFrames - 1]);

  // Draw frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Helper to draw image like object-fit: cover
    const drawFrame = (index: number) => {
      const img = images[Math.floor(index)];
      if (!img || !img.complete) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.width;
      const ih = img.height;

      const scale = Math.max(cw / iw, ch / ih);
      const x = (cw - iw * scale) / 2;
      const y = (ch - ih * scale) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, x, y, iw * scale, ih * scale);
    };

    // Update canvas when frameIndex changes
    const unsubscribe = frameIndex.on('change', (latest) => {
      requestAnimationFrame(() => drawFrame(latest));
    });

    // Initial draw
    drawFrame(frameIndex.get());

    return () => unsubscribe();
  }, [isLoaded, images, frameIndex]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        // Force redraw on resize
        const ctx = canvas.getContext('2d');
        if (ctx && isLoaded) {
          const frame = Math.floor(frameIndex.get());
          const img = images[frame];
          if (img) {
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          }
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoaded, images, frameIndex]);

  return (
    <div className="relative h-full w-full bg-black/5">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-md">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#835BAF] border-t-transparent"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`h-full w-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
