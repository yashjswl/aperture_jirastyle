const fs = require('fs');

let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

// Replace the gentle outward push with a strong inward pull (implosion) at the end of the well's life
const oldEject = `                // Gentle outward push to expand the spiral naturally so it leaves no void
                const ejectForce = Math.random() * 4.0 + 2.0; 
                p.vx += (dx / dist) * ejectForce;
                p.vy += (dy / dist) * ejectForce;`;

const newEject = `                // Strong INWARD pull to make them collapse into the center right as the well dies
                const implosionForce = Math.random() * 6.0 + 4.0; 
                p.vx -= (dx / dist) * implosionForce;
                p.vy -= (dy / dist) * implosionForce;`;

code = code.replace(oldEject, newEject);

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
