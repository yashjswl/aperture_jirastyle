"use client";

import React, { useEffect, useRef } from "react";

const PALETTES = [
  { id: "blue", center: "#3b82f6", edge: "#0f172a" },
  { id: "purple", center: "#a855f7", edge: "#2e1065" },
  { id: "green", center: "#10b981", edge: "#022c22" },
  { id: "red", center: "#ef4444", edge: "#450a0a" },
  { id: "amber", center: "#f59e0b", edge: "#451a03" },
  { id: "teal", center: "#06b6d4", edge: "#083344" },
];

function createRandom(seed: number) {
  let s = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Lens = {
  x: number;
  y: number;
  r: number;
  color: typeof PALETTES[0];
  hasSilverRing: boolean;
  depth: number;
  rings: number[];
  glassR: number;
  shutterStart: number;
  hoverAmt: number;
};

export function GenerativeLensesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const lensesRef = useRef<Lens[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false }); // Optimize for no transparency on base canvas
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let raf: number;
    let isCancelled = false;

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const rand = createRandom(Date.now());
      const lenses: Lens[] = [];

      // Create a pool of varied sizes to pack densely without gaps
      const pool: number[] = [];
      for (let i = 0; i < 15; i++) pool.push(120 + rand() * 60); // Huge
      for (let i = 0; i < 40; i++) pool.push(70 + rand() * 40);  // Large
      for (let i = 0; i < 150; i++) pool.push(35 + rand() * 30); // Medium
      for (let i = 0; i < 250; i++) pool.push(15 + rand() * 15); // Small
      for (let i = 0; i < 300; i++) pool.push(8 + rand() * 5);   // Tiny gap-fillers

      pool.sort((a, b) => b - a);

      for (const r of pool) {
        for (let attempts = 0; attempts < 2500; attempts++) {
          const x = -100 + rand() * (width + 200);
          const y = -100 + rand() * (height + 200);
          let collision = false;
          
          for (const l of lenses) {
            const dist = Math.hypot(l.x - x, l.y - y);
            if (dist < (l.r + r) * 0.98) { // 2% overlap allows tight packing
              collision = true;
              break;
            }
          }
          
          if (!collision) {
            // Procedurally generate the concentric rings for the barrel
            const ringCount = 2 + Math.floor(rand() * 3);
            const rings = [];
            let currentR = 0.95;
            for (let i = 0; i < ringCount; i++) {
              rings.push(currentR);
              currentR -= 0.1 + rand() * 0.15;
            }
            const glassR = currentR; // Inner remaining space is the glass

            lenses.push({
              x, y, r,
              color: PALETTES[Math.floor(rand() * PALETTES.length)],
              hasSilverRing: rand() > 0.85,
              depth: 0.2 + rand() * 0.6,
              rings,
              glassR,
              shutterStart: 0,
              hoverAmt: 0,
            });
            break;
          }
        }
      }
      
      lensesRef.current = lenses;
      
      // Initial center
      mouseRef.current.tx = width / 2;
      mouseRef.current.ty = height / 2;
      mouseRef.current.x = width / 2;
      mouseRef.current.y = height / 2;
    };

    init();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 300);
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.tx = e.clientX;
      mouseRef.current.ty = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cx = width / 2;
      const cy = height / 2;
      const dx_m = mx - cx;
      const dy_m = my - cy;

      // Find topmost clicked lens (reverse order as smaller/later lenses might be on top)
      for (let i = lensesRef.current.length - 1; i >= 0; i--) {
        const l = lensesRef.current[i];
        const px = l.x + dx_m * -0.05 * l.depth;
        const py = l.y + dy_m * -0.05 * l.depth;
        
        if (Math.hypot(clickX - px, clickY - py) < l.r) {
          l.shutterStart = Date.now();
          break;
        }
      }
    };
    window.addEventListener("click", handleClick);

    const draw = () => {
      if (isCancelled) return;
      
      ctx.fillStyle = "#020202";
      ctx.fillRect(0, 0, width, height);

      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.1;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cx = width / 2;
      const cy = height / 2;

      const now = Date.now();
      const dx_m = mx - cx;
      const dy_m = my - cy;

      for (const l of lensesRef.current) {
        // Parallax depth calculation
        const px = l.x + dx_m * -0.05 * l.depth;
        const py = l.y + dy_m * -0.05 * l.depth;

        // Hover interaction
        const distToMouse = Math.hypot(mx - px, my - py);
        if (distToMouse < l.r * 1.5) {
          l.hoverAmt = Math.min(1, l.hoverAmt + 0.1);
        } else {
          l.hoverAmt = Math.max(0, l.hoverAmt - 0.05);
        }

        // Slight scale up on hover
        const scale = 1 + l.hoverAmt * 0.06;
        const sr = l.r * scale;

        // 1. Draw Outer Barrel & Shadow
        ctx.beginPath();
        ctx.arc(px, py, sr, 0, Math.PI * 2);
        ctx.fillStyle = "#0a0a0a";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 8;
        ctx.fill();
        ctx.shadowColor = "transparent"; // Reset shadows for rest of drawing

        // 2. Draw Concentric Rings
        for (let i = 0; i < l.rings.length; i++) {
          ctx.beginPath();
          ctx.arc(px, py, sr * l.rings[i], 0, Math.PI * 2);
          if (i === 1 && l.hasSilverRing) {
            ctx.fillStyle = "#bbbbbb";
          } else {
            ctx.fillStyle = i % 2 === 0 ? "#111111" : "#1a1a1a";
          }
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // 3. Draw Inner Glass
        const gR = sr * l.glassR;
        ctx.beginPath();
        ctx.arc(px, py, gR, 0, Math.PI * 2);
        
        // Dynamic iridescent gradient that shifts slightly towards the mouse
        const gx = px - gR * 0.2 + l.hoverAmt * gR * 0.4;
        const gy = py - gR * 0.2 + l.hoverAmt * gR * 0.4;
        const grad = ctx.createRadialGradient(gx, gy, 0, px, py, gR);
        grad.addColorStop(0, l.color.center);
        grad.addColorStop(0.5, l.color.edge);
        grad.addColorStop(1, "#020202");
        ctx.fillStyle = grad;
        ctx.fill();

        // 4. Draw Glint Reflection (Curved line)
        ctx.beginPath();
        ctx.arc(px, py, gR * 0.65, Math.PI * 0.8, Math.PI * 1.6);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + l.hoverAmt * 0.35})`;
        ctx.lineWidth = gR * 0.15;
        ctx.lineCap = "round";
        ctx.stroke();

        // 5. Draw Shutter Animation on Click
        if (l.shutterStart > 0) {
          const elapsed = now - l.shutterStart;
          const duration = 300; // Snap duration (ms)
          if (elapsed < duration) {
            const progress = elapsed / duration;
            // Iris closes (0) then opens (1) -> Math.abs scales this to a 'V' shape
            const aperture = Math.abs(progress - 0.5) * 2;
            
            ctx.beginPath();
            ctx.arc(px, py, gR, 0, Math.PI * 2, false); // Outer boundary (glass edge)
            ctx.arc(px, py, gR * aperture, 0, Math.PI * 2, true); // Inner hole boundary (counter-clockwise)
            ctx.fillStyle = "#050505";
            ctx.fill();
          } else {
            l.shutterStart = 0;
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -10 }}>
      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-auto cursor-pointer block" />
      {/* Subtle Overlay to ensure foreground content remains readable */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
    </div>
  );
}
