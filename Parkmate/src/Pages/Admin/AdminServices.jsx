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
            price: service.price
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
            <div className="page-header">
                <div>
                    <h1>Manage Services</h1>
                    <p>Edit carwash service details (name, description, and price).</p>
                </div>
            </div>

            {successMessage && (
                <div className="alert alert-success">
                    <span className="alert-icon">Success</span>
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">Error</span>
                    <span>{error}</span>
                </div>
            )}

            {showEditModal && editingServiceId && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowEditModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Edit Service</h2>
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
                                <label>Service Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Interior Wash"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={editFormData.description || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Interior Cleaning"
                                />
                            </div>
                            <div className="form-group">
                                <label>Price (₹)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={editFormData.price || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 150.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={() => setShowEditModal(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={handleSaveEdit}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Saving...' : 'Save Changes'}
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
                <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {services.length > 0 ? (
                        services.map(service => (
                            <div key={service.carwash_type_id} className="bento-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <h3 style={{ margin: '0' }}>{service.name}</h3>
                                    <span className="status-badge active">
                                        Active
                                    </span>
                                </div>
                                <p style={{ color: '#64748b', margin: '8px 0 16px 0', minHeight: '40px' }}>
                                    {service.description}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600' }}>
                                    <span className="value">₹{service.price}</span>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Per wash</span>
                                </div>
                                <button
                                    className="btn-edit"
                                    onClick={() => handleEditClick(service)}
                                    disabled={actionLoading}
                                    style={{ width: '100%' }}
                                >
                                    Edit Service
                                </button>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                            <p>No services available</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AdminServices
