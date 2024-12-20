import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/auth';

function ProtectedRoute({ children }) {
  const isAuth = Boolean(getToken());
  return isAuth ? children : <Navigate to="/signin" />;
}

export default ProtectedRoute;
