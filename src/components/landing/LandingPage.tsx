"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { ArrowRight, Layers, Fingerprint, Zap, Shield } from 'lucide-react';
import { LandingBackground } from './LandingBackground';
import { GlassCard } from './GlassCard';
import { Logo } from '../logo';

export function LandingPage() {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for cursor position (normalized -1 to 1)
  const smoothX = useSpring(mouseX, { stiffness: 100, damping: 30, mass: 1 });
  const smoothY = useSpring(mouseY, { stiffness: 100, damping: 30, mass: 1 });

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalize to -1 to 1
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, prefersReducedMotion]);

  const features = [
    { title: "Neo-Glass Morphism", desc: "Experience the next evolution of depth, blur, and light.", icon: <Layers strokeWidth={1.5} className="w-6 h-6 text-white" /> },
    { title: "Zero Gravity", desc: "Elements float, drift, and react to your presence naturally.", icon: <Zap strokeWidth={1.5} className="w-6 h-6 text-white" /> },
    { title: "Identity Driven", desc: "A sleek, minimal portal tailored perfectly to your workflow.", icon: <Fingerprint strokeWidth={1.5} className="w-6 h-6 text-white" /> },
    { title: "Secure by Default", desc: "Enterprise-grade protection encased in a beautiful shell.", icon: <Shield strokeWidth={1.5} className="w-6 h-6 text-white" /> }
  ];

  return (
    <div className="relative min-h-screen bg-transparent flex flex-col font-sans text-[rgba(255,255,255,0.95)] selection:bg-[#00D4FF]/30">
      <LandingBackground />

      {/* Navigation (Floating Pill) */}
      <header className="fixed top-0 inset-x-0 p-6 z-50 flex justify-center pointer-events-none">
        <GlassCard 
          pill 
          interactive
          className="pointer-events-auto flex items-center justify-between px-6 py-4 w-full max-w-[1200px]"
        >
          <Link 
            href="/" 
            className="flex items-center gap-3 text-lg font-light tracking-[0.15em] hover:opacity-80 transition-opacity"
          >
            <Logo className="w-7 h-7" />
            <span className="uppercase tracking-widest mt-0.5">Aperture</span>
          </Link>
          
          <div className="flex items-center gap-8">
            <Link 
              href="/dashboard" 
              className="text-[15px] font-medium tracking-wide text-white/70 hover:text-[#00D4FF] transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard"
              className="px-6 py-2 rounded-full bg-[#00D4FF] text-black font-semibold text-[15px] tracking-wide hover:bg-[#00D4FF]/90 transition-colors shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:shadow-[0_0_30px_rgba(0,212,255,0.6)]"
            >
              Portal
            </Link>
          </div>
        </GlassCard>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center w-full max-w-[1400px] mx-auto">
        
        {/* Hero Section */}
        <section className="relative w-full px-6 pt-[200px] pb-[140px] flex flex-col items-center text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-light tracking-tight leading-[1.05] max-w-4xl"
          >
            Create with <span className="font-medium bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">Zero Gravity.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="mt-8 text-xl font-light text-white/60 max-w-2xl leading-relaxed"
          >
            A minimal, frictionless digital workspace. Streamline your workflow in an environment designed to drift gracefully out of your way.
          </motion.p>
          
          {/* Hero Floating CTA Card */}
          <motion.div 
            style={{ 
              x: prefersReducedMotion ? 0 : smoothX.get() * -15, 
              y: prefersReducedMotion ? 0 : smoothY.get() * -15 
            }}
            className="mt-20 w-full max-w-md z-10"
          >
            <GlassCard delay={2} interactive className="p-8 flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Logo className="w-8 h-8 text-[#00D4FF]" />
              </div>
              <div className="space-y-3 w-full text-center">
                <h3 className="text-xl font-medium tracking-wide">Enter the Portal</h3>
                <p className="text-sm text-white/50 leading-relaxed">Secure authentication required. Access your team's exclusive tools and coverage schedules.</p>
              </div>
              <Link 
                href="/dashboard"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-white/10 hover:bg-[#00D4FF]/20 text-white hover:text-[#00D4FF] border border-white/10 hover:border-[#00D4FF]/50 transition-all duration-300 font-medium"
              >
                Authenticate <ArrowRight className="w-4 h-4" />
              </Link>
            </GlassCard>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="w-full px-6 py-[140px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                style={{ 
                  x: prefersReducedMotion ? 0 : smoothX.get() * (Math.random() * -10 - 5), 
                  y: prefersReducedMotion ? 0 : smoothY.get() * (Math.random() * -10 - 5) 
                }}
              >
                <GlassCard delay={idx + 3} interactive className="p-10 h-full flex flex-col gap-6">
                  <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center border border-[#00D4FF]/20">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-2xl font-medium tracking-tight mb-3">{feature.title}</h4>
                    <p className="text-white/60 leading-relaxed text-lg font-light">{feature.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1400px] mx-auto px-6 pb-12 pt-24 flex flex-col items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6 text-sm text-white/40 font-light">
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5 opacity-50" />
            <span>© {new Date().getFullYear()} Aperture Platform. All rights reserved.</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/dashboard" className="hover:text-[#00D4FF] transition-colors">Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
