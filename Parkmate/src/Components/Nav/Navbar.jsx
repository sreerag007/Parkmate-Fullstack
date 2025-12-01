import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const [open, setOpen] = useState(false)
  const [hasBooking, setHasBooking] = useState(false)
  const { user, owner, logoutUser } = useAuth()

  const location = useLocation()

  // close mobile menu when route changes
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // detect whether the current client has any booking to show Services link
  useEffect(() => {
    try {
      const client = localStorage.getItem('parkmate_client_id')
      if (!client) return setHasBooking(false)
      const keys = ['parkmate_lot1_slots', 'parkmate_lot2_slots', 'parkmate_lot3_slots']
      const any = keys.some((k) => {
        const raw = localStorage.getItem(k)
        if (!raw) return false
        try {
          const arr = JSON.parse(raw)
          return arr.some((s) => s && s.bookedBy === client)
        } catch (e) { return false }
      })
      setHasBooking(!!any)
    } catch (e) { setHasBooking(false) }
  }, [location.pathname])



  return (
    <header id="Nav">
      <div className="container nav-inner">
        <div className="brand">
          <Link to="/" className="logo">PARKMATE</Link>
        </div>

        <button
          className={`hamburger ${open ? 'open' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-items ${open ? 'open' : ''}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/#about" className="nav-link">About</Link>
          <Link to="/lots" className="nav-link">Lots</Link>

          {user ? (
            <>
              <Link to="/profile" className="nav-link">Profile</Link>
              <Link to="/reviews" className="nav-link">Reviews</Link>
              {hasBooking && <Link to="/service" className="nav-link">Services</Link>}
              <button onClick={logoutUser} className="nav-link btn-link">Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-link">Login</Link>
          )}

          {owner && (
            <Link to="/owner" className="nav-link owner-link">Owner Dashboard</Link>
          )}
        </nav>

        {/* backdrop closes the menu when clicking outside on mobile */}
        <div
          className={`nav-backdrop ${open ? 'open' : ''}`}
          onClick={() => setOpen(false)}
          aria-hidden={!open}
        />
      </div>
    </header>
  )
}

export default Navbar
