import React, { useState, useEffect } from 'react'
import parkingService from '../../services/parkingService'
import api from '../../services/api'
import './Admin.scss'

const AdminUsers = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // all, active, disabled
    const [viewingUser, setViewingUser] = useState(null)
    const [userDetails, setUserDetails] = useState(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const data = await parkingService.getUsers()
            setUsers(data || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching users:', err)
            setError('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const fetchUserDetails = async (userId) => {
        try {
            setDetailsLoading(true)
            const response = await api.get(`/user-profiles/${userId}/user_details/`)
            setUserDetails(response.data)
        } catch (err) {
            console.error('Error fetching user details:', err)
            setError('Failed to load user details')
        } finally {
            setDetailsLoading(false)
        }
    }

    const handleViewDetails = (user) => {
        setViewingUser(user)
        fetchUserDetails(user.id)
    }

    const handleCloseDetails = () => {
        setViewingUser(null)
        setUserDetails(null)
    }

    const handleToggleStatus = async () => {
        if (!viewingUser) return

        try {
            setActionLoading(true)
            const response = await api.post(`/user-profiles/${viewingUser.id}/toggle_status/`)
            
            // Update local state
            setUsers(users.map(u => 
                u.id === viewingUser.id 
                    ? { ...u, is_active: response.data.is_active }
                    : u
            ))
            
            // Update viewing user
            setViewingUser({ ...viewingUser, is_active: response.data.is_active })
            
            // Refresh details
            fetchUserDetails(viewingUser.id)
            
            console.log(response.data.detail)
        } catch (err) {
            console.error('Error toggling user status:', err)
            setError('Failed to toggle user status')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!showDeleteConfirm) return

        try {
            setActionLoading(true)
            const response = await api.delete(`/user-profiles/${showDeleteConfirm.id}/`)
            
            // Update local state
            setUsers(users.filter(u => u.id !== showDeleteConfirm.id))
            
            // Close modals
            setShowDeleteConfirm(null)
            setViewingUser(null)
            setUserDetails(null)
            
            console.log('User deleted:', response.data)
        } catch (err) {
            console.error('Error deleting user:', err)
            setError('Failed to delete user')
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusBadge = (user) => {
        // Check if user has is_active property (from detailed view)
        const isActive = user.is_active !== undefined ? user.is_active : true
        
        if (isActive) {
            return <span className="status-badge status-active">🟢 Active</span>
        } else {
            return <span className="status-badge status-disabled">🟡 Disabled</span>
        }
    }

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase()
        const fullName = `${user.firstname || ''} ${user.lastname || ''}`.toLowerCase()
        const phone = `${user.phone || ''}`.toLowerCase()
        const vehicle = `${user.vehicle_number || ''}`.toLowerCase()
        const username = `${user.username || ''}`.toLowerCase()
        
        const matchesSearch = (
            fullName.includes(searchLower) ||
            phone.includes(searchLower) ||
            vehicle.includes(searchLower) ||
            username.includes(searchLower)
        )

        // Status filter
        const isActive = user.is_active !== undefined ? user.is_active : true
        const matchesStatus = 
            statusFilter === 'all' ||
            (statusFilter === 'active' && isActive) ||
            (statusFilter === 'disabled' && !isActive)

        return matchesSearch && matchesStatus
    })

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount).toFixed(2)}`
    }

    return (
        <div className="admin-page">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '24px', flexWrap: 'wrap' }}>
                    <div>
                        <h1>Manage Users</h1>
                        <p>Total Users: {users.length} | Active: {users.filter(u => u.is_active !== false).length}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="disabled">Disabled Only</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search users..."
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
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading users...</p>
                </div>
            ) : (
                <>
                    {/* View Details Modal */}
                    {viewingUser && (
                        <div className="modal-overlay" onClick={handleCloseDetails}>
                            <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>User Details</h2>
                                    <button className="close-btn" onClick={handleCloseDetails}>&times;</button>
                                </div>
                                
                                {detailsLoading ? (
                                    <div className="modal-body">
                                        <div className="loading-state" style={{ padding: '40px' }}>
                                            <div className="spinner"></div>
                                            <p>Loading details...</p>
                                        </div>
                                    </div>
                                ) : userDetails ? (
                                    <>
                                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                            {/* Status Badge */}
                                            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                                {getStatusBadge(userDetails)}
                                            </div>

                                            {/* Profile Section */}
                                            <div className="details-section">
                                                <h3 className="section-title">👤 Profile Information</h3>
                                                <div className="details-grid">
                                                    <div className="detail-item">
                                                        <span className="detail-label">Username</span>
                                                        <span className="detail-value">{userDetails.username}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Email</span>
                                                        <span className="detail-value">{userDetails.email || 'Not provided'}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Full Name</span>
                                                        <span className="detail-value">{userDetails.firstname} {userDetails.lastname}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Phone</span>
                                                        <span className="detail-value">{userDetails.phone || 'Not provided'}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Joined</span>
                                                        <span className="detail-value">{formatDate(userDetails.date_joined)}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Last Updated</span>
                                                        <span className="detail-value">{formatDate(userDetails.updated_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vehicle Section */}
                                            <div className="details-section">
                                                <h3 className="section-title">🚗 Vehicle Information</h3>
                                                <div className="details-grid vehicle-grid">
                                                    <div className="detail-item">
                                                        <span className="detail-label">Vehicle Number</span>
                                                        <span className="detail-value">{userDetails.vehicle_number || 'Not provided'}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Vehicle Type</span>
                                                        <span className="detail-value">{userDetails.vehicle_type || 'Not provided'}</span>
                                                    </div>
                                                    <div className="detail-item license-item">
                                                        <span className="detail-label">Driving License</span>
                                                        {userDetails.driving_license ? (
                                                            <div className="license-image-container">
                                                                <img 
                                                                    src={`http://127.0.0.1:8000${userDetails.driving_license}`} 
                                                                    alt="Driving License" 
                                                                    className="license-image"
                                                                    onClick={() => window.open(`http://127.0.0.1:8000${userDetails.driving_license}`, '_blank')}
                                                                />
                                                                <div className="license-overlay">
                                                                    <span>Click to view full size</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="detail-value">Not provided</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Booking Statistics */}
                                            <div className="details-section">
                                                <h3 className="section-title">📅 Booking Statistics</h3>
                                                <div className="stats-grid">
                                                    <div className="stat-card">
                                                        <div className="stat-value">{userDetails.total_slot_bookings}</div>
                                                        <div className="stat-label">Slot Bookings</div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-value">{userDetails.total_carwash_bookings}</div>
                                                        <div className="stat-label">Carwash Bookings</div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-value">
                                                            {userDetails.total_slot_bookings + userDetails.total_carwash_bookings}
                                                        </div>
                                                        <div className="stat-label">Total Bookings</div>
                                                    </div>
                                                    <div className="stat-card" style={{ gridColumn: 'span 3' }}>
                                                        <div className="stat-label">Last Booking</div>
                                                        <div className="stat-value" style={{ fontSize: '14px' }}>
                                                            {formatDate(userDetails.last_booking_date)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Statistics */}
                                            <div className="details-section">
                                                <h3 className="section-title">💰 Payment Statistics</h3>
                                                <div className="stats-grid">
                                                    <div className="stat-card">
                                                        <div className="stat-value">{userDetails.total_transactions}</div>
                                                        <div className="stat-label">Transactions</div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-value">{formatCurrency(userDetails.total_amount_spent)}</div>
                                                        <div className="stat-label">Total Spent</div>
                                                    </div>
                                                    <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                                                        <div className="stat-label">Last Payment</div>
                                                        <div className="stat-value" style={{ fontSize: '14px' }}>
                                                            {formatDate(userDetails.last_payment_date)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Review Statistics */}
                                            <div className="details-section">
                                                <h3 className="section-title">⭐ Review Statistics</h3>
                                                <div className="stats-grid">
                                                    <div className="stat-card">
                                                        <div className="stat-value">{userDetails.total_reviews}</div>
                                                        <div className="stat-label">Reviews Given</div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-value">
                                                            {userDetails.average_rating_given > 0 
                                                                ? `${userDetails.average_rating_given} / 5.0`
                                                                : 'No reviews'
                                                            }
                                                        </div>
                                                        <div className="stat-label">Average Rating Given</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Modal Actions */}
                                        <div className="modal-actions" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                            <button 
                                                className={userDetails.is_active ? "btn-warning" : "btn-success"}
                                                onClick={handleToggleStatus}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? 'Processing...' : (userDetails.is_active ? '🔒 Disable User' : '✅ Enable User')}
                                            </button>
                                            <button 
                                                className="btn-danger"
                                                onClick={() => setShowDeleteConfirm(userDetails)}
                                                disabled={actionLoading}
                                            >
                                                🗑️ Delete User
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="modal-body">
                                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                                            Failed to load user details
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                            <div className="modal-card delete-confirm" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>⚠️ Confirm Permanent Delete</h2>
                                </div>
                                <div className="modal-body">
                                    <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                                        Are you sure you want to permanently delete this user?
                                    </p>
                                    <div style={{ 
                                        padding: '16px', 
                                        backgroundColor: '#fef2f2', 
                                        borderRadius: '8px',
                                        border: '1px solid #fecaca',
                                        marginBottom: '16px'
                                    }}>
                                        <p style={{ color: '#991b1b', fontWeight: '600', marginBottom: '8px' }}>
                                            User: {showDeleteConfirm.firstname} {showDeleteConfirm.lastname} ({showDeleteConfirm.username})
                                        </p>
                                        <p style={{ color: '#dc2626', fontSize: '14px' }}>
                                            This action will permanently delete:
                                        </p>
                                        <ul style={{ color: '#dc2626', fontSize: '14px', marginTop: '8px', paddingLeft: '24px' }}>
                                            <li>User account and profile</li>
                                            <li>All booking history ({(showDeleteConfirm.total_slot_bookings || 0) + (showDeleteConfirm.total_carwash_bookings || 0)} bookings)</li>
                                            <li>All payment records ({showDeleteConfirm.total_transactions || 0} transactions)</li>
                                            <li>All reviews ({showDeleteConfirm.total_reviews || 0} reviews)</li>
                                        </ul>
                                    </div>
                                    <p style={{ color: '#e11d48', fontWeight: '600', fontSize: '14px' }}>
                                        ⚠️ This action cannot be undone!
                                    </p>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                                        Cancel
                                    </button>
                                    <button 
                                        className="btn-danger" 
                                        onClick={handleDeleteUser}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Deleting...' : 'Confirm Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Table */}
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Phone</th>
                                    <th>Vehicle</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>{getStatusBadge(user)}</td>
                                            <td style={{ fontWeight: '600' }}>
                                                {user.firstname} {user.lastname}
                                            </td>
                                            <td style={{ color: '#64748b' }}>{user.username}</td>
                                            <td>{user.phone || 'N/A'}</td>
                                            <td>{user.vehicle_number || 'N/A'}</td>
                                            <td>
                                                <span className="badge-type">
                                                    {user.vehicle_type || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        className="btn-view"
                                                        onClick={() => handleViewDetails(user)}
                                                        title="View details"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                                            {searchTerm || statusFilter !== 'all' 
                                                ? 'No users match your filters' 
                                                : 'No users found'
                                            }
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}

export default AdminUsers
