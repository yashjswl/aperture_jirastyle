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
      const overlap = 0.88; // 12% overlap allowed for a dense, packed look
      
      // Generate a pool of target radii and depth layers
      const pool = [];
      // 5 Huge foreground lenses
      for (let i = 0; i < 5; i++) pool.push({ r: 160 + rand() * 60, zIndex: 10 }); 
      // 15 Medium middle lenses
      for (let i = 0; i < 15; i++) pool.push({ r: 90 + rand() * 40, zIndex: 5 }); 
      // 30 Small background lenses
      for (let i = 0; i < 30; i++) pool.push({ r: 50 + rand() * 30, zIndex: 1 });  
      
      // Sort largest first for better circle packing
      pool.sort((a, b) => b.r - a.r);

      for (const item of pool) {
        for (let attempts = 0; attempts < 2000; attempts++) {
          const x = item.r + rand() * (width - item.r * 2);
          const y = item.r + rand() * (height - item.r * 2);
          
          let collision = false;
          for (const existing of newLenses) {
            const dx = existing.x - x;
            const dy = existing.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
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
              // Calculate depth factor based on size/zIndex for parallax scaling
              depth: 0.2 + (item.zIndex / 10) * 0.8, 
              zIndex: item.zIndex + Math.floor(rand() * 10),
            });
            break;
          }
        }
      }
      
      currentLenses = newLenses;
      setLenses(newLenses);
      
      // Center the mouse target initially
      mouseRef.current.targetX = width / 2;
      mouseRef.current.targetY = height / 2;
      mouseRef.current.x = width / 2;
      mouseRef.current.y = height / 2;
      
      // Handle Image Preloading gracefully
      let loadedCount = 0;
      const totalToLoad = newLenses.length;
      
      if (totalToLoad === 0) setIsLoaded(true);

      newLenses.forEach(lens => {
        const img = new Image();
        img.onload = () => {
          if (isCancelled) return;
          loadedCount++;
          if (loadedCount >= totalToLoad * 0.4) setIsLoaded(true); // Fade in once 40% are ready
        };
        img.onerror = () => {
          if (isCancelled) return;
          loadedCount++; // Count as loaded even if it fails so we don't hang
          if (loadedCount >= totalToLoad * 0.4) setIsLoaded(true);
        };
        img.src = lens.src;
      });

      // Fallback timer if network is very slow
      setTimeout(() => { if (!isCancelled) setIsLoaded(true); }, 1500);
    };

    generateLayout();

    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsLoaded(false); // Fade out briefly
        setTimeout(generateLayout, 300);
      }, 300);
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      isCancelled = true;
      window.removeEventListener("resize", handleResize);
    };
  }, [seed]);

  // Handle Parallax & Animations
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    const tick = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;
      
      const { x: mx, y: my } = mouseRef.current;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      lensesRefs.current.forEach((el, i) => {
        if (!el || !lenses[i]) return;
        const data = lenses[i];
        
        // Distance from center determines shift amount
        const dx = mx - cx;
        const dy = my - cy;
        
        // Multiply by depth factor so foreground lenses move MORE than background lenses
        const tx = dx * -0.06 * data.depth;
        const ty = dy * -0.06 * data.depth;
        
        // Hardware accelerated translation
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
      {/* Background Vignette / Dimmer to keep foreground UI readable */}
      <div className="absolute inset-0 z-50 bg-black/40 mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 z-50 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />

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
          {/* Inner Interactive Wrapper */}
          <div 
            className="absolute inset-0 pointer-events-auto cursor-pointer rounded-full"
            style={{ 
              "--rot": `${lens.rotation}deg`,
              transform: "rotate(var(--rot)) scale(1)",
              transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.4s ease",
              filter: `brightness(1) drop-shadow(0 ${10 + 15 * lens.depth}px ${15 + 10 * lens.depth}px rgba(0,0,0,0.7))`,
              willChange: "transform, filter",
            } as React.CSSProperties}
            onClick={(e) => {
              // Click to rotate (simulate twisting the zoom ring)
              const target = e.currentTarget;
              const currentRot = parseFloat(target.style.getPropertyValue("--rot") || "0");
              target.style.setProperty("--rot", `${currentRot + 90}deg`);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "rotate(var(--rot)) scale(1.06)";
              e.currentTarget.style.filter = `brightness(1.15) drop-shadow(0 ${20 + 20 * lens.depth}px ${25 + 20 * lens.depth}px rgba(0,0,0,0.9))`;
              e.currentTarget.style.zIndex = "100"; // Bring to top on hover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "rotate(var(--rot)) scale(1)";
              e.currentTarget.style.filter = `brightness(1) drop-shadow(0 ${10 + 15 * lens.depth}px ${15 + 10 * lens.depth}px rgba(0,0,0,0.7))`;
              setTimeout(() => { e.currentTarget.style.zIndex = ""; }, 400); // Restore z-index after transition
            }}
          >
            {/* Fallback Shape (Dark Circle with Ring) in case image fails or takes time */}
            <div className="w-full h-full bg-[#111] rounded-full absolute inset-0 -z-10 shadow-inner border-[3px] border-[#222]" />
            
            {/* Real Image */}
            <img 
              src={lens.src} 
              alt="Camera Lens"
              className="w-full h-full object-contain rounded-full relative z-10 transition-opacity duration-300"
              onError={(e) => {
                // If the user hasn't added the image yet, hide the broken img icon 
                // so the fallback CSS circle shows instead
                e.currentTarget.style.opacity = "0";
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
