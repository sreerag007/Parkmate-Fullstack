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
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [selectedBooking, setSelectedBooking] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [cancellingBookingId, setCancellingBookingId] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletingBookingId, setDeletingBookingId] = useState(null)

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

    const handleDeleteBooking = (bookingId) => {
        setDeletingBookingId(bookingId)
        setShowDeleteConfirm(true)
    }

    const confirmDeleteBooking = async () => {
        try {
            setActionLoading(true)
            console.log(`🗑️ Admin deleting booking ${deletingBookingId}...`)
            
            await api.delete(`/bookings/${deletingBookingId}/`)
            console.log(`✅ Booking ${deletingBookingId} deleted successfully`)
            
            // Remove from bookings list
            setBookings(bookings.filter(b => b.booking_id !== deletingBookingId))
            
            // Close modals
            setShowDeleteConfirm(false)
            setDeletingBookingId(null)
            setShowDetailModal(false)
            setSelectedBooking(null)
            
            setSuccessMessage('Booking deleted successfully!')
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            console.error('❌ Error deleting booking:', err)
            setError('Failed to delete booking: ' + (err.response?.data?.detail || err.message))
            setTimeout(() => setError(null), 4000)
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusIcon = (status) => {
        const statusMap = {
            'completed': '🟢',
            'booked': '🟡',
            'cancelled': '🔴'
        }
        return statusMap[status?.toLowerCase()] || '🟡'
    }

    const getStatusLabel = (status) => {
        const statusMap = {
            'completed': 'Completed',
            'booked': 'Booked',
            'cancelled': 'Cancelled'
        }
        return statusMap[status?.toLowerCase()] || status
    }

    const getStatusColor = (status) => {
        const colorMap = {
            'completed': { backgroundColor: '#dcfce7', color: '#166534' },
            'booked': { backgroundColor: '#fef3c7', color: '#92400e' },
            'cancelled': { backgroundColor: '#fee2e2', color: '#991b1b' }
        }
        return colorMap[status?.toLowerCase()] || { backgroundColor: '#f3f4f6', color: '#374151' }
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
        
        // Apply date filter
        let matchesDate = true
        if (dateFrom || dateTo) {
            const bookingDate = new Date(booking.booking_time)
            if (dateFrom) {
                const fromDate = new Date(dateFrom)
                fromDate.setHours(0, 0, 0, 0)
                if (bookingDate < fromDate) matchesDate = false
            }
            if (dateTo) {
                const toDate = new Date(dateTo)
                toDate.setHours(23, 59, 59, 999)
                if (bookingDate > toDate) matchesDate = false
            }
        }
        
        return matchesSearch && matchesStatus && matchesDate
    })

    const bookedCount = bookings.filter(b => b.status?.toLowerCase() === 'booked').length
    const completedCount = bookings.filter(b => b.status?.toLowerCase() === 'completed').length
    const cancelledCount = bookings.filter(b => b.status?.toLowerCase() === 'cancelled').length

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1>📅 Manage Bookings</h1>
                    <p className="page-subtitle">
                        Total: <strong>{bookings.length}</strong> | 
                        Booked: <strong>{bookedCount}</strong> | 
                        Completed: <strong>{completedCount}</strong> | 
                        Cancelled: <strong>{cancelledCount}</strong>
                    </p>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '24px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="🔍 Search by user, lot, or vehicle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: '1',
                        minWidth: '250px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.95rem'
                    }}
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.95rem',
                        minWidth: '150px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Status</option>
                    <option value="booked">Booked</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Date Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
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

            {successMessage && (
                <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                    <span className="alert-icon">✅ Success</span>
                    <span>{successMessage}</span>
                    <button 
                        className="alert-close"
                        onClick={() => setSuccessMessage(null)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                        ×
                    </button>
                </div>
            )}

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    <span className="alert-icon">❌ Error</span>
                    <span>{error}</span>
                    <button 
                        className="alert-close"
                        onClick={() => setError(null)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                        ×
                    </button>
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
                    <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📅 Booking Details</h2>
                            <button className="close-btn" onClick={handleCloseDetailModal}>&times;</button>
                        </div>
                        
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Status Badge */}
                            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                <span className={`status-badge ${selectedBooking.status?.toLowerCase()}`} style={{
                                    fontSize: '0.95rem',
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    fontWeight: '600'
                                }}>
                                    {selectedBooking.status?.toUpperCase()}
                                </span>
                            </div>

                            {/* Two-column layout for details */}
                            <div className="details-grid" style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(2, 1fr)', 
                                gap: '24px',
                                marginBottom: '24px'
                            }}>
                                {/* User Information */}
                                <div className="details-section">
                                    <h3 className="section-title">👤 User Information</h3>
                                    <div className="detail-item">
                                        <span className="detail-label">Name</span>
                                        <span className="detail-value">
                                            {selectedBooking.user_read?.firstname} {selectedBooking.user_read?.lastname}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Vehicle Number</span>
                                        <span className="detail-value">{selectedBooking.vehicle_number}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Vehicle Type</span>
                                        <span className="detail-value">{selectedBooking.slot_read?.vehicle_type}</span>
                                    </div>
                                </div>

                                {/* Parking Details */}
                                <div className="details-section">
                                    <h3 className="section-title">🅿️ Parking Details</h3>
                                    <div className="detail-item">
                                        <span className="detail-label">Lot Name</span>
                                        <span className="detail-value">{selectedBooking.lot_detail?.lot_name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Slot ID</span>
                                        <span className="detail-value">{selectedBooking.slot_read?.slot_id}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Booking Type</span>
                                        <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                                            {selectedBooking.booking_type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Booking & Payment Information - Full Width */}
                            <div className="details-section" style={{ 
                                borderTop: '1px solid #e2e8f0', 
                                paddingTop: '24px',
                                marginTop: '8px'
                            }}>
                                <h3 className="section-title">💰 Booking & Payment Information</h3>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(2, 1fr)', 
                                    gap: '16px'
                                }}>
                                    <div className="detail-item">
                                        <span className="detail-label">Booking ID</span>
                                        <span className="detail-value">#{selectedBooking.booking_id}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Booking Date</span>
                                        <span className="detail-value">
                                            {new Date(selectedBooking.booking_time).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Start Time</span>
                                        <span className="detail-value">
                                            {selectedBooking.start_time 
                                                ? new Date(selectedBooking.start_time).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">End Time</span>
                                        <span className="detail-value">
                                            {selectedBooking.end_time 
                                                ? new Date(selectedBooking.end_time).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Price</span>
                                        <span className="detail-value" style={{ 
                                            fontSize: '1.1rem', 
                                            fontWeight: '700',
                                            color: '#059669'
                                        }}>
                                            ₹{selectedBooking.price}
                                            {selectedBooking.payments?.[0]?.is_renewal && (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '3px 10px',
                                                    backgroundColor: '#10b981',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    borderRadius: '4px'
                                                }}>
                                                    Renewal
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Payment Method</span>
                                        <span className="detail-value">
                                            {selectedBooking.payment_method || 'Online Payment'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Current Status Display */}
                            <div className="details-section" style={{ 
                                borderTop: '1px solid #e2e8f0', 
                                paddingTop: '24px',
                                marginTop: '24px'
                            }}>
                                <h3 className="section-title">📊 Current Booking Status</h3>
                                <div style={{ 
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: '16px'
                                }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        fontSize: '1.1rem',
                                        ...getStatusColor(selectedBooking.status)
                                    }}>
                                        <span style={{ fontSize: '1.3rem' }}>{getStatusIcon(selectedBooking.status)}</span>
                                        {getStatusLabel(selectedBooking.status)}
                                    </span>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div style={{ 
                                borderTop: '1px solid #e2e8f0', 
                                paddingTop: '20px',
                                marginTop: '24px',
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end'
                            }}>
                                <button 
                                    onClick={handleCloseDetailModal}
                                    disabled={actionLoading}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        backgroundColor: '#3b82f6',
                                        color: '#ffffff',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                                >
                                    Close
                                </button>
                                <button 
                                    onClick={() => handleDeleteBooking(selectedBooking.booking_id)}
                                    disabled={actionLoading}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        backgroundColor: '#ef4444',
                                        color: '#ffffff',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                                >
                                    🗑️ Delete Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowDeleteConfirm(false)}>
                    <div className="modal-card delete-confirm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚠️ Confirm Delete</h2>
                            <button 
                                className="close-btn" 
                                onClick={() => !actionLoading && setShowDeleteConfirm(false)}
                                disabled={actionLoading}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '32px' }}>
                            <p style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '24px' }}>
                                Are you sure you want to delete this booking?
                            </p>
                            <div style={{ 
                                padding: '16px', 
                                backgroundColor: '#fef2f2', 
                                borderRadius: '8px',
                                border: '1px solid #fecaca',
                                marginBottom: '16px',
                                textAlign: 'left'
                            }}>
                                {selectedBooking && (
                                    <>
                                        <p style={{ color: '#991b1b', fontWeight: '600', marginBottom: '8px' }}>
                                            Booking ID: {selectedBooking.booking_id}
                                        </p>
                                        <p style={{ color: '#991b1b', marginBottom: '4px' }}>
                                            User: {selectedBooking.user_read?.firstname} {selectedBooking.user_read?.lastname}
                                        </p>
                                        <p style={{ color: '#991b1b', marginBottom: '4px' }}>
                                            Lot: {selectedBooking.lot_detail?.lot_name}
                                        </p>
                                        <p style={{ color: '#991b1b' }}>
                                            Status: {selectedBooking.status}
                                        </p>
                                    </>
                                )}
                            </div>
                            <p style={{ color: '#e11d48', fontWeight: '600', fontSize: '0.95rem' }}>
                                ⚠️ This action cannot be undone!
                            </p>
                        </div>
                        <div style={{ 
                            borderTop: '1px solid #e2e8f0',
                            padding: '20px',
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center'
                        }}>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    backgroundColor: '#ffffff',
                                    color: '#64748b',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteBooking}
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    backgroundColor: '#ef4444',
                                    color: '#ffffff',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                            >
                                {actionLoading ? 'Deleting...' : '🗑️ Delete Booking'}
                            </button>
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
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#f1f5f9',
                                                borderRadius: '6px',
                                                fontSize: '0.9rem',
                                                fontWeight: '600'
                                            }}>
                                                {booking.slot_read?.slot_id || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.95rem' }}>
                                                <div style={{ fontWeight: '600' }}>{booking.vehicle_number}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    {booking.slot_read?.vehicle_type}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{new Date(booking.booking_time).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}</td>
                                        <td style={{ fontWeight: '700', color: '#059669' }}>
                                            ₹{booking.price}
                                            {booking.payments?.[0]?.is_renewal && (
                                                <span style={{
                                                    marginLeft: '6px',
                                                    padding: '2px 6px',
                                                    backgroundColor: '#10b981',
                                                    color: 'white',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    borderRadius: '3px'
                                                }}>
                                                    RENEWAL
                                                </span>
                                            )}
                                        </td>
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
                                                    📋 Details
                                                </button>
                                                {booking.status?.toLowerCase() === 'booked' && (
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleCancelBooking(booking.booking_id)}
                                                        disabled={actionLoading}
                                                        title="Cancel this booking"
                                                    >
                                                        ❌ Cancel
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
