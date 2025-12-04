import React, { useState, useEffect } from 'react'
import parkingService from '../../services/parkingService'
import api from '../../services/api'
import './Admin.scss'

const AdminUsers = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingUser, setEditingUser] = useState(null)
    const [editFormData, setEditFormData] = useState({})
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

    const handleEdit = (user) => {
        setEditingUser(user.id)
        setEditFormData(user)
    }

    const handleSaveEdit = async () => {
        try {
            setActionLoading(true)
            // Update user profile
            const updatedUser = await api.patch(`/user-profiles/${editingUser}/`, {
                firstname: editFormData.firstname,
                lastname: editFormData.lastname,
                phone: editFormData.phone,
                vehicle_number: editFormData.vehicle_number,
                vehicle_type: editFormData.vehicle_type,
            })
            
            // Update local state
            setUsers(users.map(u => u.id === editingUser ? updatedUser.data : u))
            setEditingUser(null)
            setEditFormData({})
            console.log('User updated successfully')
        } catch (err) {
            console.error('Error updating user:', err)
            setError('Failed to update user')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteUser = async (userId) => {
        try {
            setActionLoading(true)
            // Delete user profile
            await api.delete(`/user-profiles/${userId}/`)
            
            // Update local state
            setUsers(users.filter(u => u.id !== userId))
            setShowDeleteConfirm(null)
            console.log('User deleted successfully')
        } catch (err) {
            console.error('Error deleting user:', err)
            setError('Failed to delete user')
        } finally {
            setActionLoading(false)
        }
    }

    const handleCancelEdit = () => {
        setEditingUser(null)
        setEditFormData({})
    }

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase()
        const fullName = `${user.firstname || ''} ${user.lastname || ''}`.toLowerCase()
        const phone = `${user.phone || ''}`.toLowerCase()
        const vehicle = `${user.vehicle_number || ''}`.toLowerCase()
        
        return (
            fullName.includes(searchLower) ||
            phone.includes(searchLower) ||
            vehicle.includes(searchLower)
        )
    })

    return (
        <div className="admin-page">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '24px' }}>
                    <div>
                        <h1>Manage Users</h1>
                        <p>Total Users: {users.length}</p>
                    </div>
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

            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading users...</p>
                </div>
            ) : (
                <>
                    {editingUser && (
                        <div className="modal-overlay" onClick={handleCancelEdit}>
                            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Edit User</h2>
                                    <button className="close-btn" onClick={handleCancelEdit}>&times;</button>
                                </div>
                                <div className="modal-body">
                                    <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                                        <div className="form-group">
                                            <label>First Name</label>
                                            <input
                                                type="text"
                                                value={editFormData.firstname || ''}
                                                onChange={(e) => setEditFormData({...editFormData, firstname: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Last Name</label>
                                            <input
                                                type="text"
                                                value={editFormData.lastname || ''}
                                                onChange={(e) => setEditFormData({...editFormData, lastname: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone</label>
                                            <input
                                                type="tel"
                                                value={editFormData.phone || ''}
                                                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Vehicle Number</label>
                                            <input
                                                type="text"
                                                value={editFormData.vehicle_number || ''}
                                                onChange={(e) => setEditFormData({...editFormData, vehicle_number: e.target.value})}
                                                placeholder="e.g., KL-08-AZ-1234"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Vehicle Type</label>
                                            <select
                                                value={editFormData.vehicle_type || ''}
                                                onChange={(e) => setEditFormData({...editFormData, vehicle_type: e.target.value})}
                                            >
                                                <option value="">Select type</option>
                                                <option value="Hatchback">Hatchback</option>
                                                <option value="Sedan">Sedan</option>
                                                <option value="Multi-Axle">Multi-Axle</option>
                                                <option value="Three-Wheeler">Three-Wheeler</option>
                                                <option value="Two-Wheeler">Two-Wheeler</option>
                                            </select>
                                        </div>
                                        <div className="modal-actions">
                                            <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn-primary" disabled={actionLoading}>
                                                {actionLoading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {showDeleteConfirm && (
                        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                            <div className="modal-card delete-confirm" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Confirm Delete</h2>
                                </div>
                                <div className="modal-body">
                                    <p>Are you sure you want to delete this user account? This action cannot be undone.</p>
                                    <p style={{ color: '#e11d48', fontWeight: '600', marginTop: '16px' }}>
                                        User: {showDeleteConfirm.firstname} {showDeleteConfirm.lastname}
                                    </p>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                                        Cancel
                                    </button>
                                    <button 
                                        className="btn-danger" 
                                        onClick={() => handleDeleteUser(showDeleteConfirm.id)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Deleting...' : 'Delete User'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
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
                                            <td style={{ fontWeight: '600' }}>
                                                {user.firstname} {user.lastname}
                                            </td>
                                            <td>{user.phone || 'N/A'}</td>
                                            <td>{user.vehicle_number || 'N/A'}</td>
                                            <td>
                                                <span className="status-badge active">
                                                    {user.vehicle_type || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        className="btn-edit"
                                                        onClick={() => handleEdit(user)}
                                                        title="Edit user"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="btn-delete"
                                                        onClick={() => setShowDeleteConfirm(user)}
                                                        title="Delete user"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                                            No users found
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
