// /partials/* are build-time fragments read by other Functions through
// env.ASSETS (which skips this route), not pages anyone should land on.
export function onRequest() {
  return new Response('Not found', { status: 404 });
}
