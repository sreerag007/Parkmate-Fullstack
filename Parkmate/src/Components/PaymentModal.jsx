import React, { useState } from 'react'
import { toast } from 'react-toastify'
import QRPaymentPopup from './QRPaymentPopup'
import CardPaymentPopup from './CardPaymentPopup'
import './PaymentModal.css'

const PaymentModal = ({ 
  slot, 
  price, 
  onConfirm, 
  onClose, 
  isLoading = false,
  isRenewal = false,  // New prop to indicate renewal
  purpose = 'booking',  // 'booking' or 'carwash'
  metadata = {}  // Additional data like { serviceName, carwashTypeId, bookingId }
}) => {
  const [method, setMethod] = useState('')
  const [amount, _setAmount] = useState(price || 0)
  const [showQRPopup, setShowQRPopup] = useState(false)
  const [showCardPopup, setShowCardPopup] = useState(false)

  const handleConfirm = () => {
    if (!method) {
      toast.warning('⚠️ Please select a payment method')
      return
    }

    if (isLoading) {
      toast.info('⏳ Processing payment...')
      return
    }

    // Open the appropriate payment popup based on method
    if (method === 'UPI') {
      setShowQRPopup(true)
    } else if (method === 'CC') {
      setShowCardPopup(true)
    } else if (method === 'Cash') {
      // For cash, proceed directly with booking
      const paymentData = {
        payment_method: method,
        amount: amount
      }
      console.log('💳 Confirming payment (Cash):', paymentData)
      toast.info('⏳ Processing cash payment...', { autoClose: 2500 })
      
      // Simulate a brief delay for consistency
      setTimeout(() => {
        toast.warning('⌛ Payment pending - will be verified at counter', { autoClose: 3000 })
        onConfirm(paymentData)
      }, 500)
    }
  }

  const handlePaymentSuccess = (paymentData) => {
    setShowQRPopup(false)
    setShowCardPopup(false)
    console.log('💳 Payment successful:', paymentData)
    onConfirm(paymentData)
  }

  // payment method display helper removed (unused) to satisfy linter

  return (
    <>
      {/* QR Payment Popup */}
      {showQRPopup && (
        <QRPaymentPopup
          slot={slot}
          amount={amount}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowQRPopup(false)}
          isLoading={isLoading}
        />
      )}

      {/* Card Payment Popup */}
      {showCardPopup && (
        <CardPaymentPopup
          slot={slot}
          amount={amount}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowCardPopup(false)}
          isLoading={isLoading}
        />
      )}

      {/* Main Payment Modal */}
      {!showQRPopup && !showCardPopup && (
        <div className="payment-modal-overlay" onClick={onClose}>
          <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="payment-modal-header">
              <h2>{purpose === 'carwash' ? '🚗 Car Wash Payment' : '💳 Complete Payment'}</h2>
              <button className="modal-close-btn" onClick={onClose}>✕</button>
            </div>

            {/* Booking Info */}
            <div className="payment-booking-info">
              {purpose === 'carwash' ? (
                <>
                  <div className="booking-info-item">
                    <span className="info-label">🚗 Service:</span>
                    <span className="info-value">{metadata.serviceName || 'Car Wash Service'}</span>
                  </div>
                  {metadata.parkingLot && (
                    <div className="booking-info-item">
                      <span className="info-label">📍 Parking Lot:</span>
                      <span className="info-value">{metadata.parkingLot}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="booking-info-item">
                    <span className="info-label">📍 Parking Lot:</span>
                    <span className="info-value">{slot?.lot_name || 'Premium Lot'}</span>
                  </div>
                  <div className="booking-info-item">
                    <span className="info-label">🅿️ Slot Number:</span>
                    <span className="info-value">#{slot?.slot_id || slot?.id || 'N/A'}</span>
                  </div>
                  <div className="booking-info-item">
                    <span className="info-label">🚗 Vehicle Type:</span>
                    <span className="info-value">{slot?.vehicle_type || 'Standard'}</span>
                  </div>
                </>
              )}
              <div className="booking-info-item amount-highlight">
                <span className="info-label">💰 Amount to Pay:</span>
                <span className="amount-value">₹{amount}</span>
              </div>
              {isRenewal && (
                <div className="renewal-discount-badge" style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginTop: '8px'
                }}>
                  🎉 50% Renewal Discount Applied!
                </div>
              )}
            </div>

            {/* Payment Duration Info */}
            {purpose !== 'carwash' && (
              <div className="payment-duration-info">
                <p>⏱️ <strong>Duration:</strong> 1 hour</p>
                <p className="duration-note">Booking expires after 1 hour. Set for renewal after use.</p>
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="payment-options-container">
              <h3>Select Payment Method</h3>
              
              <div className="payment-options">
                {/* Credit Card */}
                <label className={`payment-option ${method === 'CC' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment-method"
                    value="CC"
                    checked={method === 'CC'}
                    onChange={(e) => setMethod(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="option-content">
                    <span className="option-title">💳 Credit Card</span>
                    <span className="option-note">Visa, Mastercard, Amex</span>
                  </div>
                  {method === 'CC' && <span className="checkmark">✓</span>}
                </label>

                {/* UPI */}
                <label className={`payment-option ${method === 'UPI' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment-method"
                    value="UPI"
                    checked={method === 'UPI'}
                    onChange={(e) => setMethod(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="option-content">
                    <span className="option-title">📱 UPI / QR Code</span>
                    <span className="option-note">Google Pay, PhonePe, Paytm</span>
                  </div>
                  {method === 'UPI' && <span className="checkmark">✓</span>}
                </label>

                {/* Cash */}
                <label className={`payment-option ${method === 'Cash' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment-method"
                    value="Cash"
                    checked={method === 'Cash'}
                    onChange={(e) => setMethod(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="option-content">
                    <span className="option-title">💵 Cash</span>
                    <span className="option-note">Pay at counter - Pending confirmation</span>
                  </div>
                  {method === 'Cash' && <span className="checkmark">✓</span>}
                </label>
              </div>
            </div>

            {/* Payment Status Info */}
            {method && (
              <div className={`payment-status-info ${method === 'Cash' ? 'pending' : 'success'}`}>
                {method === 'Cash' ? (
                  <>
                    <span className="status-icon">⏳</span>
                    <p><strong>Pending:</strong> Payment will be verified at counter. Your booking will be confirmed after payment verification.</p>
                  </>
                ) : (
                  <>
                    <span className="status-icon">✓</span>
                    <p><strong>Instant:</strong> Payment will be processed immediately and booking confirmed.</p>
                  </>
                )}
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="payment-terms">
              <label className="terms-checkbox">
                <input type="checkbox" defaultChecked />
                <span>I agree to the parking terms and conditions</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button
                className="btn btn-confirm"
                onClick={handleConfirm}
                disabled={!method || isLoading}
              >
                {isLoading ? '⏳ Processing...' : `✓ Confirm Payment (₹${amount})`}
              </button>
              <button
                className="btn btn-cancel"
                onClick={onClose}
                disabled={isLoading}
              >
                ✕ Cancel
              </button>
            </div>

            {/* Security Info */}
            <div className="payment-security-info">
              <p>🔒 Your payment information is secure and encrypted</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PaymentModal
