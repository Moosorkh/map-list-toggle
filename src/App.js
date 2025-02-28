import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import ListView from './components/ListView';
import SearchBar from './components/SearchBar';
import PlaceDetails from './components/PlaceDetails';
import LocationSelector from './components/LocationSelector';
import PlaceSwitcher from './components/PlaceSwitcher';
import { places as initialPlaces } from './data/places';
import GeocodingService from './services/GeocodingService';
import locationManager from './services/LocationManager';
import './App.css';

function App() {
  const [view, setView] = useState('list');
  const [allPlaces, setAllPlaces] = useState([]);
  const [displayedPlaces, setDisplayedPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [locations, setLocations] = useState([]);
  const [currentLocationId, setCurrentLocationId] = useState(null);
  const [mapState, setMapState] = useState({
    center: [33.6595, -117.9988],
    zoom: 10,
    bounds: null
  });
  
  // Initialize with the default Southern California location
  useEffect(() => {
    // Add initial places to the location manager
    const initialLocationId = locationManager.addLocation(
      'Southern California', 
      [33.6595, -117.9988], 
      initialPlaces
    );
    
    // Update state
    setCurrentLocationId(initialLocationId);
    setAllPlaces(initialPlaces);
    setDisplayedPlaces(initialPlaces);
    setCurrentLocation('Southern California');
    
    // Update locations list
    setLocations(locationManager.getAllLocations());
  }, []);
  
  // When current location changes, update places
  useEffect(() => {
    if (currentLocationId) {
      const location = locationManager.getCurrentLocation();
      if (location) {
        setAllPlaces(location.places);
        setCurrentLocation(location.name);
        
        // If not in search mode, update displayed places
        if (!searchTerm) {
          setDisplayedPlaces(location.places);
        } else {
          // Apply search filter to the new location's places
          const filtered = location.places.filter(place =>
            place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            place.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setDisplayedPlaces(filtered);
        }
      }
    }
  }, [currentLocationId, searchTerm]);
  
  // Store discovered places separately to manage them differently
  const [discoveredPlaces, setDiscoveredPlaces] = useState([]);
  
  // Filter places based on search term
  useEffect(() => {
    if (!searchTerm) {
      // If no search term, use all places or map-filtered places if in map view
      setDisplayedPlaces(view === 'map' && mapState.bounds ? 
        filterPlacesByMapBounds(allPlaces, mapState.bounds) : 
        allPlaces);
    } else {
      // Filter by search term
      const searchFiltered = allPlaces.filter(place =>
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // If in map view, further filter by map bounds
      setDisplayedPlaces(view === 'map' && mapState.bounds ? 
        filterPlacesByMapBounds(searchFiltered, mapState.bounds) : 
        searchFiltered);
    }
  }, [searchTerm, view, mapState, allPlaces]);
  
  // Filter places by map bounds
  const filterPlacesByMapBounds = (placesToFilter, bounds) => {
    if (!bounds) return placesToFilter;
    
    return placesToFilter.filter(place => 
      place.latitude <= bounds.north &&
      place.latitude >= bounds.south &&
      place.longitude <= bounds.east &&
      place.longitude >= bounds.west
    );
  };
  
  // Handle map viewport changes
  const handleViewportChange = ({ visiblePlaces, mapState: newMapState }) => {
    setMapState(newMapState);
    
    // Only update displayed places if we're not in search mode
    if (!searchTerm) {
      setDisplayedPlaces(visiblePlaces);
    }
  };
  
  // Handle discovery of new places
  const handleDiscoverPlaces = (newPlaces, locationData) => {
    if (!newPlaces || newPlaces.length === 0) return;
    
    // Extract location information from the reverse geocoding response
    let locationName = "New Area";
    if (locationData) {
      // Nominatim returns different address formats, try to get something useful
      if (locationData.address) {
        const address = locationData.address;
        locationName = address.city || address.town || address.village || 
                      address.county || address.state || "New Area";
      } else if (locationData.display_name) {
        locationName = locationData.display_name.split(',')[0];
      }
    }
    
    // Check if we're already in this location
    const currentLoc = locationManager.getCurrentLocation();
    
    // If the current location has the same name, add places to it
    if (currentLoc && currentLoc.name === locationName) {
      // Add new places to the current location
      locationManager.addPlacesToLocation(currentLoc.id, newPlaces);
      
      // Update the displayed locations
      setLocations(locationManager.getAllLocations());
      
      // Update allPlaces with the newly discovered places
      setAllPlaces(currentLoc.places);
      
      // Update discoveredPlaces for UI indicators
      setDiscoveredPlaces(prev => [...prev, ...newPlaces]);
      
      // Update displayed places if not in search mode
      if (!searchTerm) {
        setDisplayedPlaces(currentLoc.places);
      } else {
        // Filter based on search term
        const filtered = currentLoc.places.filter(place =>
          place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          place.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setDisplayedPlaces(filtered);
      }
    } else {
      // This is a new location - add it to the location manager
      const center = mapState.center;
      const newLocationId = locationManager.addLocation(locationName, center, newPlaces);
      
      // Update the UI state
      setCurrentLocationId(newLocationId);
      setCurrentLocation(locationName);
      setAllPlaces(newPlaces);
      setDisplayedPlaces(newPlaces);
      setDiscoveredPlaces(newPlaces);
      
      // Update the locations list
      setLocations(locationManager.getAllLocations());
    }
  };
  
  // Handle view toggle
  const toggleView = () => {
    const newView = view === 'map' ? 'list' : 'map';
    setView(newView);
    
    // When switching to list view, show all places that match the search
    if (newView === 'list') {
      if (searchTerm) {
        const filtered = allPlaces.filter(place =>
          place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          place.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setDisplayedPlaces(filtered);
      } else {
        setDisplayedPlaces(allPlaces);
      }
    }
  };
  
  // Handle selecting a place for detailed view
  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
  };
  
  // Handle closing the place details
  const handleCloseDetails = () => {
    setSelectedPlace(null);
  };
  
  // Handle location selection change
  const handleLocationChange = (locationId) => {
    if (locationManager.setCurrentLocation(locationId)) {
      setCurrentLocationId(locationId);
      
      // Reset discovered places indicator when switching locations
      setDiscoveredPlaces([]);
    }
  };
  
  // Delete a location
  const handleDeleteLocation = (locationId) => {
    // Don't allow deleting the last location
    if (locations.length <= 1) return;
    
    // Remove the location
    locationManager.removeLocation(locationId);
    
    // Update the state with remaining locations
    setLocations(locationManager.getAllLocations());
    
    // Current location is automatically updated in the location manager
    setCurrentLocationId(locationManager.currentLocationId);
    
    // Update places
    const currentLocation = locationManager.getCurrentLocation();
    if (currentLocation) {
      setAllPlaces(currentLocation.places);
      setDisplayedPlaces(currentLocation.places);
      setCurrentLocation(currentLocation.name);
    }
  };
  
  return (
    <div className="app">
      <SearchBar 
        value={searchTerm}
        onChange={setSearchTerm}
      />
      
      {/* Location selector */}
      <LocationSelector 
        locations={locations}
        currentLocationId={currentLocationId}
        onLocationChange={handleLocationChange}
        onDeleteLocation={handleDeleteLocation}
      />
      
      {/* Current location indicator */}
      {currentLocation && view === 'map' && (
        <div className="location-indicator">
          <div className="location-pill">
            <span>📍 {currentLocation}</span>
            {discoveredPlaces.length > 0 && (
              <span className="discovery-count">
                {discoveredPlaces.length} new {discoveredPlaces.length === 1 ? 'place' : 'places'} discovered
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="content">
        {view === 'map' ? (
          <MapView 
            places={searchTerm ? displayedPlaces : allPlaces} 
            onViewportChange={handleViewportChange}
            onDiscoverPlaces={handleDiscoverPlaces}
            currentLocationId={currentLocationId}
          />
        ) : (
          <ListView 
            places={displayedPlaces}
            onSelectPlace={handleSelectPlace}
          />
        )}
      </div>
      
      {/* Toggle button */}
      <button className="toggle-button" onClick={() => toggleView()}>
        {view === 'map' ? 'Show List' : 'Show Map'}
      </button>
      
      {/* Place counter */}
      <div className="place-counter">
        {displayedPlaces.length} of {allPlaces.length} places shown
      </div>
      
      {/* Place details modal */}
      {selectedPlace && (
        <PlaceDetails 
          place={selectedPlace} 
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}

export default App;