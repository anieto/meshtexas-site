// Verifies a Cloudflare Access identity for a request, independent of
// whether Cf-Access-Authenticated-User-Email happens to be forwarded by
// the platform (observed to be unreliable for Pages Functions). Reads the
// JWT directly (header if present, else the CF_Authorization cookie set
// by Access in the browser) and verifies its signature against Access's
// own published JWKS before trusting anything in it.

let jwksCache = null;
let jwksCacheTeamHost = null;

function base64UrlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlToString(str) {
  return new TextDecoder().decode(base64UrlToBytes(str));
}

function extractJwt(request) {
  const headerJwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (headerJwt) return headerJwt;
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
}

async function getJwks(teamHost) {
  if (jwksCache && jwksCacheTeamHost === teamHost) return jwksCache;
  const res = await fetch(`https://${teamHost}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('Failed to fetch Access certs');
  const data = await res.json();
  jwksCache = data.keys;
  jwksCacheTeamHost = teamHost;
  return jwksCache;
}

// Returns the verified email string, or null if there's no valid,
// signed, unexpired Access identity on this request.
export async function getAccessEmail(request, env) {
  try {
    const jwt = extractJwt(request);
    if (!jwt) return null;

    const parts = jwt.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(base64UrlToString(parts[0]));
    const payload = JSON.parse(base64UrlToString(parts[1]));

    if (!payload.email || !payload.iss) return null;
    if (typeof payload.exp === 'number' && Date.now() / 1000 > payload.exp) return null;
    if (typeof payload.nbf === 'number' && Date.now() / 1000 < payload.nbf) return null;

    if (env && env.ACCESS_AUD) {
      const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!aud.includes(env.ACCESS_AUD)) return null;
    }

    const teamHost = new URL(payload.iss).hostname;
    const jwks = await getJwks(teamHost);
    const jwk = jwks.find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signature = base64UrlToBytes(parts[2]);
    const signedData = new TextEncoder().encode(parts[0] + '.' + parts[1]);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signedData);

    return valid ? payload.email : null;
  } catch (error) {
    console.error('Access JWT verification failed:', error);
    return null;
  }
}
