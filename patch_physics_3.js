const fs = require('fs');

let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

// 1. Primary Colors
code = code.replace(/const HUES = \[.*\];/g, 'const HUES = [0, 60, 120, 220, 300]; // Red, Yellow, Green, Blue, Magenta');

// 2. Reduce largest particle sizes
const oldRadius = 'r: Math.random() > 0.9 ? rand(2.5, 4.5) : (Math.random() > 0.5 ? rand(1.2, 2.5) : rand(0.3, 1.2)),';
const newRadius = 'r: Math.random() > 0.9 ? rand(2.0, 3.2) : (Math.random() > 0.5 ? rand(1.2, 2.5) : rand(0.3, 1.2)),';
code = code.replace(oldRadius, newRadius);

// 3. Ambient speed boost to help fill voids faster
code = code.replace(/vx: rand\(-0\.125, 0\.125\),/g, 'vx: rand(-0.25, 0.25),');
code = code.replace(/vy: rand\(-0\.125, 0\.125\),/g, 'vy: rand(-0.25, 0.25),');

// 4. Ejection Scatter (Random Direction instead of Radial Outward)
const oldEject = `                p.vx += (dx / dist) * ejectForce;
                p.vy += (dy / dist) * ejectForce;`;
const newEject = `                const angle = Math.random() * Math.PI * 2;
                p.vx += Math.cos(angle) * ejectForce;
                p.vy += Math.sin(angle) * ejectForce;`;
code = code.replace(oldEject, newEject);

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
