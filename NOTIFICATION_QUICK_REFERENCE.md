# 🚀 Quick Reference - Notification System

## 📥 Import Statement
```javascript
import { notify } from '../../utils/notify.jsx'
```

---

## 📝 Usage Patterns

### Success Notification
```javascript
notify.success("Slot #45 booked successfully!")
notify.success("Payment of ₹500 confirmed via UPI.")
notify.success("Profile updated successfully!")
```

### Error Notification
```javascript
notify.error("Booking failed. Try again.")
notify.error("Payment failed. Please try again.")
notify.error("Failed to update profile.")
```

### Warning Notification
```javascript
notify.warning("This slot is already booked.")
notify.warning("Your booking will expire in 5 minutes!")
notify.warning("You already have an active car wash service.")
```

### Info Notification
```javascript
notify.info("Your 1-hour timer has started.")
notify.info("Booking expired. Slot released.")
notify.info("Booking auto-marked as completed.")
```

### Confirmation Notification
```javascript
notify.confirm("Payment of ₹500 confirmed!")
notify.confirm("Booking renewed successfully!")
```

---

## 🎨 Color Reference

| Type | Color | Hex | Icon |
|------|-------|-----|------|
| success | Green | #22c55e | ✓ |
| error | Red | #ef4444 | ✗ |
| warning | Yellow | #facc15 | ⚠ |
| info | Blue | #3b82f6 | ℹ |
| confirm | Green | #22c55e | ✓ |

---

## 📋 Common Use Cases

### Booking Success
```javascript
try {
  await api.bookSlot(slotId);
  notify.success(`Slot #${slotId} booked successfully!`);
} catch (error) {
  notify.error("Booking failed.");
}
```

### Payment Confirmation
```javascript
try {
  await api.processPayment(amount);
  notify.success(`Payment of ₹${amount} confirmed!`);
} catch (error) {
  notify.error("Payment failed. Please try again.");
}
```

### Verification Status
```javascript
try {
  await api.verifyCashPayment(paymentId);
  notify.success("Cash payment verified successfully!");
} catch (error) {
  notify.error("Verification failed.");
}
```

### Loading Data
```javascript
try {
  const data = await api.fetchData();
} catch (error) {
  notify.error("Unable to load data.");
}
```

### Warning for Expiry
```javascript
if (timeRemaining <= 5 * 60) {
  notify.warning("Your booking will expire in 5 minutes!");
}
```

### Action Feedback
```javascript
await api.updateProfile(userData);
notify.success("Profile updated successfully!");
```

---

## 🚫 Removed Features (Use Notify Instead)

### ❌ Don't Use
```javascript
alert("Message")           // → notify.info("Message")
window.confirm("Sure?")    // → notify.warning("Action required")
console.error(msg)         // → notify.error(msg)
```

### ✅ Use Instead
```javascript
notify.success("Action successful!")
notify.warning("Warning: This action cannot be undone.")
notify.error("An error occurred.")
notify.info("Information about the operation.")
```

---

## 📱 Mobile Vibration

Automatically triggered - **No additional code needed!**

```javascript
// These automatically include vibration on Android:
notify.success("Booked!")        // 150ms vibration
notify.error("Failed!")          // [100,50,100]ms vibration
notify.warning("Warning!")       // 100ms vibration
notify.confirm("Confirmed!")     // [150,100,150]ms vibration
notify.info("Info")             // No vibration
```

---

## 🔄 Pattern: Try-Catch with Notify

```javascript
const handleAction = async () => {
  try {
    // Perform action
    const result = await api.action();
    
    // Success notification
    notify.success("Action completed!");
    
    // Optional: Do something after
    // setTimeout(() => navigate('/next-page'), 1500);
    
  } catch (error) {
    // Detailed error handling
    if (error.response?.status === 409) {
      notify.warning("Resource already exists.");
    } else if (error.response?.status === 403) {
      notify.error("You don't have permission.");
    } else {
      notify.error("Action failed. Please try again.");
    }
    
    // Log for debugging
    console.error("Error:", error);
  }
};
```

---

## 📊 Real-World Examples

### Slot Booking Flow
```javascript
const handleBookSlot = async (slotId) => {
  try {
    await api.bookSlot(slotId);
    notify.success("Slot #" + slotId + " booked successfully!");
    notify.info("Your 1-hour timer has started.");
    // Redirect after 2 seconds
    setTimeout(() => navigate('/booking-confirmation'), 2000);
  } catch (error) {
    if (error.response?.status === 409) {
      notify.warning("This slot is already booked.");
    } else {
      notify.error("Booking failed. Please try again.");
    }
  }
};
```

### Payment Processing
```javascript
const handlePayment = async (amount, method) => {
  try {
    const result = await api.processPayment(amount, method);
    notify.success(`Payment of ₹${amount} confirmed via ${method}!`);
    
    if (method === 'Cash') {
      notify.warning("Payment pending verification by owner.");
    }
  } catch (error) {
    notify.error("Payment failed. Please try again.");
  }
};
```

### Profile Update
```javascript
const handleProfileUpdate = async (formData) => {
  try {
    await api.updateProfile(formData);
    notify.success("Profile updated successfully!");
  } catch (error) {
    if (error.response?.data?.message) {
      notify.error(error.response.data.message);
    } else {
      notify.error("Failed to update profile.");
    }
  }
};
```

### Car Wash Booking
```javascript
const handleCarWashBooking = async (serviceId) => {
  try {
    await api.bookCarWash(serviceId);
    notify.success("Car wash service added successfully!");
  } catch (error) {
    if (error.response?.status === 409) {
      notify.warning("You already have an active car wash service.");
    } else {
      notify.error("Unable to book car wash. Try again.");
    }
  }
};
```

### Payment Verification (Owner)
```javascript
const handleVerifyPayment = async (paymentId) => {
  try {
    await api.verifyPayment(paymentId);
    notify.success("Cash payment verified successfully!");
    // Reload data
    await loadBookings();
  } catch (error) {
    notify.error("Verification failed.");
  }
};
```

---

## 🎯 Best Practices

✅ **Do:**
- Use clear, concise messages
- Include relevant details (amount, slot number, etc.)
- Use appropriate notification type
- Handle errors gracefully
- Log errors to console for debugging

❌ **Don't:**
- Use success for warnings
- Include technical jargon
- Use all caps (except for variables)
- Make messages too long
- Use notify for critical errors that need confirmation

---

## 📞 Troubleshooting

### Toast Not Showing?
1. Check import: `import { notify } from '../../utils/notify.jsx'`
2. Verify path is correct
3. Check browser console for errors
4. Ensure App.jsx has ToastContainer

### Icons Not Displaying?
1. Verify lucide-react is installed
2. Check that notify.jsx imports icons correctly
3. Rebuild: `npm run build`

### Vibration Not Working?
1. Test on Android device (iOS doesn't support)
2. Check device vibration settings
3. Some browsers/devices may have restrictions

---

## 🔗 Component Integration List

| Component | Status | Type |
|-----------|--------|------|
| OwnerPayments.jsx | ✅ Done | Payment loading |
| OwnerBookings.jsx | ✅ Done | Payment verification |
| DynamicLot.jsx | 🟡 Ready | Slot booking |
| BookingConfirmation.jsx | 🟡 Ready | Payment confirmation |
| Service.jsx | 🟡 Ready | Car wash services |
| Userprof.jsx | 🟡 Ready | Profile updates |
| OwnerServices.jsx | 🟡 Ready | Service management |
| AdminOwners.jsx | 🟡 Ready | Owner management |
| AdminUsers.jsx | 🟡 Ready | User management |

---

**Version**: 1.0
**Last Updated**: November 30, 2025
**Status**: Production Ready ✅
