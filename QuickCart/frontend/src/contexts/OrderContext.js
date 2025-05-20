import React, { createContext, useState, useContext } from 'react';
import orderService from '../services/orderService';

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

 const fetchOrders = async () => {
   setLoading(true);
   setError(null);
   try {
     const response = await orderService.getUserOrders();
     console.log('Fetched orders:', response.data);

     if (Array.isArray(response.data.content)) {
       setOrders(response.data.content);
     } else {
       setOrders([]);
       setError('Orders data is in unexpected format.');
     }
   } catch (err) {
     setOrders([]);
     setError(err.response?.data?.message || 'Failed to fetch orders');
   } finally {
     setLoading(false);
   }
 };



  const getOrderById = async (id) => {
    if (!id || id === 'undefined') {
      setError('Invalid order ID');
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrderById(id);
      
      if (!response?.data) {
        throw new Error('No order data received');
      }

      return response.data;
    } catch (err) {
      let errorMessage = 'Failed to fetch order';
      
      if (err.response?.status === 400) {
        errorMessage = err.response.data.message || 'Invalid order ID';
      } else if (err.response?.status === 404) {
        errorMessage = 'Order not found. Please check the order ID and try again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Please log in to view order details';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error occurred while fetching order';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      if (!orderData) {
        throw new Error('Order data is required');
      }

      // Validate cart items
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Your cart is empty. Please add items before placing an order.');
      }

      // Validate quantities
      const invalidItems = orderData.items.filter(item => 
        !item.quantity || item.quantity <= 0 || item.quantity > item.product.stock
      );

      if (invalidItems.length > 0) {
        const itemNames = invalidItems.map(item => item.product.name).join(', ');
        throw new Error(`Invalid quantities for: ${itemNames}. Please check stock availability.`);
      }

      const response = await orderService.createOrder(orderData);
      
      if (!response?.data) {
        throw new Error('Failed to create order: No data received');
      }

      return response.data;
    } catch (err) {
      let errorMessage = 'Failed to create order';
      
      if (err.response?.status === 400) {
        errorMessage = err.response.data.message || 'Invalid order data';
      } else if (err.response?.status === 401) {
        errorMessage = 'Please log in to create an order';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error occurred while creating order';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    orders,
    loading,
    error,
    fetchOrders,
    getOrderById,
    createOrder
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}; 