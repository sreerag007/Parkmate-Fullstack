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
    const [payment, setPayment] = useState('CC');
    const [vehicleType, setVehicleType] = useState('Hatchback');
    const [userVehicleType, setUserVehicleType] = useState(null); // User's registered vehicle type
    const [showAllSlots, setShowAllSlots] = useState(false); // Toggle to show all or only compatible slots
    const [bookingType, setBookingType] = useState('Instant');
    const [advanceStartTime, setAdvanceStartTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [_NOW, setNow] = useState(Date.now());
    const [_SHOW_BOOKING_CONFIRM, _SET_SHOW_BOOKING_CONFIRM] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const timeoutsRef = useRef({});
    const refreshIntervalRef = useRef(null);

    // Function to refresh slots from backend
    const refreshSlots = async () => {
        try {
            console.log('🔄 Refreshing slots from backend...');
            
            // Fetch slots for this lot
            const allSlots = await parkingService.getSlots();
            console.log('🔍 All slots from API:', allSlots);
            console.log('🔍 Looking for slots with lot_detail.lot_id =', parseInt(lotId));
            
            const lotSlots = allSlots.filter(slot => {
                return slot.lot_detail?.lot_id === parseInt(lotId);
            });
            console.log('🔍 Refreshed slots for this lot:', lotSlots);
            
            // Check for any booked slots
            const bookedSlots = lotSlots.filter(s => s.booking);
            console.log(`📊 Total slots: ${lotSlots.length}, Booked slots: ${bookedSlots.length}`);
            if (bookedSlots.length > 0) {
                console.log('📊 Booked slot details:');
                bookedSlots.forEach(s => {
                    console.log(`  - Slot #${s.slot_id}: booking_id=${s.booking.booking_id}, status=${s.booking.status}, end_time=${s.booking.end_time}, is_available=${s.is_available}`);
                });
            }
            
            // Map backend slots to frontend format
            const mappedSlots = lotSlots.map(slot => ({
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
            console.log('🔍 Mapped refreshed slots:', mappedSlots);

            setSlots(mappedSlots);
        } catch (err) {
            console.error('❌ Error refreshing slots:', err);
        }
    };

    // Load lot info and slots from backend
    useEffect(() => {
        const loadLotData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('🔍 Loading data for lot ID:', lotId);

                // Fetch user profile to get vehicle type
                try {
                    const userProfile = await parkingService.getUserProfile();
                    console.log('🚗 User vehicle type:', userProfile.vehicle_type);
                    setUserVehicleType(userProfile.vehicle_type);
                    setVehicleType(userProfile.vehicle_type); // Set default vehicle type to user's
                } catch (err) {
                    console.error('⚠️ Could not fetch user vehicle type:', err);
                }

                // Fetch lot details
                const lot = await parkingService.getLotById(lotId);
                console.log('🔍 Lot details:', lot);
                setLotInfo(lot);

                // Load slots
                await refreshSlots();
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
            
            // Get user's vehicle number from profile
            const userProfile = await parkingService.getUserProfile();
            console.log('🎯 User profile:', userProfile);
            
            // Validate vehicle number exists
            if (!userProfile.vehicle_number) {
                alert('Please add a vehicle number to your profile before booking');
                setShowPaymentModal(false);
                setIsBooking(false);
                return;
            }
            
            // Create booking via backend with payment info
            const bookingData = {
                slot: slot.backendId,
                vehicle_number: userProfile.vehicle_number,
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
                prev.map((s) => (s.id === selected ? { ...s, isAvailable: false, bookedAt: Date.now(), vehicleType } : s))
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
                const errorMsg = err.response.data?.detail || err.response.data?.slot?.[0] || err.response.data?.vehicle_number?.[0] || err.response.data?.booking_type?.[0] || err.response.data?.start_time?.[0] || 'Unknown error';
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

            {userVehicleType && (
                <div style={{ 
                    padding: '12px 16px', 
                    background: '#f0f9ff', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    border: '1px solid #0ea5e9'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <strong>🚗 Your Vehicle:</strong> {userVehicleType}
                            {!showAllSlots && <span style={{ marginLeft: '8px', color: '#0ea5e9' }}>• Showing compatible slots only</span>}
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={showAllSlots} 
                                onChange={(e) => setShowAllSlots(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                            />
                            Show all slots
                        </label>
                    </div>
                </div>
            )}

            <div className="slots-grid">
                {slots.length === 0 ? (
                    <p>No slots available for this lot.</p>
                ) : (
                    slots
                        .filter(s => {
                            // Filter by vehicle type if user has one and showAllSlots is false
                            if (userVehicleType && !showAllSlots) {
                                return s.vehicleType === userVehicleType;
                            }
                            return true;
                        })
                        .map((s) => {
                        // ✅ Calculate remaining time from backend end_time instead of local bookedAt
                        let remaining = null;
                        let isExpired = false;
                        let isCancelledOrCompleted = false;
                        let displayStatus = 'available';
                        let statusLabel = `Available - ₹${s.price}/hr`;
                        
                        // Check vehicle compatibility
                        const isCompatible = !userVehicleType || s.vehicleType === userVehicleType;
                        const vehicleTypeLabel = s.vehicleType ? ` (${s.vehicleType})` : '';
                        
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
                        
                        // ✅ Slot is booked only if:
                        // - displayStatus is 'booked' or 'scheduled'
                        const isBooked = (displayStatus === 'booked' || displayStatus === 'scheduled');
                        const displayAsAvailable = !isBooked;
                        
                        // Disable slot if booked OR incompatible vehicle type
                        const isDisabled = isBooked || !isCompatible;
                        
                        return (
                            <button
                                key={s.id}
                                className={`slot ${displayStatus} ${selected === s.id && displayAsAvailable && isCompatible ? 'selected' : ''} ${!isCompatible ? 'incompatible' : ''}`}
                                onClick={() => isCompatible && selectSlot(s.id)}
                                disabled={isDisabled}
                                title={`Slot #${s.slotNumber} - ${displayStatus.toUpperCase()}${vehicleTypeLabel}${!isCompatible ? ' - Incompatible with your vehicle' : ''}`}
                            >
                                <div className="slot-id">
                                    #{s.slotNumber}
                                    {!isCompatible && <span style={{ marginLeft: '4px', fontSize: '10px' }}>🚫</span>}
                                </div>
                                <div className="slot-state">
                                    {statusLabel}
                                    {!isCompatible && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px' }}>{s.vehicleType}</div>}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            <div className="controls">
                <div className="vehicle-choice">
                    <label>Vehicle Type</label>
                    <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                        <option value="Hatchback">Hatchback</option>
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                        <option value="Three Wheeler">Three Wheeler</option>
                        <option value="Two Wheeler">Two Wheeler</option>
                    </select>
                </div>

                <div className="payment-choice">
                    <label>Payment Method</label>
                    <div>
                        <label>
                            <input type="radio" name="pay" value="CC" checked={payment === 'CC'} onChange={() => setPayment('CC')} /> Credit Card
                        </label>
                        <label>
                            <input type="radio" name="pay" value="Cash" checked={payment === 'Cash'} onChange={() => setPayment('Cash')} /> Cash
                        </label>
                        <label>
                            <input type="radio" name="pay" value="UPI" checked={payment === 'UPI'} onChange={() => setPayment('UPI')} /> UPI
                        </label>
                    </div>
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
                    <button className="btn primary" onClick={bookSlot} disabled={!selected}>Book Selected Slot</button>
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
