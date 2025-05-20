import React, { createContext, useState, useContext } from 'react';
import productService from '../services/productService';

const ProductContext = createContext(null);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getAllProducts();
      setProducts(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    }
    setLoading(false);
  };

  const searchProducts = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.searchProducts(query);
      setProducts(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search products');
    }
    setLoading(false);
  };

  const getProductById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProductById(id);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch product');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    products,
    loading,
    error,
    fetchProducts,
    searchProducts,
    getProductById
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}; 