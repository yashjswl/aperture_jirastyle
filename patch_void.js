const fs = require('fs');

let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

// 1. Add voidsToRefill array and fadeStartTime to particles
code = code.replace(
  /let gravityWells: any\[\] = \[\];/,
  `let gravityWells: any[] = [];\n    let voidsToRefill: any[] = [];`
);

code = code.replace(
  /hueIdx: randInt\(0, HUES\.length\),/g,
  `hueIdx: randInt(0, HUES.length),\n        fadeStartTime: 0,`
);

// 2. On double click, add to voidsToRefill
code = code.replace(
  /gravityWells\.push\(\{ x: mx, y: my, life: 220, maxLife: 220 \}\);/,
  `gravityWells.push({ x: mx, y: my, life: 220, maxLife: 220 });\n      voidsToRefill.push({ x: mx, y: my, createdAt: performance.now() });`
);

// 3. In the step() loop, process voidsToRefill
const processVoids = `      // Process Void Refills (1.5 seconds after spawn)
      const now = performance.now();
      for (let i = voidsToRefill.length - 1; i >= 0; i--) {
        const v = voidsToRefill[i];
        if (now - v.createdAt >= 1500) {
          const radius = 200;
          let localCount = 0;
          for (const p of particles) {
            const dx = p.x - v.x;
            const dy = p.y - v.y;
            if (dx * dx + dy * dy <= radius * radius) localCount++;
          }
          
          const screenArea = width * height;
          const voidArea = Math.PI * radius * radius;
          const expectedCount = Math.floor(config.numParticles * (voidArea / screenArea)) * 1.5; // Slight boost to density target
          
          if (localCount < expectedCount) {
            const missing = Math.floor(expectedCount - localCount);
            let stolen = 0;
            
            // Steal particles that are far away from the void
            for (const p of particles) {
              if (stolen >= missing) break;
              const dx = p.x - v.x;
              const dy = p.y - v.y;
              if (dx * dx + dy * dy > 400 * 400) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * radius;
                p.x = v.x + Math.cos(angle) * r;
                p.y = v.y + Math.sin(angle) * r;
                p.vx = (Math.random() - 0.5) * 0.5;
                p.vy = (Math.random() - 0.5) * 0.5;
                p.fadeStartTime = now;
                stolen++;
              }
            }
          }
          voidsToRefill.splice(i, 1);
        }
      }

      // 1. Background Orbs`;

code = code.replace(/\/\/ 1\. Background Orbs/, processVoids);

// 4. In the render loop, apply the fadeAlpha
const renderAlpha = `      // 8. Render Particles 
      for (const p of particles) {
        let fadeAlpha = 1.0;
        if (p.fadeStartTime) {
           const elapsed = now - p.fadeStartTime;
           if (elapsed < 800) {
              fadeAlpha = elapsed / 800;
           } else {
              p.fadeStartTime = 0;
           }
        }
        
        const h = (HUES[p.hueIdx] + globalHueShift) % 360;
        const alpha = (0.85 + 0.15 * Math.sin(frame * 0.0125 + p.phase)) * fadeAlpha;`;

code = code.replace(
  /\/\/ 8\. Render Particles\s+for \(const p of particles\) \{\s+const h = \(HUES\[p\.hueIdx\] \+ globalHueShift\) % 360;\s+const alpha = 0\.85 \+ 0\.15 \* Math\.sin\(frame \* 0\.0125 \+ p\.phase\);/,
  renderAlpha
);

// We need to make sure `now` is defined at the top of `step()` if it wasn't already.
// Wait, `const now = performance.now();` is defined in the `processVoids` block, so it is in scope for the render loop!
// Wait, no. `const now = performance.now();` is block-scoped?
// It is at the root of `step()` function scope because I inserted it right before `// 1. Background Orbs`.
// So it is available anywhere inside `step()`.

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
