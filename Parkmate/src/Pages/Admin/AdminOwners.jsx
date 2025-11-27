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
    const [selectedOwner, setSelectedOwner] = useState(null)
    const [showDocumentModal, setShowDocumentModal] = useState(false)
    const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)
    const [pendingOwnerId, setPendingOwnerId] = useState(null)
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

    const handleApprove = async (ownerId) => {
        try {
            setActionLoading(true)
            await api.patch(`/owner-profiles/${ownerId}/`, { 
                verification_status: 'APPROVED' 
            })
            setOwners(owners.map(o => 
                o.id === ownerId ? { ...o, verification_status: 'APPROVED' } : o
            ))
            setSuccessMessage('Owner approved successfully!')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error approving owner:', err)
            setError('Failed to approve owner')
            setTimeout(() => setError(null), 3000)
        } finally {
            setActionLoading(false)
        }
    }

    const handleDecline = async (ownerId) => {
        try {
            setActionLoading(true)
            await api.patch(`/owner-profiles/${ownerId}/`, { 
                verification_status: 'DECLINED'
            })
            setOwners(owners.map(o => 
                o.id === ownerId ? { ...o, verification_status: 'DECLINED' } : o
            ))
            setShowDeclineConfirm(false)
            setPendingOwnerId(null)
            setSuccessMessage('Owner declined successfully!')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error declining owner:', err)
            setError('Failed to decline owner')
            setTimeout(() => setError(null), 3000)
        } finally {
            setActionLoading(false)
        }
    }

    const handleStatusChange = async (ownerId, newStatus) => {
        try {
            setActionLoading(true)
            await api.patch(`/owner-profiles/${ownerId}/`, { 
                verification_status: newStatus 
            })
            setOwners(owners.map(o => 
                o.id === ownerId ? { ...o, verification_status: newStatus } : o
            ))
            setSuccessMessage(`Owner status changed to ${newStatus}!`)
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error changing owner status:', err)
            setError('Failed to change owner status')
            setTimeout(() => setError(null), 3000)
        } finally {
            setActionLoading(false)
        }
    }

    const handleViewDocument = (owner) => {
        setSelectedOwner(owner)
        setShowDocumentModal(true)
    }

    const handleCloseDocumentModal = () => {
        setShowDocumentModal(false)
        setSelectedOwner(null)
    }

    const filteredOwners = owners.filter(owner => {
        const searchLower = searchTerm.toLowerCase()
        const fullName = `${owner.firstname || ''} ${owner.lastname || ''}`.toLowerCase()
        const city = `${owner.city || ''}`.toLowerCase()
        const phone = `${owner.phone || ''}`.toLowerCase()
        
        return (
            fullName.includes(searchLower) ||
            city.includes(searchLower) ||
            phone.includes(searchLower)
        )
    })

    const pendingCount = owners.filter(o => o.verification_status === 'PENDING').length
    const approvedCount = owners.filter(o => o.verification_status === 'APPROVED').length
    const declinedCount = owners.filter(o => o.verification_status === 'DECLINED').length

    return (
        <div className="admin-page">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '24px' }}>
                    <div>
                        <h1>Manage Owners</h1>
                        <p>Total: {owners.length} | Pending: {pendingCount} | Approved: {approvedCount} | Declined: {declinedCount}</p>
                    </div>
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

            {showDocumentModal && selectedOwner && (
                <div className="modal-overlay" onClick={handleCloseDocumentModal}>
                    <div className="modal-card document-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Verification Document</h2>
                            <button className="close-btn" onClick={handleCloseDocumentModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="owner-info">
                                <h3>{selectedOwner.firstname} {selectedOwner.lastname}</h3>
                                <p className="info-text">{selectedOwner.city}, {selectedOwner.state}</p>
                                <p className="info-text">Phone: {selectedOwner.phone}</p>
                            </div>

                            {selectedOwner.verification_document_image ? (
                                <div className="document-container">
                                    <label>Verification Document:</label>
                                    <img 
                                        src={selectedOwner.verification_document_image} 
                                        alt="Verification document"
                                        className="document-image"
                                    />
                                </div>
                            ) : (
                                <p className="no-document">No verification document provided</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showDeclineConfirm && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowDeclineConfirm(false)}>
                    <div className="modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Decline</h2>
                            <button className="close-btn" onClick={() => !actionLoading && setShowDeclineConfirm(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to decline this owner?</p>
                            <p className="owner-name"><strong>{selectedOwner?.firstname} {selectedOwner?.lastname}</strong></p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={() => setShowDeclineConfirm(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-danger"
                                onClick={() => handleDecline(pendingOwnerId)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' : 'Yes, Decline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading owners...</p>
                </div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>City</th>
                                <th>Phone</th>
                                <th>Approval Status</th>
                                <th>Actions</th>
                                <th>Approval/Decline</th>
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
                                        <td>
                                            <span className={`status-badge ${owner.verification_status?.toLowerCase() || 'pending'}`}>
                                                {owner.verification_status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => handleViewDocument(owner)}
                                                    title="View verification document"
                                                >
                                                    View Doc
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="status-buttons-group">
                                                <button
                                                    className="status-btn approved"
                                                    onClick={() => handleApprove(owner.id)}
                                                    disabled={actionLoading || owner.verification_status === 'APPROVED'}
                                                    title="Approve owner"
                                                >
                                                    {actionLoading ? 'Processing...' : 'Approve'}
                                                </button>
                                                <button
                                                    className="status-btn declined"
                                                    onClick={() => {
                                                        setSelectedOwner(owner)
                                                        setPendingOwnerId(owner.id)
                                                        setShowDeclineConfirm(true)
                                                    }}
                                                    disabled={actionLoading || owner.verification_status === 'DECLINED'}
                                                    title="Decline owner"
                                                >
                                                    {actionLoading ? 'Processing...' : 'Decline'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                                        No owners found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default AdminOwners

