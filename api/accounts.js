import { timingSafeEqual } from 'crypto';

// --- Security helpers ---

// Constant-time comparison so an attacker can't infer the key via response timing.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ''));
  const bufB = Buffer.from(String(b ?? ''));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Best-effort in-memory rate limiter. NOTE: Vercel serverless instances are
// ephemeral and not shared between invocations, so this only throttles bursts
// that hit the same warm instance. For robust global rate limiting, back this
// with Vercel KV / Upstash Redis.
const RATE_LIMIT = 60; // max requests
const RATE_WINDOW_MS = 60_000; // per 60s, per IP
const hits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export default async function handler(req, res) {
  // CORS — only allow the extension (chrome-extension://) or non-browser callers.
  // A website calling this from a browser gets no ACAO header and is blocked.
  // (CORS is browser-enforced only; the API key below is the real access gate.)
  const origin = req.headers.origin;
  const originAllowed = !origin || origin.startsWith('chrome-extension://');
  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key');
  // Never let credential responses sit in any cache.
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit per client IP
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Auth check (constant-time)
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !safeEqual(apiKey, process.env.EXTENSION_API_KEY)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const boardId = process.env.MONDAY_BOARD_ID;
  const token = process.env.MONDAY_API_TOKEN;

  const mondayFetch = (query) =>
    fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'API-Version': '2024-01',
      },
      body: JSON.stringify({ query }),
    }).then((r) => r.json());

  // Step 1: find the "ბინა" group ID
  const groupsRes = await mondayFetch(
    `{ boards(ids: ${boardId}) { groups { id title } } }`
  );
  const groups = groupsRes.data?.boards?.[0]?.groups || [];
  const binaGroup = groups.find((g) => g.title === 'ბინა');
  if (!binaGroup) {
    return res.status(404).json({ error: 'Group "ბინა" not found on this board' });
  }
  const groupId = binaGroup.id;

  // Step 2: paginated fetch of items in that group
  let allItems = [];
  let cursor = null;
  do {
    const query = cursor
      ? `{ next_items_page(limit: 500, cursor: "${cursor}") { cursor items { id name column_values(ids: ["text_mkrx83pz","user","pass","status54","airbnb_link"]) { id text } } } }`
      : `{ boards(ids: ${boardId}) { items_page(limit: 500, query_params: {rules: [{column_id: "group", compare_value: ["${groupId}"]}]}) { cursor items { id name column_values(ids: ["text_mkrx83pz","user","pass","status54","airbnb_link"]) { id text } } } } }`;

    const data = await mondayFetch(query);
    const page = cursor
      ? data.data?.next_items_page
      : data.data?.boards?.[0]?.items_page;

    if (!page) break;
    allItems = allItems.concat(page.items || []);
    cursor = page.cursor || null;
  } while (cursor);

  // Step 3: parse flat items
  const flatItems = allItems.map((item) => {
    const col = (id) => item.column_values.find((c) => c.id === id)?.text || '';
    return {
      georgianName: item.name,
      guestyName: col('text_mkrx83pz'),
      email: col('user'),
      password: col('pass'),
      city: col('status54'),
      airbnbUrl: col('airbnb_link'),
    };
  }).filter((a) => a.email);

  // Step 4: group by email — one account card per unique email
  // Normalize email to lowercase+trimmed to prevent case-sensitivity duplicates
  const emailMap = new Map();
  for (const item of flatItems) {
    const key = item.email.toLowerCase().trim();
    if (!emailMap.has(key)) {
      emailMap.set(key, {
        email: item.email.trim(),
        password: item.password,
        city: item.city,
        airbnbUrl: item.airbnbUrl,
        properties: [],
      });
    }
    const account = emailMap.get(key);
    // Only add property if guestyName is unique for this account
    const alreadyAdded = account.properties.some(
      (p) => p.guestyName === item.guestyName && p.georgianName === item.georgianName
    );
    if (!alreadyAdded) {
      account.properties.push({
        guestyName: item.guestyName,
        georgianName: item.georgianName,
      });
    }
    // Keep password/city/airbnbUrl from first item with non-empty value
    if (!account.password && item.password) account.password = item.password;
    if (!account.city && item.city) account.city = item.city;
    if (!account.airbnbUrl && item.airbnbUrl) account.airbnbUrl = item.airbnbUrl;
  }

  const accounts = Array.from(emailMap.values());
  return res.status(200).json(accounts);
}
