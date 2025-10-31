import React, { useState, useEffect } from 'react';
import './BookingsView.css';

const BookingsView = ({ onClose }) => {
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = () => {
        const savedBookings = JSON.parse(localStorage.getItem('luxuryBookings') || '[]');
        // Sort by booking date, most recent first
        const sorted = savedBookings.sort((a, b) =>
            new Date(b.bookingDate) - new Date(a.bookingDate)
        );
        setBookings(sorted);
    };

    const cancelBooking = (bookingId) => {
        const confirmed = window.confirm('Are you sure you want to cancel this booking?');
        if (confirmed) {
            const updatedBookings = bookings.filter(b => b.id !== bookingId);
            localStorage.setItem('luxuryBookings', JSON.stringify(updatedBookings));
            setBookings(updatedBookings);
        }
    };

    const clearAllBookings = () => {
        const confirmed = window.confirm('Are you sure you want to clear all bookings?');
        if (confirmed) {
            localStorage.removeItem('luxuryBookings');
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
                    {bookings.length === 0 ? (
                        <div className="empty-bookings">
                            <div className="empty-icon">📅</div>
                            <h3>No bookings yet</h3>
                            <p>Start exploring luxury properties and make your first booking!</p>
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
                                        <img src={booking.placeImage} alt={booking.placeName} className="booking-image" />
                                        <div className="booking-details">
                                            <h3>{booking.placeName}</h3>
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
                                                    <span className="info-value">${booking.total.toLocaleString()}</span>
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
