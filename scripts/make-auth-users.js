// Builds the complete AUTH_USERS value to paste into Vercel.
// Usage:
//   node scripts/make-auth-users.js "email:password" "email2:password2:test" ...
// Each argument is email:password[:role]. role defaults to "user".
// Reads AUTH_PEPPER from .env (must match AUTH_PEPPER in Vercel).

import { hashPassword } from '../api/_lib/auth.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let pepper = process.env.AUTH_PEPPER;
if (!pepper) {
  try {
    const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
    const m = env.match(/^AUTH_PEPPER=(.*)$/m);
    if (m) pepper = m[1].trim();
  } catch {}
}
if (!pepper) {
  console.error('ERROR: AUTH_PEPPER not found in env or .env. It must match Vercel.');
  process.exit(1);
}

const pairs = process.argv.slice(2);
if (pairs.length === 0) {
  console.error('Usage: node scripts/make-auth-users.js "email:password[:role]" ...');
  process.exit(1);
}

const users = pairs.map((p) => {
  const firstColon = p.indexOf(':');
  const lastColon = p.lastIndexOf(':');
  // Support an optional :role suffix; everything between is the password.
  const knownRoles = ['user', 'test'];
  const maybeRole = p.slice(lastColon + 1);
  const hasRole = lastColon !== firstColon && knownRoles.includes(maybeRole);
  const email = p.slice(0, firstColon);
  const password = hasRole ? p.slice(firstColon + 1, lastColon) : p.slice(firstColon + 1);
  const role = hasRole ? maybeRole : 'user';
  return { email, hash: hashPassword(password, pepper), role };
});

console.log(JSON.stringify(users));
