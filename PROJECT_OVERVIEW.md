# Parkmate - Complete Parking Management System

## Project Description
Parkmate is a comprehensive parking management system with React frontend and Django backend. It manages parking lots, bookings, payments, car wash services, and employee tasks.

## System Architecture

### Frontend (React + Vite)
- **Location**: `c:\Users\VICTUS\Desktop\Integration Parkmate\Parkmate\`
- **Port**: 5173 (Vite dev server)
- **Tech Stack**: React, Vite, Axios, React Router

### Backend (Django REST Framework)
- **Location**: `c:\Users\VICTUS\Desktop\Integration Parkmate\parkmate-backend\Parkmate\`
- **Port**: 8000 (Django dev server)
- **Tech Stack**: Django 5.2.7, DRF, Token Authentication, SQLite
- **API Base**: `http://127.0.0.1:8000/api/`

## User Roles

### 1. User (Customer)
- Browse parking lots
- Book parking slots
- Make payments
- Request car wash services
- View booking history
- Write reviews

### 2. Owner
- Manage parking lots (CRUD)
- Manage parking slots
- View bookings for their lots
- Manage employees
- Manage services
- Requires admin verification

### 3. Admin
- Verify owners
- Manage all users, owners, employees
- View all bookings and payments
- Manage car wash types
- Full system access

## Key Features

### Authentication
- Token-based authentication
- Role-based access control (User, Owner, Admin)
- Separate login/register for each role

### Parking Management
- Multiple parking lots with geolocation
- Slot management by vehicle type
- Real-time availability tracking
- Dynamic pricing

### Booking System
- Instant and advance booking
- Slot availability validation
- Automatic price calculation
- Status tracking (Booked, Completed, Cancelled)

### Payment System
- Multiple payment methods (CC, Cash, UPI)
- Payment tracking
- Integration with bookings

### Car Wash Services
- Multiple car wash types
- Employee assignment
- Pricing management

### Employee Management
- License verification
- Task assignment
- Location tracking

### Review System
- User reviews for parking lots
- Rating system

## Environment Configuration

### Frontend (.env)
```
VITE_API_BASE_URL=http://127.0.0.1:8000/
```

### Backend Settings
- **CORS**: Enabled for localhost:5173
- **Authentication**: Token-based
- **Media Files**: Stored in `media/` directory
- **Database**: SQLite (db.sqlite3)

## API Structure

All endpoints are prefixed with `/api/`

### Authentication Endpoints
- POST `/api/auth/register-user/` - User registration
- POST `/api/auth/register-owner/` - Owner registration
- POST `/api/auth/login/` - Login (all roles)
- POST `/api/auth/logout/` - Logout

### Resource Endpoints (RESTful)
- `/api/user-profiles/` - User profiles
- `/api/owner-profiles/` - Owner profiles
- `/api/lots/` - Parking lots
- `/api/slots/` - Parking slots
- `/api/bookings/` - Bookings
- `/api/payments/` - Payments
- `/api/carwashes/` - Car wash services
- `/api/carwashtypes/` - Car wash types
- `/api/employees/` - Employees
- `/api/tasks/` - Tasks
- `/api/reviews/` - Reviews

## Data Models

### AuthUser (Custom User Model)
- username, email, password
- role (User/Owner/Admin)
- Extends AbstractUser

### UserProfile
- firstname, lastname, phone
- vehicle_number, vehicle_type
- Linked to AuthUser (OneToOne)

### OwnerProfile
- firstname, lastname, phone
- address (street, locality, city, state, pincode)
- verification_status (PENDING/APPROVED/DECLINED)
- verification_document_image
- Linked to AuthUser (OneToOne)

### P_Lot (Parking Lot)
- owner (FK to OwnerProfile)
- lot_name, address, location (lat/long)
- total_slots, available_slots (calculated)

### P_Slot (Parking Slot)
- lot (FK to P_Lot)
- vehicle_type, price
- is_available (boolean)

### Booking
- user (FK to UserProfile)
- slot (FK to P_Slot)
- lot (FK to P_Lot)
- vehicle_number, booking_type
- price, status, booking_time

### Payment
- booking (FK to Booking)
- user (FK to UserProfile)
- payment_method, amount

### Carwash
- booking (FK to Booking)
- employee (FK to Employee)
- carwash_type (FK to Carwash_type)
- price

### Carwash_type
- name, description, price

### Employee
- owner (FK to OwnerProfile)
- firstname, lastname, phone
- location (lat/long)
- driving_license, driving_license_image

### Tasks
- booking (FK to Booking)
- employee (FK to Employee)
- task_type

### Review
- lot (FK to P_Lot)
- user (FK to UserProfile)
- rating, review_desc

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

## Important Notes

### Role Capitalization
- Backend returns roles as: "User", "Owner", "Admin" (capitalized)
- Frontend should match this capitalization

### Owner Verification Flow
1. Owner registers with verification document
2. Status set to PENDING by default
3. Admin approves/declines
4. Only approved owners can create lots
5. Only lots from approved owners are visible to users

### Slot Availability
- Slots are marked unavailable when booked
- Available slots count is calculated dynamically
- Booking validates slot availability

### File Uploads
- Owner verification documents: `media/verification_documents/`
- Employee licenses: `media/employee_licenses/`

### Token Storage
Frontend stores in localStorage:
- `authToken` - Authentication token
- `userRole` - User role (User/Owner/Admin)
- `userId` - Profile ID
- `username` - Username

## Common Issues & Solutions

### CORS Issues
- Ensure backend CORS settings include frontend URL
- Check VITE_API_BASE_URL in .env

### Authentication Issues
- Verify token is included in headers
- Check role capitalization
- Ensure token is valid and not expired

### File Upload Issues
- Use FormData for multipart/form-data
- Set correct Content-Type header
- Check MEDIA_ROOT and MEDIA_URL settings

### API Response Format
Most endpoints return:
```json
{
  "data": [...],
  "message": "Success message"
}
```

Error responses:
```json
{
  "error": "Error message",
  "field_errors": {...}
}
```
