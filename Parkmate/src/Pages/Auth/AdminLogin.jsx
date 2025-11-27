import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import './Auth.scss'

const AdminLogin = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { loginAdmin } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        console.log('📝 Admin Login - Form Data:', { username, password: '***' })

        const result = await loginAdmin({ username, password })
        
        setLoading(false)

        console.log('📊 Admin Login - Result:', result)

        if (result.success) {
            navigate('/admin')
        } else {
            const errorMsg = typeof result.error === 'object' 
                ? JSON.stringify(result.error) 
                : result.error
            setError(errorMsg)
            alert('Login failed: ' + errorMsg)
        }
    }

    return (
        <div className="auth-container admin-theme">
            <div className="auth-card">
                <h2>Admin Portal</h2>
                <p className="auth-subtitle">System Administration</p>

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
                            placeholder="Enter admin username"
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
                            placeholder="Enter admin password"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-primary full-width" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login to Admin Dashboard'}
                    </button>
                </form>

                <div className="divider">OR</div>
                <p className="auth-footer">
                    <Link to="/login" style={{ marginRight: '15px' }}>User Login</Link>
                    <Link to="/owner/login">Owner Login</Link>
                </p>
            </div>
        </div>
    )
}

export default AdminLogin
