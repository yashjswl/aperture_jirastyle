import React from 'react';
import { clsx } from '@/lib/clsx';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  pill?: boolean;
}

export function GlassCard({ children, className, pill = false, ...props }: GlassCardProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden border border-white/12",
        "bg-[rgba(255,255,255,0.06)] backdrop-blur-[24px] backdrop-saturate-[1.4]",
        "shadow-none", // Explicitly no drop shadows
        pill ? "rounded-full" : "rounded-[20px]",
        className
      )}
      {...props}
    >
      {/* Faint top-edge highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
