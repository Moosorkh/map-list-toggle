import React, { useEffect, Suspense, useState } from 'react';
import SearchBar from './components/SearchBar';
import LocationSelector from './components/LocationSelector';
import LoadingSpinner from './components/LoadingSpinner';
import BookingsView from './components/BookingsView';
import SavedPropertiesView from './components/SavedPropertiesView';
import { useAppState } from './hooks/useAppState';
import { getDisplayedPlaces } from './utils/placeUtils';
import locationManager from './services/LocationManager';
import { DEFAULT_MAP_CENTER } from './config/constants';
import './App.css';

// Lazy load components for better performance
const MapView = React.lazy(() => import('./components/MapView'));
const ListView = React.lazy(() => import('./components/ListView'));
const PlaceDetails = React.lazy(() => import('./components/PlaceDetails'));

function App() {
  const [showBookings, setShowBookings] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  // Check bookings count on mount
  useEffect(() => {
    const updateBookingsCount = () => {
      const bookings = JSON.parse(localStorage.getItem('luxuryBookings') || '[]');
      setBookingsCount(bookings.length);
    };

    const updateSavedCount = () => {
      const saved = JSON.parse(localStorage.getItem('savedProperties') || '[]');
      setSavedCount(saved.length);
    };

    updateBookingsCount();
    updateSavedCount();

    // Listen for storage changes
    window.addEventListener('storage', updateBookingsCount);
    window.addEventListener('storage', updateSavedCount);

    // Also check periodically in case changes happen in same tab
    const interval = setInterval(() => {
      updateBookingsCount();
      updateSavedCount();
    }, 1000);

    return () => {
      window.removeEventListener('storage', updateBookingsCount);
      window.removeEventListener('storage', updateSavedCount);
      clearInterval(interval);
    };
  }, []);

  // Use the custom hook for app state management
  const {
    state,
    setView,
    setSearchTerm,
    setAllPlaces,
    setDisplayedPlaces,
    setCurrentLocation,
    setSelectedPlace,
    setMapState,
    setLocations,
    setCurrentLocationId,
    setIsLoading,
    setDiscoveredPlaces,
    setDiscoveryInProgress
  } = useAppState();

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
        // Create a default location with no places
        const initialLocationId = locationManager.addLocation(
          'California',
          DEFAULT_MAP_CENTER,
          []
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When current location changes, update places
  useEffect(() => {
    if (state.currentLocationId) {
      const location = locationManager.getCurrentLocation();
      if (location) {
        setAllPlaces(location.places);
        setCurrentLocation(location.name);

        // If not in search mode, update displayed places
        if (!state.searchTerm) {
          setDisplayedPlaces(location.places);
        } else {
          // Apply search filter to the new location's places
          const filtered = getDisplayedPlaces(location.places, state.view, state.searchTerm, state.mapState.bounds);
          setDisplayedPlaces(filtered);
        }
      }
    }
  }, [state.currentLocationId, state.searchTerm, state.view, state.mapState.bounds]);

  // Filter places based on search term and view
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const displayed = getDisplayedPlaces(state.allPlaces, state.view, state.searchTerm, state.mapState.bounds);
    setDisplayedPlaces(displayed);
  }, [state.searchTerm, state.view, state.mapState, state.allPlaces]);

  // Handle map viewport changes
  const handleViewportChange = ({ visiblePlaces, mapState: newMapState }) => {
    setMapState(newMapState);

    // Only update displayed places if we're not in search mode
    if (!state.searchTerm) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setDisplayedPlaces(visiblePlaces);
    }
  };

  // Handle discovery of new places
  const handleDiscoverPlaces = async (newPlaces, locationData) => {
    // Guard against empty places or discovery in progress
    if (!newPlaces || newPlaces.length === 0 || state.discoveryInProgress) return;

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

      // Create a distinct location in our data model if it doesn't exist
      // First check if we already have a location with this name
      const existingLocation = state.locations.find(loc => loc.name === locationName);

      if (existingLocation) {
        // Add new places to existing location - no duplicates
        const existingPlaceIds = new Set(existingLocation.places.map(p => p.id));
        const uniqueNewPlaces = newPlaces.filter(p => !existingPlaceIds.has(p.id));

        if (uniqueNewPlaces.length === 0) {
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
        if (existingLocation.id === state.currentLocationId) {
          if (!state.searchTerm) {
            setDisplayedPlaces([...existingLocation.places, ...uniqueNewPlaces]);
          } else {
            // Apply search filter to combined places
            const combined = [...existingLocation.places, ...uniqueNewPlaces];
            const filtered = getDisplayedPlaces(combined, state.view, state.searchTerm, state.mapState.bounds);
            setDisplayedPlaces(filtered);
          }
        }
      } else {
        // New location - add it to the manager with limited places (max 5)
        const limitedPlaces = newPlaces.slice(0, 5);
        const center = state.mapState.center || DEFAULT_MAP_CENTER;
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
    } finally {
      setDiscoveryInProgress(false);
    }
  };

  // Handle view toggle
  const toggleView = () => {
    const newView = state.view === 'map' ? 'list' : 'map';
    setView(newView);

    // When switching to list view, show all places that match the search
    if (newView === 'list') {
      const displayed = getDisplayedPlaces(state.allPlaces, newView, state.searchTerm, state.mapState.bounds);
      setDisplayedPlaces(displayed);
    }
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
    if (state.locations.length <= 1) return;

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
        DEFAULT_MAP_CENTER,
        []
      );

      setCurrentLocationId(initialLocationId);
      setAllPlaces([]);
      setDisplayedPlaces([]);
      setCurrentLocation('California');
      setLocations(locationManager.getAllLocations());
    }
  };

  if (state.isLoading) {
    return <LoadingSpinner message="Initializing app..." />;
  }

  return (
    <div className="app" role="application" aria-label="Luxury Property Finder">
      <header className="app-header" role="banner">
        <h1 className="visually-hidden">Luxury Property Finder</h1>
        <div className="header-left">
          <SearchBar
            value={state.searchTerm}
            onChange={setSearchTerm}
          />

          {/* Location selector */}
          <LocationSelector
            locations={state.locations}
            currentLocationId={state.currentLocationId}
            onLocationChange={handleLocationChange}
            onDeleteLocation={handleDeleteLocation}
          />
        </div>

        <div className="header-right">
          <button
            className="header-saved-button"
            onClick={() => setShowSaved(true)}
            aria-label="View saved properties"
          >
            🤍 Saved
            {savedCount > 0 && (
              <span className="header-badge">{savedCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Current location indicator */}
      {state.currentLocation && state.view === 'map' && (
        <div className="location-indicator">
          <div className="location-pill">
            <span>📍 {state.currentLocation}</span>
            {state.discoveredPlaces.length > 0 && (
              <span className="discovery-count">
                {state.discoveredPlaces.length} new {state.discoveredPlaces.length === 1 ? 'place' : 'places'} discovered
              </span>
            )}
          </div>
        </div>
      )}

      <div className="content">
        <Suspense fallback={<LoadingSpinner message="Loading map view..." />}>
          {state.view === 'map' ? (
            <MapView
              places={state.searchTerm ? state.displayedPlaces : state.allPlaces}
              onViewportChange={handleViewportChange}
              onDiscoverPlaces={handleDiscoverPlaces}
              onSelectPlace={setSelectedPlace}
              currentLocationId={state.currentLocationId}
            />
          ) : (
            <ListView
              places={state.displayedPlaces}
              onSelectPlace={setSelectedPlace}
            />
          )}
        </Suspense>
      </div>

      {/* Toggle button */}
      <button
        className="toggle-button"
        onClick={toggleView}
        aria-label={state.view === 'map' ? 'Switch to list view' : 'Switch to map view'}
      >
        {state.view === 'map' ? '📋 Show List' : '🗺️ Show Map'}
      </button>

      {/* Bookings button */}
      <button
        className="bookings-button"
        onClick={() => setShowBookings(true)}
        aria-label="View my bookings"
      >
        📅 My Bookings
        {bookingsCount > 0 && (
          <span className="bookings-badge">{bookingsCount}</span>
        )}
      </button>

      {/* Place counter */}
      <div className="place-counter" role="status" aria-live="polite">
        {state.displayedPlaces.length} of {state.allPlaces.length} properties shown
      </div>

      {/* Empty state for list view */}
      {state.view === 'list' && state.displayedPlaces.length === 0 && (
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
      {state.selectedPlace && (
        <Suspense fallback={<LoadingSpinner message="Loading property details..." />}>
          <PlaceDetails
            place={state.selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        </Suspense>
      )}

      {/* Bookings view */}
      {showBookings && (
        <BookingsView onClose={() => {
          setShowBookings(false);
          // Update count after closing
          const bookings = JSON.parse(localStorage.getItem('luxuryBookings') || '[]');
          setBookingsCount(bookings.length);
        }} />
      )}

      {/* Saved Properties view */}
      {showSaved && (
        <SavedPropertiesView
          onClose={() => {
            setShowSaved(false);
            // Update count after closing
            const saved = JSON.parse(localStorage.getItem('savedProperties') || '[]');
            setSavedCount(saved.length);
          }}
          onSelectProperty={(property) => {
            setSelectedPlace(property);
          }}
        />
      )}
    </div>
  );
}

export default App;