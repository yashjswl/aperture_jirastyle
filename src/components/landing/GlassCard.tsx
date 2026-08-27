"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import { clsx } from '@/lib/clsx';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  pill?: boolean;
  delay?: number;
  interactive?: boolean;
}

export function GlassCard({ children, className, pill = false, delay = 0, interactive = false, ...props }: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Parallax effect (only if interactive and motion allowed)
  // We'll implement a simple parallax using global mouse position later, or we can just use Framer Motion's whileHover for now.
  // Actually, the user asked for cursor parallax relative to viewport center.
  // To keep it clean and robust, we'll apply parallax at a higher level (like in LandingPage), or we can do a simplified version here.
  // Let's focus on the hover and idle float first.

  return (
    <motion.div
      ref={cardRef}
      className={clsx(
        "relative overflow-hidden border border-white/12 group",
        "bg-[rgba(255,255,255,0.05)] backdrop-blur-[24px] backdrop-saturate-[1.5]",
        pill ? "rounded-full" : "rounded-[24px]",
        className
      )}
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)"
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={prefersReducedMotion ? { opacity: 1, y: 0 } : {
        opacity: 1,
        y: [0, -6, 0],
      }}
      transition={
        prefersReducedMotion ? { duration: 0.5, delay: delay * 0.1 } : {
          opacity: { duration: 0.8, ease: "easeOut", delay: delay * 0.1 },
          y: {
            duration: 5 + Math.random() * 2, // 5-7s bob
            ease: "easeInOut",
            repeat: Infinity,
            delay: delay * 0.2 + Math.random(), // Staggered idle bob
          }
        }
      }
      whileHover={interactive && !prefersReducedMotion ? {
        y: -8,
        boxShadow: "0 20px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.12)",
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      } : {}}
      whileTap={interactive && !prefersReducedMotion ? { scale: 0.97 } : {}}
      {...props as any}
    >
      {/* Faint top-edge highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
      {/* Faint gradient border glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-[#00D4FF] to-transparent mix-blend-screen" />
      
      {children}
    </motion.div>
  );
}
