import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BookingsService from '../services/BookingsService';
import './BookingsView.css';

const BookingsView = ({ onClose }) => {
    const { token } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBookings();
    }, [token]);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const savedBookings = await BookingsService.getBookings(token);
            // Sort by creation date, most recent first
            const sorted = savedBookings.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setBookings(sorted);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async (bookingId) => {
        const confirmed = window.confirm('Are you sure you want to cancel this booking?');
        if (confirmed) {
            await BookingsService.removeBooking(bookingId, token);
            await loadBookings();
        }
    };

    const clearAllBookings = async () => {
        const confirmed = window.confirm('Are you sure you want to clear all bookings?');
        if (confirmed) {
            await BookingsService.clearAllBookings(token);
            setBookings([]);
        }
    };

    return (
        <div className="bookings-overlay" onClick={onClose}>
            <div className="bookings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="bookings-header">
                    <h2>My Bookings</h2>
                    <button className="bookings-close" onClick={onClose} aria-label="Close bookings">
                        ×
                    </button>
                </div>

                <div className="bookings-content">
                    {loading ? (
                        <div className="bookings-loading">Loading bookings...</div>
                    ) : bookings.length === 0 ? (
                        <div className="empty-bookings">
                            <div className="empty-icon">📅</div>
                            <h3>No bookings yet</h3>
                            <p>Start exploring properties and make your first booking!</p>
                        </div>
                    ) : (
                        <>
                            <div className="bookings-actions">
                                <span className="bookings-count">{bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}</span>
                                <button className="clear-all-button" onClick={clearAllBookings}>
                                    Clear All
                                </button>
                            </div>

                            <div className="bookings-list">
                                {bookings.map(booking => (
                                    <div key={booking.id} className="booking-item">
                                        <img src={booking.place?.imageUrl} alt={booking.place?.name} className="booking-image" />
                                        <div className="booking-details">
                                            <h3>{booking.place?.name || 'Property'}</h3>
                                            <div className="booking-info">
                                                <div className="info-row">
                                                    <span className="info-label">Check-in:</span>
                                                    <span className="info-value">{new Date(booking.checkIn).toLocaleDateString()}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Check-out:</span>
                                                    <span className="info-value">{new Date(booking.checkOut).toLocaleDateString()}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Guests:</span>
                                                    <span className="info-value">{booking.guests}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Nights:</span>
                                                    <span className="info-value">{booking.nights}</span>
                                                </div>
                                                <div className="info-row total">
                                                    <span className="info-label">Total:</span>
                                                    <span className="info-value">${booking.total?.toLocaleString() || 0}</span>
                                                </div>
                                            </div>
                                            <div className="booking-meta">
                                                <span className="booking-status">✓ Confirmed</span>
                                                <span className="booking-date">
                                                    Booked {new Date(booking.bookingDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="cancel-button"
                                            onClick={() => cancelBooking(booking.id)}
                                            aria-label="Cancel booking"
                                        >
                                            Cancel
                                        </button>
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

export default BookingsView;
