import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapmarker from '../public/assets/map-marker.png';

const MapView = ({ places }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: [33.6595, -117.9988], // Default to first place
        zoom: 10
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Setup the custom icon
    const customIcon = new L.Icon({
      iconUrl: mapmarker, // Path to  marker icon
      iconSize: [30, 45], // Size of the icon
      iconAnchor: [15, 45], // Point of the icon which will correspond to marker's location
      popupAnchor: [0, -45] // Point from which the popup should open relative to the iconAnchor
    });

    // Clear existing markers before adding new ones
    mapRef.current.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        mapRef.current.removeLayer(layer);
      }
    });

    // markers for each place with the custom icon
    places.forEach(place => {
      L.marker([place.latitude, place.longitude], { icon: customIcon }).addTo(mapRef.current)
        .bindPopup(`<div class="popup"><strong>${place.name}</strong><p>${place.description}</p><p>$${place.price}</p></div>`);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [places]);  // the effect runs when places change

  return <div id="map" style={{ height: "100vh" }} />;
};

export default MapView;
