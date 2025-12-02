import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import { Droplets, Sparkles, Wind, Star } from 'lucide-react'
import { toast } from 'react-toastify'
import './CarWash.css'

const CarWash = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState(null)
  const [bookingData, setBookingData] = useState({
    service_type: '',
    lot: null,
    scheduled_time: '',
    notes: '',
    payment_method: 'UPI',
  })
  const [lots, setLots] = useState([])
  const [step, setStep] = useState('select') // 'select', 'details', 'payment'
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Fetch user's lots for optional selection
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const response = await parkingService.getLots()
        if (response) {
          setLots(response)
        }
      } catch (error) {
        console.error('Error fetching lots:', error)
      }
    }

    if (user) {
      fetchLots()
    }
  }, [user])

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

  // Handle booking details change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBookingData({
      ...bookingData,
      [name]: value,
    })
  }

  // Handle booking submission
  const handleBookCarWash = async (e) => {
    e.preventDefault()

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

      // Prepare booking payload
      const payload = {
        service_type: bookingData.service_type,
        lot: bookingData.lot || null,
        scheduled_time: bookingData.scheduled_time,
        notes: bookingData.notes || '',
        payment_method: bookingData.payment_method,
        price: selectedService.base_price,
      }

      console.log('📋 Booking car wash with payload:', payload)

      // Create car wash booking
      const response = await parkingService.createCarWashBooking(payload)

      if (response) {
        console.log('✅ Car wash booking created:', response)
        toast.success(`Car wash booking confirmed! Booking ID: ${response.carwash_booking_id}`)

        // Reset form
        setSelectedService(null)
        setBookingData({
          service_type: '',
          lot: null,
          scheduled_time: '',
          notes: '',
          payment_method: 'UPI',
        })
        setStep('select')

        // Redirect to confirmation or booking history
        setTimeout(() => {
          navigate('/carwash/my-bookings')
        }, 2000)
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

          <form onSubmit={handleBookCarWash} className="booking-form">
            <div className="form-section">
              <label>Scheduled Date & Time *</label>
              <input
                type="datetime-local"
                name="scheduled_time"
                value={bookingData.scheduled_time}
                onChange={handleInputChange}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="form-section">
              <label>Parking Lot (Optional)</label>
              <select
                name="lot"
                value={bookingData.lot || ''}
                onChange={handleInputChange}
              >
                <option value="">Select a lot (optional)</option>
                {lots.map((lot) => (
                  <option key={lot.lot_id} value={lot.lot_id}>
                    {lot.lot_name} - {lot.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <label>Payment Method *</label>
              <select
                name="payment_method"
                value={bookingData.payment_method}
                onChange={handleInputChange}
                required
              >
                <option value="UPI">UPI</option>
                <option value="CC">Credit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div className="form-section">
              <label>Special Requests / Notes</label>
              <textarea
                name="notes"
                value={bookingData.notes}
                onChange={handleInputChange}
                placeholder="Any special instructions for the car wash..."
                rows="4"
              />
            </div>

            <div className="booking-summary">
              <h3>Booking Summary</h3>
              <div className="summary-item">
                <span>Service:</span>
                <strong>{selectedService?.service_name}</strong>
              </div>
              <div className="summary-item">
                <span>Price:</span>
                <strong>₹{selectedService?.base_price}</strong>
              </div>
              <div className="summary-item">
                <span>Duration:</span>
                <strong>{selectedService?.estimated_duration} minutes</strong>
              </div>
              <div className="summary-item">
                <span>Scheduled:</span>
                <strong>
                  {bookingData.scheduled_time
                    ? new Date(bookingData.scheduled_time).toLocaleString()
                    : 'Not selected'}
                </strong>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setStep('select')
                  setSelectedService(null)
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting || !bookingData.scheduled_time}
              >
                {isSubmitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default CarWash
