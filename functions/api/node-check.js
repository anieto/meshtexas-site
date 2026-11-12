import { parseQuery, buildReport, notFound } from '../_shared/node-check.js';
import { json, analyzer, observerList } from '../_shared/analyzer.js';

const CACHE_SECONDS = 30;

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
