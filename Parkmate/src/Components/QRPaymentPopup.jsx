import React, { useState } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { toast } from 'react-toastify';
import './QRPaymentPopup.css';

const QRPaymentPopup = ({ slot, amount, onSuccess, onClose, isLoading }) => {
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const numAmount = parseFloat(amount) || 0;

  const generateUPIString = () => {
    // Generate a realistic UPI string for QR code
    // Format: upi://pay?pa=merchant@upi&pn=Parkmate&am=amount&tn=parking
    const upiId = 'parkmate-parking@upi';
    const merchantName = 'Parkmate Parking';
    // Use slot details if available, otherwise generate generic transaction ref
    const transactionRef = slot 
      ? `PARK${slot.lot_id}${slot.spot_id}${Date.now()}`
      : `PARK${Math.random().toString(36).substring(7)}${Date.now()}`;
    
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&tn=${encodeURIComponent(transactionRef)}&tr=${transactionRef}`;
  };

  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    toast.info('Processing UPI payment...', { autoClose: 2500 });

    // Simulate 2.5 second payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    setIsPaid(true);
    toast.success('✅ Payment successful!', { autoClose: 3000 });

    // Call the success callback after a brief delay for visual feedback
    setTimeout(() => {
      onSuccess({
        payment_method: 'UPI',
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
    <div className="qr-payment-overlay">
      <div className="qr-payment-container">
        {/* Header */}
        <div className="qr-header">
          <h2>UPI Payment</h2>
          <button className="qr-close-btn" onClick={handleCancel} disabled={isProcessing}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="qr-content">
          {!isPaid ? (
            <>
              <div className="qr-section">
                <p className="qr-instruction">Scan QR code with any UPI app</p>
                <div className="qr-code-wrapper">
                  <QRCode 
                    value={generateUPIString()} 
                    size={280}
                    level="H"
                    includeMargin={true}
                    fgColor="#0b5ed7"
                    bgColor="#ffffff"
                  />
                </div>
              </div>

              <div className="payment-details">
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value">₹{numAmount.toFixed(2)}</span>
                </div>
                {slot && (
                  <>
                    <div className="detail-row">
                      <span className="label">Parking Slot:</span>
                      <span className="value">{slot.slot_identifier}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Duration:</span>
                      <span className="value">{slot.duration} hour(s)</span>
                    </div>
                  </>
                )}
              </div>

              <p className="qr-note">
                After scanning and completing payment on your UPI app, click "I've Paid" below
              </p>
            </>
          ) : (
            <div className="payment-success">
              <div className="success-icon">✓</div>
              <h3>Payment Successful!</h3>
              <p>Your UPI payment has been confirmed</p>
              <p className="amount-display">₹{numAmount.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="qr-actions">
          {!isPaid ? (
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
                onClick={handlePaymentConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : "I've Paid"}
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

export default QRPaymentPopup;
