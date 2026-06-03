// Generates the Chrome Web Store promo tiles as 24-bit PNGs (no alpha):
//   docs/promo-440x280.png   (small promo tile)
//   docs/promo-1400x560.png  (marquee promo tile)
// Run: node scripts/create-promo.js

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = resolve(__dirname, '../docs');

// Reusable Bélo mark (200x200 viewBox coordinate space)
const belo = (stroke = 12) => `
    <path d="M100 22 C 72 22, 48 46, 48 74 C 48 96, 58 114, 70 130 C 80 143, 90 154, 100 163
             C 110 154, 120 143, 130 130 C 142 114, 152 96, 152 74 C 152 46, 128 22, 100 22 Z"
          fill="none" stroke="#e05553" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round"/>
    <ellipse cx="100" cy="72" rx="24" ry="24" fill="none" stroke="#e05553" stroke-width="${stroke}"/>`;

async function render(name, svg, bar) {
  const buf = Buffer.from(svg);
  await sharp(buf).flatten({ background: '#141414' }).png().toFile(resolve(docsDir, name));
  console.log(`✓ ${name}`);
}

// --- Small promo tile: 440x280 ---
const small = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1f1f1f"/><stop offset="100%" stop-color="#141414"/>
  </linearGradient></defs>
  <rect width="440" height="280" fill="url(#bg)"/>
  <rect x="0" y="274" width="440" height="6" fill="#e05553"/>
  <g transform="translate(36, 98) scale(0.40)">${belo(12)}</g>
  <text x="138" y="126" font-family="Montserrat, Arial, Helvetica, sans-serif" font-size="50" font-weight="800" fill="#ffffff" letter-spacing="1">WEHOST</text>
  <text x="140" y="156" font-family="Montserrat, Arial, Helvetica, sans-serif" font-size="18" font-weight="600" fill="#e05553">Airbnb Accounts Manager</text>
  <text x="140" y="182" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="400" fill="#b5b5b5">One-click login for every host account</text>
</svg>`;

// --- Marquee promo tile: 1400x560 ---
const marquee = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1f1f1f"/><stop offset="100%" stop-color="#141414"/>
  </linearGradient></defs>
  <rect width="1400" height="560" fill="url(#bg)"/>
  <rect x="0" y="546" width="1400" height="14" fill="#e05553"/>
  <g transform="translate(190, 150) scale(1.30)">${belo(12)}</g>
  <text x="470" y="300" font-family="Montserrat, Arial, Helvetica, sans-serif" font-size="130" font-weight="800" fill="#ffffff" letter-spacing="2">WEHOST</text>
  <text x="476" y="372" font-family="Montserrat, Arial, Helvetica, sans-serif" font-size="46" font-weight="600" fill="#e05553">Airbnb Accounts Manager</text>
  <text x="476" y="436" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="400" fill="#b5b5b5">One-click login for every host account</text>
</svg>`;

await render('promo-440x280.png', small);
await render('promo-1400x560.png', marquee);
console.log('Done — promo tiles saved to docs/');
