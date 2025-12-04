# WebSocket Setup Guide - Parkmate

## 🎯 Overview
Parkmate uses **Django Channels + Daphne** for real-time WebSocket notifications. This enables live updates for booking statuses, car wash completions, and other events.

## ⚠️ Important: Use Daphne, Not Django Dev Server

### ❌ DO NOT USE (WebSocket won't work):
```bash
python manage.py runserver
```

### ✅ USE THIS INSTEAD (WebSocket enabled):
```bash
# Windows Command Prompt
start_daphne.bat

# OR PowerShell
.\start_daphne.ps1

# OR Manual command
cd parkmate-backend/Parkmate
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application
```

## 🔧 Why This Matters

- **Django Dev Server (manage.py runserver)**: Uses WSGI - only handles HTTP requests ❌
- **Daphne Server**: Uses ASGI - handles both HTTP and WebSocket ✅

**If you run the Django dev server**, WebSockets will fail to connect and you'll see errors in the browser console:
```
WebSocket connection failed
Error: Connection refused
```

## 🚀 How to Start the Backend

### Option 1: Double-click the batch file
1. Navigate to `Integration Parkmate` folder
2. Double-click `start_daphne.bat` (Windows CMD)
3. OR right-click `start_daphne.ps1` → Run with PowerShell

### Option 2: Terminal command
```bash
# From Integration Parkmate directory
cd parkmate-backend/Parkmate
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application --verbosity 2
```

### Option 3: Add to package.json scripts
```json
{
  "scripts": {
    "backend": "cd parkmate-backend/Parkmate && daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application"
  }
}
```

## 📡 WebSocket Architecture

### Backend Components

1. **ASGI Application** (`Parkmate/asgi.py`)
   - Routes WebSocket connections
   - Handles both HTTP and WS protocols

2. **WebSocket Consumer** (`parking/consumers.py`)
   - `NotificationConsumer`: Handles real-time notifications
   - Manages user connections and message broadcasting

3. **Routing** (`parking/routing.py`)
   - WebSocket URL: `ws://localhost:8000/ws/notifications/{user_id}/`

4. **Signal Handlers** (`parking/signals.py`)
   - Listen to model changes (booking created, car wash completed, etc.)
   - Send notifications via Channel Layer

5. **Channel Layer** (`settings.py`)
   - Current: `InMemoryChannelLayer` (development)
   - Production: Use Redis for multi-server support

### Frontend Components

1. **WebSocket Hook** (`hooks/useWebSocketNotifications.js`)
   - Custom React hook for WebSocket connection
   - Auto-reconnect on disconnect
   - Toast notifications on messages

2. **App Integration** (`App.jsx`)
   - `NotificationWrapper` component uses the hook
   - Connects when user is logged in

## 🔌 Connection Flow

```
User Login → Get user ID → Connect WebSocket
                              ↓
                    ws://localhost:8000/ws/notifications/{userId}/
                              ↓
                    NotificationConsumer.connect()
                              ↓
                    Join user group channel
                              ↓
                    ✅ Connection established
```

## 📢 Notification Flow

```
Backend Event (e.g., booking created)
        ↓
Django Signal fired (parking/signals.py)
        ↓
send_ws_notification(user_id, level, message)
        ↓
Channel Layer → User Group
        ↓
NotificationConsumer.send_notification()
        ↓
WebSocket → Frontend
        ↓
useWebSocketNotifications hook receives
        ↓
Toast notification displayed 🎉
```

## 📋 Notification Events

Currently implemented WebSocket notifications:

1. **Timer < 5 min** - Booking expiring soon
2. **Timer = 0** - Booking expired
3. **Renew Success** - Booking renewed successfully
4. **Renew Failure** - Renewal failed
5. **Slot Auto-Expired** - Parking slot expired
6. **Booking Declined** - Admin declined booking
7. **Cash Payment Verified** - Owner verified cash payment
8. **New Booking Created** - Owner receives notification
9. **Car Wash Completed** - User notified when service done
10. **Employee Assigned** - Owner notified of new employee

## 🧪 Testing WebSocket Connection

### 1. Start Daphne Server
```bash
# Terminal 1: Backend
cd parkmate-backend/Parkmate
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application --verbosity 2
```

### 2. Start Frontend
```bash
# Terminal 2: Frontend
cd Parkmate
npm run dev
```

### 3. Check Browser Console
Login and look for:
```
✅ WebSocket connected
🔌 Connecting to WebSocket
   URL: ws://localhost:8000/ws/notifications/{userId}/
   Environment: development
   Frontend: localhost:5173
   Backend: localhost:8000
✅ Real-time notifications active
```

### 4. Trigger a Notification
Create a booking or complete a car wash service. You should see:
```
📬 WebSocket message received: {type: 'success', message: '...'}
```

And a toast notification will appear in the UI.

## 🐛 Troubleshooting

### Problem: WebSocket connection fails

**Symptoms:**
```
❌ WebSocket error
❌ WebSocket disconnected
WebSocket connection to 'ws://localhost:8000/...' failed
```

**Solution:**
- ✅ Make sure you're running **Daphne**, not `manage.py runserver`
- ✅ Check that port 8000 is not already in use
- ✅ Verify backend is running on correct port

### Problem: No notifications received

**Symptoms:**
- WebSocket connected but no messages
- Events triggered but no toast notifications

**Solution:**
- Check Django logs for signal errors
- Verify `parking/signals.py` is being loaded
- Check `send_ws_notification()` is being called
- Ensure Channel Layer is configured

### Problem: "InMemoryChannelLayer" errors

**Symptoms:**
```
AttributeError: 'InMemoryChannelLayer' object has no attribute 'group_send'
```

**Solution:**
- Restart Daphne server
- Check `CHANNEL_LAYERS` setting in `settings.py`
- Verify `channels` package is installed

### Problem: CORS errors with WebSocket

**Symptoms:**
```
WebSocket connection failed: CORS policy
```

**Solution:**
- Add `ALLOWED_HOSTS = ['*']` in `settings.py` (development only)
- For production, configure proper CORS settings

## 🚀 Production Deployment

### 1. Use Redis Channel Layer (recommended)

**Install Redis:**
```bash
pip install channels_redis
```

**Update settings.py:**
```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}
```

### 2. Deploy with ASGI Server

**Options:**
- Daphne (recommended)
- Uvicorn
- Hypercorn

**Example with Daphne:**
```bash
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application
```

### 3. Use Process Manager

**Supervisor Example:**
```ini
[program:parkmate-daphne]
command=/path/to/venv/bin/daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application
directory=/path/to/parkmate-backend/Parkmate
autostart=true
autorestart=true
```

### 4. Secure WebSocket (WSS)

Use Nginx or similar reverse proxy:
```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## 📚 Dependencies

**Backend:**
- Django 5.2.7
- channels==4.3.2
- daphne==4.2.1
- channels_redis (optional, for production)

**Frontend:**
- Native WebSocket API (built into browsers)
- react-toastify (for notifications)

## 🔗 References

- [Django Channels Docs](https://channels.readthedocs.io/)
- [Daphne Documentation](https://github.com/django/daphne)
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

**Last Updated:** December 5, 2025

**Status:** ✅ WebSocket Enabled & Ready
