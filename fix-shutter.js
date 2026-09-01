const fs = require('fs');
let code = fs.readFileSync('src/components/generative-lenses-canvas.tsx', 'utf8');

// Replace the single shutter ring with a 12-blade aperture array
const bladeGeo = `const bladeGeo = new THREE.PlaneGeometry(1, 1);
bladeGeo.translate(0.5, 0, 0);`;

code = code.replace('const domeGeo =', bladeGeo + '\n\nconst domeGeo =');

const bladesInit = `const bladesRef = useRef<THREE.Group>(null);`;
code = code.replace('const shutterRef = useRef<THREE.Mesh>(null);', bladesInit);

const animateShutter = `
    const targetShutter = shutterOpen ? 1.0 : 0.0;
    shutterProgress.current = THREE.MathUtils.lerp(shutterProgress.current, targetShutter, delta * 15);
    
    if (bladesRef.current) {
      bladesRef.current.children.forEach((blade, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const closedRot = angle + Math.PI / 2;
        const openRot = angle + Math.PI / 2 - 0.5;
        blade.rotation.z = THREE.MathUtils.lerp(closedRot, openRot, shutterProgress.current);
        const rOff = THREE.MathUtils.lerp(0.01, 1.2, shutterProgress.current);
        blade.position.x = Math.cos(angle) * glassR * rOff;
        blade.position.y = Math.sin(angle) * glassR * rOff;
      });
    }
`;

code = code.replace(/const targetShutter = shutterOpen \? 1\.0 : 0\.001;.*?shutterRef\.current\.scale\.set\(shutterProgress\.current, shutterProgress\.current, 1\);\n    \}/s, animateShutter);

const bladesRender = `
      {/* 12-Blade Circular Mechanical Shutter Layer */}
      <group ref={bladesRef} position={[0, 0, data.height + 0.08]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} geometry={bladeGeo} material={shutterMat} scale={[glassR * 1.5, glassR * 0.6, 1]} />
        ))}
      </group>
`;

code = code.replace(/\{\/\* Circular Mechanical Shutter Layer \*\/\}.*?<\/group>/s, bladesRender + '\n    </group>');

fs.writeFileSync('src/components/generative-lenses-canvas.tsx', code);
