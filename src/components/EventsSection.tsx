'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate, scroll } from 'motion';
import InteractiveButton from './InteractiveButton';

export default function EventsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scalerImageRef = useRef<HTMLImageElement>(null);
  const scalerContentRef = useRef<HTMLDivElement>(null);
  const staticContentRef = useRef<HTMLDivElement>(null);
  const persistentTextRef = useRef<HTMLDivElement>(null);
  const subtextRef = useRef<HTMLDivElement>(null);
  const communityButtonRef = useRef<HTMLDivElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const exploreButtonRef = useRef<HTMLDivElement>(null);
  const firstSectionRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; details: string } | null>(null);

  const handleImageClick = (src: string) => {
    setSelectedImage({
      src,
      title: 'Event Moment',
      details: 'Experience the moments that define our mission. This captivating capture represents the dedication and passion behind our community outreach, conveying a story of hope and transformation.',
    });
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const image = scalerImageRef.current;
    const firstSection = firstSectionRef.current;
    const layers = layerRefs.current.filter(Boolean) as HTMLDivElement[];

    if (!image || !firstSection || layers.length !== 3) return;

    const cubicBezier = (p1: number, p2: number, p3: number, p4: number) => [p1, p2, p3, p4] as any;

    const animateScaler = () => {
      const scalerDiv = image.parentElement;
      if (!scalerDiv) return;

      // Robust measurement with fallbacks to avoid 'black screen'
      const naturalWidth = scalerDiv.offsetWidth || 400;
      const naturalHeight = scalerDiv.offsetHeight || 500;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 1. Center Image Shrink Animation
      scroll(
        animate(image, {
          width: [viewportWidth, naturalWidth],
          height: [viewportHeight, naturalHeight]
        } as any, {
          width: { ease: cubicBezier(0.65, 0, 0.35, 1) },
          height: { ease: cubicBezier(0.42, 0, 0.58, 1) }
        } as any),
        {
          target: firstSection,
          offset: ['start start', '0.8 end'] as any
        }
      );
    };

    // Trigger measurement after layout settles
    const timeoutId = setTimeout(animateScaler, 150);

    // 2. Content Overlay Animation (Button move to center, others fade out)
    const scalerContent = scalerContentRef.current;
    const staticContent = staticContentRef.current;
    const exploreButton = exploreButtonRef.current;

    if (scalerContent && staticContent && exploreButton) {
      // Elements that should fade out
      const fadeElements = [
        subtextRef.current,
        communityButtonRef.current,
        highlightsRef.current
      ].filter(Boolean) as HTMLDivElement[];

      fadeElements.forEach(el => {
        scroll(
          animate(el, {
            opacity: [1, 0]
          } as any, {
            opacity: { ease: cubicBezier(0.42, 0, 0.58, 1) }
          } as any),
          {
            target: firstSection,
            offset: ['start start', '30% start'] as any
          }
        );
      });

      // Function to get destination offsets for both text and button
      const getTargetOffsets = (el: HTMLElement, verticalShift: number = 0) => {
        const imageParent = image.parentElement;
        if (!imageParent) return { x: 0, y: 0 };

        const targetRect = imageParent.getBoundingClientRect();
        const startRect = el.getBoundingClientRect();

        const moveX = (targetRect.left + targetRect.width / 2) - (startRect.left + startRect.width / 2);
        const moveY = (targetRect.top + targetRect.height / 2) - (startRect.top + startRect.height / 2) + verticalShift;

        return { x: moveX, y: moveY };
      };

      // Animate Persistent Text (Label + Title)
      const persistentText = persistentTextRef.current;
      if (persistentText) {
        const textOffsets = getTargetOffsets(persistentText, -50); // Shift up in card
        scroll(
          animate(persistentText, {
            x: [0, textOffsets.x],
            y: [0, textOffsets.y],
            scale: [1, 0.42], // Slightly larger for better readability
            opacity: [1, 1]
          } as any, {
            x: { ease: cubicBezier(0.65, 0, 0.35, 1) },
            y: { ease: cubicBezier(0.42, 0, 0.58, 1) },
            scale: { ease: cubicBezier(0.42, 0, 0.58, 1) }
          } as any),
          { target: firstSection, offset: ['start start', '0.8 end'] as any }
        );
      }

      // Animate Explore Button
      const buttonOffsets = getTargetOffsets(exploreButton, 80); // Shift down in card
      scroll(
        animate(exploreButton, {
          x: [0, buttonOffsets.x],
          y: [0, buttonOffsets.y],
          scale: [1, 0.52], // Larger, more prominent CTA
          opacity: [1, 1]
        } as any, {
          x: { ease: cubicBezier(0.65, 0, 0.35, 1) },
          y: { ease: cubicBezier(0.42, 0, 0.58, 1) },
          scale: { ease: cubicBezier(0.42, 0, 0.58, 1) }
        } as any),
        { target: firstSection, offset: ['start start', '0.8 end'] as any }
      );

      // Fade out background gradient div
      const background = backgroundRef.current;
      if (background) {
        scroll(
          animate(background, { opacity: [1, 0] } as any),
          { target: firstSection, offset: ['start start', '40% start'] }
        );
      }
    }

    // 3. Staggered Layer Entrance
    const scaleEasings = [
      cubicBezier(0.42, 0, 0.58, 1),
      cubicBezier(0.76, 0, 0.24, 1),
      cubicBezier(0.87, 0, 0.13, 1)
    ];

    layers.forEach((layer, index) => {
      const endOffset = `${1 - (index * 0.05)} end` as any;

      // Fade Reveal (Now starting much earlier at 20% scroll)
      scroll(
        animate(layer, { opacity: [0, 0, 1] } as any, {
          opacity: { offset: [0, 0.2, 1], ease: cubicBezier(0.61, 1, 0.88, 1) }
        } as any),
        { target: firstSection, offset: ['start start', endOffset] }
      );

      // Scale Reveal (Delayed until 30% scroll)
      scroll(
        animate(layer, { scale: [0, 0, 1] } as any, {
          scale: { offset: [0, 0.3, 1], ease: scaleEasings[index] }
        } as any),
        { target: firstSection, offset: ['start start', endOffset] }
      );
    });

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <style>{`
        .events-section-wrapper {
          --gutter: 2rem;
          background: #000;
          color: #fff;
          font-family: inherit;
          width: 100%;
          scroll-snap-align: start;
        }

        .events-content-wrap {
          background: #000;
          width: 100%;
        }

        .events-section-wrapper section {
          min-height: 400vh; /* Increased scroll space for pinning */
          position: relative;
        }

        .events-section-wrapper .events-content {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: sticky;
          top: 0;
          overflow: hidden;
        }

        .events-section-wrapper .events-grid {
          --offset: 0;
          --container-width: 1600px;
          --gap: clamp(10px, 7.35vw, 80px);
          width: var(--container-width);
          max-width: calc(100% - (2 * var(--gutter)));
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          grid-template-rows: repeat(3, auto);
          gap: var(--gap);
          margin: 0 auto;
          position: relative;
        }

        @media (max-width: 600px) {
          .events-section-wrapper .events-grid {
            grid-template-columns: repeat(3, 1fr);
            --offset: -1;
            --gutter: 1rem;
          }
          .events-section-wrapper .events-grid > .events-layer:nth-of-type(1) { display: none; }
        }

        .events-section-wrapper .events-layer {
          display: grid;
          grid-column: 1 / -1;
          grid-row: 1 / -1;
          /* Manual grid tracks for browser compatibility (fallback for subgrid) */
          grid-template-columns: repeat(5, 1fr);
          grid-template-rows: repeat(3, auto);
          gap: var(--gap);
          opacity: 0;
          pointer-events: none;
          z-index: 1;
        }

        @media (max-width: 600px) {
          .events-section-wrapper .events-layer {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Layer-specific cell mapping */
        /* Layer 1: Outer edges */
        .events-section-wrapper .events-layer:nth-of-type(1) div:nth-child(1) { grid-column: 1; grid-row: 1; }
        .events-section-wrapper .events-layer:nth-of-type(1) div:nth-child(2) { grid-column: 5; grid-row: 1; }
        .events-section-wrapper .events-layer:nth-of-type(1) div:nth-child(3) { grid-column: 1; grid-row: 2; }
        .events-section-wrapper .events-layer:nth-of-type(1) div:nth-child(4) { grid-column: 5; grid-row: 2; }
        .events-section-wrapper .events-layer:nth-of-type(1) div:nth-child(5) { grid-column: 1; grid-row: 3; }
        .events-section-wrapper .events-layer:nth-of-type(1) div:nth-child(6) { grid-column: 5; grid-row: 3; }

        /* Layer 2: Inner columns */
        .events-section-wrapper .events-layer:nth-of-type(2) div:nth-child(1) { grid-column: calc(2 + var(--offset)); grid-row: 1; }
        .events-section-wrapper .events-layer:nth-of-type(2) div:nth-child(2) { grid-column: calc(4 + var(--offset)); grid-row: 1; }
        .events-section-wrapper .events-layer:nth-of-type(2) div:nth-child(3) { grid-column: calc(2 + var(--offset)); grid-row: 2; }
        .events-section-wrapper .events-layer:nth-of-type(2) div:nth-child(4) { grid-column: calc(4 + var(--offset)); grid-row: 2; }
        .events-section-wrapper .events-layer:nth-of-type(2) div:nth-child(5) { grid-column: calc(2 + var(--offset)); grid-row: 3; }
        .events-section-wrapper .events-layer:nth-of-type(2) div:nth-child(6) { grid-column: calc(4 + var(--offset)); grid-row: 3; }

        /* Layer 3: Center top/bottom */
        .events-section-wrapper .events-layer:nth-of-type(3) div:nth-child(1) { grid-column: calc(3 + var(--offset)); grid-row: 1; }
        .events-section-wrapper .events-layer:nth-of-type(3) div:nth-child(2) { grid-column: calc(3 + var(--offset)); grid-row: 3; }

        .events-section-wrapper .events-grid img {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border-radius: 1rem;
          cursor: pointer;
          pointer-events: auto;
          transition: filter 0.3s ease;
        }

        .events-section-wrapper .events-grid img:hover { filter: brightness(1.2); }

        .events-section-wrapper .events-scaler {
          grid-area: 2 / calc(3 + var(--offset));
          position: relative;
          z-index: 5;
        }

        .events-section-wrapper .events-scaler img {
          position: absolute;
          top: 45%;
          left: 46%;
          translate: -50% -50%;
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          border-radius: 1rem;
          max-width: none;
          min-width: 320px;
          min-height: 400px;
        }

        .events-section-wrapper .events-scaler-content {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: 5vh;
          pointer-events: none;
        }

        .events-section-wrapper .events-scaler-bg {
          position: absolute;
          inset: 0;
          z-index: -1;
          background: linear-gradient(to right, #000 0%, rgba(0,0,0,0.8) 40%, transparent 100%);
        }

        @media (max-width: 768px) {
          .events-section-wrapper .events-scaler-bg {
            background: linear-gradient(to top, #000 0%, rgba(0,0,0,0.8) 50%, transparent 100%);
          }
        }

        .events-section-wrapper .events-scaler-content > * { pointer-events: auto; }

        .events-section-wrapper .events-scaler-label {
          color: #DE517D;
          text-transform: uppercase;
          letter-spacing: 0.5em; /* Extreme tracking for luxury feel */
          font-size: 0.65rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          background: rgba(222, 81, 125, 0.12);
          padding: 0.5rem 1.25rem;
          border-radius: 99px;
          border: 1px solid rgba(222, 81, 125, 0.25);
          display: inline-block;
          backdrop-filter: blur(4px);
        }

        .events-section-wrapper .events-scaler-title {
          font-family: Georgia, serif;
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          line-height: 1.1;
          margin-bottom: 2.5rem;
          max-width: 900px;
          color: #fff;
          text-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(131, 91, 175, 0.2);
        }

        .events-section-wrapper .events-scaler-title .italic {
          font-style: italic;
          background: linear-gradient(135deg, #DE517D 0%, #835BAF 50%, #DE517D 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: titleShimmer 4s linear infinite;
        }

        @keyframes titleShimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        .events-section-wrapper .events-scaler-subtext {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
          max-width: 550px;
          margin-bottom: 4rem;
          line-height: 1.8;
        }

        .events-section-wrapper .events-scaler-ctas {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 4rem;
        }

        .events-section-wrapper .events-highlight-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          opacity: 0.8;
          margin-bottom: 0.5rem;
        }

        .events-section-wrapper .events-highlight-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #DE517D;
        }

        .events-section-wrapper .events-scroll-indicator {
          position: absolute;
          bottom: 18rem;
          right: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          opacity: 0.4;
        }

        .events-section-wrapper .events-scroll-text {
          writing-mode: vertical-rl;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.4em;
          transform: rotate(180deg);
        }

        .events-section-wrapper .events-scroll-line {
          width: 1px;
          height: 80px;
          background: linear-gradient(to bottom, #fff, transparent);
        }
      `}</style>

      <div className="events-section-wrapper" ref={containerRef}>
        <div className="events-content-wrap">
          <main>
            <section ref={firstSectionRef}>
              <div className="events-content">
                <div
                  className="events-grid"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName.toLowerCase() === 'img') {
                      handleImageClick((target as HTMLImageElement).src);
                    }
                  }}
                >
                  {/* Layer 1: Outer edges */}
                  <div className="events-layer" ref={(el) => { layerRefs.current[0] = el; }}>
                    <div><img src="/event (1).jpg" alt="" /></div>
                    <div><img src="/event (2).jpg" alt="" /></div>
                    <div><img src="/event (3).jpg" alt="" /></div>
                    <div><img src="/event (4).jpg" alt="" /></div>
                    <div><img src="/event (5).jpg" alt="" /></div>
                    <div><img src="/event (6).jpg" alt="" /></div>
                  </div>

                  {/* Layer 2: Inner columns */}
                  <div className="events-layer" ref={(el) => { layerRefs.current[1] = el; }}>
                    <div><img src="/event (7).jpg" alt="" /></div>
                    <div><img src="/event (8).jpg" alt="" /></div>
                    <div><img src="/event (9).jpg" alt="" /></div>
                    <div><img src="/event (10).jpg" alt="" /></div>
                    <div><img src="/event (11).jpg" alt="" /></div>
                    <div><img src="/event (12).jpg" alt="" /></div>
                  </div>

                  {/* Layer 3: Center top/bottom */}
                  <div className="events-layer" ref={(el) => { layerRefs.current[2] = el; }}>
                    <div><img src="/event (13).jpg" alt="" /></div>
                    <div><img src="/event (14).jpg" alt="" /></div>
                  </div>

                  {/* Scaler Image */}
                  <div className="events-scaler">
                    <img ref={scalerImageRef} src="/event page.jpg" alt="Main Moment" />
                  </div>

                  {/* Content Overlay */}
                  <div ref={scalerContentRef} className="events-scaler-content">
                    <div ref={backgroundRef} className="events-scaler-bg" />
                    <div className="w-full max-w-7xl mx-auto px-6 h-full flex flex-col items-start justify-start pt-[5vh]">
                      <div ref={staticContentRef} className="flex flex-col items-start w-full">
                        <div ref={persistentTextRef} className="flex flex-col items-start">
                          <span className="events-scaler-label">Our Events</span>
                          <h2 className="events-scaler-title">
                            Moments of <span className="italic">Healing</span>, <br />
                            <span className="italic">Growth</span>, and <span className="italic">Connection</span>
                          </h2>
                        </div>
                        <div ref={subtextRef}>
                          <p className="events-scaler-subtext">
                            Explore the experiences that bring our community together through mindfulness, reflection, movement, and support.
                          </p>
                        </div>
                      </div>

                      <div className="events-scaler-ctas">
                        <div ref={exploreButtonRef} className="inline-block">
                          <InteractiveButton text="Explore Events" href="/events" className="bg-white/5 border-white/10 min-w-[280px]" />
                        </div>
                        <div ref={communityButtonRef} className="inline-block">
                          <InteractiveButton text="Community Moments" href="/events" className="bg-transparent border-white/10 min-w-[280px]" />
                        </div>
                      </div>

                      <div ref={highlightsRef} className="events-scaler-highlights">
                        <div className="events-highlight-item"><div className="events-highlight-dot" /> Mindfulness & wellness sessions</div>
                        <div className="events-highlight-item"><div className="events-highlight-dot" /> Community-led experiences</div>
                        <div className="events-highlight-item"><div className="events-highlight-dot" /> Safe and supportive spaces</div>
                      </div>
                    </div> {/* Closes w-full */}

                    <div className="events-scroll-indicator">
                      <span className="events-scroll-text">Scroll to Explore</span>
                      <div className="events-scroll-line" />
                    </div>
                  </div> {/* Closes scaler-content */}
                </div> {/* Closes grid */}
              </div> {/* Closes content */}
            </section>
          </main>
        </div>

        {/* Modal Overlay */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/85 z-[9999] flex justify-center items-center backdrop-blur-md p-8 animate-in fade-in zoom-in duration-300"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="bg-[#111] rounded-3xl max-w-[900px] w-full max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/50 text-white border border-white/30 rounded-full w-10 h-10 flex items-center justify-center z-10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                &times;
              </button>
              <div className="flex-shrink min-h-0 overflow-hidden bg-black flex justify-center">
                <img src={selectedImage.src} alt="" className="max-h-[60vh] object-contain" />
              </div>
              <div className="p-10 flex-shrink-0">
                <h3 className="text-3xl font-semibold text-white mb-4">{selectedImage.title}</h3>
                <p className="text-white/60 text-lg leading-relaxed">{selectedImage.details}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}