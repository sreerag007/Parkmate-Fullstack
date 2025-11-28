# 🧪 Quick Test Guide - Multiple Booking Timers

## Prerequisites
- Fresh build of React app (`npm run build` or dev server running)
- Clear browser cache (F12 → Application → Cache → Clear)
- Multiple test bookings available (or ability to create them)

---

## 🚀 Quick Test (5 minutes)

### Step 1: Create Multiple Test Bookings
1. Navigate to `/lots`
2. Book Lot A, Slot 1 (any vehicle)
3. Go back to home
4. Book Lot B, Slot 3 (same or different vehicle)
5. Go back to home

**Expected**: Two booking cards visible with independent timers

### Step 2: Verify Independent Timers
1. Note the time on Booking 1 (e.g., 00:59:45)
2. Note the time on Booking 2 (e.g., 00:59:42)
3. Wait 5 seconds
4. **Verify**: 
   - Booking 1 shows ~00:59:40
   - Booking 2 shows ~00:59:37
   - Both decreased by ~5 seconds
   - Times are independent (not synchronized)

### Step 3: Test Navigation
1. Click "📊 Full View" on Booking 1
2. **Expected**: Redirected to booking confirmation page
3. **Verify**: Timer continues from same value
4. Go back to home (browser back button)
5. **Expected**: Both timers still visible and counting

### Step 4: Test Persistence
1. Note the timer value (e.g., 00:55:30)
2. Refresh page (F5)
3. **Expected**: Timer shows ~00:55:28-29 (decreased by ~1-2 sec)
4. **Not Expected**: Timer reset to original value

**✅ If all 4 steps pass, multiple booking timers are working!**

---

## 📝 Detailed Test Cases

### Test A: Display All Bookings
**Precondition**: User has 3 active bookings

**Steps**:
1. Navigate to home page
2. Scroll to "Active Bookings" section

**Expected Results**:
- [ ] All 3 bookings displayed as cards
- [ ] Each card shows: lot name, slot number, vehicle
- [ ] Each card has independent timer
- [ ] "⏱️ Active Bookings (3)" header shows count
- [ ] Cards arranged in responsive grid

**Console Logs**:
```javascript
// Should show:
📊 Bookings data: [3 bookings]
📊 Active bookings: [3 bookings]
📊 Number of active bookings: 3
```

---

### Test B: Timer Countdown Accuracy
**Precondition**: 1 active booking with end_time in ~2 minutes

**Steps**:
1. Open home page
2. Note timer value: T1 = 00:02:00
3. Wait 10 seconds
4. Note timer value: T2 = 00:01:50
5. Check: T1 - T2 ≈ 10 seconds

**Expected Results**:
- [ ] Timer decrements by exactly 1 second per second
- [ ] No jumps or resets
- [ ] Format is HH:MM:SS
- [ ] Timer is monospace font
- [ ] Timer is large and visible

---

### Test C: Expiring Soon Alert
**Precondition**: 1 active booking with < 5 minutes remaining

**Steps**:
1. Open home page
2. Look for "⚠️ Expiring Soon" text

**Expected Results**:
- [ ] Orange border on card (not blue)
- [ ] "⚠️ Expiring Soon" badge displayed
- [ ] Card has pulse animation (subtle)
- [ ] Text pulses (opacity changes)
- [ ] Alert appears when remaining < 5 min
- [ ] Alert disappears when >= 5 min

---

### Test D: Full View Navigation
**Precondition**: 2+ active bookings

**Steps**:
1. Click "📊 Full View" on any booking card
2. Note the booking ID in URL: `?booking=123`
3. Verify you see the detailed booking confirmation page
4. Check timer continues normally
5. Go back to home page
6. Verify the same booking card is still visible

**Expected Results**:
- [ ] Correct booking ID in URL
- [ ] Booking Confirmation page loads
- [ ] Timer continues from same value
- [ ] Can navigate back to home
- [ ] All cards still visible on return
- [ ] No errors in console

---

### Test E: Responsive Layout
**Precondition**: 3 active bookings

**Desktop (> 768px)**:
1. Open home page
2. Note number of cards per row

**Expected**: 2-3 cards per row

**Tablet (640px - 768px)**:
1. Resize browser to 700px width
2. Note number of cards per row

**Expected**: 1-2 cards per row

**Mobile (< 640px)**:
1. Resize browser to 480px width
2. Note number of cards per row

**Expected**: 
- [ ] Exactly 1 card per row
- [ ] Text sizes reduced proportionally
- [ ] Timer font size still readable (20px+)
- [ ] Padding reduced
- [ ] No horizontal scroll

---

### Test F: No Active Bookings
**Precondition**: All bookings expired or completed

**Steps**:
1. Navigate to home page
2. Check for "Active Bookings" section

**Expected Results**:
- [ ] MultiBookingTimer not displayed
- [ ] No empty cards shown
- [ ] "Available Lots" section shows normally
- [ ] No errors in console
- [ ] Page layout unaffected

---

### Test G: Expired Booking Handling
**Precondition**: 1 booking with < 10 seconds remaining

**Steps**:
1. Open home page
2. Watch timer count down to 00:00:00
3. Wait another 5 seconds

**Expected Results**:
- [ ] Timer reaches 00:00:00
- [ ] Text changes to "Expired"
- [ ] Card color changes (orange border)
- [ ] Timer stops updating
- [ ] No errors in console
- [ ] Interval properly cleaned up

---

### Test H: Multiple Timers Independent
**Precondition**: 3 bookings created at different times

**Steps**:
1. Open home page
2. Note three different timer values
3. Wait 10 seconds
4. All timers should have decreased by ~10 seconds
5. Check: All timers have independent values (not synchronized)

**Expected Results**:
- [ ] Each timer shows different value
- [ ] Each timer decrements independently
- [ ] Times do NOT synchronize
- [ ] No shared state between cards
- [ ] Each interval fires independently

---

### Test I: Browser Refresh Persistence
**Precondition**: 2 active bookings

**Steps**:
1. Note timer value: T1 = 00:45:30
2. Press F5 (refresh)
3. Wait for page to load
4. Note new timer value: T2

**Expected Results**:
- [ ] T2 ≈ T1 - 1-2 seconds (not reset to original)
- [ ] Timer recalculated from backend end_time
- [ ] All bookings still visible
- [ ] No data loss
- [ ] No console errors

**Not Expected**:
- ❌ Timer resets to 1:00:00
- ❌ Bookings disappeared
- ❌ "Loading..." state persists

---

### Test J: Cross-Device Sync
**Precondition**: 1 booking, access to 2 devices/tabs

**Steps**:
1. Open home page on Device A, note timer: T_A = 00:30:00
2. Open home page on Device B, note timer: T_B = 00:30:00
3. Wait 30 seconds on Device A
4. Check timer on Device B (without refresh)

**Expected Results**:
- [ ] Device A: ~00:29:30
- [ ] Device B: Still shows ~00:30:00 (until next component update)
- [ ] Refresh Device B: Shows ~00:29:30 (synced with server)
- [ ] Both devices using backend end_time as source

**Note**: Without WebSocket, Device B won't auto-update until next refresh or navigation.

---

## 🔍 Console Debugging

Open F12 → Console and look for:

```javascript
// Good signs:
📊 Bookings data: Array(3)
📊 Active bookings: Array(3)
📊 Number of active bookings: 3

// Bad signs:
❌ Error: Cannot read property 'status'
❌ Booking not found
❌ Invalid end_time format
```

---

## 🐛 If Something Goes Wrong

### Timers not showing
1. Check: Are there active bookings? (See console logs)
2. Check: Is booking status exactly "booked"? (case-insensitive)
3. Check: Does booking.end_time exist?
4. Fix: Verify API response includes end_time field

### Timers incorrect
1. Check: Is server time correct?
2. Check: Browser clock synchronized?
3. Fix: Compare server time vs browser time (Network tab)

### Cards not clickable
1. Check: "📊 Full View" button not disabled?
2. Check: Booking ID is correct?
3. Fix: Try other navigation first (test links)

### Performance slow
1. Check: Number of active bookings (< 20?)
2. Check: Console for errors or warnings
3. Fix: Look for excessive re-renders (React DevTools)

---

## ✅ Final Checklist

- [ ] Multiple bookings display as cards
- [ ] Each booking has independent timer
- [ ] Timers count down in real-time
- [ ] "Expiring Soon" alert works
- [ ] Navigation to full view works
- [ ] Page refresh persists timers
- [ ] Responsive design works (tested on mobile)
- [ ] No console errors
- [ ] No memory leaks (DevTools → Performance)
- [ ] Animation smooth (no jank)

---

## 📊 Expected Behavior Summary

| Scenario | Before | After |
|----------|--------|-------|
| 1 active booking | Shows 1 card | Shows 1 card ✅ |
| 3 active bookings | Shows only latest | Shows all 3 ✅ |
| Booking expires | Manual completion | Auto-expires ✅ |
| Refresh page | Timer resets | Timer persists ✅ |
| Multiple tabs | No sync | Server-synced ✅ |
| Mobile view | Single layout | Responsive grid ✅ |
| Expiring < 5 min | No alert | Shows warning ✅ |

---

**Testing Complete!** 🎉

If all tests pass, the multiple booking timer feature is working correctly.
