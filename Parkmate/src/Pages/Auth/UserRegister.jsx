import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import './Auth.scss'

const UserRegister = () => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        vehicle_number: '',
        vehicle_type: 'Sedan',
        driving_license: null
    })
    const [drivingLicensePreview, setDrivingLicensePreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { registerUser, loginUser } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleDrivingLicenseChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file')
                return
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB')
                return
            }
            setError('')
            setFormData(prev => ({ ...prev, driving_license: file }))
            
            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setDrivingLicensePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeDrivingLicense = () => {
        setFormData(prev => ({ ...prev, driving_license: null }))
        setDrivingLicensePreview(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Create FormData for multipart upload
            const form = new FormData()
            Object.keys(formData).forEach(key => {
                if (key === 'driving_license' && formData[key]) {
                    form.append('driving_license', formData[key])
                } else if (key !== 'driving_license') {
                    form.append(key, formData[key])
                }
            })

            const result = await registerUser(form)
            
            if (result.success) {
                // Auto-login after successful registration
                const loginResult = await loginUser({
                    username: formData.username,
                    password: formData.password
                })
                
                if (loginResult.success) {
                    navigate('/')
                } else {
                    navigate('/login')
                }
            } else {
                const errorMsg = typeof result.error === 'object'
                    ? Object.entries(result.error).map(([key, val]) => `${key}: ${val}`).join(', ')
                    : result.error
                setError(errorMsg)
            }
        } catch {
            setError('Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '500px' }}>
                <h2>Create Account</h2>
                <p className="auth-subtitle">Join ParkMate today</p>

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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="firstname"
                                value={formData.firstname}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="John"
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="lastname"
                                value={formData.lastname}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Choose a username"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Create a password"
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="9876543210"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>Vehicle Number</label>
                            <input
                                type="text"
                                name="vehicle_number"
                                value={formData.vehicle_number}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="KL-08-AZ-1234"
                            />
                        </div>
                        <div className="form-group">
                            <label>Vehicle Type</label>
                            <select
                                name="vehicle_type"
                                value={formData.vehicle_type}
                                onChange={handleChange}
                                disabled={loading}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="Hatchback">Hatchback</option>
                                <option value="Sedan">Sedan</option>
                                <option value="SUV">SUV</option>
                                <option value="Two-Wheeler">Two-Wheeler</option>
                                <option value="Three-Wheeler">Three-Wheeler</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            🪪 Driving License <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
                        </label>
                        {drivingLicensePreview ? (
                            <div style={{
                                position: 'relative',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '2px solid #10b981',
                                backgroundColor: '#f0fdf4'
                            }}>
                                <img
                                    src={drivingLicensePreview}
                                    alt="Driving License Preview"
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        maxHeight: '300px',
                                        objectFit: 'contain',
                                        display: 'block'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={removeDrivingLicense}
                                    disabled={loading}
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        padding: '6px 10px',
                                        background: '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        opacity: loading ? 0.6 : 1
                                    }}
                                    onMouseOver={(e) => !loading && (e.target.style.background = '#dc2626')}
                                    onMouseOut={(e) => (e.target.style.background = '#ef4444')}
                                >
                                    ✕ Remove
                                </button>
                            </div>
                        ) : (
                            <label style={{
                                display: 'block',
                                padding: '24px',
                                border: '2px dashed #cbd5e1',
                                borderRadius: '12px',
                                textAlign: 'center',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                backgroundColor: '#f8fafc',
                                transition: 'all 0.2s',
                                opacity: loading ? 0.6 : 1
                            }}
                            onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleDrivingLicenseChange}
                                    disabled={loading}
                                    style={{ display: 'none' }}
                                />
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                                <div style={{ color: '#0f172a', fontWeight: '600', marginBottom: '4px' }}>
                                    Click to upload driving license
                                </div>
                                <div style={{ color: '#64748b', fontSize: '12px' }}>
                                    PNG, JPG, GIF up to 5MB
                                </div>
                            </label>
                        )}
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                            ℹ️ For user verification, please upload a clear image of your driving license
                        </div>
                    </div>

                    <button type="submit" className="btn-primary full-width" disabled={loading}>
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    )
}

export default UserRegister
