"use client";

import React, { useEffect, useRef, useState } from "react";

// --- Constants & Config ---
const BASE_BG_COLOR = "#06060a";
const HUES = [255, 165, 15, 335, 205]; 

interface Config {
  numParticles: number;
  numOrbs: number;
  starSpawnRate: number;
}

const MODES = {
  calm: { numParticles: 130, numOrbs: 26, starSpawnRate: 0.005 },
  event: { numParticles: 190, numOrbs: 40, starSpawnRate: 0.015 },
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function ParticlePhysicsBackground() {
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"calm" | "event">("calm");
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!fgCanvasRef.current || !bgCanvasRef.current || !containerRef.current) return;
    const fgCanvas = fgCanvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    const fgCtx = fgCanvas.getContext("2d", { alpha: false });
    const bgCtx = bgCanvas.getContext("2d", { alpha: false });
    if (!fgCtx || !bgCtx) return;

    let width = 0;
    let height = 0;
    
    // Spatial Hash Config
    const CELL_SIZE = 220;
    let cols = 0;
    let rows = 0;
    let head = new Int32Array(0);
    let next = new Int32Array(0);

    // --- State ---
    let particles: any[] = [];
    let orbs: any[] = [];
    let gravityWells: any[] = [];
    let shootingStars: any[] = [];
    let globalHueShift = 0;
    let frame = 0;
    let rafId: number;

    const mouse = { x: -1000, y: -1000, down: false };

    // --- Initialization ---
    const initEntities = (w: number, h: number) => {
      const config = MODES[modeRef.current];
      
      particles = Array.from({ length: config.numParticles }, (_, i) => ({
        id: i,
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.5, 0.5),
        vy: rand(-0.5, 0.5),
        q: Math.random() > 0.5 ? 1 : -1,
        r: rand(1.4, 4),
        phase: rand(0, Math.PI * 2),
        hueIdx: randInt(0, HUES.length),
      }));

      // Reallocate spatial hash arrays
      next = new Int32Array(config.numParticles);

      orbs = Array.from({ length: config.numOrbs }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.1, 0.1),
        vy: rand(-0.1, 0.1),
        r: rand(40, 120),
        hueIdx: randInt(0, HUES.length),
        opacity: rand(0.05, 0.15),
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); 
      
      [fgCanvas, bgCanvas].forEach((c) => {
        c.width = width * dpr;
        c.height = height * dpr;
      });
      
      fgCtx.scale(dpr, dpr);
      bgCtx.scale(dpr, dpr);
      
      cols = Math.ceil(width / CELL_SIZE);
      rows = Math.ceil(height / CELL_SIZE);
      head = new Int32Array(cols * rows);

      initEntities(width, height);
    };

    window.addEventListener("resize", resize);
    resize();

    // --- Event Listeners ---
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      } else {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
    };
    const handleDown = () => (mouse.down = true);
    const handleUp = () => (mouse.down = false);
    
    const handleDoubleClick = (e: MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;
      gravityWells.push({ x: mx, y: my, life: 220, maxLife: 220 });
      
      for (const p of particles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < 130 * 130) {
          const dist = Math.sqrt(distSq) || 1;
          const force = 150 / dist;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchstart", handleDown);
    window.addEventListener("touchend", handleUp);
    window.addEventListener("dblclick", handleDoubleClick);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Main Loop ---
    const step = () => {
      rafId = requestAnimationFrame(step);
      if (prefersReduced) return; 

      frame++;
      globalHueShift += 0.05;
      const config = MODES[modeRef.current];

      // 1. Background Orbs (No CSS Blur!)
      bgCtx.fillStyle = BASE_BG_COLOR;
      bgCtx.fillRect(0, 0, width, height);
      
      bgCtx.globalCompositeOperation = "screen";
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.r) orb.x = width + orb.r;
        if (orb.x > width + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = height + orb.r;
        if (orb.y > height + orb.r) orb.y = -orb.r;

        const h = (HUES[orb.hueIdx] + globalHueShift) % 360;
        
        // Massive performance boost: use radial gradient instead of ctx.filter = 'blur()'
        const grad = bgCtx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, `hsla(${h}, 70%, 60%, ${orb.opacity})`);
        grad.addColorStop(1, `hsla(${h}, 70%, 60%, 0)`);
        
        bgCtx.beginPath();
        bgCtx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        bgCtx.fillStyle = grad;
        bgCtx.fill();
      }
      bgCtx.globalCompositeOperation = "source-over";

      // 2. Foreground Trails & Clear
      fgCtx.fillStyle = `rgba(6, 6, 10, 0.2)`;
      fgCtx.fillRect(0, 0, width, height);

      // 3. Process Gravity Wells
      for (let i = gravityWells.length - 1; i >= 0; i--) {
        const gw = gravityWells[i];
        gw.life--;
        if (gw.life <= 0) {
          gravityWells.splice(i, 1);
        }
      }

      // 4. Build Spatial Hash for O(n) collision
      head.fill(-1);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let col = Math.floor(p.x / CELL_SIZE);
        let row = Math.floor(p.y / CELL_SIZE);
        if (col < 0) col = 0; else if (col >= cols) col = cols - 1;
        if (row < 0) row = 0; else if (row >= rows) row = rows - 1;
        const cell = col + row * cols;
        next[i] = head[cell];
        head[cell] = i;
      }

      const mouseRadius = mouse.down ? 220 : 130;
      const mouseRadiusSq = mouseRadius * mouseRadius;

      // Batches for drawing lines to minimize ctx.stroke() calls (massive FPS boost)
      const lineBatches: number[][] = [[], [], [], [], []];

      // 5. Physics: Particle-Particle (Spatial Hash)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        let col = Math.floor(p1.x / CELL_SIZE);
        let row = Math.floor(p1.y / CELL_SIZE);
        if (col < 0) col = 0; else if (col >= cols) col = cols - 1;
        if (row < 0) row = 0; else if (row >= rows) row = rows - 1;

        for (let ro = -1; ro <= 1; ro++) {
          for (let co = -1; co <= 1; co++) {
            const nrow = row + ro;
            const ncol = col + co;
            if (nrow >= 0 && nrow < rows && ncol >= 0 && ncol < cols) {
              const cell = ncol + nrow * cols;
              let j = head[cell];
              
              while (j !== -1) {
                if (i < j) {
                  const p2 = particles[j];
                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  const distSq = dx * dx + dy * dy;

                  if (distSq < 220 * 220) {
                    const dist = Math.sqrt(distSq);
                    const force = (p1.q * p2.q * 150) / Math.max(distSq, 50); 
                    
                    const px = (dx / dist) * force;
                    const py = (dy / dist) * force;
                    
                    p1.vx -= px;
                    p1.vy -= py;
                    p2.vx += px;
                    p2.vy += py;

                    // Render curved connections
                    if (dist < 95) {
                      const alpha = 1 - (dist / 95);
                      const batchIdx = Math.min(4, Math.floor(alpha * 5));
                      const cpX = (p1.x + p2.x) / 2 + (p1.y - p2.y) * 0.15;
                      const cpY = (p1.y + p2.y) / 2 + (p2.x - p1.x) * 0.15;
                      lineBatches[batchIdx].push(p1.x, p1.y, cpX, cpY, p2.x, p2.y);
                    }
                  }
                }
                j = next[j];
              }
            }
          }
        }

        // Mouse attraction
        const mdx = p1.x - mouse.x;
        const mdy = p1.y - mouse.y;
        const mdSq = mdx * mdx + mdy * mdy;
        if (mdSq < mouseRadiusSq) {
          const mDist = Math.sqrt(mdSq) || 1;
          const pull = (1 - mDist / mouseRadius) * 0.5;
          p1.vx -= (mdx / mDist) * pull;
          p1.vy -= (mdy / mDist) * pull;
        }

        // Gravity Wells
        for (const gw of gravityWells) {
          const gdx = p1.x - gw.x;
          const gdy = p1.y - gw.y;
          const gdSq = gdx * gdx + gdy * gdy;
          if (gdSq < 130 * 130) {
            const gDist = Math.sqrt(gdSq) || 1;
            const lifeRatio = gw.life / gw.maxLife;
            const falloff = Math.pow(1 - gDist / 130, 2);
            
            const pullF = 0.8 * lifeRatio * falloff;
            const swirlF = 1.2 * lifeRatio * falloff;

            p1.vx -= (gdx / gDist) * pullF;
            p1.vy -= (gdy / gDist) * pullF;
            p1.vx -= (gdy / gDist) * swirlF;
            p1.vy += (gdx / gDist) * swirlF;
          }
        }

        // Damping, Clamping & Update
        p1.vx *= 0.965;
        p1.vy *= 0.965;
        
        const speed = Math.hypot(p1.vx, p1.vy);
        if (speed > 5) {
          p1.vx = (p1.vx / speed) * 5;
          p1.vy = (p1.vy / speed) * 5;
        }

        p1.x += p1.vx;
        p1.y += p1.vy;

        // Wrap around edges
        if (p1.x < 0) p1.x += width;
        if (p1.x > width) p1.x -= width;
        if (p1.y < 0) p1.y += height;
        if (p1.y > height) p1.y -= height;
      }

      // 6. Draw connection lines in batches (Massive FPS fix)
      fgCtx.globalCompositeOperation = "screen";
      for (let i = 0; i < 5; i++) {
        const batch = lineBatches[i];
        if (batch.length === 0) continue;
        
        fgCtx.beginPath();
        for (let k = 0; k < batch.length; k += 6) {
          fgCtx.moveTo(batch[k], batch[k+1]);
          fgCtx.quadraticCurveTo(batch[k+2], batch[k+3], batch[k+4], batch[k+5]);
        }
        // Alpha ranges from 0.1 to 0.3 depending on batch
        fgCtx.strokeStyle = `rgba(255, 255, 255, ${(i + 1) * 0.06})`;
        fgCtx.lineWidth = 1;
        fgCtx.stroke();
      }

      // 7. Render Particles (No shadowBlur!)
      for (const p of particles) {
        const h = (HUES[p.hueIdx] + globalHueShift) % 360;
        const alpha = 0.5 + 0.5 * Math.sin(frame * 0.05 + p.phase);
        
        // Solid core
        fgCtx.beginPath();
        fgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        fgCtx.fillStyle = `hsla(${h}, 80%, 70%, ${alpha})`;
        fgCtx.fill();
        
        // Fake soft glow (orders of magnitude faster than shadowBlur)
        fgCtx.beginPath();
        fgCtx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        fgCtx.fillStyle = `hsla(${h}, 80%, 70%, ${alpha * 0.3})`;
        fgCtx.fill();
      }
      fgCtx.globalCompositeOperation = "source-over";

      // 8. Shooting Stars
      if (Math.random() < config.starSpawnRate) {
        const fromLeft = Math.random() > 0.5;
        shootingStars.push({
          x: fromLeft ? 0 : width,
          y: rand(0, height * 0.6),
          vx: fromLeft ? rand(5, 10) : rand(-10, -5),
          vy: rand(2, 6),
          trail: [],
          life: 300,
        });
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life--;
        
        for (const gw of gravityWells) {
          const gdx = ss.x - gw.x;
          const gdy = ss.y - gw.y;
          const gdSq = gdx * gdx + gdy * gdy;
          if (gdSq < 200 * 200) {
            const gDist = Math.sqrt(gdSq) || 1;
            const lifeRatio = gw.life / gw.maxLife;
            const falloff = 1 - gDist / 200;
            
            const pullF = 2.0 * lifeRatio * falloff;
            const swirlF = 3.0 * lifeRatio * falloff;

            ss.vx -= (gdx / gDist) * pullF;
            ss.vy -= (gdy / gDist) * pullF;
            ss.vx -= (gdy / gDist) * swirlF;
            ss.vy += (gdx / gDist) * swirlF;
          }
        }

        const speed = Math.hypot(ss.vx, ss.vy);
        if (speed > 15) {
          ss.vx = (ss.vx / speed) * 15;
          ss.vy = (ss.vy / speed) * 15;
        }

        ss.x += ss.vx;
        ss.y += ss.vy;
        
        ss.trail.unshift({ x: ss.x, y: ss.y });
        if (ss.trail.length > 14) ss.trail.pop();

        for (let j = 0; j < ss.trail.length; j++) {
          const tp = ss.trail[j];
          const opacity = 1 - j / 14;
          fgCtx.beginPath();
          fgCtx.arc(tp.x, tp.y, 1.5, 0, Math.PI * 2);
          fgCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          fgCtx.fill();
        }

        if (ss.life <= 0 || ss.x < -100 || ss.x > width + 100 || ss.y > height + 100) {
          shootingStars.splice(i, 1);
        }
      }

      // 9. Render Gravity Wells
      for (const gw of gravityWells) {
        const lifeRatio = gw.life / gw.maxLife;
        const r = 130 * (1 - Math.pow(lifeRatio, 3)); 
        fgCtx.beginPath();
        fgCtx.arc(gw.x, gw.y, r, 0, Math.PI * 2);
        fgCtx.strokeStyle = `rgba(255, 255, 255, ${lifeRatio * 0.4})`;
        fgCtx.lineWidth = 1.5;
        fgCtx.stroke();
      }

      // 10. Vignette
      const grad = fgCtx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height) * 0.8);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.6)");
      fgCtx.fillStyle = grad;
      fgCtx.fillRect(0, 0, width, height);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchstart", handleDown);
      window.removeEventListener("touchend", handleUp);
      window.removeEventListener("dblclick", handleDoubleClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[-10] bg-[#06060a] overflow-hidden">
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <canvas ref={fgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-auto" />
      
      <div className="absolute top-6 left-6 z-50 p-1.5 rounded-full glass-panel-front flex items-center shadow-xl animate-fade-in pointer-events-auto">
        <button
          onClick={() => setMode("calm")}
          className={`px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-all duration-300 ${
            mode === "calm" 
              ? "bg-white/20 text-white shadow-sm" 
              : "text-white/40 hover:text-white/80"
          }`}
        >
          CALM MODE
        </button>
        <button
          onClick={() => setMode("event")}
          className={`px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-all duration-300 ${
            mode === "event" 
              ? "bg-white/20 text-white shadow-sm" 
              : "text-white/40 hover:text-white/80"
          }`}
        >
          EVENT MODE
        </button>
      </div>
    </div>
  );
}
