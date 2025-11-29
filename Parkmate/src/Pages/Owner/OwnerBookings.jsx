import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import { notify } from '../../utils/notify.jsx'
import './Owner.scss'

const OwnerBookings = () => {
    const { owner } = useAuth()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('all') // all, booked, completed, cancelled
    const [pendingPayments, setPendingPayments] = useState([])
    const [verifyingPayment, setVerifyingPayment] = useState(null)
    const refreshIntervalRef = useRef(null)

    // Load bookings from backend
    const loadBookings = async () => {
        try {
            setLoading(true)
            setError(null)

            console.log('📋 Loading owner bookings...')
            const bookingsData = await parkingService.getBookings()
            console.log('✅ Bookings loaded:', bookingsData)

            setBookings(bookingsData)
            
            // Extract pending cash payments - ONLY from owner's lots
            const pending = []
            bookingsData.forEach(booking => {
                // Ensure booking belongs to this owner's lot
                if (booking.lot_detail && booking.payments && Array.isArray(booking.payments)) {
                    booking.payments.forEach(payment => {
                        if (payment.status === 'PENDING' && payment.payment_method === 'Cash') {
                            pending.push({
                                ...payment,
                                booking_id: booking.booking_id,
                                user_name: booking.user_read?.firstname && booking.user_read?.lastname 
                                    ? `${booking.user_read.firstname} ${booking.user_read.lastname}` 
                                    : 'User',
                                lot_name: booking.lot_detail?.lot_name,
                                slot_id: booking.slot_read?.slot_id,
                                lot_id: booking.lot_detail?.lot_id
                            })
                        }
                    })
                }
            })
            setPendingPayments(pending)
            console.log(`✅ Found ${pending.length} pending cash payments for owner's lots`)
        } catch (err) {
            console.error('❌ Error loading bookings:', err)
            setError('Failed to load bookings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (owner?.role === 'Owner') {
            loadBookings()

            // Set up auto-refresh every 10 seconds to check for expired bookings
            refreshIntervalRef.current = setInterval(() => {
                console.log('🔄 Auto-refreshing bookings...')
                loadBookings()
            }, 10000)
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current)
            }
        }
    }, [owner])

    const filteredBookings = bookings.filter(b => {
        if (filter === 'all') return true
        return b.status === filter
    })

    // Sort by recent
    const sortedBookings = [...filteredBookings].sort((a, b) => {
        const dateA = new Date(a.booking_time || 0)
        const dateB = new Date(b.booking_time || 0)
        return dateB - dateA
    })

    const handleCancelBooking = async (bookingId) => {
        try {
            if (!window.confirm('Are you sure you want to cancel this booking?')) {
                return
            }
            
            console.log('🗑️ Cancelling booking:', bookingId)
            const response = await parkingService.cancelBooking(bookingId)
            console.log('✅ Booking cancelled:', response)

            setBookings(bookings.map(b => b.booking_id === bookingId ? response : b))
            alert('✅ Booking cancelled successfully')
        } catch (err) {
            console.error('❌ Error cancelling booking:', err)
            alert('Failed to cancel booking: ' + (err.response?.data?.error || err.message))
        }
    }

    const handleVerifyPayment = async (paymentId) => {
        try {
            setVerifyingPayment(paymentId)
            console.log('✅ Verifying payment:', paymentId)
            
            const response = await parkingService.verifyPayment(paymentId)
            console.log('✅ Payment verified:', response)
            
            // Reload bookings to update payment status
            await loadBookings()
            
            notify.success('Cash payment verified successfully! Booking activated.')
        } catch (err) {
            console.error('❌ Error verifying payment:', err)
            const errorMsg = err.response?.data?.error || err.message || 'Failed to verify payment'
            notify.error(errorMsg)
        } finally {
            setVerifyingPayment(null)
        }
    }

    if (loading) {
        return (
            <div className="owner-bookings">
                <h1>Manage Bookings</h1>
                <p style={{ textAlign: 'center', padding: '40px' }}>Loading bookings...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="owner-bookings">
                <h1>Manage Bookings</h1>
                <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
                    {error}
                </div>
            </div>
        )
    }

    return (
        <div className="owner-bookings">
            <header className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>📅 Manage Bookings</h1>
                        <p className="subtitle">View and manage all bookings for your parking lots</p>
                    </div>
                    <button
                        onClick={loadBookings}
                        style={{
                            padding: '10px 16px',
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#2563eb'}
                        onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </header>

            {/* Pending Payments Section */}
            {pendingPayments.length > 0 && (
                <div style={{
                    background: '#fefce8',
                    border: '2px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>⏳</span>
                        <h3 style={{ margin: 0, color: '#92400e', fontSize: '18px', fontWeight: '600' }}>
                            {pendingPayments.length} Pending Cash Payment{pendingPayments.length > 1 ? 's' : ''}
                        </h3>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '12px'
                    }}>
                        {pendingPayments.map(payment => (
                            <div key={payment.pay_id} style={{
                                background: '#fff',
                                border: '1px solid #fed7aa',
                                borderRadius: '8px',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
                                            {payment.user_name}
                                        </p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                                            Lot: {payment.lot_name} • Slot: #{payment.slot_id}
                                        </p>
                                    </div>
                                    <div style={{
                                        padding: '4px 8px',
                                        background: '#fef3c7',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#92400e'
                                    }}>
                                        ₹{parseFloat(payment.amount).toFixed(2)}
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    ID: {payment.transaction_id}
                                </div>
                                <button
                                    onClick={() => handleVerifyPayment(payment.pay_id)}
                                    disabled={verifyingPayment === payment.pay_id}
                                    style={{
                                        padding: '8px 12px',
                                        background: '#10b981',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: verifyingPayment === payment.pay_id ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        transition: 'all 0.2s',
                                        opacity: verifyingPayment === payment.pay_id ? 0.6 : 1
                                    }}
                                    onMouseOver={(e) => {
                                        if (verifyingPayment !== payment.pay_id) {
                                            e.target.style.background = '#059669'
                                        }
                                    }}
                                    onMouseOut={(e) => e.target.style.background = '#10b981'}
                                >
                                    {verifyingPayment === payment.pay_id ? '⏳ Verifying...' : '✓ Verify Payment'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="filters" style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`} 
                    onClick={() => setFilter('all')}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: filter === 'all' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: filter === 'all' ? '#eff6ff' : '#fff',
                        color: filter === 'all' ? '#3b82f6' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: filter === 'all' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                >
                    All ({bookings.length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'booked' ? 'active' : ''}`} 
                    onClick={() => setFilter('booked')}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: filter === 'booked' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: filter === 'booked' ? '#eff6ff' : '#fff',
                        color: filter === 'booked' ? '#3b82f6' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: filter === 'booked' ? '600' : '500'
                    }}
                >
                    Booked ({bookings.filter(b => b.status?.toLowerCase() === 'booked').length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} 
                    onClick={() => setFilter('completed')}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: filter === 'completed' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: filter === 'completed' ? '#eff6ff' : '#fff',
                        color: filter === 'completed' ? '#3b82f6' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: filter === 'completed' ? '600' : '500'
                    }}
                >
                    Completed ({bookings.filter(b => b.status?.toLowerCase() === 'completed').length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`} 
                    onClick={() => setFilter('cancelled')}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: filter === 'cancelled' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: filter === 'cancelled' ? '#eff6ff' : '#fff',
                        color: filter === 'cancelled' ? '#3b82f6' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: filter === 'cancelled' ? '600' : '500'
                    }}
                >
                    Cancelled ({bookings.filter(b => b.status?.toLowerCase() === 'cancelled').length})
                </button>
            </div>

            <div className="bookings-list-container">
                {sortedBookings.length === 0 ? (
                    <div className="empty-state" style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <p style={{ fontSize: '18px', color: '#64748b' }}>
                            No {filter !== 'all' ? filter.toLowerCase() : ''} bookings found.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        overflowX: 'auto',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        background: '#fff'
                    }}>
                        <table className="bookings-table" style={{
                            width: '100%',
                            borderCollapse: 'collapse'
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>User</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Lot</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Slot</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Vehicle</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Booking Date</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Status</th>
                                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedBookings.map((b) => (
                                    <tr key={b.booking_id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = '#fff'}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: '600', color: '#0f172a' }}>
                                                {b.user_read?.firstname && b.user_read?.lastname 
                                                    ? `${b.user_read.firstname} ${b.user_read.lastname}` 
                                                    : b.user_name || b.username || 'User'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>ID: {b.user}</div>
                                        </td>
                                        <td style={{ padding: '16px', color: '#0f172a' }}>
                                            {b.lot_detail?.lot_name || 'Unknown Lot'}
                                        </td>
                                        <td style={{ padding: '16px', color: '#0f172a' }}>
                                            #{b.slot_read?.slot_id || 'N/A'}
                                        </td>
                                        <td style={{ padding: '16px', color: '#0f172a', textTransform: 'capitalize' }}>
                                            {b.vehicle_number || 'N/A'}
                                        </td>
                                        <td style={{ padding: '16px', color: '#64748b' }}>
                                            {new Date(b.booking_time).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                backgroundColor: b.status?.toLowerCase() === 'booked' ? '#dbeafe' : b.status?.toLowerCase() === 'completed' ? '#dcfce7' : b.status?.toLowerCase() === 'cancelled' ? '#fee2e2' : '#fef3c7',
                                                color: b.status?.toLowerCase() === 'booked' ? '#1e40af' : b.status?.toLowerCase() === 'completed' ? '#166534' : b.status?.toLowerCase() === 'cancelled' ? '#991b1b' : '#92400e'
                                            }}>
                                                {b.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {b.status?.toLowerCase() === 'booked' && (
                                                    <button 
                                                        onClick={() => handleCancelBooking(b.booking_id)}
                                                        style={{
                                                            padding: '8px 12px',
                                                            background: '#ef4444',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '600',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.background = '#dc2626'}
                                                        onMouseOut={(e) => e.target.style.background = '#ef4444'}
                                                    >
                                                        ✕ Cancel
                                                    </button>
                                                )}
                                                {b.status?.toLowerCase() === 'completed' && (
                                                    <span style={{
                                                        padding: '8px 12px',
                                                        background: '#f0fdf4',
                                                        color: '#166534',
                                                        borderRadius: '6px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        ✓ Completed
                                                    </span>
                                                )}
                                                {b.status?.toLowerCase() === 'cancelled' && (
                                                    <span style={{
                                                        padding: '8px 12px',
                                                        background: '#fef2f2',
                                                        color: '#991b1b',
                                                        borderRadius: '6px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        ✕ Cancelled
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default OwnerBookings
