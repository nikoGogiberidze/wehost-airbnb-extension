export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth check
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.EXTENSION_API_KEY) {
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
