import PlaceImage from '../public/assets/Place-image.jpg';

// This service handles reverse geocoding (converting coordinates to place names)
// and fetching place information from external APIs

// Counter for generating unique IDs for new places
let newPlaceIdCounter = 1000;

const GeocodingService = {
  // Reverse geocode a location (lat/lng to place details)
  reverseGeocode: async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      // Note: In production, you should use a service with proper API key and rate limiting
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
        {
          headers: {
            'Accept-Language': 'en-US,en',
            'User-Agent': 'YourAppName/1.0' // Required by Nominatim ToS
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Geocoding API error');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  },
  
  // Discover places within a bounding box
  discoverPlacesInArea: async (bounds) => {
    try {
      // Using Overpass API to find interesting places in the area
      // This is a simplified example - in production, use a proper POI API
      const query = `
        [out:json];
        (
          node["tourism"="hotel"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["tourism"="apartment"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["tourism"="guest_house"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["leisure"="resort"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        );
        out body;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      if (!response.ok) {
        throw new Error('Place discovery API error');
      }
      
      const data = await response.json();
      
      // Convert the API response to our app's place format
      return data.elements.map(element => ({
        id: `new_${newPlaceIdCounter++}`,
        name: element.tags.name || `Place near ${element.lat.toFixed(2)}, ${element.lon.toFixed(2)}`,
        latitude: element.lat,
        longitude: element.lon,
        description: element.tags.description || getRandomDescription(),
        price: Math.floor(Math.random() * 10000) + 1000, // Random price between 1000-11000
        imageUrl: PlaceImage,
        // Flag to indicate this is a discovered place, not from original data
        isDiscovered: true
      })).filter(place => place.name); // Only keep places with names
    } catch (error) {
      console.error('Place discovery failed:', error);
      // For demo purposes, generate some fake places if the API fails
      return generateFakePlacesForArea(bounds);
    }
  },
  
  // Mock function to generate places when real API fails or for testing
  generatePlacesForArea: (center, count = 5) => {
    return generateFakePlacesForArea({
      north: center[0] + 0.1,
      south: center[0] - 0.1,
      east: center[1] + 0.1,
      west: center[1] - 0.1
    }, count);
  }
};

// Helper function to generate random places for an area
// This is used as a fallback when API calls fail
function generateFakePlacesForArea(bounds, count = 5) {
  const places = [];
  const locationNames = [
    'Mountain View', 'Riverside', 'Oak Valley', 'Pinecrest', 
    'Sunset Hills', 'Golden Sands', 'Crystal Lake', 'Harbor View',
    'Emerald Bay', 'Silver Springs', 'Meadowbrook', 'Palm Gardens'
  ];
  
  const descriptions = [
    'Mountain and lake views', 'Beachside retreat', 'Forest cabin getaway',
    'Luxury villa with pool', 'Cozy cottage near town', 'Modern loft downtown',
    'Rustic cabin retreat', 'Oceanfront paradise', 'Countryside escape'
  ];
  
  for (let i = 0; i < count; i++) {
    // Generate random coordinates within bounds
    const latitude = bounds.south + Math.random() * (bounds.north - bounds.south);
    const longitude = bounds.west + Math.random() * (bounds.east - bounds.west);
    
    places.push({
      id: `new_${newPlaceIdCounter++}`,
      name: locationNames[Math.floor(Math.random() * locationNames.length)],
      latitude,
      longitude,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      price: Math.floor(Math.random() * 10000) + 1000, // Random price between 1000-11000
      imageUrl: PlaceImage,
      isDiscovered: true
    });
  }
  
  return places;
}

// Helper for generating random descriptions
function getRandomDescription() {
  const views = ['Mountain', 'Ocean', 'City', 'Forest', 'Lake', 'Desert', 'Garden'];
  const features = ['views', 'retreat', 'getaway', 'experience', 'escape'];
  const view1 = views[Math.floor(Math.random() * views.length)];
  let view2 = views[Math.floor(Math.random() * views.length)];
  
  // Ensure view2 is different from view1
  while (view2 === view1) {
    view2 = views[Math.floor(Math.random() * views.length)];
  }
  
  const feature = features[Math.floor(Math.random() * features.length)];
  return `${view1} and ${view2} ${feature}`;
}

export default GeocodingService;