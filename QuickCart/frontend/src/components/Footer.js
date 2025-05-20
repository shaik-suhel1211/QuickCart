import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark text-light pt-5 pb-3 mt-5">
      <Container>
        <Row className="mb-4">
          <Col md={3}>
            <h5>Get to Know Us</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-light text-decoration-none">About Us</Link></li>
              <li><Link to="/" className="text-light text-decoration-none">Careers</Link></li>
              <li><Link to="/" className="text-light text-decoration-none">Blog</Link></li>
            </ul>
          </Col>
          <Col md={3}>
            <h5>Connect with Us</h5>
            <ul className="list-unstyled">
              <li><a href="https://facebook.com" className="text-light text-decoration-none">Facebook</a></li>
              <li><a href="https://twitter.com" className="text-light text-decoration-none">Twitter</a></li>
              <li><a href="https://instagram.com" className="text-light text-decoration-none">Instagram</a></li>
            </ul>
          </Col>
          <Col md={3}>
            <h5>Make Money with Us</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-light text-decoration-none">Sell on Our Platform</Link></li>
              <li><Link to="/" className="text-light text-decoration-none">Affiliate Program</Link></li>
              <li><Link to="/" className="text-light text-decoration-none">Advertise Your Products</Link></li>
            </ul>
          </Col>
          <Col md={3}>
            <h5>Let Us Help You</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-light text-decoration-none">Help Center</Link></li>
              <li><Link to="/" className="text-light text-decoration-none">Returns & Refunds</Link></li>
              <li><Link to="/" className="text-light text-decoration-none">Contact Us</Link></li>
            </ul>
          </Col>
        </Row>
        <hr className="border-light" />
        <Row className="text-center">
          <Col>
            <p className="mb-0">&copy; {new Date().getFullYear()} QuickCart. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
