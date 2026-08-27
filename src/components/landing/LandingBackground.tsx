import React from 'react';

export function LandingBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#0a0a0a] overflow-hidden pointer-events-none">
      {/* Bloom 1: Top Left (Blue-White) */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(200, 220, 255, 0.8) 0%, rgba(200, 220, 255, 0) 70%)',
          filter: 'blur(100px)'
        }}
      />

      {/* Bloom 2: Bottom Right (Faint Magenta) */}
      <div 
        className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(255, 150, 200, 0.6) 0%, rgba(255, 150, 200, 0) 70%)',
          filter: 'blur(120px)'
        }}
      />
      
      {/* Bloom 3: Center Bottom (Subtle Blue) */}
      <div 
        className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(150, 200, 255, 0.5) 0%, rgba(150, 200, 255, 0) 70%)',
          filter: 'blur(90px)'
        }}
      />
    </div>
  );
}
