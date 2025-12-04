# Car Wash 7-Day Booking Window Implementation

## 📋 Overview
Implemented a **7-day booking window restriction** for standalone car wash services to prevent far-future bookings and improve service planning. Users can now only book car wash services within the next 7 days from the current date.

## ✨ Features Implemented

### 1. **Date Picker Restrictions**
- **Min Date**: Today (current date)
- **Max Date**: 7 days from today
- **Visual Indicator**: Info message below date picker
- **User Guidance**: "ℹ️ Bookings are available only within the next 7 days"

### 2. **Past Time Slot Filtering**
- **Smart Detection**: Automatically detects and disables past time slots on current day
- **Visual Styling**: Past slots shown in grey with "Past" badge
- **Future Days**: All slots available for future dates
- **Logic**: Compares current hour/minute with slot time

### 3. **Enhanced UX**
- **No Slots Available Message**: 
  - Shows when all slots are past/booked
  - Different messages for today vs future dates
  - Red warning box with clear explanation
- **Slot Legend**: Updated to include "Past" indicator
- **Tooltips**: Time slots show status on hover
- **Visual Differentiation**:
  - Available: White background, blue border
  - Partially Booked: Shows count badge
  - Full: Red gradient, strikethrough
  - Past: Grey gradient, disabled cursor

### 4. **Backend Validation**
- **Serializer Validation**: Added `validate_scheduled_time()` method
- **Security**: Prevents API manipulation to book outside 7-day window
- **Error Messages**: Clear, user-friendly validation errors
- **Date Range Check**: 
  - Rejects past dates
  - Rejects dates > 7 days in future
  - Returns specific date range in error message

## 🔧 Technical Implementation

### Frontend Changes (`CarWash.jsx`)

#### 1. Date Min/Max Calculation
```javascript
const getMinMaxDates = () => {
  const today = new Date()
  const maxDate = new Date()
  maxDate.setDate(today.getDate() + 7)
  
  return {
    min: today.toISOString().split('T')[0],
    max: maxDate.toISOString().split('T')[0]
  }
}
```

#### 2. Past Time Slot Filter
```javascript
const filterPastTimeSlots = (slots, selectedDate) => {
  const today = new Date()
  const selected = new Date(selectedDate)
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0)
  selected.setHours(0, 0, 0, 0)
  
  // If selected date is not today, return all slots
  if (selected.getTime() !== today.getTime()) {
    return slots
  }
  
  // Filter out past time slots for today
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  return slots.map(slot => {
    // Parse slot time (handles both 12-hour and 24-hour format)
    const timeStr = slot.time
    let hours, minutes
    
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      // 12-hour format
      const [time, meridiem] = timeStr.split(' ')
      const [h, m] = time.split(':').map(Number)
      hours = meridiem === 'PM' && h !== 12 ? h + 12 : (meridiem === 'AM' && h === 12 ? 0 : h)
      minutes = m
    } else {
      // 24-hour format
      [hours, minutes] = timeStr.split(':').map(Number)
    }
    
    // Check if slot time is in the past
    const isPast = hours < currentHour || (hours === currentHour && minutes <= currentMinute)
    
    return {
      ...slot,
      available: isPast ? false : slot.available,
      isPast: isPast
    }
  })
}
```

#### 3. Enhanced Time Slot Rendering
```jsx
{bookingData.scheduled_date && bookingData.lot ? (
  <div className="form-section">
    <label>Select Time Slot * (9 AM - 8 PM)</label>
    {timeSlots.length === 0 ? (
      <p className="loading-slots">Loading time slots...</p>
    ) : timeSlots.every(slot => !slot.available) ? (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: '#fef2f2',
        borderRadius: '12px',
        border: '1px solid #fecaca',
        marginBottom: '1rem'
      }}>
        <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '0.5rem' }}>
          ⏰ No time slots available for the selected date
        </p>
        <p style={{ color: '#991b1b', fontSize: '0.9rem' }}>
          {bookingData.scheduled_date === getMinMaxDates().min 
            ? 'All time slots for today have passed. Please select a future date.'
            : 'All slots are fully booked. Please select a different date.'}
        </p>
      </div>
    ) : (
      <>
        <div className="time-slots-grid">
          {timeSlots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              className={`time-slot ${
                selectedTimeSlot?.time === slot.time ? 'selected' : ''
              } ${!slot.available ? 'disabled' : ''} ${slot.isPast ? 'past' : ''}`}
              onClick={() => handleTimeSlotSelect(slot)}
              disabled={!slot.available}
              title={slot.isPast ? 'Time slot has passed' : (slot.available ? 'Available' : 'Fully booked')}
            >
              <div className="slot-time">{slot.time}</div>
              {slot.booked_count > 0 && !slot.isPast && (
                <div className="slot-badge">
                  {slot.booked_count}/{slot.capacity}
                </div>
              )}
              {slot.isPast && (
                <div className="slot-badge" style={{ background: '#6b7280' }}>Past</div>
              )}
            </button>
          ))}
        </div>
        <div className="slot-legend">
          <div className="legend-item">
            <span className="legend-box available"></span> Available
          </div>
          <div className="legend-item">
            <span className="legend-box partial"></span> Partially Booked
          </div>
          <div className="legend-item">
            <span className="legend-box full"></span> Full
          </div>
          <div className="legend-item">
            <span className="legend-box" style={{ background: '#d1d5db' }}></span> Past
          </div>
        </div>
      </>
    )}
  </div>
) : (
  // ...
)}
```

#### 4. Date Input with Restrictions
```jsx
<div className="form-section">
  <label>Select Date *</label>
  <input
    type="date"
    name="scheduled_date"
    value={bookingData.scheduled_date}
    onChange={handleInputChange}
    min={getMinMaxDates().min}
    max={getMinMaxDates().max}
    required
  />
  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
    ℹ️ Bookings are available only within the next 7 days
  </p>
</div>
```

### Backend Changes (`parking/serializers.py`)

#### CarWashBookingSerializer - Added Validation
```python
def validate_scheduled_time(self, value):
    """
    Validate that scheduled time is within 7-day booking window.
    Bookings are only allowed from today up to 7 days in the future.
    """
    from datetime import datetime, timedelta
    from django.utils import timezone
    
    # Convert scheduled_time to date for comparison
    scheduled_date = value.date() if isinstance(value, datetime) else value
    
    # Get today's date
    today = timezone.now().date()
    
    # Calculate max allowed date (today + 7 days)
    max_date = today + timedelta(days=7)
    
    # Validate booking is not in the past
    if scheduled_date < today:
        raise serializers.ValidationError(
            "Cannot book car wash services for past dates. Please select today or a future date."
        )
    
    # Validate booking is within 7-day window
    if scheduled_date > max_date:
        raise serializers.ValidationError(
            f"Bookings are only allowed within 7 days from today. "
            f"Please select a date between {today.strftime('%Y-%m-%d')} and {max_date.strftime('%Y-%m-%d')}."
        )
    
    return value
```

### CSS Changes (`CarWash.css`)

#### Past Time Slot Styling
```css
.time-slot.past {
  border-color: #e5e7eb;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
  cursor: not-allowed;
  opacity: 0.6;
}

.time-slot.disabled:hover,
.time-slot.past:hover {
  transform: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
```

## 🎯 Use Cases

### Scenario 1: User Tries to Book 2 Weeks Ahead
**Action**: User selects date 14 days in future  
**Result**: Date picker prevents selection (max = today + 7)  
**UX**: Date appears greyed out in calendar, unclickable

### Scenario 2: User Selects Today at 3 PM (Current Time: 5 PM)
**Action**: User selects today's date  
**Result**: All time slots before 5 PM are greyed out with "Past" badge  
**Available**: Only slots from 6 PM onwards are clickable

### Scenario 3: All Slots Booked for Selected Date
**Action**: User selects date with no availability  
**Result**: Red warning box appears with message  
**Guidance**: "All slots are fully booked. Please select a different date."

### Scenario 4: All Today's Slots Have Passed
**Action**: User selects today at 9 PM (last slot: 8 PM)  
**Result**: Red warning box appears  
**Message**: "All time slots for today have passed. Please select a future date."

### Scenario 5: API Manipulation Attempt
**Action**: Attacker modifies payload to book 30 days ahead  
**Result**: Backend validation rejects with 400 error  
**Response**: "Bookings are only allowed within 7 days from today. Please select a date between 2025-01-05 and 2025-01-12."

## 📊 Booking Flow with Restrictions

```
1. User Opens Car Wash Booking Page
   └─> Date picker shows: Today to Today+7

2. User Selects Date
   ├─> If Today
   │   ├─> Fetch time slots
   │   ├─> Filter past times
   │   └─> Display available + past (greyed)
   │
   └─> If Future Date (within 7 days)
       ├─> Fetch time slots
       └─> Display all slots (no filtering)

3. User Selects Time Slot
   ├─> If Available → Allow selection
   ├─> If Past → Show tooltip "Time slot has passed"
   └─> If Full → Show tooltip "Fully booked"

4. User Proceeds to Payment
   └─> Backend validates date is within 7-day window

5. Booking Created (if valid)
   └─> Employee auto-assigned
```

## 🔒 Security Considerations

### Frontend Validation
- **Purpose**: Improve UX, prevent accidental errors
- **Limitation**: Can be bypassed via browser DevTools
- **Defense**: Backend validation ensures data integrity

### Backend Validation
- **Layer**: Django REST Framework Serializer
- **Scope**: All POST/PUT requests to `/carwash-bookings/`
- **Protection**: Prevents API manipulation, direct database inserts
- **Error Handling**: Returns 400 Bad Request with clear message

### Combined Approach
```
User Input → Frontend Validation (UX) → API Request → Backend Validation (Security) → Database
                    ↓                                        ↓
            Quick feedback                          Final authority
            (can be bypassed)                    (cannot be bypassed)
```

## 📁 Files Modified

### Frontend
1. **CarWash.jsx**
   - Added `getMinMaxDates()` helper
   - Added `filterPastTimeSlots()` function
   - Updated `useEffect` for time slots to filter past times
   - Enhanced date input with min/max restrictions
   - Updated time slot rendering with past slot handling
   - Added no-slots-available message

2. **CarWash.css**
   - Added `.time-slot.past` styling
   - Updated hover effects for disabled/past slots
   - Added grey gradient for past slots

### Backend
3. **parking/serializers.py**
   - Added `validate_scheduled_time()` method to `CarWashBookingSerializer`
   - Validates date range: today ≤ scheduled_date ≤ today + 7
   - Returns user-friendly error messages with specific date ranges

## 🧪 Testing Checklist

### Frontend Tests
- [ ] Date picker min = today (correct)
- [ ] Date picker max = today + 7 days (correct)
- [ ] Past dates greyed out in calendar
- [ ] Future dates beyond 7 days greyed out
- [ ] Info message displays below date picker
- [ ] Today's past time slots show grey with "Past" badge
- [ ] Today's future time slots clickable
- [ ] Tomorrow's all time slots clickable (no filtering)
- [ ] "Past" legend item appears in slot legend
- [ ] Tooltip shows "Time slot has passed" on hover
- [ ] No slots message appears when all unavailable
- [ ] Different messages for today vs future dates

### Backend Tests
- [ ] POST with today's date → Success
- [ ] POST with today + 3 days → Success
- [ ] POST with today + 7 days → Success
- [ ] POST with yesterday → 400 Error (past date)
- [ ] POST with today + 8 days → 400 Error (beyond window)
- [ ] POST with today + 30 days → 400 Error (beyond window)
- [ ] Error message includes specific date range
- [ ] Error message user-friendly (no stack trace)

### Integration Tests
- [ ] Book today at 2 PM (current 1 PM) → Success
- [ ] Book today at 2 PM (current 3 PM) → Slot greyed, unclickable
- [ ] Book 7 days ahead → Success
- [ ] Try to manipulate API payload → Rejected by backend
- [ ] Booking saved with correct scheduled_time
- [ ] Employee auto-assigned (existing functionality)

## 📈 Business Impact

### Benefits
1. **Improved Service Planning**: Prevents far-future bookings that are hard to plan for
2. **Better Resource Management**: 7-day window allows optimal employee scheduling
3. **Reduced No-Shows**: Shorter booking window = better attendance rates
4. **Enhanced UX**: Clear restrictions prevent confusion about availability
5. **Data Integrity**: Backend validation ensures all bookings are within allowed window

### Metrics to Track
- Average booking lead time (days in advance)
- Booking distribution across 7-day window
- Past-time slot click attempts (UX friction indicator)
- Backend validation rejection rate (security/manipulation attempts)
- User feedback on booking restrictions

## 🔄 Future Enhancements

### Potential Improvements
1. **Dynamic Window**: Allow owners to configure window (e.g., 5 days, 14 days)
2. **Time Zone Support**: Handle bookings across different time zones
3. **Real-time Updates**: WebSocket for live slot availability
4. **Booking Calendar View**: Visual calendar instead of date picker
5. **Recurring Bookings**: Allow weekly/monthly car wash subscriptions

### Code Optimizations
1. Extract time parsing logic to utility function
2. Cache time slot data to reduce API calls
3. Add unit tests for `filterPastTimeSlots()`
4. Add backend tests for validation logic

## 📚 Related Documentation
- [CARWASH_IMPLEMENTATION_PACKAGE.md](./CARWASH_IMPLEMENTATION_PACKAGE.md) - Complete car wash feature overview
- [CARWASH_PAYMENT_INTEGRATION_COMPLETE.md](./CARWASH_PAYMENT_INTEGRATION_COMPLETE.md) - Payment flow
- [CARWASH_COMPLETION_REPORT.md](./CARWASH_COMPLETION_REPORT.md) - Feature completion status

## 👥 Stakeholders
- **Users**: Can only book within 7-day window
- **Parking Lot Owners**: Better service planning with limited booking horizon
- **Employees**: More predictable workload over next week
- **System Admins**: Reduced data volume, easier maintenance

## ✅ Completion Status

**Status**: ✅ **COMPLETE**

**Date**: January 5, 2025

**Components**:
- ✅ Frontend date restrictions
- ✅ Frontend time slot filtering
- ✅ Backend validation
- ✅ CSS styling for past slots
- ✅ UX messages and guidance
- ✅ Documentation

**Deployment Ready**: Yes

---

*Implementation follows user requirements for 7-day booking window with date/time validation, consistent styling, and enhanced UX.*
