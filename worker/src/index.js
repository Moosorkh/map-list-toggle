import { createToken, hashPassword, verifyPassword, verifyRequestToken } from './auth.js';
import { getPlace, searchPlaces, upsertPlace } from './places.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const json = (data, status = 200) => Response.json(data, {
  status,
  headers: CORS_HEADERS,
});

const parseJson = async request => {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > 1_000_000) {
    const error = new Error('Request body too large');
    error.status = 413;
    throw error;
  }
  try {
    return await request.json();
  } catch {
    const error = new Error('Invalid JSON body');
    error.status = 400;
    throw error;
  }
};

const requireUser = async (request, env) => {
  if (!env.JWT_SECRET) {
    const error = new Error('Authentication is not configured');
    error.status = 503;
    throw error;
  }
  const user = await verifyRequestToken(request, env.JWT_SECRET);
  if (!user) {
    const error = new Error('Invalid or expired token');
    error.status = 401;
    throw error;
  }
  return user;
};

const parsePlace = place => ({
  ...place,
  amenities: place.amenities ? JSON.parse(place.amenities) : [],
});

const handleRegister = async (request, env) => {
  const { email, password, name } = await parseJson(request);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) return json({ error: 'Email and password required' }, 400);

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(normalizedEmail).first();
  if (existing) return json({ error: 'Email already registered' }, 409);

  const passwordHash = await hashPassword(String(password));
  const result = await env.DB.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)')
    .bind(normalizedEmail, passwordHash, name || null).run();
  const user = { id: result.meta.last_row_id, email: normalizedEmail, name: name || null };
  return json({ token: await createToken(user, env.JWT_SECRET), user }, 201);
};

const handleLogin = async (request, env) => {
  const { email, password } = await parseJson(request);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) return json({ error: 'Email and password required' }, 400);

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(normalizedEmail).first();
  if (!user || !(await verifyPassword(String(password), user.password))) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  const publicUser = { id: user.id, email: user.email, name: user.name };
  return json({ token: await createToken(publicUser, env.JWT_SECRET), user: publicUser });
};

const handleCurrentUser = async (request, env) => {
  const claims = await requireUser(request, env);
  const user = await env.DB.prepare('SELECT id, email, name FROM users WHERE id = ?')
    .bind(claims.userId).first();
  return user ? json({ user }) : json({ error: 'User not found' }, 404);
};

const normalizeBooking = body => ({
  placeId: body.placeId || body.place?.id,
  placeName: body.placeName || body.place?.name,
  checkIn: body.checkIn,
  checkOut: body.checkOut,
  guests: Number(body.guests),
  totalPrice: Number.isFinite(Number(body.totalPrice ?? body.total))
    ? Number(body.totalPrice ?? body.total)
    : null,
});

const insertBooking = async (env, userId, body) => {
  const booking = normalizeBooking(body);
  if (!booking.placeId || !booking.placeName || !booking.checkIn || !booking.checkOut || booking.guests < 1) {
    const error = new Error('Missing required booking information');
    error.status = 400;
    throw error;
  }
  const result = await env.DB.prepare(`
    INSERT INTO bookings (user_id, place_id, place_name, check_in, check_out, guests, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId, String(booking.placeId), booking.placeName, booking.checkIn,
    booking.checkOut, booking.guests, booking.totalPrice
  ).run();
  return env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(result.meta.last_row_id).first();
};

const handleBookings = async (request, env, pathname) => {
  const user = await requireUser(request, env);
  if (request.method === 'GET' && pathname === '/me/bookings') {
    const result = await env.DB.prepare(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.userId).all();
    return json(result.results);
  }
  if (request.method === 'POST' && pathname === '/me/bookings') {
    return json(await insertBooking(env, user.userId, await parseJson(request)), 201);
  }
  if (request.method === 'POST' && pathname === '/bookings/sync') {
    const { bookings = [] } = await parseJson(request);
    for (const booking of bookings.slice(0, 100)) await insertBooking(env, user.userId, booking);
    return json({ message: 'Bookings synced' });
  }
  if (request.method === 'DELETE' && pathname === '/bookings/clear') {
    await env.DB.prepare('DELETE FROM bookings WHERE user_id = ?').bind(user.userId).run();
    return json({ message: 'Bookings cleared' });
  }
  const match = pathname.match(/^\/me\/bookings\/(\d+)$/);
  if (request.method === 'DELETE' && match) {
    const result = await env.DB.prepare('DELETE FROM bookings WHERE id = ? AND user_id = ?')
      .bind(Number(match[1]), user.userId).run();
    return result.meta.changes ? json({ message: 'Booking deleted' }) : json({ error: 'Booking not found' }, 404);
  }
  return null;
};

const saveProperty = async (env, userId, body) => {
  const place = body.place;
  const placeId = body.placeId || place?.id;
  if (!placeId) {
    const error = new Error('Place ID required');
    error.status = 400;
    throw error;
  }
  if (place) await upsertPlace(env.DB, place);
  const existing = await env.DB.prepare(
    'SELECT id FROM saved_properties WHERE user_id = ? AND place_id = ?'
  ).bind(userId, String(placeId)).first();
  if (!existing) {
    const cached = await env.DB.prepare('SELECT id FROM places WHERE id = ?').bind(String(placeId)).first();
    if (!cached) {
      const error = new Error('Place must be discovered before it can be saved');
      error.status = 400;
      throw error;
    }
    await env.DB.prepare('INSERT INTO saved_properties (user_id, place_id) VALUES (?, ?)')
      .bind(userId, String(placeId)).run();
  }
};

const handleSaved = async (request, env, pathname) => {
  const user = await requireUser(request, env);
  if (request.method === 'GET' && pathname === '/me/saved') {
    const result = await env.DB.prepare(`
      SELECT p.*, sp.created_at AS saved_at
      FROM saved_properties sp
      JOIN places p ON sp.place_id = p.id
      WHERE sp.user_id = ?
      ORDER BY sp.created_at DESC
    `).bind(user.userId).all();
    return json(result.results.map(parsePlace));
  }
  if (request.method === 'POST' && pathname === '/me/saved') {
    const body = await parseJson(request);
    const placeId = body.placeId || body.place?.id;
    const existing = placeId ? await env.DB.prepare(
      'SELECT id FROM saved_properties WHERE user_id = ? AND place_id = ?'
    ).bind(user.userId, String(placeId)).first() : null;
    if (existing) {
      await env.DB.prepare('DELETE FROM saved_properties WHERE id = ?').bind(existing.id).run();
      return json({ message: 'Property removed from saved', saved: false });
    }
    await saveProperty(env, user.userId, body);
    return json({ message: 'Property saved', saved: true });
  }
  if (request.method === 'POST' && pathname === '/saved/sync') {
    const { properties = [] } = await parseJson(request);
    for (const place of properties.slice(0, 100)) {
      await saveProperty(env, user.userId, { placeId: place.id, place });
    }
    return json({ message: 'Saved properties synced' });
  }
  if (request.method === 'DELETE' && pathname === '/saved/clear') {
    await env.DB.prepare('DELETE FROM saved_properties WHERE user_id = ?').bind(user.userId).run();
    return json({ message: 'Saved properties cleared' });
  }
  const match = pathname.match(/^\/me\/saved\/(.+)$/);
  if (request.method === 'DELETE' && match) {
    const placeId = decodeURIComponent(match[1]);
    const result = await env.DB.prepare('DELETE FROM saved_properties WHERE user_id = ? AND place_id = ?')
      .bind(user.userId, placeId).run();
    return result.meta.changes ? json({ message: 'Property removed from saved' }) : json({ error: 'Saved property not found' }, 404);
  }
  return null;
};

const route = async (request, env) => {
  const { pathname } = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method === 'GET' && pathname === '/health') {
    return json({ status: 'ok', timestamp: new Date().toISOString() });
  }
  if (request.method === 'POST' && pathname === '/auth/register') return handleRegister(request, env);
  if (request.method === 'POST' && pathname === '/auth/login') return handleLogin(request, env);
  if (request.method === 'GET' && pathname === '/auth/me') return handleCurrentUser(request, env);
  if (request.method === 'POST' && pathname === '/places/search') {
    const { bounds, searchTerm } = await parseJson(request);
    return json(await searchPlaces(env.DB, bounds, searchTerm));
  }
  const placeMatch = pathname.match(/^\/places\/(.+)$/);
  if (request.method === 'GET' && placeMatch) {
    const place = await getPlace(env.DB, decodeURIComponent(placeMatch[1]));
    return place ? json(place) : json({ error: 'Place not found' }, 404);
  }
  if (pathname.startsWith('/me/bookings') || pathname.startsWith('/bookings/')) {
    return (await handleBookings(request, env, pathname)) || json({ error: 'Not found' }, 404);
  }
  if (pathname.startsWith('/me/saved') || pathname.startsWith('/saved/')) {
    return (await handleSaved(request, env, pathname)) || json({ error: 'Not found' }, 404);
  }
  return json({ error: 'Not found' }, 404);
};

export default {
  async fetch(request, env) {
    try {
      console.log(JSON.stringify({ method: request.method, path: new URL(request.url).pathname }));
      return await route(request, env);
    } catch (error) {
      console.error(JSON.stringify({
        message: 'request failed',
        error: error instanceof Error ? error.message : String(error),
        path: new URL(request.url).pathname,
      }));
      return json({ error: error instanceof Error ? error.message : 'Internal server error' }, error.status || 500);
    }
  },
};
