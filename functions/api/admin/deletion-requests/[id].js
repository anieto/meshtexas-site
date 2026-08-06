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

export async function onRequestPost(context) {
  const { request, env, params } = context;

  if (!isAuthorized(request)) {
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
  if (action !== 'delete' && action !== 'dismiss') {
    return jsonResponse({ error: "action must be 'delete' or 'dismiss'" }, 400);
  }

  try {
    const deletionRequest = await env.REPEATERS_DB.prepare(
      "SELECT id, repeater_id FROM deletion_requests WHERE id = ? AND status = 'pending'"
    )
      .bind(requestId)
      .first();

    if (!deletionRequest) {
      return jsonResponse({ error: 'Deletion request not found or already resolved' }, 404);
    }

    const resolvedBy = request.headers.get('Cf-Access-Authenticated-User-Email') || null;
    const resolveStmt = env.REPEATERS_DB.prepare(
      "UPDATE deletion_requests SET status = 'resolved', resolved_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), resolved_by = ? WHERE id = ?"
    ).bind(resolvedBy, requestId);

    if (action === 'delete') {
      const deleteStmt = env.REPEATERS_DB.prepare('DELETE FROM repeaters WHERE id = ?').bind(
        deletionRequest.repeater_id
      );
      await env.REPEATERS_DB.batch([deleteStmt, resolveStmt]);
    } else {
      await resolveStmt.run();
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Failed to resolve deletion request' }, 500);
  }
}
