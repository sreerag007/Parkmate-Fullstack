import React, { useEffect, useState } from 'react'
import { useAuth } from '../../Context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'
import './Reviews.scss'

const StarRating = ({ value, onChange, readOnly = false }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`star ${star <= value ? 'filled' : ''}`}
          onClick={() => !readOnly && onChange(star)}
          disabled={readOnly}
          aria-label={`Rate ${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

const Reviews = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('add')
  const [reviews, setReviews] = useState([])
  const [allReviews, setAllReviews] = useState([])
  const [bookedLots, setBookedLots] = useState([])
  const [allLots, setAllLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [filterLotAll, setFilterLotAll] = useState('')
  const [filterRatingAll, setFilterRatingAll] = useState('')
  const [selectedReviewModal, setSelectedReviewModal] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const [formData, setFormData] = useState({
    lot: '',
    rating: 5,
    review_desc: ''
  })

  const [editFormData, setEditFormData] = useState({
    lot: '',
    rating: 5,
    review_desc: ''
  })

  // Fetch user's reviews and booked lots
  useEffect(() => {
    if (user) {
      fetchReviews()
      fetchBookedLots()
      fetchAllReviews()
    }
  }, [user])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await api.get('/reviews/?user_id=' + user.userId)
      setReviews(response.data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookedLots = async () => {
    try {
      const response = await api.get('/user-booked-lots/')
      setBookedLots(response.data)
    } catch (error) {
      console.error('Error fetching booked lots:', error)
      setBookedLots([])
    }
  }

  const fetchAllLots = async () => {
    try {
      const response = await api.get('/lots/')
      setAllLots(response.data)
    } catch (error) {
      console.error('Error fetching all lots:', error)
    }
  }

  const fetchAllReviews = async () => {
    try {
      const response = await api.get('/reviews/')
      setAllReviews(response.data)
    } catch (error) {
      console.error('Error fetching all reviews:', error)
      toast.error('Failed to load community reviews')
    }
  }

  const getFilteredAllReviews = () => {
    return allReviews.filter((review) => {
      const lotMatch = !filterLotAll || review.lot_detail?.lot_id === parseInt(filterLotAll)
      const ratingMatch = !filterRatingAll || review.rating === parseInt(filterRatingAll)
      return lotMatch && ratingMatch
    })
  }

  const _GET_AVERAGE_RATING = (lotId) => {
    const lotReviews = allReviews.filter((r) => r.lot_detail?.lot_id === lotId)
    if (lotReviews.length === 0) return 0
    const sum = lotReviews.reduce((acc, r) => acc + r.rating, 0)
    return (sum / lotReviews.length).toFixed(1)
  }

  const handleAddReview = async (e) => {
    e.preventDefault()
    
    if (!formData.lot) {
      toast.error('Please select a parking lot')
      return
    }
    
    if (!formData.review_desc.trim()) {
      toast.error('Please write a review')
      return
    }

    try {
      setSubmitting(true)
      
      const payload = {
        lot: parseInt(formData.lot),
        rating: parseInt(formData.rating),
        review_desc: formData.review_desc.trim()
      }

      await api.post('/reviews/', payload)
      
      toast.success('✅ Review posted successfully!')
      setFormData({ lot: '', rating: 5, review_desc: '' })
      fetchReviews()
    } catch (error) {
      console.error('Error posting review:', error)
      console.error('Error response:', error.response?.data)
      let errorMsg = 'Failed to post review'
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data
        } else if (error.response.data.detail) {
          errorMsg = error.response.data.detail
        } else if (error.response.data.lot) {
          errorMsg = Array.isArray(error.response.data.lot) ? error.response.data.lot[0] : error.response.data.lot
        } else if (error.response.data.rating) {
          errorMsg = Array.isArray(error.response.data.rating) ? error.response.data.rating[0] : error.response.data.rating
        } else if (error.response.data.review_desc) {
          errorMsg = Array.isArray(error.response.data.review_desc) ? error.response.data.review_desc[0] : error.response.data.review_desc
        } else {
          errorMsg = JSON.stringify(error.response.data)
        }
      }
      toast.error('❌ ' + errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditReview = (review) => {
    setEditingId(review.rev_id)
    setEditFormData({
      lot: review.lot,
      rating: review.rating,
      review_desc: review.review_desc
    })
    setShowEditModal(true)
  }

  const handleUpdateReview = async (e) => {
    e.preventDefault()
    
    if (!editFormData.review_desc.trim()) {
      toast.error('Please write a review')
      return
    }

    try {
      setSubmitting(true)
      
      const payload = {
        lot: parseInt(editFormData.lot),
        rating: parseInt(editFormData.rating),
        review_desc: editFormData.review_desc.trim()
      }

      await api.patch(`/reviews/${editingId}/`, payload)
      
      toast.success('✅ Review updated successfully!')
      setShowEditModal(false)
      setEditingId(null)
      fetchReviews()
    } catch (error) {
      console.error('Error updating review:', error)
      const errorMsg = error.response?.data?.detail || 'Failed to update review'
      toast.error('❌ ' + errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      await api.delete(`/reviews/${reviewId}/`)
      toast.success('✅ Review deleted successfully!')
      fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      const errorMsg = error.response?.data?.detail || 'Failed to delete review'
      toast.error('❌ ' + errorMsg)
    }
  }

  if (loading && reviews.length === 0 && activeTab === 'my-reviews') {
    return <div className="reviews-root"><p>Loading reviews...</p></div>
  }

  return (
    <div className="reviews-root">
      <h2>My Reviews</h2>
      <p className="muted">Share your experience with parking lots</p>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          ⭐ Add Review
        </button>
        <button
          className={`tab-btn ${activeTab === 'my-reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-reviews')}
        >
          💬 My Reviews ({reviews.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'all-reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('all-reviews')}
        >
          🌍 Community Reviews ({allReviews.length})
        </button>
      </div>

      {/* Add Review Tab */}
      {activeTab === 'add' && (
        <div className="tab-content">
          <div className="review-card">
            <h3>Share Your Experience</h3>
            {bookedLots.length === 0 ? (
              <div className="empty-state">
                <p>📭 No booked lots found. Book a parking slot to leave a review!</p>
              </div>
            ) : (
            <form onSubmit={handleAddReview}>
              <div className="form-group">
                <label htmlFor="lot">Select Parking Lot</label>
                <select
                  id="lot"
                  value={formData.lot}
                  onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                  className="form-control"
                >
                  <option value="">-- Choose a lot --</option>
                  {bookedLots.map((lot) => (
                    <option key={lot.lot_id} value={lot.lot_id}>
                      {lot.lot_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Rating</label>
                <StarRating
                  value={formData.rating}
                  onChange={(rating) => setFormData({ ...formData, rating })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="review">Your Review</label>
                <textarea
                  id="review"
                  value={formData.review_desc}
                  onChange={(e) => setFormData({ ...formData, review_desc: e.target.value })}
                  placeholder="Share your experience with this parking lot..."
                  className="form-control"
                  rows="5"
                  maxLength={500}
                />
                <small className="char-count">
                  {formData.review_desc.length}/500 characters
                </small>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? '⏳ Posting...' : '📤 Post Review'}
              </button>
            </form>
            )}
          </div>
        </div>
      )}

      {/* My Reviews Tab */}
      {activeTab === 'my-reviews' && (
        <div className="tab-content">
          {reviews.length > 0 ? (
            <div className="reviews-grid">
              {reviews.map((review) => (
                <div key={review.rev_id} className="review-item">
                  <div className="review-header">
                    <div className="review-info">
                      <h4>{review.lot_detail?.lot_name}</h4>
                      <div className="review-meta">
                        <span className="rating">
                          {'⭐'.repeat(review.rating)}
                        </span>
                        <span className="date">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="review-actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditReview(review)}
                        aria-label="Edit review"
                        title="Edit review"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteReview(review.rev_id)}
                        aria-label="Delete review"
                        title="Delete review"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="review-text">{review.review_desc}</p>
                  {review.updated_at !== review.created_at && (
                    <small className="edited">
                      (Edited {new Date(review.updated_at).toLocaleDateString()})
                    </small>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>📝 You haven't written any reviews yet. Share your experience!</p>
            </div>
          )}
        </div>
      )}

      {/* All Reviews Tab */}
      {activeTab === 'all-reviews' && (
        <div className="tab-content">
          <div className="all-reviews-section">
            {/* Filters */}
            <div className="filters-section">
              <div className="filter-group">
                <label htmlFor="filter-lot-all">Filter by Lot</label>
                <select
                  id="filter-lot-all"
                  value={filterLotAll}
                  onChange={(e) => setFilterLotAll(e.target.value)}
                  className="form-control"
                >
                  <option value="">All Lots</option>
                  {allLots.map((lot) => (
                    <option key={lot.lot_id} value={lot.lot_id}>
                      {lot.lot_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-rating-all">Filter by Rating</label>
                <select
                  id="filter-rating-all"
                  value={filterRatingAll}
                  onChange={(e) => setFilterRatingAll(e.target.value)}
                  className="form-control"
                >
                  <option value="">All Ratings</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                  <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                  <option value="3">⭐⭐⭐ 3 Stars</option>
                  <option value="2">⭐⭐ 2 Stars</option>
                  <option value="1">⭐ 1 Star</option>
                </select>
              </div>
            </div>

            {/* Reviews List */}
            {getFilteredAllReviews().length > 0 ? (
              <div className="all-reviews-list">
                {getFilteredAllReviews().map((review) => (
                  <div key={review.rev_id} className="review-card-all">
                    <div className="review-header-all">
                      <div>
                        <span className="rating-stars">
                          {'⭐'.repeat(review.rating)}
                        </span>
                        <span className="rating-text">{review.rating}/5</span>
                      </div>
                      <span className="lot-name-badge">
                        {review.lot_detail?.lot_name}
                      </span>
                    </div>

                    <div className="review-meta-all">
                      <span className="reviewer">
                        by {review.user_detail?.firstname} {review.user_detail?.lastname}
                      </span>
                      <span className="review-date">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="review-text-all">
                      {review.review_desc.length > 150
                        ? review.review_desc.substring(0, 150) + '...'
                        : review.review_desc}
                    </p>

                    {review.review_desc.length > 150 && (
                      <button
                        className="btn-read-more"
                        onClick={() => {
                          setSelectedReviewModal(review)
                          setShowReviewModal(true)
                        }}
                      >
                        Read More
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>🔍 No reviews found with the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      {showReviewModal && selectedReviewModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowReviewModal(false)
            setSelectedReviewModal(null)
          }}
        >
          <div
            className="modal-content modal-review-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Full Review</h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedReviewModal(null)
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="label">Lot:</span>
                <span className="value">{selectedReviewModal.lot_detail?.lot_name}</span>
              </div>

              <div className="detail-row">
                <span className="label">Reviewer:</span>
                <span className="value">
                  {selectedReviewModal.user_detail?.firstname}{' '}
                  {selectedReviewModal.user_detail?.lastname}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Rating:</span>
                <span className="value">
                  {'⭐'.repeat(selectedReviewModal.rating)} {selectedReviewModal.rating}/5
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">
                  {new Date(selectedReviewModal.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="detail-row full-width">
                <span className="label">Review:</span>
                <p className="review-full-text">{selectedReviewModal.review_desc}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedReviewModal(null)
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Review</h3>
              <button
                className="btn-close"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateReview}>
              <div className="form-group">
                <label>Rating</label>
                <StarRating
                  value={editFormData.rating}
                  onChange={(rating) => setEditFormData({ ...editFormData, rating })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-review">Your Review</label>
                <textarea
                  id="edit-review"
                  value={editFormData.review_desc}
                  onChange={(e) => setEditFormData({ ...editFormData, review_desc: e.target.value })}
                  className="form-control"
                  rows="5"
                  maxLength={500}
                />
                <small className="char-count">
                  {editFormData.review_desc.length}/500 characters
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? '⏳ Updating...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reviews
