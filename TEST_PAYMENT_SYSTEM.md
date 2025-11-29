# Payment System Integration Test Guide

## Implementation Summary

### ✅ Completed Tasks

1. **Backend Payment Model** (parking/models.py)
   - Added PAYMENT_STATUS_CHOICES with SUCCESS/FAILED/PENDING options
   - Changed relationship from ForeignKey to OneToOneField (one payment per booking)
   - Added `status` field with default='SUCCESS'
   - Added `transaction_id` field (max_length=100, blank/null)
   - Added `created_at` timestamp field

2. **Serializers** (parking/serializers.py)
   - PaymentSerializer: Includes all payment fields (status, transaction_id, created_at)
   - BookingSerializer: Added nested `payment` field with get_payment() method
   - Payment data now returned in booking API responses

3. **Backend Booking Creation** (parking/views.py - BookingViewSet.perform_create)
   - Modified to accept `payment_method` and `amount` from request.data
   - Determines payment_status: 'PENDING' for Cash, 'SUCCESS' for CC/UPI
   - Generates transaction_id: f'PM-{booking.id}-{int(time.time())}'
   - Creates Payment object atomically within transaction.atomic() block
   - Both Booking and Payment created together or both fail

4. **Payment Modal Component** (Parkmate/src/Components/PaymentModal.jsx)
   - React functional component with payment method selection
   - Props: slot, price, onConfirm, onClose, isLoading
   - Three payment methods: CC (Credit Card), UPI (QR/Mobile), Cash
   - Displays booking info (lot, slot, vehicle type, duration, amount)
   - Payment status indicators (green for instant, orange for pending)
   - Terms & conditions checkbox
   - Toast notifications for validation

5. **Modal Styling** (Parkmate/src/Components/PaymentModal.css)
   - Glass-morphism design with blurred backdrop
   - Gradient header (purple blue)
   - Responsive layout for mobile/tablet
   - Smooth animations (fadeIn, slideUp, scaleIn)
   - Status badges with color coding

6. **DynamicLot.jsx Integration** (Parkmate/src/Pages/Users/DynamicLot.jsx)
   - Imported PaymentModal component and CSS
   - Replaced booking confirmation modal with PaymentModal
   - Updated booking handler: handlePaymentConfirm receives payment data
   - Passes payment_method and amount to createBooking API
   - PaymentModal state: showPaymentModal (instead of showBookingConfirm)
   - Handlers: handlePaymentConfirm, handlePaymentCancel

---

## Testing Procedure

### 1. Backend Payment Creation Test

**Endpoint:** POST /parking/bookings/

**Request Data:**
```json
{
  "slot": 1,
  "vehicle_number": "TN01AB1234",
  "booking_type": "Instant",
  "payment_method": "CC",
  "amount": 50
}
```

**Expected Response:**
```json
{
  "booking_id": 123,
  "status": "booked",
  "start_time": "2025-01-10T10:30:00Z",
  "end_time": "2025-01-10T11:30:00Z",
  "payment": {
    "pay_id": 45,
    "booking": 123,
    "user": 5,
    "payment_method": "CC",
    "amount": "50.00",
    "status": "SUCCESS",
    "transaction_id": "PM-123-1736485200",
    "created_at": "2025-01-10T10:30:45.123456Z"
  }
}
```

### 2. Test Cases

#### Test Case 1: Credit Card Payment
- **Method:** CC
- **Expected Status:** SUCCESS (instant)
- **Expected Response:** Booking + Payment created
- **Database Check:** Payment.status = 'SUCCESS'

```bash
curl -X POST http://localhost:8000/parking/bookings/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "slot": 1,
    "vehicle_number": "TN01AB1234",
    "booking_type": "Instant",
    "payment_method": "CC",
    "amount": 50
  }'
```

#### Test Case 2: UPI Payment
- **Method:** UPI
- **Expected Status:** SUCCESS (instant)
- **Expected Response:** Booking + Payment created
- **Database Check:** Payment.status = 'SUCCESS'

```bash
curl -X POST http://localhost:8000/parking/bookings/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "slot": 2,
    "vehicle_number": "TN01AB1234",
    "booking_type": "Instant",
    "payment_method": "UPI",
    "amount": 50
  }'
```

#### Test Case 3: Cash Payment
- **Method:** Cash
- **Expected Status:** PENDING (payment at counter)
- **Expected Response:** Booking + Payment created
- **Database Check:** Payment.status = 'PENDING'

```bash
curl -X POST http://localhost:8000/parking/bookings/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "slot": 3,
    "vehicle_number": "TN01AB1234",
    "booking_type": "Instant",
    "payment_method": "Cash",
    "amount": 50
  }'
```

### 3. Frontend Payment Flow Test

#### Step 1: Select Slot
1. Navigate to /lot/:lotId
2. Click on available slot
3. Click "Book Slot" button
4. **Expected:** PaymentModal opens with slot info

#### Step 2: Payment Modal Display
- **Verify:** 
  - Lot name displayed
  - Slot number displayed
  - Vehicle type displayed
  - Amount displayed (₹50)
  - Duration info shown (1 Hour)
  - Three payment methods available (CC, UPI, Cash)
  - Status indicators visible

#### Step 3: Select Payment Method
1. Click on CC payment option
2. **Expected:** 
   - Radio button selected
   - Option highlighted with gradient
   - Checkmark appears
   - Status shows "Green - Instant Payment"

#### Step 4: Confirm Payment
1. Accept terms & conditions
2. Click "Confirm Payment" button
3. **Expected:**
   - Modal shows loading state (Confirm button disabled)
   - Backend receives payment_method and amount
   - Booking + Payment created atomically
   - Redirect to /booking-confirmation?booking=<id>

#### Step 5: Verify Booking Created
1. **API Response Check:**
   - Booking status = 'booked'
   - Payment status = 'SUCCESS' (for CC/UPI) or 'PENDING' (for Cash)
   - Payment.transaction_id populated
   - Payment.created_at set

2. **Database Check:**
   ```sql
   SELECT b.booking_id, b.status, p.status as payment_status, p.transaction_id
   FROM parking_booking b
   LEFT JOIN parking_payment p ON p.booking_id = b.booking_id
   ORDER BY b.booking_id DESC
   LIMIT 5;
   ```

3. **Expected Output:**
   ```
   booking_id | status | payment_status | transaction_id
   -----------|--------|----------------|----------------
   125        | booked | SUCCESS        | PM-125-1736485234
   ```

### 4. Renewal Flow Test (Pending Implementation)

**Expected Future Behavior:**
1. User clicks "Renew Booking" on timer view
2. PaymentModal opens with updated duration
3. User selects payment method again
4. New Booking + Payment created
5. Timer resets with new booking

---

## Error Cases to Test

### 1. Missing Payment Method
- **Action:** Try to confirm without selecting payment method
- **Expected:** Toast warning "Please select a payment method"

### 2. Network Error During Payment
- **Action:** Disconnect internet after clicking Confirm
- **Expected:** Error alert with message from backend

### 3. Invalid Slot
- **Action:** Try to book already booked slot
- **Expected:** Alert "Slot already booked"

### 4. Missing Vehicle Number
- **Action:** Book without vehicle number in profile
- **Expected:** Alert "Please add a vehicle number to your profile"

---

## Database Verification

### Check Payment Creation
```sql
-- View all payments created
SELECT * FROM parking_payment 
ORDER BY created_at DESC 
LIMIT 10;

-- Check payment status distribution
SELECT status, COUNT(*) as count FROM parking_payment GROUP BY status;

-- Verify one-to-one relationship
SELECT b.booking_id, p.pay_id, p.status, p.transaction_id
FROM parking_booking b
LEFT JOIN parking_payment p ON p.booking_id = b.booking_id
WHERE b.status = 'booked'
ORDER BY b.booking_id DESC;
```

### Check Transaction IDs
```sql
-- Verify transaction_id format
SELECT 
  pay_id,
  transaction_id,
  status,
  created_at
FROM parking_payment
WHERE transaction_id LIKE 'PM-%'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Troubleshooting

### Issue: Payment modal not showing
- **Solution:** Check PaymentModal.jsx import in DynamicLot.jsx
- **Verify:** `import PaymentModal from '../../Components/PaymentModal';`

### Issue: Payment data not sent to backend
- **Solution:** Check handlePaymentConfirm passes payment_method and amount
- **Verify:** console.log shows paymentData with both fields

### Issue: Booking created but payment not created
- **Solution:** Check perform_create reads payment_method and amount from request.data
- **Verify:** Backend logs show "💳 PAYMENT created"

### Issue: Payment status not showing in confirmation
- **Solution:** BookingSerializer includes payment field
- **Verify:** API response includes payment object in booking

---

## Browser Console Verification

After clicking "Confirm Payment", check browser console for:

```
💳 Payment data: {payment_method: "CC", amount: 50}
🎯 Creating booking with payment...
🎯 Final booking data: {..., payment_method: "CC", amount: 50}
✅ Booking created: {booking_id: 125, status: "booked", ...}
💳 Payment created: {pay_id: 45, status: "SUCCESS", transaction_id: "PM-125-1736485234"}
```

---

## Success Criteria

✅ Payment Modal displays when slot selected
✅ All three payment methods appear with correct labels
✅ Payment method selection highlights properly
✅ Confirm button disabled until method selected
✅ Backend receives payment_method and amount
✅ Payment object created with correct status
✅ Transaction ID generated in correct format
✅ Timer view shows payment info
✅ Renewal flow uses payment modal
✅ Database shows consistent payment records

---

## Next Steps

1. **Display Payment in Confirmation View**
   - Show payment method selected
   - Display payment status (SUCCESS/PENDING)
   - Show transaction ID

2. **Display Payment in Timer View**
   - Add payment info section
   - Show transaction ID
   - Option to view payment receipt

3. **Implement Renewal Flow**
   - "Renew Booking" button on timer
   - Opens PaymentModal with new duration
   - Creates new Booking + Payment

4. **Add Payment History**
   - Show past payments in booking history
   - Allow payment receipt download

5. **Testing & Validation**
   - End-to-end test with multiple bookings
   - Test all payment methods
   - Verify database consistency
   - Test on mobile devices
