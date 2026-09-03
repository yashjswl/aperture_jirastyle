const fs = require('fs');

let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

// Orbs init
code = code.replace(/vx: rand\(-0\.1, 0\.1\)/g, 'vx: rand(-0.025, 0.025)');
code = code.replace(/vy: rand\(-0\.1, 0\.1\)/g, 'vy: rand(-0.025, 0.025)');

// Particles init
code = code.replace(/vx: rand\(-0\.5, 0\.5\)/g, 'vx: rand(-0.125, 0.125)');
code = code.replace(/vy: rand\(-0\.5, 0\.5\)/g, 'vy: rand(-0.125, 0.125)');

// Particle-Particle Force
code = code.replace(/150\) \/ Math\.max/g, '37.5) / Math.max');

// Mouse Force
code = code.replace(/\) \* 0\.5;/g, ') * 0.125;');

// Gravity Well (Particles)
code = code.replace(/pullF = 0\.8/g, 'pullF = 0.2');
code = code.replace(/swirlF = 1\.2/g, 'swirlF = 0.3');

// Max Speed (Particles)
code = code.replace(/speed > 5/g, 'speed > 1.25');
code = code.replace(/\/ speed\) \* 5/g, '/ speed) * 1.25');

// Hue Shift
code = code.replace(/globalHueShift \+= 0\.05;/g, 'globalHueShift += 0.0125;');

// Twinkle Speed
code = code.replace(/frame \* 0\.05/g, 'frame * 0.0125');

// Shooting Stars Init
code = code.replace(/rand\(5, 10\)/g, 'rand(1.25, 2.5)');
code = code.replace(/rand\(-10, -5\)/g, 'rand(-2.5, -1.25)');
code = code.replace(/rand\(2, 6\)/g, 'rand(0.5, 1.5)');

// Gravity Well (Shooting Stars)
code = code.replace(/pullF = 2\.0/g, 'pullF = 0.5');
code = code.replace(/swirlF = 3\.0/g, 'swirlF = 0.75');

// Max Speed (Shooting Stars)
code = code.replace(/speed > 15/g, 'speed > 3.75');
code = code.replace(/\/ speed\) \* 15/g, '/ speed) * 3.75');

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
