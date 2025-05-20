import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Alert, Spinner, Button, Card, Accordion, ListGroup, Badge, Breadcrumb, Form, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';

// WebSocket Imports
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null); // Tracks which order's status is being updated

  // Stomp Client Ref
  const stompClientRef = React.useRef(null);
  const [isWsConnected, setIsWsConnected] = React.useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  const fetchSellerOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getSellerOrders();
      const sortedOrders = response.data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      setOrders(sortedOrders);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch your orders.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=/seller/orders');
      return;
    }
    if (currentUser.role !== 'SELLER') {
      navigate('/seller/dashboard');
      return;
    }
    fetchSellerOrders();

    // WebSocket connection setup
    if (currentUser && currentUser.id) {
      const socketFactory = () => new SockJS('http://localhost:8080/ws');
      const orderTopic = `/topic/seller/${currentUser.id}/orders`;

      const onConnect = () => {
        setIsWsConnected(true);
        console.log(`Connected to WebSocket for seller orders on topic: ${orderTopic}`);
        stompClientRef.current.subscribe(orderTopic, (message) => {
          console.log('Received seller order update:', message.body);

          fetchSellerOrders();
        });
      };

      const onError = (error) => {
        setIsWsConnected(false);
        console.error(`WebSocket Error for seller orders (Topic: ${orderTopic}):`, error);
      };

      if (!stompClientRef.current?.active) {
        stompClientRef.current = new Client({
          webSocketFactory: socketFactory,
          connectHeaders: {

          },
          debug: function (str) {  },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: onConnect,
          onStompError: onError,
          onWebSocketError: onError,
          onDisconnect: () => {
            setIsWsConnected(false);
            console.log('Disconnected from WebSocket for seller orders');
          }
        });
        stompClientRef.current.activate();
      }
    }

    return () => {
      if (stompClientRef.current && stompClientRef.current.active) {
        console.log('Deactivating WebSocket client for seller orders');
        stompClientRef.current.deactivate();
        setIsWsConnected(false);
      }
    };
  }, [currentUser, navigate, fetchSellerOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    setError(null);
    try {
      await orderService.updateOrderStatusBySeller(orderId, newStatus);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      alert(`Order ${orderId} status updated to ${newStatus}`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update status for order ${orderId}.`);
      alert(`Error updating status: ${err.response?.data?.message || 'Please try again.'}`);
    }
    setUpdatingStatus(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
        case 'PENDING': return <Badge bg="warning" text="dark">Pending</Badge>;
        case 'PROCESSING': return <Badge bg="info">Processing</Badge>;
        case 'SHIPPED': return <Badge bg="primary">Shipped</Badge>;
        case 'DELIVERED': return <Badge bg="success">Delivered</Badge>;
        case 'CANCELLED': return <Badge bg="danger">Cancelled</Badge>;
        case 'RETURNED': return <Badge bg="secondary">Returned</Badge>;
        default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Loading your orders...</p>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Home</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/seller/dashboard" }}>Seller Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>My Orders</Breadcrumb.Item>
      </Breadcrumb>

      <h2>My Customer Orders</h2>
      {error && <Alert variant="danger" className="my-3">{error}</Alert>}
      {loading && orders.length > 0 && <Alert variant="info">Refreshing order list...</Alert>}

      {orders.length === 0 && !loading && !error && (
        <Alert variant="info" className="mt-3">You have no orders for your products yet.</Alert>
      )}

      {orders.length > 0 && (
         <Accordion defaultActiveKey={orders[0]?.id.toString()} alwaysOpen className="mt-3">
         {orders.map((order) => (
           <Accordion.Item eventKey={order.id.toString()} key={order.id}>
             <Accordion.Header>
                <Row className="w-100 align-items-center me-3">
                    <Col md={2}><strong>Order ID:</strong> {order.id}</Col>
                    <Col md={2}><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</Col>
                    <Col md={2}><strong>Customer:</strong> {order.user.username} ({order.user.email})</Col>
                    <Col md={2}><strong>Total:</strong> ${order.totalAmount.toFixed(2)}</Col>
                    <Col md={2}><strong>Status:</strong> {getStatusBadge(order.status)}</Col>
                    <Col md={2} className="text-end">Details</Col> 
                </Row>
             </Accordion.Header>
             <Accordion.Body>
               <Card>
                 <Card.Body>
                   <Row>
                     <Col md={7}>
                       <h5>Order Items:</h5>
                       <Table striped bordered hover responsive size="sm">
                         <thead>
                           <tr>
                             <th>Product Name</th>
                             <th>Qty</th>
                             <th>Price Paid</th>
                             <th>Subtotal</th>
                           </tr>
                         </thead>
                         <tbody>
                           {order.orderItems.map(item => (
                             <tr key={item.id}>
                               <td>
                                 <Link to={`/products/${item.product.id}`}>{item.product.name}</Link>
                                 <small className="d-block text-muted">Brand: {item.product.brand}, Cat: {item.product.category}</small>
                               </td>
                               <td>{item.quantity}</td>
                               <td>${item.priceAtPurchase.toFixed(2)}</td>
                               <td>${(item.quantity * item.priceAtPurchase).toFixed(2)}</td>
                             </tr>
                           ))}
                         </tbody>
                       </Table>
                       <p className="text-end"><strong>Order Total: ${order.totalAmount.toFixed(2)}</strong></p>
                     </Col>
                     <Col md={5}>
                       <h5>Shipping Address:</h5>
                       <p className="mb-1">
                         {order.shippingAddress.street}<br />
                         {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
                         {order.shippingAddress.country}
                       </p>
                       <hr />
                       <h5>Update Order Status:</h5>
                       <Form.Group controlId={`status-${order.id}`} className="d-flex align-items-center">
                         <Form.Select 
                           aria-label="Update order status"
                           value={order.status}
                           onChange={(e) => handleStatusChange(order.id, e.target.value)}
                           disabled={updatingStatus === order.id}
                           className="me-2"
                         >
                           {ORDER_STATUSES.map(stat => (
                             <option key={stat} value={stat}>{stat.charAt(0).toUpperCase() + stat.slice(1).toLowerCase()}</option>
                           ))}
                         </Form.Select>
                         {updatingStatus === order.id && <Spinner animation="border" size="sm" />}
                       </Form.Group>
                     </Col>
                   </Row>
                 </Card.Body>
               </Card>
             </Accordion.Body>
           </Accordion.Item>
         ))}
       </Accordion>
      )}
    </Container>
  );
};

export default SellerOrdersPage; 