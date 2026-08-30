"use client";

import React, { useEffect, useRef } from "react";

export function PhotoLensesBackground() {
  const bgRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Start with mouse in the center
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouseRef.current.targetX = cx;
    mouseRef.current.targetY = cy;
    mouseRef.current.x = cx;
    mouseRef.current.y = cy;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    const tick = () => {
      // Extremely fast lerp (0.15) for high responsiveness, easily handles 120-240fps
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.15;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.15;
      
      const { x, y } = mouseRef.current;

      // Parallax shift the background (max +/- 2.5% movement to stay within 105% bounds)
      if (bgRef.current) {
        const panX = ((x / window.innerWidth) - 0.5) * -4; 
        const panY = ((y / window.innerHeight) - 0.5) * -4;
        bgRef.current.style.transform = `translate3d(${panX}%, ${panY}%, 0)`;
      }

      // Move the interactive lighting glare over the image
      if (glareRef.current) {
        glareRef.current.style.background = `radial-gradient(circle 800px at ${x}px ${y}px, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)`;
      }
      
      rafRef.current = requestAnimationFrame(tick);
    };
    
    rafRef.current = requestAnimationFrame(tick);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-black" style={{ zIndex: -10 }}>
      {/* 
        The background image wrapper is oversized (108%) so we can pan it around 
        without revealing the edges of the screen.
      */}
      <div 
        ref={bgRef}
        className="absolute w-[108vw] h-[108vh] left-[-4vw] top-[-4vh]"
        style={{ willChange: "transform" }}
      >
        <img 
          src="/lenses-bg.jpg" 
          alt="Lenses Background" 
          className="w-full h-full object-cover"
          /* Removed opacity reduction so it's fully bright and realistic */
        />
      </div>
      
      {/* 
        Dynamic flashlight / glare that tracks the mouse.
        mix-blend-screen acts as a physical spotlight adding light to the photo.
      */}
      <div 
        ref={glareRef}
        className="absolute inset-0 mix-blend-screen"
        style={{ willChange: "background" }}
      />
    </div>
  );
}
