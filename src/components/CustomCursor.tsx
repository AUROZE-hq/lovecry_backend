"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type SmokeParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

export default function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: w / 2, y: h / 2 };

    // Separate objects for GSAP to tween
    const orb = { x: w / 2, y: h / 2 };
    const core = { x: w / 2, y: h / 2 };

    // Track previous orb position to compute actual velocity
    let prevOrbX = orb.x;
    let prevOrbY = orb.y;

    let velX = 0;
    let velY = 0;
    let smoothSpeed = 0;
    let isVisible = true;
    let isHovering = false;

    const particles: SmokeParticle[] = [];

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      isHovering = !!(e.target as HTMLElement)?.closest?.(
        'a, button, [role="button"], input, textarea, select, [data-cursor="hover"]'
      );
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", () => { isVisible = false; });
    document.addEventListener("mouseenter", () => { isVisible = true; });

    // Orb lags behind — slower tween
    const setOrbX = gsap.quickTo(orb, "x", { duration: 0.35, ease: "power3.out" });
    const setOrbY = gsap.quickTo(orb, "y", { duration: 0.35, ease: "power3.out" });

    // Core snaps almost instantly
    const setCoreX = gsap.quickTo(core, "x", { duration: 0.06, ease: "none" });
    const setCoreY = gsap.quickTo(core, "y", { duration: 0.06, ease: "none" });

    // Hide native cursor globally
    const style = document.createElement("style");
    style.textContent = "*, *::before, *::after { cursor: none !important; }";
    document.head.appendChild(style);

    // ─── Draw helpers ────────────────────────────────────────────

    const drawOrb = (x: number, y: number, radius: number, alpha: number) => {
      ctx.save();

      // Outermost haze
      ctx.filter = "blur(48px)";
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120, 220, 255, ${alpha * 0.15})`;
      ctx.fill();

      // Mid glow
      ctx.filter = "blur(22px)";
      const g1 = ctx.createRadialGradient(x - 12, y - 16, 8, x, y, radius * 1.3);
      g1.addColorStop(0, `rgba(230, 255, 255, ${alpha * 0.9})`);
      g1.addColorStop(0.4, `rgba(150, 230, 255, ${alpha * 0.65})`);
      g1.addColorStop(1, `rgba(80, 170, 215, 0)`);
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = g1;
      ctx.fill();

      // Crisp inner highlight
      ctx.filter = "blur(6px)";
      const g2 = ctx.createRadialGradient(x - 8, y - 10, 2, x, y, radius * 0.55);
      g2.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.7})`);
      g2.addColorStop(1, `rgba(200, 245, 255, 0)`);
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = g2;
      ctx.fill();

      ctx.restore();
    };

    const drawCore = (x: number, y: number) => {
      ctx.save();
      const r = isHovering ? 6 : 3.5;
      ctx.filter = "blur(3px)";
      ctx.beginPath();
      ctx.arc(x, y, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220, 255, 255, 0.5)";
      ctx.fill();
      ctx.filter = "none";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
    };

    // ─── Smoke particles ─────────────────────────────────────────

    const emitSmoke = () => {
      if (smoothSpeed < 1.5) return;

      // Spawn at the BACK of the orb — opposite to direction of travel
      const len = Math.hypot(velX, velY) || 1;
      const nx = velX / len;
      const ny = velY / len;

      // Offset spawn point behind the orb
      const spawnDist = 12 + smoothSpeed * 0.4;
      const px = orb.x - nx * spawnDist;
      const py = orb.y - ny * spawnDist;

      const speedFactor = Math.min(smoothSpeed * 0.07, 3.5);

      const life = 50 + Math.random() * 30;
      particles.push({
        x: px,
        y: py,
        // Drift mostly backward + random wispy spread
        vx: -nx * (0.6 + Math.random() * 0.8) + (Math.random() - 0.5) * speedFactor,
        vy: -ny * (0.6 + Math.random() * 0.8) + (Math.random() - 0.5) * speedFactor,
        life,
        maxLife: life,
        size: 16 + Math.random() * 22,
      });
    };

    const drawParticles = () => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.size *= 0.982;

        if (p.life <= 0 || p.size < 1) {
          particles.splice(i, 1);
          continue;
        }

        const t = p.life / p.maxLife;
        // Fade in quickly, linger, then fade out
        const alpha = t < 0.15
          ? (t / 0.15) * 0.55
          : t * 0.55;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.filter = "blur(16px)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(160, 230, 255, 0.9)";
        ctx.fill();
        ctx.restore();
      }
    };

    // ─── Render loop ─────────────────────────────────────────────

    let raf = 0;

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      if (isVisible) {
        // Drive tweens
        setOrbX(mouse.x);
        setOrbY(mouse.y);
        setCoreX(mouse.x);
        setCoreY(mouse.y);

        // Velocity = how much the ORB moved this frame (not mouse delta)
        velX = orb.x - prevOrbX;
        velY = orb.y - prevOrbY;
        prevOrbX = orb.x;
        prevOrbY = orb.y;

        const speed = Math.hypot(velX, velY);
        smoothSpeed = smoothSpeed * 0.75 + speed * 0.25;

        // Emit multiple particles per frame when moving fast
        const emitCount = smoothSpeed > 8 ? 3 : smoothSpeed > 3 ? 2 : 1;
        for (let i = 0; i < emitCount; i++) {
          if (Math.random() < 0.82) emitSmoke();
        }

        const baseRadius = isHovering ? 64 : 46;
        const radius = baseRadius + smoothSpeed * 1.5;
        const alpha = Math.min(0.95, 0.5 + smoothSpeed / 28);

        // Draw back-to-front: smoke → orb → core
        drawParticles();
        drawOrb(orb.x, orb.y, radius, alpha);
        drawCore(core.x, core.y);
      }

      raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      if (document.head.contains(style)) document.head.removeChild(style);
      gsap.killTweensOf(orb);
      gsap.killTweensOf(core);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hidden md:block fixed inset-0 pointer-events-none z-[99999] mix-blend-screen"
    />
  );
}