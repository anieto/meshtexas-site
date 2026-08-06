const MAX_REASON_LENGTH = 500;

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
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';

  if (!Number.isInteger(repeaterId) || repeaterId <= 0) {
    return jsonResponse({ error: 'Invalid repeaterId' }, 400);
  }
  if (!reason) {
    return jsonResponse({ error: 'A reason is required' }, 400);
  }
  if (reason.length > MAX_REASON_LENGTH) {
    return jsonResponse({ error: `reason is too long (max ${MAX_REASON_LENGTH} characters)` }, 400);
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
      'INSERT INTO deletion_requests (repeater_id, reason) VALUES (?, ?)'
    )
      .bind(repeaterId, reason)
      .run();
    return jsonResponse({ ok: true }, 201);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to submit deletion request' }, 500);
  }
}
