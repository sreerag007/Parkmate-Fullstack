import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import './LotCard.scss';

const LotCard = ({ lot }) => {
  const navigate = useNavigate();

  const handleViewSlots = () => {
    // Navigate to the lot booking page (DynamicLot component)
    navigate(`/lots/${lot.lot_id}`);
  };

  const ratingLabel =
    lot.avg_rating === null || lot.avg_rating === undefined
      ? 'New'
      : `${lot.avg_rating.toFixed(1)} / 5`;

  // Build image URL with proper fallback
  const buildImageUrl = () => {
    // Use lot_image_url from serializer if available (absolute URL)
    if (lot.lot_image_url) {
      return lot.lot_image_url;
    }

    // Fallback to lot_image if URL not available
    if (lot.lot_image) {
      // If already a full URL, use it
      if (lot.lot_image.startsWith('http')) {
        return lot.lot_image;
      }

      // If relative URL, construct the full URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const baseUrl = apiBaseUrl.replace('/api', ''); // Remove /api to get base URL
      return `${baseUrl}${lot.lot_image}`;
    }

    // Use placeholder if no image
    return '/images/lot-placeholder.jpg';
  };

  const imageUrl = buildImageUrl();

  return (
    <div className="lot-card" onClick={handleViewSlots}>
      <div className="lot-card__image-wrapper">
        <img
          src={imageUrl}
          alt={lot.lot_name}
          className="lot-card__image"
          onError={(e) => {
            // Silently use placeholder on error, don't log warnings
            e.target.src = '/images/lot-placeholder.jpg';
          }}
        />

        <div className="lot-card__rating">
          <Star className="lot-card__rating-icon" />
          <span>{ratingLabel}</span>
        </div>
      </div>

      <div className="lot-card__body">
        <div className="lot-card__info">
          <div className="lot-card__name">{lot.lot_name}</div>
          <div className="lot-card__address">
            {lot.streetname}, {lot.city}
          </div>
          <div className="lot-card__slots">
            {lot.available_slots} / {lot.total_slots} slots available
          </div>
          <div className="lot-card__services" style={{
            fontSize: '0.85rem',
            color: '#059669',
            marginTop: '6px',
            fontWeight: '500'
          }}>
            {lot.provides_carwash 
              ? '🚗 Parking, 🧽 Add-on Car Wash'
              : '🚗 Parking Only'
            }
          </div>
        </div>

        <button
          className="lot-card__button"
          onClick={(e) => {
            e.stopPropagation();
            handleViewSlots();
          }}
        >
          View Slots
        </button>
      </div>
    </div>
  );
};

export default LotCard;
