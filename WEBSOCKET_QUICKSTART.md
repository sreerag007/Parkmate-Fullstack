# 🎯 Quick Start: WebSocket-Enabled Backend

## ✅ WebSocket Re-Enabled!

WebSocket notifications have been **re-enabled** in the frontend. 

## 🚀 How to Run Backend (Choose ONE method)

### Method 1: Batch File (Easiest)
```
Double-click: start_daphne.bat
```

### Method 2: PowerShell Script
```powershell
.\start_daphne.ps1
```

### Method 3: Manual Command
```bash
cd parkmate-backend\Parkmate
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application
```

## ⚠️ CRITICAL: Do NOT Use Django Dev Server

**❌ WRONG (WebSocket will fail):**
```bash
python manage.py runserver
```

**✅ CORRECT (WebSocket works):**
```bash
daphne -b 0.0.0.0 -p 8000 Parkmate.asgi:application
```

## 🔍 How to Verify It's Working

1. **Start Daphne** (use one of the methods above)
2. **Start Frontend** (`npm run dev`)
3. **Login** to the application
4. **Open Browser Console** (F12)
5. **Look for:**
   ```
   ✅ WebSocket connected
   ✅ Real-time notifications active
   ```

## 📡 WebSocket Endpoint

```
ws://localhost:8000/ws/notifications/{user_id}/
```

## 🎉 What Works Now

- ✅ Real-time booking notifications
- ✅ Car wash completion alerts
- ✅ Payment verification notifications
- ✅ Live updates for owners
- ✅ Toast notifications in UI

## 📚 Full Documentation

See `WEBSOCKET_SETUP_GUIDE.md` for complete details.

---

**Status:** ✅ WebSocket ENABLED
**Date:** December 5, 2025
