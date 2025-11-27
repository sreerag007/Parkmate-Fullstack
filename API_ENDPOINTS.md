# Parkmate API Endpoints Reference

## Base URL
```
http://127.0.0.1:8000/api/
```

## Authentication
All endpoints (except registration and login) require Token authentication.

**Header Format:**
```
Authorization: Token <your-token-here>
```

---

## 1. Authentication Endpoints

### Register User
```
POST /api/auth/register-user/
```

**Request Body (multipart/form-data):**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstname": "string",
  "lastname": "string",
  "phone": "string",
  "vehicle_number": "KL-08-AZ-1234",
  "vehicle_type": "Sedan"
}
```

**Response (201):**
```json
{
  "message": "User Registered Successfully",
  "token": "token-string",
  "role": "User",
  "user_id": 1,
  "username": "username"
}
```

---

### Register Owner
```
POST /api/auth/register-owner/
```

**Request Body (multipart/form-data):**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstname": "string",
  "lastname": "string",
  "phone": "string",
  "streetname": "string",
  "locality": "string",
  "city": "string",
  "state": "string",
  "pincode": "123456",
  "verification_document_image": "file"
}
```

**Response (201):**
```json
{
  "message": "Owner Registered Successfully",
  "token": "token-string",
  "role": "Owner",
  "owner_id": 1,
  "username": "username"
}
```

---

### Login
```
POST /api/auth/login/
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "message": "Login Successful",
  "token": "token-string",
  "role": "User|Owner|Admin",
  "profile_id": 1,
  "username": "username"
}
```

---

### Logout
```
POST /api/auth/logout/
```

**Response (200):**
```json
{
  "message": "Logged Out Successfully"
}
```

---

## 2. User Profile Endpoints

### List/Get User Profile
```
GET /api/user-profiles/
```

**Response (200):**
```json
[
  {
    "id": 1,
    "auth_user": 1,
    "firstname": "John",
    "lastname": "Doe",
    "phone": "9876543210",
    "vehicle_number": "KL-08-AZ-1234",
    "vehicle_type": "Sedan"
  }
]
```

### Update User Profile
```
PATCH /api/user-profiles/{id}/
```

**Request Body:**
```json
{
  "firstname": "John",
  "phone": "9876543210"
}
```

---

## 3. Owner Profile Endpoints

### List/Get Owner Profile
```
GET /api/owner-profiles/
```

**Response (200):**
```json
[
  {
    "id": 1,
    "auth_user": 1,
    "firstname": "Jane",
    "lastname": "Smith",
    "phone": "9876543210",
    "streetname": "Main Street",
    "locality": "Downtown",
    "city": "Kochi",
    "state": "Kerala",
    "pincode": "682001",
    "verification_status": "PENDING",
    "verification_document_image": "url"
  }
]
```

### Update Owner Profile
```
PATCH /api/owner-profiles/{id}/
```

---

## 4. Parking Lot Endpoints

### List Parking Lots
```
GET /api/lots/
```

**Query for Owners:** Returns only their lots
**Query for Users/Public:** Returns only lots from approved owners

**Response (200):**
```json
[
  {
    "lot_id": 1,
    "owner": 1,
    "lot_name": "City Center Parking",
    "streetname": "MG Road",
    "locality": "Downtown",
    "city": "Kochi",
    "state": "Kerala",
    "pincode": "682001",
    "latitude": "9.931233",
    "longitude": "76.267303",
    "total_slots": 50,
    "available_slots": 45
  }
]
```

### Get Parking Lot by ID
```
GET /api/lots/{lot_id}/
```

### Create Parking Lot (Owner only)
```
POST /api/lots/
```

**Request Body:**
```json
{
  "lot_name": "City Center Parking",
  "streetname": "MG Road",
  "locality": "Downtown",
  "city": "Kochi",
  "state": "Kerala",
  "pincode": "682001",
  "latitude": "9.931233",
  "longitude": "76.267303",
  "total_slots": 50
}
```

### Update Parking Lot
```
PATCH /api/lots/{lot_id}/
```

### Delete Parking Lot
```
DELETE /api/lots/{lot_id}/
```

---

## 5. Parking Slot Endpoints

### List Parking Slots
```
GET /api/slots/
```

**Response (200):**
```json
[
  {
    "slot_id": 1,
    "lot_detail": {
      "lot_id": 1,
      "lot_name": "City Center Parking",
      "streetname": "MG Road",
      "city": "Kochi",
      "pincode": "682001",
      "total_slots": 50,
      "available_slots": 45
    },
    "vehicle_type": "Sedan",
    "price": "50.00",
    "is_available": true
  }
]
```

### Get Slot by ID
```
GET /api/slots/{slot_id}/
```

### Create Slot (Owner only)
```
POST /api/slots/
```

**Request Body:**
```json
{
  "lot": 1,
  "vehicle_type": "Sedan",
  "price": "50.00"
}
```

### Update Slot
```
PATCH /api/slots/{slot_id}/
```

### Delete Slot
```
DELETE /api/slots/{slot_id}/
```

---

## 6. Booking Endpoints

### List Bookings
```
GET /api/bookings/
```

**Query for Users:** Returns only their bookings
**Query for Owners:** Returns bookings for their lots
**Query for Admin:** Returns all bookings

**Response (200):**
```json
[
  {
    "booking_id": 1,
    "user": 1,
    "user_read": {
      "id": 1,
      "firstname": "John",
      "lastname": "Doe",
      "vehicle_number": "KL-08-AZ-1234"
    },
    "slot": 1,
    "slot_read": {
      "slot_id": 1,
      "price": "50.00",
      "vehicle_type": "Sedan",
      "is_available": false
    },
    "lot": 1,
    "lot_read": {
      "lot_id": 1,
      "lot_name": "City Center Parking",
      "latitude": "9.931233",
      "longitude": "76.267303"
    },
    "vehicle_number": "KL-08-AZ-1234",
    "booking_type": "Instant",
    "booking_time": "2025-11-25",
    "price": "50.00",
    "status": "Booked"
  }
]
```

### Get Booking by ID
```
GET /api/bookings/{booking_id}/
```

### Create Booking (User only)
```
POST /api/bookings/
```

**Request Body:**
```json
{
  "slot": 1,
  "vehicle_number": "KL-08-AZ-1234",
  "booking_type": "Instant"
}
```

**Note:** 
- User is auto-set from authenticated user
- Lot is auto-set from slot
- Price is auto-set from slot price
- Slot is marked unavailable

### Update Booking
```
PATCH /api/bookings/{booking_id}/
```

---

## 7. Payment Endpoints

### List Payments
```
GET /api/payments/
```

**Query for Users:** Returns only their payments
**Query for Admin:** Returns all payments

**Response (200):**
```json
[
  {
    "pay_id": 1,
    "booking_read": {
      "booking_id": 1,
      "booking_type": "Instant",
      "price": "50.00",
      "vehicle_number": "KL-08-AZ-1234"
    },
    "booking": 1,
    "user": 1,
    "payment_method": "UPI",
    "amount": "50.00"
  }
]
```

### Create Payment
```
POST /api/payments/
```

**Request Body:**
```json
{
  "booking": 1,
  "payment_method": "UPI"
}
```

**Note:** 
- User is auto-set from authenticated user
- Amount is auto-set from booking price

---

## 8. Car Wash Endpoints

### List Car Washes
```
GET /api/carwashes/
```

**Query for Users:** Returns their car washes
**Query for Owners:** Returns car washes for their lots
**Query for Admin:** Returns all car washes

**Response (200):**
```json
[
  {
    "booking": 1,
    "booking_read": {
      "booking_id": 1,
      "booking_type": "Instant",
      "price": "50.00"
    },
    "employee": 1,
    "employee_read": {
      "employee_id": 1,
      "firstname": "Mike",
      "lastname": "Worker",
      "latitude": "9.931233",
      "longitude": "76.267303"
    },
    "carwash_type": 1,
    "carwash_type_read": {
      "carwash_type_id": 1,
      "name": "Basic Wash",
      "price": "100.00"
    }
  }
]
```

### Create Car Wash
```
POST /api/carwashes/
```

**Request Body:**
```json
{
  "booking": 1,
  "employee": 1,
  "carwash_type": 1
}
```

**Note:** Price is auto-set from carwash_type

---

## 9. Car Wash Type Endpoints

### List Car Wash Types (Admin only)
```
GET /api/carwashtypes/
```

**Response (200):**
```json
[
  {
    "carwash_type_id": 1,
    "name": "Basic Wash",
    "description": "Exterior wash only",
    "price": "100.00"
  }
]
```

---

## 10. Employee Endpoints

### List Employees
```
GET /api/employees/
```

**Query for Owners:** Returns only their employees
**Query for Admin:** Returns all employees

**Response (200):**
```json
[
  {
    "employee_id": 1,
    "firstname": "Mike",
    "lastname": "Worker",
    "phone": "9876543210",
    "latitude": "9.931233",
    "longitude": "76.267303",
    "driving_license": "KL0820190012345",
    "owner": 1,
    "driving_license_image": "url"
  }
]
```

### Create Employee (Owner/Admin)
```
POST /api/employees/
```

**Request Body (multipart/form-data):**
```json
{
  "firstname": "Mike",
  "lastname": "Worker",
  "phone": "9876543210",
  "latitude": "9.931233",
  "longitude": "76.267303",
  "driving_license": "KL0820190012345",
  "driving_license_image": "file",
  "owner_id": 1  // Only for Admin
}
```

**Note:** Owner is auto-set for Owner role

---

## 11. Task Endpoints

### List Tasks
```
GET /api/tasks/
```

**Query for Owners:** Returns tasks for their lots
**Query for Employees:** Returns their tasks

**Response (200):**
```json
[
  {
    "task_id": 1,
    "booking_read": {
      "booking_id": 1,
      "booking_type": "Instant",
      "price": "50.00"
    },
    "booking": 1,
    "employee_read": {
      "employee_id": 1,
      "firstname": "Mike",
      "lastname": "Worker",
      "latitude": "9.931233",
      "longitude": "76.267303"
    },
    "employee": 1,
    "task_type": "Car Wash"
  }
]
```

### Create Task
```
POST /api/tasks/
```

**Request Body:**
```json
{
  "booking": 1,
  "employee": 1,
  "task_type": "Car Wash"
}
```

---

## 12. Review Endpoints

### List Reviews
```
GET /api/reviews/
GET /api/reviews/?lot={lot_id}
```

**Response (200):**
```json
[
  {
    "rev_id": 1,
    "user_detail": {
      "id": 1,
      "firstname": "John",
      "lastname": "Doe"
    },
    "lot_detail": {
      "lot_id": 1,
      "lot_name": "City Center Parking",
      "latitude": "9.931233",
      "longitude": "76.267303"
    },
    "user": 1,
    "lot": 1,
    "rating": 5,
    "review_desc": "Excellent parking facility!"
  }
]
```

### Create Review (User only)
```
POST /api/reviews/
```

**Request Body:**
```json
{
  "lot": 1,
  "rating": 5,
  "review_desc": "Excellent parking facility!"
}
```

**Note:** User is auto-set from authenticated user

---

## Status Codes

- **200** - Success (GET, PATCH, DELETE)
- **201** - Created (POST)
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found

## Error Response Format

```json
{
  "error": "Error message",
  "field_name": ["Validation error for this field"]
}
```

## Vehicle Types
- Hatchback
- Sedan
- SUV
- Three-Wheeler
- Two-Wheeler

## Booking Types
- Instant
- Advance

## Payment Methods
- CC (Credit Card)
- Cash
- UPI (QR code)

## Owner Verification Status
- PENDING
- APPROVED
- DECLINED

## Booking Status
- Booked
- Completed
- Cancelled
