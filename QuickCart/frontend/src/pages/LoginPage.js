import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Form, Button, Container, Alert, Card } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import logger from '../utils/logger';
import authService from '../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {

    if (authService.isAuthenticated()) {

      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect') || location.state?.from || '/';
      logger.debug('Already authenticated, redirecting to:', redirect);

      navigate(redirect, { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {

      await login(formData.usernameOrEmail, formData.password);
      

      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect') || location.state?.from || '/';
      const message = params.get('message') || location.state?.message;
      
      if (message) {
        toast.success(message);
      }
      
      logger.debug('Login successful, redirecting to:', redirect);

      navigate(redirect, { replace: true });
    } catch (error) {
      logger.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
      toast.error(error.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Log In</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="usernameOrEmail">
                <Form.Label>Username or Email</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.usernameOrEmail}
                  onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group id="password" className="mt-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </Form.Group>
              <Button disabled={loading} className="w-100 mt-4" type="submit">
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          Need an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </Container>
  );
};

export default LoginPage; 