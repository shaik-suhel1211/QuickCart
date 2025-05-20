
import axios from 'axios';
  import authService from './authService';
  import logger from '../utils/logger';

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';


  export const AUTH_ERROR_EVENT = 'auth-error';

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Request interceptor
  api.interceptors.request.use(
    async (config) => {

      if (config.url.includes('/auth/') && !config.url.includes('/refresh-token')) {
        return config;
      }


      if (config.url.includes('/refresh-token')) {
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          config.headers.Authorization = `Bearer ${refreshToken}`;
        }
        return config;
      }

      const token = authService.getToken();
      if (!token) {
      console.warn("No token found in authService");
        return config;
      }


      config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );


  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;


      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {

          const newToken = await authService.refreshToken();

          if (newToken) {

            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Retry the original request
            return api(originalRequest);
          } else {
            // If refresh failed, clear auth and redirect to login
            authService.logout();
            window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT, {
              detail: {
                status: 401,
                redirectUrl: window.location.pathname,
                message: 'Your session has expired. Please log in again.'
              }
            }));
          }
        } catch (refreshError) {
          logger.error('Token refresh failed:', refreshError);
          // Clear auth and redirect to login
          authService.logout();
          window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT, {
            detail: {
              status: 401,
              redirectUrl: window.location.pathname,
              message: 'Your session has expired. Please log in again.'
            }
          }));
        }
      } else if (error.response?.status === 500) {
        logger.error('Server error:', {
          url: originalRequest.url,
          method: originalRequest.method,
          error: error.response?.data
        });
      }

      return Promise.reject(error);
    }
  );
  export default api;
  export { API_URL };
