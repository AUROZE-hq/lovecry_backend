'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  disabled?: boolean;
  onChange: (dataUrl: string | null) => void;
};

export default function SignaturePad({ disabled, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const emit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    const empty = blank.toDataURL();
    const data = canvas.toDataURL('image/png');
    onChange(data === empty ? null : data);
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={640}
        height={200}
        className="w-full touch-none rounded-xl border border-white/20 bg-white"
        aria-label="Signature drawing area"
        onPointerDown={(e) => {
          if (disabled) return;
          drawing.current = true;
          canvasRef.current?.setPointerCapture(e.pointerId);
          const ctx = canvasRef.current?.getContext('2d');
          const p = pos(e);
          ctx?.beginPath();
          ctx?.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current || disabled) return;
          const ctx = canvasRef.current?.getContext('2d');
          const p = pos(e);
          ctx?.lineTo(p.x, p.y);
          ctx?.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
          emit();
        }}
      />
      <button
        type="button"
        onClick={clear}
        disabled={disabled}
        className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/50 hover:text-white"
      >
        Clear signature
      </button>
    </div>
  );
}
