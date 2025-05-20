import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Row, Col, Image, Button, Spinner, Alert, Card, Breadcrumb, Form
} from 'react-bootstrap';
import productService from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const ProductDetailPage = () => {
  const { id: productId } = useParams();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { addItemToCart, cart, loading: cartLoading, error: cartError } = useCart();
  const [addedToCartMessage, setAddedToCartMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (location.state?.product) {
        setProduct(location.state.product);
        setLoading(false);
        return;
      }
      if (!productId) {
        setError('Product ID not found');
        navigate('/products');
        return;
      }

      const id = parseInt(productId);
      if (isNaN(id)) {
        setError('Invalid product ID');
        navigate('/products');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await productService.getProductById(id);
        if (!response.data) {
          setError('Product not found');
          navigate('/products');
          return;
        }
        setProduct(response.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Product not found');
          navigate('/products');
        } else if (err.response?.status === 401) {
          setError('Please log in to view product details');
          navigate('/login?redirect=' + encodeURIComponent(`/products/${id}`));
        } else {
          setError(err.response?.data?.message || err.message || 'Failed to fetch product details.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, navigate, location.state]);

useEffect(() => {
  if (product) {
    console.log("Image URL from backend:", product.imageUrl);
  }
}, [product]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!currentUser) {
      navigate('/login?redirect=' + encodeURIComponent(`/products/${product.id}`));
      return;
    }

    if (currentUser.role === 'SELLER') {
      setAddedToCartMessage('Sellers cannot add items to cart.');
      setTimeout(() => setAddedToCartMessage(''), 3000);
      return;
    }

    setAddedToCartMessage('');
    try {
      await addItemToCart(product.id, quantity);
      setAddedToCartMessage(`${quantity} of ${product.name} added to cart!`);
      setTimeout(() => setAddedToCartMessage(''), 3000);
    } catch (err) {
      if (err.message === 'Please log in to add items to cart' || err.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        navigate('/login?redirect=' + encodeURIComponent(`/products/${product.id}`));
      } else {
        setAddedToCartMessage(err.message || err.response?.data?.message || 'Failed to add item. Please try again.');
        setTimeout(() => setAddedToCartMessage(''), 3000);
      }
    }
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading product details...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return <Container><Alert variant="danger" className="my-3">{error}</Alert></Container>;
  }

  if (!product) {
    return <Container><Alert variant="warning" className="my-3">Product not found.</Alert></Container>;
  }


  const imageSrc = product.imageUrl
    ? product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `http://localhost:8080/${product.imageUrl.replace(/^\/?/, '')}`
    : 'https://via.placeholder.com/400x300?text=No+Image';

  const isSeller = currentUser && currentUser.role === 'SELLER';
  const itemInCart = cart?.cartItems?.find(item => item.product.id === product.id);

  return (
    <Container className="my-4" style={{ maxWidth: '1000px' }}>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>Home</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/products' }}>Products</Breadcrumb.Item>
        <Breadcrumb.Item active>{product.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-4">
        <Col md={5}>
          <Card className="p-2 shadow-sm">
            <Image
              src={imageSrc}
              alt={product.name}
              fluid
              rounded
              style={{
                maxHeight: '400px',
                objectFit: 'contain',
                width: '100%'
              }}
            />
          </Card>
        </Col>
        <Col md={7}>
          <Card className="p-3 shadow-sm h-100">
            <Card.Body>
              <h2 className="h3 mb-3">{product.name}</h2>
              <p className="text-muted mb-3">Brand: {product.brand} | Category: {product.category}</p>
              <hr />
              <p className="mb-3">{product.description}</p>
              <h3 className="text-primary mb-3">${product.price.toFixed(2)}</h3>

              {product.stock > 0 ? (
                <p className="text-success mb-3">In Stock ({product.stock} available)</p>
              ) : (
                <p className="text-danger mb-3">Out of Stock</p>
              )}

              {product.discountPercentage > 0 && (
                <p className="text-warning mb-3">Discount: {product.discountPercentage.toFixed(1)}% off!</p>
              )}

              {product.size && <p className="mb-2">Size: {product.size}</p>}
              {product.color && <p className="mb-3">Color: {product.color}</p>}

              {!isSeller && addedToCartMessage && (
                <Alert variant={cartError && !itemInCart ? "danger" : "success"} className="mt-3">
                  {addedToCartMessage}
                </Alert>
              )}

              {product.stock > 0 && !isSeller && (
                <Row className="align-items-center my-3 g-2">
                  <Col xs="auto">
                    <Form.Label htmlFor="quantity">Quantity:</Form.Label>
                  </Col>
                  <Col xs={3} sm={2}>
                    <Form.Control
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={product.stock}
                    />
                  </Col>
                  <Col xs="auto">
                    <Button
                      variant="primary"
                      onClick={handleAddToCart}
                      disabled={cartLoading || (itemInCart?.quantity >= product.stock)}
                    >
                      {cartLoading ? 'Adding...' : itemInCart ? 'Add More' : 'Add to Cart'}
                    </Button>
                  </Col>
                </Row>
              )}
              {itemInCart && !isSeller && (
                <Alert variant="info">You have {itemInCart.quantity} of this item in your cart.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetailPage;
