import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UserRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} />;
  }

  if (currentUser.role !== 'USER') {
    return <Navigate to="/" />;
  }

  return children;
};

export default UserRoute; 