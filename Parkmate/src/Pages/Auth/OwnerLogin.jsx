import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import './Auth.scss'

const OwnerLogin = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { loginOwner } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        console.log('📝 Owner Login - Form Data:', { username, password: '***' })

        const result = await loginOwner({ username, password })
        
        setLoading(false)

        console.log('📊 Owner Login - Result:', result)

        if (result.success) {
            navigate('/owner')
        } else {
            const errorMsg = typeof result.error === 'object' 
                ? JSON.stringify(result.error) 
                : result.error
            setError(errorMsg)
        }
    }

    return (
        <div className="auth-container owner-theme">
            <div className="auth-card">
                <h2>Owner Portal</h2>
                <p className="auth-subtitle">Manage your parking business</p>

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
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Enter your username"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter password"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-primary full-width" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login to Dashboard'}
                    </button>
                </form>

                <p className="auth-footer">
                    New partner? <Link to="/owner/register">Register Business</Link>
                </p>
                <div className="divider">OR</div>
                <p className="auth-footer">
                    Looking for parking? <Link to="/login">User Login</Link>
                </p>
                <p className="auth-footer" style={{ fontSize: '0.8rem', marginTop: '16px' }}>
                    <Link to="/admin/login" style={{ color: '#64748b', opacity: 0.7 }}>Admin Access</Link>
                </p>
            </div>
        </div>
    )
}

export default OwnerLogin
