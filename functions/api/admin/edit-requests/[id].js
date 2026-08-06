function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' },
  });
}

function isAuthorized(request, env) {
  const header = request.headers.get('x-admin-password') || '';
  return env.ADMIN_PASSWORD && header === env.ADMIN_PASSWORD;
}

export async function onRequestPost(context) {
  const { request, env, params } = context;

  if (!isAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const requestId = Number(params.id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return jsonResponse({ error: 'Invalid request id' }, 400);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const action = body.action;
  if (action !== 'approve' && action !== 'reject') {
    return jsonResponse({ error: "action must be 'approve' or 'reject'" }, 400);
  }

  try {
    const editRequest = await env.REPEATERS_DB.prepare(
      `SELECT id, repeater_id, name, public_key, region, location, operator_name, contact_info
       FROM edit_requests WHERE id = ? AND status = 'pending'`
    )
      .bind(requestId)
      .first();

    if (!editRequest) {
      return jsonResponse({ error: 'Edit request not found or already resolved' }, 404);
    }

    const resolveStmt = env.REPEATERS_DB.prepare(
      "UPDATE edit_requests SET status = 'resolved', resolved_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?"
    ).bind(requestId);

    if (action === 'approve') {
      const updateStmt = env.REPEATERS_DB.prepare(
        `UPDATE repeaters SET name = ?, public_key = ?, region = ?, location = ?, operator_name = ?, contact_info = ?
         WHERE id = ?`
      ).bind(
        editRequest.name,
        editRequest.public_key,
        editRequest.region,
        editRequest.location,
        editRequest.operator_name,
        editRequest.contact_info,
        editRequest.repeater_id
      );
      await env.REPEATERS_DB.batch([updateStmt, resolveStmt]);
    } else {
      await resolveStmt.run();
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    if (String(error.message || '').includes('UNIQUE')) {
      return jsonResponse(
        { error: 'Cannot apply: another repeater already uses that Repeater ID' },
        409
      );
    }
    console.error(error);
    return jsonResponse({ error: 'Failed to resolve edit request' }, 500);
  }
}
