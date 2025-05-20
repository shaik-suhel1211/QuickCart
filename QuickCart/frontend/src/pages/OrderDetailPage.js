import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Badge, Row, Col } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrders } from '../contexts/OrderContext';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById } = useOrders();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('Invalid order ID');
        setLoading(false);
        return;
      }

      try {
        const orderData = await getOrderById(id);
        if (!orderData) {
          setError('Order not found');
          return;
        }
        setOrder(orderData);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
          return;
        }
        setError(err.response?.data?.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, getOrderById, navigate]);

  const getStatusBadge = (status) => {
    const variants = {
      'PENDING': 'warning',
      'PROCESSING': 'info',
      'SHIPPED': 'primary',
      'DELIVERED': 'success',
      'CANCELLED': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <h2>Loading order details...</h2>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <h2>Error: {error}</h2>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="mt-4">
        <h2>Order not found</h2>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Link to="/orders" className="btn btn-outline-primary mb-4">
        ← Back to Orders
      </Link>
      
      <h2>Order Details</h2>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Order Information</Card.Title>
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
              <p><strong>Status:</strong> {getStatusBadge(order.status)}</p>
              <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Shipping Information</Card.Title>
              <p><strong>Address:</strong> {order.shippingAddress}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h3>Order Items</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {(order.orderItems || []).map((item) => (
            <tr key={item.id}>
              <td>
                <Link to={`/products/${item.product.id}`}>
                  {item.product.name}
                </Link>
              </td>
              <td>${item.priceAtPurchase.toFixed(2)}</td>
              <td>{item.quantity}</td>
              <td>${(item.priceAtPurchase * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" className="text-end"><strong>Total:</strong></td>
            <td><strong>${order.totalAmount.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </Table>
    </Container>
  );
};

export default OrderDetailPage; 