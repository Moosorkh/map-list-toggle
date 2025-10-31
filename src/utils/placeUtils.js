/**
 * Utility functions for place management
 */

/**
 * Deduplicate places by ID, keeping only one instance of each
 * @param {Array} placesArray - Array of places to deduplicate
 * @returns {Array} Deduplicated array of places
 */
export const deduplicatePlaces = (placesArray) => {
    if (!Array.isArray(placesArray)) return [];

    const uniquePlaces = new Map();

    placesArray.forEach(place => {
        if (place && place.id && !uniquePlaces.has(place.id)) {
            uniquePlaces.set(place.id, place);
        }
    });

    return Array.from(uniquePlaces.values());
};

/**
 * Sort places by different criteria
 * @param {Array} places - Array of places to sort
 * @param {string} sortOrder - Sort order (price-asc, price-desc, name-asc)
 * @returns {Array} Sorted array
 */
export const sortPlaces = (places, sortOrder = 'price-asc') => {
    const sorted = [...places];

    switch (sortOrder) {
        case 'price-asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        default:
            return sorted;
    }
};

/**
 * Filter places by map bounds
 * @param {Array} places - Array of places to filter
 * @param {Object} bounds - Map bounds object with north, south, east, west
 * @returns {Array} Filtered places within bounds
 */
export const filterPlacesByMapBounds = (places, bounds) => {
    if (!bounds || !Array.isArray(places)) return places;

    return places.filter(place =>
        place.latitude <= bounds.north &&
        place.latitude >= bounds.south &&
        place.longitude <= bounds.east &&
        place.longitude >= bounds.west
    );
};

/**
 * Filter places by search term
 * @param {Array} places - Array of places to filter
 * @param {string} searchTerm - Search term to match
 * @returns {Array} Filtered places
 */
export const filterPlacesBySearch = (places, searchTerm) => {
    if (!searchTerm || !Array.isArray(places)) return places;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return places.filter(place =>
        place.name.toLowerCase().includes(lowerSearchTerm) ||
        place.description.toLowerCase().includes(lowerSearchTerm)
    );
};

/**
 * Get displayed places based on view, search term, and map bounds
 * @param {Array} allPlaces - All places
 * @param {string} view - Current view (map or list)
 * @param {string} searchTerm - Search term
 * @param {Object} mapBounds - Map bounds (only for map view)
 * @returns {Array} Displayed places
 */
export const getDisplayedPlaces = (allPlaces, view, searchTerm, mapBounds) => {
    let displayed = allPlaces;

    // Apply search filter
    if (searchTerm) {
        displayed = filterPlacesBySearch(displayed, searchTerm);
    }

    // Apply map bounds filter only in map view and if there's no search term
    if (view === 'map' && mapBounds && !searchTerm) {
        displayed = filterPlacesByMapBounds(displayed, mapBounds);
    }

    return displayed;
};
