"use client";

import Image from "next/image";
import { useRef, MouseEvent as ReactMouseEvent } from "react";

export function Logo({ className }: { className?: string }) {
  const logoRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalize from -1 to 1
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);

    if (logoRef.current) {
      logoRef.current.style.transform = `translate(${x * 4}px, ${y * 4}px) rotate(${x * 3}deg)`;
    }
    if (glowRef.current) {
      glowRef.current.style.transform = `translate(${x * 7}px, ${y * 7}px)`;
    }
  };

  const handleMouseLeave = () => {
    if (logoRef.current) {
      logoRef.current.style.transform = `translate(0px, 0px) rotate(0deg)`;
    }
    if (glowRef.current) {
      glowRef.current.style.transform = `translate(0px, 0px)`;
    }
  };

  return (
    <div 
      className="p-3.5 -m-3.5 flex items-center justify-center cursor-pointer rounded-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`relative ${className}`}>
        {/* Glow Element */}
        <div 
          ref={glowRef}
          className="absolute inset-[-2px] bg-white/10 rounded-full blur-[10px] opacity-100"
          style={{ transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)' }}
        />
        
        {/* Logo Element */}
        <div 
          ref={logoRef}
          className="relative w-full h-full z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
          style={{ transition: 'transform 0.4s ease-out' }}
        >
          <Image
            src="/logo.png"
            alt="Aperture Logo"
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain"
            priority
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
