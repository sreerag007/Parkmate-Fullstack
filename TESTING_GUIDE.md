# Testing Guide: Backend-Driven Booking Timer

## Environment Setup

### Prerequisites
1. Django backend running: `python manage.py runserver`
2. React frontend running: `npm run dev`
3. Database with migrations applied: `python manage.py migrate`
4. Test user account and owner account created

## Test Cases

### Test 1: Basic Booking Flow
**Objective**: Verify booking creation and confirmation page display

**Steps**:
1. Login as User
2. Navigate to `/lots`
3. Select a parking lot
4. Click on available slot
5. Confirm booking

**Expected Results**:
- ✅ Redirects to `/booking-confirmation?booking={bookingId}`
- ✅ Shows "✅ Booking Confirmed" message
- ✅ Displays lot name, slot number, vehicle, price
- ✅ Shows countdown timer starting from 1 hour (3600 seconds)

**Verification**:
```javascript
// In browser console on BookingConfirmation page
console.log('Booking data:', booking);
console.log('Time left:', timeLeft);
console.log('Formatted time:', formatTime(timeLeft));
```

---

### Test 2: Timer Countdown
**Objective**: Verify countdown timer updates every second

**Steps**:
1. Complete Test 1
2. Observe timer on confirmation page
3. Wait 10+ seconds
4. Verify timer decrements

**Expected Results**:
- ✅ Timer starts at 1:00:00
- ✅ Decrements by 1 second each second
- ✅ Stays synchronized with backend end_time
- ✅ "Expiring Soon" warning appears at < 5:00

**Verification**:
```javascript
// In browser console
const startTime = new Date(booking.end_time).getTime();
const now = new Date().getTime();
const expectedRemaining = (startTime - now) / 1000;
console.log('Expected seconds remaining:', expectedRemaining);
console.log('Timer display:', formatTime(timeLeft));
```

---

### Test 3: Expiring Soon Alert
**Objective**: Verify warning displays when < 5 minutes remain

**Steps**:
1. Complete Test 1
2. Manually update booking end_time in database to 4 minutes from now:
   ```python
   # In Django shell
   from parking.models import Booking
   from django.utils import timezone
   from datetime import timedelta
   booking = Booking.objects.latest('booking_id')
   booking.end_time = timezone.now() + timedelta(minutes=4)
   booking.save()
   ```
3. Refresh BookingConfirmation page
4. Verify warning appears

**Expected Results**:
- ✅ Timer section background turns orange/red
- ✅ "⚠️ Booking expiring soon!" message displays
- ✅ Pulse animation plays on timer section

---

### Test 4: Login Persistence
**Objective**: Verify timer persists across logout/login

**Steps**:
1. Complete Test 1
2. Note the remaining time
3. Open dev tools and copy the booking ID from URL
4. Logout
5. Login with same user account
6. Navigate to `/booking-confirmation?booking={bookingId}`
7. Verify timer shows correct remaining time

**Expected Results**:
- ✅ Booking loads with correct remaining time
- ✅ Timer is lower than when you logged out (time has passed)
- ✅ Status is still "booked"
- ✅ No data loss on logout/login

**Important**: The remaining_time should reflect real time passed on backend, not cached from before logout.

---

### Test 5: Auto-Completion
**Objective**: Verify booking auto-completes after 1 hour

**Quick Test** (without waiting 1 hour):
1. Complete Test 1
2. Use Django shell to manually expire the booking:
   ```python
   from parking.models import Booking
   from django.utils import timezone
   from datetime import timedelta
   booking = Booking.objects.latest('booking_id')
   booking.end_time = timezone.now() - timedelta(seconds=1)  # Expired 1 second ago
   booking.save()
   ```
3. Refresh BookingConfirmation page
4. Verify page shows "Booking Expired" state

**Expected Results**:
- ✅ Page transitions to "⏰ Booking Expired" state
- ✅ Status badge shows "COMPLETED"
- ✅ "Renew Booking" button appears
- ✅ "Add Car Wash" button disappears

---

### Test 6: Backend Auto-Completion via API
**Objective**: Verify backend auto-completes on API calls

**Steps**:
1. Create booking (Test 1)
2. Use curl/Postman to manually expire:
   ```python
   # In Django shell
   from parking.models import Booking
   from django.utils import timezone
   from datetime import timedelta
   booking = Booking.objects.latest('booking_id')
   booking.end_time = timezone.now() - timedelta(seconds=1)
   booking.save()
   ```
3. Call API: `GET /api/bookings/{bookingId}/` (with auth header)
4. Check response status

**Expected Results**:
- ✅ API response shows `"status": "completed"`
- ✅ API auto-updated the database
- ✅ No additional processing needed on frontend

**API Call**:
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/bookings/123/
```

---

### Test 7: Polling for Backend Changes
**Objective**: Verify frontend polls backend every 10 seconds

**Steps**:
1. Complete Test 1 (booking in BOOKED state)
2. Open browser developer tools (F12)
3. Go to Network tab
4. Filter by "XHR" (XMLHttpRequest)
5. Wait 10 seconds
6. Verify API calls to `/api/bookings/123/`
7. In Django shell, manually expire the booking
8. Wait for next poll (max 10 seconds)
9. Verify page updates to "Booking Expired"

**Expected Results**:
- ✅ Network tab shows `GET /api/bookings/{id}/` every ~10 seconds
- ✅ After manual expiration, page updates within 10 seconds
- ✅ No page refresh needed by user

---

### Test 8: Renew Booking
**Objective**: Verify renewal creates new booking

**Steps**:
1. Complete Test 5 (booking expired)
2. Click "🔄 Renew Booking" button
3. Verify page redirects to new booking confirmation
4. Check database for new booking record

**Expected Results**:
- ✅ New booking created in database
- ✅ Old booking still marked as "completed"
- ✅ Slot still marked as unavailable (by new booking)
- ✅ New booking ID is different from old
- ✅ New start_time = approximately now
- ✅ New end_time = start_time + 1 hour
- ✅ Redirects to `/booking-confirmation?booking={newBookingId}`

**API Call**:
```bash
curl -X POST -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/bookings/123/renew/
```

---

### Test 9: Slot Availability
**Objective**: Verify slot status changes with booking lifecycle

**Steps**:
1. Check slot availability before booking: `GET /api/slots/`
2. Create booking (Test 1)
3. Verify slot becomes unavailable
4. Expire booking (Test 5)
5. Check slot status
6. Renew booking (Test 8)
7. Verify slot becomes unavailable again

**Expected Results**:
- ✅ Before booking: `is_available: true`
- ✅ During booking: `is_available: false`
- ✅ After completion: `is_available: true`
- ✅ After renewal: `is_available: false`

**API Call**:
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/slots/
```

---

### Test 10: Owner Dashboard Real-Time Updates
**Objective**: Verify owner sees updated booking status

**Steps**:
1. Create booking as User (Test 1)
2. Login as Owner of that lot
3. Navigate to Owner → Manage Bookings
4. Verify booking shows in list with correct status
5. Use Django shell to expire the booking
6. Wait for auto-refresh (max 10 seconds)
7. Verify status updates to "COMPLETED"

**Expected Results**:
- ✅ Booking appears in owner's booking list
- ✅ Status shows "BOOKED" initially
- ✅ After expiration, status updates to "COMPLETED" within 10 seconds
- ✅ No manual refresh required
- ✅ "Cancel" button disappears for completed booking
- ✅ Color-coded badge shows green for completed

---

### Test 11: Cancel Booking
**Objective**: Verify manual cancellation works

**Steps**:
1. Create booking (Test 1)
2. Click "Cancel" button (should be on booking details or via API)
3. Verify slot becomes available
4. Check booking status in database

**Expected Results**:
- ✅ Booking status changes to "cancelled"
- ✅ Slot marked as `is_available: true`
- ✅ Cancellation endpoint returns updated booking
- ✅ Slot can be re-booked by another user

---

### Test 12: Multiple Concurrent Bookings
**Objective**: Verify system handles multiple active bookings

**Steps**:
1. Create 2 user accounts
2. Have each user book different slots in same lot
3. Verify both show on confirmation pages
4. Verify both timers count down independently
5. Expire one booking
6. Verify only that one shows as expired
7. Other booking still shows as active

**Expected Results**:
- ✅ Both bookings created successfully
- ✅ Both have independent timers
- ✅ Expiration of one doesn't affect others
- ✅ Owner sees both in dashboard
- ✅ Status updates independent for each

---

### Test 13: Edge Case - Browser Close and Reopen
**Objective**: Verify booking persists if browser closed

**Steps**:
1. Create booking (Test 1)
2. Note remaining time
3. Close browser completely
4. Wait 2-3 minutes
5. Open browser and navigate to `/booking-confirmation?booking={bookingId}`
6. Verify timer shows correct remaining time (less than when you closed)

**Expected Results**:
- ✅ Booking loads from database
- ✅ Timer reflects actual elapsed time
- ✅ No data loss
- ✅ Session auth still works

---

### Test 14: Invalid Renewal Scenarios
**Objective**: Verify proper error handling

**Scenarios**:
1. Try to renew a BOOKED booking (should fail)
2. Try to renew with unauthorized user
3. Try to renew when slot is unavailable

**Expected Results**:
- ✅ Error message: "Can only renew completed or expired bookings"
- ✅ Error message: "You can only renew your own bookings"
- ✅ Error message: "Slot is not available for renewal"

---

## Database Inspection Commands

### Check Booking Details
```python
# In Django shell
from parking.models import Booking
from django.utils import timezone

booking = Booking.objects.latest('booking_id')
print(f"Booking ID: {booking.booking_id}")
print(f"Status: {booking.status}")
print(f"Start: {booking.start_time}")
print(f"End: {booking.end_time}")
print(f"Now: {timezone.now()}")
print(f"Expired: {booking.is_expired()}")
print(f"User: {booking.user.firstname}")
print(f"Lot: {booking.lot.lot_name}")
print(f"Slot: {booking.slot.slot_id}")
```

### Check Slot Availability
```python
from parking.models import P_Slot

slot = P_Slot.objects.get(slot_id=5)
print(f"Slot {slot.slot_id}")
print(f"Available: {slot.is_available}")
print(f"Vehicle Type: {slot.vehicle_type}")
print(f"Price: {slot.price}")
```

### Manually Expire a Booking
```python
from parking.models import Booking
from django.utils import timezone
from datetime import timedelta

booking = Booking.objects.get(booking_id=123)  # Replace with actual ID
booking.end_time = timezone.now() - timedelta(seconds=1)
booking.save()
print(f"✅ Booking {booking.booking_id} set to expire")
```

---

## Performance Checks

### 1. API Response Time
- ✅ List bookings: < 500ms
- ✅ Get single booking: < 200ms
- ✅ Create booking: < 500ms
- ✅ Renew booking: < 500ms

### 2. Frontend Performance
- ✅ BookingConfirmation page loads in < 2 seconds
- ✅ Timer updates smooth with no lag
- ✅ Poll requests don't block UI
- ✅ Memory usage stable after 10+ minutes

### 3. Database
- ✅ No slow queries
- ✅ Auto-completion queries efficient
- ✅ No N+1 problems

---

## Debugging Tips

### If Timer Not Updating
1. Check browser console for errors
2. Verify `timerIntervalRef` is set: `console.log(timerIntervalRef.current)`
3. Check if `booking.status` is "booked"
4. Verify `end_time` is in the future

### If Polling Not Working
1. Open Network tab in DevTools
2. Filter by XHR
3. Look for `GET /api/bookings/{id}/` every 10 seconds
4. Check response status codes
5. Verify auth token is valid

### If Auto-Completion Not Working
1. Check Django logs for errors
2. Verify `end_time` is in the past
3. Check that status is "booked" before expiration
4. Manually call API to check if auto-completion happens

### Common Errors

**Error: "Cannot renew booked booking"**
- Solution: Use expired or completed booking only

**Error: "Unauthorized"**
- Solution: Ensure user is logged in and token is valid

**Error: "Slot not available"**
- Solution: Slot is already booked by someone else, choose different slot

**Timer Shows Negative Time**
- Solution: Refresh page, backend should auto-complete

---

## Browser DevTools Recipes

### Monitor All Booking API Calls
```javascript
// In browser console
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/bookings/')) {
    console.log('📡 API Call:', args[0]);
  }
  return originalFetch(...args);
};
```

### Check Current Booking State
```javascript
// In browser console on BookingConfirmation page
console.log({
  bookingId,
  status: booking?.status,
  endTime: booking?.end_time,
  remaining: timeLeft,
  isExpired,
  formatted: formatTime(timeLeft)
});
```

### Simulate Immediate Expiration
```python
# In Django shell
from parking.models import Booking
from django.utils import timezone
booking = Booking.objects.latest('booking_id')
booking.end_time = timezone.now()  # Expire right now
booking.save()
```

---

## Success Indicators

✅ **All tests pass** if:
1. Bookings persist across logout/login
2. Timers count down correctly
3. Auto-completion happens automatically
4. Renewal creates new bookings
5. Slots become available/unavailable correctly
6. Owner dashboards show real-time updates
7. No manual refresh needed
8. API responses include timing data
9. Frontend and backend always in sync
10. Error handling is graceful
