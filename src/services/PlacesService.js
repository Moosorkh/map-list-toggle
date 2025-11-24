/**
 * PlacesService - Handles fetching hospitality places from backend API
 * This replaces the fake data generation and provides real inventory
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

/**
 * Search for places within a geographic area
 * @param {Object} params - Search parameters
 * @param {Object} params.bounds - Geographic bounds { north, south, east, west }
 * @param {string} params.searchTerm - Optional search term to filter results
 * @returns {Promise<Array>} Array of place objects
 */
export const searchPlacesInArea = async ({ bounds, searchTerm = '' }) => {
  try {
    const payload = {
      bounds,
      searchTerm,
    };

    const response = await fetch(`${API_BASE}/places/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!Array.isArray(data)) {
      console.warn('PlacesService: Expected array response, got:', typeof data);
      return [];
    }

    // Ensure each place has required fields
    return data.map(place => ({
      id: place.id || `place_${Date.now()}_${Math.random()}`,
      name: place.name || 'Unnamed Property',
      latitude: place.latitude || 0,
      longitude: place.longitude || 0,
      description: place.description || '',
      price: place.price || 0,
      imageUrl: place.imageUrl || '',
      rating: place.rating || 0,
      reviewCount: place.reviewCount || 0,
      propertyType: place.propertyType || 'Property',
      amenities: place.amenities || [],
      isDiscovered: place.isDiscovered !== undefined ? place.isDiscovered : true,
    }));
  } catch (error) {
    console.error('PlacesService: Failed to fetch places:', error);
    
    // In development, return empty array instead of failing
    // In production, you might want to throw or show user feedback
    if (process.env.NODE_ENV === 'development') {
      console.warn('PlacesService: Returning empty array due to API unavailability');
      console.warn('PlacesService: Make sure backend is running or set REACT_APP_API_BASE_URL');
    }
    
    return [];
  }
};

/**
 * Get details for a specific place by ID
 * @param {string} placeId - The place ID
 * @returns {Promise<Object|null>} Place object or null if not found
 */
export const getPlaceById = async (placeId) => {
  try {
    const response = await fetch(`${API_BASE}/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`PlacesService: Failed to fetch place ${placeId}:`, error);
    return null;
  }
};

export default {
  searchPlacesInArea,
  getPlaceById,
};
