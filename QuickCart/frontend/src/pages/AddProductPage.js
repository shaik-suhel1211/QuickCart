import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Breadcrumb, Card, Row, Col, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import { useAuth } from '../contexts/AuthContext';

const AddProductPage = () => {
  const initialProductState = {
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    color: '',
    size: '',
    stock: '',
    imageUrl: '',
    discountPercentage: 0,
    available: true,
  };

  const [product, setProduct] = useState(initialProductState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=/seller/products/new');
      return;
    }
    if (currentUser.role !== 'SELLER') {
      navigate('/seller/dashboard'); 
      return;
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
        setImageFile(e.target.files[0]);
        setImagePreview(URL.createObjectURL(e.target.files[0]));
    } else {
        setImageFile(null);
        setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);


    if (!product.name || !product.description || !product.price || !product.category || !product.brand || product.stock === '') {
        setError('Please fill in all required fields: Name, Description, Price, Category, Brand, Stock Quantity.');
        setLoading(false);
        return;
    }
    if (parseFloat(product.price) <= 0) {
        setError('Price must be a positive value.');
        setLoading(false);
        return;
    }
    if (parseInt(product.stock) < 0) {
        setError('Stock quantity cannot be negative.');
        setLoading(false);
        return;
    }
    if (product.discountPercentage && (parseFloat(product.discountPercentage) < 0 || parseFloat(product.discountPercentage) > 100)) {
        setError('Discount percentage must be between 0 and 100.');
        setLoading(false);
        return;
    }

    try {
      const formData = new FormData();
      

      const productDataForJson = {
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        category: product.category,
        brand: product.brand,
        stock: parseInt(product.stock),
        available: product.available, // Ensure this is a boolean if backend expects boolean
        discountPercentage: parseFloat(product.discountPercentage || 0),
        color: product.color || null, // Send null if empty
        size: product.size || null,   // Send null if empty

      };


      formData.append('product', new Blob([JSON.stringify(productDataForJson)], { type: 'application/json' }));
      

      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      await productService.addProduct(formData);
      setSuccess('Product added successfully! Redirecting...');
      setTimeout(() => {
        navigate('/seller/products');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product. Please check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-4">
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Home</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/seller/dashboard" }}>Seller Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/seller/products" }}>My Products</Breadcrumb.Item>
        <Breadcrumb.Item active>Add New Product</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header as="h3">Add New Product</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="productName">
                  <Form.Label>Product Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="name" value={product.name} onChange={handleChange} required />
                </Form.Group>

                <Form.Group className="mb-3" controlId="productDescription">
                  <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={product.description} onChange={handleChange} required />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="productPrice">
                      <Form.Label>Price ($) <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="number" name="price" value={product.price} onChange={handleChange} required min="0.01" step="0.01" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="productstock">
                      <Form.Label>Stock Quantity <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="number" name="stock" value={product.stock} onChange={handleChange} required min="0" />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="productCategory">
                      <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" name="category" value={product.category} onChange={handleChange} required placeholder="e.g., Electronics, Books" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="productBrand">
                      <Form.Label>Brand <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" name="brand" value={product.brand} onChange={handleChange} required placeholder="e.g., Sony, Apple" />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="productColor">
                        <Form.Label>Color</Form.Label>
                        <Form.Control type="text" name="color" value={product.color} onChange={handleChange} placeholder="e.g., Red, Blue" />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="productSize">
                        <Form.Label>Size</Form.Label>
                        <Form.Control type="text" name="size" value={product.size} onChange={handleChange} placeholder="e.g., Small, Medium, Large, XL" />
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3" controlId="productImage">
                  <Form.Label>Product Image</Form.Label>
                  <Form.Control type="file" name="imageFile" onChange={handleImageChange} accept="image/*" />
                  {imagePreview && <Image src={imagePreview} alt="Preview" thumbnail fluid className="mt-2" style={{ maxHeight: '200px' }}/>}
                </Form.Group>
                
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3" controlId="productDiscountPercentage">
                        <Form.Label>Discount Percentage (%)</Form.Label>
                        <Form.Control type="number" name="discountPercentage" value={product.discountPercentage} onChange={handleChange} min="0" max="100" step="0.1" placeholder="e.g., 10 for 10%"/>
                        </Form.Group>
                    </Col>
                    <Col md={6} className="d-flex align-items-center">
                        <Form.Group className="mb-3 mt-3" controlId="productAvailable">
                        <Form.Check type="checkbox" name="available" label="Product Available in Store?" checked={product.available} onChange={handleChange} />
                        </Form.Group>
                    </Col>
                </Row>

                <Button variant="primary" type="submit" disabled={loading} className="w-100">
                  {loading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Adding Product...</> : 'Add Product'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AddProductPage; 