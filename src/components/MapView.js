import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import GeocodingService from '../services/GeocodingService';
import BookingModal from './BookingModal';

const MapView = ({ places, onViewportChange, onDiscoverPlaces, onSelectPlace }) => {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [showDiscoverButton, setShowDiscoverButton] = useState(false);
  const [bookingPlace, setBookingPlace] = useState(null);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const currentBoundsRef = useRef(null);
  const currentCenterRef = useRef(null);
  const initializedRef = useRef(false);
  const isUpdatingViewportRef = useRef(false);

  // Initialize map - only runs once
  useEffect(() => {
    if (!mapRef.current) {
      // Center on first place by default, or average of all places
      const defaultCenter = places.length > 0
        ? [places[0].latitude, places[0].longitude]
        : [34.0522, -118.2437]; // Los Angeles as default center

      // Create map with modern clean style
      mapRef.current = L.map('map', {
        center: defaultCenter,
        zoom: 10,
        zoomControl: false,
        attributionControl: false,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
      });

      // Use modern, clean map tiles (MapTiler or Stamen Toner Lite)
      // This gives a beautiful, minimalist look perfect for luxury properties
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        minZoom: 3
      }).addTo(mapRef.current);

      // Add zoom control to the bottom-right (like Google Maps)
      L.control.zoom({
        position: 'bottomright'
      }).addTo(mapRef.current);

      // Add a subtle attribution
      L.control.attribution({
        position: 'bottomleft',
        prefix: 'Luxury Places Explorer'
      }).addTo(mapRef.current);

      // Handle viewport changes
      const handleMapMove = () => {
        // Prevent recursion
        if (isUpdatingViewportRef.current) return;

        // Set the flag to prevent recursive updates
        isUpdatingViewportRef.current = true;

        const map = mapRef.current;
        if (!map) {
          isUpdatingViewportRef.current = false;
          return;
        }

        // Check if any popups are open - if so, we'll throttle updates
        const openPopups = document.querySelectorAll('.leaflet-popup');
        const hasOpenPopups = openPopups.length > 0;

        // Get bounds
        const bounds = map.getBounds();

        // Prepare the bounds object
        const boundsObj = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        };

        // Store in refs (no state updates)
        currentBoundsRef.current = boundsObj;

        const center = map.getCenter();
        currentCenterRef.current = [center.lat, center.lng];

        // Only update discovery button if no popups are open (to avoid triggering re-renders)
        if (!hasOpenPopups) {
          // Check discovery button state
          const zoom = map.getZoom();
          if (zoom >= 8 && isOnLand(center.lat, center.lng)) {
            setShowDiscoverButton(true);
          } else {
            setShowDiscoverButton(false);
          }
        }

        // Notify parent about viewport changes - use setTimeout to break the rendering cycle
        if (onViewportChange) {
          // If popups are open, we throttle updates to avoid re-render loops
          if (hasOpenPopups) {
            // Clear existing timeout
            if (window.viewportUpdateTimeout) {
              clearTimeout(window.viewportUpdateTimeout);
            }

            // Set a new timeout - this ensures we only update after user has stopped moving
            window.viewportUpdateTimeout = setTimeout(() => {
              const visiblePlaces = places.filter(place =>
                bounds.contains([place.latitude, place.longitude])
              );

              onViewportChange({
                visiblePlaces,
                mapState: {
                  center: [center.lat, center.lng],
                  zoom: map.getZoom(),
                  bounds: boundsObj
                }
              });

              isUpdatingViewportRef.current = false;
            }, 200); // Throttle viewport updates during popup interaction
          } else {
            // No popups open, update normally
            const visiblePlaces = places.filter(place =>
              bounds.contains([place.latitude, place.longitude])
            );

            onViewportChange({
              visiblePlaces,
              mapState: {
                center: [center.lat, center.lng],
                zoom: map.getZoom(),
                bounds: boundsObj
              }
            });

            isUpdatingViewportRef.current = false;
          }
        } else {
          isUpdatingViewportRef.current = false;
        }
      };

      // Add viewport change events
      mapRef.current.on('moveend', handleMapMove);
      mapRef.current.on('zoomend', handleMapMove);

      initializedRef.current = true;
      setMapReady(true);

      // Initial viewport report after markers are updated
      setTimeout(handleMapMove, 100);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initializedRef.current = false;
      }
    };
  }, []);

  // Simple check if point is on land
  const isOnLand = (lat, lng) => {
    // Simple check for the Pacific Ocean west of California
    const OCEAN_LONGITUDE = -124.0;

    // Check if we're significantly in the ocean (west of coastal line)
    if (lng < OCEAN_LONGITUDE) {
      return false;
    }

    // California bounding box (rough)
    if (lat < 32.5 || lat > 42.0 || lng < -124.6 || lng > -114.0) {
      return false;
    }

    return true;
  };

  // Create a custom popup with image
  const createCustomPopup = (place) => {
    const formattedPrice = place.price.toLocaleString();

    return `
      <div class="custom-popup">
        <div class="popup-image-container">
          <img src="${place.imageUrl}" alt="${place.name}" class="popup-image">
          ${place.isDiscovered ? '<div class="popup-new-tag">NEW</div>' : ''}
        </div>
        <div class="popup-content">
          <h3 class="popup-title">${place.name}</h3>
          <p class="popup-description">${place.description}</p>
          <div class="popup-footer">
            <span class="popup-price">$${formattedPrice}/night</span>
            <div class="popup-buttons">
              <button class="popup-details-button" data-place-id="${place.id}">Details</button>
              <button class="popup-book-button" data-place-id="${place.id}">Book Now</button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Handle manual discovery
  const handleDiscover = async () => {
    if (!currentBoundsRef.current || !currentCenterRef.current || isDiscovering) return;

    setIsDiscovering(true);

    try {
      // Get location name first
      const locationData = await GeocodingService.reverseGeocode(
        currentCenterRef.current[0],
        currentCenterRef.current[1]
      );

      // Discover places in this area - limit to 5
      const discoveredPlaces = await GeocodingService.discoverPlacesInArea(
        currentBoundsRef.current,
        true
      );

      if (discoveredPlaces && discoveredPlaces.length > 0) {
        // Send discovered places to parent
        onDiscoverPlaces(discoveredPlaces, locationData);

        // Hide discover button for a while to prevent spam
        setShowDiscoverButton(false);
        setTimeout(() => {
          if (mapRef.current) {
            const center = mapRef.current.getCenter();
            if (center && isOnLand(center.lat, center.lng)) {
              setShowDiscoverButton(true);
            }
          }
        }, 5000);
      }
    } catch (error) {
      // Discovery failed silently
    } finally {
      setIsDiscovering(false);
    }
  };

  // Update markers when places change - only the marker-specific logic
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    // Create beautiful custom SVG icon instead of PNG
    const createCustomIcon = (isNew = false) => {
      const svgIcon = `
        <svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="4" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#ff385c;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#e61e4d;stop-opacity:1" />
            </linearGradient>
            ${isNew ? `
            <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#ffa500;stop-opacity:1" />
            </linearGradient>
            ` : ''}
          </defs>
          
          <!-- Shadow circle -->
          <ellipse cx="20" cy="48" rx="8" ry="3" fill="rgba(0,0,0,0.2)" />
          
          <!-- Main pin shape -->
          <path d="M20,2 C11.2,2 4,9.2 4,18 C4,28 20,48 20,48 S36,28 36,18 C36,9.2 28.8,2 20,2 Z" 
                fill="url(#pinGradient)" 
                stroke="white" 
                stroke-width="2"
                filter="url(#shadow)"/>
          
          <!-- Inner circle for luxury brand mark -->
          <circle cx="20" cy="18" r="8" fill="white" opacity="0.9"/>
          
          <!-- Luxury icon (diamond/star) -->
          <path d="M20,12 L22,16 L26,17 L23,20 L24,24 L20,22 L16,24 L17,20 L14,17 L18,16 Z" 
                fill="url(#pinGradient)" 
                opacity="0.9"/>
          
          ${isNew ? `
          <!-- Pulse ring for new discoveries -->
          <circle cx="20" cy="18" r="12" fill="none" stroke="url(#pulseGradient)" stroke-width="2" opacity="0.6">
            <animate attributeName="r" from="10" to="16" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          ` : ''}
        </svg>
      `;

      return L.divIcon({
        html: svgIcon,
        className: 'luxury-marker-svg',
        iconSize: [40, 52],
        iconAnchor: [20, 52],
        popupAnchor: [0, -48]
      });
    };

    const customIcon = createCustomIcon(false);
    const customIconNew = createCustomIcon(true);

    // Track existing and new marker IDs
    const existingMarkerIds = new Set(Object.keys(markersRef.current));
    const newMarkerIds = new Set();

    // Add or update markers
    places.forEach(place => {
      const id = place.id.toString();
      newMarkerIds.add(id);

      // Create custom popup content
      const popupContent = createCustomPopup(place);

      if (markersRef.current[id]) {
        // Update existing marker position and popup
        const marker = markersRef.current[id];
        marker.setLatLng([place.latitude, place.longitude]);

        if (marker.getPopup()) {
          marker.getPopup().setContent(popupContent);
        } else {
          marker.bindPopup(popupContent, {
            minWidth: 280,
            maxWidth: 280,
            autoPanPadding: [50, 50],
            autoPan: false, // Disable auto-panning to prevent infinite loops
            className: 'custom-popup-container'
          });
        }
      } else {
        // Choose icon based on whether it's a new discovery
        const iconToUse = place.isDiscovered ? customIconNew : customIcon;

        // Create new marker
        const newMarker = L.marker([place.latitude, place.longitude], {
          icon: iconToUse,
          autoPanOnFocus: false
        }).bindPopup(popupContent, {
          minWidth: 280,
          maxWidth: 280,
          autoPanPadding: [50, 50],
          autoPan: false, // Disable auto-panning to prevent infinite loops
          className: 'custom-popup-container'
        });

        // Add to map directly
        newMarker.addTo(mapRef.current);

        // Store reference to the marker
        markersRef.current[id] = newMarker;

        // Add entrance animation effect
        const markerElement = newMarker.getElement();
        if (markerElement) {
          markerElement.style.transform += ' scale(0)';
          setTimeout(() => {
            if (markerElement) {
              markerElement.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
              markerElement.style.transform = markerElement.style.transform.replace(' scale(0)', ' scale(1)');
            }
          }, 10);
        }

        // Override the default behavior to prevent recentering and add details button behavior
        if (!newMarker._hasCustomClickHandler) {
          // Store original click handler
          const originalOnClick = newMarker._origonClick || newMarker._onMouseClick;
          newMarker._origonClick = originalOnClick;

          // Override click handler
          newMarker._onMouseClick = function (e) {
            // Keep track of the current center before opening the popup
            const map = mapRef.current;
            if (!map) return;

            const currentCenter = map.getCenter();

            // Call the original click handler to open popup
            originalOnClick.call(this, e);

            // Set the center back to where it was before
            requestAnimationFrame(() => {
              if (map) {
                map.setView(currentCenter, map.getZoom(), {
                  animate: false
                });
              }
            });
          };

          newMarker._hasCustomClickHandler = true;

          // Add popup open handler to attach button click events
          newMarker.on('popupopen', function () {
            setTimeout(() => {
              // Details button
              const detailsButton = document.querySelector(`.popup-details-button[data-place-id="${place.id}"]`);
              if (detailsButton && !detailsButton.hasEventListener) {
                detailsButton.hasEventListener = true;
                detailsButton.addEventListener('click', function (e) {
                  e.stopPropagation();
                  if (onSelectPlace) {
                    detailsButton.style.backgroundColor = '#d82f47';
                    detailsButton.style.transform = 'scale(0.95)';

                    setTimeout(() => {
                      onSelectPlace(place);
                      newMarker.closePopup();
                    }, 150);
                  }
                });
              }

              // Book button
              const bookButton = document.querySelector(`.popup-book-button[data-place-id="${place.id}"]`);
              if (bookButton && !bookButton.hasEventListener) {
                bookButton.hasEventListener = true;
                bookButton.addEventListener('click', function (e) {
                  e.stopPropagation();
                  setBookingPlace(place);
                  newMarker.closePopup();
                });
              }
            }, 50);
          });
        }
      }
    });

    // Remove markers that are no longer in the places array
    existingMarkerIds.forEach(id => {
      if (!newMarkerIds.has(id) && markersRef.current[id]) {
        // Remove the marker
        mapRef.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, mapReady, onSelectPlace]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="map" style={{ width: '100%', height: '100%' }} />

      {/* Manual discovery button */}
      {showDiscoverButton && !isDiscovering && (
        <button
          className="map-discover-button"
          onClick={handleDiscover}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span>Discover Luxury Places</span>
        </button>
      )}

      {/* Discovery overlay */}
      {isDiscovering && (
        <div className="discovering-overlay">
          <span>Discovering luxury places in this area...</span>
        </div>
      )}

      {/* Booking Modal */}
      {bookingPlace && (
        <BookingModal
          place={bookingPlace}
          onClose={() => setBookingPlace(null)}
          onConfirm={(booking) => {
            setBookingPlace(null);
            setShowBookingSuccess(true);
            setTimeout(() => setShowBookingSuccess(false), 5000);
          }}
        />
      )}

      {/* Booking Success Notification */}
      {showBookingSuccess && (
        <div className="booking-success-notification">
          <div className="success-icon">✓</div>
          <div>
            <div className="success-title">Booking Confirmed!</div>
            <div className="success-message">Your luxury stay has been reserved</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;