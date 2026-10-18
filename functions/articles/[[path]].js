// /articles/* is served by Ghost (on quigon, through the Cloudflare tunnel).
// Ghost's url is https://meshtexas.org/articles, so it already generates
// links, feeds and member/comment API calls under this path; this Function
// passes requests through and wraps Ghost's HTML in the site's own layout.
//
// The Ghost theme (ghost-theme/) leaves three markers in its pages:
//   <!--mt:head-->    → the site's <head> contents (stylesheet, theme script)
//   <!--mt:header-->  → the site header and mobile nav
//   <!--mt:footer-->  → the site footer
// filled from /partials/chrome/, the Astro layout around an empty slot.
//
// If Ghost is unreachable, readers get the last copy of the page this
// datacenter served (anonymous GETs only), or a short outage page.

const DEFAULT_GHOST_ORIGIN = 'https://write.meshtexas.org';
const SLOT = '<div id="mt-ghost-slot"></div>';
const MEMBER_COOKIE = /(?:^|;\s*)ghost-members-ssr=/;
// Keep fallback copies for a month; they're only read when Ghost is down.
const FALLBACK_MAX_AGE = 30 * 24 * 60 * 60;

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Legacy Astro feed URL.
  if (url.pathname === '/articles/rss.xml') {
    return Response.redirect(new URL('/articles/rss/', url), 301);
  }

  const origin = new URL(env.GHOST_ORIGIN || DEFAULT_GHOST_ORIGIN);
  const upstream = new URL(url.pathname + url.search, origin);

  // The admin lives on the Ghost host, not under meshtexas.org.
  if (url.pathname === '/articles/ghost' || url.pathname.startsWith('/articles/ghost/')) {
    return Response.redirect(upstream.toString(), 302);
  }

  const isRead = request.method === 'GET' || request.method === 'HEAD';
  const anonymous = !MEMBER_COOKIE.test(request.headers.get('Cookie') || '');
  const fallbackKey = new Request(`https://fallback.invalid${url.pathname}${url.search}`);
  const canFallback = isRead && anonymous && !url.pathname.startsWith('/articles/members/');

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', 'https');
  // Ghost rate-limits member sign-ins and comments per client IP.
  const clientIp = request.headers.get('CF-Connecting-IP');
  if (clientIp) headers.set('X-Forwarded-For', clientIp);

  let response;
  try {
    response = await fetch(upstream, {
      method: request.method,
      headers,
      body: isRead ? undefined : request.body,
      redirect: 'manual',
    });
  } catch (err) {
    response = null;
  }

  // 530/502/503/504 are what the tunnel returns while quigon or Ghost is down.
  if (!response || response.status >= 500) {
    if (canFallback) {
      const cached = await caches.default.match(fallbackKey);
      if (cached) {
        const stale = new Response(cached.body, cached);
        stale.headers.set('Cache-Control', 'no-store');
        stale.headers.set('X-MeshTexas-Fallback', 'stale');
        return stale;
      }
    }
    if (isRead && acceptsHtml(request)) {
      return outagePage(env, url);
    }
    return response || new Response('Articles are temporarily unavailable.', { status: 503 });
  }

  // Ghost resolves links typed as "/about" against its own url, so they
  // land on /articles/about. If Ghost has nothing there and the first
  // segment is a section the site links to, send the reader to the real page.
  if (response.status === 404 && isRead) {
    const target = await siteSectionFor(env, url);
    if (target) return Response.redirect(target, 301);
  }

  const out = new Headers(response.headers);
  rewriteLocation(out, origin, url);
  // Any noindex meant for the Ghost host doesn't apply to meshtexas.org.
  out.delete('X-Robots-Tag');

  const type = out.get('Content-Type') || '';
  if (!type.includes('text/html')) {
    return new Response(response.body, { status: response.status, headers: out });
  }

  const html = await wrap(await response.text(), env, url);
  out.delete('Content-Length');
  // Ghost's validator describes its own HTML, not the wrapped page; a 304
  // against it would keep a stale header/footer.
  out.delete('ETag');
  const page = new Response(html, { status: response.status, headers: out });

  if (canFallback && request.method === 'GET' && response.status === 200 && !out.has('Set-Cookie')) {
    const copy = new Response(html, { headers: { 'Content-Type': type, 'Cache-Control': `max-age=${FALLBACK_MAX_AGE}` } });
    context.waitUntil(caches.default.put(fallbackKey, copy));
  }
  return page;
}

function acceptsHtml(request) {
  return (request.headers.get('Accept') || '').includes('text/html');
}

// Ghost redirects (trailing slashes, renamed slugs) point at its configured
// url, which is already meshtexas.org; only fix any that name the origin.
function rewriteLocation(headers, origin, url) {
  const location = headers.get('Location');
  if (!location) return;
  const target = new URL(location, origin);
  if (target.host === origin.host) {
    target.protocol = url.protocol;
    target.host = url.host;
    headers.set('Location', target.toString());
  }
}

async function loadChrome(env, url) {
  const res = await env.ASSETS.fetch(new URL('/partials/chrome/', url));
  const html = await res.text();
  const slot = html.indexOf(SLOT);
  const headStart = html.indexOf('<head>');
  const headEnd = html.indexOf('</head>');
  const bodyStart = html.indexOf('>', html.indexOf('<body')) + 1;
  const bodyEnd = html.lastIndexOf('</body>');
  if (!res.ok || slot < 0 || headStart < 0 || headEnd < 0 || bodyEnd < 0) {
    throw new Error(`unexpected /partials/chrome/ (${res.status})`);
  }
  // Ghost's theme supplies the charset, viewport, title and social tags.
  const head = html
    .slice(headStart + '<head>'.length, headEnd)
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+(?:charset|name="viewport"|name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/gi, '');
  return {
    head,
    header: html.slice(bodyStart, slot),
    footer: html.slice(slot + SLOT.length, bodyEnd),
  };
}

// /articles/<section>/rest → /<section>/rest, when <section> is the first
// path segment of a link in the site's header or footer (about, connect,
// learn, host-a-node, ...). Read from the live chrome, so new nav entries
// are covered without touching this list.
async function siteSectionFor(env, url) {
  const rest = url.pathname.slice('/articles/'.length);
  const section = rest.split('/')[0];
  if (!section) return null;
  let chrome;
  try {
    chrome = await loadChrome(env, url);
  } catch (err) {
    return null;
  }
  const sections = new Set();
  for (const m of (chrome.header + chrome.footer).matchAll(/href="\/([a-z0-9-]+)/g)) {
    if (m[1] !== 'articles') sections.add(m[1]);
  }
  if (!sections.has(section)) return null;
  return new URL(`/${rest}${url.search}`, url).toString();
}

async function wrap(html, env, url) {
  let chrome;
  try {
    chrome = await loadChrome(env, url);
  } catch (err) {
    // An unstyled article beats an error page.
    console.error('articles: site chrome unavailable', err);
    return html;
  }
  return html
    .replace('<!--mt:head-->', () => chrome.head)
    .replace('<!--mt:header-->', () => chrome.header)
    .replace('<!--mt:footer-->', () => chrome.footer);
}

async function outagePage(env, url) {
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <!--mt:head-->
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>Articles — MeshTexas</title>
</head>
<body>
  <!--mt:header-->
  <div class="page-intro">
    <div class="container-narrow">
      <h1>Articles are briefly offline</h1>
      <p class="hero-sub">The server that hosts MeshTexas articles isn't responding right now. Please try again in a few minutes.</p>
    </div>
  </div>
  <!--mt:footer-->
</body>
</html>`;
  return new Response(await wrap(body, env, url), {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '120' },
  });
}
