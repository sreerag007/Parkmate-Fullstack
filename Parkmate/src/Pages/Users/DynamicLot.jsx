import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import parkingService from '../../services/parkingService';
import PaymentModal from '../../Components/PaymentModal';
import './Lot1.scss';

const ONE_HOUR_MS = 60 * 60 * 1000;

function formatRemaining(ms) {
    if (ms <= 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

// Convert Date object to datetime-local format (YYYY-MM-DDTHH:mm)
// This ensures the min/max values match the user's local timezone
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const DynamicLot = () => {
    const { lotId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [lotInfo, setLotInfo] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selected, setSelected] = useState(null);
    const [selectedVehicleType, setSelectedVehicleType] = useState('All'); // Dynamic vehicle type filter
    const [userVehicleType, setUserVehicleType] = useState(null); // User's registered vehicle type
    const [vehicleNumber, setVehicleNumber] = useState(''); // Editable vehicle number for this booking
    const [vehicleValidation, setVehicleValidation] = useState({ checking: false, available: true, message: '' });
    const [bookingType, setBookingType] = useState('Instant');
    const [advanceStartTime, setAdvanceStartTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false); // Loading state for slot filtering
    const [error, setError] = useState(null);
    const [_NOW, setNow] = useState(Date.now());
    const [_SHOW_BOOKING_CONFIRM, _SET_SHOW_BOOKING_CONFIRM] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const timeoutsRef = useRef({});
    const refreshIntervalRef = useRef(null);
    const vehicleCheckTimeoutRef = useRef(null);

    // Function to check vehicle availability
    const checkVehicleAvailability = async (vehicle_number) => {
        if (!vehicle_number || vehicle_number.length < 3) {
            setVehicleValidation({ checking: false, available: true, message: '' });
            return;
        }

        try {
            setVehicleValidation({ checking: true, available: true, message: 'Checking...' });
            
            const response = await parkingService.checkVehicleAvailability(vehicle_number.trim().toUpperCase());
            
            if (response.available) {
                setVehicleValidation({ 
                    checking: false, 
                    available: true, 
                    message: '' 
                });
            } else {
                setVehicleValidation({ 
                    checking: false, 
                    available: false, 
                    message: response.message || 'Vehicle already has an active booking'
                });
            }
        } catch (err) {
            console.error('Error checking vehicle availability:', err);
            setVehicleValidation({ checking: false, available: true, message: '' });
        }
    };

    // Debounced vehicle check
    const handleVehicleNumberChange = (value) => {
        setVehicleNumber(value);
        
        // Clear previous timeout
        if (vehicleCheckTimeoutRef.current) {
            clearTimeout(vehicleCheckTimeoutRef.current);
        }
        
        // Set new timeout for validation check (500ms delay)
        vehicleCheckTimeoutRef.current = setTimeout(() => {
            checkVehicleAvailability(value);
        }, 500);
    };

    // Function to refresh slots from backend with optional filters
    const refreshSlots = async (vehicleTypeFilter = selectedVehicleType) => {
        try {
            setLoadingSlots(true);
            console.log('🔄 Refreshing slots from backend...');
            console.log('🔍 Vehicle type filter:', vehicleTypeFilter);
            console.log('🔍 Lot ID:', lotId);
            
            // Build query parameters
            const params = {
                lot_id: lotId
            };
            
            // Add vehicle type filter if not "All"
            if (vehicleTypeFilter && vehicleTypeFilter !== 'All') {
                params.vehicle_type = vehicleTypeFilter;
            }
            
            console.log('📤 Request params:', params);
            
            // Fetch slots with filters
            const filteredSlots = await parkingService.getSlots(params);
            console.log('🔍 Filtered slots from API:', filteredSlots);
            
            // Map backend slots to frontend format
            const mappedSlots = filteredSlots.map(slot => ({
                id: slot.slot_id,
                backendId: slot.slot_id,
                slotNumber: slot.slot_id,
                isAvailable: slot.is_available,
                vehicleType: slot.vehicle_type,
                price: slot.price,
                // ✅ Use booking.end_time from backend instead of bookedAt
                booking: slot.booking, // Store full booking object with end_time
                bookedAt: slot.booking ? new Date(slot.booking.end_time).getTime() - (3600 * 1000) : null // Calculate initial bookedAt
            }));
            console.log('🔍 Mapped filtered slots:', mappedSlots);

            setSlots(mappedSlots);
        } catch (err) {
            console.error('❌ Error refreshing slots:', err);
        } finally {
            setLoadingSlots(false);
        }
    };

    // Load lot info and slots from backend
    useEffect(() => {
        const loadLotData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('🔍 Loading data for lot ID:', lotId);

                // Fetch user profile to get vehicle type and vehicle number
                try {
                    const userProfile = await parkingService.getUserProfile();
                    console.log('🚗 User vehicle type:', userProfile.vehicle_type);
                    console.log('🚗 User vehicle number:', userProfile.vehicle_number);
                    setUserVehicleType(userProfile.vehicle_type);
                    // Auto-fill vehicle number from user profile
                    setVehicleNumber(userProfile.vehicle_number || '');
                } catch (err) {
                    console.error('⚠️ Could not fetch user profile:', err);
                }

                // Set default filter to 'All'
                setSelectedVehicleType('All');

                // Fetch lot details
                const lot = await parkingService.getLotById(lotId);
                console.log('🔍 Lot details:', lot);
                setLotInfo(lot);

                // Load all slots (no vehicle type filter)
                console.log('🔍 Initial load with vehicle type: All');
                await refreshSlots('All');
            } catch (err) {
                console.error('❌ Error loading lot data:', err);
                console.error('❌ Error response:', err.response?.data);
                setError('Failed to load parking lot data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadLotData();

        // Set up periodic refresh every 5 seconds (increased from 10) to catch expired bookings faster
        refreshIntervalRef.current = setInterval(() => {
            refreshSlots();
        }, 5000);

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [lotId]);

    // Refresh slots when vehicle type filter changes
    useEffect(() => {
        if (lotInfo) { // Only refresh if lot data is loaded
            console.log('🔄 Vehicle type changed to:', selectedVehicleType);
            refreshSlots(selectedVehicleType);
        }
    }, [selectedVehicleType]);

    // Clock tick
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    // Manage automatic release
    useEffect(() => {
        Object.values(timeoutsRef.current).forEach((id) => clearTimeout(id));
        timeoutsRef.current = {};

        slots.forEach((s) => {
            if (s.bookedAt) {
                const elapsed = Date.now() - s.bookedAt;
                const remaining = ONE_HOUR_MS - elapsed;
                if (remaining <= 0) {
                    releaseSlot(s.id);
                } else {
                    const to = setTimeout(() => {
                        releaseSlot(s.id);
                        notify(`Booking ended for slot #${s.id}`);
                    }, remaining);
                    timeoutsRef.current[s.id] = to;
                }
            }
        });

        return () => {
            Object.values(timeoutsRef.current).forEach((id) => clearTimeout(id));
            timeoutsRef.current = {};
            // Clean up refresh interval on unmount
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slots]);

    const selectSlot = (id) => {
        const s = slots.find((x) => x.id === id);
        if (!s || !s.isAvailable) return;
        setSelected(id);
    };

    // Handle slot deletion - if selected slot is deleted, deselect it
    useEffect(() => {
        if (selected && !slots.find(s => s.id === selected)) {
            console.log('🗑️ Selected slot was deleted, clearing selection');
            setSelected(null);
        }
    }, [slots, selected]);

    const notify = (text) => {
        try {
            if (window.Notification && Notification.permission === 'granted') {
                new Notification('PARKMATE', { body: text });
            } else if (window.Notification && Notification.permission !== 'denied') {
                Notification.requestPermission().then((p) => {
                    if (p === 'granted') new Notification('PARKMATE', { body: text });
                    else alert(text);
                });
            } else {
                alert(text);
            }
        } catch {
            alert(text);
        }
    };

    const bookSlot = async () => {
        console.log('🎯 bookSlot called');
        console.log('🎯 selected:', selected);
        console.log('🎯 user:', user);
        
        if (!selected) return alert('Please select a slot first');
        if (!user) return alert('Please login to book a slot');
        
        const slot = slots.find((s) => s.id === selected);
        console.log('🎯 Found slot:', slot);
        
        if (!slot || !slot.isAvailable) return alert('Slot already booked');
        
        // Show payment modal instead of confirmation modal
        setShowPaymentModal(true);
    };

    const handlePaymentConfirm = async (paymentData) => {
        if (!selected) return;
        
        const slot = slots.find((s) => s.id === selected);
        if (!slot) return;

        try {
            setIsBooking(true);
            console.log('🎯 Creating booking with payment...');
            console.log('💳 Payment data:', paymentData);
            console.log('🎯 Booking type:', bookingType);
            console.log('🚗 Vehicle number for booking:', vehicleNumber);
            
            // Validate vehicle number exists
            if (!vehicleNumber || !vehicleNumber.trim()) {
                alert('Please enter a vehicle number for this booking');
                setShowPaymentModal(false);
                setIsBooking(false);
                return;
            }
            
            // Create booking via backend with payment info
            const bookingData = {
                slot: slot.backendId,
                vehicle_number: vehicleNumber.trim().toUpperCase(),
                booking_type: bookingType || 'Instant',
                payment_method: paymentData.payment_method,
                amount: paymentData.amount
            };
            
            // For advance bookings, validate and add start_time
            if (bookingType && bookingType.toLowerCase() === 'advance') {
                if (!advanceStartTime) {
                    alert('Please select a start time for advance booking');
                    setIsBooking(false);
                    return;
                }
                // Parse the selected datetime (datetime-local gives local time, not UTC)
                // Format: "2025-11-28T22:00" - this is in the user's local timezone (IST)
                const [datePart, timePart] = advanceStartTime.split('T');
                const [year, month, day] = datePart.split('-');
                const [hours, minutes] = timePart.split(':');
                
                // Create a local date object
                const selectedDateTime = new Date(
                    parseInt(year),
                    parseInt(month) - 1,  // Month is 0-indexed
                    parseInt(day),
                    parseInt(hours),
                    parseInt(minutes),
                    0,
                    0
                );
                
                const now = new Date();
                const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);

                // Validate 15-minute minimum buffer (compare in local time)
                if (selectedDateTime < fifteenMinutesFromNow) {
                    alert('Advance bookings must be at least 15 minutes in the future');
                    setIsBooking(false);
                    return;
                }

                // Send the local datetime directly to backend
                // The backend (now set to IST timezone) will understand this is IST time
                // Format: "2025-11-28T22:25:00" (local IST time string)
                const localTimeString = `${datePart}T${timePart}:00`;
                bookingData.start_time = localTimeString;
                console.log('🎯 Local time selected (IST):', selectedDateTime.toLocaleString());
                console.log('🎯 Sending to backend (IST format):', localTimeString);
            }
            
            console.log('🎯 Final booking data:', bookingData);

            const booking = await parkingService.createBooking(bookingData);
            console.log('✅ Booking created:', booking);
            console.log('💳 Payments created:', booking.payments);
            
            // Close modal
            setShowPaymentModal(false);
            
            // Redirect to booking confirmation page
            navigate(`/booking-confirmation?booking=${booking.booking_id}`);
            
            // Update local slot status
            setSlots((prev) =>
                prev.map((s) => (s.id === selected ? { ...s, isAvailable: false, bookedAt: Date.now() } : s))
            );

            setSelected(null);
            setAdvanceStartTime(''); // Reset the time picker
        } catch (err) {
            setShowPaymentModal(false);
            console.error('❌ Error booking slot:', err);
            
            // Log detailed error information
            if (err.response) {
                console.error('Error status:', err.response.status);
                console.error('Error data:', err.response.data);
                console.error('Full error response:', JSON.stringify(err.response.data, null, 2));
                
                // Extract error message
                let errorMsg = 'Unknown error';
                if (err.response.data) {
                    // Try different error formats
                    errorMsg = err.response.data?.detail 
                        || err.response.data?.slot?.[0] 
                        || err.response.data?.vehicle_number?.[0] 
                        || err.response.data?.booking_type?.[0] 
                        || err.response.data?.start_time?.[0]
                        || JSON.stringify(err.response.data);
                }
                alert(`Failed to book slot: ${errorMsg}`);
            } else {
                alert('Failed to book slot. Please try again.');
            }
        } finally {
            setIsBooking(false);
        }
    };

    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
    };

    const releaseSlot = async (id) => {
        const slot = slots.find(s => s.id === id);
        if (!slot) return;

        try {
            // Update slot status in backend
            await parkingService.updateSlot(slot.backendId, { is_available: true });
            
            // Update local state
            setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, isAvailable: true, bookedAt: null } : s)));
            
            if (timeoutsRef.current[id]) {
                clearTimeout(timeoutsRef.current[id]);
                delete timeoutsRef.current[id];
            }
        } catch (err) {
            console.error('Error releasing slot:', err);
        }
    };

    if (loading) {
        return <div className="lot1-demo lot1-root"><h1>Loading lot information...</h1></div>;
    }

    if (error) {
        return <div className="lot1-demo lot1-root"><h1 style={{ color: 'red' }}>{error}</h1></div>;
    }

    if (!lotInfo) {
        return <div className="lot1-demo lot1-root"><h1>Lot not found</h1></div>;
    }

    return (
        <div className="lot1-demo lot1-root">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1>{lotInfo.lot_name} — Book a Slot</h1>
                    <p style={{ color: '#666', marginTop: '-10px' }}>📍 {lotInfo.streetname}, {lotInfo.city}</p>
                </div>
                <button 
                    onClick={refreshSlots}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#3b82f6',
                        color: '#fff',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                    title="Refresh slots to see latest updates"
                >
                    🔄 Refresh
                </button>
            </div>

            <div className="pricing-card">
                <div className="price-header">Parking Rate</div>
                <div className="price-amount">₹50 <span className="per-slot">/ slot</span></div>
                <div className="price-info">Hourly Rate</div>
            </div>

            <p className="lot-desc">Select an available slot below. Bookings last 1 hour and will expire automatically.</p>

            {/* Dynamic Vehicle Type Filter */}
            <div style={{ 
                padding: '16px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                borderRadius: '12px', 
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ 
                            display: 'block', 
                            color: '#fff', 
                            fontWeight: '600', 
                            marginBottom: '8px',
                            fontSize: '0.95rem'
                        }}>
                            🚗 Filter by Vehicle Type
                        </label>
                        <select 
                            value={selectedVehicleType} 
                            onChange={(e) => {
                                setSelectedVehicleType(e.target.value);
                                setSelected(null); // Clear selection when filter changes
                            }}
                            disabled={loadingSlots}
                            style={{ 
                                width: '100%', 
                                padding: '12px 16px', 
                                borderRadius: '8px', 
                                border: 'none',
                                fontSize: '1rem',
                                fontWeight: '500',
                                background: '#fff',
                                cursor: loadingSlots ? 'wait' : 'pointer',
                                opacity: loadingSlots ? 0.6 : 1
                            }}
                        >
                            <option value="All">🔍 All Types</option>
                            <option value="Hatchback">🚗 Hatchback</option>
                            <option value="Sedan">🚙 Sedan</option>
                            <option value="Multi-Axle">🚚 Multi-Axle</option>
                            <option value="Three-Wheeler">🛺 Three-Wheeler</option>
                            <option value="Two-Wheeler">🏍️ Two-Wheeler</option>
                        </select>
                    </div>
                    
                    <div style={{ 
                        flex: '1', 
                        minWidth: '200px',
                        color: '#fff',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '4px' }}>
                            {userVehicleType && (
                                <span>Your vehicle: <strong>{userVehicleType}</strong></span>
                            )}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                            {loadingSlots ? (
                                <span>⏳ Loading slots...</span>
                            ) : (
                                <span>
                                    Showing: <strong>{selectedVehicleType === 'All' ? 'All vehicle types' : selectedVehicleType}</strong>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Slots Grid */}
            {loadingSlots ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    background: '#f8fafc', 
                    borderRadius: '12px',
                    border: '2px dashed #cbd5e1'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
                    <p style={{ color: '#64748b', fontWeight: '500' }}>Loading slots...</p>
                </div>
            ) : slots.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    background: '#fef2f2', 
                    borderRadius: '12px',
                    border: '2px dashed #fca5a5'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🚫</div>
                    <p style={{ color: '#dc2626', fontWeight: '600', fontSize: '1.1rem' }}>
                        No slots available for {selectedVehicleType === 'All' ? 'this lot' : selectedVehicleType}
                    </p>
                    {selectedVehicleType !== 'All' && (
                        <button
                            onClick={() => setSelectedVehicleType('All')}
                            style={{
                                marginTop: '16px',
                                padding: '10px 20px',
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Show All Vehicle Types
                        </button>
                    )}
                </div>
            ) : null}

            <div className="slots-grid">
                {!loadingSlots && slots.length > 0 && slots.map((s) => {
                        // ✅ Calculate remaining time from backend end_time instead of local bookedAt
                        let remaining = null;
                        let isExpired = false;
                        let isCancelledOrCompleted = false;
                        let displayStatus = 'available';
                        let statusLabel = `Available - ₹${s.price}/hr`;
                        
                        // 🔥 PRIMARY CHECK: If there's a booking object, the slot is occupied
                        if (s.booking && s.booking.end_time) {
                            const endTime = new Date(s.booking.end_time).getTime();
                            const startTime = new Date(s.booking.start_time).getTime();
                            const currentTime = Date.now(); // Use Date.now() instead of state 'now' for accuracy
                            remaining = Math.max(0, endTime - currentTime);
                            isExpired = remaining <= 0; // ✅ Expired if remaining time is 0 or negative
                            
                            // Get booking status from backend
                            const bookingStatus = s.booking.status ? s.booking.status.toUpperCase() : 'ACTIVE';
                            
                            // Check if booking is cancelled or completed
                            isCancelledOrCompleted = bookingStatus === 'CANCELLED' || bookingStatus === 'COMPLETED';
                            
                            // Determine display status based on booking status
                            if (isCancelledOrCompleted || isExpired) {
                                // Expired or completed bookings show the slot as available
                                displayStatus = 'available';
                                statusLabel = `Available - ₹${s.price}/hr`;
                            } else if (bookingStatus === 'SCHEDULED') {
                                // For scheduled bookings, show when it starts
                                displayStatus = 'scheduled';
                                const startDate = new Date(startTime);
                                const hours = String(startDate.getHours()).padStart(2, '0');
                                const minutes = String(startDate.getMinutes()).padStart(2, '0');
                                statusLabel = `Starts at ${hours}:${minutes}`;
                            } else {
                                // For ACTIVE or other statuses, show remaining time
                                displayStatus = 'booked';
                                statusLabel = `Booked — ${formatRemaining(remaining)}`;
                            }
                        }
                        
                        // ✅ Slot is booked only if displayStatus is 'booked' or 'scheduled'
                        const isBooked = (displayStatus === 'booked' || displayStatus === 'scheduled');
                        const displayAsAvailable = !isBooked;
                        
                        return (
                            <button
                                key={s.id}
                                className={`slot ${displayStatus} ${selected === s.id && displayAsAvailable ? 'selected' : ''}`}
                                onClick={() => selectSlot(s.id)}
                                disabled={isBooked}
                                title={`Slot #${s.slotNumber} - ${displayStatus.toUpperCase()} - ${s.vehicleType}`}
                            >
                                <div className="slot-id">
                                    #{s.slotNumber}
                                    <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>
                                        {s.vehicleType === 'Hatchback' && '🚗'}
                                        {s.vehicleType === 'Sedan' && '🚙'}
                                        {s.vehicleType === 'Multi-Axle' && '🚚'}
                                        {s.vehicleType === 'Three-Wheeler' && '🛺'}
                                        {s.vehicleType === 'Two-Wheeler' && '🏍️'}
                                    </span>
                                </div>
                                <div className="slot-state">
                                    {statusLabel}
                                    <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                                        {s.vehicleType}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                }
            </div>

            <div className="controls">
                <div className="vehicle-choice">
                    <label>Vehicle Number</label>
                    <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => handleVehicleNumberChange(e.target.value.toUpperCase())}
                        placeholder="e.g., KL-08-AZ-1234"
                        required
                        style={{
                            padding: '0.5rem',
                            border: vehicleValidation.available ? '1px solid #ccc' : '2px solid #f59e0b',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            textTransform: 'uppercase',
                            backgroundColor: vehicleValidation.available ? 'white' : '#fffbeb'
                        }}
                    />
                    {vehicleValidation.checking && (
                        <small style={{ color: '#3b82f6', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                            ⏳ Checking availability...
                        </small>
                    )}
                    {!vehicleValidation.checking && !vehicleValidation.available && (
                        <small style={{ color: '#f59e0b', fontSize: '0.85rem', display: 'block', marginTop: '4px', fontWeight: '600' }}>
                            ⚠️ {vehicleValidation.message}
                        </small>
                    )}
                    {!vehicleValidation.checking && vehicleValidation.available && vehicleNumber && (
                        <small style={{ color: '#10b981', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                            ✓ Vehicle available for booking
                        </small>
                    )}
                    <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                        Auto-filled from your profile. Change if booking for another vehicle.
                    </small>
                </div>

                <div className="vehicle-choice">
                    <label>Booking Type</label>
                    <select value={bookingType} onChange={(e) => setBookingType(e.target.value)}>
                        <option value="Instant">Instant Booking</option>
                        <option value="Advance" disabled>Advance Booking (Coming Soon)</option>
                    </select>
                </div>

                {bookingType && bookingType.toLowerCase() === 'advance' && (
                    <div className="vehicle-choice">
                        <label>Select Start Time (min. 15 minutes from now)</label>
                        <input
                            type="datetime-local"
                            value={advanceStartTime}
                            onChange={(e) => setAdvanceStartTime(e.target.value)}
                            min={formatDateTimeLocal(new Date(Date.now() + 15 * 60000))}
                            required
                        />
                    </div>
                )}

                <div className="actions">
                    <button 
                        className="btn primary" 
                        onClick={bookSlot} 
                        disabled={!selected || !vehicleValidation.available || vehicleValidation.checking}
                        title={
                            !selected ? 'Please select a slot' :
                            vehicleValidation.checking ? 'Checking vehicle availability...' :
                            !vehicleValidation.available ? 'This vehicle already has an active booking' :
                            'Proceed to book this slot'
                        }
                    >
                        Book Selected Slot
                    </button>
                    <Link to="/profile" className="btn ghost" style={{ marginLeft: 8 }}>My Profile</Link>
                </div>

                {/* Payment Modal */}
                {showPaymentModal && (
                    <PaymentModal
                        slot={slots.find(s => s.id === selected)}
                        price={slots.find(s => s.id === selected)?.price}
                        onConfirm={handlePaymentConfirm}
                        onClose={handlePaymentCancel}
                        isLoading={isBooking}
                    />
                )}
            </div>
        </div>
    );
};

export default DynamicLot;
