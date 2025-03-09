import PlaceImage from '../public/assets/Place-image.jpg';

// This service handles reverse geocoding (converting coordinates to place names)
// and fetching place information from external APIs

// Random luxury property images
const LUXURY_IMAGES = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1605146769289-440113cc3d00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1567428485548-c499e49c5e71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600047509782-20d39509f26d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1571055107559-3e67626fa8be?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
];

// Get a random image URL
const getRandomImage = () => {
  return LUXURY_IMAGES[Math.floor(Math.random() * LUXURY_IMAGES.length)];
};

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

// Define coastal cities in California for generating locations
const COASTAL_CITIES = [
  { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "San Diego", lat: 32.7157, lng: -117.1611 },
  { name: "Santa Barbara", lat: 34.4208, lng: -119.6982 },
  { name: "Monterey", lat: 36.6002, lng: -121.8947 },
  { name: "Santa Cruz", lat: 36.9741, lng: -122.0308 },
  { name: "Malibu", lat: 34.0259, lng: -118.7798 },
  { name: "Newport Beach", lat: 33.6189, lng: -117.9298 },
  { name: "Laguna Beach", lat: 33.5427, lng: -117.7854 },
  { name: "Carlsbad", lat: 33.1581, lng: -117.3506 },
  { name: "La Jolla", lat: 32.8328, lng: -117.2713 },
  { name: "Carmel", lat: 36.5552, lng: -121.9233 },
  { name: "Half Moon Bay", lat: 37.4636, lng: -122.4286 },
  { name: "Huntington Beach", lat: 33.6595, lng: -117.9988 },
  { name: "Long Beach", lat: 33.7701, lng: -118.1937 },
  { name: "Santa Monica", lat: 34.0195, lng: -118.4912 },
  { name: "Oxnard", lat: 34.1975, lng: -119.1771 },
  { name: "Ventura", lat: 34.2746, lng: -119.2290 },
  { name: "Dana Point", lat: 33.4672, lng: -117.6981 },
  { name: "Redondo Beach", lat: 33.8492, lng: -118.3886 }
];

// Define inland luxury destinations
const INLAND_CITIES = [
  { name: "Palm Springs", lat: 33.8303, lng: -116.5453 },
  { name: "Napa", lat: 38.2975, lng: -122.2869 },
  { name: "Sonoma", lat: 38.2919, lng: -122.4580 },
  { name: "Lake Tahoe", lat: 39.0968, lng: -120.0324 },
  { name: "Big Bear Lake", lat: 34.2439, lng: -116.9114 },
  { name: "Ojai", lat: 34.4480, lng: -119.2429 },
  { name: "Temecula", lat: 33.4936, lng: -117.1484 },
  { name: "Yosemite", lat: 37.8651, lng: -119.5383 },
  { name: "Paso Robles", lat: 35.6368, lng: -120.6545 },
  { name: "Calistoga", lat: 38.5787, lng: -122.5797 }
];

// All cities combined for convenience
const ALL_CITIES = [...COASTAL_CITIES, ...INLAND_CITIES];

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
  
  return {
    id,
    name,
    latitude,
    longitude,
    description,
    price,
    imageUrl: getRandomImage(), // Use random luxury property image
    isDiscovered: true
  };
};

const GeocodingService = {
  // Reverse geocode a location (lat/lng to place details)
  reverseGeocode: async (lat, lng) => {
    // Skip if in ocean
    if (!isOnLand(lat, lng)) {
      console.log(`Coordinates (${lat}, ${lng}) are in ocean or outside California`);
      return { display_name: 'California Coast' };
    }
    
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      console.log(`Reverse geocoding (${lat}, ${lng})`);
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
      console.error('Reverse geocoding failed:', error);
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
      console.log(`Center (${centerLat}, ${centerLng}) is in ocean or outside California`);
      return [];
    }
    
    // Check if we've already discovered in this area
    const locationKey = discoveryHistory.getKey(centerLat, centerLng);
    console.log(`Checking for discoveries at key ${locationKey}`);
    
    if (!forceDiscover && discoveryHistory.locations.has(locationKey)) {
      console.log(`Already discovered at ${locationKey}, skipping`);
      return []; // Already discovered here, unless forced
    }
    
    console.log(`Discovering places near (${centerLat}, ${centerLng})`);
    
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
          console.log(`Found duplicate ID ${place.id}, creating new ID ${newId}`);
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
      console.error('Place discovery failed:', error);
      return [];
    }
  },
  
  // Generate places near a center point
  discoverPlacesForArea: (center, count = 5) => {
    const centerLat = center[0];
    const centerLng = center[1];
    
    // Skip if in ocean
    if (!isOnLand(centerLat, centerLng)) {
      console.log(`Center (${centerLat}, ${centerLng}) is in ocean or outside California`);
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