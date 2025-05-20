import apiClient from './api';

const getCurrentUser = () => {
  return apiClient.get('/users/me');
};

const updateCurrentUser = (userData) => {
  return apiClient.put('/users/me', userData);
};

const deleteCurrentUser = () => {
  return apiClient.delete('/users/me');
};

const userService = {
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
};

export default userService; 