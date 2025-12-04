import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import { useServerTime } from '../../contexts/TimeContext'
import parkingService from '../../services/parkingService'
import PaymentModal from '../../Components/PaymentModal'
import { Droplets, Sparkles, Wind, Star } from 'lucide-react'
import { toast } from 'react-toastify'
import './CarWash.css'

const CarWash = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { serverTime, timeData, isBeforeServerTime } = useServerTime()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState(null)
  const [bookingData, setBookingData] = useState({
    service_type: '',
    lot: null,
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
    payment_method: 'UPI',
  })
  const [lots, setLots] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [step, setStep] = useState('select') // 'select', 'details', 'payment'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Fetch available car wash services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const response = await parkingService.getCarWashServices()
        if (response && response.length > 0) {
          setServices(response)
        } else {
          toast.info('No car wash services available at the moment')
        }
      } catch (error) {
        console.error('Error fetching services:', error)
        toast.error('Failed to load car wash services')
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  // Fetch user's lots for optional selection (only carwash-enabled lots)
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const response = await parkingService.getLots()
        if (response) {
          // Filter to show only lots that provide carwash service
          const carwashLots = response.filter(lot => lot.provides_carwash === true)
          setLots(carwashLots)
          
          if (carwashLots.length === 0) {
            console.log('ℹ️ No parking lots with carwash service available')
          }
        }
      } catch (error) {
        console.error('Error fetching lots:', error)
      }
    }

    if (user) {
      fetchLots()
    }
  }, [user])

  // Fetch time slots when date and lot are selected
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!bookingData.scheduled_date || !bookingData.lot) {
        setTimeSlots([])
        return
      }

      try {
        console.log('🔍 Fetching time slots for:', bookingData.scheduled_date, 'Lot:', bookingData.lot)
        const response = await parkingService.getCarWashTimeSlots(
          bookingData.scheduled_date,
          bookingData.lot
        )
        console.log('✅ Time slots received:', response)
        if (response && response.slots) {
          // Filter out past time slots if date is today
          const filteredSlots = filterPastTimeSlots(response.slots, bookingData.scheduled_date)
          setTimeSlots(filteredSlots)
        }
      } catch (error) {
        console.error('❌ Error fetching time slots:', error)
        toast.error('Failed to load available time slots')
      }
    }

    fetchTimeSlots()
  }, [bookingData.scheduled_date, bookingData.lot])

  // Filter past time slots for today's date using SERVER TIME
  const filterPastTimeSlots = (slots, selectedDate) => {
    // Use server time instead of client time
    const today = serverTime || new Date()
    const selected = new Date(selectedDate)
    
    // Reset time to compare only dates
    const todayDate = new Date(today)
    todayDate.setHours(0, 0, 0, 0)
    selected.setHours(0, 0, 0, 0)
    
    // If selected date is not today, return all slots
    if (selected.getTime() !== todayDate.getTime()) {
      return slots
    }
    
    // Filter out past time slots for today using SERVER TIME
    const currentHour = today.getHours()
    const currentMinute = today.getMinutes()
    
    return slots.map(slot => {
      // Parse slot time (format: "HH:MM AM/PM" or "HH:MM")
      const timeStr = slot.time
      let hours, minutes
      
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        // 12-hour format
        const [time, meridiem] = timeStr.split(' ')
        const [h, m] = time.split(':').map(Number)
        hours = meridiem === 'PM' && h !== 12 ? h + 12 : (meridiem === 'AM' && h === 12 ? 0 : h)
        minutes = m
      } else {
        // 24-hour format
        [hours, minutes] = timeStr.split(':').map(Number)
      }
      
      // Check if slot time is in the past
      const isPast = hours < currentHour || (hours === currentHour && minutes <= currentMinute)
      
      return {
        ...slot,
        available: isPast ? false : slot.available,
        isPast: isPast
      }
    })
  }

  // Calculate min and max date using SERVER TIME (synced via WebSocket)
  const getMinMaxDates = () => {
    // Use server time instead of client time for accuracy
    const today = serverTime || new Date()
    
    // Get local date components to avoid timezone issues
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + 7)
    const maxYear = maxDate.getFullYear()
    const maxMonth = String(maxDate.getMonth() + 1).padStart(2, '0')
    const maxDay = String(maxDate.getDate()).padStart(2, '0')
    const maxDateStr = `${maxYear}-${maxMonth}-${maxDay}`
    
    return {
      min: todayStr,
      max: maxDateStr
    }
  }

  // Get icon for service type
  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'exterior':
        return <Droplets className="service-icon" />
      case 'interior':
        return <Wind className="service-icon" />
      case 'full':
        return <Sparkles className="service-icon" />
      case 'premium':
        return <Star className="service-icon" />
      default:
        return <Droplets className="service-icon" />
    }
  }

  // Handle service selection
  const handleSelectService = (service) => {
    setSelectedService(service)
    setBookingData({
      ...bookingData,
      service_type: service.service_name,  // Use service_name (e.g., "Exterior", "Full Service") instead of service_type
    })
    setStep('details')
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Validate date selection
    if (name === 'scheduled_date') {
      const { min, max } = getMinMaxDates()
      const selectedDate = value
      
      // Check if date is before today
      if (selectedDate < min) {
        toast.error('Cannot select past dates. Please choose today or a future date.')
        return
      }
      
      // Check if date is beyond 7-day window
      if (selectedDate > max) {
        toast.error('Bookings are only allowed within the next 7 days.')
        return
      }
    }
    
    setBookingData({
      ...bookingData,
      [name]: value,
    })
    
    // Clear selected time slot if date or lot changes
    if (name === 'scheduled_date' || name === 'lot') {
      setSelectedTimeSlot(null)
      setBookingData(prev => ({ ...prev, scheduled_time: '' }))
    }
  }

  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    if (!slot.available) {
      toast.warning(`This time slot is full (${slot.booked_count}/${slot.capacity} booked)`)
      return
    }
    
    setSelectedTimeSlot(slot)
    // Combine date and time into ISO format
    const scheduledDateTime = `${bookingData.scheduled_date}T${slot.time}:00`
    setBookingData({
      ...bookingData,
      scheduled_time: scheduledDateTime,
    })
  }

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setBookingData({
      ...bookingData,
      payment_method: method,
    })
  }

  // Proceed to payment
  const handleProceedToPayment = () => {
    if (!bookingData.lot) {
      toast.error('Please select a parking lot')
      return
    }
    if (!bookingData.scheduled_date) {
      toast.error('Please select a date')
      return
    }
    if (!selectedTimeSlot) {
      toast.error('Please select a time slot')
      return
    }
    
    // Always show payment modal - let user choose payment method there
    setShowPaymentModal(true)
  }

  // Handle booking submission
  const handleBookCarWash = async (paymentData = null) => {

    if (!user) {
      toast.error('Please login to book a car wash')
      navigate('/login')
      return
    }

    if (!bookingData.scheduled_time) {
      toast.error('Please select a scheduled time')
      return
    }

    try {
      setIsSubmitting(true)

      // Extract payment method from paymentData
      const paymentMethod = paymentData?.payment_method || bookingData.payment_method || 'UPI'

      // Prepare booking payload
      const payload = {
        service_type: bookingData.service_type,
        lot: bookingData.lot || null,
        scheduled_time: bookingData.scheduled_time,
        notes: bookingData.notes || '',
        payment_method: paymentMethod,
        price: selectedService.base_price,
      }
      
      // Add payment details if provided (from payment modal)
      if (paymentData) {
        if (paymentData.transactionId) {
          payload.transaction_id = paymentData.transactionId
        } else if (paymentData.upiId) {
          payload.transaction_id = paymentData.upiId
        }
      }

      console.log('📋 Booking car wash with payload:', payload)

      // Create car wash booking
      const response = await parkingService.createCarWashBooking(payload)

      if (response) {
        console.log('✅ Car wash booking created:', response)
        setShowPaymentModal(false)
        toast.success(`Car wash booking confirmed! Booking ID: ${response.carwash_booking_id}`)

        // Reset form
        setBookingData({
          service_type: '',
          lot: null,
          scheduled_date: '',
          scheduled_time: '',
          notes: '',
          payment_method: 'UPI',
        })
        setSelectedService(null)
        setSelectedTimeSlot(null)
        setStep('select')

        // Navigate to user's bookings page
        setTimeout(() => navigate('/carwash/my-bookings'), 1500)
      }
    } catch (error) {
      console.error('Error booking car wash:', error)
      
      // Handle specific error responses from backend
      let errorMessage = 'Failed to create car wash booking'
      
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response
        
        if (status === 409) {
          // Time slot conflict
          errorMessage = data.error || 'Time slot not available. Please select a different time.'
          if (data.available_from) {
            const availableTime = new Date(data.available_from).toLocaleTimeString()
            errorMessage += ` Available from: ${availableTime}`
          }
        } else if (status === 400) {
          // Bad request - validation error
          errorMessage = data.error || 'Invalid booking details. Please check your input.'
        } else if (status === 401 || status === 403) {
          // Authentication/permission error
          errorMessage = 'You are not authorized to make this booking.'
        } else if (data.error) {
          errorMessage = data.error
        } else if (data.message) {
          errorMessage = data.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="carwash-container">
      <div className="carwash-header">
        <div className="header-content">
          <div>
            <h1>🚗 Car Wash Service</h1>
            <p>Keep your vehicle clean and well-maintained</p>
          </div>
          <button
            className="my-bookings-btn"
            onClick={() => navigate('/carwash/my-bookings')}
            title="View your car wash bookings"
          >
            📋 My Bookings
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading car wash services...</p>
        </div>
      ) : step === 'select' ? (
        <div className="services-grid">
          {services.length === 0 ? (
            <div className="no-services">
              <p>No car wash services available</p>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.carwash_service_id}
                className="service-card"
                onClick={() => handleSelectService(service)}
              >
                <div className="service-icon-wrapper">
                  {getServiceIcon(service.service_type)}
                </div>
                <h3>{service.service_name}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-details">
                  <span className="price">₹{service.base_price}</span>
                  <span className="duration">
                    ⏱️ {service.estimated_duration} mins
                  </span>
                </div>
                <button className="select-btn">Select Service</button>
              </div>
            ))
          )}
        </div>
      ) : step === 'details' ? (
        <div className="booking-form-container">
          <div className="form-header">
            <button
              className="back-btn"
              onClick={() => {
                setStep('select')
                setSelectedService(null)
              }}
            >
              ← Back
            </button>
            <h2>Book {selectedService?.service_name}</h2>
          </div>

          <form className="booking-form">
            <div className="form-section">
              <label>Parking Lot *</label>
              <select
                name="lot"
                value={bookingData.lot || ''}
                onChange={handleInputChange}
                required
                disabled={lots.length === 0}
              >
                <option value="">
                  {lots.length === 0 ? 'No parking lots with car wash service available' : 'Select a parking lot'}
                </option>
                {lots.map((lot) => (
                  <option key={lot.lot_id} value={lot.lot_id}>
                    {lot.lot_name} - {lot.city}
                  </option>
                ))}
              </select>
              {lots.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '0.5rem' }}>
                  ℹ️ No parking lots currently offer car wash services. Please check back later.
                </p>
              )}
            </div>

            <div className="form-section">
              <label>Select Date *</label>
              <input
                type="date"
                name="scheduled_date"
                value={bookingData.scheduled_date}
                onChange={handleInputChange}
                min={getMinMaxDates().min}
                max={getMinMaxDates().max}
                required
              />
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                ℹ️ Bookings are available only within the next 7 days
              </p>
            </div>

            {/* Debug info */}
            {console.log('🔍 Debug - Lot:', bookingData.lot, 'Date:', bookingData.scheduled_date, 'Slots:', timeSlots.length)}

            {bookingData.scheduled_date && bookingData.lot ? (
              <div className="form-section">
                <label>Select Time Slot * (9 AM - 8 PM)</label>
                {timeSlots.length === 0 ? (
                  <p className="loading-slots">Loading time slots...</p>
                ) : timeSlots.every(slot => !slot.available) ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    background: '#fef2f2',
                    borderRadius: '12px',
                    border: '1px solid #fecaca',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '0.5rem' }}>
                      ⏰ No time slots available for the selected date
                    </p>
                    <p style={{ color: '#991b1b', fontSize: '0.9rem' }}>
                      {bookingData.scheduled_date === getMinMaxDates().min 
                        ? 'All time slots for today have passed. Please select a future date.'
                        : 'All slots are fully booked. Please select a different date.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="time-slots-grid">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          className={`time-slot ${
                            selectedTimeSlot?.time === slot.time ? 'selected' : ''
                          } ${!slot.available ? 'disabled' : ''} ${slot.isPast ? 'past' : ''}`}
                          onClick={() => handleTimeSlotSelect(slot)}
                          disabled={!slot.available}
                          title={slot.isPast ? 'Time slot has passed' : (slot.available ? 'Available' : 'Fully booked')}
                        >
                          <div className="slot-time">{slot.time}</div>
                          {slot.booked_count > 0 && !slot.isPast && (
                            <div className="slot-badge">
                              {slot.booked_count}/{slot.capacity}
                            </div>
                          )}
                          {slot.isPast && (
                            <div className="slot-badge" style={{ background: '#6b7280' }}>Past</div>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="slot-legend">
                      <div className="legend-item">
                        <span className="legend-box available"></span> Available
                      </div>
                      <div className="legend-item">
                        <span className="legend-box partial"></span> Partially Booked
                      </div>
                      <div className="legend-item">
                        <span className="legend-box full"></span> Full
                      </div>
                      <div className="legend-item">
                        <span className="legend-box" style={{ background: '#d1d5db' }}></span> Past
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="form-section">
                <p style={{textAlign: 'center', color: '#6b7280', padding: '2rem', background: '#f9fafb', borderRadius: '12px', fontSize: '0.95rem'}}>
                  📅 Please select a parking lot and date to view available time slots
                </p>
              </div>
            )}

            <div className="form-section">
              <label>Additional Notes (Optional)</label>
              <textarea
                name="notes"
                value={bookingData.notes}
                onChange={handleInputChange}
                placeholder="Any special requirements or instructions..."
                rows="3"
              />
            </div>

            <div className="booking-summary">
              <h3>Booking Summary</h3>
              <div className="summary-row">
                <span>Service:</span>
                <span>{selectedService?.service_name}</span>
              </div>
              <div className="summary-row">
                <span>Date:</span>
                <span>{bookingData.scheduled_date || '-'}</span>
              </div>
              <div className="summary-row">
                <span>Time:</span>
                <span>{selectedTimeSlot?.time || '-'}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>₹{selectedService?.base_price}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              className="submit-btn"
              disabled={isSubmitting || !selectedTimeSlot}
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </form>
        </div>
      ) : null}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          price={selectedService?.base_price}
          purpose="carwash"
          onConfirm={handleBookCarWash}
        />
      )}
    </div>
  )
}

export default CarWash
