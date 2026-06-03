// Generates a Chrome Web Store screenshot: docs/screenshot-1280x800.png
// 1280x800, 24-bit PNG (no alpha) — the popup composited on a branded panel.
// Run: node scripts/create-screenshot.js

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docs = resolve(__dirname, '../docs');

const W = 1280;
const H = 800;

// Resize the raw popup capture to fit the canvas height with padding.
const popupH = 640;
const popup = await sharp(resolve(docs, 'screenshot.png'))
  .resize({ height: popupH })
  .toBuffer();
const popupW = (await sharp(popup).metadata()).width;
const popupX = 80;
const popupY = Math.round((H - popupH) / 2);

const textX = popupX + popupW + 60; // start text right of the popup

const bullet = (y, label) => `
  <circle cx="${textX + 9}" cy="${y - 8}" r="6" fill="#e05553"/>
  <text x="${textX + 30}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="400" fill="#d9d9d9">${label}</text>`;

const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1f1f1f"/><stop offset="100%" stop-color="#141414"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="${H - 12}" width="${W}" height="12" fill="#e05553"/>

  <text x="${textX}" y="235" font-family="Montserrat, Arial, Helvetica, sans-serif" font-size="44" font-weight="800" fill="#ffffff">Every Airbnb account,</text>
  <text x="${textX}" y="292" font-family="Montserrat, Arial, Helvetica, sans-serif" font-size="44" font-weight="800" fill="#e05553">one click away</text>

  ${bullet(385, 'One-click auto-login')}
  ${bullet(437, 'Clean, isolated incognito sessions')}
  ${bullet(489, 'Search, filter &amp; favorites')}
  ${bullet(541, 'Copy email or password instantly')}
</svg>`;

await sharp(Buffer.from(bg))
  .composite([{ input: popup, left: popupX, top: popupY }])
  .flatten({ background: '#141414' })
  .removeAlpha()
  .png()
  .toFile(resolve(docs, 'screenshot-1280x800.png'));

console.log('✓ docs/screenshot-1280x800.png');
