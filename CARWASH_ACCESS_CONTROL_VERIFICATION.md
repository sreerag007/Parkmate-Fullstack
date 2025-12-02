# Car Wash Access Control Verification Guide

**Phase 4.5 - Verify Ownership Access Control**

This document provides security verification procedures to ensure that owners can only access bookings for their own parking lots, and users can only access their own bookings.

---

## Table of Contents
1. [Access Control Architecture](#access-control-architecture)
2. [User Role Permissions](#user-role-permissions)
3. [API Endpoint Access Control](#api-endpoint-access-control)
4. [Security Test Cases](#security-test-cases)
5. [Frontend Access Control](#frontend-access-control)
6. [Verification Checklist](#verification-checklist)

---

## Access Control Architecture

### Role-Based Access Control (RBAC)
```
AuthUser (Django User)
    ├─ role: "User" → UserProfile
    ├─ role: "Owner" → OwnerProfile  
    └─ role: "Admin" → Superuser privileges
```

### Resource Ownership Hierarchy
```
Owner Profile
    └─ Parking Lots (P_Lot)
        └─ Car Wash Bookings (CarWashBooking)
            └─ Payments (Payment)

User Profile
    └─ Car Wash Bookings (CarWashBooking)
        └─ Payments (Payment)
```

---

## User Role Permissions

### User Role (role="User")
**Allowed Operations**:
- ✅ Browse available car wash services
- ✅ Create bookings for themselves
- ✅ View their own bookings only
- ✅ Cancel their own pending bookings
- ✅ View their payment history
- ✅ Retry failed payments

**Denied Operations**:
- ❌ View other users' bookings
- ❌ Modify other users' bookings
- ❌ Access owner dashboard
- ❌ Verify payments
- ❌ Modify booking status to in_progress/completed
- ❌ View owner statistics

---

### Owner Role (role="Owner")
**Allowed Operations**:
- ✅ View bookings for their parking lots only
- ✅ Verify payment status
- ✅ Update booking status (confirmed → in_progress → completed)
- ✅ View revenue analytics for their bookings
- ✅ Search and filter their bookings
- ✅ Access owner dashboard
- ✅ View pending payment notifications

**Denied Operations**:
- ❌ View bookings for other owners' lots
- ❌ Create bookings (only users can book)
- ❌ Modify user information
- ❌ Access other owner's revenue data
- ❌ Delete bookings (only cancel)
- ❌ Access admin functions

---

## API Endpoint Access Control

### Public Endpoints (AllowAny)
```
GET  /api/carwash-services/
     - Anyone can list available services
     - No authentication required
     - Filtered to is_active=True only
```

**Test**:
```bash
curl -X GET http://localhost:8000/api/carwash-services/
# Expected: HTTP 200, list of services (no auth needed)
```

---

### User-Only Endpoints (IsAuthenticated)
```
POST   /api/carwash-bookings/
       - Create booking (auto-sets user from request.user)
       - Only users can create

GET    /api/carwash-bookings/my-bookings/
       - Get own bookings only
       - Filtered by UserProfile

GET    /api/carwash-bookings/pending-payments/
       - Get own pending payments
       - Filtered by user and payment_status

PATCH  /api/carwash-bookings/{id}/
       - Update own booking (limited fields)
       - Status transitions only
```

**Permission Logic**:
```python
def get_queryset(self):
    user = self.request.user
    user_profile = UserProfile.objects.get(auth_user=user)
    return CarWashBooking.objects.filter(user=user_profile)
    # ✅ Only their own bookings
```

---

### Owner-Only Endpoints (IsAuthenticated + Owner Check)
```
GET    /api/owner/carwash-bookings/
       - View bookings for their lots only
       - Filtered by owner's P_Lot instances

GET    /api/owner/carwash-bookings/dashboard/
       - Get revenue stats for their bookings
       - Calculated from owned lots only

PATCH  /api/owner/carwash-bookings/{id}/
       - Update booking status (verify, confirm, start, complete)
       - Only for bookings in their lots
```

**Permission Logic**:
```python
def get_queryset(self):
    user = self.request.user
    owner_profile = OwnerProfile.objects.get(auth_user=user)
    owner_lots = P_Lot.objects.filter(owner=owner_profile)
    return CarWashBooking.objects.filter(lot__in=owner_lots)
    # ✅ Only their own lots' bookings
```

---

## Security Test Cases

### Test Suite 1: User Isolation

#### Test Case 1.1: User Can Only See Own Bookings
**Objective**: Verify users cannot view other users' bookings

**Setup**:
- User A: TestUser1
- User B: TestUser2
- Booking 1: Created by User A
- Booking 2: Created by User B

**Test Steps**:
1. Login as User A
2. Call GET `/api/carwash-bookings/my-bookings/` with User A token
3. Call GET `/api/carwash-bookings/{booking2_id}/` with User A token
4. Call GET `/api/carwash-bookings/` with User A token (list all - should be filtered)

**Expected Results**:
- ✅ Step 2: Returns only Booking 1
- ✅ Step 3: HTTP 404 or 403 (cannot access other user's booking)
- ✅ Step 4: Returns only Booking 1 (filtered list)

**API Commands**:
```bash
# Get User A token
USER_A_TOKEN=$(curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"password123"}' \
  | jq -r '.token')

# Get User B token
USER_B_TOKEN=$(curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser2","password":"password123"}' \
  | jq -r '.token')

# User A gets own bookings
curl -X GET http://localhost:8000/api/carwash-bookings/my-bookings/ \
  -H "Authorization: Token $USER_A_TOKEN" \
  | jq '.results[] | .carwash_booking_id'

# User A tries to access booking created by User B
curl -X GET http://localhost:8000/api/carwash-bookings/{booking2_id}/ \
  -H "Authorization: Token $USER_A_TOKEN"
# Expected: HTTP 404 or 403 error
```

---

#### Test Case 1.2: User Cannot Modify Other User's Booking
**Objective**: Verify users cannot update other users' bookings

**Setup**:
- User A token
- Booking created by User B (booking_id=99)

**Test Steps**:
1. Try to PATCH `/api/carwash-bookings/99/` with User A token
2. Change status to "cancelled"

**Expected Results**:
- ✅ HTTP 404 or 403 error
- ✅ Booking status unchanged
- ✅ Error message: "Not found" or "Permission denied"

**API Command**:
```bash
curl -X PATCH http://localhost:8000/api/carwash-bookings/99/ \
  -H "Authorization: Token $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"cancelled"}'
# Expected: HTTP 404 or 403
```

---

#### Test Case 1.3: User Cannot Access Owner Endpoints
**Objective**: Verify regular users cannot access owner-only endpoints

**Setup**:
- User A (regular user, NOT owner)
- User A token

**Test Steps**:
1. Try to GET `/api/owner/carwash-bookings/` with User A token
2. Try to GET `/api/owner/carwash-bookings/dashboard/` with User A token

**Expected Results**:
- ✅ Both requests return HTTP 404 or 403
- ✅ Error message: "Owner profile not found" or "Permission denied"

**API Commands**:
```bash
curl -X GET http://localhost:8000/api/owner/carwash-bookings/ \
  -H "Authorization: Token $USER_A_TOKEN"
# Expected: HTTP 404 or 403 - owner profile not found

curl -X GET http://localhost:8000/api/owner/carwash-bookings/dashboard/ \
  -H "Authorization: Token $USER_A_TOKEN"
# Expected: HTTP 404 or 403 - owner profile not found
```

---

### Test Suite 2: Owner Isolation

#### Test Case 2.1: Owner Only Sees Own Lots' Bookings
**Objective**: Verify owners cannot see bookings from other owners' lots

**Setup**:
- Owner A: Owns Lot 1
- Owner B: Owns Lot 2
- Booking 1: Created for Owner A's Lot 1
- Booking 2: Created for Owner B's Lot 2

**Test Steps**:
1. Login as Owner A
2. GET `/api/owner/carwash-bookings/` with Owner A token
3. Try to GET `/api/owner/carwash-bookings/{booking2_id}/` with Owner A token (booking from Owner B's lot)

**Expected Results**:
- ✅ Step 2: Returns only Booking 1
- ✅ Step 3: HTTP 404 (cannot see other owner's booking)

**API Commands**:
```bash
# Get Owner A token
OWNER_A_TOKEN=$(curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"ownerone","password":"password123"}' \
  | jq -r '.token')

# Get Owner B token
OWNER_B_TOKEN=$(curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"ownertwo","password":"password123"}' \
  | jq -r '.token')

# Owner A gets bookings (should only see from their lots)
curl -X GET http://localhost:8000/api/owner/carwash-bookings/ \
  -H "Authorization: Token $OWNER_A_TOKEN" \
  | jq '.results[] | .carwash_booking_id'

# Owner A tries to access booking from Owner B's lot
curl -X GET http://localhost:8000/api/owner/carwash-bookings/{booking2_id}/ \
  -H "Authorization: Token $OWNER_A_TOKEN"
# Expected: HTTP 404 or filtered out
```

---

#### Test Case 2.2: Owner Dashboard Only Shows Own Revenue
**Objective**: Verify owner dashboard revenue is isolated

**Setup**:
- Owner A: Owns Lot 1 (1 completed booking, ₹500)
- Owner B: Owns Lot 2 (3 completed bookings, ₹2000)

**Test Steps**:
1. Get Owner A dashboard stats
2. Get Owner B dashboard stats
3. Verify each sees only their own bookings and revenue

**Expected Results**:
- ✅ Owner A dashboard:
  - total_bookings: 1
  - completed_bookings: 1
  - total_revenue: 500.00
- ✅ Owner B dashboard:
  - total_bookings: 3
  - completed_bookings: 3
  - total_revenue: 2000.00

**API Command**:
```bash
curl -X GET http://localhost:8000/api/owner/carwash-bookings/dashboard/ \
  -H "Authorization: Token $OWNER_A_TOKEN" \
  | jq '{total_bookings, completed_bookings, total_revenue}'

# Expected:
# {
#   "total_bookings": 1,
#   "completed_bookings": 1,
#   "total_revenue": 500.0
# }
```

---

#### Test Case 2.3: Owner Cannot Modify Booking in Other Lot
**Objective**: Verify owners cannot update bookings in other lots

**Setup**:
- Owner A token
- Booking 2 (in Owner B's Lot 2)

**Test Steps**:
1. Try to PATCH `/api/owner/carwash-bookings/{booking2_id}/` with Owner A token
2. Change status to "confirmed"

**Expected Results**:
- ✅ HTTP 404 error
- ✅ Booking status unchanged
- ✅ Error message: "Not found"

**API Command**:
```bash
curl -X PATCH http://localhost:8000/api/owner/carwash-bookings/{booking2_id}/ \
  -H "Authorization: Token $OWNER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'
# Expected: HTTP 404
```

---

#### Test Case 2.4: Owner Cannot Access User Endpoints
**Objective**: Verify owners cannot access user-only endpoints

**Setup**:
- Owner A token
- Booking created by User C (not related to Owner A's lots)

**Test Steps**:
1. Try to GET `/api/carwash-bookings/my-bookings/` with Owner A token
2. Should return empty list (owner's own bookings, if any)

**Expected Results**:
- ✅ Returns empty array or user-created bookings only
- ✅ Does NOT return bookings from their managed lots
- ✅ Role separation maintained

---

### Test Suite 3: Authentication & Authorization

#### Test Case 3.1: Unauthenticated Request Denied
**Objective**: Verify endpoints require authentication

**Test Steps**:
1. GET `/api/carwash-bookings/my-bookings/` without token
2. POST to `/api/carwash-bookings/` without token

**Expected Results**:
- ✅ Both return HTTP 401 Unauthorized
- ✅ Error message: "Authentication credentials were not provided"

**API Commands**:
```bash
# Without token
curl -X GET http://localhost:8000/api/carwash-bookings/my-bookings/
# Expected: HTTP 401

curl -X POST http://localhost:8000/api/carwash-bookings/ \
  -H "Content-Type: application/json" \
  -d '{...}'
# Expected: HTTP 401
```

---

#### Test Case 3.2: Invalid Token Rejected
**Objective**: Verify invalid tokens are rejected

**Test Steps**:
1. Use fake/expired token
2. Call authenticated endpoint

**Expected Results**:
- ✅ HTTP 401 Unauthorized
- ✅ Error message: "Invalid token" or "Token invalid or expired"

**API Command**:
```bash
curl -X GET http://localhost:8000/api/carwash-bookings/my-bookings/ \
  -H "Authorization: Token INVALID_TOKEN_HERE"
# Expected: HTTP 401
```

---

#### Test Case 3.3: Token Isolation Between Users
**Objective**: Verify tokens are user-specific

**Setup**:
- User A token
- User B token

**Test Steps**:
1. User A can use User A token successfully
2. User A cannot use User B token to access User B's bookings

**Expected Results**:
- ✅ Using wrong token returns bookings of that token's user
- ✅ Data is still isolated per user
- ✅ No cross-user data leakage

---

### Test Suite 4: Frontend Access Control

#### Test Case 4.1: User Routes Protected
**Objective**: Verify frontend routes require authentication

**Routes**:
```
/carwash           - ✅ Public (service browsing)
/carwash/my-bookings - ❌ Protected (user only)
/owner/carwash     - ❌ Protected (owner only)
```

**Test Steps**:
1. Navigate to `/carwash/my-bookings` without login
2. Should redirect to login
3. Navigate to `/owner/carwash` as regular user
4. Should redirect or show 403 error

**Expected Results**:
- ✅ Redirect to `/login` or `/auth`
- ✅ Cannot access protected routes
- ✅ After login, correct route loads

---

#### Test Case 4.2: Role-Based Menu Display
**Objective**: Verify menu shows correct options per role

**User Menu** (authenticated user):
- ✅ Profile
- ✅ Car Wash
- ✅ My Bookings
- ❌ Owner Dashboard

**Owner Menu** (authenticated owner):
- ✅ Dashboard
- ✅ Bookings (slot)
- ✅ Car Wash
- ✅ Owner settings
- ❌ Regular user options

**Test Steps**:
1. Login as regular user - verify menu
2. Login as owner - verify different menu
3. Try accessing hidden routes - should fail or redirect

---

#### Test Case 4.3: Component-Level Permission Checks
**Objective**: Verify components only show owner-specific buttons

**OwnerCarWash.jsx** should only display:
- ✅ Action buttons (Verify, Confirm, Start, Complete)
- ✅ Revenue stats
- ✅ Filter by owner's bookings

**CarWashHistory.jsx** should only display:
- ✅ User's own bookings
- ✅ Cancel button for own pending bookings
- ❌ No owner actions
- ❌ No revenue info

---

## Verification Checklist

### Backend Access Control
- [ ] User can only view own bookings via API
- [ ] User cannot access booking details of other users
- [ ] User cannot update other users' bookings
- [ ] Owner can only view bookings for own lots
- [ ] Owner cannot view other owners' bookings
- [ ] Owner cannot modify bookings in other lots
- [ ] User cannot access `/owner/` endpoints
- [ ] Owner cannot access user-specific endpoints
- [ ] Unauthenticated requests denied
- [ ] Invalid tokens rejected
- [ ] Dashboard stats isolated per owner

### Frontend Access Control
- [ ] Protected routes redirect unauthenticated users
- [ ] Regular users cannot access owner dashboard
- [ ] Owner menu not shown to regular users
- [ ] Owner action buttons not visible to users
- [ ] API requests include authentication token
- [ ] Token-based authorization working

### Database-Level Security
- [ ] CarWashBooking.lot Foreign Key prevents access to other lots
- [ ] UserProfile Foreign Key ensures user isolation
- [ ] get_queryset() filters applied correctly
- [ ] No raw SQL queries that bypass filters
- [ ] Admin interface respects permissions

---

## Database Query Verification

### Safe Query - User Isolation
```python
# ✅ SAFE - User can only see own bookings
user_profile = UserProfile.objects.get(auth_user=request.user)
bookings = CarWashBooking.objects.filter(user=user_profile)
```

### Safe Query - Owner Isolation
```python
# ✅ SAFE - Owner can only see own lots' bookings
owner_profile = OwnerProfile.objects.get(auth_user=request.user)
owner_lots = P_Lot.objects.filter(owner=owner_profile)
bookings = CarWashBooking.objects.filter(lot__in=owner_lots)
```

### Unsafe Query (if used)
```python
# ❌ UNSAFE - No filtering, would expose all bookings
bookings = CarWashBooking.objects.all()

# ❌ UNSAFE - Only filters by status, not by user
bookings = CarWashBooking.objects.filter(status='pending')
```

---

## Sign-Off

**Access Control Verified By**: _______________  
**Date**: _______________  
**Test Environment**: Development / Staging / Production  

### Test Results Summary
- [ ] All 14 security test cases passed
- [ ] No unauthorized access detected
- [ ] User isolation verified
- [ ] Owner isolation verified
- [ ] Authentication required for protected endpoints
- [ ] Frontend routes protected

**Overall Status**: ✅ PASS / ❌ FAIL  
**Ready for Phase 5**: Yes / No  

**Issues Found**:
```
[Document any security issues found here]
```

**Recommendations**:
```
[Document any security improvements]
```

