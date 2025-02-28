import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapmarker from '../public/assets/map-marker.png';
import GeocodingService from '../services/GeocodingService';

const MapView = ({ places, onViewportChange, onDiscoverPlaces }) => {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const lastBoundsRef = useRef(null);
  
  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      // Center on first place by default, or average of all places
      const defaultCenter = places.length > 0 
        ? [places[0].latitude, places[0].longitude]
        : [33.6595, -117.9988];
      
      mapRef.current = L.map('map', {
        center: defaultCenter,
        zoom: 10
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
      
      // Add viewport change events
      mapRef.current.on('moveend', handleViewportChange);
      mapRef.current.on('zoomend', handleViewportChange);
      
      setMapReady(true);
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.off('moveend', handleViewportChange);
        mapRef.current.off('zoomend', handleViewportChange);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Handle viewport changes
  const handleViewportChange = async () => {
    if (!mapRef.current || !onViewportChange) return;
    
    const bounds = mapRef.current.getBounds();
    const visiblePlaces = places.filter(place => 
      bounds.contains([place.latitude, place.longitude])
    );
    
    // Get current center and zoom
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    
    // Prepare the bounds object
    const boundsObj = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
    
    // Pass visible places and map state back to parent
    onViewportChange({
      visiblePlaces,
      mapState: {
        center: [center.lat, center.lng],
        zoom,
        bounds: boundsObj
      }
    });
    
    // Check if we should discover places in this area
    // Only trigger discovery when we've moved significantly and at an appropriate zoom level
    if (onDiscoverPlaces && zoom >= 9 && !isDiscovering) {
      const currentBoundsString = JSON.stringify(boundsObj);
      const lastBoundsString = lastBoundsRef.current ? JSON.stringify(lastBoundsRef.current) : null;
      
      // If we have no visible places and we're at a good zoom level, or we've moved significantly
      const shouldDiscover = (visiblePlaces.length === 0 && zoom >= 10) || 
                            (lastBoundsString && currentBoundsString !== lastBoundsString);
      
      if (shouldDiscover) {
        setIsDiscovering(true);
        
        try {
          // Get place name for the center of the map
          const centerData = await GeocodingService.reverseGeocode(center.lat, center.lng);
          
          // Discover places in this area
          const discoveredPlaces = await GeocodingService.discoverPlacesInArea(boundsObj);
          
          if (discoveredPlaces && discoveredPlaces.length > 0) {
            onDiscoverPlaces(discoveredPlaces, centerData);
          }
        } catch (error) {
          console.error('Error discovering places:', error);
        } finally {
          setIsDiscovering(false);
          lastBoundsRef.current = boundsObj;
        }
      }
    }
  };

  // Update markers when places change
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    // Setup the custom icon
    const customIcon = new L.Icon({
      iconUrl: mapmarker,
      iconSize: [30, 45],
      iconAnchor: [15, 45],
      popupAnchor: [0, -45]
    });
    
    // Remove markers that are no longer in the places array
    Object.keys(markersRef.current).forEach(id => {
      if (!places.find(place => place.id.toString() === id)) {
        mapRef.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });
    
    // Add new markers or update existing ones
    places.forEach(place => {
      const id = place.id.toString();
      const popupContent = `<div class="popup">
        <strong>${place.name}</strong>
        <p>${place.description}</p>
        <p>$${place.price}</p>
      </div>`;
      
      if (markersRef.current[id]) {
        // Update existing marker popup
        markersRef.current[id].getPopup().setContent(popupContent);
      } else {
        // Create new marker
        markersRef.current[id] = L.marker([place.latitude, place.longitude], { icon: customIcon })
          .addTo(mapRef.current)
          .bindPopup(popupContent);
          
        // Add click event to marker
        markersRef.current[id].on('click', () => {
          // You can implement a click handler here
          // For example, highlight the corresponding list item
        });
      }
    });
    
    // Initial viewport report after markers are updated
    handleViewportChange();
  }, [places, mapReady]);

  return (
    <div>
      <div id="map" style={{ height: "100vh" }} />
      {isDiscovering && (
        <div className="discovering-overlay">
          <span>Discovering places in this area...</span>
        </div>
      )}
    </div>
  );
};

export default MapView;