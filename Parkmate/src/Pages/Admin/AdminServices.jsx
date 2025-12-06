import React, { useState, useEffect } from 'react'
import parkingService from '../../services/parkingService'
import api from '../../services/api'
import './Admin.scss'

const AdminServices = () => {
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [editingServiceId, setEditingServiceId] = useState(null)
    const [editFormData, setEditFormData] = useState({})
    const [actionLoading, setActionLoading] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletingServiceId, setDeletingServiceId] = useState(null)
    const [addFormData, setAddFormData] = useState({
        name: '',
        description: '',
        price: '',
        billing_basis: 'Per wash',
        status: 'active'
    })

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            setLoading(true)
            const data = await parkingService.getCarwashTypes()
            setServices(data || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching services:', err)
            setError('Failed to load services')
        } finally {
            setLoading(false)
        }
    }

    const handleEditClick = (service) => {
        setEditingServiceId(service.carwash_type_id)
        setEditFormData({
            name: service.name,
            description: service.description,
            price: service.price,
            status: service.is_active ? 'active' : 'inactive'
        })
        setShowEditModal(true)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setEditFormData(prev => ({
            ...prev,
            [name]: name === 'price' ? parseFloat(value) || '' : value
        }))
    }

    const handleAddInputChange = (e) => {
        const { name, value } = e.target
        setAddFormData(prev => ({
            ...prev,
            [name]: name === 'price' ? parseFloat(value) || '' : value
        }))
    }

    const handleAddService = () => {
        setShowAddModal(true)
    }

    const handleSubmitAddService = () => {
        // Mock submission - show coming soon message
        setSuccessMessage('🎉 Feature coming soon! Admins will be able to add new service types in a future update.')
        setShowAddModal(false)
        setAddFormData({
            name: '',
            description: '',
            price: '',
            billing_basis: 'Per wash',
            status: 'active'
        })
        setTimeout(() => setSuccessMessage(null), 4000)
    }

    const handleDeleteService = (serviceId, serviceName) => {
        setDeletingServiceId({ id: serviceId, name: serviceName })
        setShowDeleteConfirm(true)
    }

    const confirmDeleteService = async () => {
        try {
            setActionLoading(true)
            console.log(`🗑️ Attempting to delete service ${deletingServiceId.id}...`)
            
            await api.delete(`/carwashtypes/${deletingServiceId.id}/`)
            
            setServices(services.filter(s => s.carwash_type_id !== deletingServiceId.id))
            setShowDeleteConfirm(false)
            setDeletingServiceId(null)
            setSuccessMessage('Service deleted successfully!')
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err) {
            console.error('❌ Error deleting service:', err)
            const errorMessage = err.response?.data?.detail || 'Failed to delete service. This feature may be restricted.'
            setError(errorMessage)
            setTimeout(() => setError(null), 5000)
            setShowDeleteConfirm(false)
            setDeletingServiceId(null)
        } finally {
            setActionLoading(false)
        }
    }

    const handleSaveEdit = async () => {
        try {
            setActionLoading(true)
            const updateData = {
                name: editFormData.name,
                description: editFormData.description,
                price: parseFloat(editFormData.price)
            }

            const response = await api.patch(
                `/carwashtypes/${editingServiceId}/`,
                updateData
            )

            setServices(services.map(s => 
                s.carwash_type_id === editingServiceId 
                    ? { ...s, ...response.data }
                    : s
            ))

            setShowEditModal(false)
            setEditingServiceId(null)
            setEditFormData({})
            setSuccessMessage('Service updated successfully!')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error updating service:', err)
            setError('Failed to update service')
            setTimeout(() => setError(null), 3000)
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="admin-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>🛠️ Manage Services</h1>
                    <p className="page-subtitle">
                        Total Services: <strong>{services.length}</strong> | 
                        View, edit, and manage all service types
                    </p>
                </div>
                <button
                    onClick={handleAddService}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                    <span style={{ fontSize: '1.2rem' }}>➕</span>
                    Add New Service
                </button>
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

            {/* Edit Service Modal */}
            {showEditModal && editingServiceId && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowEditModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2>✏️ Edit Service</h2>
                            <button 
                                className="close-btn" 
                                onClick={() => !actionLoading && setShowEditModal(false)}
                                disabled={actionLoading}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Service Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Interior Wash"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Description</label>
                                <textarea
                                    name="description"
                                    value={editFormData.description || ''}
                                    onChange={handleInputChange}
                                    placeholder="Describe what the service offers"
                                    rows="3"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Price (₹)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={editFormData.price || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 150.00"
                                    step="0.01"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setShowEditModal(false)}
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    backgroundColor: '#ffffff',
                                    color: '#64748b'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    backgroundColor: '#10b981',
                                    color: '#ffffff',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                            >
                                {actionLoading ? 'Saving...' : '✅ Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Service Modal (Mock) */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowAddModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2>➕ Add New Service</h2>
                            <button 
                                className="close-btn" 
                                onClick={() => setShowAddModal(false)}
                                disabled={actionLoading}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Service Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={addFormData.name}
                                    onChange={handleAddInputChange}
                                    placeholder="Enter service name (e.g., Tire Check)"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Description</label>
                                <textarea
                                    name="description"
                                    value={addFormData.description}
                                    onChange={handleAddInputChange}
                                    placeholder="Describe what the service offers"
                                    rows="3"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Price (₹)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={addFormData.price}
                                    onChange={handleAddInputChange}
                                    placeholder="Enter price per use"
                                    step="0.01"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Billing Basis</label>
                                <select
                                    name="billing_basis"
                                    value={addFormData.billing_basis}
                                    onChange={handleAddInputChange}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="Per wash">Per wash</option>
                                    <option value="Per hour">Per hour</option>
                                    <option value="Flat rate">Flat rate</option>
                                    <option value="Per booking">Per booking</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Status</label>
                                <select
                                    name="status"
                                    value={addFormData.status}
                                    onChange={handleAddInputChange}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    backgroundColor: '#ffffff',
                                    color: '#64748b'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmitAddService}
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
                                ➕ Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && deletingServiceId && (
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
                                Are you sure you want to delete this service?
                            </p>
                            <div style={{ 
                                padding: '16px', 
                                backgroundColor: '#fef2f2', 
                                borderRadius: '8px',
                                border: '1px solid #fecaca',
                                marginBottom: '16px',
                                textAlign: 'left'
                            }}>
                                <p style={{ color: '#991b1b', fontWeight: '600', marginBottom: '8px' }}>
                                    Service: {deletingServiceId.name}
                                </p>
                                <p style={{ color: '#dc2626', fontSize: '14px' }}>
                                    This will affect all users and owners who have this service available.
                                </p>
                            </div>
                            <p style={{ color: '#e11d48', fontWeight: '600', fontSize: '0.95rem' }}>
                                ⚠️ This action may be restricted by the system!
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
                                    color: '#64748b'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteService}
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
                                {actionLoading ? 'Deleting...' : '🗑️ Delete Service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading services...</p>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '24px',
                    marginTop: '24px'
                }}>
                    {services.length > 0 ? (
                        services.map(service => (
                            <div 
                                key={service.carwash_type_id} 
                                className="bento-card"
                                style={{
                                    position: 'relative',
                                    padding: '24px',
                                    borderRadius: '16px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <h3 style={{ margin: '0', fontSize: '1.25rem', color: '#1e293b' }}>{service.name}</h3>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        backgroundColor: '#dcfce7',
                                        color: '#166534'
                                    }}>
                                        🟢 Active
                                    </span>
                                </div>
                                <p style={{ color: '#64748b', margin: '8px 0 16px 0', minHeight: '60px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    {service.description}
                                </p>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    marginBottom: '20px',
                                    padding: '12px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Price</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>₹{service.price}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Billing</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Per wash</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEditClick(service)}
                                        disabled={actionLoading}
                                        style={{
                                            flex: '1',
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            backgroundColor: '#3b82f6',
                                            color: '#ffffff',
                                            transition: 'all 0.2s',
                                            fontSize: '0.9rem'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteService(service.carwash_type_id, service.name)}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            backgroundColor: '#ef4444',
                                            color: '#ffffff',
                                            transition: 'all 0.2s',
                                            fontSize: '0.9rem'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                                        title="Delete Service"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '60px 20px' }}>
                            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No services available</p>
                            <p style={{ fontSize: '0.9rem' }}>Click "Add New Service" to create one</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AdminServices
