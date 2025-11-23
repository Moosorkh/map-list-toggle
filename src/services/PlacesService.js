const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

export const searchPlacesInArea = async ({ bounds, searchTerm = '' }) => {
  if (!bounds) return [];

  try {
    const response = await fetch(`${API_BASE}/places/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bounds, searchTerm })
    });

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // For now, fail silently and return no places
    return [];
  }
};

export default {
  searchPlacesInArea
};
