import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Alert, Spinner, Breadcrumb, Card, Row, Col, Image, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const SellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchSellerProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getMyProducts({ page: 0, size: 20 });
      setProducts(response.data.content);
    } catch (err) {
      console.error('Error fetching products:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to view seller products. Please ensure you are logged in as a seller.');
        navigate('/login?redirect=/seller/products');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch your products. Please try again later.');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=/seller/products');
      return;
    }
    if (!currentUser.role || !currentUser.role.includes('SELLER')) {
      setError('You must be a seller to access this page.');
      navigate('/');
      return;
    }
    fetchSellerProducts();
  }, [currentUser, navigate]);

  const handleDeleteClick = (product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      handleDeleteProduct(product.id);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setLoading(true);
    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      alert('Product deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product.');
      alert('Error deleting product: ' + (err.response?.data?.message || 'Please try again.'));
    }
    setLoading(false);
  };

  if (loading && products.length === 0) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Loading your products...</p>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Home</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/seller/dashboard" }}>Seller Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>My Products</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Products</h2>
        <Button as={Link} to="/seller/products/add" variant="primary">
          <FaPlus className="me-2" /> Add New Product
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && products.length > 0 && <Alert variant="info">Updating product list...</Alert>}

      {products.length === 0 && !loading && !error && (
        <Alert variant="info">You have not listed any products yet. Add your first product!</Alert>
      )}

      {products.length > 0 && (
        <Card className="shadow-sm">
          <Card.Body>
            <Table striped bordered hover responsive className="align-middle">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const imageSrc = product.imageUrl
                    ? product.imageUrl.startsWith('http')
                      ? product.imageUrl
                      : `http://localhost:8080${product.imageUrl.replace(/\/product-images\/product-images\//, '/product-images/')}`
                      : 'https://via.placeholder.com/75?text=No+Image';
                  return (
                    <tr key={product.id}>
                      <td>
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          style={{ width: '75px', height: '75px', objectFit: 'contain' }}
                          thumbnail
                        />
                      </td>
                      <td><Link to={`/products/${product.id}`}>{product.name}</Link></td>
                      <td>{product.category}</td>
                      <td>{product.brand}</td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td>{product.available ? <Badge bg="success">Available</Badge> : <Badge bg="secondary">Unavailable</Badge>}</td>
                      <td>
                        <Button as={Link} to={`/seller/products/edit/${product.id}`} variant="outline-primary" size="sm" className="me-2" title="Edit">
                          <FaEdit />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(product)} disabled={loading} title="Delete">
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default SellerProductsPage; 