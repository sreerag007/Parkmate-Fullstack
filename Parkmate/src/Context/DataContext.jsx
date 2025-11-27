import React, { createContext, useState, useContext, useEffect } from 'react';
import parkingService from '../services/parkingService';
import authService from '../services/authService';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    // State for all data
    const [users, setUsers] = useState([]);
    const [owners, setOwners] = useState([]);
    const [parkingLots, setParkingLots] = useState([]);
    const [parkingSlots, setParkingSlots] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [services, setServices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [carwashes, setCarwashes] = useState([]);
    const [carwashTypes, setCarwashTypes] = useState([]);
    const [tasks, setTasks] = useState([]);
    
    // Loading states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all data on mount (only if authenticated)
    useEffect(() => {
        if (authService.isAuthenticated()) {
            fetchAllData();
        }
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchParkingLots(),
                fetchBookings(),
                fetchCarwashTypes(),
                fetchEmployees(),
            ]);
        } catch (err) {
            setError('Failed to fetch data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Parking Lots ---
    const fetchParkingLots = async () => {
        try {
            const data = await parkingService.getLots();
            setParkingLots(data);
            return data;
        } catch (err) {
            console.error('Error fetching parking lots:', err);
            throw err;
        }
    };

    const addParkingLot = async (lotData) => {
        try {
            const newLot = await parkingService.createLot(lotData);
            setParkingLots([...parkingLots, newLot]);
            return { success: true, data: newLot };
        } catch (err) {
            console.error('Error adding parking lot:', err);
            return { success: false, error: err.response?.data || 'Failed to add parking lot' };
        }
    };

    const updateParkingLot = async (id, lotData) => {
        try {
            const updatedLot = await parkingService.updateLot(id, lotData);
            setParkingLots(parkingLots.map(lot => lot.lot_id === id ? updatedLot : lot));
            return { success: true, data: updatedLot };
        } catch (err) {
            console.error('Error updating parking lot:', err);
            return { success: false, error: err.response?.data || 'Failed to update parking lot' };
        }
    };

    const deleteParkingLot = async (id) => {
        try {
            await parkingService.deleteLot(id);
            setParkingLots(parkingLots.filter(lot => lot.lot_id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting parking lot:', err);
            return { success: false, error: err.response?.data || 'Failed to delete parking lot' };
        }
    };

    // --- Bookings ---
    const fetchBookings = async () => {
        try {
            const data = await parkingService.getBookings();
            setBookings(data);
            return data;
        } catch (err) {
            console.error('Error fetching bookings:', err);
            throw err;
        }
    };

    const addBooking = async (bookingData) => {
        try {
            const newBooking = await parkingService.createBooking(bookingData);
            setBookings([...bookings, newBooking]);
            return { success: true, data: newBooking };
        } catch (err) {
            console.error('Error adding booking:', err);
            return { success: false, error: err.response?.data || 'Failed to create booking' };
        }
    };

    const updateBooking = async (id, bookingData) => {
        try {
            const updatedBooking = await parkingService.updateBooking(id, bookingData);
            setBookings(bookings.map(booking => booking.booking_id === id ? updatedBooking : booking));
            return { success: true, data: updatedBooking };
        } catch (err) {
            console.error('Error updating booking:', err);
            return { success: false, error: err.response?.data || 'Failed to update booking' };
        }
    };

    const deleteBooking = async (id) => {
        try {
            await parkingService.deleteBooking(id);
            setBookings(bookings.filter(booking => booking.booking_id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting booking:', err);
            return { success: false, error: err.response?.data || 'Failed to delete booking' };
        }
    };

    // --- Employees ---
    const fetchEmployees = async () => {
        try {
            const data = await parkingService.getEmployees();
            setEmployees(data);
            return data;
        } catch (err) {
            console.error('Error fetching employees:', err);
            throw err;
        }
    };

    const addEmployee = async (employeeData) => {
        try {
            const newEmployee = await parkingService.createEmployee(employeeData);
            setEmployees([...employees, newEmployee]);
            return { success: true, data: newEmployee };
        } catch (err) {
            console.error('Error adding employee:', err);
            return { success: false, error: err.response?.data || 'Failed to add employee' };
        }
    };

    const updateEmployee = async (id, employeeData) => {
        try {
            const updatedEmployee = await parkingService.updateEmployee(id, employeeData);
            setEmployees(employees.map(emp => emp.employee_id === id ? updatedEmployee : emp));
            return { success: true, data: updatedEmployee };
        } catch (err) {
            console.error('Error updating employee:', err);
            return { success: false, error: err.response?.data || 'Failed to update employee' };
        }
    };

    const deleteEmployee = async (id) => {
        try {
            await parkingService.deleteEmployee(id);
            setEmployees(employees.filter(emp => emp.employee_id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting employee:', err);
            return { success: false, error: err.response?.data || 'Failed to delete employee' };
        }
    };

    // --- Carwash Types (Services) ---
    const fetchCarwashTypes = async () => {
        try {
            const data = await parkingService.getCarwashTypes();
            setCarwashTypes(data);
            setServices(data); // Keep compatibility with existing code
            return data;
        } catch (err) {
            console.error('Error fetching carwash types:', err);
            throw err;
        }
    };

    const addService = async (serviceData) => {
        try {
            const newService = await parkingService.createCarwashType(serviceData);
            setCarwashTypes([...carwashTypes, newService]);
            setServices([...services, newService]);
            return { success: true, data: newService };
        } catch (err) {
            console.error('Error adding service:', err);
            return { success: false, error: err.response?.data || 'Failed to add service' };
        }
    };

    const updateService = async (id, serviceData) => {
        try {
            const updatedService = await parkingService.updateCarwashType(id, serviceData);
            setCarwashTypes(carwashTypes.map(s => s.carwash_type_id === id ? updatedService : s));
            setServices(services.map(s => s.carwash_type_id === id ? updatedService : s));
            return { success: true, data: updatedService };
        } catch (err) {
            console.error('Error updating service:', err);
            return { success: false, error: err.response?.data || 'Failed to update service' };
        }
    };

    const deleteService = async (id) => {
        try {
            await parkingService.deleteCarwashType(id);
            setCarwashTypes(carwashTypes.filter(s => s.carwash_type_id !== id));
            setServices(services.filter(s => s.carwash_type_id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting service:', err);
            return { success: false, error: err.response?.data || 'Failed to delete service' };
        }
    };

    // --- Reviews ---
    const fetchReviews = async (lotId = null) => {
        try {
            const data = await parkingService.getReviews(lotId);
            setReviews(data);
            return data;
        } catch (err) {
            console.error('Error fetching reviews:', err);
            throw err;
        }
    };

    const addReview = async (reviewData) => {
        try {
            const newReview = await parkingService.createReview(reviewData);
            setReviews([...reviews, newReview]);
            return { success: true, data: newReview };
        } catch (err) {
            console.error('Error adding review:', err);
            return { success: false, error: err.response?.data || 'Failed to add review' };
        }
    };

    // Legacy support (keeping old method names)
    const addUser = () => console.warn('addUser not implemented - use backend API');
    const updateUser = () => console.warn('updateUser not implemented - use backend API');
    const deleteUser = () => console.warn('deleteUser not implemented - use backend API');
    const addOwner = () => console.warn('addOwner not implemented - use backend API');
    const updateOwner = () => console.warn('updateOwner not implemented - use backend API');
    const deleteOwner = () => console.warn('deleteOwner not implemented - use backend API');

    const value = {
        // Data
        users, owners, parkingLots, parkingSlots, bookings, payments,
        services, employees, reviews, carwashes, carwashTypes, tasks,
        
        // Loading & Error
        loading, error,
        
        // Actions - Parking Lots
        fetchParkingLots, addParkingLot: addParkingLot, updateParkingLot: updateParkingLot, deleteParkingLot: deleteParkingLot,
        
        // Actions - Bookings
        fetchBookings, addBooking, updateBooking, deleteBooking,
        
        // Actions - Employees
        fetchEmployees, addEmployee, updateEmployee, deleteEmployee,
        
        // Actions - Services
        fetchCarwashTypes, addService, updateService, deleteService,
        
        // Actions - Reviews
        fetchReviews, addReview,
        
        // Legacy support
        addUser, updateUser, deleteUser,
        addOwner, updateOwner, deleteOwner,
        
        // Refresh all data
        refreshData: fetchAllData
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export default DataContext;
