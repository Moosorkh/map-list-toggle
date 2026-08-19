const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const PREMIUM_PATTERN = /luxury|ritz(?:-carlton)?|four seasons|waldorf astoria|mandarin oriental|st.? regis|park hyatt|intercontinental|fairmont|peninsula|rosewood|aman|belmond|westin|alila|kimpton|conrad|edition|jw marriott|viceroy|montage|auberge|langham|sofitel|loews|noble house|lxr/i;
const RESORT_AMENITY_PATTERN = /resort.*(?:spa|beach|golf|casino|ocean|waterfront)|(?:spa|beach|golf|casino|ocean|waterfront).*resort/i;
const NON_HOTEL_PATTERN = /resort style/i;
const OVERPASS_TIMEOUT_MS = 9000;
const EMPTY_CACHE_TTL_SECONDS = 300;

const isLuxuryPlace = place => {
  const type = String(place.type || '').toLowerCase();
  if (!type.includes('hotel') && !type.includes('resort')) return false;
  if (String(place.id).startsWith('osm_')) {
    return !NON_HOTEL_PATTERN.test(place.name || '') && (
      Number(place.rating) >= 4
      || PREMIUM_PATTERN.test(place.name || '')
      || RESORT_AMENITY_PATTERN.test(place.name || '')
    );
  }
  return String(place.price_range || '').length >= 3
    || Number(place.rating) >= 4.5
    || PREMIUM_PATTERN.test(place.name || '');
};

const parseAmenities = place => ({
  ...place,
  amenities: place.amenities ? JSON.parse(place.amenities) : [],
});

const buildOverpassQuery = bounds => {
  const boxes = Number(bounds.west) <= Number(bounds.east)
    ? [[bounds.south, bounds.west, bounds.north, bounds.east]]
    : [
        [bounds.south, bounds.west, bounds.north, 180],
        [bounds.south, -180, bounds.north, bounds.east],
      ];
  const selectors = boxes.flatMap(box => {
    const bbox = box.join(',');
    return [`nwr["tourism"="hotel"](${bbox});`, `nwr["tourism"="resort"](${bbox});`];
  }).join('');
  return `[out:json][timeout:25];(${selectors});out center tags;`;
};

const normalizePlace = element => {
  const tags = element.tags || {};
  const name = tags.name || tags.brand || tags.operator;
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  const stars = Number.parseFloat(tags.stars);
  const identity = [name, tags.brand, tags.operator].filter(Boolean).join(' ');

  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (NON_HOTEL_PATTERN.test(identity)
    || !(stars >= 4 || PREMIUM_PATTERN.test(identity) || RESORT_AMENITY_PATTERN.test(identity))) return null;

  const isResort = tags.tourism === 'resort' || /resort/i.test(identity);
  const city = tags['addr:city'] || tags['addr:suburb'] || tags['addr:place'] || '';
  const amenities = ['WiFi'];
  if (tags.swimming_pool === 'yes') amenities.push('Pool');
  if (tags.spa === 'yes' || /spa/i.test(identity)) amenities.push('Spa');
  if (tags.restaurant === 'yes') amenities.push('Restaurant');

  return {
    id: `osm_${element.type}_${element.id}`,
    name,
    type: isResort ? 'resort' : 'hotel',
    address: [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    city,
    country: tags['addr:country'] || '',
    latitude,
    longitude,
    rating: Number.isFinite(stars) ? stars : null,
    price_range: '$$$$',
    amenities: JSON.stringify(amenities),
    description: `${Number.isFinite(stars) ? `${stars}-star ` : ''}${isResort ? 'luxury resort' : 'luxury hotel'}${city ? ` in ${city}` : ''}.`,
    image_url: '',
  };
};

const fetchOpenStreetMapPlaces = async (bounds, searchTerm) => {
  const body = new URLSearchParams({ data: buildOverpassQuery(bounds) });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
  let data;

  try {
    data = await Promise.any(OVERPASS_URLS.map(async url => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'HospitalityFinder/1.0',
        },
        body,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }));
  } catch (error) {
    const failures = error instanceof AggregateError
      ? error.errors.map((failure, index) => `${new URL(OVERPASS_URLS[index]).host}: ${failure.message}`)
      : [error.message];
    throw new Error(`Overpass providers unavailable (${failures.join(', ')})`);
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }

  const term = String(searchTerm || '').trim().toLowerCase();
  return (Array.isArray(data.elements) ? data.elements : [])
    .map(normalizePlace)
    .filter(Boolean)
    .filter(place => !term || `${place.name} ${place.type} ${place.city}`.toLowerCase().includes(term))
    .slice(0, 50);
};

const getSearchCacheKey = (bounds, searchTerm) => [
  ...['north', 'south', 'east', 'west'].map(key => Number(bounds[key]).toFixed(3)),
  String(searchTerm || '').trim().toLowerCase(),
].join(':');

const hasFreshEmptyCache = async (db, cacheKey) => {
  const cached = await db.prepare(`
    SELECT 1 FROM place_search_cache
    WHERE cache_key = ? AND expires_at > unixepoch()
  `).bind(cacheKey).first();
  return Boolean(cached);
};

const cacheEmptySearch = async (db, cacheKey) => {
  await db.prepare(`
    INSERT INTO place_search_cache (cache_key, expires_at)
    VALUES (?, unixepoch() + ?)
    ON CONFLICT(cache_key) DO UPDATE SET expires_at = excluded.expires_at
  `).bind(cacheKey, EMPTY_CACHE_TTL_SECONDS).run();
};

const buildCacheQuery = (bounds, searchTerm) => {
  const wrapsLongitude = Number(bounds.west) > Number(bounds.east);
  let sql = `
    SELECT * FROM places
    WHERE latitude BETWEEN ? AND ?
      AND ${wrapsLongitude ? '(longitude >= ? OR longitude <= ?)' : 'longitude BETWEEN ? AND ?'}
      AND (LOWER(type) LIKE '%hotel%' OR LOWER(type) LIKE '%resort%')
  `;
  const params = [Number(bounds.south), Number(bounds.north), Number(bounds.west), Number(bounds.east)];
  if (String(searchTerm || '').trim()) {
    sql += ' AND (name LIKE ? OR type LIKE ? OR city LIKE ?)';
    const pattern = `%${String(searchTerm).trim()}%`;
    params.push(pattern, pattern, pattern);
  }
  return { sql: `${sql} LIMIT 100`, params };
};

const queryCachedPlaces = async (db, bounds, searchTerm) => {
  const { sql, params } = buildCacheQuery(bounds, searchTerm);
  const result = await db.prepare(sql).bind(...params).all();
  return result.results.filter(isLuxuryPlace);
};

const cachePlaces = async (db, places) => {
  if (!places.length) return;
  const sql = `
    INSERT INTO places (
      id, name, type, address, city, country, latitude, longitude,
      rating, price_range, amenities, description, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, type = excluded.type, address = excluded.address,
      city = excluded.city, country = excluded.country, latitude = excluded.latitude,
      longitude = excluded.longitude, rating = excluded.rating,
      price_range = excluded.price_range, amenities = excluded.amenities,
      description = excluded.description, image_url = excluded.image_url
  `;
  await db.batch(places.map(place => db.prepare(sql).bind(
    place.id, place.name, place.type, place.address, place.city, place.country,
    place.latitude, place.longitude, place.rating, place.price_range,
    place.amenities, place.description, place.image_url
  )));
};

export const searchPlaces = async (db, bounds, searchTerm = '') => {
  const valid = bounds && ['north', 'south', 'east', 'west']
    .every(key => Number.isFinite(Number(bounds[key])));
  if (!valid || Number(bounds.south) > Number(bounds.north)) {
    const error = new Error('Invalid bounds');
    error.status = 400;
    throw error;
  }

  let places = await queryCachedPlaces(db, bounds, searchTerm);
  const cacheKey = getSearchCacheKey(bounds, searchTerm);
  if (places.length < 5 && !(await hasFreshEmptyCache(db, cacheKey))) {
    try {
      const discovered = await fetchOpenStreetMapPlaces(bounds, searchTerm);
      await cachePlaces(db, discovered);
      if (!discovered.length) await cacheEmptySearch(db, cacheKey);
      places = await queryCachedPlaces(db, bounds, searchTerm);
    } catch (error) {
      console.error(JSON.stringify({ message: 'place providers unavailable', error: error.message }));
    }
  }
  return places.map(parseAmenities);
};

export const getPlace = async (db, id) => {
  const place = await db.prepare('SELECT * FROM places WHERE id = ?').bind(id).first();
  return place ? parseAmenities(place) : null;
};

export const upsertPlace = async (db, place) => {
  if (!place?.id || !place?.name) return;
  const amenities = Array.isArray(place.amenities) ? JSON.stringify(place.amenities) : (place.amenities || '[]');
  await db.prepare(`
    INSERT INTO places (
      id, name, type, address, city, country, latitude, longitude,
      rating, price_range, amenities, description, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, amenities = excluded.amenities
  `).bind(
    String(place.id), place.name, place.type || 'hotel', place.address || '', place.city || '',
    place.country || '', Number(place.latitude) || 0, Number(place.longitude) || 0,
    Number.isFinite(Number(place.rating)) ? Number(place.rating) : null,
    place.price_range || '', amenities, place.description || '', place.imageUrl || place.image_url || ''
  ).run();
};
