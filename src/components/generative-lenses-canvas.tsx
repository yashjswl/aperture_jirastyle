"use client";

import React, { useEffect, useRef } from "react";

const PALETTES = [
  { id: "blue", center: "#3b82f6", edge: "#1e3a8a" },
  { id: "purple", center: "#a855f7", edge: "#3b0764" },
  { id: "green", center: "#10b981", edge: "#064e3b" },
  { id: "red", center: "#ef4444", edge: "#450a0a" },
  { id: "amber", center: "#f59e0b", edge: "#451a03" },
  { id: "teal", center: "#06b6d4", edge: "#083344" },
  { id: "magenta", center: "#ec4899", edge: "#500724" },
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

type Ring = {
  rRatio: number;
  type: 'chrome' | 'text' | 'metal-dark' | 'metal-light';
  dashArray: number[];
};

type Lens = {
  x: number;
  y: number;
  r: number;
  color: typeof PALETTES[0];
  depth: number;
  rings: Ring[];
  glassR: number;
  blades: number;
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
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let raf: number;
    let isCancelled = false;

    const PI2 = Math.PI * 2;

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const rand = createRandom(Date.now());
      const lenses: Lens[] = [];

      // Balanced pool for high-fidelity rendering (fewer tiny lenses to keep 60fps with complex gradients)
      const pool: number[] = [];
      for (let i = 0; i < 15; i++) pool.push(140 + rand() * 60); // Huge
      for (let i = 0; i < 30; i++) pool.push(80 + rand() * 40);  // Large
      for (let i = 0; i < 80; i++) pool.push(45 + rand() * 30);  // Medium
      for (let i = 0; i < 150; i++) pool.push(20 + rand() * 20); // Small

      pool.sort((a, b) => b - a);

      for (const r of pool) {
        for (let attempts = 0; attempts < 3000; attempts++) {
          const x = -100 + rand() * (width + 200);
          const y = -100 + rand() * (height + 200);
          let collision = false;
          
          for (const l of lenses) {
            const dist = Math.hypot(l.x - x, l.y - y);
            if (dist < (l.r + r) * 0.98) {
              collision = true;
              break;
            }
          }
          
          if (!collision) {
            const ringCount = 3 + Math.floor(rand() * 4); // 3 to 6 rings
            const rings: Ring[] = [];
            let currentR = 0.95;
            
            const chromeIndex = rand() > 0.75 ? Math.floor(1 + rand() * (ringCount - 2)) : -1;
            const textIndex = rand() > 0.6 ? Math.floor(1 + rand() * (ringCount - 2)) : -1;
            
            for (let i = 0; i < ringCount; i++) {
              let type: Ring['type'] = 'metal-dark';
              if (i === chromeIndex) type = 'chrome';
              else if (i === textIndex) type = 'text';
              else type = (i % 2 === 0) ? 'metal-dark' : 'metal-light';
              
              rings.push({ 
                rRatio: currentR, 
                type,
                // Random dash pattern for fake text rings
                dashArray: [2 + rand() * 3, 4 + rand() * 6, 8 + rand() * 10, 4 + rand() * 4]
              });
              
              if (type === 'chrome') currentR -= 0.03 + rand() * 0.03;
              else if (type === 'text') currentR -= 0.06 + rand() * 0.04;
              else currentR -= 0.04 + rand() * 0.1;
            }

            lenses.push({
              x, y, r,
              color: PALETTES[Math.floor(rand() * PALETTES.length)],
              depth: 0.2 + rand() * 0.6,
              rings,
              glassR: currentR,
              blades: rand() > 0.5 ? 6 + Math.floor(rand() * 3) : 0, // 6 to 8 blades or none
              shutterStart: 0,
              hoverAmt: 0,
            });
            break;
          }
        }
      }
      
      lensesRef.current = lenses;
      
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

      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.15;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.15;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cx = width / 2;
      const cy = height / 2;

      const now = Date.now();
      const dx_m = mx - cx;
      const dy_m = my - cy;

      for (const l of lensesRef.current) {
        const px = l.x + dx_m * -0.05 * l.depth;
        const py = l.y + dy_m * -0.05 * l.depth;

        const distToMouse = Math.hypot(mx - px, my - py);
        if (distToMouse < l.r * 1.5) {
          l.hoverAmt = Math.min(1, l.hoverAmt + 0.1);
        } else {
          l.hoverAmt = Math.max(0, l.hoverAmt - 0.05);
        }

        const scale = 1 + l.hoverAmt * 0.06;
        const sr = l.r * scale;

        ctx.save();
        ctx.translate(px, py);

        // 1. Draw Outer Barrel & Shadow
        ctx.beginPath();
        ctx.arc(0, 0, sr, 0, PI2);
        
        // Studio lighting gradient on outer barrel (softbox top-left)
        const barrelGrad = ctx.createLinearGradient(-sr, -sr, sr, sr);
        barrelGrad.addColorStop(0, "#3a3a40");
        barrelGrad.addColorStop(0.3, "#1a1a1c");
        barrelGrad.addColorStop(1, "#050505");
        
        ctx.fillStyle = barrelGrad;
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 8;
        ctx.fill();
        ctx.shadowColor = "transparent";

        // 2. Draw Concentric Rings
        for (let i = 0; i < l.rings.length; i++) {
          const ring = l.rings[i];
          const ringR = sr * ring.rRatio;
          
          ctx.beginPath();
          ctx.arc(0, 0, ringR, 0, PI2);
          
          if (ring.type === 'chrome') {
            const chromeGrad = ctx.createLinearGradient(-ringR, -ringR, ringR, ringR);
            chromeGrad.addColorStop(0, "#eeeeee");
            chromeGrad.addColorStop(0.2, "#ffffff");
            chromeGrad.addColorStop(0.5, "#888888");
            chromeGrad.addColorStop(1, "#222222");
            ctx.fillStyle = chromeGrad;
            ctx.fill();
          } else if (ring.type === 'text') {
            ctx.fillStyle = "#0a0a0a";
            ctx.fill();
            
            // Draw fake text dashed ring
            ctx.beginPath();
            ctx.arc(0, 0, ringR * 0.95, 0, PI2);
            ctx.strokeStyle = "rgba(255,255,255,0.7)";
            ctx.lineWidth = Math.max(1, sr * 0.015);
            ctx.setLineDash(ring.dashArray.map(v => v * (sr / 100))); // scale dashes with lens
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            ctx.fillStyle = ring.type === 'metal-dark' ? "#111111" : "#18181a";
            ctx.fill();
            
            // Bevel Highlight (1-2px bright arc top-left)
            ctx.beginPath();
            ctx.arc(0, 0, ringR, Math.PI, Math.PI * 1.5);
            ctx.strokeStyle = "rgba(255,255,255,0.15)";
            ctx.lineWidth = Math.max(1, sr * 0.02);
            ctx.stroke();
          }
          
          // Inner groove shadow
          ctx.strokeStyle = "rgba(0,0,0,0.8)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // 3. Draw Inner Glass Element
        const gR = sr * l.glassR;
        ctx.beginPath();
        ctx.arc(0, 0, gR, 0, PI2);
        
        // Deep glass core gradient
        const glassGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, gR);
        glassGrad.addColorStop(0, "#050508"); // dark center focus
        glassGrad.addColorStop(0.4, l.color.center); // bright saturated core
        glassGrad.addColorStop(0.8, l.color.edge); // dark saturated edge
        glassGrad.addColorStop(1, "#020202"); // rim shadow
        ctx.fillStyle = glassGrad;
        ctx.fill();

        // 4. Aperture Blades (Inside glass)
        if (l.blades > 0) {
          ctx.beginPath();
          const bladeScale = gR * 0.65;
          for (let i = 0; i <= l.blades; i++) {
            const angle = (i / l.blades) * PI2;
            const bx = Math.cos(angle) * bladeScale;
            const by = Math.sin(angle) * bladeScale;
            if (i === 0) ctx.moveTo(bx, by);
            else ctx.lineTo(bx, by);
          }
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = Math.max(1, gR * 0.02);
          ctx.stroke();
        }

        // 5. Optical Reflections (Specular Highlights)
        const hoverShiftX = l.hoverAmt * gR * 0.4;
        const hoverShiftY = l.hoverAmt * gR * 0.4;

        // Soft broad reflection (diffuse softbox)
        const softGlint = ctx.createRadialGradient(
          -gR*0.2 + hoverShiftX, -gR*0.2 + hoverShiftY, 0, 
          -gR*0.2 + hoverShiftX, -gR*0.2 + hoverShiftY, gR*0.8
        );
        softGlint.addColorStop(0, `rgba(255,255,255, ${0.15 + l.hoverAmt * 0.2})`);
        softGlint.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(0, 0, gR, 0, PI2);
        ctx.fillStyle = softGlint;
        ctx.fill();

        // Sharp bright reflection (bulb/window)
        ctx.beginPath();
        ctx.ellipse(
          -gR*0.35 + hoverShiftX, -gR*0.35 + hoverShiftY, 
          gR*0.25, gR*0.08, 
          Math.PI / -4, 0, PI2
        );
        ctx.fillStyle = `rgba(255,255,255, ${0.4 + l.hoverAmt * 0.4})`;
        ctx.fill();

        // 6. Mechanical Shutter Animation
        if (l.shutterStart > 0) {
          const elapsed = now - l.shutterStart;
          const duration = 250; 
          if (elapsed < duration) {
            const progress = elapsed / duration;
            const aperture = Math.abs(progress - 0.5) * 2;
            
            ctx.beginPath();
            ctx.arc(0, 0, gR, 0, PI2, false);
            ctx.arc(0, 0, gR * aperture, 0, PI2, true);
            ctx.fillStyle = "#050505";
            ctx.fill();
            
            // Draw blade lines on closing shutter
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * PI2 + progress * Math.PI;
              ctx.moveTo(Math.cos(angle) * (gR * aperture), Math.sin(angle) * (gR * aperture));
              ctx.lineTo(Math.cos(angle + 0.5) * gR, Math.sin(angle + 0.5) * gR);
            }
            ctx.strokeStyle = "#1a1a1a";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
          } else {
            l.shutterStart = 0;
          }
        }

        ctx.restore();
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
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-auto cursor-pointer block" />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
    </div>
  );
}
