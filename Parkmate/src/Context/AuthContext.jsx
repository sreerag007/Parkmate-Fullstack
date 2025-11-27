import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import axios from "axios";
const apiUrl = import.meta.env.VITE_API_BASE_URL;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [owner, setOwner] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated on mount
        const initAuth = () => {
            const currentUser = authService.getCurrentUser();
            
            if (currentUser.token) {
                const userData = {
                    token: currentUser.token,
                    userId: currentUser.userId,
                    username: currentUser.username,
                    role: currentUser.role
                };

                // Set user based on role (match backend capitalization)
                if (currentUser.role === 'User') {  // Changed from 'user'
                    setUser(userData);
                } else if (currentUser.role === 'Owner') {  // Changed from 'owner'
                    setOwner(userData);
                } else if (currentUser.role === 'Admin') {  // Changed from 'admin'
                    setAdmin(userData);
                }
            }
            
            setLoading(false);
        };

        initAuth();
    }, []);

    // User Login
    const loginUser = async (credentials) => {
        try {
            const response = await authService.login({
                username: credentials.email || credentials.username,
                password: credentials.password
            });

            // ✅ Check for capitalized role from backend
            if (response.role === 'User') {  // Changed from 'user' to 'User'
                const userData = {
                    token: response.token,
                    userId: response.profile_id,
                    username: response.username,
                    role: response.role
                };
                setUser(userData);
                return { success: true, data: userData };
            } else {
                throw new Error('Invalid role for user login');
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || error.response?.data || 'Login failed. Please try again.' 
            };
        }
    };

    // User Logout
    const logoutUser = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
        }
    };

    // Owner Login
    const loginOwner = async (credentials) => {
        try {
            const loginPayload = {
                username: credentials.email || credentials.username,
                password: credentials.password
            };
            
            console.log('🏢 Owner Login - Sending payload:', {
                username: loginPayload.username,
                hasPassword: !!loginPayload.password
            });

            const response = await authService.login(loginPayload);
            
            console.log('🏢 Owner Login - Response received:', {
                role: response.role,
                username: response.username,
                profile_id: response.profile_id
            });

            // ✅ Check for capitalized role from backend
            if (response.role === 'Owner') {  // Changed from 'owner' to 'Owner'
                const ownerData = {
                    token: response.token,
                    userId: response.profile_id,
                    username: response.username,
                    role: response.role
                };
                
                // Store ownerId for dashboard and other owner features
                localStorage.setItem('ownerId', response.profile_id);
                console.log('✅ Owner ownerId stored:', response.profile_id);
                
                setOwner(ownerData);
                return { success: true, data: ownerData };
            } else {
                console.error('❌ Invalid role returned:', response.role);
                throw new Error('Invalid role for owner login. Expected "Owner", got "' + response.role + '"');
            }
        } catch (error) {
            console.error('❌ Owner login error:', error);
            console.error('❌ Error response data:', error.response?.data);
            console.error('❌ Error message:', error.message);
            return { 
                success: false, 
                error: error.response?.data?.detail || error.response?.data?.error || error.message || 'Login failed. Please try again.' 
            };
        }
    };

    // Owner Logout
    const logoutOwner = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setOwner(null);
        }
    };

    // Admin Login
    const loginAdmin = async (credentials) => {
        try {
            console.log('🔐 Admin Login - Received credentials:', credentials);
            
            // Ensure we have username and password
            const loginPayload = {
                username: credentials.username || credentials.email,
                password: credentials.password
            };
            
            console.log('🔐 Admin Login - Sending payload:', {
                username: loginPayload.username,
                hasPassword: !!loginPayload.password
            });

            const response = await authService.login(loginPayload);

            console.log('✅ Admin Login - Response:', response);

            // ✅ Check for capitalized role from backend
            if (response.role === 'Admin') {
                const adminData = {
                    token: response.token,
                    userId: response.profile_id,
                    username: response.username,
                    role: response.role
                };
                setAdmin(adminData);
                return { success: true, data: adminData };
            } else {
                throw new Error('Invalid role for admin login');
            }
        } catch (error) {
            console.error('❌ Admin login error:', error);
            console.error('❌ Error response data:', error.response?.data);
            return { 
                success: false, 
                error: error.response?.data || 'Login failed. Please try again.' 
            };
        }
    };

    // Admin Logout
    const logoutAdmin = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setAdmin(null);
        }
    };

    // Register User
    const registerUser = async (userData) => {
        try {
            const response = await authService.registerUser(userData);
            return { success: true, data: response };
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                error: error.response?.data || 'Registration failed. Please try again.' 
            };
        }
    };

    // Register Owner
    const registerOwner = async (ownerData) => {
        try {
            const response = await authService.registerOwner(ownerData);
            return { success: true, data: response };
        } catch (error) {
            console.error('Owner registration error:', error);
            return { 
                success: false, 
                error: error.response?.data || 'Registration failed. Please try again.' 
            };
        }
    };

    const value = {
        user,
        owner,
        admin,
        loginUser,
        logoutUser,
        loginOwner,
        logoutOwner,
        loginAdmin,
        logoutAdmin,
        registerUser,
        registerOwner,
        loading,
        isAuthenticated: authService.isAuthenticated()
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
