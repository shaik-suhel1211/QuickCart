import React, { useEffect } from 'react';
import { Container, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useOrders } from '../contexts/OrderContext';

const OrderHistoryPage = () => {
  const { orders, loading, error, fetchOrders } = useOrders();

  useEffect(() => {
    fetchOrders();
  }, []);


  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning',
      PROCESSING: 'info',
      SHIPPED: 'primary',
      DELIVERED: 'success',
      CANCELLED: 'danger',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <h2>Loading orders...</h2>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <h2 className="text-danger">Error: {error}</h2>
      </Container>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Container className="mt-4">
        <h2>Order History</h2>
        <p>No orders found.</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Order History</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{new Date(order.orderDate).toLocaleDateString()}</td>
              <td>${order.totalAmount?.toFixed(2)}</td>
              <td>{getStatusBadge(order.status)}</td>
              <td>
                <Link to={`/orders/${order.id}`} className="btn btn-primary btn-sm">
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default OrderHistoryPage;
