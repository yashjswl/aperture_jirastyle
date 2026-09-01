const fs = require('fs');
let code = fs.readFileSync('src/components/generative-lenses-canvas.tsx', 'utf8');

code = code.replace(
  'function createGrooveTexture() {',
  'function createGrooveTexture() {\n  if (typeof document === "undefined") return null;\n'
);

code = code.replace(
  'function createGlassBaseTexture(colorHex: string) {',
  'function createGlassBaseTexture(colorHex: string) {\n  if (typeof document === "undefined") return null;\n'
);

code = code.replace(
  'const sharedGrooveBumpMap = createGrooveTexture();',
  'let sharedGrooveBumpMap: THREE.Texture | null = null;\nif (typeof document !== "undefined") {\n  sharedGrooveBumpMap = createGrooveTexture();\n}'
);

fs.writeFileSync('src/components/generative-lenses-canvas.tsx', code);
