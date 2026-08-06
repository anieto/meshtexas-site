const REGIONS = ['AUS', 'SAT', 'HOU', 'DFW', 'ELP', 'ABI', 'AMA', 'MFE', 'SJT', 'TXK', 'CRP', 'ACT'];

const MAX_LENGTHS = {
  name: 100,
  publicKey: 128,
  location: 500,
  operatorName: 100,
  contactInfo: 200,
};

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.REPEATERS_DB.prepare(
      `SELECT id, name, public_key, region, location, operator_name, contact_info, created_at
       FROM repeaters ORDER BY name COLLATE NOCASE ASC`
    ).all();
    return jsonResponse(results, 200);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to load repeaters' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const publicKey = typeof body.publicKey === 'string' ? body.publicKey.trim().toUpperCase() : '';
  const region = typeof body.region === 'string' ? body.region.trim().toUpperCase() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const operatorName = typeof body.operatorName === 'string' ? body.operatorName.trim() : '';
  const contactInfo = typeof body.contactInfo === 'string' ? body.contactInfo.trim() : '';
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';

  const fields = { name, publicKey, location, operatorName, contactInfo };
  for (const [key, value] of Object.entries(fields)) {
    if (!value) {
      return jsonResponse({ error: `Missing required field: ${key}` }, 400);
    }
    if (value.length > MAX_LENGTHS[key]) {
      return jsonResponse({ error: `${key} is too long (max ${MAX_LENGTHS[key]} characters)` }, 400);
    }
  }

  if (!REGIONS.includes(region)) {
    return jsonResponse({ error: `region must be one of: ${REGIONS.join(', ')}` }, 400);
  }

  if (!turnstileToken) {
    return jsonResponse({ error: 'Missing Turnstile token' }, 400);
  }

  try {
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: request.headers.get('CF-Connecting-IP') || undefined,
      }),
    });
    const verifyResult = await verifyResponse.json();
    if (!verifyResult.success) {
      return jsonResponse({ error: 'Turnstile verification failed' }, 403);
    }
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Turnstile verification failed' }, 403);
  }

  try {
    const inserted = await env.REPEATERS_DB.prepare(
      `INSERT INTO repeaters (name, public_key, region, location, operator_name, contact_info)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, name, public_key, region, location, operator_name, contact_info, created_at`
    )
      .bind(name, publicKey, region, location, operatorName, contactInfo)
      .first();

    return jsonResponse(inserted, 201);
  } catch (error) {
    if (String(error.message || '').includes('UNIQUE')) {
      return jsonResponse({ error: 'A repeater with that ID is already registered' }, 409);
    }
    console.error(error);
    return jsonResponse({ error: 'Failed to save repeater' }, 500);
  }
}
