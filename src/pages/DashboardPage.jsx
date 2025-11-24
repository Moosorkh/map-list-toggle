import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBookings } from '../services/BookingsService';
import { getSavedProperties } from '../services/SavedPropertiesService';
import PlaceCard from '../components/PlaceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('saved');

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const [fetchedBookings, fetchedSaved] = await Promise.all([
          getBookings(token),
          getSavedProperties(token),
        ]);

        setBookings(fetchedBookings);
        setSavedProperties(fetchedSaved);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewProperty = (property) => {
    navigate('/', { state: { selectedPlace: property } });
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <div className="dashboard-user-info">
              <div className="dashboard-avatar">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1>Welcome back, {user?.name || user?.email?.split('@')[0]}</h1>
                <p>{user?.email}</p>
              </div>
            </div>
            <div className="dashboard-header-actions">
              <button
                className="dashboard-btn secondary"
                onClick={() => navigate('/')}
              >
                Browse Properties
              </button>
              <button
                className="dashboard-btn logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <span>🤍</span>
            Saved Properties
            <span className="tab-count">{savedProperties.length}</span>
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <span>📅</span>
            My Bookings
            <span className="tab-count">{bookings.length}</span>
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === 'saved' && (
            <div className="dashboard-section">
              {savedProperties.length === 0 ? (
                <div className="dashboard-empty">
                  <div className="empty-icon">🤍</div>
                  <h3>No Saved Properties Yet</h3>
                  <p>Start exploring and save your favorite properties</p>
                  <button
                    className="dashboard-btn primary"
                    onClick={() => navigate('/')}
                  >
                    Browse Properties
                  </button>
                </div>
              ) : (
                <div className="dashboard-grid">
                  {savedProperties.map((property) => (
                    <PlaceCard
                      key={property.id}
                      place={property}
                      onSelectPlace={handleViewProperty}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="dashboard-section">
              {bookings.length === 0 ? (
                <div className="dashboard-empty">
                  <div className="empty-icon">📅</div>
                  <h3>No Bookings Yet</h3>
                  <p>Book your first stay to see it here</p>
                  <button
                    className="dashboard-btn primary"
                    onClick={() => navigate('/')}
                  >
                    Find Properties
                  </button>
                </div>
              ) : (
                <div className="bookings-list">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="booking-card">
                      <div className="booking-property">
                        {booking.place?.imageUrl && (
                          <img
                            src={booking.place.imageUrl}
                            alt={booking.place.name}
                            className="booking-image"
                          />
                        )}
                        <div className="booking-details">
                          <h3>{booking.place?.name || 'Property'}</h3>
                          <p className="booking-dates">
                            {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                          </p>
                          <p className="booking-guests">
                            {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="booking-meta">
                        <div className="booking-price">
                          ${booking.place?.price?.toLocaleString() || 0}/night
                        </div>
                        <div className="booking-status">Confirmed</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
