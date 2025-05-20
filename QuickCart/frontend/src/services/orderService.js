import api from './api';
import authService from './authService';
import logger from '../utils/logger';
import cartService from './cartService';

const createOrder = async (orderRequest) => {
  try {
    // Verify token before making request
    if (!authService.isAuthenticated()) {
      logger.error('User not authenticated when creating order');
      throw new Error('Authentication required');
    }

    if (!orderRequest) {
      logger.error('Order request is null or undefined');
      throw new Error('Order request is required');
    }

    // Validate cart items
    if (!orderRequest.items || !Array.isArray(orderRequest.items) || orderRequest.items.length === 0) {
      logger.error('Cart items are missing or invalid:', orderRequest);
      throw new Error('Cart is empty');
    }

    // Validate each cart item
    const invalidItems = orderRequest.items.filter(item => 
      !item || typeof item !== 'object' || !item.productId || !item.quantity
    );

    if (invalidItems.length > 0) {
      logger.error('Invalid cart items found:', invalidItems);
      throw new Error('Some items in your cart are invalid');
    }

    // Get and validate cart before placing order
    try {
      const cartResponse = await cartService.getCart();
      if (!cartResponse.data || !cartResponse.data.cartItems || cartResponse.data.cartItems.length === 0) {
        throw new Error('Your cart is empty. Please add items before placing an order.');
      }
    } catch (error) {
      if (error.message.startsWith('Cart updated:')) {
        // Cart was updated due to stock changes
        throw new Error(`${error.message}. Please review your cart and try again.`);
      }
      throw error;
    }

    // Log the order request for debugging
    logger.info('Creating order with request:', {
      shippingAddress: orderRequest.shippingAddress,
      paymentMethod: orderRequest.paymentMethod,
      itemCount: orderRequest.items.length
    });

    const response = await api.post('/orders', orderRequest);
    
    logger.info('Order created successfully:', response.data);
    
    if (!response.data || !response.data.id) {
      logger.error('Order created but no order ID received:', response.data);
      throw new Error('Order creation failed: No order ID received');
    }
    
    return response.data;
  } catch (error) {
    logger.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: '/orders',
      method: 'post',
      headers: error.response?.headers
    });

    // Handle 409 Conflict (Insufficient stock) error
    if (error.response?.status === 409) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Insufficient stock';
      
      // Extract product information from error message
      if (errorMessage.includes('for product:')) {
        const productMatch = errorMessage.match(/for product:?\s*([^\.]+)/i);
        const productName = productMatch ? productMatch[1].trim() : 'some items';
        throw new Error(`Unable to place order: ${productName} is out of stock. Please update your cart and try again.`);
      }
      
      // If no product information is found, throw a generic error
      throw new Error(`Unable to place order: ${errorMessage}. Please check your cart and try again.`);
    }

    // Handle 400 Bad Request
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid order request. Please check your cart and try again.');
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }

    // Handle other errors
    throw new Error(error.response?.data?.message || error.message || 'Failed to create order. Please try again.');
  }
};

const getUserOrders = async () => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    return await api.get('/orders');
  } catch (error) {
    logger.error('Error fetching user orders:', error);
    throw error;
  }
};

const getOrderById = async (orderId) => {
  try {
    if (!orderId || orderId === 'undefined') {
      logger.error('Invalid order ID:', orderId);
      throw {
        response: {
          status: 400,
          data: {
            message: 'Invalid order ID'
          }
        }
      };
    }

    if (!authService.isAuthenticated()) {
      logger.error('User not authenticated when fetching order');
      throw new Error('Authentication required');
    }

    // Try to parse the orderId as a number to validate it
    const numericId = Number(orderId);
    if (isNaN(numericId)) {
      logger.error('Invalid order ID format:', orderId);
      throw {
        response: {
          status: 400,
          data: {
            message: 'Invalid order ID format'
          }
        }
      };
    }

    logger.info('Fetching order with ID:', orderId);
    const response = await api.get(`/orders/${orderId}`);
    
    if (!response.data) {
      logger.error('No order data received for ID:', orderId);
      throw new Error('Failed to fetch order: No data received');
    }

    logger.info('Successfully retrieved order:', response.data);
    return response;
  } catch (error) {
    logger.error('Error fetching order:', error);
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    throw error;
  }
};

// Functions for sellers to manage orders
const getSellerOrders = async () => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    return await api.get('/seller/orders');
  } catch (error) {
    logger.error('Error fetching seller orders:', error);
    throw error;
  }
};

const getSellerOrderById = async (orderId) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    return await api.get(`/seller/orders/${orderId}`);
  } catch (error) {
    logger.error('Error fetching seller order:', error);
    throw error;
  }
};

const updateOrderStatusBySeller = async (orderId, newStatus) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    return await api.put(`/seller/orders/${orderId}/status?newStatus=${encodeURIComponent(newStatus)}`);
  } catch (error) {
    logger.error('Error updating order status:', error);
    throw error;
  }
};

const getSellerEarnings = async () => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    const response = await api.get('/seller/earnings');
    return response.data;
  } catch (error) {
    logger.error('Error fetching seller earnings:', error);
    throw error;
  }
};

const orderService = {
  createOrder,
  getUserOrders,
  getOrderById,
  getSellerOrders,
  getSellerOrderById,
  updateOrderStatusBySeller,
  getSellerEarnings
};

export default orderService;