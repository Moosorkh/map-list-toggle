const https = require('https');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const PREMIUM_PATTERN = /luxury|ritz(?:-carlton)?|four seasons|waldorf astoria|mandarin oriental|st.? regis|park hyatt|intercontinental|fairmont|peninsula|rosewood|aman|belmond|westin|alila|kimpton|conrad|edition|jw marriott|viceroy|montage|auberge|langham|sofitel|loews|noble house|lxr/i;
const RESORT_AMENITY_PATTERN = /resort.*(?:spa|beach|golf|casino|ocean|waterfront)|(?:spa|beach|golf|casino|ocean|waterfront).*resort/i;
const NON_HOTEL_PATTERN = /resort style/i;

async function searchPlaces(bounds, searchTerm = '') {
  try {
    const query = buildQuery(bounds);
    const response = await makeRequest(query);
    const elements = Array.isArray(response.elements) ? response.elements : [];
    const normalized = elements.map(normalizePlace).filter(Boolean);
    const term = searchTerm.trim().toLowerCase();

    return normalized
      .filter(place => !term || `${place.name} ${place.type} ${place.city}`.toLowerCase().includes(term))
      .slice(0, 50);
  } catch (error) {
    console.error('OpenStreetMapService: Failed to fetch places:', error.message);
    return [];
  }
}

function buildQuery(bounds) {
  const boxes = Number(bounds.west) <= Number(bounds.east)
    ? [[bounds.south, bounds.west, bounds.north, bounds.east]]
    : [
        [bounds.south, bounds.west, bounds.north, 180],
        [bounds.south, -180, bounds.north, bounds.east],
      ];
  const selectors = boxes.flatMap(box => {
    const bbox = box.join(',');
    return [
      `nwr["tourism"="hotel"](${bbox});`,
      `nwr["tourism"="resort"](${bbox});`,
    ];
  }).join('');

  return `[out:json][timeout:25];(${selectors});out center tags;`;
}

function makeRequest(query) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({ data: query }).toString();
    const request = https.request(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'HospitalityFinder/1.0',
      },
    }, response => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(new Error(`Overpass API returned ${response.statusCode}`));
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Failed to parse Overpass response'));
        }
      });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => request.destroy(new Error('Overpass request timed out')));
    request.write(body);
    request.end();
  });
}

function normalizePlace(element) {
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
  const address = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const amenities = ['WiFi'];
  if (tags.swimming_pool === 'yes') amenities.push('Pool');
  if (tags.spa === 'yes' || /spa/i.test(identity)) amenities.push('Spa');
  if (tags.restaurant === 'yes') amenities.push('Restaurant');

  return {
    id: `osm_${element.type}_${element.id}`,
    name,
    type: isResort ? 'resort' : 'hotel',
    address,
    city,
    country: tags['addr:country'] || '',
    latitude,
    longitude,
    rating: Number.isFinite(stars) ? stars : null,
    price_range: '$$$$',
    amenities: JSON.stringify(amenities),
    description: `${Number.isFinite(stars) ? `${stars}-star ` : ''}${isResort ? 'luxury resort' : 'luxury hotel'}${city ? ` in ${city}` : ''}.`,
    image_url: '',
    source: 'openstreetmap',
    external_id: `${element.type}/${element.id}`,
  };
}

module.exports = {
  searchPlaces,
};
