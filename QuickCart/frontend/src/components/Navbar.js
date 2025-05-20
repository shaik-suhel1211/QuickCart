import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSeller = currentUser && currentUser.role === 'SELLER';

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">QuickCart</BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/products">Products</Nav.Link>
            {isSeller && (
              <Nav.Link as={Link} to="/seller/dashboard">Seller Dashboard</Nav.Link>
            )}
          </Nav>
          <Nav>
            {(!currentUser || !isSeller) && (
              <Nav.Link as={Link} to="/cart">
                Cart
                {currentUser && cartItemCount > 0 && (
                  <Badge pill bg="primary" style={{ marginLeft: '5px' }}>
                    {cartItemCount}
                  </Badge>
                )}
              </Nav.Link>
            )}
            {currentUser ? (
              <NavDropdown title={currentUser.username} id="basic-nav-dropdown">
                {isSeller ? (
                  <>
                    <NavDropdown.Item as={Link} to="/seller/dashboard">My Dashboard</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/seller/products">My Products</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/seller/orders">My Orders</NavDropdown.Item>
                  </>
                ) : (
                  <>
                    <NavDropdown.Item as={Link} to="/orders">My Orders</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/account">Account Settings</NavDropdown.Item>
                  </>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/signup">Signup</Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar; 