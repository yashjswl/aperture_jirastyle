"use client";

import React, { useEffect, useRef, useState } from "react";

const MAX_PARTICLES = 600;
const INTERACTION_RADIUS = 120;
const R_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS;
const MIN_DIST_SQ = 400; // Softening factor (20px)
const DAMPING = 0.92;
const MAX_SPEED = 400; 

const PALETTE = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#ec4899"];

function createParticleSprites() {
  if (typeof document === "undefined") return [];
  // Generate 3 sizes for each color
  const sprites: HTMLCanvasElement[][] = [];
  const sizes = [4, 8, 12]; // Small, Medium, Large radius
  
  for (const color of PALETTE) {
    const sizeArr = [];
    for (const r of sizes) {
      const c = document.createElement("canvas");
      c.width = r * 4;
      c.height = r * 4;
      const ctx = c.getContext("2d")!;
      const grad = ctx!.createRadialGradient(r * 2, r * 2, r * 0.2, r * 2, r * 2, r * 2);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, r * 4, r * 4);
      sizeArr.push(c);
    }
    sprites.push(sizeArr);
  }
  return sprites;
}

export function ParticlePhysicsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<"electrostatic" | "magnetic">("electrostatic");
  const modeRef = useRef(mode);
  
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particleCount = 350; // Starting adaptive count
    
    // Arrays for Spatial Hash
    let cols = 0;
    let rows = 0;
    let head = new Int32Array(0);
    let next = new Int32Array(MAX_PARTICLES);

    // Typed Arrays for Physics
    const posX = new Float32Array(MAX_PARTICLES);
    const posY = new Float32Array(MAX_PARTICLES);
    const velX = new Float32Array(MAX_PARTICLES);
    const velY = new Float32Array(MAX_PARTICLES);
    const charge = new Int8Array(MAX_PARTICLES); // +1 or -1
    const colorIdx = new Uint8Array(MAX_PARTICLES);
    const sizeIdx = new Uint8Array(MAX_PARTICLES);
    const mass = new Float32Array(MAX_PARTICLES);

    // Initialize particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      posX[i] = Math.random() * window.innerWidth;
      posY[i] = Math.random() * window.innerHeight;
      velX[i] = (Math.random() - 0.5) * 50;
      velY[i] = (Math.random() - 0.5) * 50;
      charge[i] = Math.random() > 0.5 ? 1 : -1;
      colorIdx[i] = Math.floor(Math.random() * PALETTE.length);
      sizeIdx[i] = Math.floor(Math.random() * 3);
      mass[i] = sizeIdx[i] === 0 ? 0.5 : (sizeIdx[i] === 1 ? 1.0 : 2.0);
    }

    const sprites = createParticleSprites();
    
    // Interaction
    const mouse = { x: -1000, y: -1000, down: false };
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      } else {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
    };
    const handleDown = () => mouse.down = true;
    const handleUp = () => mouse.down = false;
    
    const handleClick = (e: MouseEvent) => {
      // Burst effect: Push nearby particles
      const mx = e.clientX;
      const my = e.clientY;
      for (let i = 0; i < particleCount; i++) {
        const dx = posX[i] - mx;
        const dy = posY[i] - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < 40000) {
          const dist = Math.sqrt(distSq);
          const force = 5000 / Math.max(dist, 10);
          velX[i] += (dx / dist) * force;
          velY[i] += (dy / dist) * force;
        }
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchstart", handleDown);
    window.addEventListener("touchend", handleUp);
    window.addEventListener("click", handleClick);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx!.scale(dpr, dpr);
      
      cols = Math.ceil(width / INTERACTION_RADIUS);
      rows = Math.ceil(height / INTERACTION_RADIUS);
      head = new Int32Array(cols * rows);
    };
    window.addEventListener("resize", resize);
    resize();

    // Respect reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Time tracking
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsTime = lastTime;
    let raf: number;
    let isPaused = false;

    const handleVisibility = () => {
      isPaused = document.hidden;
      if (!isPaused) lastTime = performance.now();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    function step() {
      raf = requestAnimationFrame(step);
      if (isPaused) return;

      const now = performance.now();
      let dt = (now - lastTime) / 1000;
      lastTime = now;
      
      // Clamp dt to avoid huge jumps on lag spikes
      if (dt > 0.05) dt = 0.05;
      
      // Adaptive FPS
      frameCount++;
      if (now - lastFpsTime > 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastFpsTime = now;
        
        if (fps < 50 && particleCount > 100) {
          particleCount -= 20; // Reduce density to maintain 60fps
        } else if (fps > 58 && particleCount < MAX_PARTICLES) {
          particleCount += 10;
        }
      }

      // 1. Build Spatial Hash Grid
      head.fill(-1);
      for (let i = 0; i < particleCount; i++) {
        let col = Math.floor(posX[i] / INTERACTION_RADIUS);
        let row = Math.floor(posY[i] / INTERACTION_RADIUS);
        if (col < 0) col = 0; else if (col >= cols) col = cols - 1;
        if (row < 0) row = 0; else if (row >= rows) row = rows - 1;
        const cell = col + row * cols;
        next[i] = head[cell];
        head[cell] = i;
      }

      const isMagnetic = modeRef.current === "magnetic";
      const mForceMult = mouse.down ? 3 : 1;
      const mRadiusSq = (mouse.down ? 300 : 150) ** 2;

      // Render: Trails (fade instead of clear)
      ctx!.fillStyle = "rgba(2, 2, 2, 0.25)";
      ctx!.fillRect(0, 0, width, height);
      
      ctx!.lineWidth = 1;
      // We will batch lines by type (attract vs repel)
      const attractLines: number[] = [];
      const repelLines: number[] = [];

      // 2. Physics & Line Generation
      if (!prefersReduced) {
        for (let i = 0; i < particleCount; i++) {
          const px = posX[i];
          const py = posY[i];
          const ch = charge[i];
          let ax = 0;
          let ay = 0;

          // Mouse Force
          const mdx = px - mouse.x;
          const mdy = py - mouse.y;
          const mdSq = mdx * mdx + mdy * mdy;
          if (mdSq < mRadiusSq) {
            const mDist = Math.sqrt(mdSq);
            // Attract to mouse
            const f = (10000 * mForceMult) / Math.max(mdSq, 100);
            ax -= (mdx / mDist) * f;
            ay -= (mdy / mDist) * f;
          }

          // Idle drift (perlin-like pseudo random)
          ax += Math.sin(py * 0.01 + now * 0.001) * 20;
          ay += Math.cos(px * 0.01 + now * 0.001) * 20;

          // Neighbor interactions
          let col = Math.floor(px / INTERACTION_RADIUS);
          let row = Math.floor(py / INTERACTION_RADIUS);
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
                  if (i < j) { // Only calc each pair once (i < j) for lines
                    const dx = posX[j] - px;
                    const dy = posY[j] - py;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < R_SQ) {
                      const F = (80000 * ch * charge[j]) / Math.max(distSq, MIN_DIST_SQ);
                      const dist = Math.sqrt(distSq);
                      const nx = dx / dist;
                      const ny = dy / dist;
                      
                      let fx = 0, fy = 0;
                      if (isMagnetic) {
                        // Magnetic: perpendicular force
                        fx = -ny * F;
                        fy = nx * F;
                      } else {
                        // Electrostatic: straight line force
                        fx = -nx * F;
                        fy = -ny * F;
                      }

                      // Apply to both
                      ax += fx / mass[i];
                      ay += fy / mass[i];
                      velX[j] -= fx / mass[j];
                      velY[j] -= fy / mass[j];

                      // Add to line buffers
                      if (ch === charge[j]) {
                        repelLines.push(px, py, posX[j], posY[j], distSq);
                      } else {
                        attractLines.push(px, py, posX[j], posY[j], distSq);
                      }
                    }
                  }
                  j = next[j];
                }
              }
            }
          }

          velX[i] += ax * dt;
          velY[i] += ay * dt;
          
          // Damping & Speed Limit
          velX[i] *= DAMPING;
          velY[i] *= DAMPING;
          
          const speedSq = velX[i] * velX[i] + velY[i] * velY[i];
          if (speedSq > MAX_SPEED * MAX_SPEED) {
            const speed = Math.sqrt(speedSq);
            velX[i] = (velX[i] / speed) * MAX_SPEED;
            velY[i] = (velY[i] / speed) * MAX_SPEED;
          }
        }

        // Integration & Toroidal Wrap
        for (let i = 0; i < particleCount; i++) {
          posX[i] += velX[i] * dt;
          posY[i] += velY[i] * dt;
          
          if (posX[i] < 0) posX[i] += width;
          else if (posX[i] > width) posX[i] -= width;
          
          if (posY[i] < 0) posY[i] += height;
          else if (posY[i] > height) posY[i] -= height;
        }
      }

      // 3. Draw Lines (Batched)
      ctx!.globalCompositeOperation = "screen";
      
      const drawLineBatch = (lines: number[], strokeStyleBase: string) => {
        if (lines.length === 0) return;
        // Group by alpha to minimize state changes
        for (let step = 0; step < 5; step++) {
          const alphaThresh = 1 - (step / 5);
          const lowerAlphaThresh = 1 - ((step + 1) / 5);
          let hasLines = false;
          
          ctx!.beginPath();
          for (let k = 0; k < lines.length; k += 5) {
            const distSq = lines[k + 4];
            const opacity = 1 - Math.sqrt(distSq) / INTERACTION_RADIUS;
            if (opacity <= alphaThresh && opacity > lowerAlphaThresh) {
              ctx!.moveTo(lines[k], lines[k + 1]);
              ctx!.lineTo(lines[k + 2], lines[k + 3]);
              hasLines = true;
            }
          }
          if (hasLines) {
            ctx!.strokeStyle = `rgba(${strokeStyleBase}, ${alphaThresh * 0.4})`;
            ctx!.stroke();
          }
        }
      };

      // Attract lines (opposite charges) -> Soft White/Cyan
      drawLineBatch(attractLines, "255, 255, 255");
      // Repel lines (same charges) -> Subtle Red/Pink
      drawLineBatch(repelLines, "239, 68, 68");

      ctx!.globalCompositeOperation = "source-over";

      // 4. Draw Particles (Sprites)
      if (sprites.length > 0) {
        for (let i = 0; i < particleCount; i++) {
          const s = sprites[colorIdx[i]][sizeIdx[i]];
          if (s) {
            const r = (sizeIdx[i] === 0 ? 4 : (sizeIdx[i] === 1 ? 8 : 12));
            ctx!.drawImage(s, posX[i] - r * 2, posY[i] - r * 2);
          }
        }
      }
    }
    
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchstart", handleDown);
      window.removeEventListener("touchend", handleUp);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[-10] bg-[#020202] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-auto" />
      
      {/* Control Panel (Minimal & Unobtrusive) */}
      <div className="absolute bottom-6 right-6 z-50 glass-panel-front p-4 rounded-xl flex items-center gap-4 animate-fade-in pointer-events-auto shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-2">Force Law</span>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("electrostatic")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === "electrostatic" ? "bg-white/20 text-white" : "text-white/40 hover:bg-white/5"
              }`}
            >
              Electrostatic
            </button>
            <button
              onClick={() => setMode("magnetic")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === "magnetic" ? "bg-white/20 text-white" : "text-white/40 hover:bg-white/5"
              }`}
            >
              Magnetic
            </button>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
    </div>
  );
}
