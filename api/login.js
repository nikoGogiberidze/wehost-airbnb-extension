import { applyCors, rateLimit, clientIp, safeEqual, findUser, signToken } from './_lib/auth.js';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function readJsonBody(req) {
  if (req.body) {
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch { return {}; }
    }
    return req.body;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Tighter limit on login to slow brute-force attempts.
  if (rateLimit(clientIp(req), 20)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // First factor: the bundled API key.
  if (!safeEqual(req.headers['x-api-key'], process.env.EXTENSION_API_KEY)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, password } = await readJsonBody(req);
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = findUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Auth is not configured' });
  }

  const token = signToken({ email: user.email, role: user.role }, secret, TOKEN_TTL_MS);
  return res.status(200).json({ token, email: user.email, role: user.role });
}
