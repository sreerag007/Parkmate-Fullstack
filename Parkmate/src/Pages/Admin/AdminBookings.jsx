import React, { useState, useEffect } from 'react'
import parkingService from '../../services/parkingService'
import api from '../../services/api'
import './Admin.scss'

const AdminBookings = () => {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [selectedBooking, setSelectedBooking] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [cancellingBookingId, setCancellingBookingId] = useState(null)

    useEffect(() => {
        fetchBookings()
    }, [])

    const fetchBookings = async () => {
        try {
            setLoading(true)
            const data = await parkingService.getBookings()
            setBookings(data || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching bookings:', err)
            setError('Failed to load bookings')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (bookingId, newStatus) => {
        try {
            setActionLoading(true)
            console.log(`📝 Changing booking ${bookingId} status to ${newStatus}...`)
            
            await api.patch(`/bookings/${bookingId}/`, { 
                status: newStatus 
            })
            console.log(`✅ Booking ${bookingId} status changed to ${newStatus}`)
            
            if (newStatus.toLowerCase() === 'cancelled') {
                console.log(`✅ Slot associated with booking ${bookingId} should now be AVAILABLE`)
            }
            
            setBookings(bookings.map(b => 
                b.booking_id === bookingId ? { ...b, status: newStatus } : b
            ))
            if (selectedBooking?.booking_id === bookingId) {
                setSelectedBooking({ ...selectedBooking, status: newStatus })
            }
            
            const message = newStatus.toLowerCase() === 'cancelled' 
                ? `Booking cancelled! The slot is now available.`
                : `Booking status changed to ${newStatus}!`
            
            setSuccessMessage(message)
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            console.error('❌ Error updating booking status:', err)
            console.error('❌ Error response:', err.response?.data)
            setError('Failed to update booking status: ' + (err.response?.data?.detail || err.message))
            setTimeout(() => setError(null), 4000)
        } finally {
            setActionLoading(false)
        }
    }

    const handleCancelBooking = async (bookingId) => {
        setCancellingBookingId(bookingId)
        setShowCancelConfirm(true)
    }

    const confirmCancelBooking = async () => {
        try {
            setActionLoading(true)
            console.log(`🗑️ Admin cancelling booking ${cancellingBookingId}...`)
            
            const response = await api.patch(`/bookings/${cancellingBookingId}/`, { 
                status: 'cancelled'
            })
            console.log(`✅ Booking ${cancellingBookingId} cancelled successfully`, response)
            console.log(`✅ Associated slot status should now be AVAILABLE`)
            
            setBookings(bookings.map(b => 
                b.booking_id === cancellingBookingId ? { ...b, status: 'cancelled' } : b
            ))
            if (selectedBooking?.booking_id === cancellingBookingId) {
                setSelectedBooking({ ...selectedBooking, status: 'cancelled' })
                setShowDetailModal(false)
            }
            setShowCancelConfirm(false)
            setCancellingBookingId(null)
            setSuccessMessage('Booking cancelled successfully! The slot is now available for other users.')
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            console.error('❌ Error cancelling booking:', err)
            console.error('❌ Error response:', err.response?.data)
            setError('Failed to cancel booking: ' + (err.response?.data?.detail || err.message))
            setTimeout(() => setError(null), 4000)
        } finally {
            setActionLoading(false)
        }
    }

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking)
        setShowDetailModal(true)
    }

    const handleCloseDetailModal = () => {
        setShowDetailModal(false)
        setSelectedBooking(null)
    }

    const filteredBookings = bookings.filter(booking => {
        const searchLower = searchTerm.toLowerCase()
        const userName = `${booking.user_read?.firstname || ''} ${booking.user_read?.lastname || ''}`.toLowerCase()
        const lotName = `${booking.lot_detail?.lot_name || ''}`.toLowerCase()
        const vehicleNumber = `${booking.vehicle_number || ''}`.toLowerCase()
        
        const matchesSearch = userName.includes(searchLower) || 
                             lotName.includes(searchLower) || 
                             vehicleNumber.includes(searchLower)
        
        const matchesStatus = filterStatus === 'all' || booking.status?.toLowerCase() === filterStatus.toLowerCase()
        
        return matchesSearch && matchesStatus
    })

    const bookedCount = bookings.filter(b => b.status?.toLowerCase() === 'booked').length
    const completedCount = bookings.filter(b => b.status?.toLowerCase() === 'completed').length
    const cancelledCount = bookings.filter(b => b.status?.toLowerCase() === 'cancelled').length

    return (
        <div className="admin-page">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '24px' }}>
                    <div>
                        <h1>Manage Bookings</h1>
                        <p>Total: {bookings.length} | Booked: {bookedCount} | Completed: {completedCount} | Cancelled: {cancelledCount}</p>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by user, lot, or vehicle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            width: '300px',
                            maxWidth: '100%'
                        }}
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            width: '150px'
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="booked">Booked</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {successMessage && (
                <div className="alert alert-success">
                    <span className="alert-icon">Success</span>
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">Error</span>
                    <span>{error}</span>
                </div>
            )}

            {showCancelConfirm && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowCancelConfirm(false)}>
                    <div className="modal-card delete-confirm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Cancel Booking?</h2>
                            <button 
                                className="close-btn" 
                                onClick={() => !actionLoading && setShowCancelConfirm(false)}
                                disabled={actionLoading}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '32px' }}>
                            <p style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '24px' }}>
                                Are you sure you want to cancel this booking? This action cannot be undone.
                            </p>
                            <div style={{ 
                                padding: '16px', 
                                backgroundColor: '#fef2f2', 
                                borderRadius: '8px', 
                                borderLeft: '4px solid #ef4444',
                                marginBottom: '24px'
                            }}>
                                <p style={{ margin: 0, color: '#991b1b', fontSize: '0.95rem' }}>
                                    ⚠️ The booking status will be changed to CANCELLED
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={() => setShowCancelConfirm(false)}
                                disabled={actionLoading}
                            >
                                Keep Booking
                            </button>
                            <button 
                                className="btn-danger"
                                onClick={confirmCancelBooking}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Cancelling...' : 'Yes, Cancel Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDetailModal && selectedBooking && (
                <div className="modal-overlay" onClick={handleCloseDetailModal}>
                    <div className="modal-card booking-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Booking Details</h2>
                            <button className="close-btn" onClick={handleCloseDetailModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="booking-detail-section">
                                <h3>User Information</h3>
                                <div className="detail-row">
                                    <span className="detail-label">Name:</span>
                                    <span className="detail-value">{selectedBooking.user_read?.firstname} {selectedBooking.user_read?.lastname}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Vehicle Number:</span>
                                    <span className="detail-value">{selectedBooking.vehicle_number}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Vehicle Type:</span>
                                    <span className="detail-value">{selectedBooking.slot_read?.vehicle_type}</span>
                                </div>
                            </div>

                            <div className="booking-detail-section">
                                <h3>Parking Details</h3>
                                <div className="detail-row">
                                    <span className="detail-label">Lot Name:</span>
                                    <span className="detail-value">{selectedBooking.lot_detail?.lot_name}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Slot ID:</span>
                                    <span className="detail-value">{selectedBooking.slot_read?.slot_id}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Booking Type:</span>
                                    <span className="detail-value">{selectedBooking.booking_type}</span>
                                </div>
                            </div>

                            <div className="booking-detail-section">
                                <h3>Booking Information</h3>
                                <div className="detail-row">
                                    <span className="detail-label">Booking Date:</span>
                                    <span className="detail-value">{new Date(selectedBooking.booking_time).toLocaleDateString()}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Price:</span>
                                    <span className="detail-value">Rs. {selectedBooking.price}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Status:</span>
                                    <span className={`status-badge ${selectedBooking.status?.toLowerCase()}`}>
                                        {selectedBooking.status?.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="booking-detail-section">
                                <h3>Update Status</h3>
                                <div className="status-buttons-group">
                                    <button
                                        className="status-btn booked"
                                        onClick={() => handleStatusChange(selectedBooking.booking_id, 'booked')}
                                        disabled={actionLoading || selectedBooking.status?.toLowerCase() === 'booked'}
                                        title="Mark as Booked"
                                    >
                                        {actionLoading ? 'Processing...' : 'Booked'}
                                    </button>
                                    <button
                                        className="status-btn completed"
                                        onClick={() => handleStatusChange(selectedBooking.booking_id, 'completed')}
                                        disabled={actionLoading || selectedBooking.status?.toLowerCase() === 'completed'}
                                        title="Mark as Completed"
                                    >
                                        {actionLoading ? 'Processing...' : 'Completed'}
                                    </button>
                                    <button
                                        className="status-btn cancelled"
                                        onClick={() => handleStatusChange(selectedBooking.booking_id, 'cancelled')}
                                        disabled={actionLoading || selectedBooking.status?.toLowerCase() === 'cancelled'}
                                        title="Mark as Cancelled"
                                    >
                                        {actionLoading ? 'Processing...' : 'Cancelled'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading bookings...</p>
                </div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Lot</th>
                                <th>Slot</th>
                                <th>Vehicle</th>
                                <th>Booking Date</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map(booking => (
                                    <tr key={booking.booking_id}>
                                        <td style={{ fontWeight: '600' }}>
                                            {booking.user_read?.firstname} {booking.user_read?.lastname}
                                        </td>
                                        <td>{booking.lot_detail?.lot_name || 'N/A'}</td>
                                        <td>{booking.slot_read?.slot_id || 'N/A'}</td>
                                        <td>{booking.vehicle_number}</td>
                                        <td>{new Date(booking.booking_time).toLocaleDateString()}</td>
                                        <td>Rs. {booking.price}</td>
                                        <td>
                                            <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                                                {booking.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => handleViewDetails(booking)}
                                                    title="View details and manage status"
                                                >
                                                    Details
                                                </button>
                                                {booking.status?.toLowerCase() === 'booked' && (
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleCancelBooking(booking.booking_id)}
                                                        disabled={actionLoading}
                                                        title="Cancel this booking"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                                        No bookings found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default AdminBookings
