import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import parkingService from '../../services/parkingService';
import LotCard from '../../Components/LotCard';
import './Lots.css';

const Lots = () => {
  const _navigate = useNavigate();
  const { user } = useAuth();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      console.log('🔑 Auth Token exists:', !!token);
      console.log('🔑 Token value:', token?.substring(0, 20) + '...');
      console.log('👤 Current user:', user);
      console.log('👤 User role from localStorage:', userRole);
      
      const data = await parkingService.getLots();
      console.log('🔍 Lots API Response:', data);
      console.log('🔍 Number of lots received:', data?.length || 0);
      
      if (data.length === 0 && userRole === 'Owner') {
        console.warn('⚠️ You are logged in as an Owner with no lots. Regular Users will see all approved lots.');
      }
      
      setLots(data);
    } catch (err) {
      console.error('❌ Error loading lots:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error details:', err.response?.data);
      setError('Failed to load parking lots. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLots();
  }, [user]);

  if (loading) {
    return (
      <div className='Lot'>
        <div className="lot-container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading parking lots...</div>
            <div style={{ fontSize: '0.9rem', color: '#999', marginTop: '10px' }}>Please wait...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='Lot'>
        <div className="lot-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#ef4444', margin: 0 }}>⚠️ {error}</h1>
            <button 
              onClick={loadLots}
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
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='Lot'>
      <div className="lot-container">
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', margin: '0 0 10px 0' }}>
            🅿️ Choose a Parking Lot
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
            Select a lot to view available slots and book your parking
          </p>
        </div>

        {lots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f3f4f6', borderRadius: '12px' }}>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '15px' }}>
              No parking lots available at the moment.
            </p>
            {user?.role === 'Owner' && (
              <p style={{ fontSize: '0.95rem', color: '#7c3aed', fontWeight: '500' }}>
                💡 You're logged in as an Owner. Owners only see their own lots.<br/>
                Please log in as a User to see all available parking lots.
              </p>
            )}
          </div>
        ) : (
          <div className="lots-list">
            {lots.map(lot => (
              <LotCard key={lot.lot_id} lot={lot} />
            ))}
          </div>
        )}

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <button 
            onClick={loadLots}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#10b981',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
            title="Refresh to see latest parking lots"
          >
            🔄 Refresh Lots
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lots;
