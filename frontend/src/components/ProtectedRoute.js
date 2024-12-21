import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/auth';

// If token is missing, redirect to sign in
function ProtectedRoute({ children }) {
  const isAuth = Boolean(getToken());
  if (!isAuth) {
    console.log('[ProtectedRoute] No token found, redirecting to /signin');
    return <Navigate to="/signin" />;
  }
  console.log('[ProtectedRoute] Token found, rendering child component.');
  return children;
}

export default ProtectedRoute;
