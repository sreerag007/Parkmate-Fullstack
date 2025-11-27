import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import './Admin.scss'

const AdminLayout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { logoutAdmin } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') return 'active'
        if (path !== '/admin' && location.pathname.startsWith(path)) return 'active'
        return ''
    }

    const handleLogout = () => {
        logoutAdmin()
        navigate('/admin/login')
    }

    const handleNavClick = () => {
        setMobileMenuOpen(false)
    }

    return (
        <div className="admin-layout">
            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
            >
                <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setMobileMenuOpen(false)}
                ></div>
            )}

            <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="page-head admin-brand">Admin Portal</div>
                <nav className="admin-nav">
                    <Link to="/admin" className={`nav-item ${isActive('/admin')}`} onClick={handleNavClick}>
                        <span className="icon">📊</span> Dashboard
                    </Link>
                    <Link to="/admin/users" className={`nav-item ${isActive('/admin/users')}`} onClick={handleNavClick}>
                        <span className="icon">👥</span> Users
                    </Link>
                    <Link to="/admin/owners" className={`nav-item ${isActive('/admin/owners')}`} onClick={handleNavClick}>
                        <span className="icon">🏢</span> Owners
                    </Link>
                    <Link to="/admin/bookings" className={`nav-item ${isActive('/admin/bookings')}`} onClick={handleNavClick}>
                        <span className="icon">📅</span> Bookings
                    </Link>
                    <Link to="/admin/services" className={`nav-item ${isActive('/admin/services')}`} onClick={handleNavClick}>
                        <span className="icon">🛠️</span> Services
                    </Link>
                    <Link to="/admin/employees" className={`nav-item ${isActive('/admin/employees')}`} onClick={handleNavClick}>
                        <span className="icon">👷</span> Employees
                    </Link>
                </nav>
                <div className="admin-footer">
                    <button onClick={handleLogout} className="nav-item logout-btn" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', color: '#94a3b8' }}>
                        <span className="icon">🚪</span> Logout
                    </button>
                </div>
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    )
}

export default AdminLayout
