// Shared auth/security helpers for the serverless API.
// Files/dirs under api/ prefixed with "_" are not routed as functions by Vercel,
// but can be imported by the route handlers (api/login.js, api/accounts.js).

import { createHmac, scryptSync, timingSafeEqual } from 'crypto';

// --- Password hashing -------------------------------------------------------

// scrypt is a deliberately slow, memory-hard KDF — far more resistant to GPU
// brute-force than a plain hash. The server-only pepper (AUTH_PEPPER) doubles as
// the salt, so hashing stays deterministic (login re-hashes the candidate and
// compares) without storing a per-user salt. A leaked AUTH_USERS list cannot be
// cracked offline without the pepper. (A future hardening step is a per-user
// random salt stored alongside each hash.)
export function hashPassword(password, pepper) {
  return scryptSync(String(password), String(pepper || ''), 64).toString('hex');
}

function safeEqualHex(a, b) {
  let bufA, bufB;
  try {
    bufA = Buffer.from(String(a), 'hex');
    bufB = Buffer.from(String(b), 'hex');
  } catch {
    return false;
  }
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Constant-time compare for arbitrary strings (e.g. the bundled API key).
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ''));
  const bufB = Buffer.from(String(b ?? ''));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Validate credentials against the AUTH_USERS allowlist (JSON in env).
// Returns { email, role } on success, or null.
export function findUser(email, password) {
  let users;
  try {
    users = JSON.parse(process.env.AUTH_USERS || '[]');
  } catch {
    return null;
  }
  const pepper = process.env.AUTH_PEPPER || '';
  const normEmail = String(email || '').toLowerCase().trim();
  const candidate = hashPassword(password, pepper);

  for (const u of users) {
    if (String(u.email || '').toLowerCase().trim() === normEmail) {
      return safeEqualHex(candidate, u.hash) ? { email: u.email, role: u.role || 'user' } : null;
    }
  }
  return null;
}

// --- Minimal signed token (HS256 JWT, dependency-free) ----------------------

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function signToken(payload, secret, ttlMs) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + ttlMs }));
  const data = `${header}.${body}`;
  const sig = createHmac('sha256', String(secret)).update(data).digest('base64url');
  return `${data}.${sig}`;
}

// Returns the decoded payload ({ email, role, exp }) if the signature and
// expiry are valid, otherwise null.
export function verifyToken(token, secret) {
  if (!token || typeof token !== 'string' || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = createHmac('sha256', String(secret)).update(`${header}.${body}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

// --- CORS (chrome-extension origins only) -----------------------------------

export function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowed = !origin || origin.startsWith('chrome-extension://');
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, authorization, content-type');
  res.setHeader('Cache-Control', 'no-store');
}

// --- Best-effort rate limiter -----------------------------------------------
// NOTE: Vercel serverless instances are ephemeral and not shared, so this only
// throttles bursts hitting the same warm instance. Use Vercel KV / Upstash for
// robust global limiting.

const RATE_WINDOW_MS = 60_000;
const hits = new Map();

export function rateLimit(ip, limit = 60) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

export function clientIp(req) {
  // x-real-ip is set by Vercel's edge to the real connecting IP and cannot be
  // spoofed by the client. Fall back to the LAST x-forwarded-for entry (the hop
  // closest to Vercel), never the client-controlled first entry.
  const real = req.headers['x-real-ip'];
  if (real) return String(real).trim();
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const parts = String(xff).split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return 'unknown';
}
