import { getAccessEmail } from '../../../../../_shared/access.js';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

function rowToJson(row) {
  return {
    id: row.id,
    hostAssetId: row.host_asset_id,
    imageKey: row.image_key,
    label: row.label,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
}

export async function onRequestGet(context) {
  const { request, env, params } = context;

  const email = await getAccessEmail(request, env);
  if (!email) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const hostAssetId = Number(params.id);
  if (!Number.isInteger(hostAssetId) || hostAssetId <= 0) {
    return jsonResponse({ error: 'Invalid host asset id' }, 400);
  }

  try {
    const { results } = await env.REPEATERS_DB.prepare(
      'SELECT * FROM host_asset_images WHERE host_asset_id = ? ORDER BY uploaded_at ASC'
    )
      .bind(hostAssetId)
      .all();
    return jsonResponse(results.map(rowToJson), 200);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to load photos' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env, params } = context;

  const email = await getAccessEmail(request, env);
  if (!email) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const hostAssetId = Number(params.id);
  if (!Number.isInteger(hostAssetId) || hostAssetId <= 0) {
    return jsonResponse({ error: 'Invalid host asset id' }, 400);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const imageKey = typeof body.imageKey === 'string' ? body.imageKey.trim() : '';
  if (!imageKey.startsWith('hosts/')) {
    return jsonResponse({ error: 'imageKey must reference an uploaded image' }, 400);
  }

  try {
    const hostAsset = await env.REPEATERS_DB.prepare('SELECT id FROM host_assets WHERE id = ?').bind(hostAssetId).first();
    if (!hostAsset) {
      return jsonResponse({ error: 'Host asset not found' }, 404);
    }

    const label = body.label ? String(body.label).trim() : null;

    const result = await env.REPEATERS_DB.prepare(
      'INSERT INTO host_asset_images (host_asset_id, image_key, label, uploaded_by) VALUES (?, ?, ?, ?)'
    )
      .bind(hostAssetId, imageKey, label, email)
      .run();

    const row = await env.REPEATERS_DB.prepare('SELECT * FROM host_asset_images WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return jsonResponse(rowToJson(row), 201);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to attach photo' }, 500);
  }
}
