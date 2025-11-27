# Parkmate Frontend Structure Reference

## Directory Structure

```
Parkmate/
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Main routing
│   ├── index.css                   # Global styles
│   │
│   ├── Components/
│   │   ├── ProtectedRoute.jsx      # Route protection by role
│   │   └── Nav/
│   │       ├── Navbar.jsx          # Navigation component
│   │       └── Navbar.css
│   │
│   ├── Context/
│   │   ├── AuthContext.jsx         # Authentication context
│   │   └── DataContext.jsx         # Data management context
│   │
│   ├── services/
│   │   ├── api.js                  # Axios instance with interceptors
│   │   ├── authservice.js          # Authentication API calls
│   │   └── parkingService.js       # Parking-related API calls
│   │
│   └── Pages/
│       ├── Auth/                   # Authentication pages
│       │   ├── UserLogin.jsx
│       │   ├── UserRegister.jsx
│       │   ├── OwnerLogin.jsx
│       │   ├── OwnerRegister.jsx
│       │   ├── AdminLogin.jsx
│       │   ├── EmployeeRegister.jsx
│       │   └── Auth.scss
│       │
│       ├── Users/                  # User role pages
│       │   ├── Userland.jsx        # User dashboard/landing
│       │   ├── Userprof.jsx        # User profile
│       │   ├── Lots.jsx            # Browse parking lots
│       │   ├── DynamicLot.jsx      # Dynamic lot details
│       │   ├── Lot1.jsx            # Specific lot pages
│       │   ├── Lot2.jsx
│       │   ├── Lot3.jsx
│       │   └── Service.jsx         # Car wash services
│       │
│       ├── Owner/                  # Owner role pages
│       │   ├── OwnerLayout.jsx     # Owner dashboard layout
│       │   ├── OwnerDashboard.jsx  # Owner dashboard home
│       │   ├── OwnerLots.jsx       # Manage parking lots
│       │   ├── OwnerBookings.jsx   # View bookings
│       │   ├── OwnerServices.jsx   # Manage services
│       │   ├── OwnerProfile.jsx    # Owner profile
│       │   └── Owner.scss
│       │
│       └── Admin/                  # Admin role pages
│           ├── AdminLayout.jsx     # Admin dashboard layout
│           ├── AdminDashboard.jsx  # Admin dashboard home
│           ├── AdminUsers.jsx      # Manage users
│           ├── AdminOwners.jsx     # Manage/verify owners
│           ├── AdminBookings.jsx   # View all bookings
│           ├── AdminEmployees.jsx  # Manage employees
│           ├── AdminServices.jsx   # Manage services
│           └── Admin.scss
```

---

## Key Components

### 1. AuthContext (`Context/AuthContext.jsx`)
Manages authentication state for all three roles.

**State:**
```javascript
{
  user: null,      // User role data
  owner: null,     // Owner role data
  admin: null,     // Admin role data
  loading: true
}
```

**Methods:**
- `loginUser(credentials)` - User login
- `logoutUser()` - User logout
- `loginOwner(credentials)` - Owner login
- `logoutOwner()` - Owner logout
- `loginAdmin(credentials)` - Admin login
- `logoutAdmin()` - Admin logout
- `registerUser(userData)` - User registration
- `registerOwner(ownerData)` - Owner registration

**Usage:**
```javascript
import { useAuth } from '../Context/AuthContext';

const { user, loginUser, logoutUser } = useAuth();
```

---

### 2. ProtectedRoute (`Components/ProtectedRoute.jsx`)
Protects routes based on user role.

**Props:**
- `allowedRoles` - Array of allowed roles ['User', 'Owner', 'Admin']
- `children` - Component to render if authorized

**Usage:**
```javascript
<ProtectedRoute allowedRoles={['User']}>
  <UserDashboard />
</ProtectedRoute>
```

---

### 3. API Service (`services/api.js`)
Axios instance with token interceptors.

**Features:**
- Auto-adds token to requests
- Handles 401 errors (auto-logout)
- Base URL from environment

**Usage:**
```javascript
import api from '../services/api';

const response = await api.get('/lots/');
```

---

### 4. Auth Service (`services/authservice.js`)
Handles authentication operations.

**Methods:**
- `registerUser(userData)` - Register new user
- `registerOwner(ownerData)` - Register new owner
- `login(credentials)` - Login any role
- `logout()` - Logout
- `getCurrentUser()` - Get user from localStorage
- `isAuthenticated()` - Check if authenticated

**LocalStorage Keys:**
- `authToken` - JWT token
- `userRole` - User/Owner/Admin
- `userId` - Profile ID
- `username` - Username

---

### 5. Parking Service (`services/parkingService.js`)
Handles all parking-related API calls.

**Methods:**

**Lots:**
- `getLots()` - Get all lots
- `getLotById(id)` - Get lot details
- `createLot(data)` - Create lot (owner)
- `updateLot(id, data)` - Update lot
- `deleteLot(id)` - Delete lot

**Slots:**
- `getSlots()` - Get all slots
- `createSlot(data)` - Create slot
- `updateSlot(id, data)` - Update slot
- `deleteSlot(id)` - Delete slot

**Bookings:**
- `getBookings()` - Get bookings
- `createBooking(data)` - Create booking
- `updateBooking(id, data)` - Update booking

**Payments:**
- `getPayments()` - Get payments
- `createPayment(data)` - Create payment

**Car Wash:**
- `getCarwashes()` - Get car washes
- `getCarwashTypes()` - Get car wash types
- `createCarwash(data)` - Create car wash

**Employees:**
- `getEmployees()` - Get employees
- `createEmployee(data)` - Create employee

**Reviews:**
- `getReviews(lotId)` - Get reviews
- `createReview(data)` - Create review

---

## Common Integration Patterns

### 1. Fetching Data on Component Mount
```javascript
import { useState, useEffect } from 'react';
import parkingService from '../services/parkingService';

const MyComponent = () => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const data = await parkingService.getLots();
        setLots(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render lots */}</div>;
};
```

### 2. Creating Resources (Form Submission)
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const formData = {
      lot_name: e.target.lot_name.value,
      city: e.target.city.value,
      // ... other fields
    };

    await parkingService.createLot(formData);
    alert('Lot created successfully!');
    // Redirect or refresh
  } catch (error) {
    alert('Error: ' + error.response?.data?.error);
  }
};
```

### 3. File Upload (Owner Registration)
```javascript
const handleRegister = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('username', username);
  formData.append('email', email);
  formData.append('password', password);
  // ... other fields
  formData.append('verification_document_image', file);

  try {
    const result = await registerOwner(formData);
    if (result.success) {
      navigate('/owner/dashboard');
    }
  } catch (error) {
    setError(error.message);
  }
};
```

### 4. Protected Navigation
```javascript
import { useAuth } from '../Context/AuthContext';
import { Navigate } from 'react-router-dom';

const OwnerDashboard = () => {
  const { owner } = useAuth();

  if (!owner) {
    return <Navigate to="/owner/login" />;
  }

  return <div>Owner Dashboard Content</div>;
};
```

### 5. Displaying Nested Data
```javascript
// Bookings often have nested user/lot/slot data
const BookingList = ({ bookings }) => {
  return (
    <div>
      {bookings.map(booking => (
        <div key={booking.booking_id}>
          <h3>Booking #{booking.booking_id}</h3>
          <p>User: {booking.user_read?.firstname} {booking.user_read?.lastname}</p>
          <p>Lot: {booking.lot_read?.lot_name}</p>
          <p>Vehicle: {booking.slot_read?.vehicle_type}</p>
          <p>Price: ₹{booking.price}</p>
        </div>
      ))}
    </div>
  );
};
```

---

## Page-by-Page Integration Checklist

### User Pages

**Userland.jsx** (User Dashboard)
- [ ] Fetch user profile
- [ ] Display nearby lots
- [ ] Show active bookings
- [ ] Quick navigation to services

**Lots.jsx** (Browse Lots)
- [ ] Fetch all lots (approved owners only)
- [ ] Display lot cards with details
- [ ] Filter by city/location
- [ ] Show available slots
- [ ] Navigate to lot details

**DynamicLot.jsx** (Lot Details)
- [ ] Fetch lot by ID from route params
- [ ] Display lot information
- [ ] Show available slots by vehicle type
- [ ] Display reviews
- [ ] Booking form

**Service.jsx** (Car Wash)
- [ ] Fetch car wash types
- [ ] Display active bookings
- [ ] Request car wash for booking
- [ ] Show pricing

**Userprof.jsx** (User Profile)
- [ ] Fetch user profile
- [ ] Edit profile form
- [ ] Update vehicle details
- [ ] Change password

---

### Owner Pages

**OwnerDashboard.jsx**
- [ ] Display overview stats (lots, bookings, revenue)
- [ ] Recent bookings
- [ ] Verification status

**OwnerLots.jsx**
- [ ] List owner's lots
- [ ] Create new lot form
- [ ] Edit/delete lots
- [ ] Manage slots per lot

**OwnerBookings.jsx**
- [ ] Fetch bookings for owner's lots
- [ ] Filter by lot/status
- [ ] View booking details
- [ ] Mark as completed

**OwnerServices.jsx**
- [ ] Manage employees
- [ ] Assign car wash tasks
- [ ] View service requests

**OwnerProfile.jsx**
- [ ] View/edit profile
- [ ] Check verification status
- [ ] Update address

---

### Admin Pages

**AdminDashboard.jsx**
- [ ] System statistics
- [ ] Recent activity
- [ ] Pending verifications

**AdminUsers.jsx**
- [ ] List all users
- [ ] View user details
- [ ] Search/filter users

**AdminOwners.jsx**
- [ ] List all owners
- [ ] Approve/decline verification
- [ ] View verification documents
- [ ] Search/filter owners

**AdminBookings.jsx**
- [ ] List all bookings
- [ ] Filter by status/date/lot
- [ ] View booking details

**AdminEmployees.jsx**
- [ ] List all employees
- [ ] View employee details
- [ ] Verify licenses

**AdminServices.jsx**
- [ ] Manage car wash types
- [ ] Set pricing
- [ ] CRUD operations

---

## Common State Management Patterns

### Loading States
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [data, setData] = useState([]);
```

### Form States
```javascript
const [formData, setFormData] = useState({
  field1: '',
  field2: ''
});

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};
```

### Modal/Dialog States
```javascript
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

const openModal = (item) => {
  setSelectedItem(item);
  setIsOpen(true);
};
```

---

## Environment Variables

`.env` file:
```
VITE_API_BASE_URL=http://127.0.0.1:8000/
```

Usage in code:
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## Common Pitfalls to Avoid

1. **Role Capitalization**: Always use "User", "Owner", "Admin" (capitalized)
2. **Token Headers**: Ensure `Authorization: Token <token>` format
3. **FormData for Files**: Use FormData for image uploads
4. **Nested Data**: Access nested fields with optional chaining (`?.`)
5. **Error Handling**: Always wrap API calls in try-catch
6. **Loading States**: Show loading indicators during async operations
7. **Empty States**: Handle empty arrays gracefully
8. **Validation**: Validate forms before submission
9. **Cleanup**: Use cleanup functions in useEffect for subscriptions
10. **Re-renders**: Memoize callbacks and values when appropriate

---

## Testing Checklist

For each page integration:
- [ ] Page loads without errors
- [ ] Data fetches correctly
- [ ] Forms submit successfully
- [ ] Error messages display
- [ ] Loading states work
- [ ] Navigation works
- [ ] Protected routes enforce permissions
- [ ] Logout redirects properly
- [ ] Token refresh works
- [ ] File uploads work (if applicable)
