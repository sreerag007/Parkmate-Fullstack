import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import parkingService from '../../services/parkingService';
import './Lots.css';

const Lots = () => {
  const navigate = useNavigate();
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
        <div className="lot-card-container">
          <h2>Loading parking lots...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='Lot'>
        <div className="lot-card-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: 'red', margin: 0 }}>{error}</h2>
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
      <div className="lot-card-container">
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
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
            title="Refresh to see latest parking lots"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="lot-image-wrapper">
          <img src="src/assets/imgd/Screenshot 2025-11-15 042022.png" alt="Parking Lot Map" />
          <div className="lot-overlay">
            <div className="lot-actions">
              {lots.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No parking lots available at the moment.</p>
                  {user?.role === 'Owner' && (
                    <p style={{ fontSize: '0.9rem', color: '#ffd700' }}>
                      You're logged in as an Owner. Owners only see their own lots.<br/>
                      Please log in as a User to see all available parking lots.
                    </p>
                  )}
                </div>
              ) : (
                lots.map(lot => (
                  <button
                    key={lot.lot_id}
                    className="btn primary"
                    onClick={() => navigate(`/lots/${lot.lot_id}`)}
                  >
                    {lot.lot_name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lots;
