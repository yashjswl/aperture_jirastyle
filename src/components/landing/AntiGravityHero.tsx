import React from 'react';
import { GlassCard } from './GlassCard';

export function AntiGravityHero() {
  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center">
      {/* Background Particles drifting up */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/20 rounded-full animate-drift motion-reduce:animate-none"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 4 + 8}s`,
            }}
          />
        ))}
      </div>

      {/* Central Floating Object Container */}
      <div className="relative motion-safe:animate-drift">
        {/* Soft Glow beneath (stands in for a shadow) */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-4 bg-white/10 blur-[12px] rounded-[50%]" />
        
        {/* The Object itself */}
        <GlassCard className="w-48 h-64 flex flex-col items-center justify-center p-6 border-white/20">
          <div className="w-16 h-16 rounded-full border border-white/10 bg-gradient-to-tr from-white/5 to-white/10 flex items-center justify-center mb-6">
            {/* Inner accent dot - rich black per user specs */}
            <div className="w-3 h-3 rounded-full bg-[#0a0a0a] border border-white/20" />
          </div>
          <div className="w-full space-y-3">
            <div className="h-2 w-full rounded-full bg-white/10" />
            <div className="h-2 w-2/3 rounded-full bg-white/10" />
            <div className="h-2 w-4/5 rounded-full bg-white/10" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
