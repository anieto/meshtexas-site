// Builds the site search index. Static pages come from dist/; articles live in
// Ghost, so their published HTML is fetched from the live site and added too.
// If Ghost can't be reached the index is still written, just without articles.
import { readdir, readFile } from 'node:fs/promises';
import * as pagefind from 'pagefind';

const SITEMAPS = [
  'https://meshtexas.org/articles/sitemap-posts.xml',
  'https://meshtexas.org/articles/sitemap-pages.xml',
];
const SKIP = new Set(['https://meshtexas.org/articles/']);

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

async function articleUrls() {
  const urls = [];
  for (const sitemap of SITEMAPS) {
    const xml = await fetchText(sitemap);
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      if (!SKIP.has(loc)) urls.push(loc);
    }
  }
  return urls;
}

const fail = (errors) => {
  if (errors.length) throw new Error(errors.join('\n'));
};

const { index, errors } = await pagefind.createIndex();
fail(errors);

// Every built page except /partials/, which only exists to hand the site
// chrome to the /articles Function.
let pages = 0;
for (const file of await readdir('dist', { recursive: true })) {
  if (!file.endsWith('.html') || file.startsWith('partials/')) continue;
  const url = '/' + file.replace(/(^|\/)index\.html$/, '$1');
  const page = await index.addHTMLFile({ url, content: await readFile(`dist/${file}`, 'utf8') });
  fail(page.errors);
  pages++;
}
console.log(`pagefind: ${pages} pages from dist`);

let added = 0;
try {
  for (const url of await articleUrls()) {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok || res.headers.get('X-MeshTexas-Fallback')) {
      console.warn(`pagefind: skipping ${url} (HTTP ${res.status})`);
      continue;
    }
    const file = await index.addHTMLFile({ url: new URL(url).pathname, content: await res.text() });
    fail(file.errors);
    added++;
  }
} catch (err) {
  console.warn(`pagefind: articles not indexed: ${err.message}`);
}
console.log(`pagefind: ${added} articles from Ghost`);

fail((await index.writeFiles({ outputPath: 'dist/pagefind' })).errors);
await pagefind.close();
