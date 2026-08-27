"use client";

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function ZeroGravityBackground() {
  const [mounted, setMounted] = useState(false);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid, drifting movement
  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 30, mass: 2 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 30, mass: 2 });

  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalize to -1 to 1 range
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Orb parallax mappings (different directions and depths for 3D feel)
  const orb1X = useTransform(smoothX, [-1, 1], [-40, 40]);
  const orb1Y = useTransform(smoothY, [-1, 1], [-40, 40]);

  const orb2X = useTransform(smoothX, [-1, 1], [60, -60]);
  const orb2Y = useTransform(smoothY, [-1, 1], [60, -60]);

  const orb3X = useTransform(smoothX, [-1, 1], [-30, 30]);
  const orb3Y = useTransform(smoothY, [-1, 1], [30, -30]);

  return (
    <div className="fixed inset-0 z-[-1] bg-[#000000] overflow-hidden pointer-events-none">
      {/* Ambient Depth Orbs */}
      {/* Violet Orb (Top Left) */}
      <motion.div 
        className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-[0.15]"
        style={{
          background: 'radial-gradient(circle, #7C3AED 0%, rgba(124, 58, 237, 0) 100%)',
          filter: 'blur(140px)',
          x: orb1X,
          y: orb1Y
        }}
      />
      {/* Electric Blue Orb (Top Right) */}
      <motion.div 
        className="absolute top-[20%] -right-[15%] w-[70%] h-[70%] rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, #00D4FF 0%, rgba(0, 212, 255, 0) 100%)',
          filter: 'blur(160px)',
          x: orb2X,
          y: orb2Y
        }}
      />
      {/* Neon Teal Orb (Bottom Left) */}
      <motion.div 
        className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full opacity-[0.1]"
        style={{
          background: 'radial-gradient(circle, #00FFC2 0%, rgba(0, 255, 194, 0) 100%)',
          filter: 'blur(150px)',
          x: orb3X,
          y: orb3Y
        }}
      />

      {/* Subtle Star Field (Only render on client to avoid hydration mismatch with Math.random) */}
      {mounted && (
        <motion.div 
          className="absolute inset-0"
          style={{
            // Star field moves slightly in the opposite direction for maximum depth
            x: useTransform(smoothX, [-1, 1], [15, -15]),
            y: useTransform(smoothY, [-1, 1], [15, -15])
          }}
        >
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
        </motion.div>
      )}
    </div>
  );
}
