import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import './Admin.scss'

const AdminCarwashBookings = () => {
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletingBookingId, setDeletingBookingId] = useState(null)

    useEffect(() => {
        fetchCarwashBookings()
    }, [])

    const fetchCarwashBookings = async () => {
        try {
            setLoading(true)
            console.log('🔍 Fetching carwash bookings from /carwash-bookings/')
            const response = await api.get('/carwash-bookings/')
            console.log('📦 Carwash bookings response:', response.data)
            console.log('📊 Number of bookings:', Array.isArray(response.data) ? response.data.length : 'Not an array')
            setBookings(response.data || [])
            setError(null)
        } catch (err) {
            console.error('❌ Error fetching carwash bookings:', err)
            console.error('❌ Error response:', err.response?.data)
            setError('Failed to load carwash bookings')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (bookingId, newStatus) => {
        try {
            setActionLoading(true)
            console.log(`📝 Changing carwash booking ${bookingId} status to ${newStatus}...`)
            
            const response = await api.patch(`/carwash-bookings/${bookingId}/`, { 
                status: newStatus,
                ...(newStatus === 'completed' && { completed_time: new Date().toISOString() })
            })
            console.log(`✅ Carwash booking ${bookingId} status changed to ${newStatus}`)
            
            setBookings(bookings.map(b => 
                b.carwash_booking_id === bookingId ? { ...b, status: newStatus } : b
            ))
            if (selectedBooking?.carwash_booking_id === bookingId) {
                setSelectedBooking({ ...selectedBooking, status: newStatus })
            }
            
            setSuccessMessage(`Carwash booking status changed to ${newStatus}!`)
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            console.error('❌ Error updating carwash booking status:', err)
            console.error('❌ Error response data:', err.response?.data)
            console.error('❌ Error status:', err.response?.status)
            setError('Failed to update booking status: ' + (err.response?.data?.detail || err.response?.data?.error || JSON.stringify(err.response?.data) || err.message))
            setTimeout(() => setError(null), 4000)
        } finally {
            setActionLoading(false)
        }
    }

    const handleCancelBooking = (bookingId) => {
        setCancellingBookingId(bookingId)
        setShowCancelConfirm(true)
    }

    const confirmCancelBooking = async () => {
        try {
            setActionLoading(true)
            console.log(`🗑️ Admin cancelling carwash booking ${cancellingBookingId}...`)
            
            await api.patch(`/carwash-bookings/${cancellingBookingId}/`, { 
                status: 'cancelled'
            })
            console.log(`✅ Carwash booking ${cancellingBookingId} cancelled successfully`)
            
            setBookings(bookings.map(b => 
                b.carwash_booking_id === cancellingBookingId ? { ...b, status: 'cancelled' } : b
            ))
            if (selectedBooking?.carwash_booking_id === cancellingBookingId) {
                setSelectedBooking({ ...selectedBooking, status: 'cancelled' })
                setShowDetailModal(false)
            }
            setShowCancelConfirm(false)
            setCancellingBookingId(null)
            setSuccessMessage('Carwash booking cancelled successfully!')
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            console.error('❌ Error cancelling carwash booking:', err)
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
            console.log(`🗑️ Admin deleting carwash booking ${deletingBookingId}...`)
            
            await api.delete(`/carwash-bookings/${deletingBookingId}/`)
            console.log(`✅ Carwash booking ${deletingBookingId} deleted successfully`)
            
            // Remove from bookings list
            setBookings(bookings.filter(b => b.carwash_booking_id !== deletingBookingId))
            
            // Close modals
            setShowDeleteConfirm(false)
            setDeletingBookingId(null)
            setShowDetailModal(false)
            setSelectedBooking(null)
            
            setSuccessMessage('Carwash booking deleted successfully!')
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            console.error('❌ Error deleting carwash booking:', err)
            setError('Failed to delete booking: ' + (err.response?.data?.detail || err.message))
            setTimeout(() => setError(null), 4000)
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusIcon = (status) => {
        const statusMap = {
            'completed': '🟢',
            'pending': '🟡',
            'confirmed': '🟡',
            'cancelled': '🔴',
            'in_progress': '🟣'
        }
        return statusMap[status] || '🟡'
    }

    const getStatusLabel = (status) => {
        const statusMap = {
            'completed': 'Completed',
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'cancelled': 'Cancelled',
            'in_progress': 'In Progress'
        }
        return statusMap[status] || status
    }

    const getStatusColor = (status) => {
        const colorMap = {
            'completed': { backgroundColor: '#dcfce7', color: '#166534' },
            'pending': { backgroundColor: '#fef3c7', color: '#92400e' },
            'confirmed': { backgroundColor: '#fef3c7', color: '#92400e' },
            'cancelled': { backgroundColor: '#fee2e2', color: '#991b1b' },
            'in_progress': { backgroundColor: '#e0e7ff', color: '#3730a3' }
        }
        return colorMap[status] || { backgroundColor: '#f3f4f6', color: '#374151' }
    }

    const filteredBookings = bookings.filter(booking => {
        const searchLower = searchTerm.toLowerCase()
        const userName = `${booking.user_detail?.firstname || ''} ${booking.user_detail?.lastname || ''}`.toLowerCase()
        const lotName = `${booking.lot_detail?.lot_name || ''}`.toLowerCase()
        const serviceType = `${booking.service_type || ''}`.toLowerCase()
        
        const matchesSearch = userName.includes(searchLower) || 
                             lotName.includes(searchLower) || 
                             serviceType.includes(searchLower)
        
        const matchesStatus = filterStatus === 'all' || booking.status?.toLowerCase() === filterStatus.toLowerCase()
        
        return matchesSearch && matchesStatus
    })

    const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length
    const completedCount = bookings.filter(b => b.status === 'completed').length
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { label: 'PENDING', class: 'pending' },
            'confirmed': { label: 'CONFIRMED', class: 'booked' },
            'in_progress': { label: 'IN PROGRESS', class: 'booked' },
            'completed': { label: 'COMPLETED', class: 'completed' },
            'cancelled': { label: 'CANCELLED', class: 'cancelled' }
        }
        const statusInfo = statusMap[status] || { label: status?.toUpperCase(), class: 'pending' }
        return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
    }

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1>🚿 Manage Carwash Bookings</h1>
                    <p className="page-subtitle">
                        Total: <strong>{bookings.length}</strong> | 
                        Pending/Confirmed: <strong>{pendingCount}</strong> | 
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
                    placeholder="🔍 Search by user, lot, or service type..."
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
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
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
                            <h2>Cancel Carwash Booking?</h2>
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
                                Are you sure you want to cancel this carwash booking? This action cannot be undone.
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
                            <h2>🚿 Carwash Booking Details</h2>
                            <button className="close-btn" onClick={handleCloseDetailModal}>&times;</button>
                        </div>
                        
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Status Badge */}
                            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                {getStatusBadge(selectedBooking.status)}
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
                                            {selectedBooking.user_detail?.firstname} {selectedBooking.user_detail?.lastname}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Phone</span>
                                        <span className="detail-value">{selectedBooking.user_detail?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">User ID</span>
                                        <span className="detail-value">#{selectedBooking.user}</span>
                                    </div>
                                </div>

                                {/* Parking Lot Details */}
                                <div className="details-section">
                                    <h3 className="section-title">🅿️ Parking Lot</h3>
                                    <div className="detail-item">
                                        <span className="detail-label">Lot Name</span>
                                        <span className="detail-value">
                                            {selectedBooking.lot_detail?.lot_name || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Location</span>
                                        <span className="detail-value">
                                            {selectedBooking.lot_detail?.city || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Address</span>
                                        <span className="detail-value">
                                            {selectedBooking.lot_detail?.address || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Carwash & Payment Information - Full Width */}
                            <div className="details-section" style={{ 
                                borderTop: '1px solid #e2e8f0', 
                                paddingTop: '24px',
                                marginTop: '8px'
                            }}>
                                <h3 className="section-title">💦 Carwash & Payment Information</h3>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(2, 1fr)', 
                                    gap: '16px'
                                }}>
                                    <div className="detail-item">
                                        <span className="detail-label">Booking ID</span>
                                        <span className="detail-value">#{selectedBooking.carwash_booking_id}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Service Type</span>
                                        <span className="detail-value" style={{ fontWeight: '700', color: '#0ea5e9' }}>
                                            {selectedBooking.service_type}
                                        </span>
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
                                        <span className="detail-label">Scheduled Time</span>
                                        <span className="detail-value">
                                            {selectedBooking.scheduled_time 
                                                ? new Date(selectedBooking.scheduled_time).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'Not scheduled'
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
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Payment Method</span>
                                        <span className="detail-value">
                                            {selectedBooking.payment_method || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Payment Status</span>
                                        <span className="detail-value">
                                            <span className={`status-badge ${selectedBooking.payment_status === 'verified' ? 'completed' : 'pending'}`}>
                                                {selectedBooking.payment_status?.toUpperCase()}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Transaction ID</span>
                                        <span className="detail-value" style={{ fontSize: '0.9rem' }}>
                                            {selectedBooking.transaction_id || 'N/A'}
                                        </span>
                                    </div>
                                    {selectedBooking.employee_detail && (
                                        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                            <span className="detail-label">Assigned Employee</span>
                                            <span className="detail-value">
                                                {selectedBooking.employee_detail.name} (ID: {selectedBooking.employee})
                                            </span>
                                        </div>
                                    )}
                                    {selectedBooking.notes && (
                                        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                            <span className="detail-label">Notes</span>
                                            <span className="detail-value" style={{ 
                                                backgroundColor: '#f8fafc',
                                                padding: '12px',
                                                borderRadius: '6px',
                                                display: 'block',
                                                marginTop: '4px'
                                            }}>
                                                {selectedBooking.notes}
                                            </span>
                                        </div>
                                    )}
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
                                    onClick={() => handleDeleteBooking(selectedBooking.carwash_booking_id)}
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
                                            Booking ID: {selectedBooking.carwash_booking_id}
                                        </p>
                                        <p style={{ color: '#991b1b', marginBottom: '4px' }}>
                                            User: {selectedBooking.user_detail?.firstname} {selectedBooking.user_detail?.lastname}
                                        </p>
                                        <p style={{ color: '#991b1b', marginBottom: '4px' }}>
                                            Service: {selectedBooking.service_type}
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
                    <p>Loading carwash bookings...</p>
                </div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Lot</th>
                                <th>Service Type</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Price</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map(booking => (
                                    <tr key={booking.carwash_booking_id}>
                                        <td style={{ fontWeight: '600' }}>
                                            {booking.user_detail?.firstname} {booking.user_detail?.lastname}
                                        </td>
                                        <td>{booking.lot_detail?.lot_name || 'N/A'}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px',
                                                backgroundColor: '#dbeafe',
                                                color: '#1e40af',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                            }}>
                                                {booking.service_type}
                                            </span>
                                        </td>
                                        <td>{new Date(booking.booking_time).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}</td>
                                        <td>
                                            {booking.scheduled_time 
                                                ? new Date(booking.scheduled_time).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'Not scheduled'
                                            }
                                        </td>
                                        <td style={{ fontWeight: '700', color: '#059669' }}>₹{booking.price}</td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <div>{booking.payment_method || 'N/A'}</div>
                                                <div style={{ fontSize: '0.75rem', color: booking.payment_status === 'verified' ? '#059669' : '#f59e0b' }}>
                                                    {booking.payment_status?.toUpperCase()}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {getStatusBadge(booking.status)}
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
                                                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleCancelBooking(booking.carwash_booking_id)}
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
                                    <td colSpan="9" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                                        {searchTerm || filterStatus !== 'all' 
                                            ? 'No carwash bookings match your filters' 
                                            : 'No carwash bookings found'
                                        }
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

export default AdminCarwashBookings
