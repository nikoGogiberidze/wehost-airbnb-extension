// Generates the password hash for an AUTH_USERS entry.
// Usage: node scripts/hash-user.js <password> [pepper]
// If [pepper] is omitted, reads AUTH_PEPPER from the environment or .env file.
// The pepper MUST match the AUTH_PEPPER set in Vercel, or logins will fail.

import { hashPassword } from '../api/_lib/auth.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-user.js <password> [pepper]');
  process.exit(1);
}

let pepper = process.argv[3] || process.env.AUTH_PEPPER;
if (!pepper) {
  try {
    const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
    const m = env.match(/^AUTH_PEPPER=(.*)$/m);
    if (m) pepper = m[1].trim();
  } catch {
    /* no .env — fall through */
  }
}

if (!pepper) {
  console.error('WARNING: no AUTH_PEPPER found (arg, env, or .env). Using an empty pepper.');
  console.error('         This must match AUTH_PEPPER in Vercel.');
}

console.log(hashPassword(password, pepper || ''));
