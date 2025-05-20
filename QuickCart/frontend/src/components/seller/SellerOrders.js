import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Alert } from 'react-bootstrap';
import orderService from '../../services/orderService';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getSellerOrders();
      const ordersData = response.data.content || response.data;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await orderService.updateOrderStatusBySeller(orderId, 'ACCEPTED');
      fetchOrders();
    } catch (err) {
     console.error('Accept order error:', err);
      setError(err.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await orderService.updateOrderStatusBySeller(orderId, 'REJECTED');
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject order');
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'PENDING': 'warning',
      'ACCEPTED': 'success',
      'REJECTED': 'danger',
      'CANCELLED': 'secondary',
      'DELIVERED': 'info'
    };
    return <Badge bg={variants[status] || 'primary'}>{status}</Badge>;
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h3 className="mb-4">Orders</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.username || 'Unknown'}</td>
              <td>{new Date(order.orderDate).toLocaleDateString()}</td>
              <td>${order.totalAmount?.toFixed(2)}</td>
              <td>{getStatusBadge(order.status)}</td>
              <td>
                <Button variant="info" size="sm" className="me-2" onClick={() => handleViewDetails(order)}>
                  View
                </Button>
                {order.status === 'PENDING' && (
                  <>
                    <Button variant="success" size="sm" className="me-2" onClick={() => handleAcceptOrder(order.id)}>
                      Accept
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleRejectOrder(order.id)}>
                      Reject
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <h5>Order Items</h5>
              <Table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>${item.priceAtPurchase?.toFixed(2)}</td>
                      <td>${(item.quantity * item.priceAtPurchase).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="mt-3">
                <h5>Shipping Address</h5>
                <p>{selectedOrder.shippingAddress}</p>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SellerOrders;
