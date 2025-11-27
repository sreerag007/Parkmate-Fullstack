import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import parkingService from '../../services/parkingService'
import './Auth.scss'

const EmployeeRegister = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        phone: '',
        latitude: '',
        longitude: '',
        driving_license: '',
        driving_license_image: null
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleChange = (e) => {
        const { name, value, files } = e.target
        if (name === 'driving_license_image') {
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
            const result = await parkingService.createEmployee(formData)
            setSuccess(true)
            alert('Registration successful! Please contact an Owner/Admin for assignment to a parking lot.')
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data || 'Registration failed. Please try again.'
            setError(typeof errorMsg === 'object' 
                ? Object.entries(errorMsg).map(([key, val]) => `${key}: ${val}`).join(', ')
                : errorMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Employee Registration</h1>
                    <p>Join the Parkmate team</p>
                </div>

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

                {success && (
                    <div className="success-message" style={{
                        background: '#efe',
                        padding: '10px',
                        borderRadius: '5px',
                        color: '#0a0',
                        marginBottom: '15px'
                    }}>
                        Registration successful! Redirecting to login...
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
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

                    <div className="form-row">
                        <div className="form-group">
                            <label>Latitude (Optional)</label>
                            <input
                                type="text"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="9.931233"
                            />
                        </div>
                        <div className="form-group">
                            <label>Longitude (Optional)</label>
                            <input
                                type="text"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="76.267303"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Driving License Number</label>
                        <input
                            type="text"
                            name="driving_license"
                            value={formData.driving_license}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="KL0820190012345"
                        />
                    </div>

                    <div className="form-group">
                        <label>Upload Driving License</label>
                        <input
                            type="file"
                            name="driving_license_image"
                            onChange={handleChange}
                            accept="image/*"
                            disabled={loading}
                            className="file-input"
                        />
                    </div>

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? 'Registering...' : 'Register as Employee'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                    <p className="mt-2">Not an employee? <Link to="/register">User Register</Link></p>
                </div>
            </div>
        </div>
    )
}

export default EmployeeRegister
