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

  const activeBookings = bookings.filter(b => b.status === 'Booked')

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
              marginBottom: '10px'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#fff', 
                fontSize: '1.4rem',
                fontWeight: '600',
                textAlign: 'center'
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

          {!loading && activeBookings.length > 0 && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', width: '100%' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>Active Bookings</h5>
              <p style={{ margin: 0, fontSize: '14px', color: '#0c4a6e' }}>
                You have {activeBookings.length} active booking{activeBookings.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {!loading && lots.length > 0 && (
            <div style={{ marginTop: '15px', padding: '15px', background: '#f0fdf4', borderRadius: '8px', width: '100%' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#15803d' }}>Available Lots</h5>
              <p style={{ margin: 0, fontSize: '14px', color: '#14532d' }}>
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
