import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import logger from '../utils/logger';

const AuthContext = createContext(null);

const normalizeRole = (role) => {
  if (!role) return role;
  return role.startsWith('ROLE_') ? role.substring(5) : role;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const user = authService.getCurrentUser();
    const token = authService.getToken();
    if (user && token) {
      if (user.role) {
        user.role = normalizeRole(user.role);
      }
      logger.debug('User authenticated:', user.username);
      return user;
    }
    logger.debug('No authenticated user found');
    return null;
  });

  useEffect(() => {

    const handleAuthError = (event) => {
      logger.error('Auth error event received:', event.detail);
      if (event.detail?.status === 401) {
        logout();
      }
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const userData = await authService.login(usernameOrEmail, password);
      if (userData && userData.role) {
        userData.role = normalizeRole(userData.role);
      }
      setCurrentUser(userData);
      logger.debug('User logged in:', userData.username);
      return userData;
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (username, email, password, role) => {
    try {
      const response = await authService.signup({ username, email, password, role });
      // Automatically log in user after successful signup
      if (response.data) {
        const userData = await authService.login(username, password);
        if (userData && userData.role) {
          userData.role = normalizeRole(userData.role);
        }
        setCurrentUser(userData);
        logger.debug('User signed up and logged in:', userData.username);
      }
      return response;
    } catch (error) {
      logger.error('Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    logger.debug('Logging out user');
    authService.logout();
    setCurrentUser(null);
  };

  const isAuthenticated = () => {
    const token = authService.getToken();
    const hasUser = !!currentUser;
    const hasToken = !!token;
    
    logger.debug('Checking authentication:', { hasUser, hasToken });
    
    if (!hasUser || !hasToken) {
      if (!hasUser) logger.debug('No current user found');
      if (!hasToken) logger.debug('No token found');
      return false;
    }
    
    return true;
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 