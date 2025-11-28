import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import './Owner.scss'

const OwnerServices = () => {
    const { owner } = useAuth()
    const [carwashes, setCarwashes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('all') // all, booked, completed, cancelled
    const [selectedService, setSelectedService] = useState(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const refreshIntervalRef = useRef(null)

    // Load carwashes from backend
    const loadOwnerServices = async () => {
        try {
            setLoading(true)
            setError(null)

            console.log('📋 Loading owner carwash services...')
            console.log('👤 Owner object:', owner)
            
            // Fetch carwashes for owner's lots with full details
            const data = await parkingService.getOwnerCarwashes()
            console.log('✅ Owner services loaded:', data)
            
            setCarwashes(data.carwashes || data || [])
        } catch (err) {
            console.error('❌ Error loading services:', err)
            console.error('❌ Error response:', err.response?.data)
            console.error('❌ Error status:', err.response?.status)
            
            if (err.response?.status === 403) {
                setError(`Access denied: ${err.response?.data?.error || 'You do not have permission to access owner services'}`)
            } else if (err.response?.status === 404) {
                setError(err.response?.data?.error || 'Owner profile not found')
            } else {
                setError('Failed to load carwash services')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (owner?.role === 'Owner') {
            loadOwnerServices()
            
            // Set up auto-refresh every 15 seconds
            refreshIntervalRef.current = setInterval(() => {
                console.log('🔄 Auto-refreshing owner services...')
                loadOwnerServices()
            }, 15000)
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current)
            }
        }
    }, [owner])

    const handleViewDetails = (service) => {
        console.log('📋 Viewing details for service:', service)
        setSelectedService(service)
        setShowDetailsModal(true)
    }

    const handleCloseModal = () => {
        console.log('❌ Closing details modal')
        setSelectedService(null)
        setShowDetailsModal(false)
    }

    const handleRefresh = async () => {
        console.log('🔄 Manual refresh triggered')
        await loadOwnerServices()
    }

    const filteredCarwashes = carwashes.filter(c => {
        if (filter === 'all') return true
        return c.booking_read?.status?.toLowerCase() === filter.toLowerCase()
    })

    // Sort by recent
    const sortedCarwashes = [...filteredCarwashes].sort((a, b) => {
        const dateA = new Date(a.booking_read?.booking_time || 0)
        const dateB = new Date(b.booking_read?.booking_time || 0)
        return dateB - dateA
    })

    const getStatusColor = (status) => {
        if (!status) return '#94a3b8'
        const statusLower = status.toLowerCase()
        if (statusLower === 'booked') return '#3b82f6'
        if (statusLower === 'completed') return '#10b981'
        if (statusLower === 'cancelled') return '#ef4444'
        return '#94a3b8'
    }

    const getStatusBgColor = (status) => {
        if (!status) return '#f1f5f9'
        const statusLower = status.toLowerCase()
        if (statusLower === 'booked') return '#eff6ff'
        if (statusLower === 'completed') return '#ecfdf5'
        if (statusLower === 'cancelled') return '#fef2f2'
        return '#f1f5f9'
    }

    if (loading) {
        return (
            <div className="owner-services">
                <h1>🧼 Carwash Services</h1>
                <p style={{ textAlign: 'center', padding: '40px' }}>Loading carwash services...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="owner-services">
                <h1>🧼 Carwash Services</h1>
                <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
                    {error}
                    <button onClick={handleRefresh} style={{ marginLeft: '12px', padding: '8px 16px', cursor: 'pointer' }}>
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="owner-services">
            <div className="services-header">
                <div>
                    <h1>🧼 Carwash Services</h1>
                    <p className="subtitle">Monitor carwash services booked at your parking lots</p>
                </div>
                <button 
                    onClick={handleRefresh}
                    style={{
                        padding: '10px 16px',
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            <div className="filters" style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'booked', 'completed', 'cancelled'].map(status => (
                    <button 
                        key={status}
                        className={`filter-btn ${filter === status ? 'active' : ''}`} 
                        onClick={() => setFilter(status)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: filter === status ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            background: filter === status ? '#eff6ff' : '#fff',
                            color: filter === status ? '#3b82f6' : '#64748b',
                            cursor: 'pointer',
                            fontWeight: filter === status ? '600' : '500',
                            transition: 'all 0.2s'
                        }}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)} ({carwashes.filter(c => filter === 'all' || c.booking_read?.status?.toLowerCase() === status.toLowerCase()).length})
                    </button>
                ))}
            </div>

            <div className="services-grid">
                {sortedCarwashes.length === 0 ? (
                    <div className="empty-services-state" style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🧼</div>
                        <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>No Carwash Services Yet</h3>
                        <p style={{ color: '#64748b', marginBottom: '16px' }}>
                            {filter !== 'all' ? `No ${filter.toLowerCase()} services found.` : 'Users haven\'t booked any carwash services yet.'}
                        </p>
                    </div>
                ) : (
                    sortedCarwashes.map((service, idx) => (
                        <div key={service.carwash_id || idx} className="service-card-modern" style={{
                            background: '#fff',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            padding: '20px',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div className="service-card-header" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '16px'
                            }}>
                                <div>
                                    <h3 className="service-title" style={{ color: '#0f172a', fontWeight: '700', marginBottom: '4px' }}>
                                        {service.carwash_type_read?.name || 'Car Wash Service'}
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        Booking #{service.booking_read?.booking_id || 'N/A'}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    backgroundColor: getStatusBgColor(service.booking_read?.status),
                                    color: getStatusColor(service.booking_read?.status)
                                }}>
                                    {service.booking_read?.status?.toUpperCase() || 'UNKNOWN'}
                                </span>
                            </div>

                            <div className="service-card-body" style={{
                                background: '#f8fafc',
                                padding: '16px',
                                borderRadius: '12px',
                                marginBottom: '16px',
                                borderLeft: '4px solid #3b82f6'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>USER</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {service.user_read ? `${service.user_read.firstname} ${service.user_read.lastname}` : 'N/A'}
                                        </p>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                            {service.user_read?.phone || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>LOT</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {service.lot_read?.lot_name || 'N/A'}
                                        </p>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                            {service.lot_read?.city || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>EMPLOYEE</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {service.employee_read ? `${service.employee_read.firstname} ${service.employee_read.lastname}` : 'Unassigned'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>PRICE</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>₹{service.price || service.carwash_type_read?.price || '0'}</p>
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>BOOKING DATE</p>
                                    <p style={{ color: '#0f172a' }}>
                                        {service.booking_read?.booking_time 
                                            ? new Date(service.booking_read.booking_time).toLocaleDateString('en-IN', { 
                                                year: 'numeric',
                                                month: 'short',
                                                day: '2-digit'
                                            })
                                            : 'N/A'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="service-card-actions" style={{
                                display: 'flex',
                                gap: '8px'
                            }}>
                                <button 
                                    onClick={() => handleViewDetails(service)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        background: '#f1f5f9',
                                        color: '#0f172a',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.target.style.background = '#e2e8f0'; e.target.style.borderColor = '#cbd5e1' }}
                                    onMouseOut={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.borderColor = '#e2e8f0' }}
                                >
                                    📋 View Details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedService && (
                <div className="modal-overlay" onClick={handleCloseModal} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                        background: '#fff',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div className="modal-header" style={{
                            padding: '24px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, color: '#0f172a' }}>📋 Service Details</h2>
                            <button onClick={handleCloseModal} style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#64748b'
                            }}>✕</button>
                        </div>

                        <div className="modal-body" style={{ padding: '24px' }}>
                            {/* Service Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ color: '#0f172a', marginBottom: '12px', fontSize: '1.1rem' }}>🧼 Service Information</h3>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '16px'
                                }}>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Service Type</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600', fontSize: '1rem' }}>
                                            {selectedService.carwash_type_read?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Price</p>
                                        <p style={{ color: '#10b981', fontWeight: '700', fontSize: '1.1rem' }}>
                                            ₹{selectedService.price || selectedService.carwash_type_read?.price || '0'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Status</p>
                                        <p style={{
                                            color: getStatusColor(selectedService.booking_read?.status),
                                            fontWeight: '600',
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            background: getStatusBgColor(selectedService.booking_read?.status),
                                            borderRadius: '6px'
                                        }}>
                                            {selectedService.booking_read?.status?.toUpperCase() || 'UNKNOWN'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Booking ID</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            #{selectedService.booking_read?.booking_id || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* User Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ color: '#0f172a', marginBottom: '12px', fontSize: '1.1rem' }}>👤 User Information</h3>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '16px'
                                }}>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Name</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {selectedService.user_read ? `${selectedService.user_read.firstname} ${selectedService.user_read.lastname}` : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Phone</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {selectedService.user_read?.phone || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Vehicle</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {selectedService.user_read?.vehicle_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Lot Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ color: '#0f172a', marginBottom: '12px', fontSize: '1.1rem' }}>🅿️ Parking Lot Information</h3>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '16px'
                                }}>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Lot Name</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {selectedService.lot_read?.lot_name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Location</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {selectedService.lot_read?.city || 'N/A'}
                                        </p>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Address</p>
                                        <p style={{ color: '#0f172a' }}>
                                            {selectedService.lot_read ? `${selectedService.lot_read.streetname}, ${selectedService.lot_read.locality || ''} ${selectedService.lot_read.city}` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Slot Info */}
                            {selectedService.slot_read && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ color: '#0f172a', marginBottom: '12px', fontSize: '1.1rem' }}>🎟️ Slot Information</h3>
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '16px'
                                    }}>
                                        <div>
                                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Slot ID</p>
                                            <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                                #{selectedService.slot_read?.slot_id || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Vehicle Type</p>
                                            <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                                {selectedService.slot_read?.vehicle_type || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Employee Assignment */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ color: '#0f172a', marginBottom: '12px', fontSize: '1.1rem' }}>👨‍💼 Employee Assignment</h3>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '16px',
                                    borderRadius: '12px'
                                }}>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Assigned Employee</p>
                                    <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                        {selectedService.employee_read ? `${selectedService.employee_read.firstname} ${selectedService.employee_read.lastname}` : 'Unassigned'}
                                    </p>
                                    {selectedService.employee_read && (
                                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '8px' }}>
                                            📞 {selectedService.employee_read.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Booking Date */}
                            <div>
                                <h3 style={{ color: '#0f172a', marginBottom: '12px', fontSize: '1.1rem' }}>📅 Booking Information</h3>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '16px',
                                    borderRadius: '12px'
                                }}>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px', fontWeight: '600' }}>Booking Date</p>
                                    <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                        {selectedService.booking_read?.booking_time 
                                            ? new Date(selectedService.booking_read.booking_time).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : 'N/A'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px'
                        }}>
                            <button onClick={handleCloseModal} style={{
                                padding: '10px 20px',
                                background: '#f1f5f9',
                                color: '#0f172a',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.target.style.background = '#e2e8f0'; e.target.style.borderColor = '#cbd5e1' }}
                            onMouseOut={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.borderColor = '#e2e8f0' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OwnerServices
