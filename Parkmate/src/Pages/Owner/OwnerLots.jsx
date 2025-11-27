import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import parkingService from '../../services/parkingService';
import './Owner.scss';

const OwnerLots = () => {
    const { owner } = useAuth();
    const [lots, setLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLot, setNewLot] = useState({
        lot_name: '',
        streetname: '',
        locality: '',
        city: '',
        state: '',
        pincode: '',
        total_slots: 10
    });
    const [formError, setFormError] = useState('');
    const [editingLot, setEditingLot] = useState(null);

    // Load lots from backend
    useEffect(() => {
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

        if (owner?.role === 'Owner') {
            loadLots();
        }
    }, [owner]);

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
            // Ensure total_slots is a number
            const lotPayload = {
                ...newLot,
                total_slots: parseInt(newLot.total_slots, 10)
            };
            console.log('📝 Creating new lot with payload:', lotPayload);
            const response = await parkingService.createLot(lotPayload);
            console.log('✅ Lot created successfully:', response);
            console.log('✅ Response total_slots:', response.total_slots, 'Type:', typeof response.total_slots);

            setLots([...lots, response]);
            setNewLot({
                lot_name: '',
                streetname: '',
                locality: '',
                city: '',
                state: '',
                pincode: '',
                total_slots: 10
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
                                <button className="btn-manage">
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
        </div>
    );
};

export default OwnerLots;