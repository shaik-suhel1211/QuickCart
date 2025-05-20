import apiClient from './api';
  import logger from '../utils/logger';

  const validateAndCleanCart = async (cartItems) => {
    try {
      if (!cartItems || !Array.isArray(cartItems)) return [];

      const validItems = [];
      const invalidItems = [];

      for (const item of cartItems) {
        // Get latest product data
        const productResponse = await apiClient.get(`/products/${item.product.id}`);
        const currentStock = productResponse.data.stock;

        if (currentStock <= 0) {
          // Product is out of stock, remove from cart
          await removeItem(item.id);
          invalidItems.push({
            name: item.product.name,
            reason: 'out of stock'
          });
        } else if (item.quantity > currentStock) {
          // Update quantity to match available stock
          await updateItemQuantity(item.id, currentStock);
          validItems.push({
            ...item,
            quantity: currentStock
          });
          invalidItems.push({
            name: item.product.name,
            reason: 'quantity adjusted to available stock',
            oldQuantity: item.quantity,
            newQuantity: currentStock
          });
        } else {
          validItems.push(item);
        }
      }

      return { validItems, invalidItems };
    } catch (error) {
      logger.error('Error validating cart:', error);
      throw error;
    }
  };

  const getCart = async () => {
    try {
      const response = await apiClient.get('/cart');
      // Validate and clean cart items
      if (response.data && response.data.cartItems) {
        const { validItems, invalidItems } = await validateAndCleanCart(response.data.cartItems);

        if (invalidItems.length > 0) {
          const errorMessage = invalidItems.map(item => {
            if (item.reason === 'out of stock') {
              return `${item.name} is out of stock`;
            } else {
              return `${item.name} quantity adjusted from ${item.oldQuantity} to ${item.newQuantity}`;
            }
          }).join(', ');

          throw new Error(`Cart updated: ${errorMessage}`);
        }

        response.data.cartItems = validItems;
      }
      return response;
    } catch (error) {
      logger.error('Error fetching cart:', error);
      throw error;
    }
  };

  const addItem = async (itemRequest) => {
    try {
      // Validate stock before adding
      const productResponse = await apiClient.get(`/products/${itemRequest.productId}`);
      if (productResponse.data.stock < itemRequest.quantity) {
        throw new Error(`Insufficient stock for ${productResponse.data.name}. Available: ${productResponse.data.stock}`);
      }
      return await apiClient.post('/cart/items', itemRequest);
    } catch (error) {
      logger.error('Error adding item to cart:', error);
      throw error;
    }
  };

  const updateItemQuantity = async (itemId, quantity) => {
    try {
      // Get current cart item to check product stock
      const cartResponse = await apiClient.get('/cart');
      const cartItem = cartResponse.data.cartItems.find(item => item.id === itemId);
      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      // Check stock before updating
      if (cartItem.product.stock < quantity) {
        throw new Error(`Insufficient stock for ${cartItem.product.name}. Available: ${cartItem.product.stock}`);
      }

      return await apiClient.put(`/cart/items/${itemId}`, null, { params: { quantity } });
    } catch (error) {
      logger.error('Error updating cart item quantity:', error);
      throw error;
    }
  };

  const removeItem = async (itemId) => {
    try {
      return await apiClient.delete(`/cart/items/${itemId}`);
    } catch (error) {
      logger.error('Error removing item from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      return await apiClient.delete('/cart');
    } catch (error) {
      logger.error('Error clearing cart:', error);
      throw error;
    }
  };

  const cartService = {
    getCart,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    validateAndCleanCart
  };

  export default cartService;