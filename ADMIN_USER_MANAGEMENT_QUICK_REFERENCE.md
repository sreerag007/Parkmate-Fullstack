# Admin User Management - Quick Reference Guide

## 🚀 Quick Start

Navigate to: **Admin Dashboard → Manage Users**

---

## 📋 Common Tasks

### 1️⃣ **View User Details**
```
Click: "View Details" button on user row
See: Profile, Vehicle, Bookings, Payments, Reviews
```

### 2️⃣ **Temporarily Disable a User**
```
1. Click "View Details"
2. Click "🔒 Disable User"
3. User status → 🟡 Disabled
4. User cannot log in
✅ Reversible (data preserved)
```

### 3️⃣ **Re-enable a Disabled User**
```
1. Filter: "Disabled Only"
2. Click "View Details" on user
3. Click "✅ Enable User"
4. User status → 🟢 Active
5. User can log in again
```

### 4️⃣ **Permanently Delete a User**
```
1. Click "View Details"
2. Click "🗑️ Delete User"
3. Review cascade warning
4. Click "Confirm Delete"
⚠️ Irreversible (deletes all data)
```

### 5️⃣ **Search for a User**
```
Search by:
• Name (John Doe)
• Username (john_doe)
• Phone (9876543210)
• Vehicle (KL-01-AB-1234)
```

### 6️⃣ **Filter by Status**
```
Dropdown options:
• All Status
• Active Only (🟢)
• Disabled Only (🟡)
```

---

## 🎯 Status Badges

| Badge | Meaning | User Can Login? |
|-------|---------|-----------------|
| 🟢 Active | User account enabled | ✅ Yes |
| 🟡 Disabled | User account suspended | ❌ No |

---

## 📊 Statistics Shown

### **Profile Information** 👤
- Username, Email, Full Name, Phone
- Date Joined, Last Updated

### **Vehicle Information** 🚗
- Vehicle Number, Type, Driving License

### **Booking Statistics** 📅
- Total Slot Bookings
- Total Carwash Bookings
- Combined Total
- Last Booking Date

### **Payment Statistics** 💰
- Total Transactions
- Total Amount Spent (₹)
- Last Payment Date

### **Review Statistics** ⭐
- Total Reviews Given
- Average Rating Given

---

## ⚠️ Important Warnings

### **Disable vs Delete**

#### **Disable** (🔒 Disable User)
- ✅ User cannot log in
- ✅ All data preserved
- ✅ Reversible action
- ✅ Use for: Suspicious activity, temporary suspension

#### **Delete** (🗑️ Delete User)
- ❌ User account removed
- ❌ All bookings deleted
- ❌ All payments deleted
- ❌ All reviews deleted
- ❌ Permanent and irreversible
- ⚠️ Use for: Confirmed fraudulent accounts only

---

## 🔍 Search Tips

### **Exact Match**
```
Search: "KL-01-AB-1234" → Finds exact vehicle
```

### **Partial Match**
```
Search: "John" → Finds all Johns (first or last name)
```

### **Combined Filter**
```
Search: "9876" + Filter: "Active Only"
→ Active users with phone containing 9876
```

---

## 📞 What Gets Deleted?

When you delete a user, the system removes:

```
❌ User Account (login credentials)
❌ Profile Information
❌ All Slot Bookings (X bookings)
❌ All Carwash Bookings (X bookings)
❌ All Payment Records (X transactions)
❌ All Reviews (X reviews)
```

**The system shows exact counts before deletion.**

---

## 🛡️ Security Features

### **Admin-Only Access**
All user management requires admin role:
- View user details ✅
- Toggle status ✅
- Delete users ✅

### **Confirmation Required**
- Disable: No confirmation (reversible)
- Enable: No confirmation (safe action)
- Delete: **Confirmation with cascade warning**

---

## 🎨 Visual Guide

### **Table Layout**
```
┌────────┬──────────┬──────────┬────────┬─────────┬──────┬─────────────┐
│ Status │ Name     │ Username │ Phone  │ Vehicle │ Type │ Actions     │
├────────┼──────────┼──────────┼────────┼─────────┼──────┼─────────────┤
│ 🟢     │ John Doe │ john_doe │ 987... │ KL-01.. │ Sedan│ View Details│
└────────┴──────────┴──────────┴────────┴─────────┴──────┴─────────────┘
```

### **Action Buttons in Modal**
```
Bottom of View Details modal:

[🔒 Disable User]  OR  [✅ Enable User]    [🗑️ Delete User]
   (Orange)              (Green)              (Red)
```

---

## ⏱️ Typical Response Times

| Action | Time |
|--------|------|
| Load user list | < 1 second |
| Open details modal | < 1 second |
| Toggle status | < 1 second |
| Delete user | 1-2 seconds |
| Search/Filter | Instant |

---

## 🔄 Workflow Examples

### **Example 1: Suspicious User**
```
Scenario: User reported for suspicious activity

Steps:
1. Search for user by name/phone
2. Click "View Details"
3. Review booking and payment statistics
4. Decision:
   • If suspicious → Click "🔒 Disable User"
   • If fraudulent → Click "🗑️ Delete User"
```

### **Example 2: False Positive**
```
Scenario: User was disabled by mistake

Steps:
1. Filter: "Disabled Only"
2. Find user, click "View Details"
3. Click "✅ Enable User"
4. User can log in immediately
```

### **Example 3: Account Cleanup**
```
Scenario: Remove test/duplicate accounts

Steps:
1. Search for test user
2. Click "View Details"
3. Verify it's a test account (check stats)
4. Click "🗑️ Delete User"
5. Review cascade warning
6. Confirm deletion
```

---

## 📞 Quick Actions Reference

| I want to... | Click... | Result |
|--------------|----------|--------|
| See user info | View Details | Opens modal with 5 sections |
| Stop user login | Disable User | User can't log in (reversible) |
| Allow login again | Enable User | User can log in |
| Remove user permanently | Delete User → Confirm | User + all data deleted |
| Find specific user | Search box | Filters table |
| See only active users | Filter: Active Only | Shows 🟢 users |
| See disabled users | Filter: Disabled Only | Shows 🟡 users |

---

## 🆘 Troubleshooting

### **"View Details" button not working**
- ✅ Check: Are you logged in as admin?
- ✅ Check: Browser console for errors
- ✅ Try: Refresh the page

### **Status toggle not responding**
- ✅ Check: Backend server running?
- ✅ Check: Admin permissions active?
- ✅ Try: Reload user details

### **Delete not removing user**
- ✅ Check: Did you click "Confirm Delete"?
- ✅ Check: Look for error message
- ✅ Try: Refresh page and try again

---

## 📊 Statistics Interpretation

### **High Booking Count (>50)**
- Regular, active user
- Good customer retention

### **High Payments, Low Bookings**
- Likely uses carwash services
- Premium customer

### **Zero Reviews**
- New user OR
- Never left feedback

### **Low Average Rating (<3.0)**
- User gives harsh reviews
- May be difficult customer

---

## ⚡ Pro Tips

1. **Before Deleting:** Always check statistics
   - High payment total = valuable customer
   - Recent activity = active user

2. **Use Disable First:** For most issues
   - Reversible if mistake
   - Preserves historical data

3. **Search Smart:**
   - Use partial matches (e.g., "KL-01" finds all)
   - Combine search + filter for precision

4. **Review Cascade Warning:**
   - Numbers tell the story
   - 100+ bookings = think twice!

5. **Status Filter:**
   - Regular check on disabled users
   - Re-enable legitimate ones

---

## 🎯 Best Practices

### **Daily Checks**
```
1. Filter: "All Status"
2. Look for unusual activity patterns
3. Review recent user registrations
```

### **Weekly Review**
```
1. Filter: "Disabled Only"
2. Check if any should be re-enabled
3. Delete confirmed fraudulent accounts
```

### **Monthly Cleanup**
```
1. Search for test accounts
2. Review inactive users (check last booking)
3. Delete duplicates/test data
```

---

## 📞 Support

### **Need Help?**
- Backend issue → Check Django logs
- Frontend issue → Check browser console
- Database issue → Verify migrations applied

### **Common Error Messages**

| Error | Cause | Solution |
|-------|-------|----------|
| "Only admins can..." | Not admin | Log in as admin |
| "Failed to load details" | Backend down | Restart server |
| "Failed to toggle" | Permission error | Check admin role |

---

## ✅ Checklist: Before Deleting User

- [ ] Reviewed user statistics
- [ ] Checked total amount spent
- [ ] Verified reason for deletion
- [ ] Considered disable instead?
- [ ] Read cascade warning counts
- [ ] Confirmed user ID is correct
- [ ] Ready for permanent deletion

---

## 🎉 Quick Win Scenarios

### **Scenario: Spam Account**
```
Stats show:
• 0 bookings
• 0 payments
• 0 reviews
• Created today

Action: Safe to delete ✅
```

### **Scenario: Valued Customer**
```
Stats show:
• 50+ bookings
• ₹10,000+ spent
• 20 reviews (avg 4.5)
• Member for 6 months

Action: DO NOT delete! ⚠️
Consider disable if issue, investigate first
```

---

**Last Updated:** December 2024  
**Version:** 2.0 (Complete Revamp)
