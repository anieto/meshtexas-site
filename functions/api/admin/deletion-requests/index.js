import { getAccessEmail } from '../../../_shared/access.js';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const email = await getAccessEmail(request, env);
  if (!email) {
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
