# Car Wash 409 Conflict - Quick Fix Guide

## The Issue
```
❌ POST /api/carwash-bookings/ → 409 Conflict
   "Time slot not available. Conflict with booking 17"
```

## What Caused It
- Test bookings left in database with overlapping times
- Bug: Conflict detection used hardcoded 30-min duration for ALL services

## What Was Fixed

### 1. Backend Bug (views.py)
```python
# ❌ OLD: Always assumed 30 minutes
booking_end = booking.scheduled_time + timedelta(minutes=30)

# ✅ NEW: Get actual service duration
booking_service = CarWashService.objects.get(service_name=booking.service_type)
booking_duration = booking_service.estimated_duration
booking_end = booking.scheduled_time + timedelta(minutes=booking_duration)
```

### 2. Frontend Error Handling (CarWash.jsx)
```javascript
// ❌ OLD: Generic error message
toast.error(error.message || 'Failed to create car wash booking')

// ✅ NEW: Detailed error with available time
if (status === 409) {
  errorMessage = data.error + ` Available from: ${data.available_from}`
}
```

### 3. Database Cleanup
```bash
python cleanup_test_bookings.py  # Removed 8+ old test bookings
```

## How to Reproduce (For Testing)

```bash
# Clean database
python cleanup_test_bookings.py

# Run conflict detection test
python test_conflict_detection.py
# Expected: 3/3 tests PASS ✅
```

## Service Durations

| Service | Duration |
|---------|----------|
| Exterior | 20 min |
| Interior Deep Clean | 30 min |
| Full Service | 50 min |

## Conflict Detection Logic

Two bookings conflict if:
```
booking1_start < booking2_end  AND  booking1_end > booking2_start
```

Example:
```
Booking 1: 10:00-10:20 (20 min Exterior)
Booking 2: 10:15-10:45 (30 min Interior) ← OVERLAPS → 409 Error ❌

Booking 1: 10:00-10:20 (20 min Exterior)
Booking 2: 10:20-11:10 (50 min Full Service) ← NO OVERLAP → Success ✅
```

## User Experience

### If 409 Error Appears
1. Read the error message
2. Note the "Available from" time
3. Select a new booking time after that
4. Try again

**Example error:**
```
"Time slot not available. Conflict with booking 17. 
Available from: 2025-12-02T22:45:59"
```

## Prevention Checklist

- [ ] Clean test bookings after test suite: `python cleanup_test_bookings.py`
- [ ] Verify no overlapping bookings in database
- [ ] Test conflict detection: `python test_conflict_detection.py`
- [ ] Check CarWashService table has all duration values
- [ ] Review booking times in response (available_from field)

## Files to Check

| File | Change |
|------|--------|
| `parking/views.py` | Lines 1733-1755 - Conflict detection |
| `CarWash.jsx` | Lines 154-185 - Error handling |
| `cleanup_test_bookings.py` | Utility to clean test data |
| `test_conflict_detection.py` | Comprehensive test suite |

## Status

✅ Working correctly  
✅ Well tested (3/3 tests passing)  
✅ Frontend error handling improved  
✅ Documentation complete

---

**Last Updated:** Dec 2, 2025  
**All Tests:** PASSING ✅
