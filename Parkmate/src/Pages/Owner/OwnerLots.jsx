import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import parkingService from '../../services/parkingService';
import './Owner.scss';

// Vehicle type pricing configuration (matches backend pricing)
const VEHICLE_PRICES = {
    'Two-Wheeler': 10,
    'Three-Wheeler': 20,
    'Hatchback': 50,
    'Sedan': 50,
    'Multi-Axle': 80
};

const OwnerLots = () => {
    const { owner } = useAuth();
    const [lots, setLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedLot, setSelectedLot] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [lotSlots, setLotSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [newLot, setNewLot] = useState({
        lot_name: '',
        streetname: '',
        locality: '',
        city: '',
        state: '',
        pincode: '',
        total_slots: 10,
        lot_image: null,
        provides_carwash: false
    });
    const [formError, setFormError] = useState('');
    const [_EDITING_LOT, _setEditingLot] = useState(null);
    const [showAddSlotForm, setShowAddSlotForm] = useState(false);
    const [newSlot, setNewSlot] = useState({
        vehicle_type: 'Sedan',
        price: VEHICLE_PRICES['Sedan']
    });

    // Load lots from backend
    useEffect(() => {
        loadLots();
    }, [owner]);

    const loadLots = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📋 Loading owner lots...');
            const lotsData = await parkingService.getLots();
            console.log('✅ Lots loaded:', lotsData);

            setLots(lotsData);
        } catch (err) {
            console.error('❌ Error loading lots:', err);
            setError('Failed to load your parking lots');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLot = async (e) => {
        e.preventDefault();
        setFormError('');

        // Validation
        if (!newLot.lot_name.trim()) {
            setFormError('Lot name is required');
            return;
        }
        if (!newLot.streetname.trim()) {
            setFormError('Street name is required');
            return;
        }
        if (!newLot.city.trim()) {
            setFormError('City is required');
            return;
        }
        if (!newLot.pincode || newLot.pincode.length !== 6) {
            setFormError('PIN code must be 6 digits');
            return;
        }
        if (newLot.total_slots < 1) {
            setFormError('Minimum 1 slot is required');
            return;
        }

        console.log('📝 Form validation passed, newLot data:', newLot);
        console.log('📝 Total slots to be sent:', newLot.total_slots, 'Type:', typeof newLot.total_slots);

        try {
            // Use FormData for multipart/form-data to handle image upload
            const formData = new FormData();
            formData.append('lot_name', newLot.lot_name);
            formData.append('streetname', newLot.streetname);
            formData.append('locality', newLot.locality || '');
            formData.append('city', newLot.city);
            formData.append('state', newLot.state || '');
            formData.append('pincode', newLot.pincode);
            formData.append('total_slots', parseInt(newLot.total_slots, 10));
            formData.append('provides_carwash', newLot.provides_carwash);
            
            // Add image if provided
            if (newLot.lot_image) {
                formData.append('lot_image', newLot.lot_image);
                console.log('📸 Image file added:', newLot.lot_image.name, 'Size:', newLot.lot_image.size);
            }
            
            console.log('📝 Creating new lot with FormData - All fields:');
            // Log all FormData entries for debugging
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  - ${key}: File(${value.name}, ${value.size} bytes)`);
                } else {
                    console.log(`  - ${key}: ${value}`);
                }
            }
            
            const response = await parkingService.createLot(formData);
            console.log('✅ Lot created successfully:', response);
            console.log('✅ Lot image URL from response:', response.lot_image_url || response.lot_image);

            setLots([...lots, response]);
            setNewLot({
                lot_name: '',
                streetname: '',
                locality: '',
                city: '',
                state: '',
                pincode: '',
                total_slots: 10,
                lot_image: null,
                provides_carwash: false
            });
            setShowAddForm(false);
            alert('✅ Parking lot created successfully!');
        } catch (err) {
            console.error('❌ Error creating lot:', err);
            console.error('❌ Error response data:', err.response?.data);
            console.error('❌ Error message:', err.message);
            const errorMsg = typeof err.response?.data === 'object' 
                ? JSON.stringify(err.response.data) 
                : err.response?.data?.error || err.message;
            setFormError('Failed to create lot: ' + errorMsg);
        }
    };

    const handleDeleteLot = async (lotId) => {
        if (window.confirm('Are you sure you want to delete this lot? This action cannot be undone.')) {
            try {
                console.log('🗑️ Deleting lot:', lotId);
                await parkingService.deleteLot(lotId);
                console.log('✅ Lot deleted');

                setLots(lots.filter(lot => lot.lot_id !== lotId));
                alert('✅ Parking lot deleted successfully!');
            } catch (err) {
                console.error('❌ Error deleting lot:', err);
                alert('Failed to delete lot: ' + (err.response?.data?.error || err.message));
            }
        }
    };

    const handleViewDetails = async (lot) => {
        try {
            setSlotsLoading(true);
            setSelectedLot(lot);
            console.log('📍 Loading slots for lot:', lot.lot_id);
            
            // Fetch slots for this lot
            const allSlots = await parkingService.getSlots();
            const lotsSlots = allSlots.filter(slot => slot.lot_detail?.lot_id === lot.lot_id);
            
            console.log('✅ Slots loaded:', lotsSlots);
            setLotSlots(lotsSlots);
            setShowDetailsModal(true);
        } catch (err) {
            console.error('❌ Error loading lot details:', err);
            alert('Failed to load lot details: ' + (err.response?.data?.error || err.message));
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleVehicleTypeChange = (vehicleType) => {
        setNewSlot({
            vehicle_type: vehicleType,
            price: VEHICLE_PRICES[vehicleType]
        });
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();

        if (!newSlot.price || newSlot.price <= 0) {
            alert('Price must be greater than 0');
            return;
        }

        try {
            console.log('➕ Adding new slot:', { lot: selectedLot.lot_id, ...newSlot });
            const slotData = {
                lot: selectedLot.lot_id,
                vehicle_type: newSlot.vehicle_type,
                price: parseFloat(newSlot.price)
            };

            const response = await parkingService.createSlot(slotData);
            console.log('✅ Slot created:', response);

            // Update local slot list
            setLotSlots([...lotSlots, response]);
            
            // Update selected lot's total_slots if returned in response
            if (response.lot_total_slots !== undefined) {
                console.log(`📊 Updating lot total_slots: ${selectedLot.total_slots} → ${response.lot_total_slots}`);
                setSelectedLot({
                    ...selectedLot,
                    total_slots: response.lot_total_slots,
                    available_slots: response.lot_available_slots
                });
            }
            
            // Refresh all lots to get updated counts
            await loadLots();
            
            setNewSlot({ vehicle_type: 'Sedan', price: VEHICLE_PRICES['Sedan'] });
            setShowAddSlotForm(false);
            alert('✅ Parking slot created successfully!');
        } catch (err) {
            console.error('❌ Error creating slot:', err);
            alert('Failed to create slot: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (window.confirm('Are you sure you want to delete this slot?')) {
            try {
                console.log('🗑️ Deleting slot:', slotId);
                const response = await parkingService.deleteSlot(slotId);
                console.log('✅ Slot deleted:', response);

                // Update local slot list
                setLotSlots(lotSlots.filter(slot => slot.slot_id !== slotId));
                
                // Update selected lot's total_slots if returned in response
                if (response.lot_total_slots !== undefined) {
                    console.log(`📊 Updating lot total_slots: ${selectedLot.total_slots} → ${response.lot_total_slots}`);
                    setSelectedLot({
                        ...selectedLot,
                        total_slots: response.lot_total_slots,
                        available_slots: response.lot_available_slots
                    });
                }
                
                // Refresh all lots to get updated counts
                await loadLots();
                
                alert('✅ Parking slot deleted successfully!');
            } catch (err) {
                console.error('❌ Error deleting slot:', err);
                alert('Failed to delete slot: ' + (err.response?.data?.error || err.message));
            }
        }
    };

    const handleUpdateLotSlots = async (lotId, newSlots) => {
        try {
            console.log('📝 Updating lot slots:', { lotId, newSlots });
            const response = await parkingService.updateLot(lotId, { total_slots: newSlots });
            console.log('✅ Lot updated:', response);

            setLots(lots.map(lot => lot.lot_id === lotId ? response : lot));
        } catch (err) {
            console.error('❌ Error updating lot:', err);
            alert('Failed to update lot: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) {
        return (
            <div className="owner-lots">
                <h1>🅿️ My Parking Lots</h1>
                <p style={{ textAlign: 'center', padding: '40px' }}>Loading your parking lots...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="owner-lots">
                <h1>🅿️ My Parking Lots</h1>
                <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="owner-lots">
            <div className="lots-header">
                <div>
                    <h1>🅿️ My Parking Lots</h1>
                    <p className="subtitle">Manage your parking lot configurations and availability</p>
                </div>
                <button 
                    className="btn-add-lot" 
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    <span className="icon">+</span>
                    {showAddForm ? 'Cancel' : 'Add New Lot'}
                </button>
            </div>

            {/* Add New Lot Form */}
            {showAddForm && (
                <div className="add-lot-form-container">
                    <h2>Create New Parking Lot</h2>
                    {formError && (
                        <div className="form-error">
                            {formError}
                        </div>
                    )}
                    <form onSubmit={handleAddLot} className="add-lot-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Lot Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Downtown Parking"
                                    value={newLot.lot_name}
                                    onChange={(e) => setNewLot({ ...newLot, lot_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Street Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Main Street"
                                    value={newLot.streetname}
                                    onChange={(e) => setNewLot({ ...newLot, streetname: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Locality</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Downtown Area"
                                    value={newLot.locality}
                                    onChange={(e) => setNewLot({ ...newLot, locality: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>City *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., New York"
                                    value={newLot.city}
                                    onChange={(e) => setNewLot({ ...newLot, city: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>State</label>
                                <input
                                    type="text"
                                    placeholder="e.g., New York"
                                    value={newLot.state}
                                    onChange={(e) => setNewLot({ ...newLot, state: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>PIN Code (6 digits) *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 123456"
                                    value={newLot.pincode}
                                    onChange={(e) => setNewLot({ ...newLot, pincode: e.target.value })}
                                    maxLength="6"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group-slots">
                            <label>Total Parking Slots *</label>
                            <div className="slot-counter-large">
                                <button
                                    type="button"
                                    className="counter-btn decrease"
                                    onClick={() => setNewLot({ ...newLot, total_slots: Math.max(1, newLot.total_slots - 1) })}
                                >
                                    −
                                </button>
                                <span className="counter-value">{newLot.total_slots}</span>
                                <button
                                    type="button"
                                    className="counter-btn increase"
                                    onClick={() => setNewLot({ ...newLot, total_slots: newLot.total_slots + 1 })}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Lot Image (Optional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setNewLot({ ...newLot, lot_image: e.target.files[0] || null })}
                            />
                            {newLot.lot_image && (
                                <div style={{ marginTop: '10px', color: '#10b981', fontSize: '0.9rem' }}>
                                    ✓ {newLot.lot_image.name}
                                </div>
                            )}
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={newLot.provides_carwash}
                                    onChange={(e) => setNewLot({ ...newLot, provides_carwash: e.target.checked })}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                    title="Enable this if your parking lot also offers car wash services (add-on or stand-alone)"
                                />
                                <span style={{ fontSize: '16px', fontWeight: '500' }}>
                                    🚗 This parking lot provides car wash services
                                </span>
                            </label>
                            <p style={{ fontSize: '13px', color: '#666', marginTop: '5px', marginLeft: '30px' }}>
                                Check this box if your lot offers car wash services (add-on for parking customers or standalone)
                            </p>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn-save-changes">
                                Create Parking Lot
                            </button>
                            <button 
                                type="button" 
                                className="btn-cancel"
                                onClick={() => setShowAddForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lots Grid */}
            <div className="lots-grid">
                {lots.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                        <p style={{ fontSize: '18px', color: '#666' }}>
                            No parking lots yet. Create your first lot to get started! 🎯
                        </p>
                    </div>
                ) : (
                    lots.map(lot => (
                        <div key={lot.lot_id} className="lot-card-modern">
                            <div className="lot-card-header">
                                <div className="lot-icon">🅿️</div>
                                <div className="lot-title-section">
                                    <h3 className="lot-name">{lot.lot_name}</h3>
                                    <p className="lot-location">
                                        📍 {lot.streetname}, {lot.city}
                                    </p>
                                </div>
                            </div>

                            <div className="lot-stats-section">
                                <div className="stat-box">
                                    <label>Total Slots</label>
                                    <div className="slot-counter">
                                        <button
                                            className="counter-btn decrease"
                                            onClick={() => handleUpdateLotSlots(lot.lot_id, lot.total_slots - 1)}
                                            disabled={lot.total_slots <= 1}
                                        >
                                            −
                                        </button>
                                        <span className="counter-value">{lot.total_slots}</span>
                                        <button
                                            className="counter-btn increase"
                                            onClick={() => handleUpdateLotSlots(lot.lot_id, lot.total_slots + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="stat-box">
                                    <label>Available Slots</label>
                                    <div className="occupancy-display">
                                        <span className="occupied">{lot.available_slots || 0}</span>
                                        <span className="separator">/</span>
                                        <span className="total">{lot.total_slots}</span>
                                    </div>
                                    <div className="occupancy-bar">
                                        <div 
                                            className="occupancy-fill" 
                                            style={{
                                                width: `${100 - ((lot.available_slots || 0) / lot.total_slots * 100)}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="lot-card-actions">
                                <button 
                                    className="btn-manage"
                                    onClick={() => handleViewDetails(lot)}
                                >
                                    <span className="btn-icon">⚙️</span>
                                    View Details
                                </button>
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDeleteLot(lot.lot_id)}
                                >
                                    <span className="btn-icon">🗑️</span>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Lot Details Modal */}
            {showDetailsModal && selectedLot && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)} style={{ overflow: 'hidden' }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div className="modal-header" style={{ flexShrink: 0 }}>
                            <h2>🅿️ {selectedLot.lot_name} - Details</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                            {/* Lot Information */}
                            <div className="details-section">
                                <h3>Lot Information</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Lot Name</label>
                                        <p>{selectedLot.lot_name}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Address</label>
                                        <p>{selectedLot.streetname}, {selectedLot.locality}, {selectedLot.city}, {selectedLot.state} {selectedLot.pincode}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Total Slots</label>
                                        <p>{selectedLot.total_slots}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Available Slots</label>
                                        <p>{selectedLot.available_slots || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Parking Slots */}
                            <div className="details-section">
                                <div className="section-header">
                                    <h3>Parking Slots ({lotSlots.length})</h3>
                                    <button 
                                        className="btn-add-slot"
                                        onClick={() => setShowAddSlotForm(!showAddSlotForm)}
                                    >
                                        {showAddSlotForm ? '✕ Cancel' : '+ Add Slot'}
                                    </button>
                                </div>

                                {/* Add Slot Form */}
                                {showAddSlotForm && (
                                    <div className="add-slot-form">
                                        <h4>Create New Parking Slot</h4>
                                        <form onSubmit={handleAddSlot}>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Vehicle Type</label>
                                                    <select
                                                        value={newSlot.vehicle_type}
                                                        onChange={(e) => handleVehicleTypeChange(e.target.value)}
                                                    >
                                                        <option value="Two-Wheeler">Two-Wheeler</option>
                                                        <option value="Three-Wheeler">Three-Wheeler</option>
                                                        <option value="Hatchback">Hatchback</option>
                                                        <option value="Sedan">Sedan</option>
                                                        <option value="Multi-Axle">Multi-Axle</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label>Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Auto-filled based on vehicle type"
                                                        value={newSlot.price}
                                                        onChange={(e) => setNewSlot({ ...newSlot, price: e.target.value })}
                                                        step="0.01"
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <button type="submit" className="btn-save-changes">
                                                Create Slot
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Slots List */}
                                {slotsLoading ? (
                                    <p style={{ textAlign: 'center', padding: '20px' }}>Loading slots...</p>
                                ) : lotSlots.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                        No slots created yet. Add one to get started!
                                    </p>
                                ) : (
                                    <div className="slots-table">
                                        <div className="table-header">
                                            <div className="col-slot-id">Slot ID</div>
                                            <div className="col-vehicle">Vehicle Type</div>
                                            <div className="col-price">Price</div>
                                            <div className="col-status">Status</div>
                                            <div className="col-actions">Actions</div>
                                        </div>
                                        {lotSlots.map(slot => (
                                            <div key={slot.slot_id} className="table-row">
                                                <div className="col-slot-id">#{slot.slot_id}</div>
                                                <div className="col-vehicle">{slot.vehicle_type}</div>
                                                <div className="col-price">₹{slot.price}</div>
                                                <div className="col-status">
                                                    <span className={`status-badge ${slot.is_available ? 'available' : 'booked'}`}>
                                                        {slot.is_available ? '✓ Available' : '✗ Booked'}
                                                    </span>
                                                </div>
                                                <div className="col-actions">
                                                    <button
                                                        className="btn-slot-delete"
                                                        onClick={() => handleDeleteSlot(slot.slot_id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer" style={{ flexShrink: 0 }}>
                            <button 
                                className="btn-close"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerLots;