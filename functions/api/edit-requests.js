const REGIONS = ['AUS', 'SAT', 'HOU', 'DFW', 'ELP', 'ABI', 'AMA', 'MFE', 'SJT', 'TXK', 'CRP', 'ACT'];

const MAX_LENGTHS = {
  name: 100,
  publicKey: 128,
  location: 500,
  operatorName: 100,
  contactInfo: 200,
  note: 500,
};

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const repeaterId = Number(body.repeaterId);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const publicKey = typeof body.publicKey === 'string' ? body.publicKey.trim().toUpperCase() : '';
  const region = typeof body.region === 'string' ? body.region.trim().toUpperCase() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const operatorName = typeof body.operatorName === 'string' ? body.operatorName.trim() : '';
  const contactInfo = typeof body.contactInfo === 'string' ? body.contactInfo.trim() : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';

  if (!Number.isInteger(repeaterId) || repeaterId <= 0) {
    return jsonResponse({ error: 'Invalid repeaterId' }, 400);
  }

  const fields = { name, publicKey, location, operatorName, contactInfo };
  for (const [key, value] of Object.entries(fields)) {
    if (!value) {
      return jsonResponse({ error: `Missing required field: ${key}` }, 400);
    }
    if (value.length > MAX_LENGTHS[key]) {
      return jsonResponse({ error: `${key} is too long (max ${MAX_LENGTHS[key]} characters)` }, 400);
    }
  }
  if (note.length > MAX_LENGTHS.note) {
    return jsonResponse({ error: `note is too long (max ${MAX_LENGTHS.note} characters)` }, 400);
  }

  if (!REGIONS.includes(region)) {
    return jsonResponse({ error: `region must be one of: ${REGIONS.join(', ')}` }, 400);
  }

  if (!turnstileToken) {
    return jsonResponse({ error: 'Missing Turnstile token' }, 400);
  }

  try {
    const repeater = await env.REPEATERS_DB.prepare('SELECT id FROM repeaters WHERE id = ?')
      .bind(repeaterId)
      .first();
    if (!repeater) {
      return jsonResponse({ error: 'Repeater not found' }, 404);
    }
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to look up repeater' }, 500);
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
    await env.REPEATERS_DB.prepare(
      `INSERT INTO edit_requests (repeater_id, name, public_key, region, location, operator_name, contact_info, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(repeaterId, name, publicKey, region, location, operatorName, contactInfo, note || null)
      .run();
    return jsonResponse({ ok: true }, 201);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to submit edit request' }, 500);
  }
}
