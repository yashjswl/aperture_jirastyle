"use client";

import React, { useEffect, useState } from 'react';

export function ZeroGravityBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] bg-[#000000] overflow-hidden pointer-events-none">
      {/* Ambient Depth Orbs */}
      {/* Violet Orb */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, #7C3AED 0%, rgba(124, 58, 237, 0) 70%)',
          filter: 'blur(120px)'
        }}
      />
      {/* Electric Blue Orb */}
      <div 
        className="absolute top-[20%] -right-[15%] w-[60%] h-[60%] rounded-full opacity-[0.1]"
        style={{
          background: 'radial-gradient(circle, #00D4FF 0%, rgba(0, 212, 255, 0) 70%)',
          filter: 'blur(150px)'
        }}
      />
      {/* Neon Teal Orb */}
      <div 
        className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full opacity-[0.08]"
        style={{
          background: 'radial-gradient(circle, #00FFC2 0%, rgba(0, 255, 194, 0) 70%)',
          filter: 'blur(130px)'
        }}
      />

      {/* Subtle Star Field (Only render on client to avoid hydration mismatch with Math.random) */}
      {mounted && (
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-drift motion-reduce:animate-none opacity-10"
              style={{
                width: '1px',
                height: '1px',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${Math.random() * 20 + 20}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
