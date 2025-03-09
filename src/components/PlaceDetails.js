import React from 'react';

const PlaceDetails = ({ place, onClose }) => {
  // Format price with commas
  const formattedPrice = place.price.toLocaleString();
  
  return (
    <div className="place-details-overlay">
      <div className="place-details-container">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="place-details-content">
          <img 
            src={place.imageUrl} 
            alt={place.name} 
            loading="lazy" // Add lazy loading
            className="place-details-image" 
          />
          
          <div className="place-details-info">
            <h2>{place.name}</h2>
            <p className="place-description">{place.description}</p>
            
            <div className="place-meta">
              <div className="price-tag">
                <strong>${formattedPrice}</strong> total before taxes
              </div>
              
              <div className="coordinates">
                <span>Latitude: {place.latitude.toFixed(4)}</span>
                <span>Longitude: {place.longitude.toFixed(4)}</span>
              </div>
              
              {place.isDiscovered && (
                <div className="discovery-badge">
                  Newly Discovered
                </div>
              )}
            </div>
            
            <div className="actions">
              <button className="action-button primary">Book Now</button>
              <button className="action-button secondary">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetails;