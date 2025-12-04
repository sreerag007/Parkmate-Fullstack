import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './Context/AuthContext'
import { TimeProvider } from './contexts/TimeContext'
import ProtectedRoute from './Components/ProtectedRoute'
import UserLand from './Pages/Users/Userland'
import Lots from './Pages/Users/Lots'
import DynamicLot from './Pages/Users/DynamicLot'
import BookingConfirmation from './Pages/Users/BookingConfirmation'
import Userprof from './Pages/Users/Userprof'
import Service from './Pages/Users/Service'
import CarWash from './Pages/Users/CarWash'
import CarWashHistory from './Pages/Users/CarWashHistory'
import Reviews from './Pages/Users/Reviews'
import Navbar from './Components/Nav/Navbar'
import OwnerLayout from './Pages/Owner/OwnerLayout'
import OwnerDashboard from './Pages/Owner/OwnerDashboard'
import OwnerLots from './Pages/Owner/OwnerLots'
import OwnerServices from './Pages/Owner/OwnerServices'
import OwnerBookings from './Pages/Owner/OwnerBookings'
import OwnerPayments from './Pages/Owner/OwnerPayments'
import OwnerProfile from './Pages/Owner/OwnerProfile'
import OwnerReviews from './Pages/Owner/OwnerReviews'
import OwnerCarWash from './Pages/Owner/OwnerCarWash'
import OwnerEmployees from './Pages/Owner/OwnerEmployees'
import AdminLayout from './Pages/Admin/AdminLayout'
import AdminDashboard from './Pages/Admin/AdminDashboard'
import AdminUsers from './Pages/Admin/AdminUsers'
import AdminOwners from './Pages/Admin/AdminOwners'
import AdminBookings from './Pages/Admin/AdminBookings'
import AdminServices from './Pages/Admin/AdminServices'
import AdminEmployees from './Pages/Admin/AdminEmployees'
import AdminReviews from './Pages/Admin/AdminReviews'
import UserLogin from './Pages/Auth/UserLogin'
import UserRegister from './Pages/Auth/UserRegister'
import OwnerLogin from './Pages/Auth/OwnerLogin'
import OwnerRegister from './Pages/Auth/OwnerRegister'
import EmployeeRegister from './Pages/Auth/EmployeeRegister'
import AdminLogin from './Pages/Auth/AdminLogin'

import { DataProvider } from './Context/DataContext'
import { useAuth } from './Context/AuthContext'
import { useWebSocketNotifications } from './hooks/useWebSocketNotifications'

// Wrapper component for WebSocket notifications
function AppWithWebSocket() {
  const { user, owner, admin } = useAuth();
  
  // Get the currently logged in user's ID
  const userId = user?.userId || owner?.userId || admin?.userId;
  
  // Initialize WebSocket notifications - always call, hook handles null userId
  useWebSocketNotifications(userId);

  return (
    <TimeProvider>
      <BrowserRouter>
        <Navbar />
        
        {/* Global Toast Notification Container */}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />

      <div className="app-content">
        <div className="container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<UserLand />} />
            <Route path="/login" element={<UserLogin />} />
                <Route path="/register" element={<UserRegister />} />
                <Route path="/owner/login" element={<OwnerLogin />} />
                <Route path="/owner/register" element={<OwnerRegister />} />
                <Route path="/employee/register" element={<EmployeeRegister />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                <Route path="/lots" element={<Lots />} />
                <Route path="/lots/:lotId" element={<DynamicLot />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/service" element={<Service />} />
                <Route path="/carwash" element={<CarWash />} />
                <Route path="/carwash/my-bookings" element={<CarWashHistory />} />

                {/* Protected User Routes (Optional, but good for profile) */}
                <Route path="/profile" element={<Userprof />} />
                <Route path="/reviews" element={<Reviews />} />

                {/* Protected Owner Routes */}
                <Route element={<ProtectedRoute role="owner" />}>
                  <Route path="/owner" element={<OwnerLayout />}>
                    <Route index element={<OwnerDashboard />} />
                    <Route path="lots" element={<OwnerLots />} />
                    <Route path="bookings" element={<OwnerBookings />} />
                    <Route path="carwash" element={<OwnerCarWash />} />
                    <Route path="payments" element={<OwnerPayments />} />
                    <Route path="services" element={<OwnerServices />} />
                    <Route path="employees" element={<OwnerEmployees />} />
                    <Route path="reviews" element={<OwnerReviews />} />
                    <Route path="profile" element={<OwnerProfile />} />
                  </Route>
                </Route>

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute role="admin" />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="owners" element={<AdminOwners />} />
                    <Route path="bookings" element={<AdminBookings />} />
                    <Route path="services" element={<AdminServices />} />
                    <Route path="employees" element={<AdminEmployees />} />
                    <Route path="reviews" element={<AdminReviews />} />
                  </Route>
                </Route>
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </TimeProvider>
    );
  }

  function App() {
    return (
      <AuthProvider>
        <DataProvider>
          <AppWithWebSocket />
        </DataProvider>
      </AuthProvider>
    )
  }

  export default App