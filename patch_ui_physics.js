const fs = require('fs');
let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

// 1. Move UI from top-6 left-6 to bottom-6 right-6
code = code.replace(/absolute top-6 left-6/g, 'absolute bottom-6 right-6');

// 2. Reduce "action" of particles (lower the interaction forces)
// The force was 37.5. Lower it drastically to 12.0 so they don't bounce around as wildly.
code = code.replace(/37\.5\) \/ Math\.max/g, '12.0) / Math.max');

// Lower the outward burst force on double-click
code = code.replace(/const force = 150 \/ dist;/g, 'const force = 60 / dist;');

// Reduce the max slingshot speed slightly so it's less chaotic
code = code.replace(/Math\.min\(dynamicMaxSpeed, 6\.0\)/g, 'Math.min(dynamicMaxSpeed, 3.5)');

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
