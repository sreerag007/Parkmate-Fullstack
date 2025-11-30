import React, { useEffect, useState } from 'react'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'

const OwnerDashboard = () => {
    const { owner } = useAuth()  // Changed from user to owner
    const [dashboardData, setDashboardData] = useState({
        totalRevenue: 0,
        activeBookings: 0,
        totalSlots: 0,
        occupiedSlots: 0,
        occupancyRate: 0,
        recentActivity: [],
        ownerInfo: null
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true)
                setError(null)

                console.log('📊 Loading owner dashboard data...')
                console.log('👤 Current owner:', owner)

                // Fetch owner profile info
                const ownerId = localStorage.getItem('ownerId')
                console.log('🔍 Owner ID from localStorage:', ownerId)

                // Fetch all relevant data
                console.log('📡 Fetching bookings...')
                const bookingsData = await parkingService.getBookings()
                console.log('✅ Bookings fetched:', bookingsData)

                console.log('📡 Fetching lots...')
                const lotsData = await parkingService.getLots()
                console.log('✅ Lots fetched:', lotsData)

                // Filter to only owner's lots
                const ownerLotIds = lotsData.map(lot => lot.lot_id)
                console.log('🏢 Owner lot IDs:', ownerLotIds)

                // Filter bookings to only those from owner's lots
                const ownerBookings = bookingsData.filter(b => {
                    const lotId = b.lot_detail?.lot_id || b.lot
                    return ownerLotIds.includes(lotId)
                })
                console.log('📋 Owner bookings count:', ownerBookings.length)

                // Calculate statistics (ONLY from owner's data)
                const activeBookings = ownerBookings.filter(b => {
                  const s = b.status?.toLowerCase() || ''
                  return s === 'booked' || s === 'active' || s === 'scheduled'
                }).length
                console.log('📊 Active bookings count:', activeBookings)
                
                // Calculate revenue (ONLY from owner's bookings AND verified payments)
                const totalRevenue = ownerBookings.reduce((sum, b) => {
                    // Sum all verified payments for this booking
                    const bookingPayments = b.payments?.filter(p => p.status === 'VERIFIED') || []
                    const bookingRevenue = bookingPayments.reduce((pSum, p) => pSum + parseFloat(p.amount || 0), 0)
                    return sum + bookingRevenue
                }, 0)
                console.log('💰 Total revenue:', totalRevenue)

                // Calculate occupancy (ONLY from owner's lots)
                let totalSlots = 0
                let occupiedSlots = 0
                
                lotsData.forEach(lot => {
                    totalSlots += lot.total_slots || 0
                    const availableSlots = lot.available_slots || 0
                    occupiedSlots += (lot.total_slots || 0) - availableSlots
                })

                const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0
                console.log('📊 Occupancy rate:', occupancyRate, `(${occupiedSlots}/${totalSlots})`)

                // Create recent activity from OWNER'S bookings only
                const recentActivity = ownerBookings.slice(0, 5).map((booking, idx) => ({
                    id: booking.booking_id,
                    text: `Booking #${booking.booking_id} - ${booking.status}`,
                    time: new Date(booking.booking_time).toLocaleDateString(),
                    status: booking.status?.toLowerCase() === 'booked' ? 'green' : booking.status?.toLowerCase() === 'completed' ? 'blue' : 'yellow'
                }))

                console.log('✨ Dashboard data ready to display')
                
                setDashboardData({
                    totalRevenue: totalRevenue.toFixed(2),
                    activeBookings,
                    totalSlots,
                    occupiedSlots,
                    occupancyRate,
                    recentActivity,
                    lotsCount: lotsData.length
                })

            } catch (err) {
                console.error('❌ Error loading dashboard:', err)
                console.error('❌ Error message:', err.message)
                console.error('❌ Error response:', err.response?.data)
                setError('Failed to load dashboard data: ' + (err.message || 'Unknown error'))
            } finally {
                setLoading(false)
            }
        }

        if (owner?.role === 'Owner') {  // Changed from user?.role to owner?.role
            console.log('👤 Owner detected, loading dashboard...')
            loadDashboardData()
            
            // Refresh dashboard every 30 seconds to show new lots/bookings
            const interval = setInterval(() => {
                console.log('🔄 Auto-refreshing dashboard...')
                loadDashboardData()
            }, 30000)
            
            return () => clearInterval(interval)
        } else {
            console.log('❌ User is not an Owner:', owner?.role)
            setLoading(false)
        }
    }, [owner])  // Changed from [user] to [owner]

    if (loading) {
        return (
            <div className="owner-dashboard" style={{padding: '40px', textAlign: 'center'}}>
                <h2>Loading dashboard...</h2>
                <p>Fetching your parking lot data...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="owner-dashboard" style={{padding: '40px', textAlign: 'center'}}>
                <h2 style={{color: 'red'}}>⚠️ Error Loading Dashboard</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} style={{padding: '10px 20px', marginTop: '20px'}}>
                    Reload Page
                </button>
            </div>
        )
    }

    return (
        <div className="owner-dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Welcome back, {owner?.username || 'Owner'}! 👋</h1>
                    <p className="subtitle">Here's what's happening with your lots today.</p>
                </div>
                <div className="date-badge">{new Date().toLocaleDateString()}</div>
            </header>

            <div className="bento-grid">
                <div className="bento-card revenue">
                    <div className="card-icon">💰</div>
                    <h3>Total Revenue</h3>
                    <div className="value">₹{dashboardData.totalRevenue}</div>
                    <div className="trend positive">From all bookings</div>
                </div>

                <div className="bento-card bookings">
                    <div className="card-icon">🎟️</div>
                    <h3>Active Bookings</h3>
                    <div className="value">{dashboardData.activeBookings}</div>
                    <div className="sub-text">Currently booked</div>
                </div>

                <div className="bento-card occupancy">
                    <div className="card-icon">🚗</div>
                    <h3>Total Occupancy</h3>
                    <div className="value">{dashboardData.occupancyRate}%</div>
                    <div className="progress-bar"><div className="fill" style={{ width: `${dashboardData.occupancyRate}%` }}></div></div>
                </div>

                <div className="bento-card slots-info">
                    <div className="card-icon">📊</div>
                    <h3>Slot Details</h3>
                    <div className="value">{dashboardData.totalSlots} Total</div>
                    <div className="sub-text">{dashboardData.occupiedSlots} occupied</div>
                </div>

                <div className="bento-card lots-info">
                    <div className="card-icon">🅿️</div>
                    <h3>My Lots</h3>
                    <div className="value">{dashboardData.lotsCount || 0}</div>
                    <div className="sub-text">Parking lots managed</div>
                </div>

                <div className="bento-card recent-activity">
                    <h3>Recent Bookings</h3>
                    <ul className="activity-list">
                        {dashboardData.recentActivity.length > 0 ? (
                            dashboardData.recentActivity.map((activity) => (
                                <li key={activity.id}>
                                    <span className={`dot ${activity.status}`}></span>
                                    <span className="text">{activity.text}</span>
                                    <span className="time">{activity.time}</span>
                                </li>
                            ))
                        ) : (
                            <li><span className="text">No recent bookings</span></li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default OwnerDashboard
