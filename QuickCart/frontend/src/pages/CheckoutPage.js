import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, ListGroup, Breadcrumb, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import orderService from '../services/orderService';
import { AUTH_ERROR_EVENT } from '../services/api';
import authService from '../services/authService';
import logger from '../utils/logger';
import { toast } from 'react-hot-toast';
import LoginModal from '../components/LoginModal';

const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const { cart, cartItemCount, clearUserCart, loading: cartLoading, fetchCart } = useCart();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Payment method options
  const paymentMethods = [
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'DEBIT_CARD', label: 'Debit Card' },
    { value: 'PAYPAL', label: 'PayPal' },
    { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
  ];

  // Load cart only once on initial mount
  useEffect(() => {
    const loadInitialCart = async () => {
      if (currentUser && !hasAttemptedFetch && !cartLoading) {
        try {
          setHasAttemptedFetch(true);
          await fetchCart(true); // Force fetch on initial load
        } catch (err) {
          logger.error('Error loading cart:', err);
          setError('Failed to load cart. Please try again.');
          toast.error('Failed to load cart. Please try again.');
        } finally {
          setIsInitialLoad(false);
        }
      } else if (!currentUser) {
        setIsInitialLoad(false);
      }
    };

    loadInitialCart();
  }, [currentUser, hasAttemptedFetch, cartLoading, fetchCart]);

  // Handle empty cart redirect
  useEffect(() => {
    if (!isInitialLoad && currentUser && cart && cartItemCount === 0 && !cartLoading) {
      setError('Your cart is empty. Please add items before proceeding to checkout.');
      toast.error('Your cart is empty. Please add items before proceeding to checkout.');
      navigate('/cart');
    }
  }, [isInitialLoad, currentUser, cart, cartItemCount, cartLoading, navigate]);

  // New effect to check cart validity before proceeding
  useEffect(() => {
    if (!isInitialLoad && currentUser && cart && !cartLoading) {
      const hasInvalidItems = cart.cartItems.some(item => !item.product || item.product.stock <= 0);
      if (hasInvalidItems) {
        setError('Oops! Some products in your cart are not available right now. Please remove them and try again.');
        toast.error('Oops! Some products in your cart are not available right now. Please remove them and try again.');
        navigate('/cart');
      }
    }
  }, [isInitialLoad, currentUser, cart, cartLoading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const calculateSubtotal = (item) => item.product.price * item.quantity;
  const calculateGrandTotal = () => {
    if (!cart || !cart.cartItems) return 0;
    return cart.cartItems.reduce((total, item) => total + calculateSubtotal(item), 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Check both token and refresh token
    if (!authService.getToken() && !authService.getRefreshToken()) {
      setShowLoginModal(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate shipping address
      if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
        setError('Please fill in all shipping address fields');
        return;
      }

      // Validate cart
      if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        setError('Your cart is empty. Please add items before placing an order.');
        return;
      }

      // Format shipping address as a string
      const formattedAddress = `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.postalCode}, ${shippingAddress.country}`;

      // Create order request
      const orderRequest = {
        shippingAddress: formattedAddress,
        paymentMethod: paymentMethod,
        items: cart.cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      logger.info('Creating order with request:', {
        shippingAddress: orderRequest.shippingAddress,
        paymentMethod: orderRequest.paymentMethod,
        itemCount: orderRequest.items.length
      });

      const order = await orderService.createOrder(orderRequest);
      
      if (!order || !order.id) {
        throw new Error('Order creation failed: No order ID received');
      }

      // Clear cart and redirect to order confirmation
      await clearUserCart();
      navigate(`/orders/${order.id}`);
    } catch (error) {
      logger.error('Error placing order:', error);
      
      // Handle specific error cases
      if (error.message.includes('Insufficient stock')) {
        // Extract product name from error message if available
        const productMatch = error.message.match(/for product:?\s*([^\.]+)/i);
        const productName = productMatch ? productMatch[1].trim() : 'some items';
        setError(`Unable to place order: ${productName} is out of stock. Please update your cart and try again.`);
        
        // Refresh cart to get latest stock information without redirecting
        try {
          await fetchCart(true);
        } catch (refreshError) {
          logger.error('Error refreshing cart:', refreshError);

        }
      } else if (error.message.includes('session has expired') || error.message.includes('unauthorized')) {
        setShowLoginModal(true);
        setError('Your session has expired. Please log in again.');
      } else {
        setError(error.message || 'Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = useCallback(() => {
    setShowLoginModal(false);
    setHasAttemptedFetch(false); // Reset fetch attempt on login
    fetchCart(true);
  }, [fetchCart]);

  // Add effect to handle auth state changes
  useEffect(() => {
    if (currentUser && !cart) {
      fetchCart(true);
    }
  }, [currentUser, cart, fetchCart]);

  // Add effect to handle cart validation
  useEffect(() => {
    if (!isInitialLoad && currentUser && cart && !cartLoading) {
      const hasInvalidItems = cart.cartItems.some(item => !item.product || item.product.stock <= 0);
      if (hasInvalidItems) {
        setError('Some products in your cart are not available right now. Please remove them and try again.');
        navigate('/cart');
      }
    }
  }, [isInitialLoad, currentUser, cart, cartLoading, navigate]);

  useEffect(() => {
    const handleAuthError = (event) => {
      const { message } = event.detail;
      if (!window.location.pathname.includes('/login')) {
        if (message) {
          toast.error(message);
        }
        setShowLoginModal(true);
      }
    };

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
  }, []);

  if (isInitialLoad || cartLoading || (!cart && cartItemCount !== 0)) { 
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading checkout...</span>
        </Spinner>
      </Container>
    );
  }
  
  if (!cart || cartItemCount === 0) {
    return (
      <Container className="text-center my-5">
        <Alert variant="warning">Your cart is empty. Redirecting to cart page...</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Home</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/cart" }}>Cart</Breadcrumb.Item>
        <Breadcrumb.Item active>Checkout</Breadcrumb.Item>
      </Breadcrumb>

      <h2>Checkout</h2>
      {error && (
        <Alert variant="danger" className="my-3">
          {error}
          {error.includes('out of stock') && (
            <div className="mt-2">
              <Button 
                variant="outline-primary" 
                as={Link} 
                to="/cart"
                className="me-2"
                disabled={loading}
              >
                View Cart
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  try {
                    await fetchCart(true);
                  } catch (err) {
                    setError('Failed to refresh cart. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Refreshing...
                  </>
                ) : (
                  'Refresh Cart'
                )}
              </Button>
            </div>
          )}
        </Alert>
      )}

      <Row className="g-5">
        <Col md={7} lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title as="h4" className="mb-3">Shipping Address</Card.Title>
              <Form onSubmit={handlePlaceOrder} noValidate>
                <Row className="g-3">
                  <Col sm={12}>
                    <Form.Group controlId="street">
                      <Form.Label>Street Address</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="street" 
                        placeholder="1234 Main St" 
                        value={shippingAddress.street} 
                        onChange={handleInputChange} 
                        required 
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={12}>
                    <Form.Group controlId="city">
                      <Form.Label>City</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="city" 
                        placeholder="Anytown" 
                        value={shippingAddress.city} 
                        onChange={handleInputChange} 
                        required 
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group controlId="postalCode">
                      <Form.Label>Postal Code</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="postalCode" 
                        placeholder="12345" 
                        value={shippingAddress.postalCode} 
                        onChange={handleInputChange} 
                        required 
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group controlId="country">
                      <Form.Label>Country</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="country" 
                        placeholder="Country" 
                        value={shippingAddress.country} 
                        onChange={handleInputChange} 
                        required 
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />

                <Form.Group className="mb-4">
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    disabled={loading}
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  size="lg" 
                  disabled={loading || cartItemCount === 0}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5} lg={4}>
          <Card className="shadow-sm">
            <Card.Header>
              <h4 className="d-flex justify-content-between align-items-center mb-0">
                <span className="text-primary">Your cart</span>
                <Badge pill bg="primary" className="rounded-pill">{cartItemCount}</Badge>
              </h4>
            </Card.Header>
            <ListGroup variant="flush">
              {cart.cartItems.map(item => (
                <ListGroup.Item key={item.id} className="d-flex justify-content-between lh-sm">
                  <div>
                    <h6 className="my-0">{item.product.name}</h6>
                    <small className="text-muted">Qty: {item.quantity}</small>
                  </div>
                  <span className="text-muted">${calculateSubtotal(item).toFixed(2)}</span>
                </ListGroup.Item>
              ))}
              <ListGroup.Item className="d-flex justify-content-between">
                <span>Total (USD)</span>
                <strong>${calculateGrandTotal().toFixed(2)}</strong>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <LoginModal 
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </Container>
  );
};

export default CheckoutPage;