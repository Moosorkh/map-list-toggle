import React from 'react';

const PlaceSwitcher = ({ locations, currentLocationId, onSwitchLocation }) => {
  if (!locations || locations.length <= 1) return null;
  
  return (
    <div className="place-switcher">
      <h3>Saved Locations</h3>
      <div className="location-cards">
        {locations.map(location => (
          <div 
            key={location.id}
            className={`location-card ${location.id === currentLocationId ? 'active' : ''}`}
            onClick={() => onSwitchLocation(location.id)}
          >
            <h4>{location.name}</h4>
            <div className="location-meta">
              <span>{location.places.length} places</span>
              <span className="location-date">
                {new Date(location.dateAdded).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaceSwitcher;