"use client";

import React, { useEffect, useRef, useState } from "react";


type LensData = {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  ringColor: string;
  rotation: number;
};

const LENS_COLORS = ["#3b82f6", "#8b5cf6", "#eab308", "#22c55e", "#14b8a6"];
const RING_COLORS = ["#ef4444", "#e5e7eb", "transparent", "transparent", "transparent"];

// Simple seeded random function
function createRandom(seed?: number) {
  let s = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function CameraLensesBackground({ seed }: { seed?: number }) {
  const [lenses, setLenses] = useState<LensData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lensesRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Generate lenses on mount
    const generateLenses = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const rand = createRandom(seed);
      
      const newLenses: LensData[] = [];
      const padding = 5;
      
      // Target radii to pack
      const radii = [];
      for (let i = 0; i < 5; i++) radii.push(120 + rand() * 40); // 5 large
      for (let i = 0; i < 15; i++) radii.push(70 + rand() * 40); // 15 medium
      for (let i = 0; i < 40; i++) radii.push(30 + rand() * 35); // 40 small
      
      // Sort largest first for better packing
      radii.sort((a, b) => b - a);

      for (const r of radii) {
        let placed = false;
        // try 2000 times to place this circle
        for (let attempts = 0; attempts < 2000; attempts++) {
          const x = r + rand() * (width - r * 2);
          const y = r + rand() * (height - r * 2);
          
          let collision = false;
          for (const lens of newLenses) {
            const dx = lens.x - x;
            const dy = lens.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < lens.r + r + padding) {
              collision = true;
              break;
            }
          }
          
          if (!collision) {
            newLenses.push({
              id: newLenses.length,
              x,
              y,
              r,
              color: LENS_COLORS[Math.floor(rand() * LENS_COLORS.length)],
              ringColor: RING_COLORS[Math.floor(rand() * RING_COLORS.length)],
              rotation: rand() * 360,
            });
            placed = true;
            break;
          }
        }
      }
      setLenses(newLenses);
      
      // Init mouse target to center
      mouseRef.current.targetX = width / 2;
      mouseRef.current.targetY = height / 2;
      mouseRef.current.x = width / 2;
      mouseRef.current.y = height / 2;
    };

    generateLenses();

    // Re-generate on resize (debounced)
    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(generateLenses, 300);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [seed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    
    const tick = () => {
      // Lerp mouse
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      
      const { x: mx, y: my } = mouseRef.current;

      lensesRefs.current.forEach((el, i) => {
        if (!el || !lenses[i]) return;
        const data = lenses[i];
        
        const dx = mx - data.x;
        const dy = my - data.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 400;
        
        // Parallax shift based on cursor distance
        const influence = Math.max(0, 1 - dist / maxDist);
        const tx = dx * influence * -0.06;
        const ty = dy * influence * -0.06;
        
        // Update outer wrapper transform
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        
        // Shift reflection highlight
        const hl = el.querySelector(".lens-highlight") as SVGEllipseElement;
        if (hl) {
          const hx = dx * 0.04;
          const hy = dy * 0.04;
          hl.setAttribute("cx", `${45 + hx / (data.r * 0.1)}%`);
          hl.setAttribute("cy", `${45 + hy / (data.r * 0.1)}%`);
        }
      });
      
      rafRef.current = requestAnimationFrame(tick);
    };
    
    rafRef.current = requestAnimationFrame(tick);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [lenses]);

  const handleLensClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Add 90 degrees to CSS variable to trigger spin transition
    const target = e.currentTarget.querySelector(".lens-inner") as HTMLDivElement;
    if (target) {
      const currentRot = parseFloat(target.style.getPropertyValue("--rot") || "0");
      target.style.setProperty("--rot", `${currentRot + 90}deg`);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none bg-[#0a0a0a]"
      style={{ zIndex: -10 }}
    >
      {/* Soft ambient gradient behind the lenses */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(30, 40, 50, 0.4) 0%, transparent 80%)"
        }}
      />
      
      {lenses.map((lens, i) => (
        <div
          key={lens.id}
          ref={(el) => { lensesRefs.current[i] = el; }}
          className="absolute will-change-transform"
          style={{
            left: lens.x - lens.r,
            top: lens.y - lens.r,
            width: lens.r * 2,
            height: lens.r * 2,
          }}
        >
          {/* Inner div handles hover and spin (pointer events enabled so we can hover/click) */}
          <div 
            className="lens-inner absolute inset-0 pointer-events-auto rounded-full cursor-pointer will-change-transform"
            style={{ 
              "--rot": `${lens.rotation}deg`,
              transform: "rotate(var(--rot)) scale(1)",
              transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.3s ease",
            } as React.CSSProperties}
            onClick={handleLensClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "rotate(var(--rot)) scale(1.05)";
              e.currentTarget.style.filter = "brightness(1.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "rotate(var(--rot)) scale(1)";
              e.currentTarget.style.filter = "brightness(1)";
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
              <defs>
                {/* Main Glass Reflection */}
                <radialGradient id={`glass-${lens.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={lens.color} stopOpacity="0.4" />
                  <stop offset="60%" stopColor={lens.color} stopOpacity="0.1" />
                  <stop offset="90%" stopColor="#050505" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#000" stopOpacity="1" />
                </radialGradient>
                
                {/* Outer Barrel Gradient */}
                <linearGradient id={`barrel-${lens.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a1a1a" />
                  <stop offset="50%" stopColor="#0a0a0a" />
                  <stop offset="100%" stopColor="#050505" />
                </linearGradient>
                
                {/* Inner Threading Gradient */}
                <linearGradient id={`threads-${lens.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#111" />
                  <stop offset="100%" stopColor="#222" />
                </linearGradient>
              </defs>

              {/* Outer Barrel */}
              <circle cx="50" cy="50" r="49" fill={`url(#barrel-${lens.id})`} />
              
              {/* Outer Grip / Focus Ring (dashed) */}
              <circle cx="50" cy="50" r="46" fill="none" stroke="#222" strokeWidth="4" strokeDasharray="2 3" />
              
              {/* Red/Silver Band (like Canon L-series) */}
              <circle cx="50" cy="50" r="41" fill="none" stroke={lens.ringColor} strokeWidth="1.5" />
              
              {/* Inner Barrel Stepping */}
              <circle cx="50" cy="50" r="37" fill="#0d0d0d" stroke="#151515" strokeWidth="1" />
              <circle cx="50" cy="50" r="32" fill="none" stroke={`url(#threads-${lens.id})`} strokeWidth="4" strokeDasharray="0.5 1" />
              <circle cx="50" cy="50" r="27" fill="#050505" stroke="#111" strokeWidth="0.5" />
              
              {/* Filter Thread Ring */}
              <circle cx="50" cy="50" r="24" fill="none" stroke="#1a1a1a" strokeWidth="1" />
              
              {/* Glass Element */}
              <circle cx="50" cy="50" r="23" fill={`url(#glass-${lens.id})`} />
              
              {/* Inner Glass Element (Aperture opening suggestion) */}
              <circle cx="50" cy="50" r="8" fill="#000" opacity="0.8" />
              
              {/* Reflection Highlight (parallax shifts this!) */}
              <ellipse 
                className="lens-highlight"
                cx="45" cy="45" rx="12" ry="6" 
                fill="#ffffff" opacity="0.15" 
                filter="blur(2px)" 
                transform="rotate(-45 50 50)" 
                style={{ transition: 'cx 0.1s, cy 0.1s' }}
              />
              
              {/* Secondary faint reflection */}
              <circle cx="60" cy="60" r="3" fill="#ffffff" opacity="0.1" filter="blur(1px)" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
