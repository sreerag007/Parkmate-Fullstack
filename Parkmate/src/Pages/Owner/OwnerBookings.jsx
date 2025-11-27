import React, { useState, useEffect } from 'react'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import './Owner.scss'

const OwnerBookings = () => {
    const { owner } = useAuth()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('all') // all, Booked, Completed, Cancelled

    // Load bookings from backend
    useEffect(() => {
        const loadBookings = async () => {
            try {
                setLoading(true)
                setError(null)

                console.log('📋 Loading owner bookings...')
                const bookingsData = await parkingService.getBookings()
                console.log('✅ Bookings loaded:', bookingsData)

                setBookings(bookingsData)
            } catch (err) {
                console.error('❌ Error loading bookings:', err)
                setError('Failed to load bookings')
            } finally {
                setLoading(false)
            }
        }

        if (owner?.role === 'Owner') {
            loadBookings()
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

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            console.log('📝 Updating booking status:', { bookingId, newStatus })
            const response = await parkingService.updateBooking(bookingId, { status: newStatus })
            console.log('✅ Booking updated:', response)

            setBookings(bookings.map(b => b.booking_id === bookingId ? response : b))
            alert(`✅ Booking status updated to ${newStatus}`)
        } catch (err) {
            console.error('❌ Error updating booking:', err)
            alert('Failed to update booking: ' + (err.response?.data?.error || err.message))
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
                <h1>📅 Manage Bookings</h1>
                <p className="subtitle">View and manage all bookings for your parking lots</p>
            </header>

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
                    className={`filter-btn ${filter === 'Booked' ? 'active' : ''}`} 
                    onClick={() => setFilter('Booked')}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: filter === 'Booked' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: filter === 'Booked' ? '#eff6ff' : '#fff',
                        color: filter === 'Booked' ? '#3b82f6' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: filter === 'Booked' ? '600' : '500'
                    }}
                >
                    Booked ({bookings.filter(b => b.status === 'Booked').length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'Completed' ? 'active' : ''}`} 
                    onClick={() => setFilter('Completed')}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: filter === 'Completed' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: filter === 'Completed' ? '#eff6ff' : '#fff',
                        color: filter === 'Completed' ? '#3b82f6' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: filter === 'Completed' ? '600' : '500'
                    }}
                >
                    Completed ({bookings.filter(b => b.status === 'Completed').length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'Cancelled' ? 'active' : ''}`} 
                    onClick={() => setFilter('Cancelled')}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: filter === 'Cancelled' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: filter === 'Cancelled' ? '#eff6ff' : '#fff',
                        color: filter === 'Cancelled' ? '#3b82f6' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: filter === 'Cancelled' ? '600' : '500'
                    }}
                >
                    Cancelled ({bookings.filter(b => b.status === 'Cancelled').length})
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
                                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{b.user_name || b.username || 'User'}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>ID: {b.user_id}</div>
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
                                                backgroundColor: b.status === 'Booked' ? '#dbeafe' : b.status === 'Completed' ? '#dcfce7' : b.status === 'Cancelled' ? '#fee2e2' : '#fef3c7',
                                                color: b.status === 'Booked' ? '#1e40af' : b.status === 'Completed' ? '#166534' : b.status === 'Cancelled' ? '#991b1b' : '#92400e'
                                            }}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {b.status === 'Booked' && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(b.booking_id, 'Completed')}
                                                        style={{
                                                            padding: '8px 12px',
                                                            background: '#10b981',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '600',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.background = '#059669'}
                                                        onMouseOut={(e) => e.target.style.background = '#10b981'}
                                                    >
                                                        ✓ Complete
                                                    </button>
                                                )}
                                                {b.status !== 'Cancelled' && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(b.booking_id, 'Cancelled')}
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
