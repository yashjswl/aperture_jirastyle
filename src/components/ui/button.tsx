"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx } from "@/lib/clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-[#00D4FF] text-black shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3),_inset_-1px_-1px_2px_rgba(0,0,0,0.2),_0_4px_12px_rgba(0,212,255,0.3)] hover:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),_inset_-1px_-1px_2px_rgba(0,0,0,0.2),_0_6px_20px_rgba(0,212,255,0.5)] hover:bg-[#00D4FF]/90",
  secondary: "bg-[rgba(255,255,255,0.06)] text-white border border-white/10 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1),_inset_-1px_-1px_2px_rgba(0,0,0,0.4),_0_4px_12px_rgba(0,0,0,0.5)] hover:bg-[rgba(255,255,255,0.1)] hover:border-white/20",
  ghost: "bg-transparent text-white/70 hover:bg-white/5 hover:text-white",
  danger: "bg-[#ef4444] text-white shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3),_inset_-1px_-1px_2px_rgba(0,0,0,0.2),_0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),_inset_-1px_-1px_2px_rgba(0,0,0,0.2),_0_6px_20px_rgba(239,68,68,0.5)] hover:bg-[#ef4444]/90",
};

const sizes: Record<Size, string> = {
  sm: "text-[13px] px-5 py-2",
  md: "text-[15px] px-6 py-2.5",
  lg: "text-[16px] px-8 py-3",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & 
  HTMLMotionProps<"button"> & { 
    variant?: Variant; 
    size?: Size;
    interactive?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", interactive = true, ...props }, 
  ref
) {
  return (
    <motion.button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none tracking-wide",
        variants[variant],
        sizes[size],
        className
      )}
      whileTap={interactive ? { scale: 0.97 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    />
  );
});
