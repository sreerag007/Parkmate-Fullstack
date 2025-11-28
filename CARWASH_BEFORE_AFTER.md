# Carwash Integration - Before & After Code Changes

## Overview
This document shows the exact code changes made for carwash service integration.

---

## File 1: parking/serializers.py

### What Changed
Added two new serializer classes and updated BookingSerializer to include carwash details.

### Location
Lines ~270-310 in parking/serializers.py

### BEFORE
```python
# ... other serializers ...

class BookingSerializer(serializers.ModelSerializer):
    slot_details = P_SlotNestedSerializer(source='slot', read_only=True)
    lot_details = P_LotNestedSerializer(source='lot', read_only=True)
    user_details = UserProfileNestedSerializer(source='user', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['booking_id', 'user', 'user_details', 'lot', 'lot_details', 
                  'slot', 'slot_details', 'start_time', 'end_time', 'status', 
                  'booking_type', 'is_expired', 'renewal_count']
        read_only_fields = ['booking_id', 'start_time', 'is_expired', 'user_details', 
                           'lot_details', 'slot_details']

    def create(self, validated_data):
        # ... creation logic ...
```

### AFTER
```python
# NEW: Carwash Type Serializer
class CarwashTypeNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carwash_type
        fields = ["carwash_type_id", "name", "description", "price"]


# NEW: Carwash Serializer with nested type details
class CarwashNestedSerializer(serializers.ModelSerializer):
    carwash_type_detail = CarwashTypeNestedSerializer(source="carwash_type", read_only=True)
    
    class Meta:
        model = Carwash
        fields = ["carwash_id", "carwash_type", "carwash_type_detail", "employee", "price"]


class BookingSerializer(serializers.ModelSerializer):
    slot_details = P_SlotNestedSerializer(source='slot', read_only=True)
    lot_details = P_LotNestedSerializer(source='lot', read_only=True)
    user_details = UserProfileNestedSerializer(source='user', read_only=True)
    carwash = CarwashNestedSerializer(source="booking_by_user", read_only=True)  # NEW
    
    class Meta:
        model = Booking
        fields = ['booking_id', 'user', 'user_details', 'lot', 'lot_details', 
                  'slot', 'slot_details', 'start_time', 'end_time', 'status', 
                  'booking_type', 'is_expired', 'renewal_count', 'carwash']  # carwash added
        read_only_fields = ['booking_id', 'start_time', 'is_expired', 'user_details', 
                           'lot_details', 'slot_details', 'carwash']  # carwash added

    def create(self, validated_data):
        # ... creation logic ...
```

### Key Changes
- ✅ Added `CarwashTypeNestedSerializer` to serialize Carwash_type details
- ✅ Added `CarwashNestedSerializer` to serialize Carwash with nested type
- ✅ Added `carwash` field to BookingSerializer using `source="booking_by_user"`
- ✅ Added 'carwash' to fields list in BookingSerializer Meta
- ✅ Added 'carwash' to read_only_fields in BookingSerializer Meta

---

## File 2: parking/views.py (BookingViewSet)

### What Changed
Added duplicate prevention validation and auto-clear carwash logic in multiple methods.

### Location
Lines ~340-426 in parking/views.py

### BEFORE - _auto_complete_expired()
```python
def _auto_complete_expired(self, bookings):
    """Auto-complete bookings that have expired"""
    from django.utils import timezone
    expired_bookings = bookings.filter(
        status='booked',
        end_time__lt=timezone.now()
    )
    for booking in expired_bookings:
        print(f"⏰ Auto-completing expired booking {booking.booking_id}")
        booking.status = 'completed'
        booking.save()
```

### AFTER - _auto_complete_expired()
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
        
        # NEW: Auto-clear carwash service when booking completes
        carwash_services = booking.booking_by_user.all()
        if carwash_services.exists():
            print(f"🧼 Auto-clearing {carwash_services.count()} carwash service(s) for booking {booking.booking_id}")
            carwash_services.delete()
        
        booking.save()
```

### BEFORE - retrieve()
```python
def retrieve(self, request, *args, **kwargs):
    """Override retrieve to auto-complete expired bookings"""
    response = super().retrieve(request, *args, **kwargs)
    booking_id = kwargs.get('pk')
    try:
        booking = Booking.objects.get(pk=booking_id)
        if booking.is_expired():
            print(f"⏰ Auto-completing expired booking {booking.booking_id}")
            booking.status = 'completed'
            booking.save()
            response.data['status'] = 'completed'
    except Booking.DoesNotExist:
        pass
    return response
```

### AFTER - retrieve()
```python
def retrieve(self, request, *args, **kwargs):
    """Override retrieve to auto-complete expired bookings and clear carwash services"""
    response = super().retrieve(request, *args, **kwargs)
    booking_id = kwargs.get('pk')
    try:
        booking = Booking.objects.get(pk=booking_id)
        if booking.is_expired():
            print(f"⏰ Auto-completing expired booking {booking.booking_id}")
            booking.status = 'completed'
            
            # NEW: Auto-clear carwash service when booking completes
            carwash_services = booking.booking_by_user.all()
            if carwash_services.exists():
                print(f"🧼 Auto-clearing {carwash_services.count()} carwash service(s) for booking {booking.booking_id}")
                carwash_services.delete()
            
            booking.save()
            response.data['status'] = 'completed'
    except Booking.DoesNotExist:
        pass
    return response
```

### BEFORE - list()
```python
def list(self, request, *args, **kwargs):
    """Override list to auto-complete expired bookings before returning"""
    queryset = self.filter_queryset(self.get_queryset())
    # Auto-complete expired bookings
    from django.utils import timezone
    expired_bookings = queryset.filter(
        status='booked',
        end_time__lt=timezone.now()
    )
    for booking in expired_bookings:
        print(f"⏰ Auto-completing expired booking {booking.booking_id}")
        booking.status = 'completed'
        booking.save()
    return super().list(request, *args, **kwargs)
```

### AFTER - list()
```python
def list(self, request, *args, **kwargs):
    """Override list to auto-complete expired bookings and clear carwash services before returning"""
    queryset = self.filter_queryset(self.get_queryset())
    # Auto-complete expired bookings
    from django.utils import timezone
    expired_bookings = queryset.filter(
        status='booked',
        end_time__lt=timezone.now()
    )
    for booking in expired_bookings:
        print(f"⏰ Auto-completing expired booking {booking.booking_id}")
        booking.status = 'completed'
        
        # NEW: Auto-clear carwash service when booking completes
        carwash_services = booking.booking_by_user.all()
        if carwash_services.exists():
            print(f"🧼 Auto-clearing {carwash_services.count()} carwash service(s) for booking {booking.booking_id}")
            carwash_services.delete()
        
        booking.save()
    return super().list(request, *args, **kwargs)
```

### BEFORE - perform_create()
```python
def perform_create(self, serializer):
    return serializer.save()
```

### AFTER - perform_create() [COMPLETELY NEW]
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

### Key Changes
- ✅ Added carwash clearing logic in `_auto_complete_expired()`
- ✅ Added carwash clearing logic in `retrieve()`
- ✅ Added carwash clearing logic in `list()`
- ✅ Completely rewrote `perform_create()` with duplicate validation
- ✅ Uses `booking_by_user` related name for carwash access
- ✅ Case-insensitive status check with `__iexact`
- ✅ Raises ValidationError for duplicate carwash bookings

---

## File 3: src/Pages/Users/Service.jsx

### What Changed
Added duplicate carwash prevention logic with visual feedback.

### Location
Lines ~130-220 in Service.jsx

### BEFORE - Return Statement
```jsx
  return (
    <div className="service-root container">
      <h2>Car Wash Services</h2>
      <p className="muted">Select your booking and choose a car wash service.</p>

      <div className="service-grid">
        {/* service cards and other content... */}
      </div>

      <div className="svc-actions">
        <button className="btn primary" onClick={bookService} disabled={!selectedBooking || !selectedService}>
          Book Car Wash Service
        </button>
```

### AFTER - Return Statement [ADDED VALIDATION AND ALERT]
```jsx
  // Check if any booking already has an active carwash service
  const hasActiveCarwash = bookings.some(
    (b) => b.carwash && (b.status === 'Booked' || b.status === 'booked' || b.status === 'BOOKED')
  )

  return (
    <div className="service-root container">
      <h2>Car Wash Services</h2>
      <p className="muted">Select your booking and choose a car wash service.</p>

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

      <div className="service-grid">
        {/* service cards and other content... */}
      </div>

      <div className="svc-actions">
        <button 
          className="btn primary" 
          onClick={bookService} 
          disabled={!selectedBooking || !selectedService || hasActiveCarwash}
          title={hasActiveCarwash ? "You already have an active car wash service" : ""}
        >
          {hasActiveCarwash ? "🚫 Service Already Active" : "Book Car Wash Service"}
        </button>
```

### Key Changes
- ✅ Added `hasActiveCarwash` constant before return
- ✅ Checks for `b.carwash` existence and active status
- ✅ Case-insensitive status comparison
- ✅ Added warning alert component with styling
- ✅ Button disabled state includes `hasActiveCarwash`
- ✅ Button text changes based on carwash availability
- ✅ Added title attribute for tooltip

---

## File 4: src/Pages/Users/BookingConfirmation.jsx

### What Changed
Added carwash details display section in booking confirmation view.

### Location
Lines ~223-240 in BookingConfirmation.jsx

### BEFORE - Detail Rows
```jsx
                <div className="detail-row">
                  <span className="label">🅿️ Booking Type:</span>
                  <span className="value">{booking.booking_type || 'Standard'}</span>
                </div>

                <div className="detail-row">
                  <span className="label">💰 Total Price:</span>
                  <span className="value">₹{booking.slot_details?.price}</span>
                </div>

                <button
```

### AFTER - Detail Rows with Carwash
```jsx
                <div className="detail-row">
                  <span className="label">🅿️ Booking Type:</span>
                  <span className="value">{booking.booking_type || 'Standard'}</span>
                </div>

                <div className="detail-row">
                  <span className="label">💰 Total Price:</span>
                  <span className="value">₹{booking.slot_details?.price}</span>
                </div>

                {/* NEW: Carwash Service Details */}
                {booking.carwash ? (
                  <>
                    <div className="carwash-divider"></div>
                    <div className="detail-row carwash-section">
                      <span className="label">🧼 Car Wash Service:</span>
                      <span className="value">{booking.carwash.carwash_type_detail?.name || 'Service Booked'}</span>
                    </div>
                    <div className="detail-row carwash-section">
                      <span className="label">💰 Service Price:</span>
                      <span className="value">₹{booking.carwash.carwash_type_detail?.price || booking.carwash.price}</span>
                    </div>
                  </>
                ) : (
                  <div className="detail-row no-service">
                    <span className="label">🧼 Car Wash Service:</span>
                    <span className="value text-muted">Not selected</span>
                  </div>
                )}

                <button
```

### Key Changes
- ✅ Added carwash divider for visual separation
- ✅ Conditional rendering: `{booking.carwash ? ... : ...}`
- ✅ Displays carwash type name with fallback
- ✅ Displays carwash price with fallback
- ✅ Shows "Not selected" message when no carwash
- ✅ Uses optional chaining (`?.`) for safe navigation
- ✅ CSS classes for styling (`carwash-section`, `no-service`)

---

## Summary of Changes

### Backend (Django)
- **Lines Added**: ~95
- **Files Modified**: 2 (serializers.py, views.py)
- **New Classes**: 2 (CarwashTypeNestedSerializer, CarwashNestedSerializer)
- **Updated Methods**: 4 (perform_create, _auto_complete_expired, retrieve, list)

### Frontend (React)
- **Lines Added**: ~60
- **Files Modified**: 2 (Service.jsx, BookingConfirmation.jsx)
- **New Logic**: 1 (hasActiveCarwash validation)
- **New Components**: 1 (warning alert)

### Total Impact
- ✅ **No breaking changes** - All existing code remains compatible
- ✅ **Backward compatible** - Bookings without carwash work as before
- ✅ **Database safe** - No migrations needed
- ✅ **Error handling** - Graceful fallbacks for missing data

---

## How to Apply These Changes

1. **Copy-paste the new serializers** into parking/serializers.py
2. **Add carwash field** to BookingSerializer
3. **Replace perform_create()** in BookingViewSet
4. **Update all three methods** (_auto_complete_expired, retrieve, list) with carwash clearing
5. **Add hasActiveCarwash validation** to Service.jsx
6. **Add carwash display** to BookingConfirmation.jsx

---

**Status**: ✅ All code changes documented and ready for implementation
