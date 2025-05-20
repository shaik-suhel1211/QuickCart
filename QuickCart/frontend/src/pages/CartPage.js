import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Image, Form, Spinner, Alert, ListGroup, Breadcrumb } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { FaTrash } from 'react-icons/fa';

const CartPage = () => {
  const { 
    cart, 
    updateCartItemQuantity, 
    removeItemFromCart, 
    clearUserCart, 
    loading, 
    error,
    cartItemCount,
    cartTotals
  } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [operationError, setOperationError] = useState(null);

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      setOperationError(null);
      const quantityNum = parseInt(newQuantity);
      if (quantityNum > 0) {
        await updateCartItemQuantity(productId, quantityNum);
      } else if (quantityNum === 0) {
        await handleRemoveItem(productId);
      }
    } catch (err) {
      setOperationError(err.message);
      if (err.message.includes('Please log in')) {
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setOperationError(null);
      console.log('Removing cart item with ID:', itemId);
      await removeItemFromCart(itemId);
    } catch (err) {
      console.error('Error removing item:', err);
      setOperationError(err.message);
      if (err.message.includes('Please log in')) {
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
    }
  };

  const handleClearCart = async () => {
    try {
      setOperationError(null);
      await clearUserCart();
    } catch (err) {
      setOperationError(err.message);
      if (err.message.includes('Please log in')) {
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
    }
  };

  const calculateSubtotal = (item) => {
    console.log('Calculating subtotal for item:', {
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      rawPrice: item.product?.price,
      rawDiscount: item.product?.discountPercentage
    });

    const price = parseFloat(item.product?.price || 0);
    const discount = parseFloat(item.product?.discountPercentage || 0);
    const quantity = parseInt(item.quantity || 0);

    if (isNaN(price) || isNaN(quantity)) {
      console.log('Invalid price or quantity:', { price, quantity });
      return 0;
    }

    const discountedPrice = price * (1 - discount / 100);
    const subtotal = discountedPrice * quantity;

    console.log('Subtotal calculation:', {
      price,
      discount,
      quantity,
      discountedPrice,
      subtotal
    });

    return subtotal;
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      console.log('Invalid price value:', price);
      return '$0.00';
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      console.log('Invalid price value:', price);
      return '$0.00';
    }
    return `$${numPrice.toFixed(2)}`;
  };

  const getImageUrl = (product) => {
    if (!product?.imageUrl) return 'https://via.placeholder.com/100?text=No+Image';
    
    if (product.imageUrl.startsWith('http')) {
      return product.imageUrl;
    }
    
    // Handle different image URL formats
    if (product.imageUrl.startsWith('/api/product-images/')) {
      return `http://localhost:8080${product.imageUrl}`;
    }
    
    if (product.imageUrl.startsWith('/product-images/')) {
      return `http://localhost:8080/api${product.imageUrl}`;
    }
    
    return `http://localhost:8080/${product.imageUrl.replace(/^\/?/, '')}`
  };

  const calculateGrandTotal = () => {
    if (!cart?.cartItems?.length) return 0;
    return cart.cartItems.reduce((total, item) => {
      const subtotal = calculateSubtotal(item);
      return total + (isNaN(subtotal) ? 0 : subtotal);
    }, 0);
  };

  if (loading && !cart) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading cart...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return <Container><Alert variant="danger" className="my-3">Error loading cart: {error.message || 'Unknown error'}</Alert></Container>;
  }

  if (!currentUser) {
    return (
      <Container className="text-center my-5">
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Home</Breadcrumb.Item>
          <Breadcrumb.Item active>Cart</Breadcrumb.Item>
        </Breadcrumb>
        <h2>Please Log In</h2>
        <p>You need to be logged in to view your cart.</p>
        <Button as={Link} to="/login" variant="primary">Log In</Button>
      </Container>
    );
  }

  if (!cart || cartItemCount === 0) {
    return (
      <Container className="text-center my-5">
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Home</Breadcrumb.Item>
          <Breadcrumb.Item active>Cart</Breadcrumb.Item>
        </Breadcrumb>
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <Button as={Link} to="/products" variant="primary">Shop Now</Button>
      </Container>
    );
  }

  return (
    <Container className="my-4" style={{ maxWidth: '1200px' }}>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Cart</Breadcrumb.Item>
      </Breadcrumb>
      <h2>Your Shopping Cart</h2>
      {loading && <Alert variant="info" className="mt-3">Updating cart...</Alert>}
      {operationError && <Alert variant="danger" className="mt-3">{operationError}</Alert>}
      
      <Row className="g-4 mt-3">
        <Col md={8}>
          <ListGroup variant="flush">
            {cart?.cartItems?.map(item => (
              <ListGroup.Item key={item.id} className="mb-3 p-0">
                <Card>
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={2} xs={3}>
                        <Image 
                          src={getImageUrl(item.product)}
                          alt={item.product?.name || 'Product'} 
                          fluid 
                          rounded 
                          style={{ 
                            width: '100%', 
                            height: '100px', 
                            objectFit: 'contain',
                            backgroundColor: '#f8f9fa'
                          }}
                        />
                      </Col>
                      <Col md={4} xs={9}>
                        <h5>
                          <Link to={`/products/${item.product?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {item.product?.name || 'Product'}
                          </Link>
                        </h5>
                        <p className="text-muted small mb-1">
                          Brand: {item.product?.brand || 'N/A'} | Category: {item.product?.category || 'N/A'}
                        </p>
                        <div className="text-muted small">
                          {Number(item.product?.discountPercentage) > 0 ? (
                            <>
                              <span className="text-decoration-line-through me-2">
                                {formatPrice(item.product?.price)}
                              </span>
                              <span className="text-danger">
                                {formatPrice(Number(item.product?.price) * (1 - Number(item.product?.discountPercentage) / 100))}
                              </span>
                              <span className="text-success ms-2">
                                ({item.product?.discountPercentage}% off)
                              </span>
                            </>
                          ) : (
                            <span>{formatPrice(item.product?.price)}</span>
                          )}
                        </div>
                      </Col>
                      <Col md={3} xs={6} className="mt-2 mt-md-0">
                        <Form.Group controlId={`quantity-${item.product?.id}`} className="d-flex align-items-center">
                          <Form.Label className="me-2 visually-hidden">Qty:</Form.Label>
                          <Form.Control 
                            type="number" 
                            value={item.quantity || 0}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            min="0"
                            style={{ width: '70px' }}
                            disabled={loading}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2} xs={4} className="text-md-end mt-2 mt-md-0">
                        <strong>{formatPrice(calculateSubtotal(item))}</strong>
                      </Col>
                      <Col md={1} xs={2} className="text-end mt-2 mt-md-0">
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleRemoveItem(item.id)} 
                          disabled={loading}
                        >
                          <FaTrash />
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Order Summary</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Subtotal ({cartItemCount || 0} items)</span>
                  <strong>{formatPrice(cartTotals?.subtotal)}</strong>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Total</strong>
                  <strong className="text-primary">{formatPrice(cartTotals?.total)}</strong>
                </ListGroup.Item>
              </ListGroup>
              <Button 
                variant="primary" 
                className="w-100 mt-3"
                as={Link}
                to="/checkout"
                disabled={loading || !cartItemCount}
              >
                Proceed to Checkout
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CartPage;
