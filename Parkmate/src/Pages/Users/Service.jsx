import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import PaymentModal from '../../Components/PaymentModal'
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
  const [_EMPLOYEES, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isBookingService, setIsBookingService] = useState(false)

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

      // Filter only active bookings (support both old 'booked' and new 'ACTIVE' statuses)
      const activeBookings = bookingsData.filter(b => {
        console.log(`Booking ${b.booking_id} status:`, b.status)
        const status = b.status ? b.status.toLowerCase() : ''
        return status === 'booked' || status === 'active' || status === 'scheduled'
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

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user, suggestedBookingId])

  const refreshBookings = async () => {
    try {
      const bookingsData = await parkingService.getBookings()
      const activeBookings = bookingsData.filter(b => {
        const status = b.status ? b.status.toLowerCase() : ''
        return status === 'booked' || status === 'active' || status === 'scheduled'
      })
      setBookings(activeBookings)
      console.log('✅ Bookings refreshed after service booking')
    } catch (err) {
      console.error('❌ Error refreshing bookings:', err)
    }
  }

  const bookService = () => {
    if (!selectedBooking) {
      toast.warning('⚠️ Please select a booking first')
      return
    }
    if (!selectedService) {
      toast.warning('⚠️ Please select a car wash service')
      return
    }
    if (!selectedEmployee) {
      toast.warning('⚠️ No employee available')
      return
    }

    // Show payment modal
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async (paymentData) => {
    if (!selectedBooking) return
    if (!selectedService) return
    
    // Prevent double submission
    if (isBookingService) {
      console.log('⚠️ Request already in progress, ignoring duplicate click')
      return
    }

    const carwashType = carwashTypes.find(ct => ct.carwash_type_id === selectedService)
    if (!carwashType) return

    try {
      setIsBookingService(true)
      console.log('💳 Processing car wash payment...', paymentData)
      
      // Call backend to process payment and create car wash booking
      const response = await parkingService.api.post(
        `/carwashes/pay_for_service/`,
        {
          booking_id: selectedBooking,
          carwash_type_id: selectedService,
          payment_method: paymentData.payment_method,
          amount: paymentData.amount
        }
      )
      
      console.log('✅ Car wash service booked successfully:', response.data)
      
      toast.success('✅ Car Wash Service booked successfully!', { autoClose: 3000 })
      
      // Close the payment modal immediately
      setShowPaymentModal(false)
      
      // Refresh bookings to update carwash status
      await refreshBookings()
      
      // Navigate back to the booking timer view after a brief delay
      setTimeout(() => {
        navigate(`/booking-confirmation?booking=${selectedBooking}`)
      }, 1000)
      
    } catch (err) {
      console.error('❌ Error processing car wash payment:', err)
      console.error('❌ Full error response:', err.response?.data)
      console.log('📋 Request payload was:', {
        booking_id: selectedBooking,
        carwash_type_id: selectedService,
        payment_method: paymentData.payment_method,
        amount: paymentData.amount
      })
      
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to book car wash service'
      
      // Check if it's a duplicate booking error (409 Conflict or error message contains "already")
      if (err.response?.status === 409 || errorMsg.toLowerCase().includes('already')) {
        toast.warning(`⚠️ ${errorMsg}`, { autoClose: 4000 })
        // Close modal and redirect to timer
        setShowPaymentModal(false)
        setTimeout(() => {
          navigate(`/booking-confirmation?booking=${selectedBooking}`)
        }, 1500)
      } else {
        toast.error(`❌ ${errorMsg}`, { autoClose: 4000 })
        // Keep modal open for retry on other errors
      }
    } finally {
      setIsBookingService(false)
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

  // Check if the SELECTED booking already has an active carwash service
  // Use the 'has_carwash' boolean field from booking serializer for cleaner check
  const selectedBookingData = bookings.find(b => b.booking_id === selectedBooking)
  const selectedBookingHasCarwash = selectedBookingData?.has_carwash || selectedBookingData?.carwash !== null
  
  // DEBUG: Log the selected booking data to verify has_carwash field
  if (selectedBookingData) {
    console.log('🔍 Selected Booking Data:', {
      booking_id: selectedBookingData.booking_id,
      has_carwash: selectedBookingData.has_carwash,
      carwash: selectedBookingData.carwash,
      selectedBookingHasCarwash: selectedBookingHasCarwash
    })
  }

  return (
    <div className="service-root container">
      {/* Payment Modal */}
      {showPaymentModal && selectedService && (
        <PaymentModal
          price={carwashTypes.find(ct => ct.carwash_type_id === selectedService)?.price || 0}
          onConfirm={handlePaymentConfirm}
          onClose={() => setShowPaymentModal(false)}
          isLoading={isBookingService}
          purpose="carwash"
          metadata={{
            serviceName: carwashTypes.find(ct => ct.carwash_type_id === selectedService)?.name || 'Car Wash Service',
            parkingLot: bookings.find(b => b.booking_id === selectedBooking)?.lot_read?.lot_name
          }}
        />
      )}

      <h2>Car Wash Services</h2>
      <p className="muted">Select your booking and choose a car wash service.</p>

      {selectedBookingHasCarwash && (
        <div className="alert alert-warning" style={{
          padding: '12px 16px',
          marginBottom: '20px',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          color: '#92400e'
        }}>
          <strong>⚠️ Note:</strong> This booking already has a car wash service. Complete or renew that booking before adding another service.
        </div>
      )}

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
            <button 
              className="btn primary" 
              onClick={bookService} 
              disabled={!selectedBooking || !selectedService || selectedBookingHasCarwash || isBookingService}
              title={selectedBookingHasCarwash ? "This booking already has a car wash service" : ""}
            >
              {selectedBookingHasCarwash ? "🚫 Service Already Active" : isBookingService ? "⏳ Processing..." : "Book Car Wash Service"}
            </button>
            <button 
              className="btn secondary" 
              onClick={() => navigate(`/booking-confirmation?booking=${selectedBooking}`)}
              disabled={!selectedBooking}
            >
              ⏱️ Back to Timer
            </button>
            <button className="btn ghost" onClick={() => navigate('/profile')}>Back to Profile</button>
          </div>
        </div>
      </div>
    </div>
  )
}

