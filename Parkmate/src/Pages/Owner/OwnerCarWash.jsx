import React, { useState, useEffect } from 'react'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import { Calendar, MapPin, DollarSign, Users, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { toast } from 'react-toastify'
import './OwnerCarWash.css'

const OwnerCarWash = () => {
  const { owner } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, confirmed, in_progress, completed, cancelled
  const [stats, setStats] = useState({
    total_bookings: 0,
    completed_bookings: 0,
    pending_payments: 0,
    total_revenue: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [ownerLots, setOwnerLots] = useState([])
  const [filterLot, setFilterLot] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Fetch owner's car wash bookings and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch owner's lots for filter dropdown
        const lotsResponse = await parkingService.getLots()
        setOwnerLots(lotsResponse)

        // Fetch bookings
        const bookingsResponse = await parkingService.getOwnerCarWashBookings()
        if (bookingsResponse) {
          console.log('📋 Owner car wash bookings:', bookingsResponse)
          setBookings(bookingsResponse.results || bookingsResponse)
        }

        // Fetch dashboard stats
        const statsResponse = await parkingService.getOwnerCarWashDashboard()
        if (statsResponse) {
          console.log('📊 Car wash dashboard stats:', statsResponse)
          setStats(statsResponse)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load car wash data')
      } finally {
        setLoading(false)
      }
    }

    if (owner) {
      fetchData()
    }
  }, [owner])

  // Filter and search bookings
  const filteredBookings = bookings.filter((booking) => {
    if (filter !== 'all' && booking.status !== filter) return false
    if (filterLot && booking.lot_detail?.lot_id !== parseInt(filterLot)) return false
    
    // Apply date filter
    if (dateFrom || dateTo) {
      const bookingDate = new Date(booking.scheduled_date || booking.created_at)
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        if (bookingDate < fromDate) return false
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (bookingDate > toDate) return false
      }
    }
    
    if (searchTerm) {
      return (
        booking.user_detail.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user_detail.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.lot_detail?.lot_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.carwash_booking_id.toString().includes(searchTerm)
      )
    }
    return true
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

  // Format service type
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

  // Handle payment verification
  const handleVerifyPayment = async (bookingId) => {
    try {
      const response = await parkingService.verifyCarWashPayment(bookingId)
      if (response) {
        toast.success('Cash payment verified successfully!')
        await refreshBookings()
        // Switch to 'all' filter to keep showing the booking
        setFilter('all')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast.error(error.message || 'Failed to verify payment')
    }
  }

  // Handle booking confirmation
  const handleConfirmBooking = async (bookingId) => {
    try {
      const response = await parkingService.confirmCarWashBooking(bookingId)
      if (response) {
        toast.success('Booking confirmed successfully!')
        await refreshBookings()
        // Switch to 'all' filter to keep showing the booking
        setFilter('all')
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
      toast.error(error.message || 'Failed to confirm booking')
    }
  }

  // Refresh bookings list
  const refreshBookings = async () => {
    try {
      const bookingsResponse = await parkingService.getOwnerCarWashBookings()
      if (bookingsResponse) {
        setBookings(bookingsResponse.results || bookingsResponse)
      }
    } catch (error) {
      console.error('Error refreshing bookings:', error)
    }
  }

  // Handle status updates (start, complete)
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const response = await parkingService.updateCarWashBookingStatus(bookingId, newStatus)
      if (response) {
        toast.success(`Booking ${newStatus} successfully!`)
        await refreshBookings()
        // Switch to 'all' filter to keep showing the booking
        setFilter('all')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error(error.message || `Failed to update booking to ${newStatus}`)
    }
  }

  return (
    <div className="owner-carwash-container">
      {/* Header */}
      <div className="carwash-page-header">
        <h1>🚗 Car Wash Bookings Management</h1>
        <p>Manage and monitor all car wash services for your parking lots</p>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Bookings</h3>
              <p className="stat-value">{stats.total_bookings}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon completed">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>Completed</h3>
              <p className="stat-value">{stats.completed_bookings}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>Pending Payment</h3>
              <p className="stat-value">{stats.pending_payments}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon revenue">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Revenue</h3>
              <p className="stat-value">₹{stats.total_revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        {/* Lot Filter Dropdown */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>🏢 Filter by Lot</label>
          <select
            value={filterLot}
            onChange={(e) => setFilterLot(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: '#fff'
            }}
          >
            <option value="">All Lots</option>
            {ownerLots.map((lot) => (
              <option key={lot.lot_id} value={lot.lot_id}>
                {lot.lot_name}
              </option>
            ))}
          </select>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search by customer name, lot, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Date Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>📅 From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>📅 To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none'
              }}
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
              style={{
                padding: '10px 14px',
                marginTop: '22px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Clear Dates
            </button>
          )}
        </div>

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
            className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            In Progress ({bookings.filter((b) => b.status === 'in_progress').length})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({bookings.filter((b) => b.status === 'completed').length})
          </button>
          <button
            className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled ({bookings.filter((b) => b.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading car wash bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>
            {filter === 'all' && searchTerm === ''
              ? 'No car wash bookings yet'
              : 'No bookings match your filters'}
          </p>
        </div>
      ) : (
        <div className="bookings-table-wrapper">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Service Type</th>
                <th>Location</th>
                <th>Scheduled Date</th>
                <th>Price</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => {
                // Debug logging
                console.log(`Booking #${booking.carwash_booking_id}:`, {
                  payment_status: booking.payment_status,
                  payment_method: booking.payment_method,
                  status: booking.status,
                  shouldShowVerify: booking.payment_status === 'pending' && booking.payment_method === 'Cash',
                  shouldShowConfirm: booking.payment_status === 'verified' && booking.status === 'pending',
                  shouldShowStart: booking.status === 'confirmed',
                  shouldShowComplete: booking.status === 'in_progress'
                })
                
                return (
                <tr key={booking.carwash_booking_id}>
                  <td className="booking-id">#{booking.carwash_booking_id}</td>
                  <td>
                    <div className="customer-info">
                      <p className="customer-name">
                        {booking.user_detail.firstname} {booking.user_detail.lastname}
                      </p>
                      <p className="customer-phone">{booking.user_detail.phone}</p>
                    </div>
                  </td>
                  <td>{formatServiceType(booking.service_type)}</td>
                  <td>
                    {booking.lot_detail ? (
                      <div className="location-info">
                        <p>{booking.lot_detail.lot_name}</p>
                        <p className="city">{booking.lot_detail.city}</p>
                      </div>
                    ) : (
                      <span className="no-location">No location</span>
                    )}
                  </td>
                  <td>{formatDateTime(booking.scheduled_time)}</td>
                  <td className="price">₹{booking.price}</td>
                  <td>
                    <span className={`payment-method-badge ${booking.payment_method.toLowerCase()}`}>
                      {booking.payment_method}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                      {formatServiceType(booking.status)}
                    </span>
                  </td>
                  <td>
                    <span className={`payment-badge ${getPaymentStatusClass(booking.payment_status)}`}>
                      {booking.payment_status === 'verified' ? '✓ Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="actions">
                    {/* CASH: Verify button for pending cash payments */}
                    {booking.payment_status === 'pending' && booking.payment_method === 'Cash' && (
                      <button
                        className="btn-action verify"
                        onClick={() => handleVerifyPayment(booking.carwash_booking_id)}
                        title="Verify cash payment"
                      >
                        Verify
                      </button>
                    )}
                    
                    {/* Confirm booking after payment verified (Cash/UPI/CC) */}
                    {booking.payment_status === 'verified' && booking.status === 'pending' && (
                      <button
                        className="btn-action confirm"
                        onClick={() => handleConfirmBooking(booking.carwash_booking_id)}
                        title="Confirm booking"
                      >
                        Confirm
                      </button>
                    )}
                    
                    {/* Start service after booking confirmed */}
                    {booking.status === 'confirmed' && (
                      <button
                        className="btn-action start"
                        onClick={() => handleStatusUpdate(booking.carwash_booking_id, 'in_progress')}
                        title="Start car wash service"
                      >
                        Start
                      </button>
                    )}
                    
                    {/* Mark complete after service started */}
                    {booking.status === 'in_progress' && (
                      <button
                        className="btn-action complete"
                        onClick={() => handleStatusUpdate(booking.carwash_booking_id, 'completed')}
                        title="Mark service as complete"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default OwnerCarWash
