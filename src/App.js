import React, { useEffect, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from './components/SearchBar';
import LoadingSpinner from './components/LoadingSpinner';
import BookingsView from './components/BookingsView';
import SavedPropertiesView from './components/SavedPropertiesView';
import { useAppState } from './hooks/useAppState';
import { getDisplayedPlaces } from './utils/placeUtils';
import BookingsService from './services/BookingsService';
import SavedPropertiesService from './services/SavedPropertiesService';
import { useAuth } from './context/AuthContext';
import './App.css';

// Lazy load components for better performance
const MapView = React.lazy(() => import('./components/MapView'));
const ListView = React.lazy(() => import('./components/ListView'));
const PlaceDetails = React.lazy(() => import('./components/PlaceDetails'));

function App() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [showBookings, setShowBookings] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  // Check bookings count on mount and when token changes
  useEffect(() => {
    const updateCounts = async () => {
      const bCount = await BookingsService.getBookingsCount(token);
      const sCount = await SavedPropertiesService.getSavedPropertiesCount(token);
      setBookingsCount(bCount);
      setSavedCount(sCount);
    };

    updateCounts();

    // Listen for storage changes (for cross-tab updates)
    window.addEventListener('storage', updateCounts);

    return () => {
      window.removeEventListener('storage', updateCounts);
    };
  }, [token]);

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
    setIsLoading,
    setDiscoveredPlaces,
    setDiscoveryInProgress
  } = useAppState();

  // Initialize the app
  useEffect(() => {
    setAllPlaces([]);
    setDisplayedPlaces([]);
    setCurrentLocation('Discovering...');
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    console.log('[App] handleDiscoverPlaces called with', newPlaces?.length || 0, 'places');
    
    if (!Array.isArray(newPlaces) || state.discoveryInProgress) {
      return;
    }

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

      setCurrentLocation(locationName);
      setAllPlaces(newPlaces);
      setDisplayedPlaces(newPlaces);
      setDiscoveredPlaces(newPlaces);
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

  if (state.isLoading) {
    return <LoadingSpinner message="Initializing app..." />;
  }

  return (
    <div className="app" role="application" aria-label="Hospitality Finder">
      <header className="app-header" role="banner">
        <h1 className="visually-hidden">Hospitality Finder</h1>
        <div className="header-left">
          <SearchBar
            value={state.searchTerm}
            onChange={setSearchTerm}
          />

        </div>

        <div className="header-right">
          {user && (
            <button
              className="header-profile-button"
              onClick={() => navigate('/dashboard')}
              aria-label="Go to dashboard"
            >
              👤 {user.name || 'Dashboard'}
            </button>
          )}
          {!user && (
            <button
              className="header-login-button"
              onClick={() => navigate('/login')}
              aria-label="Login"
            >
              🔐 Login
            </button>
          )}
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
              places={state.allPlaces}
              onViewportChange={handleViewportChange}
              onDiscoverPlaces={handleDiscoverPlaces}
              onSelectPlace={setSelectedPlace}
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
            <p>No properties found</p>
            <p style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>
              Try exploring the map to discover properties in different areas.
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
          // Update count after closing (async; resolve into state)
          BookingsService.getBookingsCount(token).then(setBookingsCount);
        }} />
      )}

      {/* Saved Properties view */}
      {showSaved && (
        <SavedPropertiesView
          onClose={() => {
            setShowSaved(false);
            // Update count after closing (async; resolve into state)
            SavedPropertiesService.getSavedPropertiesCount(token).then(setSavedCount);
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