"use client";

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps, useReducedMotion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { clsx } from '@/lib/clsx';

export interface CardProps extends HTMLMotionProps<"div"> {
  pill?: boolean;
  delay?: number;
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, pill = false, delay = 0, interactive = false, ...props }, 
  ref
) {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  // If the user specifies any Framer Motion props, let them override ours
  // For safety, we keep the default idle animation unless overridden
  
  const defaultInitial = { opacity: 0, y: 30 };
  const defaultAnimate = prefersReducedMotion ? { opacity: 1, y: 0 } : {
    opacity: 1,
    y: [0, -4, 0],
  };
  const defaultTransition = prefersReducedMotion ? { duration: 0.5, delay: delay * 0.1 } : {
    opacity: { duration: 0.8, ease: "easeOut", delay: delay * 0.1 },
    y: {
      duration: 5 + ((delay % 3) * 0.5),
      ease: "easeInOut",
      repeat: Infinity,
      delay: delay * 0.2,
    }
  };

  const defaultWhileHover = interactive && !prefersReducedMotion ? {
    y: -8,
    boxShadow: "0 20px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.12)",
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  } : {};
  
  const defaultWhileTap = interactive && !prefersReducedMotion ? { scale: 0.97 } : {};

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={clsx(
        "relative overflow-hidden border border-white/12 group p-6",
        "bg-black/60 [24px] backdrop-saturate-[1.5]",
        pill ? "rounded-full" : "rounded-[24px]",
        className
      )}
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)"
      }}
      initial={props.initial !== undefined ? props.initial : defaultInitial}
      animate={props.animate !== undefined ? props.animate : defaultAnimate}
      transition={props.transition !== undefined ? props.transition : defaultTransition}
      whileHover={props.whileHover !== undefined ? props.whileHover : defaultWhileHover}
      whileTap={props.whileTap !== undefined ? props.whileTap : defaultWhileTap}
      {...props}
    >
      {/* Dynamic Cursor-Tracking Spotlight Gradient */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-screen"
        style={{
          background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(0, 212, 255, 0.15), transparent 80%)`,
        }}
      />
      
      {/* Faint top-edge highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none transition-opacity group-hover:opacity-100 opacity-50 z-10" />
      
      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">
        {children as React.ReactNode}
      </div>
    </motion.div>
  );
});
