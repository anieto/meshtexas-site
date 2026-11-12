// Shared access to the MeshTexas analyzer (CoreScope) for Node Check.
// The analyzer sends no CORS headers, so browsers reach it through these
// Functions instead.

const ANALYZER = 'https://analyzer.meshtexas.org/api';

export function json(body, status = 200, cacheSeconds = 0) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'cache-control': cacheSeconds ? `public, max-age=${cacheSeconds}` : 'no-store',
    },
  });
}

export async function analyzer(path, { optional = false } = {}) {
  const response = await fetch(ANALYZER + path, {
    headers: { accept: 'application/json', 'user-agent': 'meshtexas.org node-check' },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404 && optional) return null;
  if (response.status === 404) return { notFound: true };
  if (response.status === 409) return { ambiguous: true };
  if (!response.ok) throw new Error(`analyzer ${path} returned ${response.status}`);
  return response.json();
}

// The observer list changes slowly and is needed for every check, so it's
// cached at the edge for five minutes.
export async function observerList(context) {
  const cache = caches.default;
  const cacheKey = new Request('https://meshtexas.org/__node-check/observers-v2');
  const hit = await cache.match(cacheKey);
  if (hit) return hit.json();
  const body = await analyzer('/observers');
  const list = (Array.isArray(body) ? body : body.observers || []).map((o) => ({
    id: o.id,
    iata: o.iata || null,
    lat: typeof o.lat === 'number' && o.lat !== 0 ? o.lat : null,
    lon: typeof o.lon === 'number' && o.lon !== 0 ? o.lon : null,
  }));
  context.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(list), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' },
  })));
  return list;
}
