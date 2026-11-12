import { parseQuery, buildReport, notFound } from '../_shared/node-check.js';

const ANALYZER = 'https://analyzer.meshtexas.org/api';
const CACHE_SECONDS = 30;

function json(body, status = 200, cacheSeconds = 0) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'cache-control': cacheSeconds ? `public, max-age=${cacheSeconds}` : 'no-store',
    },
  });
}

async function analyzer(path, { optional = false } = {}) {
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
async function observerList(context) {
  const cache = caches.default;
  const cacheKey = new Request('https://meshtexas.org/__node-check/observers');
  const hit = await cache.match(cacheKey);
  if (hit) return hit.json();
  const body = await analyzer('/observers');
  const list = (Array.isArray(body) ? body : body.observers || []).map((o) => ({ id: o.id, iata: o.iata || null }));
  context.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(list), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' },
  })));
  return list;
}

async function check(context, key) {
  const [detail, health, skew, observers] = await Promise.all([
    analyzer(`/nodes/${encodeURIComponent(key)}`),
    analyzer(`/nodes/${encodeURIComponent(key)}/health`, { optional: true }).catch(() => null),
    analyzer(`/nodes/${encodeURIComponent(key)}/clock-skew`, { optional: true }).catch(() => null),
    observerList(context).catch(() => []),
  ]);
  if (detail.notFound) return json(notFound(key), 200, CACHE_SECONDS);
  if (detail.ambiguous) {
    return json({ status: 'ambiguous', query: key, message: 'More than one node starts with that key. Enter more of it.' }, 200, CACHE_SECONDS);
  }
  // Prefix lookups resolve to the full key, but health and clock data need it too.
  const fullKey = (detail.node?.public_key || key).toLowerCase();
  if (fullKey !== key) return check(context, fullKey);
  return json(buildReport({ detail, health, skew, observers }), 200, CACHE_SECONDS);
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = parseQuery(url.searchParams.get('q'));
  if (!query) return json({ status: 'error', message: 'Enter a node name or public key.' }, 400);

  const cache = caches.default;
  const cacheKey = new Request(`https://meshtexas.org/api/node-check?q=${encodeURIComponent(query.key || 'name:' + query.name.toLowerCase())}`);
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let response;
  try {
    if (query.key) {
      response = await check(context, query.key);
    } else {
      const found = await analyzer(`/nodes/search?q=${encodeURIComponent(query.name)}`);
      const nodes = (found.nodes || []).filter((n) => n.public_key);
      const exact = nodes.filter((n) => (n.name || '').toLowerCase() === query.name.toLowerCase());
      const matches = exact.length ? exact : nodes;
      if (matches.length === 1) {
        response = await check(context, matches[0].public_key.toLowerCase());
      } else if (!matches.length) {
        response = json(notFound(query.name), 200, CACHE_SECONDS);
      } else {
        response = json({
          status: 'choose',
          query: query.name,
          matches: matches.map((n) => ({
            key: n.public_key.toLowerCase(),
            name: n.name || 'Unnamed node',
            role: n.role || 'unknown',
            lastHeard: n.last_heard || n.last_seen || null,
          })),
        }, 200, CACHE_SECONDS);
      }
    }
  } catch (error) {
    console.error(error);
    return json({ status: 'error', message: 'The analyzer didn\'t answer. Try again in a minute.' }, 502);
  }
  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
