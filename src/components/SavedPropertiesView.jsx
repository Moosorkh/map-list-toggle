import React, { useState, useEffect } from 'react';
import './SavedPropertiesView.css';

const SavedPropertiesView = ({ onClose, onSelectProperty }) => {
    const [savedProperties, setSavedProperties] = useState([]);

    useEffect(() => {
        loadSavedProperties();
    }, []);

    const loadSavedProperties = () => {
        const saved = JSON.parse(localStorage.getItem('savedProperties') || '[]');
        // Sort by saved date, most recent first
        const sorted = saved.sort((a, b) =>
            new Date(b.savedDate) - new Date(a.savedDate)
        );
        setSavedProperties(sorted);
    };

    const removeSaved = (propertyId) => {
        const updated = savedProperties.filter(p => p.id !== propertyId);
        localStorage.setItem('savedProperties', JSON.stringify(updated));
        setSavedProperties(updated);
    };

    const clearAll = () => {
        const confirmed = window.confirm('Are you sure you want to remove all saved properties?');
        if (confirmed) {
            localStorage.removeItem('savedProperties');
            setSavedProperties([]);
        }
    };

    const handlePropertyClick = (property) => {
        if (onSelectProperty) {
            onSelectProperty(property);
            onClose();
        }
    };

    return (
        <div className="saved-overlay" onClick={onClose}>
            <div className="saved-modal" onClick={(e) => e.stopPropagation()}>
                <div className="saved-header">
                    <h2>❤️ Saved Properties</h2>
                    <button className="saved-close" onClick={onClose} aria-label="Close saved properties">
                        ×
                    </button>
                </div>

                <div className="saved-content">
                    {savedProperties.length === 0 ? (
                        <div className="empty-saved">
                            <div className="empty-icon">🤍</div>
                            <h3>No saved properties yet</h3>
                            <p>Start saving your favorite luxury properties by clicking the heart icon!</p>
                        </div>
                    ) : (
                        <>
                            <div className="saved-actions">
                                <span className="saved-count">{savedProperties.length} {savedProperties.length === 1 ? 'property' : 'properties'} saved</span>
                                <button className="clear-all-saved-button" onClick={clearAll}>
                                    Clear All
                                </button>
                            </div>

                            <div className="saved-grid">
                                {savedProperties.map(property => (
                                    <div key={property.id} className="saved-property-card" onClick={() => handlePropertyClick(property)}>
                                        <div className="saved-property-image-container">
                                            <img src={property.imageUrl} alt={property.name} className="saved-property-image" />
                                            <button
                                                className="remove-saved-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSaved(property.id);
                                                }}
                                                aria-label="Remove from saved"
                                            >
                                                ❤️
                                            </button>
                                        </div>
                                        <div className="saved-property-info">
                                            <h3>{property.name}</h3>
                                            <p className="saved-property-description">{property.description}</p>
                                            <div className="saved-property-footer">
                                                <span className="saved-property-price">${property.price.toLocaleString()}/night</span>
                                                <span className="saved-date">Saved {new Date(property.savedDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SavedPropertiesView;
