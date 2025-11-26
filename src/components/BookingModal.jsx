import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BookingsService from '../services/BookingsService';
import './BookingModal.css';

const BookingModal = ({ place, onClose, onConfirm }) => {
    const { token } = useAuth();
    const [bookingData, setBookingData] = useState({
        checkIn: '',
        checkOut: '',
        guests: 1,
        name: '',
        email: '',
        phone: ''
    });

    const [step, setStep] = useState(1); // 1: dates, 2: details, 3: confirmation
    const [errors, setErrors] = useState({});

    const validateStep1 = () => {
        const newErrors = {};
        if (!bookingData.checkIn) newErrors.checkIn = 'Check-in date is required';
        if (!bookingData.checkOut) newErrors.checkOut = 'Check-out date is required';
        if (new Date(bookingData.checkIn) >= new Date(bookingData.checkOut)) {
            newErrors.checkOut = 'Check-out must be after check-in';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};
        if (!bookingData.name.trim()) newErrors.name = 'Name is required';
        if (!bookingData.email.trim()) newErrors.email = 'Email is required';
        if (!/\S+@\S+\.\S+/.test(bookingData.email)) newErrors.email = 'Invalid email format';
        if (!bookingData.phone.trim()) newErrors.phone = 'Phone is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const handleConfirmBooking = async () => {
        // Calculate nights and total
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const pricePerNight = place.price || 0;
        const total = nights * pricePerNight;

        const booking = {
            place: {
                id: place.id,
                name: place.name,
                imageUrl: place.imageUrl || place.image_url,
                price: pricePerNight,
            },
            ...bookingData,
            nights,
            total,
            status: 'confirmed',
        };

        // Save booking (syncs to backend if authenticated)
        await BookingsService.addBooking(booking, token);

        onConfirm(booking);
    };

    const calculateNights = () => {
        if (bookingData.checkIn && bookingData.checkOut) {
            const checkIn = new Date(bookingData.checkIn);
            const checkOut = new Date(bookingData.checkOut);
            return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        }
        return 0;
    };

    const calculateTotal = () => {
        const nights = calculateNights();
        const pricePerNight = place.price || 0;
        return nights * pricePerNight;
    };

    return (
        <div className="booking-modal-overlay" onClick={onClose}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                <button className="booking-close" onClick={onClose} aria-label="Close booking">
                    ×
                </button>

                {/* Progress indicator */}
                <div className="booking-progress">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <div className="step-number">1</div>
                        <div className="step-label">Dates</div>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <div className="step-number">2</div>
                        <div className="step-label">Details</div>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                        <div className="step-number">3</div>
                        <div className="step-label">Confirm</div>
                    </div>
                </div>

                {/* Property info header */}
                <div className="booking-property-header">
                    <img src={place.imageUrl} alt={place.name} className="booking-property-image" />
                    <div className="booking-property-info">
                        <h2>{place.name}</h2>
                        <p>${place.price.toLocaleString()} per night</p>
                    </div>
                </div>

                {/* Step 1: Dates */}
                {step === 1 && (
                    <div className="booking-step">
                        <h3>Select your dates</h3>
                        <div className="form-group">
                            <label htmlFor="checkIn">Check-in</label>
                            <input
                                id="checkIn"
                                type="date"
                                value={bookingData.checkIn}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
                                className={errors.checkIn ? 'error' : ''}
                            />
                            {errors.checkIn && <span className="error-message">{errors.checkIn}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="checkOut">Check-out</label>
                            <input
                                id="checkOut"
                                type="date"
                                value={bookingData.checkOut}
                                min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                                className={errors.checkOut ? 'error' : ''}
                            />
                            {errors.checkOut && <span className="error-message">{errors.checkOut}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="guests">Number of guests</label>
                            <select
                                id="guests"
                                value={bookingData.guests}
                                onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) })}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                    <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                                ))}
                            </select>
                        </div>

                        {calculateNights() > 0 && (
                            <div className="booking-summary">
                                <div className="summary-row">
                                    <span>{calculateNights()} nights × ${place.price.toLocaleString()}</span>
                                    <span>${calculateTotal().toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Guest details */}
                {step === 2 && (
                    <div className="booking-step">
                        <h3>Your information</h3>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                value={bookingData.name}
                                onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                                placeholder="John Doe"
                                className={errors.name ? 'error' : ''}
                            />
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={bookingData.email}
                                onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                                placeholder="john@example.com"
                                className={errors.email ? 'error' : ''}
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                type="tel"
                                value={bookingData.phone}
                                onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                                className={errors.phone ? 'error' : ''}
                            />
                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                    <div className="booking-step booking-confirmation">
                        <div className="confirmation-icon">✓</div>
                        <h3>Confirm your booking</h3>

                        <div className="confirmation-details">
                            <div className="detail-row">
                                <span className="detail-label">Property:</span>
                                <span className="detail-value">{place.name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Check-in:</span>
                                <span className="detail-value">{new Date(bookingData.checkIn).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Check-out:</span>
                                <span className="detail-value">{new Date(bookingData.checkOut).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Guests:</span>
                                <span className="detail-value">{bookingData.guests}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Nights:</span>
                                <span className="detail-value">{calculateNights()}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Name:</span>
                                <span className="detail-value">{bookingData.name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{bookingData.email}</span>
                            </div>
                            <div className="detail-row total-row">
                                <span className="detail-label">Total:</span>
                                <span className="detail-value total-amount">${calculateTotal().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="booking-actions">
                    {step > 1 && step < 3 && (
                        <button className="btn-secondary" onClick={() => setStep(step - 1)}>
                            Back
                        </button>
                    )}
                    {step < 3 ? (
                        <button className="btn-primary" onClick={handleNext}>
                            {step === 2 ? 'Review Booking' : 'Continue'}
                        </button>
                    ) : (
                        <button className="btn-primary btn-confirm" onClick={handleConfirmBooking}>
                            Confirm Booking
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
