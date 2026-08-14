const MAX_LENGTHS = {
  email: 200,
  address: 500,
  roofHeight: 100,
  message: 2000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const roofHeight = typeof body.roofHeight === 'string' ? body.roofHeight.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';

  if (!email) {
    return jsonResponse({ error: 'Missing required field: email' }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return jsonResponse({ error: 'Please enter a valid email address' }, 400);
  }

  const fields = { email, address, roofHeight, message };
  for (const [key, value] of Object.entries(fields)) {
    if (value.length > MAX_LENGTHS[key]) {
      return jsonResponse({ error: `${key} is too long (max ${MAX_LENGTHS[key]} characters)` }, 400);
    }
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
    await env.REPEATERS_DB.prepare(
      `INSERT INTO host_inquiries (email, address, roof_height, message)
       VALUES (?, ?, ?, ?)`
    )
      .bind(email, address || null, roofHeight || null, message || null)
      .run();

    return jsonResponse({ ok: true }, 201);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to save inquiry' }, 500);
  }
}
