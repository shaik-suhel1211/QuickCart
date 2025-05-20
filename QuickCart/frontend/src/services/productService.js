import apiClient from './api';

const getAllProducts = (pageable) => {
  return apiClient.get('/products', { params: pageable });
};

const getProductById = (id) => {
  if (!id) {
    console.warn('No ID provided to getProductById');
    return Promise.reject(new Error('No ID provided'));
  }
  return apiClient.get(`/products/${id}`);
};



const searchProducts = (filters, pageable) => {
  return apiClient.get('/products/search', { params: { ...filters, ...pageable } });
};

const getCategories = () => {
  return apiClient.get('/products/categories');
};

const getBrands = () => {
  return apiClient.get('/products/brands');
};

// --- Seller specific --- 
const getMyProducts = (pageable) => {
  return apiClient.get('/products/my-products', { params: pageable });
};

const addProduct = (productData) => {
  // productData is expected to be FormData
  return apiClient.post('/products', productData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const updateProduct = (productId, productData) => {
  // productData is expected to be FormData
  return apiClient.put(`/products/${productId}`, productData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const deleteProduct = (productId) => {
  return apiClient.delete(`/products/${productId}`);
};

const getProductsBySellerId = (sellerId, pageable) => {
  return apiClient.get(`/products/seller/${sellerId}`, { params: pageable });
};

const productService = {
  getAllProducts,
  getProductById,
  searchProducts,
  getCategories,
  getBrands,
  addProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getProductsBySellerId,
};

export default productService; 