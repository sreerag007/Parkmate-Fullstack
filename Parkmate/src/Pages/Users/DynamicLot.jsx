import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import parkingService from '../../services/parkingService';
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

const DynamicLot = () => {
    const { lotId } = useParams();
    const { user } = useAuth();

    const [lotInfo, setLotInfo] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selected, setSelected] = useState(null);
    const [payment, setPayment] = useState('CC');
    const [vehicleType, setVehicleType] = useState('Hatchback');
    const [bookingType, setBookingType] = useState('Instant');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [now, setNow] = useState(Date.now());
    const [userBooking, setUserBooking] = useState(null);
    const timeoutsRef = useRef({});

    // Load lot info and slots from backend
    useEffect(() => {
        const loadLotData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('🔍 Loading data for lot ID:', lotId);

                // Fetch lot details
                const lot = await parkingService.getLotById(lotId);
                console.log('🔍 Lot details:', lot);
                setLotInfo(lot);

                // Fetch slots for this lot
                const allSlots = await parkingService.getSlots();
                console.log('🔍 All slots from API:', allSlots);
                console.log('🔍 Looking for slots with lot_detail.lot_id =', parseInt(lotId));
                
                const lotSlots = allSlots.filter(slot => {
                    console.log('🔍 Checking slot:', slot.slot_id, 'lot_detail:', slot.lot_detail);
                    return slot.lot_detail?.lot_id === parseInt(lotId);
                });
                console.log('🔍 Filtered slots for this lot:', lotSlots);
                
                // Map backend slots to frontend format
                const mappedSlots = lotSlots.map(slot => ({
                    id: slot.slot_id,
                    backendId: slot.slot_id,
                    slotNumber: slot.slot_id, // Use slot_id as display number
                    isAvailable: slot.is_available,
                    vehicleType: slot.vehicle_type,
                    price: slot.price,
                    bookedAt: !slot.is_available ? Date.now() : null
                }));
                console.log('🔍 Mapped slots:', mappedSlots);

                setSlots(mappedSlots);
            } catch (err) {
                console.error('❌ Error loading lot data:', err);
                console.error('❌ Error response:', err.response?.data);
                setError('Failed to load parking lot data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadLotData();
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
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slots]);

    const selectSlot = (id) => {
        const s = slots.find((x) => x.id === id);
        if (!s || !s.isAvailable) return;
        setSelected(id);
    };

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
        } catch (e) {
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
        
        const ok = window.confirm(`Confirm booking for ${vehicleType} in slot #${slot.slotNumber} using ${payment}?`);
        if (!ok) return;

        try {
            console.log('🎯 Creating booking...');
            
            // Get user's vehicle number from profile
            const userProfile = await parkingService.getUserProfile();
            console.log('🎯 User profile:', userProfile);
            
            // Create booking via backend
            const bookingData = {
                slot: slot.backendId,
                vehicle_number: userProfile.vehicle_number,
                booking_type: bookingType
            };
            console.log('🎯 Booking data:', bookingData);

            const booking = await parkingService.createBooking(bookingData);
            console.log('🎯 Booking created:', booking);
            
            // Store user's booking for car wash button
            setUserBooking(booking.booking_id);
            
            // Update local slot status
            setSlots((prev) =>
                prev.map((s) => (s.id === selected ? { ...s, isAvailable: false, bookedAt: Date.now(), vehicleType } : s))
            );

            setSelected(null);
            notify(`Slot #${slot.slotNumber} booked successfully for 1 hour!`);
            
            // Optionally create payment record
            if (payment !== 'Cash') {
                console.log('🎯 Creating payment...');
                await parkingService.createPayment({
                    booking: booking.booking_id,
                    payment_method: payment,
                    amount: booking.price
                });
                console.log('🎯 Payment created');
            }
        } catch (err) {
            console.error('❌ Error creating booking:', err);
            console.error('❌ Error response:', err.response?.data);
            alert('Failed to create booking. Please try again.');
        }
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
            <h1>{lotInfo.lot_name} — Book a Slot</h1>
            <p style={{ color: '#666', marginTop: '-10px' }}>📍 {lotInfo.streetname}, {lotInfo.city}</p>

            <div className="pricing-card">
                <div className="price-header">Parking Rate</div>
                <div className="price-amount">₹50 <span className="per-slot">/ slot</span></div>
                <div className="price-info">Hourly Rate</div>
            </div>

            <p className="lot-desc">Select an available slot below. Bookings last 1 hour and will expire automatically.</p>

            <div className="slots-grid">
                {slots.length === 0 ? (
                    <p>No slots available for this lot.</p>
                ) : (
                    slots.map((s) => {
                        const remaining = s.bookedAt ? ONE_HOUR_MS - (now - s.bookedAt) : null;
                        const isBooked = !s.isAvailable;
                        return (
                            <button
                                key={s.id}
                                className={`slot ${isBooked ? 'booked' : 'available'} ${selected === s.id ? 'selected' : ''}`}
                                onClick={() => selectSlot(s.id)}
                                disabled={isBooked}
                            >
                                <div className="slot-id">#{s.slotNumber}</div>
                                <div className="slot-state">
                                    {isBooked ? `Booked — ${formatRemaining(remaining)}` : `Available - ₹${s.price}/hr`}
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
                        <option value="Advance">Advance Booking</option>
                    </select>
                </div>

                <div className="actions">
                    <button className="btn primary" onClick={bookSlot} disabled={!selected}>Book Selected Slot</button>
                    <Link to="/profile" className="btn ghost" style={{ marginLeft: 8 }}>My Profile</Link>
                    {userBooking && (
                        <Link to={`/service?booking=${userBooking}`} className="btn primary" style={{ marginLeft: 8 }}>Book Car Wash</Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DynamicLot;
