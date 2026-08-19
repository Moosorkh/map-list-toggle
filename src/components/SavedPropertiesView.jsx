import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SavedPropertiesService from '../services/SavedPropertiesService';
import './SavedPropertiesView.css';
import { getPlacePrice, getPlacePriceLabel } from '../utils/price';
import { PLACEHOLDER_IMAGE } from '../config/constants';

const SavedPropertiesView = ({ onClose, onSelectProperty }) => {
    const { token } = useAuth();
    const [savedProperties, setSavedProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSavedProperties();
    }, [token]);

    const loadSavedProperties = async () => {
        setLoading(true);
        try {
            const saved = await SavedPropertiesService.getSavedProperties(token);
            // Sort by saved date, most recent first
            const sorted = saved.sort((a, b) =>
                new Date(b.savedAt || 0) - new Date(a.savedAt || 0)
            );
            setSavedProperties(sorted);
        } catch (error) {
            console.error('Failed to load saved properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeSaved = async (propertyId) => {
        await SavedPropertiesService.unsaveProperty(propertyId, token);
        await loadSavedProperties();
    };

    const clearAll = async () => {
        const confirmed = window.confirm('Are you sure you want to remove all saved properties?');
        if (confirmed) {
            await SavedPropertiesService.clearAllSavedProperties(token);
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
                    {loading ? (
                        <div className="saved-loading">Loading saved properties...</div>
                    ) : savedProperties.length === 0 ? (
                        <div className="empty-saved">
                            <div className="empty-icon">🤍</div>
                            <h3>No saved properties yet</h3>
                            <p>Start saving your favorite properties by clicking the heart icon!</p>
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
                                            <img
                                            src={property.imageUrl || PLACEHOLDER_IMAGE}
                                            alt={property.name}
                                            className="saved-property-image"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null; // avoid infinite retry loop
                                                e.currentTarget.src = PLACEHOLDER_IMAGE;
                                            }}
                                        />
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
                                                <span className="saved-property-price">{getPlacePriceLabel(property)}</span>
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
