import React from 'react';

const LocationSelector = ({ locations, currentLocationId, onLocationChange, onDeleteLocation }) => {
  if (!locations || locations.length <= 1) return null;
  
  const handleChange = (e) => {
    onLocationChange(e.target.value);
  };
  
  const handleDelete = (e, locationId) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (window.confirm('Are you sure you want to delete this location?')) {
      onDeleteLocation(locationId);
    }
  };
  
  return (
    <div className="location-selector-container">
      <label htmlFor="location-selector">Region:</label>
      <select 
        id="location-selector" 
        value={currentLocationId || ''} 
        onChange={handleChange}
        className="location-selector"
      >
        {locations.map(location => (
          <option key={location.id} value={location.id}>
            {location.name} ({location.places.length} places)
          </option>
        ))}
      </select>
      
      {locations.length > 1 && currentLocationId && (
        <button 
          className="delete-location-button"
          onClick={(e) => handleDelete(e, currentLocationId)}
          title="Delete current location"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default LocationSelector;