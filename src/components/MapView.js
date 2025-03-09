import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapmarker from '../public/assets/map-marker.png';
import GeocodingService from '../services/GeocodingService';

const MapView = ({ places, onViewportChange, onDiscoverPlaces, onSelectPlace }) => {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [showDiscoverButton, setShowDiscoverButton] = useState(false);
  const currentBoundsRef = useRef(null);
  const currentCenterRef = useRef(null);
  const initializedRef = useRef(false);
  const popupEventsAttachedRef = useRef({});
  const isUpdatingViewportRef = useRef(false);
  
  // Initialize map - only runs once
  useEffect(() => {
    if (!mapRef.current) {
      console.log("Initializing map");
      
      // Center on first place by default, or average of all places
      const defaultCenter = places.length > 0 
        ? [places[0].latitude, places[0].longitude]
        : [34.0522, -118.2437]; // Los Angeles as default center
      
      // Create map with Google Maps-like style
      mapRef.current = L.map('map', {
        center: defaultCenter,
        zoom: 10,
        zoomControl: false,
        attributionControl: false
      });

      // Use a more Google Maps-like tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
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
      
      // Add custom CSS for popups if not already added
      if (!document.getElementById('custom-popup-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'custom-popup-styles';
        styleElement.textContent = `
          .custom-popup {
            width: 280px;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .popup-image-container {
            position: relative;
            height: 150px;
            overflow: hidden;
            border-radius: 8px 8px 0 0;
          }
          
          .popup-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s;
          }
          
          .popup-image:hover {
            transform: scale(1.03);
          }
          
          .popup-new-tag {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: #FF385C;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .popup-content {
            padding: 16px;
          }
          
          .popup-title {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
            color: #222;
          }
          
          .popup-description {
            margin: 0 0 12px 0;
            font-size: 13px;
            color: #555;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .popup-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
          }
          
          .popup-price {
            font-weight: 600;
            font-size: 15px;
            color: #222;
          }
          
          .popup-details-button {
            background-color: #FF385C;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .popup-details-button:hover {
            background-color: #e61e4d;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .popup-details-button:active {
            transform: translateY(0);
          }
          
          .leaflet-popup-content-wrapper {
            padding: 0;
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 3px 14px rgba(0,0,0,0.2);
          }
          
          .leaflet-popup-content {
            margin: 0;
            width: 280px !important;
          }
          
          .leaflet-popup-close-button {
            z-index: 10;
            color: white !important;
            opacity: 0.8;
            font-size: 20px !important;
            padding: 5px !important;
            text-shadow: 0 0 3px rgba(0,0,0,0.5);
            transition: opacity 0.2s;
          }
          
          .leaflet-popup-close-button:hover {
            opacity: 1;
            background: transparent !important;
          }
          
          /* Google Maps style marker shadow */
          .luxury-marker {
            filter: drop-shadow(0 5px 3px rgba(0,0,0,0.3));
          }
        `;
        document.head.appendChild(styleElement);
      }
      
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
        console.log("Cleaning up map");
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
            <span class="popup-price">$${formattedPrice}</span>
            <button class="popup-details-button" data-place-id="${place.id}">Details</button>
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
      } else {
        // No places found
        console.log('No places discovered in this area');
      }
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Helper function to find the closest parent element with a given class
  const findClosestParent = (element, className) => {
    let current = element;
    while (current) {
      if (current.classList && current.classList.contains(className)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  };
  
  // Update markers when places change - only the marker-specific logic
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    
    console.log("Updating markers");
    
    // Setup the custom icon with a luxury enhancement
    const customIcon = new L.Icon({
      iconUrl: mapmarker,
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -44],
      className: 'luxury-marker'
    });
    
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
        // Create new marker
        const newMarker = L.marker([place.latitude, place.longitude], { 
          icon: customIcon,
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
          newMarker._onMouseClick = function(e) {
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
          
          // Add popup open handler to attach details button click
          newMarker.on('popupopen', function() {
            setTimeout(() => {
              const button = document.querySelector(`.popup-details-button[data-place-id="${place.id}"]`);
              if (button && !button.hasEventListener) {
                button.hasEventListener = true; // Mark as having listener
                button.addEventListener('click', function(e) {
                  e.stopPropagation();
                  if (onSelectPlace) {
                    // Visual feedback when clicking
                    button.style.backgroundColor = '#d82f47';
                    button.style.transform = 'scale(0.95)';
                    
                    // Short delay for visual feedback before closing popup
                    setTimeout(() => {
                      onSelectPlace(place);
                      
                      // Find popup using DOM traversal instead of L.DomUtil.closest
                      let popupElement = button;
                      while (popupElement && !popupElement.classList.contains('leaflet-popup')) {
                        popupElement = popupElement.parentElement;
                      }
                      
                      if (popupElement) {
                        const closeButton = popupElement.querySelector('.leaflet-popup-close-button');
                        if (closeButton) {
                          closeButton.click();
                        }
                      } else {
                        // Fallback: try to close popup via the marker
                        newMarker.closePopup();
                      }
                    }, 150);
                  }
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
    
  }, [places, mapReady, onSelectPlace]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="map" style={{ width: '100%', height: '100%' }} />
      
      {/* Manual discovery button */}
      {showDiscoverButton && !isDiscovering && (
        <button 
          className="discover-button"
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
    </div>
  );
};

export default MapView;