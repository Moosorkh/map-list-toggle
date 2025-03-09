import React, { useState, useEffect, lazy, Suspense } from 'react';
import SearchBar from './components/SearchBar';
import LocationSelector from './components/LocationSelector';
import { places as initialPlaces } from './data/places';
import GeocodingService from './services/GeocodingService';
import locationManager from './services/LocationManager';
import './App.css';

// Lazy load components
const MapView = lazy(() => import('./components/MapView'));
const ListView = lazy(() => import('./components/ListView'));
const PlaceDetails = lazy(() => import('./components/PlaceDetails'));
const PlaceSwitcher = lazy(() => import('./components/PlaceSwitcher'));

// Loading component
const LoadingView = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#FF385C'
  }}>
    <div className="loading-spinner"></div>
    <div style={{ marginLeft: '12px' }}>Loading...</div>
  </div>
);

function App() {
  const [view, setView] = useState('map'); // Start with map view
  const [allPlaces, setAllPlaces] = useState([]);
  const [displayedPlaces, setDisplayedPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [locations, setLocations] = useState([]);
  const [currentLocationId, setCurrentLocationId] = useState(null);
  const [mapState, setMapState] = useState({
    center: [34.0522, -118.2437], // Los Angeles as default center
    zoom: 10,
    bounds: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [discoveredPlaces, setDiscoveredPlaces] = useState([]);
  const [discoveryInProgress, setDiscoveryInProgress] = useState(false);
  
  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      // Clean up any existing empty locations
      locationManager.cleanupEmptyLocations();
      
      // Check if we already have locations
      const existingLocations = locationManager.getAllLocations();
      
      if (existingLocations.length > 0) {
        // Use the first location (most recent)
        const firstLocation = existingLocations[0];
        setCurrentLocationId(firstLocation.id);
        setAllPlaces(firstLocation.places);
        setDisplayedPlaces(firstLocation.places);
        setCurrentLocation(firstLocation.name);
      } else {
        // Create a default "California" location with no places
        const initialLocationId = locationManager.addLocation(
          'California', 
          [34.0522, -118.2437], // Los Angeles as default center
          [] // No initial places
        );
        
        setCurrentLocationId(initialLocationId);
        setAllPlaces([]);
        setDisplayedPlaces([]);
        setCurrentLocation('California');
      }
      
      // Update locations list
      setLocations(locationManager.getAllLocations());
      setIsLoading(false);
    };
    
    initializeApp();
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
  const handleDiscoverPlaces = async (newPlaces, locationData) => {
    // Guard against empty places or discovery in progress
    if (!newPlaces || newPlaces.length === 0 || discoveryInProgress) return;
    
    setDiscoveryInProgress(true);
    
    try {
      // Extract location information from the reverse geocoding response
      let locationName = "California";
      if (locationData) {
        if (locationData.address) {
          const address = locationData.address;
          locationName = address.city || address.town || address.village || 
                        address.county || address.state || "California";
        } else if (locationData.display_name) {
          // Get first part of display name
          locationName = locationData.display_name.split(',')[0];
        }
      }
      
      console.log(`Discovered ${newPlaces.length} places in ${locationName}`);
      
      // Create a distinct location in our data model if it doesn't exist
      // First check if we already have a location with this name
      const existingLocation = locations.find(loc => loc.name === locationName);
      
      if (existingLocation) {
        // Add new places to existing location - no duplicates
        const existingPlaceIds = new Set(existingLocation.places.map(p => p.id));
        const uniqueNewPlaces = newPlaces.filter(p => !existingPlaceIds.has(p.id));
        
        if (uniqueNewPlaces.length === 0) {
          console.log('No new unique places to add');
          setDiscoveryInProgress(false);
          return;
        }
        
        // Add places to existing location
        locationManager.addPlacesToLocation(existingLocation.id, uniqueNewPlaces);
        
        // Update state
        setLocations(locationManager.getAllLocations());
        setAllPlaces([...existingLocation.places, ...uniqueNewPlaces]);
        setDiscoveredPlaces(uniqueNewPlaces);
        
        // If this is the current location, update displayed places
        if (existingLocation.id === currentLocationId) {
          if (!searchTerm) {
            setDisplayedPlaces([...existingLocation.places, ...uniqueNewPlaces]);
          } else {
            // Apply search filter to combined places
            const combined = [...existingLocation.places, ...uniqueNewPlaces];
            const filtered = combined.filter(place =>
              place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              place.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setDisplayedPlaces(filtered);
          }
        }
      } else {
        // New location - add it to the manager with limited places (max 5)
        const limitedPlaces = newPlaces.slice(0, 5);
        const center = mapState.center || [34.0522, -118.2437];
        const newLocationId = locationManager.addLocation(locationName, center, limitedPlaces);
        
        // Update app state
        setCurrentLocationId(newLocationId);
        setCurrentLocation(locationName);
        setAllPlaces(limitedPlaces);
        setDisplayedPlaces(limitedPlaces);
        setDiscoveredPlaces(limitedPlaces);
        setLocations(locationManager.getAllLocations());
      }
      
      // Clean up any empty locations that might exist
      locationManager.cleanupEmptyLocations();
      setLocations(locationManager.getAllLocations());
    } catch (error) {
      console.error('Error handling discovered places:', error);
    } finally {
      setDiscoveryInProgress(false);
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
    
    // Clean up empty locations
    locationManager.cleanupEmptyLocations();
    
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
    } else {
      // If no locations with places, create a new default location
      const initialLocationId = locationManager.addLocation(
        'California', 
        [34.0522, -118.2437],
        []
      );
      
      setCurrentLocationId(initialLocationId);
      setAllPlaces([]);
      setDisplayedPlaces([]);
      setCurrentLocation('California');
      setLocations(locationManager.getAllLocations());
    }
  };
  
  if (isLoading) {
    return <LoadingView />;
  }
  
  return (
    <div className="app">
      <div className="app-header">
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
      </div>
      
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
        <Suspense fallback={<LoadingView />}>
          {view === 'map' ? (
            <MapView 
              places={searchTerm ? displayedPlaces : allPlaces} 
              onViewportChange={handleViewportChange}
              onDiscoverPlaces={handleDiscoverPlaces}
              onSelectPlace={handleSelectPlace}
              currentLocationId={currentLocationId}
            />
          ) : (
            <ListView 
              places={displayedPlaces}
              onSelectPlace={handleSelectPlace}
            />
          )}
        </Suspense>
      </div>
      
      {/* Toggle button */}
      <button className="toggle-button" onClick={toggleView}>
        {view === 'map' ? 'Show List' : 'Show Map'}
      </button>
      
      {/* Place counter */}
      <div className="place-counter">
        {displayedPlaces.length} of {allPlaces.length} places shown
      </div>
      
      {/* Empty state for list view */}
      {view === 'list' && displayedPlaces.length === 0 && (
        <div className="empty-state-overlay">
          <div className="empty-state">
            <div className="empty-state-icon">🏠</div>
            <p>No luxury properties found</p>
            <p style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>
              Try exploring the map to discover luxury properties in different areas.
            </p>
            <button className="action-button primary" onClick={toggleView}>
              Switch to Map View
            </button>
          </div>
        </div>
      )}
      
      {/* Place details modal */}
      {selectedPlace && (
        <Suspense fallback={<LoadingView />}>
          <PlaceDetails 
            place={selectedPlace} 
            onClose={handleCloseDetails}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;