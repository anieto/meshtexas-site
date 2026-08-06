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
         er.id AS request_id,
         er.note,
         er.requested_at,
         er.name AS new_name,
         er.public_key AS new_public_key,
         er.region AS new_region,
         er.location AS new_location,
         er.operator_name AS new_operator_name,
         er.contact_info AS new_contact_info,
         r.id AS repeater_id,
         r.name AS current_name,
         r.public_key AS current_public_key,
         r.region AS current_region,
         r.location AS current_location,
         r.operator_name AS current_operator_name,
         r.contact_info AS current_contact_info
       FROM edit_requests er
       JOIN repeaters r ON r.id = er.repeater_id
       WHERE er.status = 'pending'
       ORDER BY er.requested_at ASC`
    ).all();
    return jsonResponse(results, 200);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to load edit requests' }, 500);
  }
}
