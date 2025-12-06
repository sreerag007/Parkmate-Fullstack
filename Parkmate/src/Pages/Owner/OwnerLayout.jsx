import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import './Owner.scss'

const OwnerLayout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { logoutOwner } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const isActive = (path) => {
        if (path === '/owner' && location.pathname === '/owner') return 'active'
        if (path !== '/owner' && location.pathname.startsWith(path)) return 'active'
        return ''
    }

    const handleLogout = () => {
        logoutOwner()
        navigate('/owner/login')
    }

    const handleNavClick = () => {
        setMobileMenuOpen(false)
    }

    return (
        <div className="owner-layout">
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

            <aside className={`owner-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="owner-brand">Owner Portal</div>
                <nav className="owner-nav">
                    <Link to="/owner" className={`nav-item ${isActive('/owner')}`} onClick={handleNavClick}>
                        <span className="icon">📊</span> Overview
                    </Link>
                    <Link to="/owner/lots" className={`nav-item ${isActive('/owner/lots')}`} onClick={handleNavClick}>
                        <span className="icon">🅿️</span> My Lots
                    </Link>
                    <Link to="/owner/bookings" className={`nav-item ${isActive('/owner/bookings')}`} onClick={handleNavClick}>
                        <span className="icon">📅</span> Slot Bookings
                    </Link>
                    <Link to="/owner/carwash" className={`nav-item ${isActive('/owner/carwash')}`} onClick={handleNavClick}>
                        <span className="icon">🚗</span> Car Wash
                    </Link>
                    <Link to="/owner/payments" className={`nav-item ${isActive('/owner/payments')}`} onClick={handleNavClick}>
                        <span className="icon">💳</span> Payments
                    </Link>
                    <Link to="/owner/services" className={`nav-item ${isActive('/owner/services')}`} onClick={handleNavClick}>
                        <span className="icon">🛠️</span> Add-on Services
                    </Link>
                    <Link to="/owner/employees" className={`nav-item ${isActive('/owner/employees')}`} onClick={handleNavClick}>
                        <span className="icon">👥</span> Employees
                    </Link>
                    <Link to="/owner/reviews" className={`nav-item ${isActive('/owner/reviews')}`} onClick={handleNavClick}>
                        <span className="icon">⭐</span> Reviews
                    </Link>
                    <Link to="/owner/profile" className={`nav-item ${isActive('/owner/profile')}`} onClick={handleNavClick}>
                        <span className="icon">👤</span> Profile
                    </Link>
                </nav>
                <div className="owner-footer">
                    <button onClick={handleLogout} className="nav-item logout-btn">
                        <span className="icon">🚪</span> Logout
                    </button>
                </div>
            </aside>
            <main className="owner-content">
                <Outlet />
            </main>
        </div>
    )
}

export default OwnerLayout
