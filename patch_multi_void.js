const fs = require('fs');

let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

const oldSteal = `            // Steal particles that are far away from the void
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
            }`;

const newSteal = `            // Steal particles that are far away from the void
            // Randomize starting index to prevent stealing the same particles every time
            const startIndex = Math.floor(Math.random() * particles.length);
            for (let j = 0; j < particles.length; j++) {
              if (stolen >= missing) break;
              const p = particles[(startIndex + j) % particles.length];
              
              // Prevent cannibalizing recently refilled particles (15 second cooldown)
              if (p.lastRefillTime && now - p.lastRefillTime < 15000) continue;

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
                p.lastRefillTime = now;
                stolen++;
              }
            }`;

code = code.replace(oldSteal, newSteal);

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
