const sharp = require('sharp');
const fs = require('fs');

async function extractLenses() {
  const imgPath = 'public/lenses-bg.jpg';
  const outDir = 'public/assets/lenses';
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const metadata = await sharp(imgPath).metadata();
  const width = metadata.width;
  const height = metadata.height;
  
  // Create a 5x4 grid of crops
  const cols = 5;
  const rows = 4;
  const numLenses = cols * rows;
  
  const cellWidth = Math.floor(width / cols);
  const cellHeight = Math.floor(height / rows);
  const radius = Math.floor(Math.min(cellWidth, cellHeight) / 2 * 0.95);
  const size = radius * 2;
  
  // Create circular SVG mask
  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white" />
    </svg>`
  );

  let index = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = Math.floor(c * cellWidth + cellWidth / 2);
      const cy = Math.floor(r * cellHeight + cellHeight / 2);
      
      const left = cx - radius;
      const top = cy - radius;
      
      await sharp(imgPath)
        .extract({ left, top, width: size, height: size })
        .composite([{
          input: circleSvg,
          blend: 'dest-in'
        }])
        .png()
        .toFile(`${outDir}/lens${index}.png`);
        
      console.log(`Generated lens${index}.png`);
      index++;
    }
  }
}

extractLenses().catch(console.error);
