// Node Check live test: "did anyone hear me?"
//
// GET /api/node-watch?key=<hex>            → { status, mark } to start a test
// GET /api/node-watch?key=<hex>&after=<n>  → adverts the analyzer stored after
//                                            mark n, with who heard them
//
// The mark is the analyzer's newest transmission id for the node. Ids follow
// ingest order, unlike timestamps, which come from observers' clocks.

import { summarizeAdverts } from '../_shared/node-check.js';
import { json, analyzer, observerList } from '../_shared/analyzer.js';

const ADVERT = 4;

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const key = (url.searchParams.get('key') || '').trim().toLowerCase();
  if (!/^[0-9a-f]{8,64}$/.test(key)) {
    return json({ status: 'error', message: 'A live test needs the node\'s public key (at least 8 characters).' }, 400);
  }
  const afterParam = url.searchParams.get('after');
  const after = afterParam == null ? null : Number(afterParam);
  if (after != null && (!Number.isSafeInteger(after) || after < 0)) {
    return json({ status: 'error', message: 'Invalid test mark.' }, 400);
  }

  // Everyone watching the same node shares one analyzer request every few seconds.
  const cache = caches.default;
  const cacheKey = new Request(`https://meshtexas.org/__node-check/watch/${key}`);
  let detail;
  const hit = await cache.match(cacheKey);
  try {
    if (hit) {
      detail = await hit.json();
    } else {
      detail = await analyzer(`/nodes/${encodeURIComponent(key)}`);
      context.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(detail), {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3' },
      })));
    }
  } catch (error) {
    console.error(error);
    return json({ status: 'error', message: 'The analyzer didn\'t answer. Trying again…' }, 502);
  }

  if (detail.ambiguous) {
    return json({ status: 'error', message: 'More than one node starts with that key. Enter more of it.' }, 400);
  }
  // A node the analyzer has never heard can still be tested: its first advert
  // is exactly what we're waiting for.
  const transmissions = detail.notFound ? [] : (detail.recentAdverts || []);
  const mark = transmissions.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0);
  const node = detail.notFound ? null : {
    key: (detail.node?.public_key || key).toLowerCase(),
    name: detail.node?.name || 'Unnamed node',
    lat: detail.node?.lat || null,
    lon: detail.node?.lon || null,
  };

  if (after == null) return json({ status: 'ready', mark, node });

  const fresh = transmissions.filter((t) => Number(t.id) > after && t.payload_type === ADVERT);
  if (!fresh.length) return json({ status: 'waiting', mark: Math.max(mark, after), node });

  const observers = await observerList(context).catch(() => []);
  const summary = summarizeAdverts(fresh, new Map(observers.map((o) => [o.id, o])), { withLocation: true });
  return json({
    status: 'heard',
    mark: Math.max(mark, after),
    node,
    adverts: fresh.length,
    kinds: [...new Set(fresh.map((t) => t.advert_kind).filter(Boolean))],
    ...summary,
  });
}
