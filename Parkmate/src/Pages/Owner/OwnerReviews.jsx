import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../Context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'
import '../Users/Reviews.scss'

const OwnerReviews = () => {
  const { owner } = useAuth()
  const [reviews, setReviews] = useState([])
  const [ownerLots, setOwnerLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterLot, setFilterLot] = useState('')
  const [filterRating, setFilterRating] = useState('')

  const fetchOwnerLots = useCallback(async () => {
    try {
      const response = await api.get('/lots/')
      setOwnerLots(response.data)
    } catch (error) {
      console.error('Error fetching lots:', error)
      toast.error('Failed to load parking lots')
    }
  }, [])

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      let url = '/reviews/'
      const params = new URLSearchParams()

      if (filterLot) {
        params.append('lot_id', filterLot)
      }

      if (params.toString()) {
        url += '?' + params.toString()
      }

      const response = await api.get(url)
      setReviews(response.data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [filterLot])

  useEffect(() => {
    if (owner) {
      fetchOwnerLots()
      fetchReviews()
    }
  }, [owner, fetchOwnerLots, fetchReviews])

  const filteredReviews = reviews.filter((review) => {
    if (filterRating && review.rating !== parseInt(filterRating)) {
      return false
    }
    return true
  })

  const getAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  if (loading) {
    return <div className="reviews-root"><p>Loading reviews...</p></div>
  }

  return (
    <div className="reviews-root">
      <h2>📊 Customer Reviews</h2>
      <p className="muted">View and manage reviews from customers for your parking lots</p>

      {/* Stats */}
      {reviews.length > 0 && (
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{reviews.length}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{getAverageRating()}⭐</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="lot-filter">Filter by Lot</label>
          <select
            id="lot-filter"
            value={filterLot}
            onChange={(e) => {
              console.log('DEBUG: Lot filter changed from', filterLot, 'to', e.target.value, 'Type:', typeof e.target.value)
              setFilterLot(e.target.value)
            }}
            className="form-control"
          >
            <option value="">All Lots</option>
            {ownerLots.map((lot) => (
              <option key={lot.lot_id} value={lot.lot_id}>
                {lot.lot_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="rating-filter">Filter by Rating</label>
          <select
            id="rating-filter"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="form-control"
          >
            <option value="">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 stars)</option>
            <option value="3">⭐⭐⭐ (3 stars)</option>
            <option value="2">⭐⭐ (2 stars)</option>
            <option value="1">⭐ (1 star)</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      {filteredReviews.length > 0 ? (
        <div className="table-container">
          <table className="reviews-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Parking Lot</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.rev_id} className={`rating-${review.rating}`}>
                  <td className="customer-name">
                    {review.user_detail?.firstname} {review.user_detail?.lastname}
                  </td>
                  <td className="lot-name">{review.lot_detail?.lot_name}</td>
                  <td className="rating">
                    <span className="stars">{'⭐'.repeat(review.rating)}</span>
                    <span className="count">{review.rating}/5</span>
                  </td>
                  <td className="review-text" title={review.review_desc}>
                    {review.review_desc.substring(0, 60)}
                    {review.review_desc.length > 60 ? '...' : ''}
                  </td>
                  <td className="date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>📝 No reviews found for your parking lots.</p>
        </div>
      )}

      {/* Legend */}
      <div className="legend">
        <p>💡 <strong>Note:</strong> Reviews are read-only. Customer reviews help you understand and improve your service.</p>
      </div>
    </div>
  )
}

export default OwnerReviews
