# Owner Bookings Auto-Expiration Implementation Guide

## Overview
This document outlines the implementation of automatic booking expiration and cleaner booking management interface for the Owner → Manage Bookings functionality.

## Changes Made

### 1. Backend - Django Models (`parking/models.py`)

**Added DateTime Imports:**
```python
from datetime import datetime, timedelta
```

**Updated Booking Model:**
- Added `start_time` field (DateTimeField) - auto-set when booking is created
- Added `end_time` field (DateTimeField) - automatically set to 1 hour after start_time
- Added `save()` method to auto-calculate end_time
- Added `is_expired()` method to check if booking has exceeded end_time

```python
def save(self, *args, **kwargs):
    # Set end_time to 1 hour after start_time if not already set
    if not self.end_time and self.start_time:
        self.end_time = self.start_time + timedelta(hours=1)
    super().save(*args, **kwargs)

def is_expired(self):
    """Check if booking time has expired"""
    if self.end_time:
        from django.utils import timezone
        return timezone.now() > self.end_time and self.status.lower() == 'booked'
    return False
```

### 2. Backend - Database Migration (`parking/migrations/0007_booking_timestamps.py`)

Created migration to:
- Add `start_time` field with auto_now_add=True
- Add `end_time` field (nullable)
- Ensure these fields are properly tracked in the database

**How to apply:**
```bash
python manage.py migrate
```

### 3. Backend - Serializers (`parking/serializers.py`)

**Updated BookingSerializer:**
- Added `start_time`, `end_time`, and `is_expired` fields to serialized output
- Added `get_is_expired()` method to check expiration status
- Makes these fields read-only (automatically managed by backend)

### 4. Backend - Views (`parking/views.py`)

**Enhanced BookingViewSet:**

**Auto-expiration Logic:**
- `_auto_complete_expired()` - Marks expired bookings as 'completed'
- Override `retrieve()` to auto-complete on fetch
- Override `list()` to auto-complete expired bookings before returning

**New Cancel Endpoint:**
```
POST /api/bookings/{id}/cancel/
```
- Only BOOKED status bookings can be cancelled
- Owners can cancel bookings for their own lots
- Admins can cancel any booking
- Automatically releases the slot back to available status

**Verification:**
```python
@action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
def cancel(self, request, pk=None):
    # Validates user is owner/admin
    # Checks booking status is 'booked'
    # Sets status to 'cancelled'
    # Releases slot to available
```

**Updated permissions:**
- Owners can now view and manage their own lots' bookings
- Owners can cancel active bookings
- Admins have full access

### 5. Frontend - Parking Service (`services/parkingService.js`)

**Added Method:**
```javascript
cancelBooking: async (id) => {
    const response = await api.post(`/bookings/${id}/cancel/`);
    return response.data;
}
```

### 6. Frontend - Owner Bookings Component (`Pages/Owner/OwnerBookings.jsx`)

**Major Changes:**

1. **Removed:**
   - "Complete" button (automatic via backend expiration)
   - Manual status update handler

2. **Added:**
   - Auto-refresh logic (every 10 seconds)
   - Manual "Refresh" button in header
   - Confirmation dialog before cancellation
   - Proper error handling

3. **Updated Action Buttons:**
   - **BOOKED status:** Shows red "Cancel" button
   - **COMPLETED status:** Shows green badge (read-only)
   - **CANCELLED status:** Shows red badge (read-only)

4. **Code Structure:**
```jsx
// New: Auto-refresh setup
useEffect(() => {
    if (owner?.role === 'Owner') {
        loadBookings()
        // Refresh every 10 seconds
        refreshIntervalRef.current = setInterval(() => {
            loadBookings()
        }, 10000)
    }
    return () => clearInterval(refreshIntervalRef.current)
}, [owner])

// New: Cancel handler
const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure?')) return
    const response = await parkingService.cancelBooking(bookingId)
    // Update local state
}

// Updated: Action column with conditional rendering
{b.status?.toLowerCase() === 'booked' && (
    <button onClick={() => handleCancelBooking(...)}>✕ Cancel</button>
)}
{b.status?.toLowerCase() === 'completed' && (
    <span>✓ Completed</span>
)}
{b.status?.toLowerCase() === 'cancelled' && (
    <span>✕ Cancelled</span>
)}
```

## Workflow

### Creating a Booking
1. User creates booking → `start_time` set automatically
2. Backend calculates `end_time` = `start_time` + 1 hour

### During Active Booking
1. Booking has status = 'booked'
2. Owner sees booking in table with "Cancel" button
3. Owner can manually cancel (releases slot)

### After 1 Hour Expires
1. Next API call (on list/retrieve) checks `is_expired()`
2. Backend auto-sets status = 'completed'
3. Owner sees booking with "Completed" badge
4. Slot remains unavailable (only for completed bookings)

### Cancelling a Booking
1. Owner clicks "Cancel" button
2. Confirmation dialog appears
3. API calls POST `/bookings/{id}/cancel/`
4. Backend validates and updates status = 'cancelled'
5. Slot released to available
6. UI updates immediately

## Auto-Refresh Behavior

- Component refreshes bookings every **10 seconds** automatically
- Users can also click "🔄 Refresh" button for immediate refresh
- Backend checks for expired bookings on every fetch
- Status changes reflected in real-time

## API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/bookings/` | Get owner's bookings | Owner/Admin |
| POST | `/bookings/` | Create booking | User |
| GET | `/bookings/{id}/` | Get booking details | Owner/Admin |
| PATCH | `/bookings/{id}/` | Update booking | Admin only |
| POST | `/bookings/{id}/cancel/` | **NEW** Cancel booking | Owner/Admin |

## Status Flow

```
BOOKED (1 hour) → COMPLETED (auto, or manual cancel) → CANCELLED
           ↓
       Can Cancel
```

## Testing Checklist

- [ ] Run migrations: `python manage.py migrate`
- [ ] Test create booking - verify `start_time` and `end_time` set
- [ ] Test cancel booking - verify slot released
- [ ] Test auto-expiration - wait/modify time to see auto-complete
- [ ] Test permissions - owner can only cancel own lots' bookings
- [ ] Test auto-refresh - bookings update every 10 seconds
- [ ] Test UI - buttons show correctly for each status
- [ ] Test error handling - invalid cancellations show error messages

## Notes

- Bookings default to 1-hour duration (configurable in `save()` method)
- Expired bookings automatically complete on next data fetch
- Cancelled bookings release slots back to available
- Auto-refresh can be adjusted (currently 10 seconds)
- All operations include detailed console logging for debugging
