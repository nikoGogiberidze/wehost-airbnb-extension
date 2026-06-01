// Generates icon16.png, icon48.png, icon128.png from an embedded SVG
// Run: node scripts/create-icons.js

import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../public/icons');
mkdirSync(outDir, { recursive: true });

// Airbnb Bélo mark — white outline on crimson background
// Outer shape: rounded arch tapering to a bottom point (like a location pin / heart hybrid)
// Inner oval: the circular opening inside the arch
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Background -->
  <rect width="200" height="200" rx="36" fill="#c0244e"/>

  <!-- Outer Bélo arch -->
  <path
    d="
      M100 22
      C 72 22, 48 46, 48 74
      C 48 96, 58 114, 70 130
      C 80 143, 90 154, 100 163
      C 110 154, 120 143, 130 130
      C 142 114, 152 96, 152 74
      C 152 46, 128 22, 100 22 Z
    "
    fill="none"
    stroke="white"
    stroke-width="11"
    stroke-linejoin="round"
    stroke-linecap="round"
  />

  <!-- Inner oval hole -->
  <ellipse
    cx="100" cy="72"
    rx="24" ry="24"
    fill="none"
    stroke="white"
    stroke-width="11"
  />
</svg>`;

const sizes = [16, 48, 128];

for (const size of sizes) {
  const outPath = resolve(outDir, `icon${size}.png`);
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ icon${size}.png`);
}

console.log('Done — icons saved to public/icons/');
