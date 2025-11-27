import React, { useState, useEffect } from 'react'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import './Owner.scss'

const OwnerServices = () => {
    const { owner } = useAuth()
    const [carwashes, setCarwashes] = useState([])
    const [carwashTypes, setCarwashTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('all') // all, Booked, Completed, Cancelled

    // Load carwashes from backend
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                setError(null)

                console.log('📋 Loading owner carwash services...')
                
                // Fetch carwash types available
                const typesData = await parkingService.getCarwashTypes()
                console.log('✅ Carwash types loaded:', typesData)
                setCarwashTypes(typesData)

                // Fetch carwashes for owner's lots
                const carwashesData = await parkingService.getCarwashes()
                console.log('✅ Carwashes loaded:', carwashesData)
                
                // Filter to only show carwashes for owner's lots
                setCarwashes(carwashesData)
            } catch (err) {
                console.error('❌ Error loading services:', err)
                setError('Failed to load carwash services')
            } finally {
                setLoading(false)
            }
        }

        if (owner?.role === 'Owner') {
            loadData()
        }
    }, [owner])

    const filteredCarwashes = carwashes.filter(c => {
        if (filter === 'all') return true
        return c.status === filter
    })

    // Sort by recent
    const sortedCarwashes = [...filteredCarwashes].sort((a, b) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB - dateA
    })

    const getCarwashTypeName = (typeId) => {
        const type = carwashTypes.find(t => t.id === typeId)
        return type?.name || `Type #${typeId}`
    }

    const getCarwashTypePrice = (typeId) => {
        const type = carwashTypes.find(t => t.id === typeId)
        return type?.price || 0
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
            </div>

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
                    All ({carwashes.length})
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
                    Pending ({carwashes.filter(c => c.status === 'Booked').length})
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
                    Completed ({carwashes.filter(c => c.status === 'Completed').length})
                </button>
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
                    sortedCarwashes.map((carwash, idx) => (
                        <div key={carwash.id || idx} className="service-card-modern" style={{
                            background: '#fff',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            padding: '20px',
                            transition: 'all 0.2s'
                        }}>
                            <div className="service-card-header" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '16px'
                            }}>
                                <div>
                                    <h3 className="service-title" style={{ color: '#0f172a', fontWeight: '700', marginBottom: '4px' }}>
                                        {getCarwashTypeName(carwash.carwash_type)}
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        Booking #{carwash.booking_detail?.booking_id}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    backgroundColor: carwash.status === 'Booked' ? '#dbeafe' : carwash.status === 'Completed' ? '#dcfce7' : '#fee2e2',
                                    color: carwash.status === 'Booked' ? '#1e40af' : carwash.status === 'Completed' ? '#166534' : '#991b1b'
                                }}>
                                    {carwash.status}
                                </span>
                            </div>

                            <div className="service-card-body" style={{
                                background: '#f8fafc',
                                padding: '16px',
                                borderRadius: '12px',
                                marginBottom: '16px',
                                borderLeft: '4px solid #3b82f6'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>USER</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {carwash.booking_detail?.user_read?.firstname} {carwash.booking_detail?.user_read?.lastname}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>LOT</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {carwash.booking_detail?.lot_detail?.lot_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>EMPLOYEE</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {carwash.employee_detail?.name || 'Unassigned'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>PRICE</p>
                                        <p style={{ color: '#0f172a', fontWeight: '600' }}>₹{carwash.price || getCarwashTypePrice(carwash.carwash_type)}</p>
                                    </div>
                                </div>
                                    <div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>BOOKING DATE</p>
                                        <p style={{ color: '#0f172a' }}>
                                            {carwash.booking_detail?.booking_time 
                                                ? new Date(carwash.booking_detail.booking_time).toLocaleDateString()
                                                : 'N/A'
                                            }
                                        </p>
                                    </div>
                            </div>

                            <div className="service-card-actions" style={{
                                display: 'flex',
                                gap: '8px'
                            }}>
                                {carwash.status === 'Booked' && (
                                    <button style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        background: '#10b981',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = '#059669'}
                                    onMouseOut={(e) => e.target.style.background = '#10b981'}
                                    >
                                        ✓ Mark Complete
                                    </button>
                                )}
                                <button style={{
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
        </div>
    )
}

export default OwnerServices
