function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

function isAuthorized(request) {
  // Cloudflare Access sets this header after verifying the visitor's
  // identity, and strips any client-supplied value first — it can't be
  // spoofed by a request that didn't pass through Access.
  return Boolean(request.headers.get('Cf-Access-Authenticated-User-Email'));
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isAuthorized(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const { results } = await env.REPEATERS_DB.prepare(
      `SELECT
         dr.id AS request_id,
         dr.reason,
         dr.requested_at,
         r.id AS repeater_id,
         r.name,
         r.public_key,
         r.region,
         r.location,
         r.operator_name,
         r.contact_info
       FROM deletion_requests dr
       JOIN repeaters r ON r.id = dr.repeater_id
       WHERE dr.status = 'pending'
       ORDER BY dr.requested_at ASC`
    ).all();
    return jsonResponse(results, 200);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to load deletion requests' }, 500);
  }
}
