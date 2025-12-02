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
        vehicle_type: 'Sedan'
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { registerUser, loginUser } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await registerUser(formData)
            
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
