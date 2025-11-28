# Advance Booking Feature - Testing & Deployment Checklist

## Pre-Deployment Verification

### Backend Code Review
- [x] **models.py**
  - [x] Booking model has new STATUS_CHOICES
  - [x] STATUS_CHOICES includes all legacy values (booked, completed, cancelled)
  - [x] STATUS_CHOICES includes new values (SCHEDULED, ACTIVE, COMPLETED, CANCELLED)
  - [x] save() method auto-sets start_time and end_time
  - [x] save() method auto-converts status based on booking_type
  - [x] is_expired() method supports both 'booked' and 'active' status
  - [x] No syntax errors

- [x] **views.py**
  - [x] perform_create() implements INSTANT vs ADVANCE logic
  - [x] perform_create() validates future start_time for ADVANCE
  - [x] perform_create() checks overlapping bookings
  - [x] perform_create() handles ISO date parsing with fallback
  - [x] perform_create() creates booking with correct status
  - [x] perform_create() marks slot unavailable for INSTANT
  - [x] list() auto-transitions SCHEDULED → ACTIVE
  - [x] list() auto-transitions ACTIVE → COMPLETED
  - [x] list() frees slots on completion
  - [x] retrieve() performs same auto-transitions
  - [x] renew() supports new status names
  - [x] renew() only allows renewal of COMPLETED/CANCELLED
  - [x] _auto_complete_expired() handles both 'booked' and 'ACTIVE'
  - [x] P_SlotViewSet.list() handles new status names
  - [x] No syntax errors

- [x] **serializers.py**
  - [x] BookingSerializer includes all necessary fields
  - [x] get_remaining_time() supports new status names
  - [x] No syntax errors

### Frontend Code Review
- [x] **DynamicLot.jsx**
  - [x] Uses Date.now() for accurate time calculations
  - [x] Supports SCHEDULED status display
  - [x] Shows "Starts at HH:MM" for SCHEDULED bookings
  - [x] Shows remaining time for ACTIVE bookings
  - [x] Handles COMPLETED and CANCELLED status
  - [x] Disables SCHEDULED and ACTIVE slots
  - [x] Allows selecting only AVAILABLE slots
  - [x] Passes booking_type to API
  - [x] Passes start_time to API for advance bookings

- [x] **Lot1.scss**
  - [x] .slot.booked styling (GREEN)
  - [x] .slot.available styling (WHITE)
  - [x] .slot.scheduled styling (BLUE) - NEW
  - [x] .slot.completed styling (GRAY) - NEW
  - [x] .slot.cancelled styling (RED) - NEW
  - [x] 0.4s ease transitions on all status changes
  - [x] Disabled cursor for booked/scheduled slots

---

## Database Testing

### Existing Data Compatibility
- [ ] Verify existing bookings with status='booked' still work
- [ ] Verify existing bookings with status='completed' still work
- [ ] Verify existing bookings with status='cancelled' still work
- [ ] Check for any bookings with missing end_time (should auto-fix)
- [ ] Verify slot associations are correct

### Status Migration Verification
- [ ] Run: `python manage.py shell`
  ```python
  from parking.models import Booking
  # Check status distribution
  statuses = Booking.objects.values('status').distinct()
  for s in statuses:
      count = Booking.objects.filter(status=s['status']).count()
      print(f"{s['status']}: {count}")
  ```
- [ ] Verify no unexpected status values
- [ ] Check booking times are properly set

---

## API Testing

### Instant Booking Tests
- [ ] **POST /api/bookings/** with booking_type='Instant'
  - [ ] Creates booking with status='ACTIVE'
  - [ ] Sets start_time to current time
  - [ ] Sets end_time to start_time + 1 hour
  - [ ] Marks slot as unavailable
  - [ ] Returns HTTP 201 Created
  - [ ] Response includes booking_id, status, start_time, end_time

- [ ] Test immediate slot visibility
  - [ ] Slot appears as unavailable in GET /api/slots/
  - [ ] Slot shows booking details (remaining time)
  - [ ] Other users cannot book the same slot

### Advance Booking Tests
- [ ] **POST /api/bookings/** with booking_type='Advance'
  - [ ] Requires start_time parameter
  - [ ] Validates start_time is in future
  - [ ] Creates booking with status='SCHEDULED'
  - [ ] Sets end_time to start_time + 1 hour
  - [ ] Does NOT mark slot as unavailable initially
  - [ ] Returns HTTP 201 Created

- [ ] Test date parsing
  - [ ] `"2024-01-15T14:30:00Z"` - ISO with Z
  - [ ] `"2024-01-15T14:30:00+00:00"` - ISO with offset
  - [ ] `"2024-01-15T14:30:00"` - ISO without timezone
  - [ ] Invalid format returns 400 Bad Request

- [ ] Test future time validation
  - [ ] Past time returns 400 error
  - [ ] Current time returns 400 error
  - [ ] Future time creates booking successfully

- [ ] Test slot visibility
  - [ ] Slot appears as SCHEDULED in GET /api/slots/
  - [ ] Slot shows "Starts at HH:MM" label
  - [ ] Other users can still book different times
  - [ ] Overlapping times are rejected

### Overlap Detection Tests
- [ ] **Create INSTANT booking, then try overlapping INSTANT**
  - [ ] Second booking rejected with 400 Bad Request
  - [ ] Error message: "This slot is currently booked"

- [ ] **Create ADVANCE booking for 14:00-15:00, try overlapping bookings**
  - [ ] Booking for 13:30-14:30: ❌ Rejected (overlaps)
  - [ ] Booking for 14:30-15:30: ❌ Rejected (overlaps at 14:30)
  - [ ] Booking for 13:00-14:00: ✅ Allowed (ends exactly when new starts)
  - [ ] Booking for 15:00-16:00: ✅ Allowed (starts exactly when new ends)

- [ ] **Test overlap with multiple bookings**
  - [ ] Slot 1: INSTANT 10:00-11:00
  - [ ] Slot 1: ADVANCE 13:00-14:00
  - [ ] Try ADVANCE 12:30-13:30: ❌ Rejected

### Auto-Transition Tests
- [ ] **GET /api/bookings/ before start_time**
  - [ ] SCHEDULED bookings remain SCHEDULED
  - [ ] No slot changes

- [ ] **GET /api/bookings/ at/after start_time**
  - [ ] SCHEDULED bookings transition to ACTIVE
  - [ ] Associated slots marked unavailable
  - [ ] Status change persisted to database

- [ ] **GET /api/bookings/ after end_time**
  - [ ] ACTIVE bookings transition to COMPLETED
  - [ ] Associated slots marked available
  - [ ] Remaining_time returns 0
  - [ ] Carwash services auto-deleted

### List Bookings Tests
- [ ] **GET /api/bookings/** returns all bookings
  - [ ] Respects user role (User sees own, Owner sees lot's, Admin sees all)
  - [ ] Includes all new fields (booking_type, status, start_time, end_time)
  - [ ] Auto-transitions are applied before returning
  - [ ] Remaining_time calculated correctly

### Retrieve Booking Tests
- [ ] **GET /api/bookings/{id}/** returns single booking
  - [ ] Auto-transitions applied
  - [ ] Status reflects current state
  - [ ] Remaining_time accurate

### Renewal Tests
- [ ] **POST /api/bookings/{id}/renew/** for COMPLETED booking
  - [ ] Creates new ACTIVE booking
  - [ ] New booking has start_time=now()
  - [ ] Returns 201 Created with new booking data

- [ ] **POST /api/bookings/{id}/renew/** for SCHEDULED booking
  - [ ] Returns 400 error
  - [ ] Message: "Can only renew completed, cancelled, or expired bookings"

- [ ] **POST /api/bookings/{id}/renew/** for ACTIVE booking
  - [ ] Returns 400 error
  - [ ] Message: "Can only renew completed, cancelled, or expired bookings"

- [ ] **POST /api/bookings/{id}/renew/** with unavailable slot
  - [ ] Returns 400 error
  - [ ] Message: "Slot is not available for renewal"

### Cancel Tests
- [ ] **POST /api/bookings/{id}/cancel/** for ACTIVE booking
  - [ ] Status changes to CANCELLED
  - [ ] Slot marked available
  - [ ] Response includes success message

- [ ] **POST /api/bookings/{id}/cancel/** for SCHEDULED booking
  - [ ] Status changes to CANCELLED
  - [ ] Slot remains available

---

## Frontend Testing

### Slot Display Tests
- [ ] **Available Slots (WHITE)**
  - [ ] Display "Available - ₹X/hr"
  - [ ] Clickable and selectable
  - [ ] No disabled attribute

- [ ] **Booked Slots (GREEN)**
  - [ ] Display "Booked — HH:MM:SS" with countdown
  - [ ] Countdown updates every 5 seconds
  - [ ] Disabled (cannot click)
  - [ ] Timer counts down smoothly

- [ ] **Scheduled Slots (BLUE)** - NEW
  - [ ] Display "Starts at HH:MM"
  - [ ] Show correct time (extracted from start_time)
  - [ ] Disabled (cannot click)
  - [ ] Don't count down until activated

- [ ] **Completed Slots (GRAY)**
  - [ ] Display as available
  - [ ] Can be booked
  - [ ] Transition from green to gray on expiry

- [ ] **Cancelled Slots (RED)**
  - [ ] Display as available
  - [ ] Can be booked

### Status Transition Tests
- [ ] **Watch SCHEDULED → ACTIVE transition**
  - [ ] Slot color changes from blue to green at start_time
  - [ ] Label changes from "Starts at" to "Booked —"
  - [ ] Countdown timer begins
  - [ ] Transition smooth (0.4s ease)

- [ ] **Watch ACTIVE → COMPLETED transition**
  - [ ] Slot color changes from green to white at end_time
  - [ ] Label changes to "Available"
  - [ ] Slot becomes clickable
  - [ ] Transition smooth (0.4s ease)

- [ ] **Manual refresh (F5) updates statuses**
  - [ ] All slots reflect current backend state
  - [ ] No stale data displayed

### Booking Flow Tests
- [ ] **Create Instant Booking**
  - [ ] Select available white slot
  - [ ] Booking type dropdown shows "Instant"
  - [ ] Click "Book Selected Slot"
  - [ ] Confirmation modal appears with details
  - [ ] Confirm booking
  - [ ] Slot immediately turns green
  - [ ] Remaining time countdown displays

- [ ] **Create Advance Booking** - NEW
  - [ ] Select available white slot
  - [ ] Change booking type to "Advance"
  - [ ] NEW: Date/time picker appears (future enhancement)
  - [ ] Select future date and time
  - [ ] Click "Book Selected Slot"
  - [ ] Confirmation modal shows start_time
  - [ ] Confirm booking
  - [ ] Slot turns blue
  - [ ] Shows "Starts at HH:MM" label

- [ ] **Renew Expired Booking**
  - [ ] Find expired booking (white slot)
  - [ ] Click slot
  - [ ] Click "Renew Booking"
  - [ ] Confirmation modal appears
  - [ ] Confirm renewal
  - [ ] New booking created
  - [ ] Slot turns green with fresh countdown

### Error Handling Tests
- [ ] **Try to book unavailable slot**
  - [ ] Slot disabled (cannot click)
  - [ ] No booking created

- [ ] **Try to create advance booking with past date**
  - [ ] API returns error
  - [ ] Error message displayed to user
  - [ ] Booking not created

- [ ] **Try to book during overlapping time**
  - [ ] API returns error
  - [ ] User informed why booking failed
  - [ ] Can select different slot/time

### Polling & Real-Time Tests
- [ ] **Slots refresh every 5 seconds**
  - [ ] Open two browser tabs/windows
  - [ ] Book slot in tab 1
  - [ ] Tab 2 automatically shows updated status within 5 seconds
  - [ ] No need to manually refresh

- [ ] **Timer accuracy**
  - [ ] Countdown matches server time
  - [ ] Differences less than 1 second
  - [ ] No "jumping" of timer values

---

## Cross-Browser Testing

### Browsers to Test
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Mobile Testing
- [ ] Slots grid responsive on small screens
- [ ] Touch events work (click/select)
- [ ] Modal dialogs display correctly
- [ ] Date picker accessible (if implemented)
- [ ] Countdown timer readable

---

## Performance Testing

### Load Testing
- [ ] Load page with 100+ slots
  - [ ] Page loads in < 2 seconds
  - [ ] No lag in UI interactions
  - [ ] Memory usage reasonable

- [ ] 50 concurrent users booking
  - [ ] No race conditions
  - [ ] No double-bookings
  - [ ] All requests complete successfully

### API Performance
- [ ] GET /api/slots/ with 100+ slots
  - [ ] Response time < 500ms
  - [ ] Includes all booking data

- [ ] POST /api/bookings/ overlap check
  - [ ] Completes in < 100ms
  - [ ] Database query efficient

- [ ] GET /api/bookings/ with auto-transitions
  - [ ] Auto-transition logic completes < 1000ms
  - [ ] Handles 1000+ bookings

---

## Security Testing

### Authorization Tests
- [ ] **User cannot see other users' bookings**
  - [ ] GET /api/bookings/ only returns own bookings
  - [ ] Cannot GET other user's booking by ID

- [ ] **User cannot renew other users' bookings**
  - [ ] POST /api/bookings/{other_id}/renew/ returns 403

- [ ] **Owner can see lot's bookings, not all bookings**
  - [ ] GET /api/bookings/ returns only own lot's bookings
  - [ ] Cannot see other owner's bookings

- [ ] **Admin can see all bookings**
  - [ ] GET /api/bookings/ returns all bookings
  - [ ] Can manage any booking

### Input Validation
- [ ] **Negative slot ID rejected**
  - [ ] Returns 400 Bad Request

- [ ] **Non-existent slot ID rejected**
  - [ ] Returns 404 Not Found

- [ ] **Invalid vehicle number rejected**
  - [ ] Returns 400 Bad Request
  - [ ] Correct format required

- [ ] **SQL injection attempts blocked**
  - [ ] ORM parameterized queries prevent injection

- [ ] **XSS attempts in booking data blocked**
  - [ ] No script execution
  - [ ] Data properly escaped

---

## Backward Compatibility Testing

### Legacy Booking Handling
- [ ] **Existing 'booked' status bookings**
  - [ ] Treated as ACTIVE
  - [ ] Auto-transition to COMPLETED on expiry
  - [ ] Can be renewed

- [ ] **Existing 'completed' status bookings**
  - [ ] Can still be renewed
  - [ ] Listed correctly

- [ ] **Existing 'cancelled' status bookings**
  - [ ] Slots freed correctly
  - [ ] Can be renewed

- [ ] **Bookings with missing end_time**
  - [ ] Auto-fixed to start_time + 1 hour
  - [ ] Is_expired() works correctly
  - [ ] Can be renewed

### API Backward Compatibility
- [ ] **Old client code still works**
  - [ ] POST /api/bookings/ without start_time (instant)
  - [ ] GET /api/bookings/ returns expected fields
  - [ ] Status values include legacy values

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No syntax errors
- [ ] Code review approved
- [ ] Database backups created
- [ ] Rollback plan prepared

### Deployment Steps
1. [ ] Deploy backend code
2. [ ] Verify API endpoints work
3. [ ] Check database migrations (should be none needed)
4. [ ] Test a few API calls manually
5. [ ] Deploy frontend code
6. [ ] Verify frontend loads correctly
7. [ ] Test complete booking flow
8. [ ] Monitor logs for errors

### Post-Deployment
- [ ] Monitor application logs
- [ ] Check database for any issues
- [ ] Verify slot displays correctly
- [ ] Test booking creation
- [ ] Check auto-transitions working
- [ ] Monitor error rates (should be ~0)
- [ ] Verify no performance degradation

### Rollback Plan
If critical issues found:
1. [ ] Revert to previous frontend code
2. [ ] Revert to previous backend code
3. [ ] Clear browser caches (users)
4. [ ] Monitor for data corruption
5. [ ] Verify database integrity
6. [ ] Notify affected users

---

## Known Limitations

- [ ] Booking duration fixed at 1 hour (no flexibility)
- [ ] No advance booking time limit (can book far future)
- [ ] No bulk cancellation for owners
- [ ] No booking modifications (only cancel/rebook)
- [ ] No waitlist for fully booked times
- [ ] No price variations by time/type

---

## Future Enhancements to Schedule

1. [ ] **Date Picker UI** - Visual calendar for selecting advance booking times
2. [ ] **Duration Options** - Allow 30min, 2hr, half-day bookings
3. [ ] **Advance Limit** - Maximum days ahead for advance booking
4. [ ] **Recurring Bookings** - Auto-renew at scheduled times
5. [ ] **Pricing Variations** - Different prices for advance vs instant
6. [ ] **Booking History** - Archive past bookings
7. [ ] **Invoice Generation** - PDF receipts for bookings
8. [ ] **Payment Integration** - Handle payments through booking flow

---

## Sign-Off

- [ ] QA Manager: _________________ Date: _______
- [ ] Backend Lead: _________________ Date: _______
- [ ] Frontend Lead: _________________ Date: _______
- [ ] Product Manager: _________________ Date: _______
- [ ] DevOps/Deployment: _________________ Date: _______

---

**Document Version:** 1.0
**Last Updated:** 2024
**Status:** Ready for Testing
