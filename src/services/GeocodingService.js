/**
 * GeocodingService - Handles reverse geocoding (coordinates to place names)
 * Uses OpenStreetMap Nominatim API for location lookups
 */

/**
 * GeocodingService - Handles reverse geocoding (coordinates to place names)
 * Uses OpenStreetMap Nominatim API for location lookups
 */

const GeocodingService = {
  /**
   * Reverse geocode a location (lat/lng to place details)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Location data with display_name and address
   */
  reverseGeocode: async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
        {
          headers: {
            'Accept-Language': 'en-US,en',
            'User-Agent': 'HospitalityFinder/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('GeocodingService: Reverse geocoding failed:', error);
      // Return a generic fallback
      return {
        display_name: 'Unknown Location',
        address: {}
      };
    }
  },
};

export default GeocodingService;