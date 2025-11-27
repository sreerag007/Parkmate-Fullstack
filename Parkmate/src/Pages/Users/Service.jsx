import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import './Service.scss'

export default function Service() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const suggestedBookingId = params.get('booking')

  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [carwashTypes, setCarwashTypes] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user's active bookings, carwash types, and employees
        const [bookingsData, carwashTypesData, employeesData] = await Promise.all([
          parkingService.getBookings(),
          parkingService.getCarwashTypes(),
          parkingService.getEmployees()
        ])

        console.log('🚗 Bookings:', bookingsData)
        console.log('🧼 Carwash types:', carwashTypesData)
        console.log('👷 Employees:', employeesData)

        // Filter only active bookings (check various status values)
        const activeBookings = bookingsData.filter(b => {
          console.log(`Booking ${b.booking_id} status:`, b.status)
          return b.status === 'Booked' || b.status === 'booked' || b.status === 'BOOKED'
        })
        console.log('✅ Active bookings after filter:', activeBookings)
        
        setBookings(activeBookings)
        setCarwashTypes(carwashTypesData)
        setEmployees(employeesData)

        // Auto-select if only one booking or suggested booking
        if (activeBookings.length === 1) {
          setSelectedBooking(activeBookings[0].booking_id)
        } else if (suggestedBookingId) {
          const found = activeBookings.find(b => b.booking_id === parseInt(suggestedBookingId))
          if (found) setSelectedBooking(found.booking_id)
        }

        // Auto-select first carwash type and employee
        if (carwashTypesData.length > 0) {
          setSelectedService(carwashTypesData[0].carwash_type_id)
        }
        if (employeesData.length > 0) {
          setSelectedEmployee(employeesData[0].employee_id)
        }

      } catch (err) {
        console.error('❌ Error loading service data:', err)
        setError('Failed to load car wash services. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user, suggestedBookingId])

  const bookService = async () => {
    if (!selectedBooking) return alert('Please select a booking first')
    if (!selectedService) return alert('Please select a car wash service')
    if (!selectedEmployee) return alert('No employee available')

    const carwashType = carwashTypes.find(ct => ct.carwash_type_id === selectedService)
    if (!carwashType) return

    const ok = window.confirm(`Book ${carwashType.name} for ₹${carwashType.price}?`)
    if (!ok) return

    try {
      const carwashData = {
        booking: selectedBooking,
        carwash_type: selectedService,
        employee: selectedEmployee,
        price: carwashType.price
      }

      console.log('🧼 Creating carwash:', carwashData)
      await parkingService.createCarwash(carwashData)
      
      alert(`Car wash service '${carwashType.name}' booked successfully!`)
      navigate('/profile')
    } catch (err) {
      console.error('❌ Error booking service:', err)
      console.error('❌ Error response:', err.response?.data)
      alert('Failed to book car wash service. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="service-root container">
        <h2>Loading car wash services...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="service-root container">
        <h2>Services</h2>
        <p className="muted" style={{ color: 'red' }}>{error}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="service-root container">
        <h2>Services</h2>
        <p className="muted">Please log in to book car wash services.</p>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="service-root container">
        <h2>Car Wash Services</h2>
        <p className="muted">No active bookings found. You can only book car wash services after booking a parking slot.</p>
        <button className="btn primary" onClick={() => navigate('/lots')}>Book a Slot</button>
      </div>
    )
  }

  return (
    <div className="service-root container">
      <h2>Car Wash Services</h2>
      <p className="muted">Select your booking and choose a car wash service.</p>

      <div className="service-grid">
        <div className="bookings-list">
          <h4>Your Active Bookings</h4>
          {bookings.map((b) => (
            <label 
              key={b.booking_id} 
              className={`booking-item ${selectedBooking === b.booking_id ? 'active' : ''}`}
            >
              <input 
                type="radio" 
                name="booking" 
                checked={selectedBooking === b.booking_id} 
                onChange={() => setSelectedBooking(b.booking_id)} 
              />
              <div>
                <div className="b-lot">{b.lot_read?.lot_name} — Slot #{b.slot_read?.slot_id}</div>
                <div className="b-time">{new Date(b.booking_time).toLocaleDateString()}</div>
                <div className="b-vehicle">{b.vehicle_number}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="services-list">
          <h4>Available Car Wash Services</h4>
          <div className="cards">
            {carwashTypes.map((ct) => (
              <div 
                key={ct.carwash_type_id} 
                className={`svc-card ${selectedService === ct.carwash_type_id ? 'selected' : ''}`} 
                onClick={() => setSelectedService(ct.carwash_type_id)}
              >
                <div className="svc-title">{ct.name}</div>
                <div className="svc-desc">{ct.description}</div>
                <div className="svc-price">₹{ct.price}</div>
                <div className="svc-choose">{selectedService === ct.carwash_type_id ? 'Selected' : 'Choose'}</div>
              </div>
            ))}
          </div>

          {carwashTypes.length === 0 && (
            <p className="muted">No car wash services available at the moment.</p>
          )}

          <div className="svc-actions">
            <button className="btn primary" onClick={bookService} disabled={!selectedBooking || !selectedService}>
              Book Car Wash Service
            </button>
            <button className="btn ghost" onClick={() => navigate('/profile')}>Back to Profile</button>
          </div>
        </div>
      </div>
    </div>
  )
}

