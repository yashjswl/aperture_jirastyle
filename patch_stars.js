const fs = require('fs');

let code = fs.readFileSync('src/components/particle-physics-canvas.tsx', 'utf8');

// Replace the star spawning logic
const oldSpawn = `      // 9. Shooting Stars
      if (Math.random() < config.starSpawnRate) {
        const fromLeft = Math.random() > 0.5;
        shootingStars.push({
          x: fromLeft ? 0 : width,
          y: rand(0, height * 0.6),
          vx: fromLeft ? rand(1.25, 2.5) : rand(-2.5, -1.25),
          vy: rand(0.5, 1.5),
          trail: [],
          life: 300,
        });
      }`;

const newSpawn = `      // 9. Shooting Stars
      const spawnStar = () => {
        const fromLeft = Math.random() > 0.5;
        shootingStars.push({
          x: fromLeft ? -50 : width + 50,
          y: rand(-50, height * 0.6),
          vx: fromLeft ? rand(1.5, 3.0) : rand(-3.0, -1.5),
          vy: rand(0.5, 2.0),
          trail: [],
        });
      };

      if (shootingStars.length < 2) {
        spawnStar();
      } else if (shootingStars.length < 5 && Math.random() < 0.005) {
        spawnStar();
      }`;

code = code.replace(oldSpawn, newSpawn);

// Remove the ss.life--
code = code.replace(/ss\.life--;/g, '');

// Update the death condition
code = code.replace(
  /if \(ss\.life <= 0 \|\| ss\.x < -100 \|\| ss\.x > width \+ 100 \|\| ss\.y > height \+ 100\) \{/g,
  'if (ss.x < -100 || ss.x > width + 100 || ss.y > height + 100 || ss.y < -100) {'
);

fs.writeFileSync('src/components/particle-physics-canvas.tsx', code);
