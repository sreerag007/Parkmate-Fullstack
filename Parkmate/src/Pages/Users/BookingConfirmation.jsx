import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import parkingService from '../../services/parkingService';
import { notify } from '../../utils/notify.jsx';
import PaymentModal from '../../Components/PaymentModal';
import './BookingConfirmation.scss';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [booking, setBooking] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewError, setRenewError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRenewConfirm, setShowRenewConfirm] = useState(false);
  const [showRenewalPaymentModal, setShowRenewalPaymentModal] = useState(false);
  const timerIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Get booking ID from query params or location state
  const searchParams = new URLSearchParams(location.search);
  const bookingId = searchParams.get('booking') || location.state?.bookingId;

  // Load cached booking data on mount
  useEffect(() => {
    if (bookingId && !booking) {
      const cached = sessionStorage.getItem(`booking_${bookingId}`);
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          setBooking(cachedData);
          setIsExpired(cachedData.status.toLowerCase() === 'completed');
          setLoading(false);
          return;
        } catch (e) {
          console.log('Cache parse error, fetching fresh data');
        }
      }
    }
  }, [bookingId]);

  // Load booking data
  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) {
        console.error('❌ No booking ID provided');
        return;
      }

      try {
        setLoading(true);
        const data = await parkingService.getBookingById(bookingId);
        console.log('✅ Booking loaded:', data);
        setBooking(data);
        
        // ✅ Check if expired based on end_time, not just status
        const now = new Date().getTime();
        const endTime = new Date(data.end_time).getTime();
        const isActuallyExpired = now > endTime || data.status.toLowerCase() === 'completed';
        setIsExpired(isActuallyExpired);
        
        // Cache the booking data in sessionStorage
        sessionStorage.setItem(`booking_${bookingId}`, JSON.stringify(data));
      } catch (err) {
        console.error('❌ Error loading booking:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only load if not already loaded
    if (!booking) {
      loadBooking();
    }
  }, [bookingId]);

  // Poll backend to check booking status
  const pollBooking = useCallback(async () => {
    try {
      const data = await parkingService.getBookingById(bookingId);
      setBooking(data);
      if (data.status.toLowerCase() === 'completed') {
        console.log('⏰ Booking auto-completed');
        setIsExpired(true);
      }
    } catch (err) {
      console.error('❌ Error polling booking:', err);
    }
  }, [bookingId]);

  // Timer countdown - Calculate from server end_time, not local state
  useEffect(() => {
    // Handle SCHEDULED status (advance bookings waiting to start)
    if (booking && booking.status.toUpperCase() === 'SCHEDULED') {
      console.log('⏰ Booking is SCHEDULED, will activate at:', booking.start_time);
      // Poll to check when booking transitions to ACTIVE
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(() => {
          console.log('🔄 Polling for SCHEDULED → ACTIVE transition');
          pollBooking();
        }, 15000); // Poll every 15 seconds
      }
      return;
    }

    // Handle ACTIVE or booked (legacy) statuses - both are instant bookings
    const status = booking?.status?.toUpperCase() || '';
    if (!booking || (status !== 'ACTIVE' && status !== 'BOOKED')) return;

    // ✅ CHECK IF PAYMENT IS STILL PENDING - Don't start timer if payment not verified
    if (booking.payment_status === 'PENDING') {
      console.log(`⏳ Payment pending verification - timer will not start`);
      setTimeLeft(null);
      return; // Don't start timer for pending payments
    }

    console.log(`⏱️ BookingConfirmation timer started for booking ${booking.booking_id} (status=${status})`);
    console.log(`   End time: ${booking.end_time}`);

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(booking.end_time).getTime();
      const remaining = endTime - now;

      console.log(`   Now: ${now}, EndTime: ${endTime}, Remaining: ${remaining}ms`);

      if (remaining <= 0) {
        console.log(`⏰ Booking expired (remaining=${remaining}ms)`);
        setTimeLeft(null);
        setIsExpired(true);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        // Event 2: Timer = 0 (Booking expired)
        notify.info("Your booking has expired. Slot released.");
        // Poll backend immediately to get updated status
        pollBooking();
      } else {
        setTimeLeft(remaining);
        // Make sure we're not showing as expired if there's still time
        setIsExpired(false);
        
        // Event 1: Timer < 5 minutes
        // Only show once when it hits 5 minutes
        if (remaining === 5 * 60 * 1000) {
          notify.warning("Your booking will expire in 5 minutes!");
        }
      }
    };

    updateTimer(); // Initial call
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [booking?.end_time, booking?.status, booking?.payment_status]);

  // Poll backend every 10 seconds to check if booking was auto-completed
  useEffect(() => {
    if (!bookingId || isExpired) return;

    pollIntervalRef.current = setInterval(pollBooking, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [bookingId, isExpired, pollBooking]);

  const handleRenewClick = () => {
    // Only allow renewal when booking has completely expired
    if (!isExpired) {
      notify.warning('Booking must completely expire before renewal. Please wait.');
      return;
    }
    // Show payment modal for renewal
    setShowRenewalPaymentModal(true);
  };

  const handleRenewalPaymentConfirm = async (paymentData) => {
    if (!bookingId) return;

    try {
      setIsRenewing(true);
      setRenewError(null);
      setShowRenewalPaymentModal(false);
      
      notify.info('Processing renewal...');
      console.log('💳 Renewing booking with payment:', paymentData);
      const result = await parkingService.renewBooking(bookingId, {
        payment_method: paymentData.payment_method,
        amount: paymentData.amount
      });
      console.log('✅ Booking renewed:', result);
      
      if (result && result.new_booking && result.new_booking.booking_id) {
        const newBookingId = result.new_booking.booking_id;
        
        // Clear old booking from sessionStorage
        sessionStorage.removeItem(`booking_${bookingId}`);
        
        // Clear state before navigating
        setBooking(null);
        setIsExpired(false);
        setTimeLeft(null);
        
        notify.success(`Booking renewed! Your new booking ID is ${newBookingId}`);
        
        // Navigate with replace to prevent back button issues
        setTimeout(() => {
          navigate(`/booking-confirmation?booking=${newBookingId}`, { replace: true });
        }, 1500);
      } else {
        setRenewError('Renewal succeeded but could not get new booking ID');
        notify.error('Could not get new booking ID. Please refresh the page.');
      }
    } catch (err) {
      console.error('❌ Error renewing booking:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to renew booking';
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: errorMsg
      });
      setRenewError(errorMsg);
      notify.error(errorMsg);
    } finally {
      setIsRenewing(false);
    }
  };

  const handleRenewalPaymentCancel = () => {
    setShowRenewalPaymentModal(false);
  };

  const handleConfirmRenewal = async () => {
    if (!bookingId) return;

    try {
      setIsRenewing(true);
      setRenewError(null);
      setShowRenewConfirm(false);
      notify.info('Processing renewal...');
      const result = await parkingService.renewBooking(bookingId);
      console.log('✅ Booking renewed:', result);
      
      if (result && result.new_booking && result.new_booking.booking_id) {
        const newBookingId = result.new_booking.booking_id;
        
        // Clear old booking from sessionStorage
        sessionStorage.removeItem(`booking_${bookingId}`);
        
        // Clear state before navigating
        setBooking(null);
        setIsExpired(false);
        setTimeLeft(null);
        
        notify.success(`Booking renewed! Your new booking ID is ${newBookingId}`);
        
        // Navigate with replace to prevent back button issues
        setTimeout(() => {
          navigate(`/booking-confirmation?booking=${newBookingId}`, { replace: true });
        }, 1500);
      } else {
        setRenewError('Renewal succeeded but could not get new booking ID');
        notify.error('Could not get new booking ID. Please refresh the page.');
      }
    } catch (err) {
      console.error('❌ Error renewing booking:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to renew booking';
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: errorMsg
      });
      setRenewError(errorMsg);
      notify.error(errorMsg);
    } finally {
      setIsRenewing(false);
    }
  };

  const handleCancelRenewal = () => {
    setShowRenewConfirm(false);
  };

  const handleExit = () => {
    navigate('/');
  };

  const formatTime = (ms) => {
    if (!ms || ms < 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  };

  const isExpiringSoon = timeLeft && timeLeft < 5 * 60 * 1000; // Less than 5 minutes

  if (loading) {
    return (
      <div className="booking-confirmation">
        <div className="confirmation-card">
          <p>Loading booking information...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="booking-confirmation">
        <div className="confirmation-card error">
          <h2>❌ Booking Not Found</h2>
          <p>Could not load booking details.</p>
          <button className="btn primary" onClick={() => navigate('/')}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const lotName = booking.lot_detail?.lot_name || 'Unknown Lot';
  const slotNumber = booking.slot_read?.slot_id || 'Unknown';
  const price = booking.price;

  return (
    <div className="booking-confirmation">
      <div className="confirmation-container">
        {!isExpired ? (
          <>
            <div className="confirmation-header success">
              <h1>✅ Booking Confirmed</h1>
              <p className="subtitle">Your parking slot has been reserved</p>
            </div>

            {/* 2-Column Layout: Left (Summary) + Right (Details) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* LEFT COLUMN: Summary (Sticky) */}
              <div className="md:col-span-1">
                <div className="summary-section">
                  {/* Booking Summary Header */}
                  <div className="summary-header">
                    <h3 className="text-lg font-semibold text-gray-800">📍 Booking Summary</h3>
                    <p className="text-sm text-gray-500">Your ongoing session</p>
                  </div>

                  {/* Booking Quick Info */}
                  <div className="quick-info-card">
                    <div className="quick-info-item">
                      <span className="label">Lot:</span>
                      <span className="value">{lotName}</span>
                    </div>
                    <div className="quick-info-item">
                      <span className="label">Slot:</span>
                      <span className="value">#{slotNumber}</span>
                    </div>
                    <div className="quick-info-item">
                      <span className="label">Vehicle:</span>
                      <span className="value">{booking.vehicle_number}</span>
                    </div>
                  </div>

                  {/* Total Amount Card */}
                  {booking.total_amount && (
                    <div className="total-card">
                      <p className="total-card-label">Total Paid</p>
                      <p className="total-card-amount">₹{parseFloat(booking.total_amount).toFixed(2)}</p>
                      <p className="total-card-desc">
                        {booking.carwash ? 'Slot + Car Wash' : 'Slot only'}
                      </p>
                    </div>
                  )}

                  {/* Timer Card - Or Pending Payment Message */}
                  {booking.payment_status === 'PENDING' ? (
                    <div className="timer-card pending-payment">
                      <h4 className="timer-card-label">⏳ Pending Verification</h4>
                      <p className="timer-card-time">Payment Awaiting Confirmation</p>
                      <p className="timer-card-desc">
                        Your cash payment will be verified at the parking counter. Once verified, your booking will be activated and the timer will start.
                      </p>
                      <p className="timer-card-action">
                        Transaction ID: {booking.payment_id}
                      </p>
                    </div>
                  ) : (
                    <div className={`timer-card ${isExpiringSoon ? 'expiring' : ''}`}>
                      {booking.status.toUpperCase() === 'SCHEDULED' ? (
                        <>
                          <h4 className="timer-card-label">⏰ Scheduled</h4>
                          <p className="timer-card-time">
                            {new Date(booking.start_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="timer-card-desc">Activates at this time</p>
                        </>
                      ) : (
                        <>
                          <h4 className="timer-card-label">⏱️ Time Remaining</h4>
                          <p className="timer-card-time">{formatTime(timeLeft)}</p>
                          {isExpiringSoon && (
                            <p className="timer-card-warning">⚠️ Expiring soon!</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Details (Scrollable) */}
              <div className="md:col-span-2">
                <div className="details-section">
                  
                  {/* Payment Breakdown */}
                  {booking.payments && booking.payments.length > 0 && (
                    <div className="details-card payment-section">
                      <div className="section-header">
                        <h3>💳 Payment Breakdown</h3>
                      </div>
                      
                      <div className="payments-container">
                        {booking.payments.map((payment, index) => (
                          <div key={index} className="payment-card">
                            <div className="payment-card-header">
                              <span className="payment-type-badge">
                                {payment.payment_type === 'Slot Payment' ? '🅿️' : '🧼'} {payment.payment_type}
                              </span>
                              <span className={`payment-status-badge payment-${payment.status.toLowerCase()}`}>
                                {payment.status === 'SUCCESS' ? '✅ Success' : 
                                 payment.status === 'PENDING' ? '⏳ Pending' : 
                                 '❌ Failed'}
                              </span>
                            </div>
                            
                            <div className="payment-card-content">
                              <div className="payment-detail">
                                <span className="detail-label">Method:</span>
                                <span className="detail-value">
                                  {payment.payment_method === 'CC' ? '💳 Credit Card' : 
                                   payment.payment_method === 'UPI' ? '📱 UPI' : 
                                   '💵 Cash'}
                                </span>
                              </div>
                              <div className="payment-detail">
                                <span className="detail-label">Amount:</span>
                                <span className="detail-value amount-highlight">₹{parseFloat(payment.amount).toFixed(2)}</span>
                              </div>
                              {payment.transaction_id && (
                                <div className="payment-detail">
                                  <span className="detail-label">Transaction:</span>
                                  <span className="detail-value transaction-id">{payment.transaction_id}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Car Wash Service */}
                  {booking.carwash && (
                    <div className="details-card carwash-section">
                      <div className="section-header">
                        <h3>🧼 Car Wash Service</h3>
                      </div>
                      <div className="carwash-detail-card">
                        <div className="detail-row">
                          <span className="label">Service:</span>
                          <span className="value">{booking.carwash.carwash_type_detail?.name || 'Service'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Description:</span>
                          <span className="value">{booking.carwash.carwash_type_detail?.description || 'N/A'}</span>
                        </div>
                        <div className="detail-row highlight">
                          <span className="label">Price:</span>
                          <span className="value price-value">₹{parseFloat(booking.carwash.carwash_type_detail?.price || booking.carwash.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* Info Message */}
            <div className="booking-info">
              <p className="info-text">
                {booking.status.toUpperCase() === 'SCHEDULED' 
                  ? '💡 Your advance booking is scheduled. It will become active at the selected time.' 
                  : '💡 Your booking will automatically expire in 1 hour.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className="btn secondary"
                onClick={() => navigate('/service', { state: { bookingId: booking.booking_id } })}
              >
                🚗 Add Car Wash Service
              </button>
              {isExpiringSoon && (
                <div className="expiring-warning">
                  <p style={{ color: '#f59e0b', fontWeight: '500', margin: 0 }}>
                    ⏰ Your booking will expire in {formatTime(timeLeft)}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    You can renew it once it completely expires.
                  </p>
                </div>
              )}
              <button className="btn ghost" onClick={handleExit}>
                🏠 Return to Home
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="confirmation-header completed">
              <h1>⏰ Booking Expired</h1>
              <p className="subtitle">Your 1-hour parking period has ended</p>
            </div>

            <div className="booking-details">
              <div className="detail-row">
                <span className="label">🅿️ Lot Name:</span>
                <span className="value">{lotName}</span>
              </div>
              <div className="detail-row">
                <span className="label">🔢 Slot Number:</span>
                <span className="value">#{slotNumber}</span>
              </div>
              <div className="detail-row">
                <span className="label">💰 Total Cost:</span>
                <span className="value">₹{price}</span>
              </div>
              <div className="detail-row">
                <span className="label">📋 Status:</span>
                <span className="value status-completed">COMPLETED</span>
              </div>
            </div>

            <div className="booking-info">
              <p className="info-text">
                ✅ Your booking has been completed successfully. 
                The parking slot is now available for other users.
              </p>
            </div>

            {renewError && (
              <div className="error-message">
                <p>❌ {renewError}</p>
                <p className="error-hint" style={{ fontSize: '0.85rem', marginTop: '8px', color: '#666' }}>
                  💡 You can only renew bookings after they have completely expired (1 hour after creation).
                </p>
              </div>
            )}

            <div className="action-buttons">
              <button
                className="btn primary"
                onClick={handleRenewClick}
                disabled={isRenewing}
              >
                {isRenewing ? '🔄 Renewing...' : '🔄 Renew Booking'}
              </button>
              <button className="btn ghost" onClick={handleExit}>
                🏠 Return to Home
              </button>
            </div>

            <p className="renewal-info">
              💡 Renew your booking to book the same slot again for another hour.
            </p>
          </>
        )}

        {/* Renewal Confirmation Modal */}
        {showRenewConfirm && (
          <div className="modal-overlay" onClick={handleCancelRenewal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Renewal</h3>
              <p>Are you sure you want to renew your booking for another hour?</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                💰 Cost: ₹{booking?.price || 0}
              </p>
              <div className="modal-actions">
                <button
                  className="btn danger"
                  onClick={handleCancelRenewal}
                  disabled={isRenewing}
                >
                  ✕ Cancel
                </button>
                <button
                  className="btn primary"
                  onClick={handleConfirmRenewal}
                  disabled={isRenewing}
                >
                  {isRenewing ? '🔄 Renewing...' : '✓ Confirm Renewal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Renewal Payment Modal */}
      {showRenewalPaymentModal && booking && (
        <PaymentModal
          slot={{ 
            slotNumber: booking.slot_read?.slot_id,
            lot_detail: booking.lot_detail,
            vehicle_type: booking.vehicle_type 
          }}
          price={booking.price}
          onConfirm={handleRenewalPaymentConfirm}
          onClose={handleRenewalPaymentCancel}
          isLoading={isRenewing}
        />
      )}
    </div>
  );
};

export default BookingConfirmation;
