// services/LocationManager.js

// Check for duplicate place IDs and make them unique
const ensureUniqueIds = (places) => {
  const seenIds = new Set();
  
  return places.map(place => {
    let placeId = place.id;
    
    // If we've seen this ID before, create a new unique ID
    if (seenIds.has(placeId)) {
      // Clone the place with a new ID
      const newId = `${placeId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`Found duplicate ID ${placeId}, created new ID ${newId}`);
      
      const newPlace = { ...place, id: newId };
      seenIds.add(newPlace.id);
      return newPlace;
    }
    
    // First time seeing this ID
    seenIds.add(placeId);
    return place;
  });
};

// Class to handle the management of different location sets
class LocationManager {
  constructor() {
    this.locations = [];
    this.currentLocationId = null;
    this._maxLocationsToKeep = 10; // Maximum number of location sets to keep
  }

  // Add a new location with its associated places
  addLocation(name, center, places) {
    // Ensure all places have unique IDs before adding
    const uniquePlaces = ensureUniqueIds(places);
    
    // If places array is empty and it's not the first location, don't add it
    if (uniquePlaces.length === 0 && this.locations.length > 0) {
      console.log(`Skipping creation of location "${name}" with no places`);
      return this.currentLocationId || (this.locations.length > 0 ? this.locations[0].id : null);
    }
    
    // Check for existing location with same name to prevent duplicates
    const existingLocationIndex = this.locations.findIndex(loc => loc.name === name);
    
    if (existingLocationIndex >= 0) {
      // Update existing location with new places, avoiding duplicates
      const existingLocation = this.locations[existingLocationIndex];
      
      // If no new places to add, just return the existing location ID
      if (uniquePlaces.length === 0) {
        this.currentLocationId = existingLocation.id;
        return existingLocation.id;
      }
      
      const existingIds = new Set(existingLocation.places.map(place => place.id));
      
      // Only add places that don't already exist
      const newPlaces = uniquePlaces.filter(place => !existingIds.has(place.id));
      
      // If no new unique places, just return the existing location ID
      if (newPlaces.length === 0) {
        this.currentLocationId = existingLocation.id;
        return existingLocation.id;
      }
      
      // Add new places to the existing location
      existingLocation.places = [...existingLocation.places, ...newPlaces];
      existingLocation.dateUpdated = new Date();
      
      // Move this location to the top of the list (most recent)
      this.locations.splice(existingLocationIndex, 1);
      this.locations.unshift(existingLocation);
      
      this.currentLocationId = existingLocation.id;
      return existingLocation.id;
    }
    
    // Generate unique location ID
    const locationId = `loc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const newLocation = {
      id: locationId,
      name,
      center,
      places: uniquePlaces,
      dateAdded: new Date(),
      dateUpdated: new Date(),
      isActive: true
    };
    
    // Add to the beginning so newer locations appear first
    this.locations.unshift(newLocation);
    this.currentLocationId = locationId;
    
    // Trim the locations list if it exceeds the maximum
    if (this.locations.length > this._maxLocationsToKeep) {
      this.locations = this.locations.slice(0, this._maxLocationsToKeep);
    }
    
    return locationId;
  }
  
  // Get a list of all non-empty locations
  getAllLocations() {
    return this.locations.filter(loc => loc.places.length > 0);
  }
  
  // Get places for a specific location
  getPlacesForLocation(locationId) {
    const location = this.locations.find(loc => loc.id === locationId);
    return location ? ensureUniqueIds(location.places) : [];
  }
  
  // Get currently active location
  getCurrentLocation() {
    // First try to find the current location by ID
    let current = this.locations.find(loc => loc.id === this.currentLocationId);
    
    // If not found or current has no places, find the first location with places
    if (!current || current.places.length === 0) {
      current = this.locations.find(loc => loc.places.length > 0);
    }
    
    // If still not found, return the first location or null
    return current || (this.locations.length > 0 ? this.locations[0] : null);
  }
  
  // Set current location
  setCurrentLocation(locationId) {
    // Check if the location exists
    const location = this.locations.find(loc => loc.id === locationId);
    if (location) {
      this.currentLocationId = locationId;
      
      // Move this location to the top of the list (most recently accessed)
      const index = this.locations.findIndex(loc => loc.id === locationId);
      if (index > 0) {
        // Only reorder if it's not already at the top
        const [movedLocation] = this.locations.splice(index, 1);
        this.locations.unshift(movedLocation);
      }
      
      return true;
    }
    return false;
  }
  
  // Add places to a specific location
  addPlacesToLocation(locationId, newPlaces) {
    // If no new places, just return 0
    if (!newPlaces || newPlaces.length === 0) {
      return 0;
    }
    
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) return false;
    
    // Ensure all new places have unique IDs
    const uniqueNewPlaces = ensureUniqueIds(newPlaces);
    
    // Filter out any duplicate places by ID
    const existingIds = new Set(location.places.map(place => place.id));
    const uniquePlaces = uniqueNewPlaces.filter(place => !existingIds.has(place.id));
    
    // If no unique places to add, return 0
    if (uniquePlaces.length === 0) {
      return 0;
    }
    
    // Add the unique places
    location.places = [...location.places, ...uniquePlaces];
    location.dateUpdated = new Date();
    
    // Move this location to the top of the list (most recently updated)
    const index = this.locations.findIndex(loc => loc.id === locationId);
    if (index > 0) {
      // Only reorder if it's not already at the top
      const [movedLocation] = this.locations.splice(index, 1);
      this.locations.unshift(movedLocation);
    }
    
    return uniquePlaces.length;
  }
  
  // Remove a location
  removeLocation(locationId) {
    const initialLength = this.locations.length;
    
    // Find the location index
    const locationIndex = this.locations.findIndex(loc => loc.id === locationId);
    if (locationIndex === -1) return false;
    
    // Remove the location
    this.locations.splice(locationIndex, 1);
    
    // If we removed the current location, set current to the first available with places
    if (this.currentLocationId === locationId) {
      const locationWithPlaces = this.locations.find(loc => loc.places.length > 0);
      if (locationWithPlaces) {
        this.currentLocationId = locationWithPlaces.id;
      } else if (this.locations.length > 0) {
        this.currentLocationId = this.locations[0].id;
      } else {
        this.currentLocationId = null;
      }
    }
    
    return initialLength !== this.locations.length;
  }
  
  // Clear all locations
  clearLocations() {
    this.locations = [];
    this.currentLocationId = null;
  }
  
  // Clean up locations with no places
  cleanupEmptyLocations() {
    const initialCount = this.locations.length;
    this.locations = this.locations.filter(loc => loc.places.length > 0);
    
    // If current location was removed, update it
    if (this.currentLocationId && !this.locations.some(loc => loc.id === this.currentLocationId)) {
      this.currentLocationId = this.locations.length > 0 ? this.locations[0].id : null;
    }
    
    return initialCount - this.locations.length;
  }
  
  // Format location for display
  formatLocationName(location) {
    if (!location) return "";
    return `${location.name} (${location.places.length} ${location.places.length === 1 ? 'place' : 'places'})`;
  }
}

// Export as a singleton
const locationManager = new LocationManager();
export default locationManager;