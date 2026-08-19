const encoder = new TextEncoder();
const decoder = new TextDecoder();
const PASSWORD_ITERATIONS = 100000;
const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

const toBase64Url = bytes => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const fromBase64Url = value => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

const importHmacKey = secret => crypto.subtle.importKey(
  'raw',
  encoder.encode(secret),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify']
);

export const hashPassword = async password => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PASSWORD_ITERATIONS },
    key,
    256
  );
  return `pbkdf2:${PASSWORD_ITERATIONS}:${toBase64Url(salt)}:${toBase64Url(new Uint8Array(hash))}`;
};

export const verifyPassword = async (password, stored) => {
  const [algorithm, iterationsValue, saltValue, hashValue] = String(stored).split(':');
  if (algorithm !== 'pbkdf2' || !iterationsValue || !saltValue || !hashValue) return false;

  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const candidate = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromBase64Url(saltValue),
      iterations: Number(iterationsValue),
    },
    key,
    256
  );
  const expected = fromBase64Url(hashValue);
  return crypto.subtle.timingSafeEqual(new Uint8Array(candidate), expected);
};

export const createToken = async (user, secret) => {
  const header = toBase64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = toBase64Url(encoder.encode(JSON.stringify({
    userId: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
  })));
  const unsigned = `${header}.${payload}`;
  const signature = await crypto.subtle.sign('HMAC', await importHmacKey(secret), encoder.encode(unsigned));
  return `${unsigned}.${toBase64Url(new Uint8Array(signature))}`;
};

export const verifyRequestToken = async (request, secret) => {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;

  const unsigned = `${header}.${payload}`;
  const valid = await crypto.subtle.verify(
    'HMAC',
    await importHmacKey(secret),
    fromBase64Url(signature),
    encoder.encode(unsigned)
  );
  if (!valid) return null;

  try {
    const claims = JSON.parse(decoder.decode(fromBase64Url(payload)));
    return claims.exp > Math.floor(Date.now() / 1000) ? claims : null;
  } catch {
    return null;
  }
};
