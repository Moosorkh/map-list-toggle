import React from 'react';

const PlaceCard = ({ place, onClick, isSelected }) => {
  // Format price with commas
  const formattedPrice = place.price.toLocaleString();
  
  return (
    <div className="place-card-container" onClick={() => onClick && onClick(place)}>
      <div className={`place-card ${isSelected ? 'selected' : ''}`}>
        <div className="image-container">
          <img 
            src={place.imageUrl} 
            alt={place.name} 
            loading="lazy"
            className="place-image"
          />
          {place.isDiscovered && (
            <div className="new-badge">New</div>
          )}
        </div>
        
        <div className="place-content">
          <h3 className="place-title">{place.name}</h3>
          <p className="place-description">{place.description}</p>
          
          <div className="place-footer">
            <div className="place-price">
              <strong>${formattedPrice}</strong>
              <span className="price-period">total</span>
            </div>
            
            <button className="view-details-button">
              Details
            </button>
          </div>
        </div>

        {/* Component-specific styling without jsx attribute */}
        <style>{`
          .place-card-container {
            cursor: pointer;
          }
          
          .place-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            overflow: hidden;
            transition: all 0.3s;
            border: 1px solid rgba(0,0,0,0.04);
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          
          .place-card:hover {
            box-shadow: 0 6px 20px rgba(0,0,0,0.12);
            transform: translateY(-4px);
          }
          
          .place-card.selected {
            border: 2px solid #FF385C;
            box-shadow: 0 6px 20px rgba(255, 56, 92, 0.15);
          }
          
          .image-container {
            position: relative;
            height: 200px;
          }
          
          .place-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .new-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background-color: #FF385C;
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }
          
          .place-content {
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
          }
          
          .place-title {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 18px;
            line-height: 1.3;
            color: #222;
            font-weight: 600;
          }
          
          .place-description {
            margin-bottom: 16px;
            color: #555;
            font-size: 14px;
            line-height: 1.4;
            flex-grow: 1;
          }
          
          .place-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
            border-top: 1px solid #f0f0f0;
            padding-top: 16px;
          }
          
          .place-price {
            display: flex;
            flex-direction: column;
          }
          
          .place-price strong {
            font-size: 18px;
            color: #222;
          }
          
          .price-period {
            font-size: 12px;
            color: #777;
          }
          
          .view-details-button {
            background-color: transparent;
            border: 1px solid #FF385C;
            color: #FF385C;
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .view-details-button:hover {
            background-color: #FF385C;
            color: white;
          }
        `}</style>
      </div>
    </div>
  );
};

export default PlaceCard;