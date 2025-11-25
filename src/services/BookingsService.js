/**
 * BookingsService - Manages booking persistence with backend sync
 * Supports both authenticated (backend) and guest (localStorage) modes
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';
const STORAGE_KEY = 'hospitalityBookings';

/**
 * Get all bookings for the current user
 * If authenticated, fetches from backend; otherwise from localStorage
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<Array>} Array of booking objects
 */
export const getBookings = async (token = null) => {
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/me/bookings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Bookings API error: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('BookingsService: Failed to fetch from backend:', error);
      return getLocalBookings();
    }
  }

  return getLocalBookings();
};

/**
 * Get bookings from localStorage (fallback or guest mode)
 * @returns {Array} Array of booking objects
 */
export const getLocalBookings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('BookingsService: Failed to read bookings:', error);
    return [];
  }
};

/**
 * Add a new booking
 * If authenticated, saves to backend and localStorage; otherwise just localStorage
 * @param {Object} booking - Booking object to add
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<Object>} Created booking object
 */
export const addBooking = async (booking, token = null) => {
  const bookingData = {
    ...booking,
    id: booking.id || `booking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: booking.createdAt || new Date().toISOString(),
  };

  if (token) {
    try {
      const response = await fetch(`${API_BASE}/me/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error(`Bookings API error: ${response.status}`);
      }

      const savedBooking = await response.json();
      const bookingWithId = savedBooking.id ? savedBooking : { ...savedBooking, ...bookingData };
      
      // Also save to localStorage as cache
      saveLocalBooking(bookingWithId);
      
      return savedBooking;
    } catch (error) {
      console.error('BookingsService: Failed to save to backend, saving locally:', error);
      saveLocalBooking(bookingData);
      return bookingData;
    }
  }

  saveLocalBooking(bookingData);
  return bookingData;
};

/**
 * Save booking to localStorage
 * @param {Object} booking - Booking to save locally
 */
const saveLocalBooking = (booking) => {
  try {
    const bookings = getLocalBookings();
    bookings.push(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    
    // Dispatch storage event for same-tab updates
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('BookingsService: Failed to save locally:', error);
  }
};

/**
 * Remove a booking by ID
 * @param {string} bookingId - ID of booking to remove
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<boolean>} Success status
 */
export const removeBooking = async (bookingId, token = null) => {
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/me/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Bookings API error: ${response.status}`);
      }

      removeLocalBooking(bookingId);
      return true;
    } catch (error) {
      console.error('BookingsService: Failed to delete from backend:', error);
      removeLocalBooking(bookingId);
      return false;
    }
  }

  removeLocalBooking(bookingId);
  return true;
};

/**
 * Remove booking from localStorage
 * @param {string} bookingId - ID of booking to remove
 */
const removeLocalBooking = (bookingId) => {
  try {
    const bookings = getLocalBookings();
    const filtered = bookings.filter(b => b.id !== bookingId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // Dispatch storage event for same-tab updates
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('BookingsService: Failed to remove locally:', error);
  }
};

/**
 * Get count of bookings
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<number>} Number of bookings
 */
export const getBookingsCount = async (token = null) => {
  const bookings = await getBookings(token);
  return bookings.length;
};

/**
 * Clear all bookings
 * @param {string|null} token - Auth token (optional)
 * @returns {Promise<boolean>} Success status
 */
export const clearAllBookings = async (token = null) => {
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/bookings/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Bookings API error: ${response.status}`);
      }
    } catch (error) {
      console.error('BookingsService: Failed to clear backend bookings:', error);
    }
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('storage'));
    return true;
  } catch (error) {
    console.error('BookingsService: Failed to clear bookings:', error);
    return false;
  }
};

/**
 * Sync localStorage bookings to backend when user logs in
 * @param {string} token - Auth token
 * @returns {Promise<void>}
 */
export const syncBookingsToBackend = async (token) => {
  const localBookings = getLocalBookings();
  
  if (localBookings.length === 0) return;

  try {
    const response = await fetch(`${API_BASE}/bookings/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookings: localBookings }),
    });

    if (response.ok) {
      console.log('BookingsService: Successfully synced local bookings to backend');
    }
  } catch (error) {
    console.error('BookingsService: Failed to sync bookings:', error);
  }
};

export default {
  getBookings,
  getLocalBookings,
  addBooking,
  removeBooking,
  getBookingsCount,
  clearAllBookings,
  syncBookingsToBackend,
};
