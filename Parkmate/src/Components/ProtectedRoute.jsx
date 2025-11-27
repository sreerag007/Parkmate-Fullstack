import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const ProtectedRoute = ({ role }) => {
    const { user, owner, admin, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <div>Loading...</div>
            </div>
        );
    }

    // Check authentication based on role
    if (role === 'owner') {
        return owner ? <Outlet /> : <Navigate to="/owner/login" replace />;
    }

    if (role === 'admin') {
        return admin ? <Outlet /> : <Navigate to="/admin/login" replace />;
    }

    if (role === 'user') {
        return user ? <Outlet /> : <Navigate to="/login" replace />;
    }

    // If no role specified, check if any user is logged in
    if (user || owner || admin) {
        return <Outlet />;
    }

    return <Navigate to="/login" replace />;
};

export default ProtectedRoute;