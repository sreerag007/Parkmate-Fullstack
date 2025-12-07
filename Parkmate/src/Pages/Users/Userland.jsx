import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import './Userland.css'

const Userland = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔍 Userland - Current user:', user)
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [bookingsData, lotsData] = await Promise.all([
          parkingService.getBookings(),
          parkingService.getLots()
        ])
        setBookings(bookingsData)
        setLots(lotsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [user])

  // Debug logging
  useEffect(() => {
    console.log('📊 Bookings data:', bookings)
  }, [bookings])

  return (
    <div className='Land'>
      <div id="content1">
        <div id="box1">
          <h1>Parkmate</h1>
        </div>
        <div id="box2">
          {user && (
            <div style={{ 
              width: '100%', 
              padding: '12px 20px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              borderRadius: '10px',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#fff', 
                fontSize: '1.4rem',
                fontWeight: '600',
                flex: 1
              }}>
                Welcome back, {user.username}! 👋
              </h3>
            </div>
          )}
          
          <h4>Parking made Simple</h4>
          <p>Plan ahead and save time with
            seamless parking finds. Whether you're
            heading to college or downtown,
            get a spot ready before you arrive.</p>

          <button onClick={() => navigate('/lots')}>Book Now</button>

          {!loading && lots.length > 0 && (
            <div style={{ 
              marginTop: '20px', 
              padding: window.innerWidth <= 768 ? '14px 16px' : '18px 24px', 
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
              borderRadius: window.innerWidth <= 768 ? '10px' : '12px', 
              width: '100%',
              boxShadow: '0 2px 8px rgba(21, 128, 61, 0.1)',
              border: '1px solid #86efac',
              maxWidth: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: window.innerWidth <= 768 ? '14px' : '16px', 
                fontWeight: '500',
                color: '#15803d',
                textAlign: 'center',
                letterSpacing: '0.3px',
                lineHeight: '1.5',
                wordBreak: 'break-word'
              }}>
                {lots.length} parking lot{lots.length > 1 ? 's' : ''} available near you
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Userland
