import React, { useState, useEffect } from 'react'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import './Owner.scss'

const OwnerProfile = () => {
    const { owner } = useAuth()
    const [profile, setProfile] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    useEffect(() => {
        fetchOwnerProfile()
    }, [])

    const fetchOwnerProfile = async () => {
        try {
            setLoading(true)
            const data = await parkingService.getOwnerProfile()
            setProfile(data)
            setFormData({
                firstname: data.firstname || '',
                lastname: data.lastname || '',
                phone: data.phone || '',
                streetname: data.streetname || '',
                locality: data.locality || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
            })
            setError(null)
        } catch (err) {
            console.error('Error fetching owner profile:', err)
            setError('Failed to load profile. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            const ownerId = localStorage.getItem('ownerId')
            const updatedProfile = await parkingService.updateOwnerProfile(ownerId, formData)
            setProfile(updatedProfile)
            setIsEditing(false)
            setSuccess('Profile updated successfully!')
            setTimeout(() => setSuccess(null), 3000)
            setError(null)
        } catch (err) {
            console.error('Error updating profile:', err)
            setError('Failed to update profile. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        // Reset form to current profile data
        if (profile) {
            setFormData({
                firstname: profile.firstname || '',
                lastname: profile.lastname || '',
                phone: profile.phone || '',
                streetname: profile.streetname || '',
                locality: profile.locality || '',
                city: profile.city || '',
                state: profile.state || '',
                pincode: profile.pincode || '',
            })
        }
    }

    if (loading) {
        return (
            <div className="owner-profile-container">
                <div className="page-header">
                    <h1>Profile</h1>
                    <p>Manage your account information</p>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="owner-profile-container">
                <div className="page-header">
                    <h1>Profile</h1>
                    <p>Manage your account information</p>
                </div>
                <div className="error-state">
                    <p>Unable to load profile</p>
                </div>
            </div>
        )
    }

    return (
        <div className="owner-profile-container">
            <div className="page-header">
                <h1>Profile</h1>
                <p>Manage your account information</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{error}</span>
                    <button className="alert-close" onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <span className="alert-icon">✓</span>
                    <span>{success}</span>
                </div>
            )}

            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {formData.firstname?.charAt(0).toUpperCase()}{formData.lastname?.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info">
                        <h2>{formData.firstname} {formData.lastname}</h2>
                        <p className="profile-email">{owner?.email}</p>
                        <p className="profile-phone">{formData.phone}</p>
                    </div>
                </div>

                <div className="profile-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="firstname"
                                value={formData.firstname}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="lastname"
                                value={formData.lastname}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Street Name</label>
                            <input
                                type="text"
                                name="streetname"
                                value={formData.streetname}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Locality</label>
                            <input
                                type="text"
                                name="locality"
                                value={formData.locality}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>State</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Pin Code</label>
                            <input
                                type="text"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="verification-status">
                        <span className="status-label">Verification Status:</span>
                        <span className={`status-badge status-${profile.verification_status?.toLowerCase()}`}>
                            {profile.verification_status || 'PENDING'}
                        </span>
                    </div>
                </div>

                <div className="profile-actions">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn btn-primary"
                        >
                            ✏️ Edit Profile
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="btn btn-success"
                            >
                                {loading ? 'Saving...' : '💾 Save Changes'}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default OwnerProfile
