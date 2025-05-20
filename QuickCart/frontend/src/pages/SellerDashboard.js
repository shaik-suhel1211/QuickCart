import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Tab, Nav, Alert, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import productService from '../services/productService';
import orderService from '../services/orderService';
import SellerOrders from '../components/seller/SellerOrders';
import ProductList from '../components/seller/ProductList';
import EarningsChart from '../components/seller/EarningsChart';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';

const SellerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=/seller/dashboard');
      return;
    }

    if (currentUser.role !== 'SELLER') {
      setError('You do not have permission to access the seller dashboard.');
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        logger.debug('Fetching seller dashboard data');
        const [productsResponse, ordersResponse] = await Promise.all([
          productService.getMyProducts(),
          orderService.getSellerOrders()
        ]);

        const products = productsResponse.data.content || productsResponse.data;
        const orders = ordersResponse.data.content || ordersResponse.data;

        const totalRevenue = orders.reduce((sum, order) => {
          if (order.status !== 'CANCELLED' && order.status !== 'REJECTED') {
            return sum + order.totalAmount;
          }
          return sum;
        }, 0);

        const pendingOrders = orders.filter(order => order.status === 'PENDING').length;

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue,
          pendingOrders
        });
        // Reset retry count on success
        setRetryCount(0);
      } catch (err) {
        logger.error('Dashboard data fetch error:', {
          error: err.response?.data || err.message,
          status: err.response?.status
        });
        
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            logout();
            navigate('/login?redirect=/seller/dashboard');
          }, 2000);
        } else if (err.response?.status === 403) {
          setError('You do not have permission to access the seller dashboard.');
        } else if (err.response?.status === 500 && retryCount < MAX_RETRIES) {
          setError(`Server error occurred. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          setRetryCount(prev => prev + 1);
          // Add exponential backoff
          setTimeout(() => {
            fetchStats();
          }, Math.min(1000 * Math.pow(2, retryCount), 10000));
        } else {
          setError(err.response?.data?.message || 'Failed to fetch dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentUser, navigate, logout]);

  if (loading) {
    return (
      <Container className="mt-4">
        <h2>Loading dashboard...</h2>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
          {error.includes('session has expired') && (
            <div className="mt-2">
              <Button variant="primary" onClick={() => {
                logout();
                navigate('/login?redirect=/seller/dashboard');
              }}>
                Go to Login
              </Button>
            </div>
          )}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Seller Dashboard</h2>
      <Row className="mt-4">
        <Col md={3}>
          <Card className="text-center mb-4">
            <Card.Body>
              <Card.Title>Total Products</Card.Title>
              <Card.Text className="display-4">{stats.totalProducts}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-4">
            <Card.Body>
              <Card.Title>Total Orders</Card.Title>
              <Card.Text className="display-4">{stats.totalOrders}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-4">
            <Card.Body>
              <Card.Title>Pending Orders</Card.Title>
              <Card.Text className="display-4">{stats.pendingOrders}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-4">
            <Card.Body>
              <Card.Title>Total Revenue</Card.Title>
              <Card.Text className="display-4">${stats.totalRevenue.toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tab.Container defaultActiveKey="orders">
        <Row>
          <Col>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="orders">Orders</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="products">Products</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="earnings">Earnings</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="orders">
                <SellerOrders />
              </Tab.Pane>
              <Tab.Pane eventKey="products">
                <ProductList />
              </Tab.Pane>
              <Tab.Pane eventKey="earnings">
                <EarningsChart />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default SellerDashboard; 