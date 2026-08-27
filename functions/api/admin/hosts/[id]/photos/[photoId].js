import { getAccessEmail } from '../../../../../_shared/access.js';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;

  const email = await getAccessEmail(request, env);
  if (!email) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const hostAssetId = Number(params.id);
  const photoId = Number(params.photoId);
  if (!Number.isInteger(hostAssetId) || hostAssetId <= 0 || !Number.isInteger(photoId) || photoId <= 0) {
    return jsonResponse({ error: 'Invalid id' }, 400);
  }

  try {
    const photo = await env.REPEATERS_DB.prepare(
      'SELECT id, image_key FROM host_asset_images WHERE id = ? AND host_asset_id = ?'
    )
      .bind(photoId, hostAssetId)
      .first();

    if (!photo) {
      return jsonResponse({ error: 'Photo not found' }, 404);
    }

    await env.REPEATERS_DB.prepare('DELETE FROM host_asset_images WHERE id = ?').bind(photoId).run();
    await env.HOST_ASSETS_BUCKET.delete(photo.image_key).catch((err) => console.error('Failed to delete R2 object:', err));

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to delete photo' }, 500);
  }
}
