import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import orderService from '../../services/orderService';

const EarningsChart = () => {
  const [earnings, setEarnings] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

 const fetchEarnings = async () => {
   try {
     const data = await orderService.getSellerEarnings();
     console.log("Earnings API response:", data);

     setEarnings({
       daily: data.daily ?? 0,
       weekly: data.weekly ?? 0,
       monthly: data.monthly ?? 0,
       yearly: data.yearly ?? 0
     });
   } catch (err) {
     setError(err.response?.data?.message || 'Failed to fetch earnings data');
   } finally {
     setLoading(false);
   }
 };


  if (loading) return <div>Loading earnings data...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h3 className="mb-4">Earnings Overview</h3>
      <Row>
        <Col md={3}>
          <Card className="text-center mb-4">
            <Card.Body>
              <Card.Title>Today's Earnings</Card.Title>
              <Card.Text className="display-6">${earnings.daily.toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-4">
            <Card.Body>
              <Card.Title>This Week</Card.Title>
              <Card.Text className="display-6">${earnings.weekly.toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-4">
            <Card.Body>
              <Card.Title>This Month</Card.Title>
              <Card.Text className="display-6">${earnings.monthly.toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-4">
            <Card.Body>
              <Card.Title>This Year</Card.Title>
              <Card.Text className="display-6">${earnings.yearly.toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Earnings Breakdown</Card.Title>
          <p className="text-muted">
            Earnings are calculated based on completed orders only. Cancelled or rejected orders are not included.
          </p>
          <ul>
            <li>Daily earnings are calculated for the current day</li>
            <li>Weekly earnings are calculated for the current week (Sunday to Saturday)</li>
            <li>Monthly earnings are calculated for the current month</li>
            <li>Yearly earnings are calculated for the current year</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EarningsChart;
