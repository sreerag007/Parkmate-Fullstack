# ⏰ Real-Time Server Clock - Quick Reference

## 🚀 Start the System

### 1. Start Backend (Daphne)
```bash
cd parkmate-backend/Parkmate
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application
```
**OR** use the batch file:
```
Double-click: start_daphne.bat
```

### 2. Start Frontend
```bash
cd Parkmate
npm run dev
```

### 3. Verify Connection
Open browser console and look for:
```
🕐 Connecting to time sync WebSocket: ws://localhost:8000/ws/time/
✅ Time sync WebSocket connected
✅ Server time synchronization active
```

## 📡 WebSocket Endpoint
```
ws://localhost:8000/ws/time/
```

## 🎯 Usage in Components

### Get Server Time
```javascript
import { useServerTime } from '@/contexts/TimeContext'

const MyComponent = () => {
  const { serverTime, timeData, isConnected } = useServerTime()
  
  // Use serverTime (Date object)
  console.log(serverTime)  // Current server time as Date
  
  // Or use formatted data
  console.log(timeData.date)       // "2025-12-05"
  console.log(timeData.time)       // "06:15:22 PM"
  console.log(timeData.formatted)  // "Thursday, December 05 2025, 06:15:22 PM"
  
  return <div>{timeData.time}</div>
}
```

### Display Server Clock
```jsx
import ServerClock from '@/components/ServerClock'

// Full display
<ServerClock />

// Compact mode (for headers)
<ServerClock compact={true} />
```

### Validate Dates Against Server Time
```javascript
const { isBeforeServerTime, isAfterServerTime } = useServerTime()

// Check if date is in the past
if (isBeforeServerTime(selectedDate)) {
  toast.error("Cannot book past dates")
}

// Check if date is in the future
if (isAfterServerTime(maxDate)) {
  toast.error("Date too far in future")
}
```

### Calculate Dates Based on Server Time
```javascript
const { serverTime } = useServerTime()

// Use serverTime instead of new Date()
const today = serverTime || new Date()  // Fallback if disconnected
const maxDate = new Date(today)
maxDate.setDate(maxDate.getDate() + 7)
```

## 🔧 Helper Methods

| Method | Description | Example |
|--------|-------------|---------|
| `serverTime` | Current server time (Date object) | `serverTime.getHours()` |
| `timeData` | Detailed time info (all formats) | `timeData.date` |
| `isConnected` | WebSocket connection status | `isConnected ? 'Live' : 'Offline'` |
| `getServerDate()` | Get current server date | `"2025-12-05"` |
| `getServerTime()` | Get current server time | `"06:15:22 PM"` |
| `getServerTimestamp()` | Get Unix timestamp | `1733404522` |
| `isBeforeServerTime(date)` | Check if date is in past | `isBeforeServerTime('2025-12-04')` |
| `isAfterServerTime(date)` | Check if date is in future | `isAfterServerTime('2025-12-10')` |

## 📊 Time Data Structure

```javascript
{
  datetime: "2025-12-05T18:15:22+00:00",    // ISO 8601
  formatted: "Thursday, December 05 2025, 06:15:22 PM",
  date: "2025-12-05",                        // YYYY-MM-DD
  time: "06:15:22 PM",                       // 12-hour format
  time_24h: "18:15:22",                      // 24-hour format
  timestamp: 1733404522,                     // Unix timestamp
  year: 2025,
  month: 12,
  day: 5,
  hour: 18,
  minute: 15,
  second: 22,
  weekday: "Thursday",
  timezone: "UTC",
  connected: true
}
```

## 🎨 ServerClock Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | string | `''` | Custom CSS class |
| `showDate` | boolean | `true` | Show date portion |
| `showTime` | boolean | `true` | Show time portion |
| `compact` | boolean | `false` | Compact mode (for headers) |

## 🔍 Debugging

### Check WebSocket Connection
```javascript
// Browser console
const { isConnected } = useServerTime()
console.log('Connected:', isConnected)
```

### Monitor Time Updates
```javascript
// Browser console (watch timeData change every second)
const { timeData } = useServerTime()
console.log(timeData.time)  // Updates every second
```

### Check Backend Logs
```bash
# Daphne terminal should show:
✅ Time sync WebSocket connected
```

## ⚠️ Common Issues

### ❌ "useServerTime must be used within a TimeProvider"
**Solution:** Make sure `App.jsx` wraps components in `<TimeProvider>`

### ❌ "Time sync WebSocket disconnected"
**Solution:** Make sure Daphne is running (not `python manage.py runserver`)

### ❌ Clock shows "Loading..." forever
**Solution:** Check browser console for WebSocket errors, verify backend is running

## 📈 Performance

- **Message Size:** ~250 bytes per update
- **Update Frequency:** Every 1 second
- **Bandwidth:** ~250 bytes/sec per client
- **Reconnect:** Automatic with exponential backoff

## 🔒 Security

### Client-Side (UX)
```javascript
// Validates using server time
if (isBeforeServerTime(selectedDate)) {
  toast.error("Cannot book past dates")  // ✅ Client validation
}
```

### Server-Side (Security)
```python
# Backend MUST also validate
def validate_scheduled_time(self, value):
    if value.date() < timezone.now().date():
        raise ValidationError("Cannot book past dates")  # ✅ Server validation
```

**Always validate on both client AND server!**

## 📚 Where It's Used

- ✅ **CarWash.jsx** - Date picker, time slot filtering
- ✅ **AdminDashboard.jsx** - Live server clock display
- 🔄 **Slot Booking** - TODO: Integrate server time
- 🔄 **Payments** - TODO: Use server timestamps
- 🔄 **Owner Dashboard** - TODO: Add live clock

---

**Quick Links:**
- [Full Documentation](REALTIME_SERVER_TIME_IMPLEMENTATION.md)
- [WebSocket Setup Guide](WEBSOCKET_SETUP_GUIDE.md)
- [WebSocket Quick Start](WEBSOCKET_QUICKSTART.md)
