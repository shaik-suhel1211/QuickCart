import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';

const CartContext = createContext({
  cart: null,
  fetchCart: () => {},
  addItemToCart: () => {},
  updateCartItemQuantity: () => {},
  removeItemFromCart: () => {},
  clearUserCart: () => {},
  cartItemCount: 0,
  cartTotals: { subtotal: 0, total: 0 },
  loading: false,
  error: null
});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const lastFetchTime = useRef(0);
  const fetchTimeout = useRef(null);
  const CACHE_DURATION = 5000; // 5 seconds cache

  const fetchCart = useCallback(async (force = false) => {
    if (!currentUser || currentUser.role !== 'USER') {
      setCart(null);
      return;
    }

    const now = Date.now();
    if (!force && now - lastFetchTime.current < CACHE_DURATION) {
      logger.debug('Using cached cart data');
      return;
    }

    // Clear any existing timeout
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }

    // Set a new timeout to debounce the fetch
    fetchTimeout.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await cartService.getCart();
        logger.debug('Cart fetched successfully:', response.data);
        setCart(response.data);
        lastFetchTime.current = Date.now();
      } catch (err) {
        logger.error('Fetch cart error:', err);
        if (err.response?.status === 401) {
          setCart(null);
          navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
        } else {
          setError(err.response?.data?.message || 'Failed to fetch cart.');
        }
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  }, [currentUser, navigate]);


  useEffect(() => {
    return () => {
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchCart(true);
  }, [fetchCart]);

  const addItemToCart = async (productId, quantity) => {
    if (!currentUser || currentUser.role !== 'USER') {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      throw new Error('Please log in to add items to cart');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await cartService.addItem({ productId, quantity });
      setCart(response.data);
      lastFetchTime.current = Date.now();
      return response.data;
    } catch (err) {
      logger.error('Add to cart error:', err);
      if (err.response?.status === 401) {
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
        throw new Error('Please log in to add items to cart');
      }
      setError(err.response?.data?.message || 'Failed to add item to cart.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItemQuantity = async (productId, quantity) => {
    if (!currentUser || currentUser.role !== 'USER') {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      throw new Error('Please log in to update cart');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await cartService.updateItemQuantity(productId, quantity);
      setCart(response.data);
      lastFetchTime.current = Date.now();
    } catch (err) {
      logger.error('Update cart error:', err);
      if (err.response?.status === 401) {
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
        throw new Error('Please log in to update cart');
      }
      setError(err.response?.data?.message || 'Failed to update item quantity.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItemFromCart = async (itemId) => {
    if (!currentUser || currentUser.role !== 'USER') {
      throw new Error('Please log in to remove items from cart');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await cartService.removeItem(itemId);
      setCart(response.data);
      lastFetchTime.current = Date.now();
      return response.data;
    } catch (err) {
      logger.error('Remove from cart error:', err);
      if (err.response?.status === 401) {
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
        throw new Error('Please log in to remove items from cart');
      }
      if (err.response?.status === 404) {
        await fetchCart(true);
        throw new Error('Item not found in cart');
      }
      setError(err.response?.data?.message || 'Failed to remove item from cart.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearUserCart = async () => {
    if (!currentUser || currentUser.role !== 'USER') {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      throw new Error('Please log in to clear cart');
    }

    setLoading(true);
    setError(null);
    try {
      await cartService.clearCart();
      setCart(null);
      lastFetchTime.current = Date.now();
    } catch (err) {
      logger.error('Clear cart error:', err);
      if (err.response?.status === 401) {
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
        throw new Error('Please log in to clear cart');
      }
      setError(err.response?.data?.message || 'Failed to clear cart.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Memoize cart item count calculation
  const cartItemCount = useMemo(() => {
    return cart?.cartItems?.reduce((count, item) => count + item.quantity, 0) || 0;
  }, [cart]);

  // Memoize cart totals calculation
  const cartTotals = useMemo(() => {
    if (!cart?.cartItems) {
      return { subtotal: 0, total: 0 };
    }

    const subtotal = cart.cartItems.reduce((sum, item) => {
      if (!item?.product) return sum;

      const itemPrice = parseFloat(item.product.price || 0);
      const discount = parseFloat(item.product.discountPercentage || 0);
      const quantity = parseInt(item.quantity) || 0;

      if (isNaN(itemPrice) || isNaN(discount) || isNaN(quantity)) {
        return sum;
      }

      const discountedPrice = itemPrice * (1 - discount / 100);
      return sum + (discountedPrice * quantity);
    }, 0);

    const finalSubtotal = Number(subtotal.toFixed(2));
    return {
      subtotal: finalSubtotal,
      total: finalSubtotal
    };
  }, [cart]);

  return (
    <CartContext.Provider value={{
      cart,
      fetchCart,
      addItemToCart,
      updateCartItemQuantity,
      removeItemFromCart,
      clearUserCart,
      cartItemCount,
      cartTotals,
      loading,
      error
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
