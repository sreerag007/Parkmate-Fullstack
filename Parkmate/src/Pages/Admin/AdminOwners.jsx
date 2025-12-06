import React, { useState, useEffect } from 'react'
import parkingService from '../../services/parkingService'
import api from '../../services/api'
import './Admin.scss'

const AdminOwners = () => {
    const [owners, setOwners] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // all, pending, approved, declined
    const [viewingOwner, setViewingOwner] = useState(null)
    const [ownerDetails, setOwnerDetails] = useState(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [ownerLots, setOwnerLots] = useState([])
    const [lotsLoading, setLotsLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchOwners()
    }, [])

    const fetchOwners = async () => {
        try {
            setLoading(true)
            const data = await parkingService.getOwnerProfiles()
            setOwners(data || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching owners:', err)
            setError('Failed to load owners')
        } finally {
            setLoading(false)
        }
    }

    const fetchOwnerDetails = async (ownerId) => {
        try {
            setDetailsLoading(true)
            const response = await api.get(`/owner-profiles/${ownerId}/owner_details/`)
            setOwnerDetails(response.data)
        } catch (err) {
            console.error('Error fetching owner details:', err)
            setError('Failed to load owner details')
        } finally {
            setDetailsLoading(false)
        }
    }

    const fetchOwnerLots = async (ownerId) => {
        try {
            setLotsLoading(true)
            const data = await parkingService.getOwnerLots(ownerId)
            setOwnerLots(data.lots || [])
        } catch (err) {
            console.error('Error fetching owner lots:', err)
            setOwnerLots([])
        } finally {
            setLotsLoading(false)
        }
    }

    const handleViewDetails = async (owner) => {
        setViewingOwner(owner)
        await Promise.all([
            fetchOwnerDetails(owner.id),
            fetchOwnerLots(owner.id)
        ])
    }

    const handleCloseDetails = () => {
        setViewingOwner(null)
        setOwnerDetails(null)
        setOwnerLots([])
    }

    const handleApprove = async () => {
        if (!viewingOwner) return

        try {
            setActionLoading(true)
            const response = await api.post(`/owner-profiles/${viewingOwner.id}/approve/`)
            
            // Update local state
            setOwners(owners.map(o => 
                o.id === viewingOwner.id 
                    ? { ...o, verification_status: 'APPROVED' }
                    : o
            ))
            
            // Update viewing owner
            setViewingOwner({ ...viewingOwner, verification_status: 'APPROVED' })
            
            // Refresh details
            fetchOwnerDetails(viewingOwner.id)
            
            setSuccessMessage(response.data.detail)
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error approving owner:', err)
            if (err.response?.data?.error) {
                setError(err.response.data.error)
            } else {
                setError('Failed to approve owner')
            }
            setTimeout(() => setError(null), 5000)
        } finally {
            setActionLoading(false)
        }
    }

    const handleDecline = async () => {
        if (!viewingOwner) return

        try {
            setActionLoading(true)
            const response = await api.post(`/owner-profiles/${viewingOwner.id}/decline/`)
            
            // Update local state
            setOwners(owners.map(o => 
                o.id === viewingOwner.id 
                    ? { ...o, verification_status: 'DECLINED' }
                    : o
            ))
            
            // Update viewing owner
            setViewingOwner({ ...viewingOwner, verification_status: 'DECLINED' })
            
            // Refresh details
            fetchOwnerDetails(viewingOwner.id)
            
            setSuccessMessage(response.data.detail)
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error declining owner:', err)
            setError('Failed to decline owner')
            setTimeout(() => setError(null), 3000)
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        const statusLower = (status || 'PENDING').toLowerCase()
        
        switch(statusLower) {
            case 'approved':
                return <span className="status-badge status-approved" title="Owner is approved and visible to users">🟢 Approved</span>
            case 'declined':
                return <span className="status-badge status-declined" title="Owner has been declined">🔴 Declined</span>
            case 'pending':
            default:
                return <span className="status-badge status-pending" title="Awaiting admin approval">🟡 Pending</span>
        }
    }

    const filteredOwners = owners.filter(owner => {
        const searchLower = searchTerm.toLowerCase()
        const fullName = `${owner.firstname || ''} ${owner.lastname || ''}`.toLowerCase()
        const city = `${owner.city || ''}`.toLowerCase()
        const phone = `${owner.phone || ''}`.toLowerCase()
        
        const matchesSearch = (
            fullName.includes(searchLower) ||
            city.includes(searchLower) ||
            phone.includes(searchLower)
        )

        // Status filter
        const status = (owner.verification_status || 'PENDING').toLowerCase()
        const matchesStatus = 
            statusFilter === 'all' ||
            statusFilter === status

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

    const pendingCount = owners.filter(o => (o.verification_status || 'PENDING') === 'PENDING').length
    const approvedCount = owners.filter(o => o.verification_status === 'APPROVED').length
    const declinedCount = owners.filter(o => o.verification_status === 'DECLINED').length

    return (
        <div className="admin-page">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '24px', flexWrap: 'wrap' }}>
                    <div>
                        <h1>Manage Owners</h1>
                        <p>Total: {owners.length} | Pending: {pendingCount} | Approved: {approvedCount} | Declined: {declinedCount}</p>
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
                            <option value="pending">Pending Only</option>
                            <option value="approved">Approved Only</option>
                            <option value="declined">Declined Only</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search owners..."
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

            {successMessage && (
                <div className="alert alert-success">
                    <span className="alert-icon">✅</span>
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                </div>
            )}

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
                    <p>Loading owners...</p>
                </div>
            ) : (
                <>
                    {/* View Details Modal */}
                    {viewingOwner && (
                        <div className="modal-overlay" onClick={handleCloseDetails}>
                            <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Owner Details</h2>
                                    <button className="close-btn" onClick={handleCloseDetails}>&times;</button>
                                </div>
                                
                                {detailsLoading ? (
                                    <div className="modal-body">
                                        <div className="loading-state" style={{ padding: '40px' }}>
                                            <div className="spinner"></div>
                                            <p>Loading details...</p>
                                        </div>
                                    </div>
                                ) : ownerDetails ? (
                                    <>
                                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                            {/* Status Badge */}
                                            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                                {getStatusBadge(ownerDetails.verification_status)}
                                            </div>

                                            {/* Owner Information */}
                                            <div className="details-section">
                                                <h3 className="section-title">👤 Owner Information</h3>
                                                <div className="details-grid">
                                                    <div className="detail-item">
                                                        <span className="detail-label">Full Name</span>
                                                        <span className="detail-value">{ownerDetails.firstname} {ownerDetails.lastname}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Username</span>
                                                        <span className="detail-value">{ownerDetails.username}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Phone</span>
                                                        <span className="detail-value">{ownerDetails.phone || 'Not provided'}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">City</span>
                                                        <span className="detail-value">{ownerDetails.city}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">State</span>
                                                        <span className="detail-value">{ownerDetails.state}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Provides Carwash Service</span>
                                                        <span className="detail-value">
                                                            {ownerDetails.provides_carwash ? '✅ Yes' : '❌ No'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Address Details */}
                                            <div className="details-section">
                                                <h3 className="section-title">📍 Address Details</h3>
                                                <div className="details-grid">
                                                    <div className="detail-item">
                                                        <span className="detail-label">Street/Building</span>
                                                        <span className="detail-value">{ownerDetails.streetname}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Locality</span>
                                                        <span className="detail-value">{ownerDetails.locality || 'Not provided'}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">PIN Code</span>
                                                        <span className="detail-value">{ownerDetails.pincode}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Verification Document */}
                                            <div className="details-section">
                                                <h3 className="section-title">📄 Verification Document</h3>
                                                {ownerDetails.verification_document_image ? (
                                                    <div style={{ textAlign: 'center' }}>
                                                        <img 
                                                            src={`http://127.0.0.1:8000${ownerDetails.verification_document_image}`}
                                                            alt="Verification document"
                                                            style={{
                                                                maxWidth: '100%',
                                                                maxHeight: '400px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e2e8f0',
                                                                marginBottom: '12px'
                                                            }}
                                                        />
                                                        <div>
                                                            <a 
                                                                href={`http://127.0.0.1:8000${ownerDetails.verification_document_image}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn-view"
                                                                style={{ display: 'inline-block', textDecoration: 'none' }}
                                                            >
                                                                📂 View Full Document
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                                                        No verification document provided
                                                    </p>
                                                )}
                                            </div>

                                            {/* Lots Information */}
                                            <div className="details-section">
                                                <h3 className="section-title">🅿️ Parking Lots ({ownerDetails.total_lots})</h3>
                                                {lotsLoading ? (
                                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                                        <div className="spinner"></div>
                                                        <p>Loading lots...</p>
                                                    </div>
                                                ) : ownerLots.length === 0 ? (
                                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                                                        This owner has no parking lots
                                                    </p>
                                                ) : (
                                                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '12px' }}>
                                                        <table className="lots-detail-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Lot Name</th>
                                                                    <th>City</th>
                                                                    <th>Available Slots</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {ownerLots.map(lot => (
                                                                    <tr key={lot.lot_id}>
                                                                        <td style={{ fontWeight: '600' }}>{lot.lot_name}</td>
                                                                        <td>{lot.city}</td>
                                                                        <td style={{ textAlign: 'center' }}>
                                                                            <span style={{
                                                                                padding: '4px 10px',
                                                                                borderRadius: '6px',
                                                                                backgroundColor: '#ecfdf5',
                                                                                color: '#065f46',
                                                                                fontWeight: '600',
                                                                                fontSize: '13px'
                                                                            }}>
                                                                                {lot.available_slots || 0} / {lot.total_slots}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ textAlign: 'center' }}>
                                                                            {lot.provides_carwash ? (
                                                                                <span style={{
                                                                                    padding: '4px 10px',
                                                                                    borderRadius: '6px',
                                                                                    backgroundColor: '#dbeafe',
                                                                                    color: '#1e40af',
                                                                                    fontWeight: '600',
                                                                                    fontSize: '12px'
                                                                                }}>
                                                                                    🚿 Carwash
                                                                                </span>
                                                                            ) : (
                                                                                <span style={{
                                                                                    padding: '4px 10px',
                                                                                    borderRadius: '6px',
                                                                                    backgroundColor: '#f3f4f6',
                                                                                    color: '#6b7280',
                                                                                    fontWeight: '600',
                                                                                    fontSize: '12px'
                                                                                }}>
                                                                                    🅿️ Parking Only
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Statistics */}
                                            <div className="details-section">
                                                <h3 className="section-title">📊 Statistics</h3>
                                                <div className="stats-grid">
                                                    <div className="stat-card">
                                                        <div className="stat-value">{ownerDetails.total_lots}</div>
                                                        <div className="stat-label">Total Lots</div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-value">{ownerDetails.total_available_slots}</div>
                                                        <div className="stat-label">Total Available Slots</div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-label">Joined</div>
                                                        <div className="stat-value" style={{ fontSize: '14px' }}>
                                                            {formatDate(ownerDetails.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Modal Actions */}
                                        <div className="modal-actions" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                            {ownerDetails.verification_status === 'DECLINED' ? (
                                                <div style={{ 
                                                    padding: '12px 16px', 
                                                    backgroundColor: '#fef2f2', 
                                                    borderRadius: '8px',
                                                    border: '1px solid #fecaca',
                                                    color: '#991b1b',
                                                    fontWeight: '600',
                                                    textAlign: 'center',
                                                    flex: 1
                                                }}>
                                                    ⚠️ Declined owners cannot be reapproved
                                                </div>
                                            ) : (
                                                <>
                                                    <button 
                                                        className="btn-success"
                                                        onClick={handleApprove}
                                                        disabled={actionLoading || ownerDetails.verification_status === 'APPROVED'}
                                                    >
                                                        {actionLoading ? 'Processing...' : '✅ Approve Owner'}
                                                    </button>
                                                    <button 
                                                        className="btn-danger"
                                                        onClick={handleDecline}
                                                        disabled={actionLoading}
                                                    >
                                                        {actionLoading ? 'Processing...' : '🔴 Decline Owner'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="modal-body">
                                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                                            Failed to load owner details
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Owners Table */}
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>City</th>
                                    <th>Phone</th>
                                    <th>Carwash Service</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOwners.length > 0 ? (
                                    filteredOwners.map(owner => (
                                        <tr key={owner.id}>
                                            <td style={{ fontWeight: '600' }}>
                                                {owner.firstname} {owner.lastname}
                                            </td>
                                            <td>{owner.city || 'N/A'}</td>
                                            <td>{owner.phone || 'N/A'}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                {owner.provides_carwash ? (
                                                    <span className="badge-type" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                                        ✅ Yes
                                                    </span>
                                                ) : (
                                                    <span className="badge-type">
                                                        ❌ No
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {getStatusBadge(owner.verification_status)}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        className="btn-view"
                                                        onClick={() => handleViewDetails(owner)}
                                                        title="View comprehensive owner details"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                                            {searchTerm || statusFilter !== 'all' 
                                                ? 'No owners match your filters' 
                                                : 'No owners found'
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

export default AdminOwners