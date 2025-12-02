import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './MultiBookingTimer.scss'

const MultiBookingTimer = ({ bookings = [] }) => {
  const navigate = useNavigate()
  const [timers, setTimers] = useState({})
  const timerRefsRef = useRef({})

  // Initialize timers for all bookings
  useEffect(() => {
    if (!bookings || bookings.length === 0) return

    console.log('🔍 MultiBookingTimer received bookings:', bookings)

    // Create interval for each booking
    bookings.forEach(booking => {
      console.log(`  Booking ${booking.booking_id}: status=${booking.status}, end_time=${booking.end_time}`)
      
      // Support both 'booked' (old) and 'ACTIVE'/'active' (new) statuses
      const isActive = booking.status && (booking.status.toLowerCase() === 'booked' || booking.status.toLowerCase() === 'active')
      if (isActive && booking.end_time) {
        const now = new Date().getTime()
        const end = new Date(booking.end_time).getTime()
        const remaining = end - now
        
        console.log(`  Booking ${booking.booking_id}: now=${now}, end=${end}, remaining=${remaining}ms`)
        
        // Initial timer calculation
        // eslint-disable-next-line react-hooks/immutability
        updateTimer(booking.booking_id, booking.end_time)

        // Set interval for continuous updates (every 1 second)
        if (!timerRefsRef.current[booking.booking_id]) {
          timerRefsRef.current[booking.booking_id] = setInterval(() => {
            updateTimer(booking.booking_id, booking.end_time)
          }, 1000)
        }
      }
    })

    // Cleanup function
    return () => {
      Object.values(timerRefsRef.current).forEach(interval => {
        if (interval) clearInterval(interval)
      })
      timerRefsRef.current = {}
    }
  }, [bookings])

  const updateTimer = (bookingId, endTime) => {
    const now = new Date().getTime()
    const end = new Date(endTime).getTime()
    const remaining = end - now

    if (remaining <= 0) {
      console.log(`⏰ Booking ${bookingId} expired (remaining=${remaining}ms)`)
      setTimers(prev => ({
        ...prev,
        [bookingId]: null
      }))
      if (timerRefsRef.current[bookingId]) {
        clearInterval(timerRefsRef.current[bookingId])
        delete timerRefsRef.current[bookingId]
      }
    } else {
      setTimers(prev => ({
        ...prev,
        [bookingId]: remaining
      }))
    }
  }

  const formatTime = (ms) => {
    if (!ms || ms < 0) {
      console.log(`⏰ formatTime called with invalid ms: ${ms}`)
      return '00:00:00'
    }
    const total = Math.floor(ms / 1000)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const result = [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
    if (total < 10) console.log(`⏰ formatTime(${ms}ms) = ${result} (${total}s)`)
    return result
  }

  const isExpiringSoon = (ms) => ms && ms < 5 * 60 * 1000 // Less than 5 minutes

  const getBookingLotAndSlot = (booking) => {
    const lotName = booking.lot_detail?.lot_name || booking.lot_read?.lot_name || 'Unknown Lot'
    const slotId = booking.slot_read?.slot_id || booking.slot?.slot_id || 'Unknown'
    return { lotName, slotId }
  }

  if (!bookings || bookings.length === 0) {
    return null
  }

  const activeBookings = bookings.filter(b => {
    const status = b.status ? b.status.toLowerCase() : ''
    return status === 'booked' || status === 'active'
  })

  if (activeBookings.length === 0) {
    return null
  }

  return (
    <div className="multi-booking-container">
      <div className="bookings-header">
        <h5>⏱️ Active Bookings ({activeBookings.length})</h5>
        <p className="bookings-count">
          {activeBookings.length} booking{activeBookings.length > 1 ? 's' : ''} active
        </p>
      </div>

      <div className="bookings-grid">
        {activeBookings.map(booking => {
          const timeLeft = timers[booking.booking_id]
          const { lotName, slotId } = getBookingLotAndSlot(booking)
          const expiringSoon = isExpiringSoon(timeLeft)

          return (
            <div
              key={booking.booking_id}
              className={`booking-card ${expiringSoon ? 'expiring-soon' : ''}`}
            >
              <div className="booking-card-header">
                <div className="booking-info">
                  <div className="lot-name">🅿️ {lotName}</div>
                  <div className="slot-id">Slot #{slotId}</div>
                </div>
              </div>

              <div className="booking-card-content">
                <div className="vehicle-info">
                  <span className="label">🚗</span>
                  <span className="value">{booking.vehicle_number}</span>
                </div>

                <div className={`timer-display ${expiringSoon ? 'pulse' : ''}`}>
                  {timeLeft !== null ? (
                    <>
                      <div className="time-value">{formatTime(timeLeft)}</div>
                      {expiringSoon && (
                        <div className="warning-badge">⚠️ Expiring Soon</div>
                      )}
                    </>
                  ) : (
                    <div className="expired-text">Expired</div>
                  )}
                </div>
              </div>

              <div className="booking-card-actions">
                <button
                  className="btn-timer"
                  onClick={() =>
                    navigate(`/booking-confirmation?booking=${booking.booking_id}`)
                  }
                  title="View full timer and details"
                >
                  📊 Full View
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MultiBookingTimer
