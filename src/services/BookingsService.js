/**
 * BookingsService - Manages booking persistence in localStorage
 * Centralizes all booking-related storage operations
 */

const STORAGE_KEY = 'luxuryBookings'; // Keep key name for backwards compatibility

/**
 * Get all bookings from localStorage
 * @returns {Array} Array of booking objects
 */
export const getBookings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('BookingsService: Failed to read bookings:', error);
    return [];
  }
};

/**
 * Add a new booking to localStorage
 * @param {Object} booking - Booking object to add
 * @returns {Array} Updated array of all bookings
 */
export const addBooking = (booking) => {
  try {
    const bookings = getBookings();
    const newBooking = {
      ...booking,
      id: booking.id || `booking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: booking.createdAt || new Date().toISOString(),
    };
    
    bookings.push(newBooking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    
    // Dispatch storage event for same-tab updates
    window.dispatchEvent(new Event('storage'));
    
    return bookings;
  } catch (error) {
    console.error('BookingsService: Failed to add booking:', error);
    throw error;
  }
};

/**
 * Remove a booking by ID
 * @param {string} bookingId - ID of booking to remove
 * @returns {Array} Updated array of remaining bookings
 */
export const removeBooking = (bookingId) => {
  try {
    const bookings = getBookings();
    const filtered = bookings.filter(b => b.id !== bookingId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // Dispatch storage event for same-tab updates
    window.dispatchEvent(new Event('storage'));
    
    return filtered;
  } catch (error) {
    console.error('BookingsService: Failed to remove booking:', error);
    throw error;
  }
};

/**
 * Get count of bookings
 * @returns {number} Number of bookings
 */
export const getBookingsCount = () => {
  return getBookings().length;
};

/**
 * Clear all bookings
 * @returns {boolean} Success status
 */
export const clearAllBookings = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('storage'));
    return true;
  } catch (error) {
    console.error('BookingsService: Failed to clear bookings:', error);
    return false;
  }
};

export default {
  getBookings,
  addBooking,
  removeBooking,
  getBookingsCount,
  clearAllBookings,
};
