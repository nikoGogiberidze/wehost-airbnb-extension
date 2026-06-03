// Generates the Chrome Web Store small promo tile: docs/promo-440x280.png
// 440x280, 24-bit PNG, no alpha (flattened background).
// Run: node scripts/create-promo.js

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '../docs/promo-440x280.png');

const W = 440;
const H = 280;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1f1f1f"/>
      <stop offset="100%" stop-color="#141414"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- accent bottom bar -->
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="#e05553"/>

  <!-- Bélo mark -->
  <g transform="translate(36, 98) scale(0.40)">
    <path d="M100 22 C 72 22, 48 46, 48 74 C 48 96, 58 114, 70 130 C 80 143, 90 154, 100 163
             C 110 154, 120 143, 130 130 C 142 114, 152 96, 152 74 C 152 46, 128 22, 100 22 Z"
          fill="none" stroke="#e05553" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
    <ellipse cx="100" cy="72" rx="24" ry="24" fill="none" stroke="#e05553" stroke-width="12"/>
  </g>

  <!-- Wordmark + tagline -->
  <text x="138" y="126" font-family="Montserrat, Arial, Helvetica, sans-serif"
        font-size="50" font-weight="800" fill="#ffffff" letter-spacing="1">WEHOST</text>
  <text x="140" y="156" font-family="Montserrat, Arial, Helvetica, sans-serif"
        font-size="18" font-weight="600" fill="#e05553">Airbnb Accounts Manager</text>
  <text x="140" y="182" font-family="Arial, Helvetica, sans-serif"
        font-size="14" font-weight="400" fill="#b5b5b5">One-click login for every host account</text>
</svg>`;

await sharp(Buffer.from(svg))
  .flatten({ background: '#141414' }) // remove alpha -> 24-bit
  .png()
  .toFile(outPath);

console.log(`✓ promo tile saved to ${outPath}`);
