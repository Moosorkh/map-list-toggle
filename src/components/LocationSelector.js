import React, { useState, useRef, useEffect } from 'react';

const LocationSelector = ({ locations, currentLocationId, onLocationChange, onDeleteLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currentLocation = locations.find(loc => loc.id === currentLocationId);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Hide selector if there are no locations or just one location
  if (!locations || locations.length <= 1) {
    return null;
  }
  
  const handleLocationClick = (locationId) => {
    onLocationChange(locationId);
    setIsOpen(false);
  };
  
  const handleDelete = (e, locationId) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (window.confirm('Are you sure you want to delete this location?')) {
      onDeleteLocation(locationId);
    }
  };
  
  // Format the date in a readable format
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="location-selector-container" ref={dropdownRef}>
      <div 
        className="location-selector-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="location-icon">📍</span>
        <span className="current-location">
          {currentLocation ? 
            `${currentLocation.name} (${currentLocation.places.length} ${currentLocation.places.length === 1 ? 'place' : 'places'})` : 
            'Select Location'}
        </span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      {isOpen && (
        <div className="location-dropdown">
          <div className="location-dropdown-title">Recent Locations</div>
          
          {locations.map(location => (
            <div 
              key={location.id} 
              className={`location-option ${location.id === currentLocationId ? 'active' : ''}`}
              onClick={() => handleLocationClick(location.id)}
            >
              <div className="location-option-info">
                <div className="location-name">
                  {location.name}
                </div>
                <div className="location-details">
                  <span className="place-count">
                    {location.places.length} {location.places.length === 1 ? 'place' : 'places'}
                  </span>
                  <span className="location-date">
                    {formatDate(location.dateUpdated)}
                  </span>
                </div>
              </div>
              
              {locations.length > 1 && (
                <button 
                  className="delete-location-button"
                  onClick={(e) => handleDelete(e, location.id)}
                  title="Delete location"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
  <style>{`
        .location-selector-container {
          position: relative;
          min-width: 220px;
          z-index: 1000;
        }
        
        .location-selector-header {
          display: flex;
          align-items: center;
          background-color: white;
          border-radius: 24px;
          padding: 8px 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .location-selector-header:hover {
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
        
        .location-icon {
          margin-right: 8px;
        }
        
        .current-location {
          flex: 1;
          font-weight: 500;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .dropdown-arrow {
          font-size: 10px;
          transition: transform 0.2s;
          margin-left: 8px;
          color: #777;
        }
        
        .dropdown-arrow.open {
          transform: rotate(180deg);
        }
        
        .location-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          max-height: 300px;
          overflow-y: auto;
          z-index: 1001;
        }
        
        .location-dropdown-title {
          padding: 12px 16px;
          font-weight: 600;
          font-size: 13px;
          color: #777;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .location-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .location-option:hover {
          background-color: #f5f5f5;
        }
        
        .location-option.active {
          background-color: #FFF5F5;
          border-left: 3px solid #FF385C;
        }
        
        .location-option-info {
          flex: 1;
          overflow: hidden;
        }
        
        .location-name {
          font-weight: 500;
          font-size: 14px;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .location-details {
          display: flex;
          font-size: 12px;
          color: #777;
        }
        
        .place-count {
          margin-right: 8px;
        }
        
        .location-date {
          color: #999;
        }
        
        .delete-location-button {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background-color: #FF385C;
          color: white;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin-left: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .location-option:hover .delete-location-button {
          opacity: 1;
        }
  `}</style>
    </div>
  );
};

export default LocationSelector;