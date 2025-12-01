import React, { useEffect, useState } from 'react'
import { useAuth } from '../../Context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'
import '../Users/Reviews.scss'

const AdminReviews = () => {
  const { admin } = useAuth()
  const [reviews, setReviews] = useState([])
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterLot, setFilterLot] = useState('')
  const [filterRating, setFilterRating] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  // Fetch all lots and reviews
  useEffect(() => {
    if (admin) {
      fetchAllLots()
      fetchAllReviews()
    }
  }, [admin])

  // Re-fetch when filters change
  useEffect(() => {
    if (admin) {
      fetchAllReviews()
    }
  }, [filterLot, sortBy])

  const fetchAllLots = async () => {
    try {
      const response = await api.get('/lots/')
      setLots(response.data)
    } catch (error) {
      console.error('Error fetching lots:', error)
      toast.error('Failed to load parking lots')
    }
  }

  const fetchAllReviews = async () => {
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
  }

  const getSortedAndFilteredReviews = () => {
    let filtered = reviews

    // Apply rating filter
    if (filterRating) {
      filtered = filtered.filter((review) => review.rating === parseInt(filterRating))
    }

    // Apply sorting
    if (sortBy === 'rating-high') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'rating-low') {
      filtered = [...filtered].sort((a, b) => a.rating - b.rating)
    } else if (sortBy === 'oldest') {
      filtered = [...filtered].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    }
    // 'recent' is already the default order from backend

    return filtered
  }

  const getStatistics = () => {
    if (reviews.length === 0) return null

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let totalRating = 0

    reviews.forEach((review) => {
      ratingCounts[review.rating]++
      totalRating += review.rating
    })

    return {
      total: reviews.length,
      average: (totalRating / reviews.length).toFixed(1),
      ratingCounts
    }
  }

  const stats = getStatistics()
  const displayReviews = getSortedAndFilteredReviews()

  if (loading) {
    return <div className="reviews-root"><p>Loading reviews...</p></div>
  }

  return (
    <div className="reviews-root">
      <h2>📊 All Platform Reviews</h2>
      <p className="muted">Monitor and manage all customer reviews across the platform</p>

      {/* Statistics */}
      {stats && (
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.average}⭐</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.ratingCounts[5]}</div>
            <div className="stat-label">5-Star Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.ratingCounts[1]}</div>
            <div className="stat-label">1-Star Reviews</div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <div className="rating-distribution">
          <h3>Rating Distribution</h3>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="distribution-item">
              <span className="label">{'⭐'.repeat(rating)} ({rating})</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{
                    width: `${(stats.ratingCounts[rating] / stats.total) * 100}%`
                  }}
                />
              </div>
              <span className="count">{stats.ratingCounts[rating]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="lot-filter">Filter by Lot</label>
          <select
            id="lot-filter"
            value={filterLot}
            onChange={(e) => setFilterLot(e.target.value)}
            className="form-control"
          >
            <option value="">All Lots</option>
            {lots.map((lot) => (
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

        <div className="filter-group">
          <label htmlFor="sort">Sort By</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-control"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="rating-high">Highest Rating</option>
            <option value="rating-low">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      {displayReviews.length > 0 ? (
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
              {displayReviews.map((review) => (
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
          <p>📝 No reviews found with the current filters.</p>
        </div>
      )}

      {/* Legend */}
      <div className="legend">
        <p>💡 <strong>Note:</strong> This dashboard shows all reviews across the platform. Monitor trends and ensure service quality.</p>
      </div>
    </div>
  )
}

export default AdminReviews
