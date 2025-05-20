
import axios from 'axios';
import api, { API_URL } from './api';
import logger from '../utils/logger';

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';


const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    logger.error('Invalid JWT format:', { error: error.message });
    return null;
  }
};

const signup = (userData) => {
  logger.debug('Attempting signup:', { email: userData.email });
  return api.post('/auth/signup', userData);
};

const login = async (usernameOrEmail, password) => {
  try {
    const loginRequest = {
      usernameOrEmail: usernameOrEmail?.toString() || '',
      password: password?.toString() || ''
    };

    logger.debug('Attempting login:', {
      usernameOrEmail,
      requestUrl: '/auth/signin'
    });

    const response = await api.post('/auth/signin', loginRequest);

    if (response.data.accessToken) {
      const userData = {
        id: response.data.userId,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      };

      logger.debug('Login successful, storing credentials:', {
        userId: userData.id,
        username: userData.username,
        role: userData.role
      });

      setToken(response.data.accessToken);
      if (response.data.refreshToken) {
        setRefreshToken(response.data.refreshToken);
      }
      setUser(userData);

      return userData;
    }

    throw new Error('No access token received');
  } catch (error) {
    logger.error('Login error:', {
      error: error.response?.data || error.message,
      status: error.response?.status
    });

    if (error.response?.status === 403) {
      throw new Error('Invalid credentials. Please check your username/email and password.');
    }
    throw error;
  }
};

const refreshToken = async () => {
  try {
    const storedRefreshToken = getRefreshToken();
    if (!storedRefreshToken) {
      logger.debug('No refresh token found');
      return null;
    }

    logger.debug('Attempting to refresh token');

    const response = await axios.post(`${API_URL}/auth/refresh-token`,
      { refreshToken: storedRefreshToken },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.data.accessToken) {
      const payload = parseJwt(response.data.accessToken);

      logger.debug('Token refresh successful', {
        newTokenExpiry: new Date(payload?.exp * 1000)
      });

      setToken(response.data.accessToken);
      if (response.data.refreshToken) {
        setRefreshToken(response.data.refreshToken);
      }

      return response.data.accessToken;
    }

    logger.error('Token refresh response missing access token', {
      responseData: response.data
    });
    return null;

  } catch (error) {
    logger.error('Error refreshing token:', {
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    removeToken();
    removeRefreshToken();
    removeUser();
    return null;
  }
};

const logout = () => {
  logger.debug('Logging out user');
  removeToken();
  removeRefreshToken();
  removeUser();
};

const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    logger.debug('No token found in storage');
    return null;
  }

  const payload = parseJwt(token);
  if (!payload) return token;

  const expiry = payload.exp * 1000;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  logger.debug('Token validation:', {
    expiresAt: new Date(expiry),
    currentTime: new Date(now),
    isExpired: now >= expiry,
    userId: payload.userId,
    username: payload.sub,
    tokenType: payload.type
  });

  if (now >= expiry && (now - expiry) <= fiveMinutes) {
    logger.debug('Token expired but within grace period');
    return token;
  }

  if (now >= expiry) {
    logger.debug('Token is expired');
    return null;
  }

  return token;
};

const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

const setRefreshToken = (token) => {
  if (!token) {
    logger.error('Attempted to set null/undefined refresh token');
    return;
  }
  logger.debug('Storing refresh token');
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const setToken = (token) => {
  if (!token) {
    logger.error('Attempted to set null/undefined token');
    return;
  }

  const payload = parseJwt(token);
  if (payload) {
    logger.debug('Storing token:', {
      expiresAt: new Date(payload.exp * 1000),
      userId: payload.userId,
      username: payload.sub,
      tokenType: payload.type
    });
  }

  localStorage.setItem(TOKEN_KEY, token);
};

const removeToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    const payload = parseJwt(token);
    if (payload) {
      logger.debug('Removing token:', {
        userId: payload.userId,
        username: payload.sub,
        tokenType: payload.type
      });
    } else {
      logger.debug('Removing invalid token');
    }
  }
  localStorage.removeItem(TOKEN_KEY);
};

const setUser = (user) => {
  if (!user) {
    logger.error('Attempted to set null/undefined user');
    return;
  }

  logger.debug('Storing user data:', {
    userId: user.id,
    username: user.username,
    role: user.role
  });

  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      logger.debug('Retrieved user from storage:', {
        userId: user.id,
        username: user.username,
        role: user.role
      });
      return user;
    } catch (error) {
      logger.error('Error parsing user data:', {
        error: error.message,
        userStr
      });
      removeUser();
      return null;
    }
  }
  logger.debug('No user found in storage');
  return null;
};

const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

const isAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();
  const isAuth = !!(token && user);

  logger.debug('Authentication check:', {
    hasToken: !!token,
    hasUser: !!user,
    isAuthenticated: isAuth
  });

  return isAuth;
};

const authService = {
  signup,
  login,
  logout,
  getCurrentUser,
  getToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  isAuthenticated,
  removeToken,
  removeUser,
  setToken,
  setUser,
  refreshToken
};

export default authService;

