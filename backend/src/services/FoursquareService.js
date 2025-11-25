const https = require('https');

/**
 * FoursquareService - Fetches real hospitality places from Foursquare Places API
 * Free tier: 100k requests/day
 */

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const BASE_URL = 'https://api.foursquare.com/v3/places/search';

// Hospitality categories in Foursquare
const HOSPITALITY_CATEGORIES = [
  '19014', // Hotels & Lodging
  '19032', // Bed & Breakfast
  '19033', // Hostel
  '19034', // Hotel
  '19035', // Motel
  '19036', // Resort
  '19037', // Vacation Rental
];

/**
 * Search for hospitality places within bounds
 * @param {Object} bounds - { north, south, east, west }
 * @param {string} searchTerm - Optional search query
 * @returns {Promise<Array>} Array of normalized place objects
 */
async function searchPlaces(bounds, searchTerm = '') {
  if (!FOURSQUARE_API_KEY) {
    console.warn('FoursquareService: No API key configured, skipping external fetch');
    return [];
  }

  try {
    // Calculate center point and radius from bounds
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    
    // Rough radius calculation (in meters)
    const latDiff = Math.abs(bounds.north - bounds.south) * 111000; // 1 degree ≈ 111km
    const lngDiff = Math.abs(bounds.east - bounds.west) * 111000 * Math.cos(centerLat * Math.PI / 180);
    const radius = Math.min(Math.max(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) / 2, 1000), 50000); // 1km-50km

    const params = new URLSearchParams({
      ll: `${centerLat},${centerLng}`,
      radius: Math.round(radius),
      categories: HOSPITALITY_CATEGORIES.join(','),
      limit: 50,
    });

    if (searchTerm && searchTerm.trim()) {
      params.set('query', searchTerm.trim());
    }

    const url = `${BASE_URL}?${params.toString()}`;

    const results = await makeRequest(url);
    
    if (!results || !results.results || !Array.isArray(results.results)) {
      console.warn('FoursquareService: Invalid response format');
      return [];
    }

    // Normalize to our schema
    return results.results.map(normalizeFoursquarePlace).filter(Boolean);
  } catch (error) {
    console.error('FoursquareService: Failed to fetch places:', error.message);
    return [];
  }
}

/**
 * Make HTTPS request to Foursquare API
 * @param {string} url - Full API URL
 * @returns {Promise<Object>} Parsed JSON response
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Accept': 'application/json',
        'Authorization': FOURSQUARE_API_KEY,
      },
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON response'));
          }
        } else {
          reject(new Error(`API returned ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Normalize Foursquare place to our database schema
 * @param {Object} fsPlace - Foursquare place object
 * @returns {Object|null} Normalized place or null if invalid
 */
function normalizeFoursquarePlace(fsPlace) {
  try {
    if (!fsPlace.fsq_id || !fsPlace.geocodes?.main) {
      return null;
    }

    const { latitude, longitude } = fsPlace.geocodes.main;
    
    // Generate a unique ID combining source and fsq_id
    const id = `fs_${fsPlace.fsq_id}`;
    
    // Extract category (type)
    const category = fsPlace.categories?.[0];
    const type = category?.name || 'accommodation';
    
    // Extract location details
    const location = fsPlace.location || {};
    const address = location.address || '';
    const city = location.locality || location.region || '';
    const country = location.country || '';
    
    // Estimate price range based on category (can be enhanced later)
    const priceRange = estimatePriceRange(type);
    
    // Build description
    const description = buildDescription(fsPlace);
    
    // Extract or generate image URL (Foursquare doesn't always provide images in free tier)
    const imageUrl = generateImageUrl(type);
    
    return {
      id,
      name: fsPlace.name,
      type,
      address,
      city,
      country,
      latitude,
      longitude,
      rating: fsPlace.rating || null,
      price_range: priceRange,
      amenities: JSON.stringify(extractAmenities(fsPlace)),
      description,
      image_url: imageUrl,
      source: 'foursquare',
      external_id: fsPlace.fsq_id,
    };
  } catch (error) {
    console.error('FoursquareService: Failed to normalize place:', error);
    return null;
  }
}

/**
 * Estimate price range based on type/category
 * @param {string} type - Place type
 * @returns {string} Price range ($, $$, $$$, $$$$)
 */
function estimatePriceRange(type) {
  const lowercaseType = type.toLowerCase();
  
  if (lowercaseType.includes('hostel')) return '$';
  if (lowercaseType.includes('motel')) return '$$';
  if (lowercaseType.includes('resort') || lowercaseType.includes('luxury')) return '$$$$';
  if (lowercaseType.includes('hotel')) return '$$$';
  if (lowercaseType.includes('bed') || lowercaseType.includes('breakfast')) return '$$';
  
  return '$$'; // Default
}

/**
 * Build description from available Foursquare data
 * @param {Object} fsPlace - Foursquare place
 * @returns {string} Description text
 */
function buildDescription(fsPlace) {
  const parts = [];
  
  if (fsPlace.categories?.[0]?.name) {
    parts.push(fsPlace.categories[0].name);
  }
  
  if (fsPlace.location?.locality) {
    parts.push(`in ${fsPlace.location.locality}`);
  }
  
  if (fsPlace.distance) {
    parts.push(`${Math.round(fsPlace.distance)}m away`);
  }
  
  return parts.length > 0 
    ? parts.join(' ') + '.' 
    : 'Hospitality accommodation available for booking.';
}

/**
 * Extract amenities from Foursquare data
 * @param {Object} fsPlace - Foursquare place
 * @returns {Array<string>} Array of amenity names
 */
function extractAmenities(fsPlace) {
  const amenities = [];
  
  // Common hospitality amenities (we can enhance this based on Foursquare features data)
  if (fsPlace.categories?.some(c => c.name?.includes('Hotel'))) {
    amenities.push('Room Service', 'Reception');
  }
  
  if (fsPlace.categories?.some(c => c.name?.includes('Resort'))) {
    amenities.push('Pool', 'Spa', 'Restaurant');
  }
  
  // Default amenities for all hospitality
  amenities.push('WiFi');
  
  return amenities;
}

/**
 * Generate placeholder image URL based on type
 * @param {string} type - Place type
 * @returns {string} Image URL
 */
function generateImageUrl(type) {
  const lowercaseType = type.toLowerCase();
  
  // Map to Unsplash collection IDs for relevant images
  if (lowercaseType.includes('hotel')) {
    return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800';
  }
  if (lowercaseType.includes('hostel')) {
    return 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800';
  }
  if (lowercaseType.includes('resort')) {
    return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800';
  }
  if (lowercaseType.includes('bed') || lowercaseType.includes('breakfast')) {
    return 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800';
  }
  
  // Default hotel image
  return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800';
}

module.exports = {
  searchPlaces,
};
