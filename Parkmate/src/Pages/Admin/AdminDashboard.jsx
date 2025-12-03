import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import parkingService from '../../services/parkingService'
import './Admin.scss'

const AdminDashboard = () => {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOwners: 0,
        totalBookings: 0,
        totalRevenue: 0,
        pendingOwners: 0,
        totalEmployees: 0,
    })
    const [recentActivity, setRecentActivity] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchDashboardData()
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const [users, owners, bookings, allPayments, employees] = await Promise.all([
                parkingService.getUsers().catch(err => {
                    console.error('Error fetching users:', err)
                    return []
                }),
                parkingService.getOwnerProfiles().catch(err => {
                    console.error('Error fetching owners:', err)
                    return []
                }),
                parkingService.getBookings().catch(err => {
                    console.error('Error fetching bookings:', err)
                    return []
                }),
                // Fetch all payments to calculate platform revenue accurately
                parkingService.getPayments().catch(err => {
                    console.error('Error fetching payments:', err)
                    return { results: [] }
                }),
                parkingService.getEmployees().catch(err => {
                    console.error('Error fetching employees:', err)
                    return []
                }),
            ])

            // Handle paginated responses
            const usersList = Array.isArray(users) ? users : (users?.results || [])
            const ownersList = Array.isArray(owners) ? owners : (owners?.results || [])
            const bookingsList = Array.isArray(bookings) ? bookings : (bookings?.results || [])
            const paymentsList = Array.isArray(allPayments) ? allPayments : (allPayments?.results || [])
            const employeesList = Array.isArray(employees) ? employees : (employees?.results || [])

            console.log('📊 Dashboard Data:', {
                users: usersList.length,
                owners: ownersList.length,
                bookings: bookingsList.length,
                payments: paymentsList.length,
                employees: employeesList.length,
            })

            console.log('💳 Payments Sample:', paymentsList.slice(0, 3))

            // Calculate statistics
            const totalUsers = usersList?.length || 0
            const totalOwners = ownersList?.length || 0
            const totalBookings = bookingsList?.length || 0
            // Only count SUCCESS payments for revenue (exclude PENDING and FAILED)
            const successfulPayments = (paymentsList || []).filter(p => p.status === 'SUCCESS')
            const totalPayments = successfulPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
            // Platform gets 30% of all successful payments (slot bookings + car wash bookings)
            const platformRevenue = totalPayments * 0.30
            const pendingOwners = (ownersList || []).filter(o => o.verification_status === 'PENDING').length
            const totalEmployees = (employeesList || []).length

            console.log('💰 Revenue Calculation:', {
                totalPayments: paymentsList.length,
                successfulPayments: successfulPayments.length,
                totalAmount: totalPayments.toFixed(2),
                platformRevenue: platformRevenue.toFixed(2)
            })

            setStats({
                totalUsers,
                totalOwners,
                totalBookings,
                totalRevenue: platformRevenue,
                pendingOwners,
                totalEmployees,
            })

            // Build recent activity
            const activity = []
            
            // Add recent bookings
            if (bookingsList && bookingsList.length > 0) {
                bookingsList.slice(0, 3).forEach(booking => {
                    activity.push({
                        id: `booking-${booking.booking_id}`,
                        type: 'booking',
                        text: `Booking #${booking.booking_id} - ${booking.status}`,
                        time: new Date(booking.booking_time).toLocaleString(),
                        color: 'blue'
                    })
                })
            }

            // Add recent owner registrations
            if (ownersList && ownersList.length > 0) {
                ownersList.slice(0, 2).forEach(owner => {
                    activity.push({
                        id: `owner-${owner.id}`,
                        type: 'owner',
                        text: `New Owner: ${owner.firstname} ${owner.lastname}`,
                        time: 'Recently',
                        color: 'green'
                    })
                })
            }

            setRecentActivity(activity.slice(0, 5))
            setError(null)
        } catch (err) {
            console.error('Error fetching dashboard data:', err)
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    if (loading && !stats.totalUsers) {
        return (
            <div className="admin-dashboard">
                <header className="dashboard-header">
                    <div>
                        <h1>Admin Overview</h1>
                        <p className="subtitle">System-wide metrics and management.</p>
                    </div>
                </header>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Admin Overview</h1>
                    <p className="subtitle">System-wide metrics and management.</p>
                </div>
                <div className="date-badge">{new Date().toLocaleDateString()}</div>
            </header>

            {error && (
                <div className="alert alert-warning">
                    <span className="alert-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <div className="bento-grid">
                <div className="bento-card users">
                    <div className="card-icon">👥</div>
                    <h3>Total Users</h3>
                    <div className="value">{stats.totalUsers}</div>
                    <div className="sub-text">Active platform users</div>
                </div>

                <div className="bento-card owners">
                    <div className="card-icon">🏢</div>
                    <h3>Registered Owners</h3>
                    <div className="value">{stats.totalOwners}</div>
                    <div className="sub-text">{stats.pendingOwners} pending approval</div>
                </div>

                <div className="bento-card bookings">
                    <div className="card-icon">📅</div>
                    <h3>Total Bookings</h3>
                    <div className="value">{stats.totalBookings}</div>
                    <div className="sub-text">All-time bookings</div>
                </div>

                <div className="bento-card revenue">
                    <div className="card-icon">💰</div>
                    <h3>Platform Revenue</h3>
                    <div className="value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
                    <div className="sub-text">30% commission from all payments</div>
                </div>

                <div className="bento-card employees">
                    <div className="card-icon">👷</div>
                    <h3>Total Employees</h3>
                    <div className="value">{stats.totalEmployees}</div>
                    <div className="sub-text">Registered employees</div>
                </div>

                <div className="bento-card quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="action-buttons">
                        <button 
                            className="action-btn"
                            onClick={() => navigate('/admin/users')}
                        >
                            👤 Manage Users
                        </button>
                        <button 
                            className="action-btn"
                            onClick={() => navigate('/admin/owners')}
                        >
                            ✓ Approve Owners
                        </button>
                        <button 
                            className="action-btn"
                            onClick={() => navigate('/admin/bookings')}
                        >
                            📊 View Bookings
                        </button>
                    </div>
                </div>

                {recentActivity.length > 0 && (
                    <div className="bento-card recent-activity">
                        <h3>Recent System Activity</h3>
                        <ul className="activity-list">
                            {recentActivity.map((activity) => (
                                <li key={activity.id}>
                                    <span className={`dot ${activity.color}`}></span>
                                    <span className="text">{activity.text}</span>
                                    <span className="time">{activity.time}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="bento-card profile-summary">
                    <h3>System Status</h3>
                    <div className="profile-info">
                        <div className="avatar">AD</div>
                        <div>
                            <div className="name">Admin Portal</div>
                            <div className="status">🟢 Online</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
