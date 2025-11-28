# API Reference: Backend-Driven Booking Timer

## Base URL
```
http://localhost:8000/api
```

## Authentication
All endpoints require authentication token in header:
```
Authorization: Token YOUR_AUTH_TOKEN
```

---

## Bookings Endpoints

### 1. Create Booking
**Endpoint**: `POST /bookings/`

**Request**:
```json
{
  "slot": 5,
  "vehicle_number": "KL-08-AZ-1234",
  "booking_type": "Instant"
}
```

**Response** (201 Created):
```json
{
  "booking_id": 123,
  "user_read": {
    "id": 1,
    "firstname": "John",
    "lastname": "Doe",
    "vehicle_number": "KL-08-AZ-1234",
    "vehicle_type": "Sedan"
  },
  "slot_read": {
    "slot_id": 5,
    "vehicle_type": "Sedan",
    "price": "50.00",
    "is_available": false,
    "lot_detail": {
      "lot_id": 1,
      "lot_name": "Central Parking"
    }
  },
  "lot_detail": {
    "lot_id": 1,
    "lot_name": "Central Parking",
    "streetname": "Main St",
    "city": "Kochi"
  },
  "vehicle_number": "KL-08-AZ-1234",
  "booking_type": "Instant",
  "booking_time": "2025-01-15",
  "start_time": "2025-01-15T14:00:00Z",
  "end_time": "2025-01-15T15:00:00Z",
  "price": "50.00",
  "status": "booked",
  "is_expired": false,
  "remaining_time": 3600
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Selected slot is not available."
}
```

---

### 2. List Bookings
**Endpoint**: `GET /bookings/`

**Query Parameters**:
- None (filters based on user role automatically)

**Response** (200 OK):
```json
[
  {
    "booking_id": 123,
    "user_read": {...},
    "slot_read": {...},
    "lot_detail": {...},
    "vehicle_number": "KL-08-AZ-1234",
    "booking_type": "Instant",
    "price": "50.00",
    "status": "booked",
    "start_time": "2025-01-15T14:00:00Z",
    "end_time": "2025-01-15T15:00:00Z",
    "is_expired": false,
    "remaining_time": 1800
  }
]
```

**Note**: Backend automatically:
- Auto-completes any expired bookings (status='booked' and end_time < now)
- Filters by user (User role) or lot owner (Owner role)

---

### 3. Get Booking Details
**Endpoint**: `GET /bookings/{id}/`

**Parameters**:
- `id` (integer): Booking ID

**Response** (200 OK):
```json
{
  "booking_id": 123,
  "user_read": {...},
  "slot_read": {...},
  "lot_detail": {...},
  "vehicle_number": "KL-08-AZ-1234",
  "booking_type": "Instant",
  "price": "50.00",
  "status": "booked",
  "start_time": "2025-01-15T14:00:00Z",
  "end_time": "2025-01-15T15:00:00Z",
  "is_expired": false,
  "remaining_time": 1800
}
```

**Error Response** (404 Not Found):
```json
{
  "detail": "Not found."
}
```

**Note**: If booking is expired:
- Status automatically changes to "completed"
- Response includes new status
- Response includes remaining_time: 0

---

### 4. Update Booking
**Endpoint**: `PATCH /bookings/{id}/`

**Request**:
```json
{
  "status": "cancelled"
}
```

**Response** (200 OK):
```json
{
  "booking_id": 123,
  "status": "cancelled",
  ...
}
```

**Note**: Only owners and admins can update bookings

---

### 5. Cancel Booking
**Endpoint**: `POST /bookings/{id}/cancel/`

**Request**: Empty body `{}`

**Response** (200 OK):
```json
{
  "booking_id": 123,
  "status": "cancelled",
  "start_time": "2025-01-15T14:00:00Z",
  "end_time": "2025-01-15T15:00:00Z",
  ...
}
```

**Side Effects**:
- Slot is marked as `is_available: true`
- Booking status set to "cancelled"

**Error Responses**:
```json
// Not authorized
{
  "error": "Only owners and admins can cancel bookings"
}

// Cannot cancel completed/cancelled booking
{
  "error": "Cannot cancel booking with status: completed"
}

// Booking not found
{
  "error": "Booking not found"
}
```

---

### 6. Renew Booking (NEW)
**Endpoint**: `POST /bookings/{id}/renew/`

**Request**: Empty body `{}`

**Response** (201 Created):
```json
{
  "message": "Booking renewed successfully",
  "old_booking_id": 123,
  "new_booking": {
    "booking_id": 124,
    "user_read": {...},
    "slot_read": {...},
    "lot_detail": {...},
    "vehicle_number": "KL-08-AZ-1234",
    "booking_type": "Instant",
    "price": "50.00",
    "status": "booked",
    "start_time": "2025-01-15T15:01:00Z",
    "end_time": "2025-01-15T16:01:00Z",
    "is_expired": false,
    "remaining_time": 3600
  }
}
```

**Side Effects**:
- New booking created with same slot and user
- Slot marked as `is_available: false` (by new booking)
- Old booking status unchanged (remains "completed")
- New start_time and end_time calculated from current server time

**Error Responses**:
```json
// Not authorized
{
  "error": "You can only renew your own bookings"
}

// Cannot renew active booking
{
  "error": "Can only renew completed or expired bookings (current status: booked)"
}

// Slot not available
{
  "error": "Slot is not available for renewal"
}

// Booking not found
{
  "error": "Booking not found"
}
```

---

## Field Descriptions

### Booking Object

| Field | Type | Description |
|-------|------|-------------|
| booking_id | integer | Unique booking identifier |
| user_read | object | Nested user profile data (read-only) |
| slot_read | object | Nested slot data (read-only) |
| lot_detail | object | Nested lot data (read-only) |
| vehicle_number | string | License plate number |
| booking_type | string | "Instant" or "Advance" |
| booking_time | date | Date booking was created |
| start_time | datetime | When booking started (ISO 8601) |
| end_time | datetime | When booking ends/expires (ISO 8601) |
| price | decimal | Hourly rate for the slot |
| status | string | "booked", "completed", or "cancelled" |
| is_expired | boolean | True if end_time < now and status="booked" |
| remaining_time | integer | Seconds until booking expires (0 if expired) |

### Status Values

- **booked**: Active booking, timer running
- **completed**: Booking period ended, slot released
- **cancelled**: User manually cancelled

---

## Response Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Successful GET, PATCH, POST actions |
| 201 | Created | Successful POST (create/renew) |
| 400 | Bad Request | Invalid input, slot unavailable, etc |
| 403 | Forbidden | Unauthorized user, cannot renew other's booking |
| 404 | Not Found | Booking/slot not found |
| 500 | Server Error | Database error, etc |

---

## Rate Limiting
No rate limiting currently implemented. Consider adding for production:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

---

## Timing Calculations

### Remaining Time Formula
```
remaining_time = max(0, int((end_time - current_server_time).total_seconds()))
```

### Auto-Completion Check
```python
is_expired = (timezone.now() > end_time) and (status == 'booked')
```

### Renewal Duration
```
new_start_time = timezone.now()
new_end_time = new_start_time + timedelta(hours=1)
```

---

## Common Use Cases

### 1. Create and Display Booking
```javascript
// Frontend
const booking = await parkingService.createBooking({
  slot: slotId,
  vehicle_number: userProfile.vehicle_number,
  booking_type: 'Instant'
});
// Redirect to confirmation
navigate(`/booking-confirmation?booking=${booking.booking_id}`);
```

### 2. Get Remaining Time
```javascript
// Frontend
const booking = await parkingService.getBookingById(bookingId);
const remaining = booking.remaining_time; // in seconds
const formatted = formatTime(remaining * 1000); // convert to ms
```

### 3. Check if Expired
```javascript
// Frontend
const booking = await parkingService.getBookingById(bookingId);
if (booking.is_expired) {
  // Show "Booking Expired" state
  showRenewButton();
}
```

### 4. Renew Booking
```javascript
// Frontend
const result = await parkingService.renewBooking(oldBookingId);
const newBookingId = result.new_booking.booking_id;
navigate(`/booking-confirmation?booking=${newBookingId}`);
```

### 5. Poll for Updates
```javascript
// Frontend - every 10 seconds
const booking = await parkingService.getBookingById(bookingId);
if (booking.status === 'completed' && !wasCompleted) {
  // Handle auto-completion
  updateUI();
  wasCompleted = true;
}
```

---

## Examples

### Using cURL

**Create Booking**:
```bash
curl -X POST http://localhost:8000/api/bookings/ \
  -H "Authorization: Token abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "slot": 5,
    "vehicle_number": "KL-08-AZ-1234",
    "booking_type": "Instant"
  }'
```

**Get Booking**:
```bash
curl http://localhost:8000/api/bookings/123/ \
  -H "Authorization: Token abc123def456"
```

**Renew Booking**:
```bash
curl -X POST http://localhost:8000/api/bookings/123/renew/ \
  -H "Authorization: Token abc123def456" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Cancel Booking**:
```bash
curl -X POST http://localhost:8000/api/bookings/123/cancel/ \
  -H "Authorization: Token abc123def456" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Using JavaScript Fetch

```javascript
// Create booking
const createResponse = await fetch('http://localhost:8000/api/bookings/', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    slot: 5,
    vehicle_number: 'KL-08-AZ-1234',
    booking_type: 'Instant'
  })
});

const booking = await createResponse.json();
console.log('Created booking:', booking.booking_id);
```

---

## Timestamps Format
All timestamps use ISO 8601 format with UTC timezone:
- Format: `YYYY-MM-DDTHH:MM:SSZ`
- Example: `2025-01-15T14:00:00Z`
- Timezone: Always UTC (Z = Zulu time)

To convert in JavaScript:
```javascript
const endTime = new Date('2025-01-15T14:00:00Z'); // UTC
const remaining = endTime - new Date(); // milliseconds
const seconds = Math.floor(remaining / 1000);
```

---

## Future Enhancements

### Potential New Endpoints
- `GET /bookings/stats/` - Analytics on booking patterns
- `POST /bookings/{id}/extend/` - Extend booking before expiration
- `GET /bookings/{id}/activity/` - Activity log (created, renewed, cancelled)
- `POST /bookings/batch/` - Create multiple bookings
- `DELETE /bookings/{id}/` - Hard delete (admin only)

### Potential Response Headers
- `X-Booking-Expires-In` - Seconds until expiration
- `X-Auto-Completed` - True if auto-completed on this request
- `X-Server-Time` - Server's current time for client synchronization

---

## Migration Notes

For existing deployments:

1. Run migrations:
   ```bash
   python manage.py migrate parking
   ```

2. All existing bookings will work with new endpoints

3. Response includes new fields (remaining_time, is_expired)

4. Old bookings without start_time/end_time will have them auto-set on next save

5. No breaking changes to existing endpoints

---

## Support & Debugging

### Check If Booking Auto-Completed
```bash
# In Django shell
from parking.models import Booking
booking = Booking.objects.get(booking_id=123)
print(f"Status: {booking.status}")
print(f"Expired: {booking.is_expired()}")
```

### Get Server Time
```javascript
fetch('http://localhost:8000/api/bookings/123/', {
  headers: {'Authorization': `Token ${token}`}
}).then(r => {
  console.log('Server time header:', r.headers.get('date'));
});
```

### Verify Token Validity
```bash
curl http://localhost:8000/api/bookings/ \
  -H "Authorization: Token invalid_token"
# Should return 403 Forbidden
```
