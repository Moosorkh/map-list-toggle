/**
 * SavedPropertiesService - Manages saved properties persistence in localStorage
 * Centralizes all saved property operations
 */

const STORAGE_KEY = 'savedProperties';

/**
 * Get all saved properties from localStorage
 * @returns {Array} Array of saved property objects
 */
export const getSavedProperties = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('SavedPropertiesService: Failed to read saved properties:', error);
    return [];
  }
};

/**
 * Check if a property is saved
 * @param {string} propertyId - ID of property to check
 * @returns {boolean} True if property is saved
 */
export const isPropertySaved = (propertyId) => {
  const saved = getSavedProperties();
  return saved.some(p => p.id === propertyId);
};

/**
 * Add a property to saved list
 * @param {Object} property - Property object to save
 * @returns {Array} Updated array of saved properties
 */
export const saveProperty = (property) => {
  try {
    const saved = getSavedProperties();
    
    // Don't add duplicates
    if (saved.some(p => p.id === property.id)) {
      return saved;
    }
    
    const newSaved = {
      ...property,
      savedAt: new Date().toISOString(),
    };
    
    saved.push(newSaved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    
    // Dispatch storage event for same-tab updates
    window.dispatchEvent(new Event('storage'));
    
    return saved;
  } catch (error) {
    console.error('SavedPropertiesService: Failed to save property:', error);
    throw error;
  }
};

/**
 * Remove a property from saved list
 * @param {string} propertyId - ID of property to remove
 * @returns {Array} Updated array of saved properties
 */
export const unsaveProperty = (propertyId) => {
  try {
    const saved = getSavedProperties();
    const filtered = saved.filter(p => p.id !== propertyId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // Dispatch storage event for same-tab updates
    window.dispatchEvent(new Event('storage'));
    
    return filtered;
  } catch (error) {
    console.error('SavedPropertiesService: Failed to unsave property:', error);
    throw error;
  }
};

/**
 * Toggle saved status of a property
 * @param {Object} property - Property object
 * @returns {boolean} New saved status (true if now saved, false if unsaved)
 */
export const toggleSaveProperty = (property) => {
  if (isPropertySaved(property.id)) {
    unsaveProperty(property.id);
    return false;
  } else {
    saveProperty(property);
    return true;
  }
};

/**
 * Get count of saved properties
 * @returns {number} Number of saved properties
 */
export const getSavedPropertiesCount = () => {
  return getSavedProperties().length;
};

/**
 * Clear all saved properties
 * @returns {boolean} Success status
 */
export const clearAllSavedProperties = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('storage'));
    return true;
  } catch (error) {
    console.error('SavedPropertiesService: Failed to clear saved properties:', error);
    return false;
  }
};

export default {
  getSavedProperties,
  isPropertySaved,
  saveProperty,
  unsaveProperty,
  toggleSaveProperty,
  getSavedPropertiesCount,
  clearAllSavedProperties,
};
