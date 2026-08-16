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

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

async function sendInquiryEmail(env, { email, address, roofHeight, message }) {
  const rows = [
    ['Email', email],
    ['Building address', address || '(not provided)'],
    ['Approx. roof height', roofHeight || '(not provided)'],
    ['Message', message || '(none)'],
  ];

  const html = `<p>New commercial host inquiry from meshtexas.org:</p><ul>${rows
    .map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`)
    .join('')}</ul>`;
  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MeshTexas Host Inquiries <hosting@notify.meshtexas.org>',
      to: 'info@meshtexas.org',
      reply_to: email,
      subject: 'New commercial host inquiry',
      html,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API returned ${response.status}: ${await response.text()}`);
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
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to save inquiry' }, 500);
  }

  try {
    await sendInquiryEmail(env, { email, address, roofHeight, message });
  } catch (error) {
    // Inquiry is already durably stored in D1, so a notification-email
    // failure shouldn't fail the visitor's request — just log it for
    // manual follow-up via `wrangler d1 execute`.
    console.error('Failed to send host inquiry notification email:', error);
  }

  return jsonResponse({ ok: true }, 201);
}
