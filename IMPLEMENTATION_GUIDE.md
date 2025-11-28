# Backend-Driven Booking Timer Implementation

## Overview
This implementation refactors the parking booking system to use a backend-driven, persistent timer instead of relying on frontend-only timers. All time-sensitive logic is now controlled by the backend, ensuring synchronization across users and owners.

## Changes Made

### 1. Backend (Django) Changes

#### models.py
- **Booking Model**: Already had `start_time` and `end_time` fields
- **Auto-expiration**: `is_expired()` method checks if `timezone.now() > end_time` and status == 'booked'
- **Auto-save**: `save()` method automatically sets:
  - `start_time` = current time (on creation)
  - `end_time` = start_time + 1 hour (on creation)

#### serializers.py
- **BookingSerializer updates**:
  - Added `remaining_time` field (calculated as seconds until expiration)
  - Returns current remaining time for frontend display
  - Field is read-only and computed server-side

#### views.py
- **BookingViewSet enhancements**:
  - Added `renew()` action endpoint: `POST /bookings/{id}/renew/`
    - Validates booking is completed or expired
    - Creates new booking with same slot and user info
    - Sets new start_time and end_time (1 hour duration)
    - Marks slot as unavailable
    - Returns new booking data
  - Auto-completion logic on every API call:
    - `list()` method filters expired bookings before returning
    - `retrieve()` method checks single booking for expiration
    - `get_queryset()` auto-completes expired bookings
  - `cancel()` action unchanged (manual cancellation)

### 2. Frontend (React) Changes

#### New Component: BookingConfirmation.jsx
- **Purpose**: Display booking with backend-driven countdown timer
- **Features**:
  - Timer display (HH:MM:SS) that counts down to expiration
  - Fetches booking from backend on page load
  - Polls backend every 10 seconds to check for auto-completion
  - Shows "Expiring Soon" warning if < 5 minutes remain
  - Displays two states:
    - **BOOKED**: Shows countdown timer, "Add Car Wash" button, "Return to Home" button
    - **COMPLETED**: Shows "Renew Booking" button, "Return to Home" button
  - Renew Booking button triggers renewal via API
  - Exit button returns to home

#### Updated: DynamicLot.jsx
- Modified `bookSlot()` to redirect to `/booking-confirmation?booking={bookingId}`
- Removed local `userBooking` state and "Book Car Wash" button from this page
- Car Wash booking is now available from BookingConfirmation page

#### Updated: App.jsx
- Added import for `BookingConfirmation` component
- Added route: `<Route path="/booking-confirmation" element={<BookingConfirmation />} />`

#### Updated: parkingService.js
- Added `renewBooking(id)` method: `POST /bookings/{id}/renew/`
- Returns new booking data on success

## Data Flow

### Booking Creation Flow
1. User selects slot in DynamicLot page
2. Frontend calls `POST /bookings/` with booking details
3. Backend creates booking with:
   - `start_time` = current server time
   - `end_time` = start_time + 1 hour
   - `status` = 'booked'
4. Slot is marked as unavailable
5. Frontend redirects to `/booking-confirmation?booking={bookingId}`

### Active Booking Display Flow
1. BookingConfirmation component loads booking via `GET /bookings/{id}/`
2. Backend checks if expired:
   - If expired: Sets status to 'completed' and returns
   - If active: Returns current status and remaining_time
3. Frontend displays countdown using `end_time` from response
4. Local timer counts down every second from received `end_time`
5. Every 10 seconds, polls backend to check for auto-completion

### Backend Auto-Completion Flow
1. User refreshes page or API call is made
2. BookingViewSet.list/retrieve checks if booking.is_expired()
3. If expired: Sets status = 'completed' and saves
4. Returns updated status to frontend
5. Frontend detects status change and displays "Booking Expired" state

### Renewal Flow
1. User clicks "Renew Booking" on expired booking
2. Frontend calls `POST /bookings/{bookingId}/renew/`
3. Backend validates:
   - Booking status is 'completed' or 'expired'
   - Slot is available
   - User is authorized
4. Creates new booking record with same details
5. Marks slot as unavailable
6. Returns new booking data
7. Frontend redirects to `/booking-confirmation?booking={newBookingId}`

## Key Design Decisions

### 1. Backend-Driven Time
- Server time is the source of truth
- Frontend timer is cosmetic only
- Backend auto-completes bookings on API calls
- No dependency on frontend state or local storage

### 2. Persistent Across Logout
- Booking data stored in database
- Login/logout doesn't affect booking state
- Timer continues on backend regardless of frontend activity
- User can log back in and see correct remaining time

### 3. Synchronization
- Owner dashboards poll every 10 seconds
- User booking confirmation page polls every 10 seconds
- All statuses reflect latest backend state
- No manual refresh required

### 4. Conflict Resolution
- Expired bookings are auto-completed on any API call
- Prevents "complete" button from working on expired bookings
- Ensures consistent state across all views

## API Endpoints

### Existing Endpoints (Enhanced)
- `GET /bookings/` - Lists bookings, auto-completes expired ones
- `GET /bookings/{id}/` - Retrieves booking, checks for expiration
- `POST /bookings/` - Creates new booking with auto timestamps
- `PATCH /bookings/{id}/` - Updates booking
- `POST /bookings/{id}/cancel/` - Manually cancels booking (unchanged)

### New Endpoint
- `POST /bookings/{id}/renew/` - Renews expired booking
  - Request: `{}` (empty body)
  - Response:
    ```json
    {
      "message": "Booking renewed successfully",
      "old_booking_id": 123,
      "new_booking": {
        "booking_id": 124,
        "start_time": "2025-01-15T14:30:00Z",
        "end_time": "2025-01-15T15:30:00Z",
        "status": "booked",
        "remaining_time": 3600,
        ...
      }
    }
    ```

## Response Data Structure

### Booking Response
```json
{
  "booking_id": 123,
  "user_read": { "id": 1, "firstname": "John", ... },
  "slot_read": { "slot_id": 5, "vehicle_type": "Sedan", "price": 50 },
  "lot_detail": { "lot_id": 1, "lot_name": "Central Lot", ... },
  "vehicle_number": "KL-08-AZ-1234",
  "booking_type": "Instant",
  "price": 50,
  "start_time": "2025-01-15T14:00:00Z",
  "end_time": "2025-01-15T15:00:00Z",
  "status": "booked",
  "is_expired": false,
  "remaining_time": 1800,
  "booking_time": "2025-01-15"
}
```

## Testing Checklist

- [ ] Create booking → displays confirmation page
- [ ] Timer counts down correctly
- [ ] Expiring soon warning shows at < 5 min
- [ ] Log out → log in → booking shows correct remaining time
- [ ] Wait 1 hour → booking auto-completes
- [ ] Refresh page during active booking → timer resumes correctly
- [ ] Click "Renew Booking" → new booking created
- [ ] Owner dashboard shows updated statuses in real-time
- [ ] Cancel booking → slot becomes available
- [ ] Expired booking shows "Booking Expired" state
- [ ] Exit button returns to home

## Backward Compatibility

- ✅ Existing booking API unchanged
- ✅ Existing slot functionality preserved
- ✅ Owner dashboards continue to work
- ✅ No breaking changes to serializers
- ✅ Optional feature - doesn't affect existing flows

## Future Enhancements

1. **Notifications**: Email/SMS on booking expiration
2. **Auto-renewal**: Option to auto-renew before expiration
3. **Configurable Duration**: Allow different duration per lot
4. **Background Task**: Celery beat for batch auto-completion
5. **Activity Log**: Track renewal and cancellation history
6. **Slot Release Notifications**: Notify waiting users when slot becomes available
