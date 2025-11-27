import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import './Auth.scss'

const UserLogin = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { loginUser } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        console.log('📝 User Login - Form Data:', { username, password: '***' })

        const result = await loginUser({ username, password })
        
        setLoading(false)

        console.log('📊 User Login - Result:', result)

        if (result.success) {
            navigate('/')
        } else {
            const errorMsg = typeof result.error === 'object' 
                ? JSON.stringify(result.error) 
                : result.error
            setError(errorMsg)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Welcome Back</h2>
                <p className="auth-subtitle">Login to book your perfect spot</p>

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
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-primary full-width" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Sign up</Link>
                </p>
                <div className="divider">OR</div>
                <p className="auth-footer">
                    Are you a parking lot owner? <Link to="/owner/login">Login here</Link>
                </p>
                <p className="auth-footer" style={{ fontSize: '0.8rem', marginTop: '16px' }}>
                    <Link to="/employee/register" style={{ color: '#64748b', marginRight: '12px' }}>Employee Register</Link>
                    <Link to="/admin/login" style={{ color: '#94a3b8' }}>Admin Access</Link>
                </p>
            </div>
        </div>
    )
}

export default UserLogin
