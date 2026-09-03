const fs = require('fs');

let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

// 1. Change Particle Pull/Swirl to Twirl gracefully like a galaxy
const oldPhysics = `            const pullF = 2.5 * lifeRatio * falloff;
            const swirlF = 3.5 * lifeRatio * falloff;`;
const newPhysics = `            // Much weaker pull, massively stronger swirl to create a galaxy spiral instead of a clump
            const pullF = 0.25 * lifeRatio * falloff; 
            const swirlF = 6.0 * lifeRatio * falloff;`;
code = code.replace(oldPhysics, newPhysics);

// 2. Change the Ejection to be a gentle radial expansion so the spiral naturally flies apart, avoiding a void
const oldEject = `                // Variable ejection force so they stop at different distances and fill the void evenly
                const ejectForce = Math.random() * 20.0 + 5.0; 
                const angle = Math.random() * Math.PI * 2;
                p.vx += Math.cos(angle) * ejectForce;
                p.vy += Math.sin(angle) * ejectForce;`;
const newEject = `                // Gentle outward push to expand the spiral naturally so it leaves no void
                const ejectForce = Math.random() * 4.0 + 2.0; 
                p.vx += (dx / dist) * ejectForce;
                p.vy += (dy / dist) * ejectForce;`;
code = code.replace(oldEject, newEject);

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
