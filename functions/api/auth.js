export async function onRequest(context) {
  const { request, env } = context;
  const client_id = env.GITHUB_CLIENT_ID;

  try {
    const url = new URL(request.url);
    const redirectUrl = new URL('https://github.com/login/oauth/authorize');
    redirectUrl.searchParams.set('client_id', client_id);
    redirectUrl.searchParams.set('redirect_uri', url.origin + '/api/callback');
    // public_repo, not repo — the repo is public, and Open Authoring
    // contributors shouldn't be asked to grant broader private-repo access
    // than the flow actually needs.
    redirectUrl.searchParams.set('scope', 'public_repo');
    redirectUrl.searchParams.set(
      'state',
      crypto.getRandomValues(new Uint8Array(12)).join('')
    );
    return Response.redirect(redirectUrl.href, 302);
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
}
