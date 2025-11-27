import React, { useEffect, useState } from 'react'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import api from '../../services/api'
import './Userprof.scss'

function formatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleString()
}

export default function Userprof() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [carwashes, setCarwashes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    vehicle_number: '',
    vehicle_type: 'Sedan'
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        // Fetch user profile
        const profileResponse = await api.get('/user-profiles/')
        if (profileResponse.data && profileResponse.data.length > 0) {
          const userProfile = profileResponse.data[0]
          setProfile(userProfile)
          setFormData({
            firstname: userProfile.firstname || '',
            lastname: userProfile.lastname || '',
            phone: userProfile.phone || '',
            vehicle_number: userProfile.vehicle_number || '',
            vehicle_type: userProfile.vehicle_type || 'Sedan'
          })
        }

        // Fetch user bookings
        const bookingsData = await parkingService.getBookings()
        setBookings(bookingsData)

        // Fetch carwash services
        const carwashData = await parkingService.getCarwashes()
        setCarwashes(carwashData)
        
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchUserData()
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (profile) {
        await api.patch(`/user-profiles/${profile.id}/`, formData)
        alert('Profile updated successfully!')
        setEditing(false)
        // Refresh profile data
        const profileResponse = await api.get('/user-profiles/')
        if (profileResponse.data && profileResponse.data.length > 0) {
          setProfile(profileResponse.data[0])
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile: ' + (error.response?.data?.error || 'Please try again'))
    }
  }

  if (loading) {
    return <div className="userprof-root"><p>Loading...</p></div>
  }

  return (
    <div className="userprof-root">
      <h2>Your Profile</h2>
      <p className="muted">Manage your profile and view your bookings</p>

      {/* Profile Information Section */}
      <section className="profile-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Profile Information</h3>
          {!editing && (
            <button 
              onClick={() => setEditing(true)}
              style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {!editing ? (
          <div className="profile-info">
            <div className="info-row">
              <strong>Name:</strong> {profile?.firstname} {profile?.lastname}
            </div>
            <div className="info-row">
              <strong>Phone:</strong> {profile?.phone}
            </div>
            <div className="info-row">
              <strong>Vehicle Number:</strong> {profile?.vehicle_number}
            </div>
            <div className="info-row">
              <strong>Vehicle Type:</strong> {profile?.vehicle_type}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="edit-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
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
                />
              </div>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
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
                />
              </div>
              <div className="form-group">
                <label>Vehicle Type</label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                >
                  <option value="Hatchback">Hatchback</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Two-Wheeler">Two-Wheeler</option>
                  <option value="Three-Wheeler">Three-Wheeler</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="submit" style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Save Changes
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setEditing(false)
                  setFormData({
                    firstname: profile?.firstname || '',
                    lastname: profile?.lastname || '',
                    phone: profile?.phone || '',
                    vehicle_number: profile?.vehicle_number || '',
                    vehicle_type: profile?.vehicle_type || 'Sedan'
                  })
                }}
                style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Bookings Section */}
      <section className="your-bookings">
        <h3>Your Bookings</h3>
        <div className="cards">
          {bookings.length === 0 && <div className="empty">No bookings yet.</div>}
          {bookings.map((booking) => (
            <div className="card you" key={booking.booking_id}>
              <div className="card-left">
                <div className="lot-label">
                  {booking.lot_read?.lot_name || 'Lot'} 
                  <span className={`badge ${booking.status.toLowerCase()}`}>{booking.status}</span>
                </div>
                <div className="slot-label">
                  Slot #{booking.slot_read?.slot_id} - {booking.slot_read?.vehicle_type}
                </div>
                <div className="vehicle-label">{booking.vehicle_number}</div>
              </div>
              <div className="card-right">
                <div className="time">Booked: {formatDate(booking.booking_time)}</div>
                <div className="price">₹{booking.price}</div>
                <div className="booking-type">{booking.booking_type}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Car Wash Services Section */}
      {carwashes.length > 0 && (
        <section className="services-section">
          <h3>Your Car Wash Services</h3>
          <div className="cards">
            {carwashes.map((carwash, index) => (
              <div className="card service" key={index}>
                <div className="card-left">
                  <div className="lot-label">Booking #{carwash.booking_read?.booking_id}</div>
                  <div className="slot-label">
                    {carwash.carwash_type_read?.name || 'Car Wash Service'}
                  </div>
                </div>
                <div className="card-right">
                  <div className="price">₹{carwash.carwash_type_read?.price}</div>
                  {carwash.employee_read && (
                    <div className="employee-info">
                      Employee: {carwash.employee_read.firstname} {carwash.employee_read.lastname}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
