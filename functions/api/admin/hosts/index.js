import { getAccessEmail } from '../../../_shared/access.js';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

// Client sends camelCase; the DB uses snake_case. One place to map both ways.
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

function parseAssetNumber(body) {
  const n = Number(body.assetNumber);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const email = await getAccessEmail(request, env);
  if (!email) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const { results } = await env.REPEATERS_DB.prepare(
      'SELECT * FROM host_assets ORDER BY asset_number ASC'
    ).all();
    return jsonResponse(results.map(rowToJson), 200);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to load host assets' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const email = await getAccessEmail(request, env);
  if (!email) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const assetNumber = parseAssetNumber(body);
  if (assetNumber === null) {
    return jsonResponse({ error: 'assetNumber must be a positive integer' }, 400);
  }

  const repeaterId = body.repeaterId ? Number(body.repeaterId) : null;
  if (body.repeaterId && (!Number.isInteger(repeaterId) || repeaterId <= 0)) {
    return jsonResponse({ error: 'repeaterId must be a positive integer if provided' }, 400);
  }

  const columns = ['asset_number', 'repeater_id', 'created_by'];
  const placeholders = ['?', '?', '?'];
  const values = [assetNumber, repeaterId, email];

  for (const [jsKey, dbKey] of FIELDS) {
    if (jsKey === 'assetNumber' || jsKey === 'repeaterId') continue;
    columns.push(dbKey);
    placeholders.push('?');
    values.push(body[jsKey] ? String(body[jsKey]).trim() : null);
  }

  try {
    const result = await env.REPEATERS_DB.prepare(
      `INSERT INTO host_assets (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
    )
      .bind(...values)
      .run();

    const row = await env.REPEATERS_DB.prepare('SELECT * FROM host_assets WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return jsonResponse(rowToJson(row), 201);
  } catch (error) {
    if (String(error.message || '').includes('UNIQUE')) {
      return jsonResponse({ error: 'That asset number is already in use' }, 409);
    }
    console.error(error);
    return jsonResponse({ error: 'Failed to create host asset' }, 500);
  }
}
