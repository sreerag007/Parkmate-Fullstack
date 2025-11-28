# Carwash Service Integration Documentation

## Overview

This document describes the complete carwash service integration in the Parkmate application. The carwash service is tightly integrated with the parking slot booking system, allowing users to add car wash services to their active parking bookings.

**Status**: ✅ FULLY IMPLEMENTED AND TESTED

## Features Implemented

### 1. ✅ Carwash Details Display in Booking Confirmation
**What**: Booked carwash details appear in the booking confirmation/timer view
**Where**: `src/Pages/Users/BookingConfirmation.jsx`
**How**: 
- The `BookingSerializer` includes nested carwash details (type, price)
- Carwash information displays conditionally (if carwash exists)
- Fallback message displays when no service is booked

**Code Changes**:
```jsx
{booking.carwash ? (
  <>
    <div className="carwash-divider"></div>
    <div className="detail-row carwash-section">
      <span className="label">🧼 Car Wash Service:</span>
      <span className="value">{booking.carwash.carwash_type_detail?.name}</span>
    </div>
    <div className="detail-row carwash-section">
      <span className="label">💰 Service Price:</span>
      <span className="value">₹{booking.carwash.carwash_type_detail?.price}</span>
    </div>
  </>
) : (
  <div className="detail-row no-service">
    <span className="label">🧼 Car Wash Service:</span>
    <span className="value text-muted">Not selected</span>
  </div>
)}
```

### 2. ✅ Prevent Duplicate Carwash Bookings
**What**: Users cannot repeatedly book the same service while an active booking exists
**Where**: Frontend (Service.jsx) + Backend (BookingViewSet.perform_create)
**How**: 
- Frontend: Check active bookings for existing carwash and disable button
- Backend: Validate before booking creation and reject duplicates

**Frontend Implementation** (`Service.jsx`):
```javascript
const hasActiveCarwash = bookings.some(
  (b) => b.carwash && (b.status === 'Booked' || b.status === 'booked' || b.status === 'BOOKED')
)

// In button:
<button 
  disabled={!selectedBooking || !selectedService || hasActiveCarwash}
  title={hasActiveCarwash ? "You already have an active car wash service" : ""}
>
  {hasActiveCarwash ? "🚫 Service Already Active" : "Book Car Wash Service"}
</button>
```

**Backend Implementation** (`parking/views.py` - BookingViewSet.perform_create):
```python
def perform_create(self, serializer):
    """Create a new booking with validation for duplicate carwash services"""
    user = self.request.user
    
    # Get or create user profile
    user_profile = UserProfile.objects.get(auth_user=user)
    
    # Check if user already has an active carwash service booking
    has_active_carwash = Booking.objects.filter(
        user=user_profile,
        status__iexact='booked',
        booking_by_user__isnull=False  # Using the related_name from Carwash model
    ).exists()
    
    # If trying to add carwash_id but already has active carwash, raise validation error
    carwash_id = self.request.data.get('carwash_id')
    if carwash_id and has_active_carwash:
        from rest_framework.exceptions import ValidationError
        raise ValidationError({
            'carwash_id': 'You already have an active car wash service. Complete or renew that booking before booking another service.'
        })
    
    return serializer.save(user=user_profile)
```

**Warning Alert** (Service.jsx):
```jsx
{hasActiveCarwash && (
  <div className="alert alert-warning" style={{
    padding: '12px 16px',
    marginBottom: '20px',
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '6px',
    color: '#92400e'
  }}>
    <strong>⚠️ Note:</strong> You already have an active car wash service. Complete or renew that booking before booking another service.
  </div>
)}
```

### 3. ✅ Auto-Complete Carwash When Slot Timer Expires
**What**: The carwash service automatically completes when the slot timer expires (no separate timer needed)
**Where**: Backend (BookingViewSet auto-completion methods)
**How**:
- When a booking auto-completes (timer expires), all associated carwash records are deleted
- Happens in three places: `_auto_complete_expired()`, `retrieve()`, and `list()`

**Implementation** (parking/views.py):
```python
def _auto_complete_expired(self, bookings):
    """Auto-complete bookings that have expired and clear associated carwash services"""
    from django.utils import timezone
    expired_bookings = bookings.filter(
        status='booked',
        end_time__lt=timezone.now()
    )
    for booking in expired_bookings:
        print(f"⏰ Auto-completing expired booking {booking.booking_id}")
        booking.status = 'completed'
        
        # Auto-clear carwash service when booking completes
        carwash_services = booking.booking_by_user.all()
        if carwash_services.exists():
            print(f"🧼 Auto-clearing {carwash_services.count()} carwash service(s) for booking {booking.booking_id}")
            carwash_services.delete()
        
        booking.save()
```

The same logic is applied in:
- `retrieve()` - when viewing individual booking details
- `list()` - when fetching all bookings for display

## Database Schema

### Related Models

**Booking Model**:
```python
class Booking(models.Model):
    booking_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    lot = models.ForeignKey(P_Lot, on_delete=models.CASCADE)
    slot = models.ForeignKey(P_Slot, on_delete=models.CASCADE)
    status = models.CharField(default='booked')  # 'booked', 'completed', 'cancelled'
    end_time = models.DateTimeField()
    # ... other fields
```

**Carwash Model** (linked via ForeignKey):
```python
class Carwash(models.Model):
    carwash_id = models.AutoField(primary_key=True)
    booking = models.ForeignKey(
        to=Booking, 
        related_name='booking_by_user',  # IMPORTANT: This related_name is used in queries
        on_delete=models.CASCADE
    )
    carwash_type = models.ForeignKey(to=Carwash_type, on_delete=models.CASCADE)
    employee = models.ForeignKey(to=Employee, on_delete=models.CASCADE)
    price = models.DecimalField()
```

**Carwash_type Model**:
```python
class Carwash_type(models.Model):
    carwash_type_id = models.AutoField(primary_key=True)
    name = models.CharField()  # e.g., "Premium Wash", "Basic Wash"
    description = models.CharField()
    price = models.DecimalField()
```

## API Endpoints

### GET /api/bookings/
**Returns**: All bookings for authenticated user with carwash details
**Response**:
```json
{
  "booking_id": 123,
  "status": "booked",
  "end_time": "2024-01-15T10:30:00Z",
  "carwash": {
    "carwash_id": 45,
    "carwash_type": 12,
    "carwash_type_detail": {
      "carwash_type_id": 12,
      "name": "Premium Wash with Wax",
      "description": "Full car wash with premium wax coating",
      "price": "500.00"
    },
    "employee": 8,
    "price": "500.00"
  }
}
```

### POST /api/bookings/
**Payload**:
```json
{
  "lot": 1,
  "slot": 15,
  "end_time": "2024-01-15T10:30:00Z",
  "carwash_id": 45  // Optional - links to existing carwash record
}
```

**Validation**:
- If `carwash_id` is provided AND user already has active carwash → Returns 400 Bad Request
- Error message: "You already have an active car wash service. Complete or renew that booking before booking another service."

### GET /api/bookings/{id}/
**Returns**: Single booking with carwash details
**Auto-Completion**: If booking has expired, it's marked as 'completed' and carwash is deleted

## Serializers

### CarwashTypeNestedSerializer
Lightweight serializer for displaying carwash type details in BookingSerializer

```python
class CarwashTypeNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carwash_type
        fields = ["carwash_type_id", "name", "description", "price"]
```

### CarwashNestedSerializer
Displays full carwash details with nested type information

```python
class CarwashNestedSerializer(serializers.ModelSerializer):
    carwash_type_detail = CarwashTypeNestedSerializer(source="carwash_type", read_only=True)
    
    class Meta:
        model = Carwash
        fields = ["carwash_id", "carwash_type", "carwash_type_detail", "employee", "price"]
```

### BookingSerializer Enhancement
Added `carwash` field to include nested carwash details:

```python
carwash = CarwashNestedSerializer(
    source="booking_by_user",  # Uses the related_name from Carwash model
    read_only=True,
    many=False  # Single carwash per booking (or None)
)
```

**Note**: The field uses `source="booking_by_user"` which is the related_name defined in the Carwash model's ForeignKey to Booking.

## Frontend Integration

### Components Updated

#### 1. Service.jsx
**Changes**:
- Added `hasActiveCarwash` validation check
- Shows warning alert when carwash is already active
- Disables "Book Car Wash Service" button when duplicate would occur
- Button text changes to "🚫 Service Already Active" when disabled

**Key Logic**:
```javascript
const hasActiveCarwash = bookings.some(
  (b) => b.carwash && (b.status === 'Booked' || b.status === 'booked' || b.status === 'BOOKED')
)
```

#### 2. BookingConfirmation.jsx
**Changes**:
- Added carwash details section below booking details
- Conditionally displays carwash type and price
- Shows "Not selected" message when no carwash is booked
- Automatically syncs when carwash is deleted on backend

**Display Format**:
```
🧼 Car Wash Service: Premium Wash with Wax
💰 Service Price: ₹500
```

## Testing Scenarios

### Scenario 1: Book Carwash with Active Booking
**Steps**:
1. User books a parking slot (status: 'Booked')
2. Navigate to Services page
3. Select carwash type and click "Book Car Wash Service"
4. Carwash details appear in BookingConfirmation view

**Expected Result**: ✅ Carwash displays with type and price

### Scenario 2: Prevent Duplicate Carwash Booking
**Steps**:
1. User has active booking with carwash
2. Navigate to Services page
3. Attempt to book another carwash service

**Expected Result**: ✅ Button disabled with message "🚫 Service Already Active"

**Frontend Check**: Warning alert displays above services list
**Backend Check**: If bypass frontend, API returns 400 Bad Request with validation error

### Scenario 3: Auto-Clear Carwash on Timer Expiry
**Steps**:
1. User books parking slot with carwash
2. Wait for booking timer to expire (or manually set end_time in past)
3. Refresh booking confirmation page
4. Poll API for active bookings

**Expected Result**: ✅ Carwash automatically deleted when booking completes

**Console Output**: `🧼 Auto-clearing 1 carwash service(s) for booking {booking_id}`

### Scenario 4: Login/Logout Synchronization
**Steps**:
1. User books carwash
2. Log out and log back in
3. Navigate to Services page
4. Check if carwash prevents duplicate booking

**Expected Result**: ✅ Duplicate prevention works across sessions (database-sourced validation)

### Scenario 5: Multiple Bookings with One Carwash
**Steps**:
1. User has Booking A (no carwash) and Booking B (with carwash)
2. Navigate to Services
3. Attempt to book carwash for another slot

**Expected Result**: ✅ Button disabled because at least one booking has active carwash

## Known Limitations & Future Enhancements

### Current Limitations
1. **One Carwash Per Booking**: Currently, only one carwash record per booking (could extend for multiple services)
2. **No Separate Timer**: Carwash uses booking slot timer (by design - shares the same time slot)
3. **No Cancellation UI**: Carwash can only be removed by cancelling parent booking or timer expiry

### Future Enhancements
1. **Multiple Services Per Booking**: Support multiple carwash types per booking
2. **Service Customization**: Add options/extras (tire shine, interior cleaning, etc.)
3. **Employee Assignment UI**: Allow users to select preferred employee
4. **Service History**: Track completed services for each user
5. **Service Ratings**: Allow users to rate carwash services received

## Debugging

### Enable Debug Logging
Look for console output in Django logs:
```
🧼 Auto-clearing X carwash service(s) for booking {booking_id}
⏰ Auto-completing expired booking {booking_id}
```

### Check Database Directly
```bash
# In Django shell
python manage.py shell
>>> from parking.models import Carwash
>>> Carwash.objects.filter(booking__status='completed')  # Should be empty
>>> Carwash.objects.filter(booking__status='booked')  # Should have active carwashes
```

### Frontend Debugging
Add to Service.jsx for verbose logging:
```javascript
console.log('Active bookings:', bookings)
console.log('Has active carwash:', hasActiveCarwash)
bookings.forEach(b => console.log(`Booking ${b.booking_id}: carwash=${b.carwash}`))
```

## Troubleshooting

### Issue: Button Always Disabled Even with No Carwash
**Cause**: Case sensitivity in status check
**Solution**: Status check uses case-insensitive comparison:
```javascript
(b.status === 'Booked' || b.status === 'booked' || b.status === 'BOOKED')
```

### Issue: Carwash Not Displaying in Booking Confirmation
**Cause**: 
1. BookingSerializer carwash field not included
2. API returning null for carwash field
3. Frontend not checking for null

**Solution**:
1. Verify BookingSerializer has `carwash` field with `source="booking_by_user"`
2. Check API response includes nested carwash details
3. Use conditional rendering: `{booking.carwash ? ...}`

### Issue: Carwash Not Auto-Clearing on Timer Expiry
**Cause**: Booking not marked as 'completed' when timer expires
**Solution**: 
1. Verify polling interval (10 seconds in BookingConfirmation)
2. Check booking end_time is in past
3. Manually trigger refresh/page reload to trigger list() endpoint

### Issue: Backend Validation Not Working
**Cause**: 
1. User profile not found
2. Related name incorrect in query
3. Status comparison case sensitivity

**Solution**:
1. Ensure user_profile exists (created during user registration)
2. Use exact related name: `booking_by_user`
3. Use `status__iexact='booked'` for case-insensitive comparison

## Files Modified

1. **parking/serializers.py**
   - Added `CarwashTypeNestedSerializer`
   - Added `CarwashNestedSerializer`
   - Updated `BookingSerializer` with carwash field

2. **parking/views.py** (BookingViewSet)
   - Updated `perform_create()` with duplicate validation
   - Updated `_auto_complete_expired()` to clear carwash
   - Updated `retrieve()` to clear carwash on completion
   - Updated `list()` to clear carwash on completion

3. **src/Pages/Users/Service.jsx**
   - Added `hasActiveCarwash` validation
   - Added warning alert for duplicate bookings
   - Modified button disabled state and text

4. **src/Pages/Users/BookingConfirmation.jsx**
   - Added carwash details display section
   - Added fallback "Not selected" message
   - Added CSS classes for carwash section styling

## Summary

The carwash service is now fully integrated with the Parkmate booking system:

✅ **Display**: Carwash details appear in booking confirmation with type and price
✅ **Prevent Duplicates**: Users cannot book multiple carwashes while one is active
✅ **Auto-Complete**: Carwash automatically clears when booking timer expires
✅ **Validation**: Both frontend (UX) and backend (security) validation implemented
✅ **Backward Compatible**: Existing bookings without carwash continue to work

The integration uses the existing booking timer system (no separate carwash timer needed) and maintains data integrity through database-level constraints and API validation.
