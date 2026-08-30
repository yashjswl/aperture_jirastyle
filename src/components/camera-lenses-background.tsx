"use client";

import React, { useEffect, useRef, useState } from "react";

type LensData = {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  secondaryColor: string;
  ringColor: string;
  rotation: number;
  text: string;
};

const LENS_COLORS = [
  { primary: "rgba(59, 130, 246, 0.7)", secondary: "rgba(168, 85, 247, 0.5)" }, // Blue/Purple
  { primary: "rgba(168, 85, 247, 0.7)", secondary: "rgba(234, 179, 8, 0.5)" },  // Purple/Gold
  { primary: "rgba(234, 179, 8, 0.7)", secondary: "rgba(34, 197, 94, 0.5)" },   // Gold/Green
  { primary: "rgba(34, 197, 94, 0.7)", secondary: "rgba(20, 184, 166, 0.5)" },  // Green/Teal
];

const RING_COLORS = ["#ef4444", "#e5e7eb", "transparent", "transparent"];
const TEXTS = [
  "OPTICAL LENS  50mm 1:1.4  Ø 58mm",
  "PRO SERIES  85mm 1:1.2  USM  Ø 72mm",
  "WIDE ANGLE  24mm 1:1.4  Ø 77mm",
  "MACRO LENS  100mm 1:2.8  IS  Ø 67mm"
];

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
    const generateLenses = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const rand = createRandom(seed);
      
      const newLenses: LensData[] = [];
      const padding = 2; // tighter packing
      
      const radii = [];
      for (let i = 0; i < 4; i++) radii.push(140 + rand() * 40); // Huge
      for (let i = 0; i < 12; i++) radii.push(90 + rand() * 30); // Medium
      for (let i = 0; i < 35; i++) radii.push(45 + rand() * 30); // Small
      
      radii.sort((a, b) => b - a);

      for (const r of radii) {
        let placed = false;
        for (let attempts = 0; attempts < 2500; attempts++) {
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
            const colorCombo = LENS_COLORS[Math.floor(rand() * LENS_COLORS.length)];
            newLenses.push({
              id: newLenses.length,
              x,
              y,
              r,
              color: colorCombo.primary,
              secondaryColor: colorCombo.secondary,
              ringColor: RING_COLORS[Math.floor(rand() * RING_COLORS.length)],
              rotation: rand() * 360,
              text: TEXTS[Math.floor(rand() * TEXTS.length)]
            });
            placed = true;
            break;
          }
        }
      }
      setLenses(newLenses);
      
      mouseRef.current.targetX = width / 2;
      mouseRef.current.targetY = height / 2;
      mouseRef.current.x = width / 2;
      mouseRef.current.y = height / 2;
    };

    generateLenses();

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
    
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    const tick = () => {
      // Faster lerp for more responsiveness
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;
      
      const { x: mx, y: my } = mouseRef.current;

      lensesRefs.current.forEach((el, i) => {
        if (!el || !lenses[i]) return;
        const data = lenses[i];
        
        const dx = mx - data.x;
        const dy = my - data.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 600;
        
        const influence = Math.max(0, 1 - dist / maxDist);
        // Using transform3d for hardware acceleration to guarantee 120fps
        const tx = dx * influence * -0.05;
        const ty = dy * influence * -0.05;
        
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        
        // Transform the highlight purely using translate3d to avoid SVG reflows
        const hl = el.querySelector(".lens-highlight") as SVGElement;
        if (hl) {
          const hx = dx * 0.03;
          const hy = dy * 0.03;
          hl.style.transform = `translate3d(${hx}px, ${hy}px, 0)`;
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
    const target = e.currentTarget;
    const currentRot = parseFloat(target.style.getPropertyValue("--rot") || "0");
    target.style.setProperty("--rot", `${currentRot + 90}deg`);
  };

  // Generate aperture blades polygon
  const renderApertureBlades = () => {
    const points = [];
    const numBlades = 7;
    for (let i = 0; i < numBlades; i++) {
      const angle = (i * Math.PI * 2) / numBlades;
      const x = 50 + 10 * Math.cos(angle);
      const y = 50 + 10 * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return <polygon points={points.join(" ")} fill="#000" stroke="#111" strokeWidth="0.5" />;
  };

  return (
    <div 
      className="fixed inset-0 overflow-hidden pointer-events-none bg-[#050505]"
      style={{ zIndex: -10 }}
    >
      <div 
        className="absolute inset-0 mix-blend-screen opacity-30"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(30, 40, 50, 0.4) 0%, transparent 80%)"
        }}
      />
      
      {lenses.map((lens, i) => (
        <div
          key={lens.id}
          ref={(el) => { lensesRefs.current[i] = el; }}
          className="absolute"
          style={{
            left: lens.x - lens.r,
            top: lens.y - lens.r,
            width: lens.r * 2,
            height: lens.r * 2,
            willChange: "transform",
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-auto rounded-full cursor-pointer"
            style={{ 
              "--rot": `${lens.rotation}deg`,
              transform: "rotate(var(--rot)) scale(1)",
              transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.3s ease",
              willChange: "transform, filter",
            } as React.CSSProperties}
            onClick={handleLensClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "rotate(var(--rot)) scale(1.05)";
              e.currentTarget.style.filter = "brightness(1.3) drop-shadow(0 20px 30px rgba(0,0,0,0.8))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "rotate(var(--rot)) scale(1)";
              e.currentTarget.style.filter = "brightness(1) drop-shadow(0 0 0 rgba(0,0,0,0))";
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
              <defs>
                <radialGradient id={`glass-1-${lens.id}`} cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor={lens.color} stopOpacity="0.8" />
                  <stop offset="40%" stopColor={lens.color} stopOpacity="0.3" />
                  <stop offset="80%" stopColor="#050505" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#000" stopOpacity="1" />
                </radialGradient>
                
                <radialGradient id={`glass-2-${lens.id}`} cx="60%" cy="60%" r="50%">
                  <stop offset="0%" stopColor={lens.secondaryColor} stopOpacity="0.7" />
                  <stop offset="60%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                
                <linearGradient id={`barrel-${lens.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#222" />
                  <stop offset="20%" stopColor="#0f0f0f" />
                  <stop offset="80%" stopColor="#050505" />
                  <stop offset="100%" stopColor="#111" />
                </linearGradient>

                <linearGradient id={`inner-threads-${lens.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#050505" />
                  <stop offset="50%" stopColor="#151515" />
                  <stop offset="100%" stopColor="#050505" />
                </linearGradient>
                
                {/* Path for text to curve around the lens */}
                <path id={`text-path-${lens.id}`} d="M 18,50 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" />
              </defs>

              {/* Main Outer Barrel */}
              <circle cx="50" cy="50" r="49" fill={`url(#barrel-${lens.id})`} stroke="#111" strokeWidth="0.5" />
              
              {/* Fine Knurled Focus Grip */}
              <circle cx="50" cy="50" r="46.5" fill="none" stroke="#181818" strokeWidth="5" strokeDasharray="0.8 1" />
              
              {/* Secondary Grip */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="#151515" strokeWidth="2.5" strokeDasharray="1 1.5" />
              
              {/* Red/Silver ID Ring */}
              <circle cx="50" cy="50" r="39" fill="none" stroke={lens.ringColor} strokeWidth="1" />
              
              {/* Text Plate / Ring */}
              <circle cx="50" cy="50" r="36" fill="#0d0d0d" stroke="#222" strokeWidth="0.5" />
              <text fontSize="3.5" fill="#555" fontWeight="bold" letterSpacing="0.1em">
                <textPath href={`#text-path-${lens.id}`} startOffset="10%">
                  {lens.text}
                </textPath>
              </text>
              
              {/* Deep Inner Barrel / Filter Threads */}
              <circle cx="50" cy="50" r="29" fill="none" stroke={`url(#inner-threads-${lens.id})`} strokeWidth="4" strokeDasharray="0.2 0.5" />
              <circle cx="50" cy="50" r="26" fill="#050505" stroke="#1a1a1a" strokeWidth="0.5" />
              
              {/* Underlying Aperture Blades */}
              <g transform="translate(0, 0)">
                {renderApertureBlades()}
              </g>
              
              {/* Glass Element Base */}
              <circle cx="50" cy="50" r="25" fill={`url(#glass-1-${lens.id})`} />
              <circle cx="50" cy="50" r="25" fill={`url(#glass-2-${lens.id})`} />
              
              {/* High-Contrast Reflection Highlights (Hardware Accelerated via translate3d) */}
              <g className="lens-highlight" style={{ willChange: "transform" }}>
                <ellipse cx="38" cy="38" rx="10" ry="4" fill="#ffffff" opacity="0.6" filter="blur(1px)" transform="rotate(-45 38 38)" />
                <circle cx="65" cy="65" r="2.5" fill="#ffffff" opacity="0.4" filter="blur(0.5px)" />
              </g>
              
              {/* Final Glare Curve */}
              <path d="M 30,50 A 20 20 0 0 1 50,30" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.2" filter="blur(1px)" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
