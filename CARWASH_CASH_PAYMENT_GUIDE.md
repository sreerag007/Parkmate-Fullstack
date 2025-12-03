# 💰 Car Wash Cash Payment Flow Guide

## Overview
Complete guide for car wash bookings with **Cash payment method**, including verification workflow and transaction ID display for owners.

---

## 🎯 Payment Flow

### 1️⃣ User Books Car Wash (Cash Payment)

**Location**: `/carwash` → Car Wash Booking Page

**Steps**:
1. User selects car wash service (Exterior/Interior/Full Service)
2. Fills booking details:
   - Parking Lot
   - Scheduled Date
   - Time Slot (9 AM - 8 PM hourly slots, max 2 cars/slot)
   - Optional notes
3. Clicks **"Proceed to Payment"**
4. Payment Modal opens
5. User selects **"Cash"** payment method
6. Enters **Transaction ID** (reference number)
7. Clicks **"Confirm Booking"**

**Backend Processing**:
```python
# parking/views.py - CarWashBookingViewSet.perform_create()

booking = CarWashBooking.objects.create(
    user=user_profile,
    service_type="Full Service",
    lot=lot,
    scheduled_time="2025-12-04T14:00:00",
    payment_method="Cash",
    payment_status="pending",  # ⚠️ Pending verification
    status="pending",
    transaction_id="TXN123456789",  # User-provided reference
    price=300.00
)
```

**Result**:
- ✅ Booking created with `payment_status = "pending"`
- ✅ `status = "pending"` (awaiting payment verification)
- ✅ Transaction ID saved
- ✅ **NOT auto-completed** (Cash requires manual verification)

---

### 2️⃣ Owner Verifies Cash Payment

**Location**: `/owner/carwash` → Owner Car Wash Management

**Owner View**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🚗 Car Wash Bookings Management                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Booking ID | Customer    | Service      | Payment Method | Transaction ID │
│ #42        | John Doe    | Full Service | 💳 CASH       | TXN123456789   │
│            |             |              | ⏳ Pending    | [Verify]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Display Features**:
- **Payment Method Badge**: Color-coded (Cash = pink gradient)
- **Transaction ID**: Monospace font, truncated if > 15 chars
- **Payment Status**: "Pending" in yellow badge
- **Verify Button**: Only visible for `payment_status=pending` AND `payment_method=Cash`

**Verification Process**:
1. Owner clicks **"Verify"** button
2. Frontend calls: `POST /api/owner/carwash-bookings/42/verify-payment/`
3. Backend validates:
   - ✅ Owner owns the lot
   - ✅ Payment method is "Cash"
   - ✅ Payment status is "pending"
4. Backend updates: `payment_status = "verified"`
5. WebSocket notification sent to user
6. Booking refreshed in owner's list

**Backend Code**:
```python
# parking/views.py - OwnerCarWashBookingViewSet.verify_payment()

@action(detail=True, methods=['patch'], url_path='verify-payment')
def verify_payment(self, request, pk=None):
    booking = self.get_object()
    
    # Security check
    if booking.lot.owner != request.user.ownerprofile:
        return Response({'error': 'Permission denied'}, status=403)
    
    # Only Cash can be manually verified
    if booking.payment_method != 'Cash':
        return Response({
            'error': 'Only Cash payments can be verified manually'
        }, status=400)
    
    # Update payment status
    booking.payment_status = 'verified'
    booking.save()
    
    # Send notification to user
    send_ws_notification(
        booking.user.auth_user.id,
        'success',
        'Your car wash payment has been verified by the lot owner.'
    )
    
    return Response({'message': 'Cash payment verified'}, status=200)
```

---

### 3️⃣ Owner Confirms Booking

**After Payment Verification**:

**Owner View**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Booking ID | Customer    | Service      | Payment     | Transaction ID    │
│ #42        | John Doe    | Full Service | ✅ Verified | TXN123456789     │
│            |             |              | [Confirm]   |                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Confirmation Process**:
1. Owner clicks **"Confirm"** button
2. Backend validates payment is verified
3. Updates: `status = "confirmed"`
4. Booking ready for service

**Backend Code**:
```python
@action(detail=True, methods=['patch'], url_path='confirm-booking')
def confirm_booking(self, request, pk=None):
    booking = self.get_object()
    
    # Require verified payment
    if booking.payment_status != 'verified':
        return Response({
            'error': 'Payment must be verified first'
        }, status=400)
    
    booking.status = 'confirmed'
    booking.save()
    
    return Response({'message': 'Booking confirmed'}, status=200)
```

---

### 4️⃣ Service Execution

**Status Progression**:

| Action | Status Before | Status After | Button |
|--------|---------------|--------------|--------|
| Verify Payment | pending | pending | ✅ Verify |
| Confirm Booking | pending | confirmed | ✅ Confirm |
| Start Service | confirmed | in_progress | ▶️ Start |
| Complete Service | in_progress | completed | ✅ Complete |

**Owner Actions**:
1. **Start**: Changes `status` to `"in_progress"`
2. **Complete**: Changes `status` to `"completed"`, sets `completed_time`

---

## 🔒 Security & Validation

### Payment Verification Rules:
✅ **Allowed**:
- Owner of the lot can verify payments
- Only `payment_method = "Cash"` can be manually verified
- Only `payment_status = "pending"` can be verified

❌ **Blocked**:
- UPI/Credit Card payments (auto-verified)
- Already verified payments
- Bookings from other owners' lots

### Auto-Completion Rules:
✅ **Auto-completes** (after 5 minutes):
- UPI payments (auto-verified)
- Credit Card payments (auto-verified)

❌ **Does NOT auto-complete**:
- Cash payments (requires manual verification)
- Failed payments
- Cancelled bookings

---

## 📊 Owner Dashboard Features

### Enhanced Table Columns:
1. **Booking ID**: Unique identifier
2. **Customer**: Name + phone
3. **Service Type**: Exterior/Interior/Full
4. **Location**: Lot name + city
5. **Scheduled Date**: Date/time of service
6. **Price**: Amount in ₹
7. **Payment Method**: Badge (UPI/Cash/CC) ⭐ NEW
8. **Transaction ID**: Reference number with hover tooltip ⭐ NEW
9. **Status**: pending/confirmed/in_progress/completed/cancelled
10. **Payment**: pending/verified/failed
11. **Actions**: Verify/Confirm/Start/Complete buttons

### Visual Enhancements:
- **Payment Method Badges**:
  - 💳 UPI: Purple gradient
  - 💰 Cash: Pink gradient
  - 💳 CC: Blue gradient
  
- **Transaction ID Display**:
  - Monospace font (Courier New)
  - Gray background with border
  - Truncated if > 15 characters
  - Hover shows full ID in tooltip
  - "-" shown if no transaction ID

---

## 🔔 Notifications

### User Notifications:
1. **Booking Created**: "Car wash booking confirmed! Booking ID: #42"
2. **Payment Verified**: "Your car wash payment has been verified by the lot owner."
3. **Auto-Completed** (UPI/CC only): "🎉 Car Wash Complete! Your [service] has been completed."

### Owner Notifications:
- Visual badge updates in real-time
- Console logs for verification actions

---

## 📱 User Experience Flow

### Cash Payment Journey:
```
1. User books car wash with Cash
   └─> Status: pending | Payment: pending
   
2. User provides Transaction ID (e.g., "TXN123456789")
   └─> Saved in database
   
3. User waits for owner verification
   └─> Booking shown in "My Bookings" as "Pending Payment"
   
4. Owner verifies cash payment
   └─> Status: pending | Payment: verified ✅
   └─> User receives notification
   
5. Owner confirms booking
   └─> Status: confirmed | Payment: verified ✅
   
6. Owner starts service
   └─> Status: in_progress
   
7. Owner completes service
   └─> Status: completed
   └─> ⏰ NO auto-completion (manual control)
```

---

## 🆚 Comparison: Cash vs UPI/CC

| Feature | Cash Payment | UPI/Credit Card |
|---------|-------------|-----------------|
| Payment Verification | ❌ Manual (owner) | ✅ Auto-verified |
| Transaction ID | ✅ User enters | ✅ Auto-generated |
| Requires Owner Action | ✅ Yes (Verify) | ❌ No |
| Auto-Completion (5 min) | ❌ No | ✅ Yes |
| Initial Status | pending | confirmed* |
| Notification on Verify | ✅ Yes | N/A |

*UPI/CC bookings start as `pending` but payment is auto-verified, then auto-complete after 5 minutes.

---

## 🛠️ Technical Implementation

### Frontend Components:
1. **CarWash.jsx**: Booking form + payment modal
2. **OwnerCarWash.jsx**: Owner management dashboard
3. **PaymentModal.jsx**: Payment method selection
4. **useWebSocketNotifications.js**: Real-time notifications

### Backend Endpoints:
1. `POST /api/carwash-bookings/` - Create booking
2. `GET /api/owner/carwash-bookings/` - List owner's bookings
3. `PATCH /api/owner/carwash-bookings/{id}/verify-payment/` - Verify cash
4. `PATCH /api/owner/carwash-bookings/{id}/confirm-booking/` - Confirm booking
5. `PATCH /api/owner/carwash-bookings/{id}/` - Update status

### Database Fields:
```python
CarWashBooking:
    - payment_method: "Cash" | "UPI" | "CC"
    - payment_status: "pending" | "verified" | "failed"
    - transaction_id: User-provided reference (nullable)
    - status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
```

---

## ✅ Testing Checklist

### User Flow:
- [ ] Book car wash with Cash payment
- [ ] Enter transaction ID in payment modal
- [ ] Verify booking shows in "My Bookings" as pending
- [ ] Check transaction ID is saved

### Owner Flow:
- [ ] Navigate to Owner Car Wash Management
- [ ] Verify "Verify" button appears for Cash pending payments
- [ ] Click "Verify" and confirm payment status changes
- [ ] Check transaction ID is displayed in table
- [ ] Verify "Confirm" button appears after verification
- [ ] Start and complete service workflow

### Edge Cases:
- [ ] Try verifying UPI payment (should fail with error)
- [ ] Try verifying already verified payment (should return message)
- [ ] Test transaction ID tooltip on hover
- [ ] Verify truncation for long transaction IDs (>15 chars)
- [ ] Test Cash booking does NOT auto-complete after 5 minutes

---

## 📸 Screenshots Reference

### Owner View - Cash Pending Payment:
```
Payment Method: [💰 CASH]
Transaction ID: [TXN123456789]
Payment Status: [⏳ Pending]
Actions: [Verify]
```

### Owner View - Cash Verified:
```
Payment Method: [💰 CASH]
Transaction ID: [TXN123456789]
Payment Status: [✅ Verified]
Actions: [Confirm]
```

---

## 🎓 Summary

**Cash Payment Verification** is now fully implemented for car wash bookings:

1. ✅ **Transaction ID display** in owner dashboard
2. ✅ **Payment method badges** with color coding
3. ✅ **Manual verification** workflow for Cash payments
4. ✅ **No auto-completion** for Cash (manual control)
5. ✅ **WebSocket notifications** for payment verification
6. ✅ **Security validation** (owner permissions, payment method checks)

**Key Difference**: Unlike UPI/CC which auto-verify and auto-complete, **Cash payments require owner verification** before booking can proceed to confirmed status.

---

*Last Updated: December 4, 2025*
