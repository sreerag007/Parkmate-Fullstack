import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import './Auth.scss'

const OwnerRegister = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstname: '',
        lastname: '',
        phone: '',
        streetname: '',
        locality: '',
        city: '',
        state: '',
        pincode: '',
        verification_document_image: null
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { registerOwner, loginOwner } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value, files } = e.target
        if (name === 'verification_document_image') {
            setFormData(prev => ({ ...prev, [name]: files[0] }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await registerOwner(formData)
            
            if (result.success) {
                // Auto-login after successful registration
                const loginResult = await loginOwner({
                    username: formData.username,
                    password: formData.password
                })
                
                if (loginResult.success) {
                    navigate('/owner')
                } else {
                    navigate('/owner/login')
                }
            } else {
                const errorMsg = typeof result.error === 'object'
                    ? Object.entries(result.error).map(([key, val]) => `${key}: ${val}`).join(', ')
                    : result.error
                setError(errorMsg)
            }
        } catch (err) {
            setError('Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container owner-theme">
            <div className="auth-card" style={{ maxWidth: '600px' }}>
                <h2>Partner Registration</h2>
                <p className="auth-subtitle">Start managing your lots with ParkMate</p>

                {error && (
                    <div className="error-message" style={{
                        background: '#fee',
                        padding: '10px',
                        borderRadius: '5px',
                        color: '#c00',
                        marginBottom: '15px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Personal Details */}
                    <h4 style={{ margin: '0 0 16px 0', color: '#64748b' }}>Personal Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>First Name</label>
                            <input name="firstname" value={formData.firstname} onChange={handleChange} required disabled={loading} placeholder="First Name" />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input name="lastname" value={formData.lastname} onChange={handleChange} required disabled={loading} placeholder="Last Name" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <input name="username" value={formData.username} onChange={handleChange} required disabled={loading} placeholder="Username" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>Email</label>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} required disabled={loading} placeholder="Email" />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input name="phone" type="tel" value={formData.phone} onChange={handleChange} required disabled={loading} placeholder="9876543210" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input name="password" type="password" value={formData.password} onChange={handleChange} required disabled={loading} placeholder="Password" />
                    </div>

                    {/* Address Details */}
                    <h4 style={{ margin: '24px 0 16px 0', color: '#64748b' }}>Address Details</h4>
                    <div className="form-group">
                        <label>Street Name</label>
                        <input name="streetname" value={formData.streetname} onChange={handleChange} required disabled={loading} placeholder="Street Address" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>Locality</label>
                            <input name="locality" value={formData.locality} onChange={handleChange} required disabled={loading} placeholder="Locality" />
                        </div>
                        <div className="form-group">
                            <label>City</label>
                            <input name="city" value={formData.city} onChange={handleChange} required disabled={loading} placeholder="City" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>State</label>
                            <input name="state" value={formData.state} onChange={handleChange} required disabled={loading} placeholder="State" />
                        </div>
                        <div className="form-group">
                            <label>Pincode</label>
                            <input name="pincode" value={formData.pincode} onChange={handleChange} required disabled={loading} placeholder="682001" />
                        </div>
                    </div>

                    {/* Verification */}
                    <h4 style={{ margin: '24px 0 16px 0', color: '#64748b' }}>Verification</h4>
                    <div className="form-group">
                        <label>Verification Document (Image)</label>
                        <input
                            type="file"
                            name="verification_document_image"
                            accept="image/*"
                            onChange={handleChange}
                            required
                            disabled={loading}
                            style={{ padding: '8px' }}
                        />
                    </div>

                    <button type="submit" className="btn-primary full-width" disabled={loading} style={{ marginTop: '24px' }}>
                        {loading ? 'Registering...' : 'Register Business'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already a partner? <Link to="/owner/login">Login</Link>
                </p>
            </div>
        </div>
    )
}

export default OwnerRegister
