// services/LocationManager.js

// Class to handle the management of different location sets
class LocationManager {
    constructor() {
      this.locations = [];
      this.currentLocationId = null;
      this._maxLocationsToKeep = 10; // Maximum number of location sets to keep
    }
  
    // Add a new location with its associated places
    addLocation(name, center, places) {
      const locationId = `loc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const newLocation = {
        id: locationId,
        name,
        center,
        places,
        dateAdded: new Date(),
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
    
    // Get a list of all locations
    getAllLocations() {
      return this.locations;
    }
    
    // Get places for a specific location
    getPlacesForLocation(locationId) {
      const location = this.locations.find(loc => loc.id === locationId);
      return location ? location.places : [];
    }
    
    // Get currently active location
    getCurrentLocation() {
      return this.locations.find(loc => loc.id === this.currentLocationId) || 
             (this.locations.length > 0 ? this.locations[0] : null);
    }
    
    // Set current location
    setCurrentLocation(locationId) {
      // Check if the location exists
      const exists = this.locations.some(loc => loc.id === locationId);
      if (exists) {
        this.currentLocationId = locationId;
        return true;
      }
      return false;
    }
    
    // Add places to a specific location
    addPlacesToLocation(locationId, newPlaces) {
      const location = this.locations.find(loc => loc.id === locationId);
      if (!location) return false;
      
      // Filter out any duplicate places by ID
      const existingIds = new Set(location.places.map(place => place.id));
      const uniquePlaces = newPlaces.filter(place => !existingIds.has(place.id));
      
      location.places = [...location.places, ...uniquePlaces];
      return uniquePlaces.length;
    }
    
    // Remove a location
    removeLocation(locationId) {
      const initialLength = this.locations.length;
      this.locations = this.locations.filter(loc => loc.id !== locationId);
      
      // If we removed the current location, set current to the first available
      if (this.currentLocationId === locationId && this.locations.length > 0) {
        this.currentLocationId = this.locations[0].id;
      } else if (this.locations.length === 0) {
        this.currentLocationId = null;
      }
      
      return initialLength !== this.locations.length;
    }
    
    // Clear all locations
    clearLocations() {
      this.locations = [];
      this.currentLocationId = null;
    }
  }
  
  // Export as a singleton
  const locationManager = new LocationManager();
  export default locationManager;