import { getAccessEmail } from '../../../_shared/access.js';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

const FIELDS = [
  ['assetNumber', 'asset_number'],
  ['repeaterId', 'repeater_id'],
  ['contactName', 'contact_name'],
  ['contactPhone', 'contact_phone'],
  ['businessName', 'business_name'],
  ['buildingAddress', 'building_address'],
  ['roofHeight', 'roof_height'],
  ['parapetHeight', 'parapet_height'],
  ['roofAccessMethod', 'roof_access_method'],
  ['installedDate', 'installed_date'],
  ['installerName', 'installer_name'],
  ['installerPhone', 'installer_phone'],
  ['sarcManager', 'sarc_manager'],
  ['nodeType', 'node_type'],
  ['antennaType', 'antenna_type'],
  ['mountingMethod', 'mounting_method'],
  ['batteryType', 'battery_type'],
  ['solarChargeController', 'solar_charge_controller'],
  ['solarPanel', 'solar_panel'],
  ['imageKey', 'image_key'],
];

function rowToJson(row) {
  const out = { id: row.id, createdBy: row.created_by, createdAt: row.created_at, updatedBy: row.updated_by, updatedAt: row.updated_at };
  for (const [jsKey, dbKey] of FIELDS) out[jsKey] = row[dbKey];
  return out;
}

export async function onRequestPut(context) {
  const { request, env, params } = context;

  const email = await getAccessEmail(request, env);
  if (!email) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonResponse({ error: 'Invalid host asset id' }, 400);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const assetNumber = Number(body.assetNumber);
  if (!Number.isInteger(assetNumber) || assetNumber <= 0) {
    return jsonResponse({ error: 'assetNumber must be a positive integer' }, 400);
  }

  const repeaterId = body.repeaterId ? Number(body.repeaterId) : null;
  if (body.repeaterId && (!Number.isInteger(repeaterId) || repeaterId <= 0)) {
    return jsonResponse({ error: 'repeaterId must be a positive integer if provided' }, 400);
  }

  const setClauses = ['asset_number = ?', 'repeater_id = ?', 'updated_by = ?', "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')"];
  const values = [assetNumber, repeaterId, email];

  for (const [jsKey, dbKey] of FIELDS) {
    if (jsKey === 'assetNumber' || jsKey === 'repeaterId') continue;
    setClauses.push(`${dbKey} = ?`);
    values.push(body[jsKey] ? String(body[jsKey]).trim() : null);
  }
  values.push(id);

  try {
    const existing = await env.REPEATERS_DB.prepare('SELECT id, image_key FROM host_assets WHERE id = ?').bind(id).first();
    if (!existing) {
      return jsonResponse({ error: 'Host asset not found' }, 404);
    }

    await env.REPEATERS_DB.prepare(`UPDATE host_assets SET ${setClauses.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    const newImageKey = body.imageKey || null;
    if (existing.image_key && existing.image_key !== newImageKey) {
      await env.HOST_ASSETS_BUCKET.delete(existing.image_key).catch((err) => console.error('Failed to delete replaced R2 object:', err));
    }

    const row = await env.REPEATERS_DB.prepare('SELECT * FROM host_assets WHERE id = ?').bind(id).first();
    return jsonResponse(rowToJson(row), 200);
  } catch (error) {
    if (String(error.message || '').includes('UNIQUE')) {
      return jsonResponse({ error: 'That asset number is already in use' }, 409);
    }
    console.error(error);
    return jsonResponse({ error: 'Failed to update host asset' }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;

  const email = await getAccessEmail(request, env);
  if (!email) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonResponse({ error: 'Invalid host asset id' }, 400);
  }

  try {
    const existing = await env.REPEATERS_DB.prepare('SELECT id, image_key FROM host_assets WHERE id = ?').bind(id).first();
    if (!existing) {
      return jsonResponse({ error: 'Host asset not found' }, 404);
    }

    await env.REPEATERS_DB.prepare('DELETE FROM host_assets WHERE id = ?').bind(id).run();

    if (existing.image_key) {
      await env.HOST_ASSETS_BUCKET.delete(existing.image_key).catch((err) => console.error('Failed to delete R2 object:', err));
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to delete host asset' }, 500);
  }
}
