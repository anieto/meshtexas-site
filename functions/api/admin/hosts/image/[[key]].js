import { getAccessEmail } from '../../../../_shared/access.js';

// Serves an uploaded host-asset photo from R2, gated behind Access — never
// a public R2 URL, since a roof photo can reveal the business/address.
export async function onRequestGet(context) {
  const { request, env, params } = context;

  const email = await getAccessEmail(request, env);
  if (!email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const key = Array.isArray(params.key) ? params.key.join('/') : params.key;
  if (!key || !key.startsWith('hosts/')) {
    return new Response('Not found', { status: 404 });
  }

  const object = await env.HOST_ASSETS_BUCKET.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('cache-control', 'private, max-age=3600');

  return new Response(object.body, { headers });
}
