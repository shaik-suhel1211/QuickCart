import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ProductProvider } from './contexts/ProductContext';
import { OrderProvider } from './contexts/OrderContext';
import { AUTH_ERROR_EVENT } from './services/api';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import SellerDashboard from './pages/SellerDashboard';
import SellerProductsPage from './pages/SellerProductsPage';
import SellerOrdersPage from './pages/SellerOrdersPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import SellerRoute from './components/SellerRoute';
import UserRoute from './components/UserRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Auth error handler component
const AuthErrorHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthError = (event) => {
      const { redirectUrl } = event.detail;
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    };

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
  }, [navigate]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <OrderProvider>
            <AuthErrorHandler />
            <div className="App">
              <Navbar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                
                {/* Protected Routes */}
                <Route path="/account" element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                } />
                
                {/* User Routes */}
                <Route path="/cart" element={
                  <UserRoute>
                    <CartPage />
                  </UserRoute>
                } />
                <Route path="/checkout" element={
                  <UserRoute>
                    <CheckoutPage />
                  </UserRoute>
                } />
                <Route path="/orders" element={
                  <UserRoute>
                    <OrderHistoryPage />
                  </UserRoute>
                } />
                <Route path="/orders/:id" element={
                  <UserRoute>
                    <OrderDetailPage />
                  </UserRoute>
                } />
                
                {/* Seller Routes */}
                <Route path="/seller/dashboard" element={
                  <SellerRoute>
                    <SellerDashboard />
                  </SellerRoute>
                } />
                <Route path="/seller/products" element={
                  <SellerRoute>
                    <SellerProductsPage />
                  </SellerRoute>
                } />
                <Route path="/seller/orders" element={
                  <SellerRoute>
                    <SellerOrdersPage />
                  </SellerRoute>
                } />
                <Route path="/seller/products/add" element={
                  <SellerRoute>
                    <AddProductPage />
                  </SellerRoute>
                } />
                <Route path="/seller/products/edit/:productId" element={
                  <SellerRoute>
                    <EditProductPage />
                  </SellerRoute>
                } />
              </Routes>
            </div>
          </OrderProvider>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;
