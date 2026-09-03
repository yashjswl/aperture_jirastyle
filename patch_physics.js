const fs = require('fs');

let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

// 1. Particle counts and star spawn rates
code = code.replace(
  /calm: \{ numParticles: 130, numOrbs: 26, starSpawnRate: 0\.005 \}/,
  'calm: { numParticles: 220, numOrbs: 26, starSpawnRate: 0.025 }'
);
code = code.replace(
  /event: \{ numParticles: 190, numOrbs: 40, starSpawnRate: 0\.015 \}/,
  'event: { numParticles: 380, numOrbs: 40, starSpawnRate: 0.08 }'
);

// 2. Particle Sizes (many small, some bigger)
code = code.replace(
  /r: rand\(1\.4, 4\),/g,
  'r: Math.random() > 0.8 ? rand(1.8, 3.0) : rand(0.5, 1.5),'
);

// 3. Remove Tremor (Physics Softening)
code = code.replace(
  /Math\.max\(distSq, 50\)/g,
  'Math.max(distSq, 600)' // Huge softening parameter to stop jittering when close
);

// 4. Remove Tremor (Twinkle Alpha)
code = code.replace(
  /const alpha = 0\.5 \+ 0\.5 \* Math\.sin/g,
  'const alpha = 0.75 + 0.25 * Math.sin'
);

// 5. Gravity Wells (Black hole swirl effect)
// For particles:
code = code.replace(/const pullF = 0\.2 \* lifeRatio/g, 'const pullF = 0.6 * lifeRatio');
code = code.replace(/const swirlF = 0\.3 \* lifeRatio/g, 'const swirlF = 1.5 * lifeRatio');

// For shooting stars:
code = code.replace(/const pullF = 0\.5 \* lifeRatio/g, 'const pullF = 1.2 * lifeRatio');
code = code.replace(/const swirlF = 0\.75 \* lifeRatio/g, 'const swirlF = 2.5 * lifeRatio');

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
