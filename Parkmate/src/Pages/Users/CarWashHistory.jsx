import React, { useState, useEffect } from 'react'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import { Calendar, MapPin, DollarSign, Clock, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import './CarWashHistory.css'

const CarWashHistory = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, confirmed, completed, cancelled

  // Fetch user's car wash bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        console.log('🔍 Fetching car wash bookings for user:', user)
        const response = await parkingService.getUserCarWashBookings()
        console.log('✅ Car wash bookings response:', response)
        if (response) {
          console.log('📋 User car wash bookings:', response)
          setBookings(response.results || response)
        }
      } catch (error) {
        console.error('❌ Error fetching bookings:', error)
        console.error('❌ Error details:', {
          message: error.message,
          response: error.response,
          request: error.request,
          config: error.config
        })
        
        if (error.response) {
          // Server responded with error status
          toast.error(`Failed to load bookings: ${error.response.status} ${error.response.statusText}`)
        } else if (error.request) {
          // Request was made but no response
          toast.error('No response from server. Please check your connection.')
        } else {
          // Something else happened
          toast.error('Failed to load car wash bookings')
        }
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchBookings()
    } else {
      console.warn('⚠️ User not logged in, skipping car wash bookings fetch')
      setLoading(false)
    }
  }, [user])

  // Filter bookings based on status
  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true
    return booking.status === filter
  })

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-pending'
      case 'confirmed':
        return 'badge-confirmed'
      case 'in_progress':
        return 'badge-in-progress'
      case 'completed':
        return 'badge-completed'
      case 'cancelled':
        return 'badge-cancelled'
      default:
        return 'badge-pending'
    }
  }

  // Get payment status badge color
  const getPaymentStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'payment-pending'
      case 'verified':
        return 'payment-verified'
      case 'failed':
        return 'payment-failed'
      default:
        return 'payment-pending'
    }
  }

  // Format service type for display
  const formatServiceType = (serviceType) => {
    return serviceType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Format date/time
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Handle cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await parkingService.cancelCarWashBooking(bookingId)
        toast.success('Booking cancelled successfully')
        // Refresh bookings list
        const response = await parkingService.getUserCarWashBookings()
        setBookings(response.results || response)
      } catch (error) {
        console.error('Error cancelling booking:', error)
        toast.error('Failed to cancel booking')
      }
    }
  }

  return (
    <div className="carwash-history-container">
      <div className="history-header">
        <h1>🚗 My Car Wash Bookings</h1>
        <p>View and manage your car wash service bookings</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({bookings.length})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({bookings.filter((b) => b.status === 'pending').length})
        </button>
        <button
          className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setFilter('confirmed')}
        >
          Confirmed ({bookings.filter((b) => b.status === 'confirmed').length})
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({bookings.filter((b) => b.status === 'completed').length})
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>
            {filter === 'all'
              ? 'No car wash bookings yet. Book a service now!'
              : `No ${filter} bookings found.`}
          </p>
        </div>
      ) : (
        <div className="bookings-grid">
          {filteredBookings.map((booking) => (
            <div key={booking.carwash_booking_id} className="booking-card">
              <div className="card-header">
                <div className="service-info">
                  <h3>{formatServiceType(booking.service_type)}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                    {formatServiceType(booking.status)}
                  </span>
                </div>
                <span className={`payment-badge ${getPaymentStatusClass(booking.payment_status)}`}>
                  💳 {booking.payment_status === 'verified' ? 'Paid' : 'Pending'}
                </span>
              </div>

              <div className="card-content">
                <div className="info-row">
                  <Calendar className="icon" />
                  <div>
                    <label>Scheduled Date</label>
                    <p>{formatDateTime(booking.scheduled_time)}</p>
                  </div>
                </div>

                {booking.lot_detail && (
                  <div className="info-row">
                    <MapPin className="icon" />
                    <div>
                      <label>Location</label>
                      <p>{booking.lot_detail.lot_name}</p>
                    </div>
                  </div>
                )}

                <div className="info-row">
                  <DollarSign className="icon" />
                  <div>
                    <label>Amount</label>
                    <p className="amount">₹{booking.price}</p>
                  </div>
                </div>

                <div className="info-row">
                  <Clock className="icon" />
                  <div>
                    <label>Payment Method</label>
                    <p>{booking.payment_method}</p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="info-row">
                    <label>Notes</label>
                    <p className="notes">{booking.notes}</p>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <div className="booking-meta">
                  <span className="booking-id">ID: #{booking.carwash_booking_id}</span>
                  <span className="booking-date">
                    Booked on {new Date(booking.booking_time).toLocaleDateString()}
                  </span>
                </div>

                {booking.status === 'pending' && (
                  <button
                    className="btn-cancel-booking"
                    onClick={() => handleCancelBooking(booking.carwash_booking_id)}
                  >
                    <Trash2 size={16} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CarWashHistory
