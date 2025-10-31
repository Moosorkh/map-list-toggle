import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading luxury properties...' }) => {
    return (
        <div className="loading-spinner-container">
            <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </div>
            </div>
            <p className="loading-message">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
