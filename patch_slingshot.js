const fs = require('fs');
let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

// We need a variable for maxSpeed per particle.
// Replace the fixed max speed block.
code = code.replace(
  /const speed = Math\.hypot\(p1\.vx, p1\.vy\);\s+if \(speed > 1\.25\) \{\s+p1\.vx = \(p1\.vx \/ speed\) \* 1\.25;\s+p1\.vy = \(p1\.vy \/ speed\) \* 1\.25;\s+\}/,
  `const speed = Math.hypot(p1.vx, p1.vy);
        // Dynamically allow higher speed if they are swirling fast
        const dynamicMaxSpeed = 1.25 + (Math.abs(p1.vx) + Math.abs(p1.vy)) * 0.15;
        const limit = Math.min(dynamicMaxSpeed, 6.0); // Cap the slingshot at 6.0
        if (speed > limit) {
          p1.vx = (p1.vx / speed) * limit;
          p1.vy = (p1.vy / speed) * limit;
        }`
);

// We also want to slightly reduce the global damping so they retain the slingshot momentum longer.
code = code.replace(/p1\.vx \*= 0\.965;/g, 'p1.vx *= 0.985;');
code = code.replace(/p1\.vy \*= 0\.965;/g, 'p1.vy *= 0.985;');

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
