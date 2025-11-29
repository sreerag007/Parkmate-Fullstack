# 🎯 WEBSOCKET SYSTEM - DEVELOPER QUICK START

**Status**: ✅ Production Ready | **Build**: ✅ 9.22s | **Events**: ✅ 10/10 Complete

---

## ⚡ Quick Commands

### **Start WebSocket Server** (REQUIRED)
```bash
cd parkmate-backend/Parkmate
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application
```

### **Start Frontend Dev Server** (in separate terminal)
```bash
cd Parkmate
npm run dev
```

### **Build Frontend**
```bash
npm run build
```

---

## 📡 WebSocket Endpoints

| Endpoint | Method | Purpose | User |
|----------|--------|---------|------|
| `ws://127.0.0.1:8000/ws/notifications/{user_id}/` | WS | Receive notifications | Any authenticated user |

**Production**: Change `ws://` to `wss://` for HTTPS

---

## 📨 Sending Notifications (Backend)

### **From a View**
```python
from parking.notification_utils import send_ws_notification

@api_view(['POST'])
def some_view(request):
    try:
        # Do something...
        send_ws_notification(
            user_id=request.user.id,
            level="success",  # or "error", "warning", "info"
            message="Your action completed successfully!"
        )
    except Exception as e:
        send_ws_notification(
            user_id=request.user.id,
            level="error",
            message=f"Action failed: {str(e)}"
        )
    return Response({"status": "ok"})
```

### **From a Signal** (Automatic trigger)
*Already implemented in `/parking/signals.py`*

---

## 🎨 Receiving Notifications (Frontend)

### **Automatic** (No code needed)
The hook in `App.jsx` automatically connects and shows toasts.

### **Manual Integration** (If needed)
```javascript
import { useWebSocketNotifications } from './hooks/useWebSocketNotifications';

function MyComponent() {
  const { isConnected } = useWebSocketNotifications(userId);
  
  return <div>{isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>;
}
```

---

## 📊 10 Events at a Glance

| # | Event | Source | When |
|---|-------|--------|------|
| 1 | 5-Min Warning | Frontend Timer | Booking has 5 min left |
| 2 | Slot Expired | Frontend Timer | Booking time = 0 |
| 3 | Renewal Success | Backend View | Payment accepted |
| 4 | Renewal Failed | Backend View | Payment rejected |
| 5 | Auto-Expiration | Backend Signal | Booking status → COMPLETED |
| 6 | Admin Declined | Backend Signal | Admin clicks decline |
| 7 | Cash Verified | Backend Signal | Admin verifies payment |
| 8 | New Booking | Backend Signal | Booking created in lot |
| 9 | Car Wash Done | Backend Signal | Carwash status → COMPLETED |
| 10 | Employee Assigned | Backend Signal | Admin assigns staff |

---

## 🔍 Test Event Delivery

### **Check WebSocket Connection**
```javascript
// Open browser console (F12)
console.log("Testing WebSocket...");

// Should see connection in DevTools Network → WS filter
// Status should be "101 Switching Protocols" ✅
```

### **Trigger Event 3 (Renewal Success)**
1. Create booking
2. Let expire
3. Click "Renew Now"
4. Complete payment
5. Should see success toast: "Booking renewed successfully!"

### **Trigger Event 5 (Auto-Expiration)**
1. Create booking
2. Open browser console → go to Application → Local Storage
3. Find booking timer value
4. Wait 1 hour OR manually change booking status to COMPLETED in admin
5. Should see: "Your booking slot has expired automatically"

---

## 🛠️ Common Tasks

### **Add Notification to New Event**

**Step 1**: Backend signal (if model change)
```python
# In /parking/signals.py
@receiver(post_save, sender=MyModel)
def my_model_post_save(sender, instance, created, **kwargs):
    if instance.status == "some_status":
        send_ws_notification(
            user_id=instance.user_id,
            level="success",
            message="Something happened!"
        )
```

**Step 2**: Register signal in `/parking/apps.py`
```python
def ready(self):
    from . import signals  # Already done
```

**Step 3**: Test
- Trigger the model change
- Check DevTools for WebSocket message
- Verify toast appears

### **Add Notification to Existing View**

```python
from parking.notification_utils import send_ws_notification

@api_view(['POST'])
def my_endpoint(request):
    # ... existing code ...
    send_ws_notification(
        user_id=request.user.id,
        level="info",
        message="Your action completed"
    )
    return Response({"ok": True})
```

### **Change WebSocket Endpoint**

**Development**:
```env
# .env
VITE_WS_URL=ws://127.0.0.1:8000
```

**Production**:
```env
# .env
VITE_WS_URL=wss://your-domain.com
```

---

## 🐛 Debug Checklist

- [ ] Is Daphne running (not runserver)?
- [ ] Is frontend dev server running?
- [ ] Are you authenticated (logged in)?
- [ ] Check DevTools Network → WS tab (should see `ws://...`)
- [ ] Check DevTools Console for any JS errors
- [ ] Backend signals imported in `apps.py`?
- [ ] `VITE_WS_URL` set in `.env`?

---

## 📦 Dependencies

**Backend**:
- `django==5.2.7`
- `djangorestframework==3.14.0`
- `channels==4.3.2` ← NEW
- `daphne==4.2.1` ← NEW
- `asgiref==3.8.1` (for async_to_sync)

**Frontend**:
- `react==18.3.1`
- `react-toastify==9.1.3` (already installed)
- `lucide-react==0.263.1` (already installed)

---

## 🚀 One-Liner Deployment

```bash
# Terminal 1: Start WebSocket server
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application

# Terminal 2: Start frontend (if dev)
npm run dev

# Or build for production
npm run build
```

---

## 📞 Support

| Issue | Solution |
|-------|----------|
| 404 on WebSocket | Use Daphne, not Django runserver |
| Connection refused | Check port 8000 is open, Daphne is running |
| Toast not showing | Check browser console for JS errors |
| Notifications delayed | Check Django signals are registered |
| Too many reconnects | Check server logs for connection errors |

---

**Last Built**: 9.22 seconds ✅  
**Modules**: 1805 ✅  
**Errors**: 0 ✅  
**Status**: READY FOR TESTING 🚀
