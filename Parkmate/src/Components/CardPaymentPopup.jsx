import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './CardPaymentPopup.css';

const CardPaymentPopup = ({ slot, amount, onSuccess, onClose, isLoading }) => {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const numAmount = parseFloat(amount) || 0;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces (every 4 digits)
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      // Limit to 19 characters (16 digits + 3 spaces)
      if (formattedValue.length > 19) {
        formattedValue = formattedValue.slice(0, 19);
      }
    }

    // Format expiry as MM/YY
    if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
      if (formattedValue.length > 5) {
        formattedValue = formattedValue.slice(0, 5);
      }
    }

    // Limit CVV to 3-4 digits
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    // Convert card holder to uppercase
    if (name === 'cardHolder') {
      formattedValue = value.toUpperCase();
    }

    setCardData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }

    if (!cardData.cardHolder || cardData.cardHolder.trim().length === 0) {
      newErrors.cardHolder = 'Card holder name is required';
    }

    if (!cardData.expiry || cardData.expiry.length !== 5) {
      newErrors.expiry = 'Expiry must be in MM/YY format';
    } else {
      const [month, year] = cardData.expiry.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;

      if (parseInt(month) > 12 || parseInt(month) < 1) {
        newErrors.expiry = 'Invalid month';
      } else if (
        parseInt(year) < currentYear ||
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)
      ) {
        newErrors.expiry = 'Card has expired';
      }
    }

    if (!cardData.cvv || cardData.cvv.length < 3) {
      newErrors.cvv = 'CVV must be 3-4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      toast.error('❌ Please fill all fields correctly', { autoClose: 3000 });
      return;
    }

    setIsProcessing(true);
    toast.info('🔄 Processing payment...', { autoClose: 2500 });

    // Simulate 2.5 second payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    setPaymentSuccess(true);
    toast.success('✅ Payment successful 💳', { autoClose: 3000 });

    // Call the success callback after a brief delay for visual feedback
    setTimeout(() => {
      onSuccess({
        payment_method: 'CC',
        amount: amount,
        status: 'SUCCESS'
      });
    }, 1000);

    setIsProcessing(false);
  };

  const handleCancel = () => {
    toast.warning('⚠️ Payment cancelled', { autoClose: 2000 });
    onClose();
  };

  return (
    <div className="card-payment-overlay">
      <div className="card-payment-container">
        {/* Header */}
        <div className="card-header">
          <h2>Credit Card Payment</h2>
          <button 
            className="card-close-btn" 
            onClick={handleCancel} 
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="card-content">
          {!paymentSuccess ? (
            <>
              <div className="card-form">
                {/* Card Number */}
                <div className="form-group">
                  <label htmlFor="cardNumber">Card Number</label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.cardNumber}
                    onChange={handleInputChange}
                    disabled={isProcessing}
                    maxLength="19"
                  />
                  {errors.cardNumber && (
                    <span className="error-text">{errors.cardNumber}</span>
                  )}
                </div>

                {/* Card Holder */}
                <div className="form-group">
                  <label htmlFor="cardHolder">Card Holder Name</label>
                  <input
                    type="text"
                    id="cardHolder"
                    name="cardHolder"
                    placeholder="JOHN DOE"
                    value={cardData.cardHolder}
                    onChange={handleInputChange}
                    disabled={isProcessing}
                  />
                  {errors.cardHolder && (
                    <span className="error-text">{errors.cardHolder}</span>
                  )}
                </div>

                {/* Row: Expiry and CVV */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expiry">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      id="expiry"
                      name="expiry"
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      maxLength="5"
                    />
                    {errors.expiry && (
                      <span className="error-text">{errors.expiry}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="cvv">CVV</label>
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      maxLength="4"
                    />
                    {errors.cvv && (
                      <span className="error-text">{errors.cvv}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="payment-info">
                {slot && (
                  <>
                    <div className="info-row">
                      <span className="label">Parking Slot:</span>
                      <span className="value">{slot.slot_identifier}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Duration:</span>
                      <span className="value">{slot.duration} hour(s)</span>
                    </div>
                  </>
                )}
                <div className="info-row highlight">
                  <span className="label">Amount:</span>
                  <span className="value">₹{numAmount.toFixed(2)}</span>
                </div>
              </div>

              <p className="security-note">
                🔒 Your payment information is secure and encrypted
              </p>
            </>
          ) : (
            <div className="payment-success">
              <div className="success-icon">✓</div>
              <h3>Payment Successful!</h3>
              <p>Your credit card payment has been processed</p>
              <p className="amount-display">₹{numAmount.toFixed(2)}</p>
              <p className="confirmation-text">
                Your booking will start immediately
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="card-actions">
          {!paymentSuccess ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => onClose()}
              disabled={isLoading}
            >
              Continue to Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardPaymentPopup;
