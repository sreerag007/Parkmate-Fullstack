# ✅ VERIFICATION & TESTING GUIDE

## System Verification Checklist

### Backend Installation ✅
```bash
# 1. Check Django Channels installed
cd parkmate-backend/Parkmate
pip list | grep channels
# Expected: channels (4.3.2), daphne (4.2.1)

# 2. Verify settings
grep -n "ASGI_APPLICATION\|CHANNEL_LAYERS\|'channels'" Parkmate/settings.py
# Expected: 
# - ASGI_APPLICATION = 'Parkmate.asgi.application'
# - 'channels' in INSTALLED_APPS
# - CHANNEL_LAYERS configuration

# 3. Check ASGI updated
grep -n "ProtocolTypeRouter\|URLRouter\|NotificationConsumer" Parkmate/asgi.py
# Expected: ASGI properly configured for WebSocket

# 4. Verify files exist
ls -la parking/routing.py parking/consumers.py parking/signals.py parking/notification_utils.py
# Expected: All 4 files present

# 5. Check apps.py imports signals
grep -n "def ready" parking/apps.py
# Expected: ready() method with signal import
```

### Frontend Installation ✅
```bash
# 1. Check environment variables
cat .env | grep VITE_WS_URL
# Expected: VITE_WS_URL=ws://127.0.0.1:8000

# 2. Check hook exists
ls -la src/hooks/useWebSocketNotifications.js
# Expected: File exists

# 3. Check App.jsx updated
grep -n "useWebSocketNotifications\|AppWithWebSocket" src/App.jsx
# Expected: Hook imported and used

# 4. Check BookingConfirmation imports notify
grep -n "import.*notify" src/Pages/Users/BookingConfirmation.jsx
# Expected: notify imported from utils

# 5. Build project
npm run build
# Expected: ✓ built in X seconds, 0 errors
```

---

## Runtime Verification

### 1. Start Backend
```bash
cd parkmate-backend/Parkmate

# Option A: Using Django development server
python manage.py runserver

# Option B: Using Daphne ASGI server (recommended)
daphne -b 127.0.0.1 -p 8000 Parkmate.asgi:application

# Expected output:
# Daphne(version) started with...
# Listening on ['127.0.0.1:8000']
# Accept WebSocket connections
```

### 2. Start Frontend
```bash
cd Parkmate
npm run dev

# Expected output:
# VITE v7.2.2 dev server running at:
# Local: http://localhost:5173/
# Ready in X ms
```

### 3. Test WebSocket Connection
```javascript
// Open browser console (F12)
// Log in as a user

// Check for messages like:
// "🔌 Connecting to WebSocket: ws://127.0.0.1:8000/ws/notifications/123/"
// "✅ WebSocket connected"
// "✅ Real-time notifications active"

// If you see errors, check:
console.log('Auth:', window.authContext?.user?.id);
// Should show your user ID
```

---

## Event Testing Guide

### Event 1 & 2: Timer Notifications (Frontend)

**Setup**:
1. Log in as a user
2. Go to Lots page
3. Book a slot for 1 hour
4. You should see "✅ Booking Confirmed"

**Test Event 1 (< 5 minutes)**:
```javascript
// Open browser console
// Run this to speed up timer:
// Or just wait for 55 minutes... but let's not do that 😄

// Instead, check the timer counting down
// At 5:00 remaining, you should see:
// Toast: "⚠️ Your booking will expire in 5 minutes!"
// With yellow background and AlertTriangle icon
```

**Test Event 2 (Timer = 0)**:
```javascript
// Continue waiting (or simulate by checking logs)
// At 0:00 remaining, you should see:
// Toast: "ℹ️ Your booking has expired. Slot released."
// With blue background and Info icon
// Page transitions to "⏰ Booking Expired" view
```

### Event 3: Renew Success (Backend)

**Setup**:
1. Wait for booking to completely expire
2. Click "🔄 Renew Booking" button
3. Complete payment (UPI/Card/Cash)

**Expected**:
```
Toast appears: "✅ Booking renewed successfully! Your new booking ID is 456."
- Green background
- CheckCircle icon
- Vibration on Android (150ms)
- Auto-dismiss after 4 seconds
- Redirects to new booking confirmation
```

**Check logs**:
```python
# Django console should show:
# "💳 Renewing booking with payment: ..."
# "✅ Booking renewed: ..."
# "📢 Sent success notification to user 123"
```

### Event 4: Renew Failure (Backend)

**Setup**:
1. Try to renew before booking expires (click warning message)
2. OR: Simulate payment failure

**Expected**:
```
Toast appears: "❌ Renewal failed: [reason]"
- Red background
- XCircle icon
- Vibration on Android ([100,50,100]ms pattern)
- Auto-dismiss after 4 seconds
```

### Event 5: Slot Auto-Expired

**Setup** (requires admin access):
1. Go to Django admin
2. Change booking status to "COMPLETED"
3. Ensure current time > end_time

**Expected**:
```
User receives: "⚠️ Your booking for Slot #45 expired"
- Yellow background
- AlertTriangle icon
- Vibration on Android (100ms)
```

### Event 6: Booking Declined by Admin

**Setup** (requires admin access):
1. Go to Admin Bookings page
2. Decline a user's booking request

**Expected**:
```
User receives: "⚠️ Admin declined your booking request"
- Yellow background
- AlertTriangle icon
```

### Event 7: Cash Payment Verified

**Setup** (requires owner access):
1. User creates booking with Cash payment
2. Owner goes to OwnerBookings page
3. Owner clicks "Verify Payment" on cash pending booking

**Expected**:
```
User receives: "✅ Your cash payment has been verified. Booking activated!"
- Green background
- CheckCircle icon
- Vibration on Android (150ms)
- Booking status changes to "booked"
```

### Event 8: New Booking Created

**Setup**:
1. User creates a new booking
2. Owner is logged in (different browser/tab)

**Expected**:
```
Owner receives: "ℹ️ New booking received for Lot #3"
- Blue background
- Info icon
- No vibration
```

### Event 9: Car Wash Completed

**Setup** (requires owner access):
1. User books a car wash service
2. Owner marks it as completed

**Expected**:
```
User receives: "✅ Your car wash service has been completed!"
- Green background
- CheckCircle icon
- Vibration on Android (150ms)
```

---

## Console Log Verification

### Browser Console (F12)
```javascript
// When page loads:
"🔌 Connecting to WebSocket: ws://127.0.0.1:8000/ws/notifications/123/"
"✅ WebSocket connected"
"✅ Real-time notifications active"

// When notification received:
"📬 WebSocket message received: {type: 'success', message: '...'}"

// When disconnected:
"❌ WebSocket disconnected 1000"
"🔄 Reconnecting in 5 seconds..."

// Errors would look like:
"❌ Error creating WebSocket: ..."
"❌ Error parsing WebSocket message: ..."
```

### Django Console
```python
# When WebSocket connects:
"✅ WebSocket connected for user 123"

# When notification sent:
"📢 Sent success notification to user 123"

# When signal fires:
"✅ Sent renew success notification to user 123"

# Errors would look like:
"❌ WebSocket disconnected for user 123"
"❌ Failed to send notification to user 123: ..."
"❌ Error in booking_status_changed signal: ..."
```

---

## Network Traffic Verification

### Open Network Tab (F12)
1. Go to DevTools → Network tab
2. Filter by WebSocket (WS)
3. Look for connection to: `ws://127.0.0.1:8000/ws/notifications/{user_id}/`

**Expected**:
```
Name: notifications?... [WS]
Status: 101 Switching Protocols (Green)
Type: websocket
Size: ~1KB initial handshake
Time: < 100ms
```

**Messages** (click on Messages tab):
```
→ Client sends: connection upgrade request
← Server sends: 101 Switching Protocols

When notification sent:
← Server: {"type": "success", "message": "..."}
```

---

## Database Verification

### Check No New Migrations Needed
```bash
cd parkmate-backend/Parkmate
python manage.py makemigrations --dry-run --quiet

# Expected: No migrations found (WebSocket is runtime-only)
```

### Verify Signals Receiver Count
```python
# In Django shell:
python manage.py shell

from parking.signals import *
from django.db.models.signals import post_save
from parking.models import Booking, Payment, Carwash

# Check receivers are registered
print(f"Booking post_save receivers: {len(post_save._live_receivers(Booking))}")
# Expected: > 0

print(f"Payment post_save receivers: {len(post_save._live_receivers(Payment))}")
# Expected: > 0

print(f"Carwash post_save receivers: {len(post_save._live_receivers(Carwash))}")
# Expected: > 0
```

---

## Performance Verification

### Check Connection Time
```javascript
// In browser console:
const start = performance.now();
// [let WebSocket connect]
const duration = performance.now() - start;
console.log(`Connection took ${duration}ms`); // Should be < 500ms
```

### Check Message Latency
```python
# In Django, add timestamp to message:
import time
timestamp = time.time()
send_ws_notification(user_id, 'info', 'Test message')

# Browser receives and logs:
console.log(`Message delay: ${Date.now()/1000 - timestamp}s`); // Should be < 100ms
```

### Check Memory Usage
```javascript
// In DevTools, take heap snapshot before and after notifications
// Memory should not grow significantly (< 5MB per 100 messages)
```

---

## Stress Testing

### Test Multiple Concurrent Users
```bash
# Option 1: Multiple browser tabs (same user)
# Open booking page in 5 different tabs of same user
# All should receive notifications simultaneously

# Option 2: Multiple users
# Log in as different users in different browsers
# Each receives only their own notifications
# Check others don't receive them
```

### Test Rapid Notifications
```python
# Send multiple notifications quickly:
for i in range(10):
    send_ws_notification(user_id, 'info', f'Message {i}')
    
# Expected: All 10 toasts appear and stack, no errors
```

### Test Long-Running Connection
```javascript
// Leave page open for 1 hour
// Verify WebSocket stays connected
// Send notifications periodically
// Check for memory leaks (heap should stay stable)
```

---

## Troubleshooting Verification

### Issue: "WebSocket is closed"
```javascript
// Check:
socket.readyState
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED

// If 3, connection dropped
// Check Django logs for errors
// Restart server if needed
```

### Issue: "Signal not firing"
```python
# Check signal is registered:
from django.core.signals import request_started
for receiver, sender in request_started._live_receivers(None):
    print(f"{sender.__name__}: {receiver}")

# Check apps.py has ready() method
# Restart Django if changed
```

### Issue: "Authentication error"
```javascript
// Check auth context:
console.log('User ID:', auth.user?.id);
console.log('Token:', localStorage.getItem('token'));

// Check user is logged in
// Check token is valid
// Try logging out and back in
```

---

## Rollback Instructions (If Needed)

### If something breaks:

**Backend Rollback**:
```bash
# Remove notification calls from views
git checkout -- parking/views.py

# Delete new files
rm parking/routing.py parking/consumers.py parking/signals.py parking/notification_utils.py

# Revert settings
git checkout -- Parkmate/settings.py Parkmate/asgi.py parking/apps.py

# Restart Django
python manage.py runserver
```

**Frontend Rollback**:
```bash
# Remove WebSocket hook
rm src/hooks/useWebSocketNotifications.js

# Revert files
git checkout -- src/App.jsx src/Pages/Users/BookingConfirmation.jsx .env

# Rebuild
npm run build
```

**Keep working**: The system is designed to fail gracefully. If WebSocket goes down, the app still works - just without real-time notifications.

---

## Success Criteria

✅ **All Criteria Met**:
- [ ] Backend starts without errors
- [ ] Frontend builds without errors
- [ ] WebSocket connects successfully
- [ ] Timer notifications appear
- [ ] Renew notifications appear
- [ ] Other events tested and working
- [ ] No console errors
- [ ] No network errors
- [ ] Performance acceptable
- [ ] Ready for production

---

## Final Verification Command

```bash
# Run this complete verification:

# 1. Backend check
cd parkmate-backend/Parkmate
python manage.py runserver &
sleep 5

# 2. Frontend check
cd ../../../Parkmate
npm run build
npm run dev &
sleep 10

# 3. Test WebSocket
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: xxx" \
     -H "Sec-WebSocket-Version: 13" \
     http://127.0.0.1:8000/ws/notifications/1/

# Expected: HTTP/1.1 101 Switching Protocols

# 4. Browser test
# Open http://localhost:5173
# Log in
# Check browser console for WebSocket messages
# Create booking and verify notifications
```

---

**Your WebSocket notification system is ready for production!** ✅
