# Car Wash Payment Flow Testing Guide

**Phase 4.4 - Test Online and Cash Payment Flows**

This document provides comprehensive testing procedures for both online (Razorpay/UPI) and cash payment methods in the car wash booking system.

---

## Table of Contents
1. [Test Environment Setup](#test-environment-setup)
2. [Payment Method Flow - Cash](#payment-method-flow---cash)
3. [Payment Method Flow - Online](#payment-method-flow---online)
4. [Test Cases](#test-cases)
5. [Validation Rules](#validation-rules)
6. [Troubleshooting](#troubleshooting)

---

## Test Environment Setup

### Prerequisites
- Django backend running on `http://localhost:8000`
- React frontend running on `http://localhost:5173`
- Test user account created
- Test owner account created with parking lot
- Postman or similar API testing tool (optional)

### Database State
```bash
# Clear test data and start fresh
python manage.py flush --no-input

# Load fixtures with test users and lots
python manage.py loaddata parking/fixtures/test_data.json

# Or manually create:
# 1. User (role='User') with UserProfile
# 2. Owner (role='Owner') with OwnerProfile and P_Lot
# 3. CarWashService entries with base_price values
```

### CarWashService Test Data
```
Service                Price     Duration   Type
─────────────────────────────────────────────
Exterior Wash          ₹299      20 min     exterior
Interior Wash          ₹199      25 min     interior
Full Service           ₹499      45 min     full
Premium Service        ₹799      60 min     premium
```

---

## Payment Method Flow - Cash

### Cash Payment Workflow
```
User Books Service
    ↓
Service Created (status=pending, payment_status=pending)
    ↓
User Selects Cash Payment Method
    ↓
Booking Created with payment_method='CASH'
    ↓
Owner Receives Pending Payment Notification
    ↓
Owner Verifies Cash Payment (marks payment_status=verified)
    ↓
Booking Status Updates to confirmed
    ↓
Owner Can Start Service (in_progress)
    ↓
Owner Completes Service (completed)
```

### Cash Payment Test Cases

#### Test Case 1: Create Cash Payment Booking
**Objective**: Verify cash booking creation with pending payment status

**Steps**:
1. Login as User
2. Navigate to `/carwash`
3. Select "Exterior Wash" service (₹299)
4. Fill booking details:
   - Scheduled Time: Tomorrow 2:00 PM
   - Location: (select a lot with available slots)
   - Payment Method: **Cash**
   - Special Requests: "Please be careful with headlights"
5. Click "Book Now"

**Expected Results**:
- ✅ Booking created with status="pending"
- ✅ payment_status="pending"
- ✅ payment_method="CASH"
- ✅ Redirect to MyBookings with success toast
- ✅ Booking appears with "Pending Payment" badge

**API Validation**:
```bash
curl -X GET http://localhost:8000/api/carwash-bookings/my-bookings/ \
  -H "Authorization: Token YOUR_USER_TOKEN"

# Expected: booking with payment_status: "pending"
```

---

#### Test Case 2: Owner Verifies Cash Payment
**Objective**: Test payment verification by owner

**Steps**:
1. Login as Owner
2. Navigate to `/owner/carwash`
3. Find the pending cash booking in "Pending Payments" filter
4. Click "Verify Payment" button
5. Owner confirms cash payment received

**Expected Results**:
- ✅ payment_status changes from "pending" → "verified"
- ✅ Booking status remains in confirmed state
- ✅ Toast notification: "Payment verified successfully"
- ✅ Status badge changes to green/checkmark

**API Validation**:
```bash
curl -X PATCH http://localhost:8000/api/carwash-bookings/{id}/ \
  -H "Authorization: Token OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_status": "verified"}'

# Expected: payment_status: "verified", HTTP 200
```

---

#### Test Case 3: Complete Cash Payment Workflow
**Objective**: Verify complete cash workflow from booking to completion

**Steps**:
1. Create cash booking (Test Case 1)
2. Owner verifies payment (Test Case 2)
3. Owner clicks "Start Service" (in_progress)
4. Owner clicks "Complete Service" (completed)

**Expected Results**:
- ✅ Status transitions: pending → confirmed → in_progress → completed
- ✅ payment_status remains "verified" throughout
- ✅ completed_time is set when marked completed
- ✅ Owner dashboard shows in "Completed" tab
- ✅ Revenue is calculated and added to total

**Owner Dashboard Verification**:
- Total Bookings: +1
- Completed Bookings: +1
- Total Revenue: +₹299

---

## Payment Method Flow - Online

### Online Payment Workflow
```
User Books Service
    ↓
Service Created (status=pending, payment_status=pending)
    ↓
User Selects Online Payment (UPI/Razorpay)
    ↓
Razorpay Payment Gateway Opened
    ↓
User Completes Payment (Success/Failed)
    ↓
Razorpay Webhook Callback
    ↓
Payment Status Updated (verified/failed)
    ↓
If Success: Booking confirmed → Ready for service
    ↓
If Failed: Booking remains pending → User can retry
```

### Online Payment Test Cases

#### Test Case 4: Create Online Payment Booking
**Objective**: Verify online booking creation and payment gateway integration

**Steps**:
1. Login as User
2. Navigate to `/carwash`
3. Select "Full Service" (₹499)
4. Fill booking details:
   - Scheduled Time: Tomorrow 3:00 PM
   - Location: Test Parking Lot
   - Payment Method: **Online (UPI)**
   - Special Requests: (leave empty)
5. Click "Book Now"

**Expected Results**:
- ✅ Booking created with status="pending"
- ✅ payment_status="pending"
- ✅ payment_method="ONLINE"
- ✅ Razorpay payment modal appears
- ✅ User can see amount: ₹499

**Frontend Validation**:
- Razorpay widget displays
- Correct amount shown (₹499)
- Payment options available (UPI, Cards, Wallets)

---

#### Test Case 5: Successful Online Payment
**Objective**: Test successful payment flow with webhook integration

**Steps** (using Razorpay Test Mode):
1. Create online booking (Test Case 4)
2. In Razorpay modal, use test UPI: **success@razorpay**
3. Complete payment (use any OTP in test mode)
4. Observe response and redirect

**Expected Results**:
- ✅ Razorpay confirms "Payment Successful"
- ✅ transaction_id captured and stored
- ✅ payment_status automatically updates to "verified"
- ✅ Booking status changes to "confirmed"
- ✅ Redirect to MyBookings
- ✅ Toast: "Payment successful! Your booking is confirmed"
- ✅ Booking shows green "Verified" badge

**Database Validation**:
```bash
# Check Payment record created
curl -X GET http://localhost:8000/api/payments/ \
  -H "Authorization: Token YOUR_USER_TOKEN" \
  | jq '.results[] | select(.service_type=="car_wash")'

# Expected fields:
# - status: "SUCCESS"
# - transaction_id: (Razorpay ID)
# - service_type: "car_wash"
# - carwash_booking_id: (booking ID)
```

---

#### Test Case 6: Failed Online Payment
**Objective**: Test failed payment recovery workflow

**Steps**:
1. Create online booking (Test Case 4)
2. Use test failed UPI: **failed@razorpay**
3. Observe error response

**Expected Results**:
- ✅ Razorpay shows payment failed error
- ✅ Modal closes or shows retry option
- ✅ Booking remains in "pending" status
- ✅ payment_status remains "pending"
- ✅ User can see failed payment in history with "Failed" badge
- ✅ Toast: "Payment failed. Please try again"

**Retry Flow**:
1. In CarWashHistory, click "Retry Payment" on failed booking
2. Select online payment again
3. Complete successful payment (success@razorpay)

**Expected Results**:
- ✅ New Payment record created (different transaction_id)
- ✅ Booking status updates to confirmed
- ✅ Old failed payment visible in history (for audit)

---

#### Test Case 7: Payment Timeout
**Objective**: Test payment timeout and cleanup

**Steps**:
1. Create online booking
2. Open Razorpay modal but don't complete payment
3. Wait 5+ minutes
4. Return to page or refresh

**Expected Results**:
- ✅ Booking remains in pending state
- ✅ User can retry payment
- ✅ No duplicate payments created on refresh

---

## Test Cases

### Validation Rule Tests

#### Test Case 8: Payment Status Validation
**Objective**: Verify payment status transitions are validated

**Test Data**:
- Booking in "completed" status
- Attempt to update payment_status to "pending"

**Expected Result**:
- ✅ HTTP 400 error or validation error
- ✅ Message: "Cannot modify payment status of completed booking"

---

#### Test Case 9: Booking Status Validation
**Objective**: Verify booking status transitions follow rules

**Valid Transitions**:
```
pending      → confirmed (payment verified)
confirmed    → in_progress (service started)
in_progress  → completed (service finished)
Any status   → cancelled
```

**Test**: Try transition `completed` → `pending`

**Expected Result**:
- ✅ HTTP 400 error
- ✅ Message: "Invalid status transition from completed to pending"

---

### Edge Cases

#### Test Case 10: Double Booking Prevention
**Objective**: Verify no double bookings at same time/lot

**Steps**:
1. Create booking for lot at 2:00 PM (duration 45 min)
2. Attempt to create another booking for same lot at:
   - 2:15 PM (overlaps) - SHOULD FAIL
   - 2:46 PM (overlaps) - SHOULD FAIL
   - 2:45 PM (exactly when first ends) - SHOULD SUCCEED
   - 2:50 PM (after first ends) - SHOULD SUCCEED

**Expected Results**:
- ✅ Overlapping bookings rejected with HTTP 409
- ✅ Error message includes available_from time
- ✅ Non-overlapping bookings accepted

---

#### Test Case 11: Minimum Advance Booking
**Objective**: Verify 30-minute advance booking requirement

**Steps**:
1. Attempt booking for time less than 30 min in future
2. Current time: 2:00 PM
3. Attempt booking for: 2:15 PM

**Expected Results**:
- ✅ HTTP 400 error
- ✅ Message: "Bookings must be made at least 30 minutes in advance"

---

#### Test Case 12: Past Time Prevention
**Objective**: Verify bookings cannot be made for past times

**Steps**:
1. Attempt booking for yesterday
2. Attempt booking for 1 hour ago

**Expected Results**:
- ✅ HTTP 400 error for both
- ✅ Message: "Scheduled time must be in the future"

---

## Validation Rules

### Booking Creation Rules
```
✅ Scheduled time required
✅ Scheduled time must be in future
✅ Minimum 30 minutes advance booking
✅ No overlapping bookings at same lot
✅ Service type must match available services
✅ User must exist and be active
✅ Lot (if specified) must be valid
```

### Status Transition Rules
```
pending     → confirmed, cancelled
confirmed   → in_progress, cancelled
in_progress → completed, cancelled
completed   → (no transitions)
cancelled   → (no transitions)
```

### Payment Rules
```
✅ Payment required before in_progress
✅ payment_status must be 'verified' before completion
✅ transaction_id required for online payments
✅ Cannot change payment_status after completion
```

---

## API Endpoints for Payment Testing

### Create Car Wash Booking
```bash
POST /api/carwash-bookings/
Headers: Authorization: Token USER_TOKEN
Body: {
  "service_type": "full",
  "payment_method": "CASH",
  "scheduled_time": "2024-12-20T14:00:00Z",
  "lot": 1,
  "notes": "Please be gentle"
}
```

### Get User's Bookings
```bash
GET /api/carwash-bookings/my-bookings/
Headers: Authorization: Token USER_TOKEN
```

### Get Pending Payments
```bash
GET /api/carwash-bookings/pending-payments/
Headers: Authorization: Token USER_TOKEN
```

### Update Booking Status
```bash
PATCH /api/carwash-bookings/{id}/
Headers: Authorization: Token OWNER_TOKEN
Body: {
  "status": "confirmed"
}
```

### Get Owner Bookings
```bash
GET /api/owner/carwash-bookings/
Headers: Authorization: Token OWNER_TOKEN
```

### Get Owner Dashboard Stats
```bash
GET /api/owner/carwash-bookings/dashboard/
Headers: Authorization: Token OWNER_TOKEN
```

---

## Troubleshooting

### Issue: Payment Modal Not Appearing
**Causes**:
- Razorpay script not loaded
- Payment method not selected
- Network error

**Solution**:
1. Check browser console for errors
2. Verify Razorpay API key in frontend config
3. Check network tab for script loading

---

### Issue: Transaction ID Not Saved
**Causes**:
- Webhook not configured
- Transaction ID not extracted from response
- Database connection issue

**Solution**:
1. Verify Razorpay webhook in dashboard
2. Check API logs for transaction_id field
3. Test database write with manual API call

---

### Issue: Booking Not Confirmed After Payment
**Causes**:
- Webhook not received
- Payment status not updated
- Manual verification needed

**Solution**:
1. Check Payment table for FAILED status
2. Owner should manually verify payment
3. Check server logs for webhook errors

---

### Issue: Owner Cannot See Booking
**Causes**:
- Booking not linked to owner's lot
- Permission issue
- Lot ownership not set

**Solution**:
1. Verify booking.lot is set to owner's lot
2. Check owner profile exists
3. Verify owner role is set correctly

---

## Success Criteria - Phase 4.4 Complete

✅ Cash bookings can be created and verified  
✅ Online bookings integrate with Razorpay  
✅ Successful payments mark booking confirmed  
✅ Failed payments show retry option  
✅ Status transitions validated correctly  
✅ Double booking prevented  
✅ Advance booking requirement enforced  
✅ Revenue calculated for completed+verified bookings  
✅ Owner can manage all bookings  
✅ User can view booking history  

---

## Sign-Off

**Testing Completed By**: _______________  
**Date**: _______________  
**Status**: ✅ PASS / ❌ FAIL  
**Issues Found**: _______________  
**Ready for Phase 4.5**: Yes / No  

