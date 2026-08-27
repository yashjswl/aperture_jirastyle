import React from 'react';
import Link from 'next/link';
import { LandingBackground } from './LandingBackground';
import { AntiGravityHero } from './AntiGravityHero';
import { GlassCard } from './GlassCard';
import { Logo } from '../logo';

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-transparent flex flex-col font-sans text-[#f2f3f5] selection:bg-white/20">
      <LandingBackground />

      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 p-6 z-50 flex justify-center pointer-events-none">
        <GlassCard pill className="pointer-events-auto flex items-center justify-between px-6 py-3 w-full max-w-5xl">
          <Link 
            href="/" 
            className="flex items-center gap-3 text-lg font-light tracking-[0.15em] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full transition-opacity hover:opacity-80"
          >
            <Logo className="w-8 h-8" />
            <span className="uppercase mt-0.5">Aperture</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className="text-sm font-light tracking-widest text-[#f2f3f5]/60 hover:text-[#f2f3f5] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md px-2 py-1"
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard"
              className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-sm font-light tracking-widest transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Portal
            </Link>
          </div>
        </GlassCard>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-6xl mx-auto px-6 pt-32 pb-20 gap-16 lg:gap-24 w-full">
        
        {/* Typography / Copy */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 z-10">
          <h1 className="text-5xl md:text-7xl font-extralight tracking-[0.05em] leading-[1.1]">
            Create with<br />
            <span className="font-light">clarity.</span>
          </h1>
          
          <p className="text-lg md:text-xl font-light text-[#f2f3f5]/60 max-w-lg leading-relaxed tracking-wide">
            The internal platform for Aperture’s digital arts society. 
            Streamline your workflow in an environment designed to get out of your way.
          </p>
          
          <div className="pt-4">
            <GlassCard pill className="inline-flex items-center p-1.5 pl-6 pr-2 gap-6">
              <span className="text-sm font-light tracking-widest text-[#f2f3f5]/80">Join the workspace</span>
              <Link 
                href="/dashboard"
                className="w-10 h-10 rounded-full bg-white text-[#0a0a0a] flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </GlassCard>
          </div>
        </div>

        {/* Motif */}
        <div className="flex-1 w-full flex justify-center z-10">
          <AntiGravityHero />
        </div>
      </main>
    </div>
  );
}
