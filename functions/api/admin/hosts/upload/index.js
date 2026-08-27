import { getAccessEmail } from '../../../../_shared/access.js';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

export async function onRequestPost(context) {
  const { request, env } = context;

  const email = await getAccessEmail(request, env);
  if (!email) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    return jsonResponse({ error: 'Expected multipart/form-data with a file field' }, 400);
  }

  const file = formData.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') {
    return jsonResponse({ error: 'Missing file' }, 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonResponse({ error: 'Only JPEG, PNG, WEBP, or HEIC images are allowed' }, 400);
  }

  if (file.size > MAX_BYTES) {
    return jsonResponse({ error: 'Image must be under 8MB' }, 400);
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const key = `hosts/${crypto.randomUUID()}.${ext}`;

  try {
    await env.HOST_ASSETS_BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
    return jsonResponse({ key }, 201);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to upload image' }, 500);
  }
}
