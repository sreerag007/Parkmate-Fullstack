import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import './Log.scss';

export default function Log() {
  const navigate = useNavigate();
  const { loginUser, registerUser } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    firstname: '',
    lastname: '',
    phone: '',
    vehicle_number: '',
    vehicle_type: 'Two-Wheeler'
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Attempting login with:', loginData);

    const result = await loginUser(loginData);
    
    setLoading(false);

    console.log('📊 Login result:', result);

    if (result.success) {
      console.log('✅ Login successful, navigating to profile');
      navigate('/profile');
    } else {
      console.error('❌ Login failed:', result.error);
      setError(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('📝 Attempting registration with:', registerData);

    const result = await registerUser(registerData);
    
    setLoading(false);

    console.log('📊 Registration result:', result);

    if (result.success) {
      setError('');
      alert('Registration successful! Please login.');
      setIsLogin(true);
      setLoginData({ email: registerData.username, password: '' });
    } else {
      console.error('❌ Registration failed:', result.error);
      // Handle backend validation errors
      if (typeof result.error === 'object') {
        const errorMessages = Object.entries(result.error)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        setError(errorMessages);
      } else {
        setError(result.error);
      }
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  return (
    <div className="log-page container">
      <form className="form card" onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit}>
        <h2>{isLogin ? 'Welcome back' : 'Create Account'}</h2>
        
        {error && (
          <div className="form-error" style={{ 
            whiteSpace: 'pre-line', 
            background: '#fee', 
            padding: '10px', 
            borderRadius: '5px',
            color: '#c00'
          }}>
            {error}
          </div>
        )}

        {isLogin ? (
          // Login Form
          <>
            <label>
              <span>Username</span>
              <input 
                type="text"
                name="email"
                value={loginData.email} 
                onChange={handleLoginChange}
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </label>

            <label>
              <span>Password</span>
              <input 
                type="password"
                name="password"
                value={loginData.password} 
                onChange={handleLoginChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </label>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => setIsLogin(false)} 
                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Register here
              </button>
            </p>
          </>
        ) : (
          // Register Form
          <>
            <label>
              <span>Username</span>
              <input 
                type="text"
                name="username"
                value={registerData.username} 
                onChange={handleRegisterChange}
                required
                disabled={loading}
              />
            </label>

            <label>
              <span>Email</span>
              <input 
                type="email"
                name="email"
                value={registerData.email} 
                onChange={handleRegisterChange}
                required
                disabled={loading}
              />
            </label>

            <label>
              <span>Password</span>
              <input 
                type="password"
                name="password"
                value={registerData.password} 
                onChange={handleRegisterChange}
                required
                disabled={loading}
              />
            </label>

            <label>
              <span>First Name</span>
              <input 
                type="text"
                name="firstname"
                value={registerData.firstname} 
                onChange={handleRegisterChange}
                required
                disabled={loading}
              />
            </label>

            <label>
              <span>Last Name</span>
              <input 
                type="text"
                name="lastname"
                value={registerData.lastname} 
                onChange={handleRegisterChange}
                required
                disabled={loading}
              />
            </label>

            <label>
              <span>Phone</span>
              <input 
                type="tel"
                name="phone"
                value={registerData.phone} 
                onChange={handleRegisterChange}
                placeholder="10-digit number"
                required
                disabled={loading}
              />
            </label>

            <label>
              <span>Vehicle Number</span>
              <input 
                type="text"
                name="vehicle_number"
                value={registerData.vehicle_number} 
                onChange={handleRegisterChange}
                placeholder="KL-08-AZ-1234"
                required
                disabled={loading}
              />
            </label>

            <label>
              <span>Vehicle Type</span>
              <select 
                name="vehicle_type"
                value={registerData.vehicle_type} 
                onChange={handleRegisterChange}
                required
                disabled={loading}
              >
                <option value="Two-Wheeler">Two-Wheeler</option>
                <option value="Three-Wheeler">Three-Wheeler</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Sedan">Sedan</option>
                <option value="Multi-Axle">Multi-Axle</option>
              </select>
            </label>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => setIsLogin(true)} 
                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Login here
              </button>
            </p>
          </>
        )}
      </form>
    </div>
  );
}