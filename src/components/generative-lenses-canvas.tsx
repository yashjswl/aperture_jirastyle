"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { EffectComposer, DepthOfField, Bloom, Vignette, N8AO } from "@react-three/postprocessing";
import * as THREE from "three";

// --------------------------------------------------------
// Palette & Utilities
// --------------------------------------------------------
const PALETTES = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#06b6d4", // Teal
];

function createRandom(seed: number) {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type LensData = {
  id: string;
  x: number;
  y: number;
  r: number;
  color: string;
  hasChrome: boolean;
  rings: number;
  height: number;
};

// --------------------------------------------------------
// Procedural Textures (Canvas 2D -> THREE.Texture)
// --------------------------------------------------------
function createGrooveTexture() {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  
  // Base rubber
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, 256, 256);
  
  // Horizontal grooves (imperfections)
  ctx.fillStyle = "#000";
  for (let i = 0; i < 256; i += 12 + Math.random() * 4) {
    ctx.fillRect(0, i, 256, 3);
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  return tex;
}

let sharedGrooveBumpMap: THREE.Texture | null = null;
if (typeof document !== "undefined") {
  sharedGrooveBumpMap = createGrooveTexture();
}

function createGlassBaseTexture(colorHex: string) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const cx = 256, cy = 256, r = 256;
  
  // Deep glowing ring gradient
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, "#030303");       // Near-black center
  grad.addColorStop(0.3, "#050505");     // Dark inner core
  grad.addColorStop(0.65, colorHex);     // Saturated mid-ring glow
  grad.addColorStop(0.85, "#080808");    // Dark falloff
  grad.addColorStop(1, "#000000");       // Pitch black outer edge
  
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  
  // Faint concentric circular rings (aperture hints, strictly circular)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2); ctx.stroke();
  
  return new THREE.CanvasTexture(canvas);
}

// --------------------------------------------------------
// Shared Geometries & Materials (Memory Optimization)
// --------------------------------------------------------
const barrelGeo = new THREE.CylinderGeometry(1, 1, 1, 32);
barrelGeo.rotateX(Math.PI / 2); // Align to Z-axis
barrelGeo.translate(0, 0, 0.5); // Base at Z=0

const circleGeo = new THREE.CircleGeometry(1, 32);
const ringGeo = new THREE.RingGeometry(0, 1, 32); // Used for circular shutter

const bladeGeo = new THREE.PlaneGeometry(1, 1);
bladeGeo.translate(0.5, 0, 0);

const domeGeo = new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.15);
domeGeo.rotateX(Math.PI / 2);

// Physical Materials
const rubberMat = new THREE.MeshStandardMaterial({ 
  color: "#18181a", 
  roughness: 0.8, 
  metalness: 0.2,
  bumpMap: sharedGrooveBumpMap,
  bumpScale: 0.05 
});

const metalMat = new THREE.MeshStandardMaterial({ 
  color: "#111111", 
  roughness: 0.5, 
  metalness: 0.8 
});

const chromeMat = new THREE.MeshStandardMaterial({ 
  color: "#e5e7eb", 
  roughness: 0.15, 
  metalness: 1.0 
});

const shutterMat = new THREE.MeshBasicMaterial({ color: "#050505", side: THREE.DoubleSide });

// Physical Glass Cover (handles the glossy reflection, IOR, and clearcoat)
const physicalGlassMat = new THREE.MeshPhysicalMaterial({
  color: "#000000",
  transmission: 1.0,   // Full glass transmission
  opacity: 1,
  metalness: 0,
  roughness: 0.05,
  ior: 1.5,
  thickness: 2.0,
  specularIntensity: 1,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
});

// --------------------------------------------------------
// Individual Lens Component
// --------------------------------------------------------
function LensNode({ data, mousePos }: { data: LensData, mousePos: React.MutableRefObject<THREE.Vector2> }) {
  const groupRef = useRef<THREE.Group>(null);
  const bladesRef = useRef<THREE.Group>(null);
  
  const [shutterOpen, setShutterOpen] = useState(true);
  const shutterProgress = useRef(1); // 1 = open, 0 = closed
  const glassR = data.r * 0.75; // inner glass size


  // Unique texture for the glass base ring
  const glassBaseMat = useMemo(() => {
    const tex = createGlassBaseTexture(data.color);
    return new THREE.MeshBasicMaterial({ map: tex });
  }, [data.color]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const mx = mousePos.current.x;
    const my = mousePos.current.y;
    const dist = Math.hypot(mx - data.x, my - data.y);
    
    // Lift and tilt smoothly towards mouse
    const influence = Math.max(0, 1 - dist / (data.r * 5));
    
    const targetZ = influence * data.r * 0.3; // Lift up
    const targetRotX = (my - data.y) * influence * 0.015;
    const targetRotY = (mx - data.x) * influence * -0.015;

    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, delta * 4);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 4);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 4);

    // Circular Shutter Animation
    
    const targetShutter = shutterOpen ? 1.0 : 0.0;
    shutterProgress.current = THREE.MathUtils.lerp(shutterProgress.current, targetShutter, delta * 15);
    
    if (bladesRef.current) {
      bladesRef.current.children.forEach((blade, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const closedRot = angle + Math.PI / 2;
        const openRot = angle + Math.PI / 2 - 0.5;
        blade.rotation.z = THREE.MathUtils.lerp(closedRot, openRot, shutterProgress.current);
        const rOff = THREE.MathUtils.lerp(0.01, 1.2, shutterProgress.current);
        blade.position.x = Math.cos(angle) * glassR * rOff;
        blade.position.y = Math.sin(angle) * glassR * rOff;
      });
    }

  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setShutterOpen(false);
    setTimeout(() => setShutterOpen(true), 150); // Snap back open
  };

  const trimThickness = data.r * 0.08;

  return (
    <group ref={groupRef} position={[data.x, data.y, 0]} onClick={handleClick}>
      {/* Outer Barrel (Rubber with grooves) */}
      <mesh geometry={barrelGeo} material={rubberMat} scale={[data.r, data.r, data.height]}  />
      
      {/* Inner Metal Cylinder (Darker inner rim) */}
      <mesh geometry={barrelGeo} material={metalMat} scale={[data.r * 0.88, data.r * 0.88, data.height + 0.1]} />

      {/* Chrome Trim Ring (20-30% chance) */}
      {data.hasChrome && (
        <mesh 
          geometry={barrelGeo} 
          material={chromeMat} 
          scale={[data.r * 0.96, data.r * 0.96, trimThickness]} 
          position={[0, 0, data.height * 0.8]} 
        />
      )}

      {/* Glass Base (The 2D colored glowing ring) */}
      <mesh geometry={circleGeo} material={glassBaseMat} scale={[glassR, glassR, 1]} position={[0, 0, data.height + 0.05]} />

      {/* Glass Dome (Physical transmission layer for reflections) */}
      <mesh 
        geometry={domeGeo} 
        material={physicalGlassMat} 
        scale={[glassR, glassR, data.r * 0.3]} // shallow curve
        position={[0, 0, data.height + 0.06]} 
      />

      
      {/* 12-Blade Circular Mechanical Shutter Layer */}
      <group ref={bladesRef} position={[0, 0, data.height + 0.08]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} geometry={bladeGeo} material={shutterMat} scale={[glassR * 1.5, glassR * 0.6, 1]} />
        ))}
      </group>

    </group>
  );
}

// --------------------------------------------------------
// Main Scene Manager
// --------------------------------------------------------
function LensScene() {
  const { viewport, camera } = useThree();
  const mousePos = useRef(new THREE.Vector2(0, 0));

  useFrame((state) => {
    // Map mouse to world coordinates roughly
    const mx = (state.mouse.x * viewport.width) / 2;
    const my = (state.mouse.y * viewport.height) / 2;
    mousePos.current.set(mx, my);
    
    // Parallax
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.mouse.x * 6, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, state.mouse.y * 6, 0.05);
    camera.lookAt(0, 0, 0);
  });

  // Dense Packed Layout Algorithm
  const lenses = useMemo(() => {
    const rand = createRandom(54321); // Fixed seed for stable layout
    const arr: LensData[] = [];
    const bounds = 150; 
    
    const pool = [];
    for (let i = 0; i < 4; i++) pool.push(35 + rand() * 10);   // Huge
    for (let i = 0; i < 10; i++) pool.push(20 + rand() * 8);  // Large
    for (let i = 0; i < 20; i++) pool.push(10 + rand() * 6);   // Medium
    for (let i = 0; i < 25; i++) pool.push(5 + rand() * 4); // Small

    pool.sort((a, b) => b - a);

    for (const r of pool) {
      for (let attempts = 0; attempts < 3000; attempts++) {
        const x = -bounds + rand() * (bounds * 2);
        const y = -bounds + rand() * (bounds * 2);
        let collision = false;
        
        for (const l of arr) {
          if (Math.hypot(l.x - x, l.y - y) < (l.r + r) * 0.98) {
            collision = true;
            break;
          }
        }
        
        if (!collision) {
          arr.push({
            id: `lens-${arr.length}`,
            x, y, r,
            color: PALETTES[Math.floor(rand() * PALETTES.length)],
            hasChrome: rand() > 0.75, // 25% chance of premium chrome ring
            rings: 2 + Math.floor(rand() * 2),
            height: r * (0.6 + rand() * 0.4),
          });
          break;
        }
      }
    }
    return arr;
  }, []);

  return (
    <>
      <color attach="background" args={["#020202"]} />
      
      {/* 
        Problem 5 Fix: One consistent global "key light" direction (top-left).
        This guarantees all and specular reflections (soft elliptical highlights) match.
      */}
      <ambientLight intensity={0.15} />
      <directionalLight 
        position={[-40, 50, 40]} // Top-Left
        intensity={3} 
         
        shadow-mapSize={[1024, 1024]} 
      />
      
      {/* Soft rim light for barrel edges */}
      <spotLight position={[50, -50, -10]} intensity={1} color="#e0f2fe" />

      {/* Lenses */}
      <group position={[0, 0, 0]}>
        {lenses.map(data => (
          <LensNode key={data.id} data={data} mousePos={mousePos} />
        ))}
      </group>

      {/* Post Processing for Photographic Realism */}
      <EffectComposer>
        {/* Contact Shadows / Ambient Occlusion (Solves Problem 4) */}
        <N8AO aoRadius={4} intensity={2} halfRes />
        {/* Macro photography bokeh */}
        {/* Glow for the saturated glass core */}
        <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.9} intensity={0.4} />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
      </EffectComposer>
    </>
  );
}

// --------------------------------------------------------
// Wrapper Component
// --------------------------------------------------------
export function GenerativeLensesCanvas() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="fixed inset-0 bg-[#020202] z-[-10]" />;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -10 }}>
      <Canvas dpr={[1, 1.5]} 
        
        camera={{ position: [0, 0, 80], fov: 25 }} // Telephoto/Macro FOV
        className="absolute inset-0 pointer-events-auto cursor-pointer block"
      >
        <LensScene />
      </Canvas>
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
    </div>
  );
}
