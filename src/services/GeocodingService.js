import { getRandomImage, ALL_CITIES } from '../config/constants';

// This service handles reverse geocoding (converting coordinates to place names)
// and fetching place information from external APIs

// Store discovery history to avoid repetition
const discoveryHistory = {
  locations: new Map(), // Map of location key -> array of place IDs
  getKey: (lat, lng) => `${Math.round(lat * 10) / 10},${Math.round(lng * 10) / 10}` // Round to 0.1 degree precision
};

// Improved UUID generator for unique IDs - with multiple guarantees of uniqueness
const generateUUID = () => {
  // Use timestamp as part of the ID for time-based uniqueness
  const timestamp = new Date().getTime().toString(36);

  // Add multiple random components
  const randomPart1 = Math.random().toString(36).substring(2, 10);
  const randomPart2 = Math.random().toString(36).substring(2, 10);

  // Add a counter to ensure absolute uniqueness even when generated in the same millisecond
  generateUUID.counter = (generateUUID.counter || 0) + 1;
  const counter = generateUUID.counter.toString(36);

  // Add coordinates if available to reduce chance of duplication in same area
  const coordPart = generateUUID.lastCoords
    ? `_${Math.abs(generateUUID.lastCoords[0] * 100).toFixed(0)}_${Math.abs(generateUUID.lastCoords[1] * 100).toFixed(0)}`
    : '';

  return `id_${timestamp}${coordPart}_${randomPart1}_${counter}_${randomPart2}`;
};

// Function to check if a point is on land (California coastal check)
const isOnLand = (lat, lng) => {
  // Simple check for the Pacific Ocean west of California
  const OCEAN_LONGITUDE = -124.0; // Approximate westernmost point of California mainland

  // Check if we're significantly in the ocean (west of coastal line)
  if (lng < OCEAN_LONGITUDE) {
    return false;
  }

  // California bounding box (rough)
  if (lat < 32.5 || lat > 42.0 || lng < -124.6 || lng > -114.0) {
    // Outside California
    return false;
  }

  return true;
};

// Get random luxury place name
const getLuxuryPlaceName = () => {
  const prefixes = [
    'Grand', 'Luxury', 'Royal', 'Elite', 'Premium', 'Exclusive', 'Prestige',
    'Imperial', 'Sovereign', 'Majestic', 'Opulent', 'Deluxe'
  ];

  const names = [
    'Resort', 'Suites', 'Plaza', 'Retreat', 'Residences', 'Villas', 'Estate',
    'Palace', 'Lodge', 'Mansion', 'Château', 'Manor', 'Heights', 'Towers'
  ];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const name = names[Math.floor(Math.random() * names.length)];

  return `${prefix} ${name}`;
};

// Get luxury description
const getLuxuryDescription = () => {
  const features = [
    'Private pool', 'Ocean view', 'Mountain vista', 'Garden terrace',
    'Penthouse suite', 'Private beach access', 'Panoramic views',
    'Beachfront location', 'Lake view', 'Private garden'
  ];

  const amenities = [
    'spa', 'butler service', 'private chef', 'helipad', 'yacht access',
    'wine cellar', 'chauffeur service', 'infinity pool', 'tennis court',
    'golf course access', 'Michelin-star restaurant'
  ];

  const feature = features[Math.floor(Math.random() * features.length)];
  const amenity = amenities[Math.floor(Math.random() * amenities.length)];

  return `Luxury accommodation with ${feature} and ${amenity}`;
};

// Get random luxury price
const getLuxuryPrice = () => {
  // Luxury places start at $1000, max out at $20000
  return Math.floor(Math.random() * 19000) + 1000;
};

// Find city nearest to a point
const findNearestCity = (lat, lng) => {
  let nearestCity = ALL_CITIES[0];
  let minDistance = Number.MAX_VALUE;

  for (const city of ALL_CITIES) {
    const distance = Math.sqrt(
      Math.pow(city.lat - lat, 2) +
      Math.pow(city.lng - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
};

// Generate random point near a location
const getRandomPointNear = (centerLat, centerLng, maxDistanceKm = 5) => {
  // Convert km to degrees (approximate)
  const kmToDegree = 0.01; // ~1km at equator
  const maxDegrees = maxDistanceKm * kmToDegree;

  // Generate random offset within maxDistance
  const latOffset = (Math.random() * 2 - 1) * maxDegrees;
  const lngOffset = (Math.random() * 2 - 1) * maxDegrees;

  return {
    lat: centerLat + latOffset,
    lng: centerLng + lngOffset
  };
};

// Utility: random property type
const getRandomPropertyType = () => {
  const types = ['Luxury Estate', 'Villa', 'Penthouse', 'Mansion', 'Boutique Hotel', 'Chalet'];
  return types[Math.floor(Math.random() * types.length)];
};

// Utility: random amenities list (3-6 unique)
const getRandomAmenities = () => {
  const all = ['Pool', 'Parking', 'WiFi', 'Air Conditioning', 'Kitchen', 'Washer', 'Spa', 'Gym', 'Ocean View', 'Fireplace'];
  const shuffled = all.sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * 4) + 3; // 3..6
  return shuffled.slice(0, count);
};

// Create a unique luxury place
const createLuxuryPlace = (placeName, latitude, longitude, cityName = null) => {
  // Store coordinates for UUID generator to use
  generateUUID.lastCoords = [latitude, longitude];

  const id = generateUUID(); // Using UUID to ensure uniqueness
  const description = getLuxuryDescription();
  const price = getLuxuryPrice();

  let name = placeName;
  if (cityName) {
    name = `${placeName} ${cityName}`;
  }

  // Derived details so UI isn't hardcoded
  const rating = Number((4.6 + Math.random() * 0.4).toFixed(1)); // 4.6 - 5.0
  const reviewCount = Math.floor(Math.random() * 350) + 50; // 50 - 400
  const propertyType = getRandomPropertyType();
  const amenities = getRandomAmenities();

  return {
    id,
    name,
    latitude,
    longitude,
    description,
    price,
    imageUrl: getRandomImage(), // Use random luxury property image
    isDiscovered: true,
    rating,
    reviewCount,
    propertyType,
    amenities
  };
};

const GeocodingService = {
  // Reverse geocode a location (lat/lng to place details)
  reverseGeocode: async (lat, lng) => {
    // Skip if in ocean
    if (!isOnLand(lat, lng)) {
      return { display_name: 'California Coast' };
    }

    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
        {
          headers: {
            'Accept-Language': 'en-US,en',
            'User-Agent': 'PlaceExplorer/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Find nearest city as fallback
      const nearestCity = findNearestCity(lat, lng);
      return {
        display_name: nearestCity.name,
        address: { city: nearestCity.name }
      };
    }
  },

  // Discover places within a bounding box - COMPLETELY REVISED
  discoverPlacesInArea: async (bounds, forceDiscover = false) => {
    // Calculate center of bounds
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;

    // Skip if in ocean
    if (!isOnLand(centerLat, centerLng)) {
      return [];
    }

    // Check if we've already discovered in this area
    const locationKey = discoveryHistory.getKey(centerLat, centerLng);

    if (!forceDiscover && discoveryHistory.locations.has(locationKey)) {
      return []; // Already discovered here, unless forced
    }

    try {
      // Find cities within bounds
      const citiesInBounds = ALL_CITIES.filter(city =>
        city.lat >= bounds.south &&
        city.lat <= bounds.north &&
        city.lng >= bounds.west &&
        city.lng <= bounds.east
      );

      let placesToUse = [];

      if (citiesInBounds.length > 0) {
        // Use cities in bounds (max 3)
        const citiesToUse = citiesInBounds.slice(0, 3);

        for (const city of citiesToUse) {
          // Create 1-2 places per city
          const numPlaces = Math.floor(Math.random() * 2) + 1;
          for (let i = 0; i < numPlaces; i++) {
            const point = getRandomPointNear(city.lat, city.lng);
            const placeName = getLuxuryPlaceName();
            placesToUse.push(createLuxuryPlace(placeName, point.lat, point.lng, city.name));
          }
        }
      } else {
        // No cities in bounds, find nearest city
        const nearestCity = findNearestCity(centerLat, centerLng);

        // Create 3-5 places near this city
        const numPlaces = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < numPlaces; i++) {
          const point = getRandomPointNear(nearestCity.lat, nearestCity.lng);
          const placeName = getLuxuryPlaceName();
          placesToUse.push(createLuxuryPlace(placeName, point.lat, point.lng, nearestCity.name));
        }
      }

      // Ensure all place IDs are unique
      const uniqueIds = new Set();
      placesToUse = placesToUse.map(place => {
        // If ID is already in use, generate a new one
        if (uniqueIds.has(place.id)) {
          const newId = generateUUID();
          return { ...place, id: newId };
        }
        uniqueIds.add(place.id);
        return place;
      });

      // Record this discovery to prevent duplicates
      discoveryHistory.locations.set(locationKey, placesToUse.map(p => p.id));

      // Sort by price (highest first) and limit to 5 places max
      return placesToUse
        .sort((a, b) => b.price - a.price)
        .slice(0, 5);
    } catch (error) {
      return [];
    }
  },

  // Generate places near a center point
  discoverPlacesForArea: (center, count = 5) => {
    const centerLat = center[0];
    const centerLng = center[1];

    // Skip if in ocean
    if (!isOnLand(centerLat, centerLng)) {
      return [];
    }

    // Check if we've already discovered in this area
    const locationKey = discoveryHistory.getKey(centerLat, centerLng);

    if (discoveryHistory.locations.has(locationKey)) {
      return []; // Already discovered here
    }

    const nearestCity = findNearestCity(centerLat, centerLng);
    const places = [];

    // Create count places near the city
    for (let i = 0; i < count; i++) {
      const point = getRandomPointNear(nearestCity.lat, nearestCity.lng);
      const placeName = getLuxuryPlaceName();
      places.push(createLuxuryPlace(placeName, point.lat, point.lng, nearestCity.name));
    }

    // Ensure all IDs are unique
    const uniqueIds = new Set();
    const uniquePlaces = places.map(place => {
      if (uniqueIds.has(place.id)) {
        return { ...place, id: generateUUID() };
      }
      uniqueIds.add(place.id);
      return place;
    });

    // Record this discovery
    discoveryHistory.locations.set(locationKey, uniquePlaces.map(p => p.id));

    return uniquePlaces;
  }
};

export default GeocodingService;