# Technical Reference - Owner Services Integration

## Database Schema Used

### Tables Utilized
```
Carwash
├── carwash_id (PK)
├── booking_id (FK) → Booking
├── employee_id (FK) → Employee
├── carwash_type_id (FK) → Carwash_type
└── price (Decimal)

Booking
├── booking_id (PK)
├── user_id (FK) → UserProfile
├── slot_id (FK) → P_Slot
├── lot_id (FK) → P_Lot
├── vehicle_number (CharField)
├── booking_type (Choice: Instant/Advance)
├── booking_time (DateTimeField)
├── price (Decimal)
└── status (Choice: booked/completed/cancelled)

UserProfile
├── id (PK)
├── auth_user_id (FK) → AuthUser
├── firstname (CharField)
├── lastname (CharField)
├── phone (CharField)
└── vehicle_number (CharField)

P_Lot
├── lot_id (PK)
├── owner_id (FK) → OwnerProfile
├── lot_name (CharField)
├── streetname (CharField)
├── locality (CharField)
├── city (CharField)
├── state (CharField)
├── pincode (CharField)
├── latitude (DecimalField)
└── longitude (DecimalField)

P_Slot
├── slot_id (PK)
├── lot_id (FK) → P_Lot
├── vehicle_type (Choice)
├── price (Decimal)
└── is_available (BooleanField)

Carwash_type
├── carwash_type_id (PK)
├── name (CharField)
├── description (CharField)
└── price (Decimal)

Employee
├── employee_id (PK)
├── owner_id (FK) → OwnerProfile
├── firstname (CharField)
├── lastname (CharField)
├── phone (CharField)
├── latitude (DecimalField)
├── longitude (DecimalField)
├── driving_license (CharField)
└── driving_license_image (ImageField)

OwnerProfile
├── id (PK)
├── auth_user_id (FK) → AuthUser
├── firstname (CharField)
├── lastname (CharField)
├── phone (CharField)
├── city (CharField)
└── ... (other address fields)

AuthUser
├── id (PK)
├── username (CharField)
├── email (CharField)
├── role (Choice: User/Owner/Admin)
└── password (hashed)
```

---

## SQL Query Generated

The backend generates this optimized query:

```sql
SELECT DISTINCT
    carwash.carwash_id,
    carwash.booking_id,
    carwash.employee_id,
    carwash.carwash_type_id,
    carwash.price,
    -- Booking fields
    booking.booking_id,
    booking.booking_type,
    booking.price AS booking_price,
    booking.booking_time,
    booking.status,
    booking.vehicle_number,
    -- User fields
    user.id,
    user.firstname,
    user.lastname,
    user.phone,
    user.vehicle_number AS user_vehicle,
    -- Lot fields
    lot.lot_id,
    lot.lot_name,
    lot.streetname,
    lot.locality,
    lot.city,
    lot.state,
    lot.pincode,
    -- Slot fields
    slot.slot_id,
    slot.vehicle_type,
    slot.price AS slot_price,
    -- Carwash type fields
    cwtype.carwash_type_id,
    cwtype.name,
    cwtype.price AS cwtype_price,
    -- Employee fields (if not null)
    employee.employee_id,
    employee.firstname AS emp_firstname,
    employee.lastname AS emp_lastname,
    employee.phone AS emp_phone
FROM carwash
INNER JOIN booking ON carwash.booking_id = booking.booking_id
INNER JOIN user_profile ON booking.user_id = user_profile.id
INNER JOIN parking_lot ON booking.lot_id = parking_lot.lot_id
INNER JOIN parking_slot ON booking.slot_id = parking_slot.slot_id
INNER JOIN carwash_type ON carwash.carwash_type_id = carwash_type.carwash_type_id
LEFT JOIN employee ON carwash.employee_id = employee.employee_id
LEFT JOIN owner ON parking_lot.owner_id = owner.id
WHERE parking_lot.owner_id = {owner_id}
ORDER BY booking.booking_time DESC;
```

---

## API Response Structure

### Request
```
GET /api/carwashes/owner_services/
Authorization: Bearer {token}
```

### Success Response (200 OK)
```json
{
  "owner_id": 1,
  "owner_name": "John Doe",
  "carwashes": [
    {
      "carwash_id": 1,
      "booking": 5,
      "booking_read": {
        "booking_id": 5,
        "booking_type": "Instant",
        "price": "200.00",
        "booking_time": "2025-01-15T10:30:00Z",
        "status": "booked",
        "vehicle_number": "KL-08-AB-1234"
      },
      "employee": 2,
      "employee_read": {
        "employee_id": 2,
        "firstname": "Rajesh",
        "lastname": "Kumar",
        "latitude": "10.123456",
        "longitude": "76.543210"
      },
      "carwash_type": 1,
      "carwash_type_read": {
        "carwash_type_id": 1,
        "name": "Full Wash",
        "price": "250.00"
      },
      "price": "250.00",
      "user_read": {
        "id": 3,
        "firstname": "Amit",
        "lastname": "Singh",
        "phone": "+919876543210",
        "vehicle_number": "KL-08-AB-1234"
      },
      "lot_read": {
        "lot_id": 1,
        "lot_name": "Downtown Parking",
        "streetname": "Main Street",
        "locality": "Business District",
        "city": "Kochi"
      },
      "slot_read": {
        "slot_id": 5,
        "vehicle_type": "Sedan",
        "price": "50.00"
      }
    }
  ],
  "total_services": 1
}
```

### Null/Empty Cases
```json
// Employee unassigned
"employee": null,
"employee_read": null,

// Lot missing locality
"lot_read": {
  "lot_id": 1,
  "locality": null,
  ...
}
```

---

## Component State Management

### Initial State
```javascript
{
  carwashes: [],              // All fetched services
  loading: true,              // Initial loading
  error: null,                // No error initially
  filter: 'all',              // Show all services
  selectedService: null,      // No service selected
  showDetailsModal: false,    // Modal hidden
  refreshIntervalRef: undefined // Interval not set
}
```

### State Transitions

#### On Mount
```
loading: true
→ loadOwnerServices()
→ API call
→ carwashes: [...]
→ loading: false
→ Start interval (15s)
```

#### On Filter Change
```
filter: 'all'
→ filteredCarwashes computed
→ Cards re-render
(No state change needed)
```

#### On View Details
```
selectedService: null, showDetailsModal: false
→ handleViewDetails(service)
→ selectedService: service, showDetailsModal: true
→ Modal renders
```

#### On Close Modal
```
selectedService: service, showDetailsModal: true
→ handleCloseModal()
→ selectedService: null, showDetailsModal: false
→ Modal hides
```

#### On Auto-Refresh (every 15s)
```
→ loadOwnerServices()
→ API call
→ carwashes updated (if new data)
→ Re-render with new data
```

#### On Unmount
```
→ clearInterval(refreshIntervalRef)
→ Cleanup complete
```

---

## Component Lifecycle

```
OwnerServices Component
├─ Initialize
│  └─ State: loading=true, carwashes=[]
│
├─ Mount
│  ├─ Check owner role
│  ├─ loadOwnerServices() called
│  ├─ API request sent
│  └─ Interval set (15s)
│
├─ Render Loop
│  ├─ User interacts (filter, view details, refresh)
│  ├─ State updates trigger re-render
│  └─ Computed values: filteredCarwashes, sortedCarwashes
│
├─ Auto-Refresh (every 15s)
│  ├─ loadOwnerServices() called
│  ├─ API request sent
│  └─ State updated with new data
│
└─ Unmount
   ├─ Clear interval
   └─ Cleanup
```

---

## Data Flow Diagram

```
┌──────────────────────┐
│   Browser Load       │
│ OwnerServices.jsx    │
└──────────┬───────────┘
           │
           ├─ Check Auth Context (owner role)
           │
           ├─ useEffect hook triggers
           │
           └─ Call loadOwnerServices()
                    │
                    ├─ parkingService.getOwnerCarwashes()
                    │
                    └─ API Request
                        │
                        ├─ GET /api/carwashes/owner_services/
                        │
                        └─ Backend Processing
                            │
                            ├─ Verify user is Owner (403 if not)
                            │
                            ├─ Get owner profile
                            │
                            ├─ Query Carwash with select_related()
                            │  ├─ booking
                            │  ├─ booking.user
                            │  ├─ booking.lot
                            │  ├─ booking.slot
                            │  ├─ carwash_type
                            │  └─ employee
                            │
                            ├─ Serialize with nested serializers
                            │
                            └─ Return JSON response
                                │
                                ├─ owner_id
                                ├─ owner_name
                                ├─ carwashes[] (with joined data)
                                └─ total_services
                                    │
                                    └─ Frontend Receives
                                        │
                                        ├─ setCarwashes(data.carwashes)
                                        ├─ setLoading(false)
                                        └─ Component Re-renders
                                            │
                                            ├─ Render service cards
                                            │  ├─ Map carwashes array
                                            │  ├─ Display real data
                                            │  └─ Show status badges
                                            │
                                            ├─ Set auto-refresh interval
                                            │  └─ Repeat every 15s
                                            │
                                            └─ User can interact
                                                ├─ Click filter
                                                ├─ Click View Details → Modal
                                                └─ Click Refresh → loadOwnerServices()
```

---

## Error Handling Flow

```
loadOwnerServices()
  │
  ├─ Try Block
  │  ├─ setLoading(true)
  │  ├─ setError(null)
  │  ├─ console.log('📋 Loading...')
  │  │
  │  ├─ parkingService.getOwnerCarwashes()
  │  │  │
  │  │  ├─ Success
  │  │  │  ├─ setCarwashes(data.carwashes)
  │  │  │  └─ console.log('✅ Loaded')
  │  │  │
  │  │  └─ Error
  │  │     ├─ Catch block (below)
  │  │     └─ console.error('❌ Error')
  │  │
  │  └─ setLoading(false)
  │
  ├─ Catch Block (Any Error)
  │  ├─ console.error('❌ Error loading services')
  │  ├─ setError('Failed to load carwash services')
  │  └─ setLoading(false)
  │
  └─ Finally Block
     └─ setLoading(false)

Render Path:
  ├─ If loading=true
  │  └─ Show spinner: "Loading carwash services..."
  │
  ├─ If error is set
  │  ├─ Show error message
  │  └─ Show "Retry" button
  │
  └─ If success
     └─ Show service cards
        └─ Can filter, view details, refresh
```

---

## Filter Implementation

```javascript
// Filtered list
const filteredCarwashes = carwashes.filter(c => {
    if (filter === 'all') return true
    return c.booking_read?.status?.toLowerCase() === filter.toLowerCase()
})

// Then sorted
const sortedCarwashes = [...filteredCarwashes].sort((a, b) => {
    const dateA = new Date(a.booking_read?.booking_time || 0)
    const dateB = new Date(b.booking_read?.booking_time || 0)
    return dateB - dateA  // Newest first
})
```

**Filter Options:**
- `all` → No filter
- `booked` → status = "booked"
- `completed` → status = "completed"
- `cancelled` → status = "cancelled"

**Filter Button Logic:**
```javascript
{['all', 'booked', 'completed', 'cancelled'].map(status => (
    <button 
        onClick={() => setFilter(status)}
        style={{
            border: filter === status ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: filter === status ? '#eff6ff' : '#fff',
        }}
    >
        {status.charAt(0).toUpperCase() + status.slice(1)} 
        ({carwashes.filter(...).length})
    </button>
))}
```

---

## Modal Implementation Details

### Modal Structure
```jsx
{showDetailsModal && selectedService && (
    <div className="modal-overlay" onClick={handleCloseModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">...</div>
            <div className="modal-body">
                {/* 7 sections */}
            </div>
            <div className="modal-footer">...</div>
        </div>
    </div>
)}
```

### Modal Sections

1. **Service Information**
   - Service Type
   - Price
   - Status
   - Booking ID

2. **User Information**
   - Full Name
   - Phone
   - Vehicle Number

3. **Parking Lot**
   - Lot Name
   - City
   - Full Address

4. **Slot Information**
   - Slot ID
   - Vehicle Type

5. **Employee Assignment**
   - Employee Name or "Unassigned"
   - Phone (if assigned)

6. **Booking Information**
   - Formatted Date/Time

### Data Display
```jsx
{service.user_read ? (
    `${service.user_read.firstname} ${service.user_read.lastname}`
) : (
    'N/A'
)}

{service.employee_read ? (
    `${service.employee_read.firstname} ${service.employee_read.lastname}`
) : (
    'Unassigned'
)}
```

---

## Status Styling

```javascript
const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || ''
    const colors = {
        'booked': '#3b82f6',      // Blue
        'completed': '#10b981',   // Green
        'cancelled': '#ef4444',   // Red
    }
    return colors[statusLower] || '#94a3b8'  // Gray default
}

const getStatusBgColor = (status) => {
    const statusLower = status?.toLowerCase() || ''
    const bgColors = {
        'booked': '#eff6ff',      // Light Blue
        'completed': '#ecfdf5',   // Light Green
        'cancelled': '#fef2f2',   // Light Red
    }
    return bgColors[statusLower] || '#f1f5f9'  // Light Gray
}

// Usage
<span style={{
    color: getStatusColor(status),
    backgroundColor: getStatusBgColor(status),
}}>
    {status}
</span>
```

---

## Auto-Refresh Implementation

```javascript
const refreshIntervalRef = useRef(null)

useEffect(() => {
    if (owner?.role === 'Owner') {
        // Initial load
        loadOwnerServices()
        
        // Set up interval
        refreshIntervalRef.current = setInterval(() => {
            console.log('🔄 Auto-refreshing...')
            loadOwnerServices()
        }, 15000)  // 15 seconds
    }

    // Cleanup
    return () => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current)
        }
    }
}, [owner])
```

**Why useRef?**
- Persists across re-renders
- Not part of component state
- Can be cleared without re-render

---

## Performance Optimizations

### Query Optimization
```python
# BAD: N+1 queries
carwashes = Carwash.objects.filter(booking__lot__owner=owner)
for c in carwashes:
    c.booking.user  # N additional queries
    c.booking.lot   # N additional queries

# GOOD: Single query with joins
carwashes = Carwash.objects.filter(
    booking__lot__owner=owner
).select_related(
    'booking__user',
    'booking__lot',
    'booking__slot',
    'carwash_type',
    'employee'
)
```

### Frontend Optimization
```javascript
// Filter is computed, not stored
// No need to fetch and store both carwashes and filteredCarwashes
const filteredCarwashes = carwashes.filter(...)

// Sorting is done on filtered array
// Doesn't mutate original array
const sortedCarwashes = [...filteredCarwashes].sort(...)

// Re-renders only when state changes
// Filter change doesn't trigger API call
```

---

## Security Considerations

### Authentication
```python
permission_classes=[IsAuthenticated]
# Only authenticated users can access

if user.role != "Owner":
    return 403  # Only owners can access owner_services
```

### Authorization
```python
# Filter to owner's lots only
carwashes = Carwash.objects.filter(
    booking__lot__owner=owner
)
# Can't see other owners' services
```

### Data Validation
```javascript
// Frontend checks
{service.user_read ? ... : 'N/A'}
{service.employee_read?.firstname || 'Unassigned'}

// Prevents errors from missing data
```

---

## Testing Scenarios

### Positive Tests
1. Owner with services → Show all services
2. Filter by status → Show filtered services
3. View details → Modal opens with data
4. Auto-refresh → New service appears
5. Refresh button → Instant update

### Negative Tests
1. Non-owner access → 403 error
2. Invalid token → 401 error
3. Network error → Show retry
4. No services → Show empty state
5. Data missing → Show fallback text

---

## Browser Console Debugging

### Expected Logs
```
📋 Loading owner carwash services...
✅ Owner services loaded: Object {owner_id: 1, ...}
🔄 Auto-refreshing owner services...
✅ Owner services loaded: Object {owner_id: 1, ...}
📋 Viewing details for service: Object {carwash_id: 1, ...}
❌ Closing details modal
```

### Network Tab
```
Request: GET /api/carwashes/owner_services/
Status: 200 OK
Response Time: 50-150ms
Response Size: 5-20KB
```

---

## Deployment Checklist

- [ ] Backend code deployed
  - [ ] `serializers.py` updated
  - [ ] `views.py` updated with custom action
  - [ ] No database migration needed
  - [ ] Server restarted

- [ ] Frontend code deployed
  - [ ] `parkingService.js` updated
  - [ ] `OwnerServices.jsx` updated
  - [ ] Build successful
  - [ ] CSS/styling included

- [ ] Testing
  - [ ] Login as owner
  - [ ] Services page loads
  - [ ] Data displays correctly
  - [ ] Modal works
  - [ ] Filters work
  - [ ] Auto-refresh works
  - [ ] Error handling works

- [ ] Monitoring
  - [ ] Check server logs for errors
  - [ ] Monitor API response times
  - [ ] Check browser console for warnings
  - [ ] Test on multiple browsers

---

## Conclusion

This integration provides a production-ready, fully-featured Owner Services management page with:
- Real database data
- Optimized queries
- Professional UI
- Auto-refresh capability
- Comprehensive error handling
- Full modal details
- Status filtering
- Responsive design
