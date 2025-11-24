/**
 * SavedPropertiesService - Manages saved properties with backend sync
 * Supports both authenticated (backend) and guest (localStorage) modes
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';
const STORAGE_KEY = 'savedProperties';

/**
 * Get all saved properties for the current user
 * If authenticated, fetches from backend; otherwise from localStorage
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<Array>} Array of saved property objects
 */
export const getSavedProperties = async (token = null) => {
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/saved`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Saved properties API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SavedPropertiesService: Failed to fetch from backend:', error);
      return getLocalSavedProperties();
    }
  }

  return getLocalSavedProperties();
};

/**
 * Get saved properties from localStorage (fallback or guest mode)
 * @returns {Array} Array of saved property objects
 */
export const getLocalSavedProperties = () => {
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
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<boolean>} True if property is saved
 */
export const isPropertySaved = async (propertyId, token = null) => {
  const saved = await getSavedProperties(token);
  return saved.some(p => p.id === propertyId);
};

/**
 * Add a property to saved list
 * If authenticated, saves to backend and localStorage; otherwise just localStorage
 * @param {Object} property - Property object to save
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<boolean>} Success status
 */
export const saveProperty = async (property, token = null) => {
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/saved`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ placeId: property.id, place: property }),
      });

      if (!response.ok) {
        throw new Error(`Saved properties API error: ${response.status}`);
      }

      saveLocalProperty(property);
      return true;
    } catch (error) {
      console.error('SavedPropertiesService: Failed to save to backend:', error);
      saveLocalProperty(property);
      return false;
    }
  }

  saveLocalProperty(property);
  return true;
};

/**
 * Save property to localStorage
 * @param {Object} property - Property to save locally
 */
const saveLocalProperty = (property) => {
  try {
    const saved = getLocalSavedProperties();
    
    // Don't add duplicates
    if (saved.some(p => p.id === property.id)) {
      return;
    }
    
    const newSaved = {
      ...property,
      savedAt: new Date().toISOString(),
    };
    
    saved.push(newSaved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    
    // Dispatch storage event for same-tab updates
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('SavedPropertiesService: Failed to save locally:', error);
  }
};

/**
 * Remove a property from saved list
 * @param {string} propertyId - ID of property to remove
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<boolean>} Success status
 */
export const unsaveProperty = async (propertyId, token = null) => {
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/saved/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Saved properties API error: ${response.status}`);
      }

      removeLocalProperty(propertyId);
      return true;
    } catch (error) {
      console.error('SavedPropertiesService: Failed to delete from backend:', error);
      removeLocalProperty(propertyId);
      return false;
    }
  }

  removeLocalProperty(propertyId);
  return true;
};

/**
 * Remove property from localStorage
 * @param {string} propertyId - ID of property to remove
 */
const removeLocalProperty = (propertyId) => {
  try {
    const saved = getLocalSavedProperties();
    const filtered = saved.filter(p => p.id !== propertyId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // Dispatch storage event for same-tab updates
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('SavedPropertiesService: Failed to remove locally:', error);
  }
};

/**
 * Toggle saved status of a property
 * @param {Object} property - Property object
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<boolean>} New saved status (true if now saved, false if unsaved)
 */
export const toggleSaveProperty = async (property, token = null) => {
  const saved = await isPropertySaved(property.id, token);
  
  if (saved) {
    await unsaveProperty(property.id, token);
    return false;
  } else {
    await saveProperty(property, token);
    return true;
  }
};

/**
 * Get count of saved properties
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<number>} Number of saved properties
 */
export const getSavedPropertiesCount = async (token = null) => {
  const saved = await getSavedProperties(token);
  return saved.length;
};

/**
 * Clear all saved properties
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<boolean>} Success status
 */
export const clearAllSavedProperties = async (token = null) => {
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/saved/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Saved properties API error: ${response.status}`);
      }
    } catch (error) {
      console.error('SavedPropertiesService: Failed to clear backend saved properties:', error);
    }
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('storage'));
    return true;
  } catch (error) {
    console.error('SavedPropertiesService: Failed to clear saved properties:', error);
    return false;
  }
};

/**
 * Sync localStorage saved properties to backend when user logs in
 * @param {string} token - Auth token
 * @returns {Promise<void>}
 */
export const syncSavedToBackend = async (token) => {
  const localSaved = getLocalSavedProperties();
  
  if (localSaved.length === 0) return;

  try {
    const response = await fetch(`${API_BASE}/saved/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: localSaved }),
    });

    if (response.ok) {
      console.log('SavedPropertiesService: Successfully synced local saved properties to backend');
    }
  } catch (error) {
    console.error('SavedPropertiesService: Failed to sync saved properties:', error);
  }
};

export default {
  getSavedProperties,
  getLocalSavedProperties,
  isPropertySaved,
  saveProperty,
  unsaveProperty,
  toggleSaveProperty,
  getSavedPropertiesCount,
  clearAllSavedProperties,
  syncSavedToBackend,
};
