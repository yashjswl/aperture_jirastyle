"use client";

import React, { useEffect, useRef, useState } from "react";

type LensData = {
  id: string;
  x: number;
  y: number;
  r: number;
  src: string;
  rotation: number;
  depth: number;
  zIndex: number;
};

// We assume there are 20 images in the public/assets/lenses folder
// named lens1.png through lens20.png
const LENS_COUNT = 20;
const LENS_IMAGES = Array.from({ length: LENS_COUNT }, (_, i) => `/assets/lenses/lens${i + 1}.png`);

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

export function ImageLensesBackground({ seed }: { seed?: number }) {
  const [lenses, setLenses] = useState<LensData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lensesRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let currentLenses: LensData[] = [];
    let isCancelled = false;

    const generateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const rand = createRandom(seed);
      
      const newLenses: LensData[] = [];
      const overlap = 0.82; // 18% overlap allowed for a tightly packed, dense mosaic
      
      const pool = [];
      // Huge boost in quantities, scaled down radii
      for (let i = 0; i < 20; i++) pool.push({ r: 90 + rand() * 25, zIndex: 10 }); 
      for (let i = 0; i < 60; i++) pool.push({ r: 50 + rand() * 20, zIndex: 5 }); 
      for (let i = 0; i < 150; i++) pool.push({ r: 25 + rand() * 15, zIndex: 1 });  
      
      pool.sort((a, b) => b.r - a.r);

      for (const item of pool) {
        for (let attempts = 0; attempts < 4000; attempts++) {
          // Spawn well off-screen so the viewport is completely filled seamlessly
          const x = -150 + rand() * (width + 300);
          const y = -150 + rand() * (height + 300);
          
          let collision = false;
          for (const existing of newLenses) {
            const dx = existing.x - x;
            const dy = existing.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Tight collision packing
            if (dist < (existing.r + item.r) * overlap) {
              collision = true;
              break;
            }
          }
          
          if (!collision) {
            newLenses.push({
              id: `lens-${newLenses.length}`,
              x,
              y,
              r: item.r,
              src: LENS_IMAGES[Math.floor(rand() * LENS_IMAGES.length)],
              rotation: rand() * 360,
              depth: 0.3 + (item.zIndex / 10) * 0.7, 
              zIndex: item.zIndex + Math.floor(rand() * 10),
            });
            break;
          }
        }
      }
      
      currentLenses = newLenses;
      setLenses(newLenses);
      
      mouseRef.current.targetX = width / 2;
      mouseRef.current.targetY = height / 2;
      mouseRef.current.x = width / 2;
      mouseRef.current.y = height / 2;
      
      let loadedCount = 0;
      const totalToLoad = newLenses.length;
      
      if (totalToLoad === 0) setIsLoaded(true);

      newLenses.forEach(lens => {
        const img = new Image();
        img.onload = () => {
          if (isCancelled) return;
          loadedCount++;
          if (loadedCount >= totalToLoad * 0.3) setIsLoaded(true);
        };
        img.onerror = () => {
          if (isCancelled) return;
          loadedCount++; 
          if (loadedCount >= totalToLoad * 0.3) setIsLoaded(true);
        };
        img.src = lens.src;
      });

      setTimeout(() => { if (!isCancelled) setIsLoaded(true); }, 1000);
    };

    generateLayout();

    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsLoaded(false);
        setTimeout(generateLayout, 300);
      }, 300);
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      isCancelled = true;
      window.removeEventListener("resize", handleResize);
    };
  }, [seed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    const tick = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.15;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.15;
      
      const { x: mx, y: my } = mouseRef.current;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      lensesRefs.current.forEach((el, i) => {
        if (!el || !lenses[i]) return;
        const data = lenses[i];
        
        const dx = mx - cx;
        const dy = my - cy;
        
        const tx = dx * -0.08 * data.depth;
        const ty = dy * -0.08 * data.depth;
        
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
      
      rafRef.current = requestAnimationFrame(tick);
    };
    
    rafRef.current = requestAnimationFrame(tick);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [lenses]);

  return (
    <div 
      className={`fixed inset-0 overflow-hidden pointer-events-none bg-[#050508] transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      style={{ zIndex: -10 }}
    >
      {/* Removed the heavy black overlays so the lenses are bright and visible */}
      
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
            zIndex: lens.zIndex,
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-auto cursor-pointer rounded-full"
            style={{ 
              "--rot": `${lens.rotation}deg`,
              transform: "rotate(var(--rot)) scale(1)",
              transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.4s ease",
              filter: `brightness(1) drop-shadow(0 ${15 + 20 * lens.depth}px ${20 + 15 * lens.depth}px rgba(0,0,0,0.85))`,
              willChange: "transform, filter",
            } as React.CSSProperties}
            onClick={(e) => {
              const target = e.currentTarget;
              const currentRot = parseFloat(target.style.getPropertyValue("--rot") || "0");
              target.style.setProperty("--rot", `${currentRot + 90}deg`);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "rotate(var(--rot)) scale(1.06)";
              e.currentTarget.style.filter = `brightness(1.2) drop-shadow(0 ${25 + 25 * lens.depth}px ${30 + 20 * lens.depth}px rgba(0,0,0,0.95))`;
              e.currentTarget.style.zIndex = "100";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "rotate(var(--rot)) scale(1)";
              e.currentTarget.style.filter = `brightness(1) drop-shadow(0 ${15 + 20 * lens.depth}px ${20 + 15 * lens.depth}px rgba(0,0,0,0.85))`;
              setTimeout(() => { e.currentTarget.style.zIndex = ""; }, 400);
            }}
          >
            {/* Glossy specular reflection (glass highlight) overlaid on top of the image */}
            <div 
              className="absolute inset-0 z-20 rounded-full mix-blend-screen opacity-30 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 40% 40%, rgba(100,200,255,0.2) 0%, rgba(200,100,255,0.05) 40%, transparent 60%)`
              }}
            />
            <div 
              className="absolute inset-0 z-20 rounded-full mix-blend-screen opacity-20 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 65% 65%, rgba(255,255,255,0.1) 0%, transparent 30%)`
              }}
            />
            
            <img 
              src={lens.src} 
              alt="Camera Lens"
              className="w-full h-full object-contain rounded-full relative z-10"
              style={{ filter: "contrast(1.2) saturate(1.1)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
