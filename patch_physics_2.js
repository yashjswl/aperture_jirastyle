const fs = require('fs');

let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

// 1. More different sizes
const oldRadius = 'r: Math.random() > 0.8 ? rand(1.8, 3.0) : rand(0.5, 1.5),';
const newRadius = 'r: Math.random() > 0.9 ? rand(2.5, 4.5) : (Math.random() > 0.5 ? rand(1.2, 2.5) : rand(0.3, 1.2)),';
code = code.replace(oldRadius, newRadius);

// 2. Decrease connection properties by half (12.0 -> 6.0 force, 50 -> 35 distance)
code = code.replace(/12\.0\) \/ Math\.max/g, '6.0) / Math.max');
code = code.replace(/if \(dist < 50\) \{/g, 'if (dist < 35) {');
code = code.replace(/1 - \(dist \/ 50\)/g, '1 - (dist / 35)');

// 3. Ejection logic and fast fill
// We inject an ejection phase right when gw.life === 1
const gwLifeLogic = `      // 3. Process Gravity Wells
      for (let i = gravityWells.length - 1; i >= 0; i--) {
        const gw = gravityWells[i];
        gw.life--;
        if (gw.life <= 0) {
          gravityWells.splice(i, 1);
        }
      }`;

const gwLifeEject = `      // 3. Process Gravity Wells
      for (let i = gravityWells.length - 1; i >= 0; i--) {
        const gw = gravityWells[i];
        gw.life--;
        
        // Final frame: EJECT particles so they scatter and fill the void
        if (gw.life === 1) {
          for (const p of particles) {
             const dx = p.x - gw.x;
             const dy = p.y - gw.y;
             const distSq = dx * dx + dy * dy;
             if (distSq < 180 * 180) {
                const dist = Math.sqrt(distSq) || 1;
                // Variable ejection force so they stop at different distances and fill the void evenly
                const ejectForce = Math.random() * 20.0 + 5.0; 
                p.vx += (dx / dist) * ejectForce;
                p.vy += (dy / dist) * ejectForce;
             }
          }
        }
        
        if (gw.life <= 0) {
          gravityWells.splice(i, 1);
        }
      }`;

code = code.replace(gwLifeLogic, gwLifeEject);

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
