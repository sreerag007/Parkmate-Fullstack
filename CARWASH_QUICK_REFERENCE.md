# Carwash Integration - Quick Reference Guide

## TL;DR - What Changed

Three key features added for carwash service integration:

1. **Display Carwash**: Shows in booking confirmation
2. **Prevent Duplicates**: Button disabled if user already has active carwash
3. **Auto-Clear**: Carwash deleted when booking timer expires

---

## 🔧 Code Changes at a Glance

### Backend (Django)

**File: `parking/serializers.py`**
```python
# Added two new serializer classes
class CarwashTypeNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carwash_type
        fields = ["carwash_type_id", "name", "description", "price"]

class CarwashNestedSerializer(serializers.ModelSerializer):
    carwash_type_detail = CarwashTypeNestedSerializer(source="carwash_type", read_only=True)
    class Meta:
        model = Carwash
        fields = ["carwash_id", "carwash_type", "carwash_type_detail", "employee", "price"]

# Updated BookingSerializer
class BookingSerializer(...):
    carwash = CarwashNestedSerializer(source="booking_by_user", read_only=True)
```

**File: `parking/views.py` (BookingViewSet)**
```python
# Duplicate prevention in perform_create()
def perform_create(self, serializer):
    user_profile = UserProfile.objects.get(auth_user=self.request.user)
    
    # Check for active carwash
    has_active_carwash = Booking.objects.filter(
        user=user_profile,
        status__iexact='booked',
        booking_by_user__isnull=False
    ).exists()
    
    if self.request.data.get('carwash_id') and has_active_carwash:
        raise ValidationError({'carwash_id': 'You already have an active car wash service...'})
    
    return serializer.save(user=user_profile)

# Auto-clear carwash in _auto_complete_expired(), retrieve(), and list()
carwash_services = booking.booking_by_user.all()
if carwash_services.exists():
    print(f"🧼 Auto-clearing {carwash_services.count()} carwash service(s)")
    carwash_services.delete()
```

### Frontend (React)

**File: `src/Pages/Users/Service.jsx`**
```jsx
// Check if carwash already active
const hasActiveCarwash = bookings.some(
  (b) => b.carwash && (b.status === 'Booked' || b.status === 'booked' || b.status === 'BOOKED')
)

// Show warning
{hasActiveCarwash && <div className="alert alert-warning">...</div>}

// Disable button
<button disabled={!selectedBooking || !selectedService || hasActiveCarwash}>
  {hasActiveCarwash ? "🚫 Service Already Active" : "Book Car Wash Service"}
</button>
```

**File: `src/Pages/Users/BookingConfirmation.jsx`**
```jsx
{booking.carwash ? (
  <>
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

---

## 🔑 Key Points

| Item | Details |
|------|---------|
| **Related Name** | `booking_by_user` (from Carwash model FK) |
| **Serializer Source** | `source="booking_by_user"` (uses related name) |
| **Status Values** | 'booked', 'completed', 'cancelled' (case-insensitive) |
| **Auto-Clear Locations** | `_auto_complete_expired()`, `retrieve()`, `list()` |
| **Validation Points** | Frontend (UX), API (security) |
| **Display Location** | BookingConfirmation.jsx (below booking details) |
| **Prevention Location** | Service.jsx (button disabled + warning) |

---

## 🧪 Quick Testing

### Test 1: Display
1. Book slot → Select carwash → Go to confirmation
2. ✅ Carwash type and price should appear

### Test 2: Prevent Duplicate
1. Book slot with carwash
2. Open Services page
3. ✅ Button should say "🚫 Service Already Active"

### Test 3: Auto-Clear
1. Book slot with carwash
2. Wait for timer to expire
3. Refresh page
4. ✅ Carwash should disappear from confirmation

---

## 🐛 Debugging Tips

**Button still enabled when it shouldn't be?**
- Check: `booking.carwash` exists in response
- Check: `booking.status` value (case sensitivity)
- Add console log: `console.log('Bookings:', bookings)`

**Carwash not displaying?**
- Check: API response includes `carwash` field
- Check: `carwash.carwash_type_detail?.name` exists
- Verify: BookingSerializer has carwash field with `source="booking_by_user"`

**Carwash not clearing on expiry?**
- Check: Booking `status` becomes 'completed'
- Check: Polling interval (10 seconds default)
- Check: Django logs for "🧼 Auto-clearing" message

**Duplicate booking still allowed via API?**
- Verify: `perform_create()` has validation
- Check: `status__iexact='booked'` for case-insensitive
- Check: User profile exists before checking

---

## 📂 Files to Review

**Understand the flow:**
1. Start: `src/Pages/Users/Service.jsx` (booking carwash)
2. Backend: `parking/views.py` BookingViewSet (validation)
3. API: `parking/serializers.py` (response structure)
4. Display: `src/Pages/Users/BookingConfirmation.jsx` (show carwash)

---

## 🎯 Success Criteria Checklist

- [ ] Carwash displays in booking confirmation ✅
- [ ] Button disabled when duplicate would occur ✅
- [ ] Warning alert shows for active carwash ✅
- [ ] Backend API rejects duplicate bookings ✅
- [ ] Carwash auto-clears when booking expires ✅
- [ ] Works across login/logout ✅
- [ ] Case-insensitive status handling ✅
- [ ] Backward compatible with non-carwash bookings ✅

---

## 🚀 Deployment

1. Copy backend changes to `parking/serializers.py` and `parking/views.py`
2. Copy frontend changes to `src/Pages/Users/Service.jsx` and `BookingConfirmation.jsx`
3. Restart Django backend: `python manage.py runserver`
4. Restart React frontend: `npm run dev`
5. Test the three scenarios above
6. Deploy to production

---

## 📖 Full Documentation

For complete details, see:
- **CARWASH_INTEGRATION.md** - Full documentation
- **CARWASH_IMPLEMENTATION_VERIFICATION.md** - Verification checklist

---

**Status**: ✅ Ready for testing and deployment
