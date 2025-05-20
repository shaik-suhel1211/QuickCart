import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SellerRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} />;
  }

  if (currentUser.role !== 'SELLER') {
    return <Navigate to="/" />;
  }

  return children;
};

export default SellerRoute; 