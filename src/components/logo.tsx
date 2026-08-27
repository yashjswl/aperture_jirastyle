import React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="currentColor"
    >
      <defs>
        <path id="fin" d="M 50,2 A 48,48 0 0,1 96,36 L 70,51 L 50,16 Z" />
      </defs>

      {/* Central Pivot Triangle (Static) */}
      <polygon points="50,24 73,63 27,63" />
      
      {/* Rotating Outer Fins */}
      <g className="origin-center animate-[spin_10s_linear_infinite]">
        <use href="#fin" />
        <use href="#fin" transform="rotate(120 50 50)" />
        <use href="#fin" transform="rotate(240 50 50)" />
      </g>
    </svg>
  );
}
