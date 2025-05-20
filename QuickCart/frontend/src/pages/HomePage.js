import React from 'react';
import { Container, Row, Col, Button, Card, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard'; // If you want to feature products
import Footer from '../components/Footer'; // Adjust path if different
import logo from '../logo.svg';

const HomePage = () => {
  // Sample data for featured categories or products
  const featuredCategories = [
    { name: 'Mens Fashion', image: '/images/clothing.jpg', link: '/products?category=MensFashion' },
    { name: 'Womens Fashion', image: '/images/womensfashion.jpg', link: '/products?category=WomensFashion' },
    { name: 'Beauty', image: '/images/beauty.jpg', link: '/products?category=Beauty' },
    { name: 'Home Essentials', image: '/images/homedecor.jpg', link: '/products?category=HomeEssentials' },
    { name: 'Electronics', image: '/images/Electronics.jpg', link: '/products?category=Electronics' },
    { name: 'Grocery', image: '/images/Grocery.jpg', link: '/products?category=Grocery' },
  ];

  const carouselItems = [
    { image: '/images/sale.jpg', caption: 'Shop Conveniently', description: 'Get your favorites delivered to your doorstep.', link: '/products' },
    { image: '/images/electronics_banner.png', caption: 'Fresh Collection', description: 'Discover the latest trends in our store.', link: '/products?sortBy=createdAt_desc' },
    { image: '/images/fashion.jpg', caption: 'All Items 50% Off!', description: 'Limited time offer. Shop now and save big.', link: '/products' },
  ];

  const featuredProducts = [
    { id: 20, name: 'Amazon Fire TV Stick', image: '/images/amazonfiretvstick.jpg' },
    { id: 1, name: 'H&M_Shirt', image: '/images/H&M_Shirt.jpg' },
    { id: 8, name: 'SL_WomenDress', image: '/images/SL_WomenDressGreen.jpg' },
    { id: 14, name: 'Lipstick', image: '/images/lipstick.jpg' },
  ];

  return (
    <>
      {/* Hero Section Carousel */}
      <Carousel fade className="mb-5 shadow-lg">
        {carouselItems.map((item, idx) => (
          <Carousel.Item key={idx} as={Link} to={item.link} style={{ textDecoration: 'none'}}>
            <img
              className="d-block w-100"
              src={item.image}
              alt={item.caption}
              style={{objectFit: 'cover', maxHeight: '400px'}}
            />
            <Carousel.Caption className="bg-dark bg-opacity-50 p-3 rounded">
              <h3>{item.caption}</h3>
              <p>{item.description}</p>
            </Carousel.Caption>
          </Carousel.Item>
        ))}
      </Carousel>

      <Container>
        {/* Featured Categories Section */}
        <Row className="text-center mb-5">
          <Col>
            <h2>Shop by Category</h2>
            <p className="lead text-muted">Explore our wide range of products.</p>
          </Col>
        </Row>
        <Row xs={1} md={2} lg={3} className="g-4 mb-5">
          {featuredCategories.map((category, idx) => (
            <Col key={idx}>
              <Card as={Link} to={category.link} className="h-100 shadow-sm text-decoration-none text-dark category-card">
                <Card.Img variant="top" src={category.image} style={{ height: '200px', objectFit: 'cover' }} />
                <Card.Body className="text-center">
                  <Card.Title as="h4">{category.name}</Card.Title>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Call to Action Section */}
        <Row className="align-items-center p-5 bg-light rounded shadow-sm mb-5">
          <Col xs={12} md={4} className="text-center mb-4 mb-md-0">
            <img src={logo} className="App-logo" alt="logo" style={{height:'200px'}}/>
          </Col>
          <Col xs={12} md={8} className="text-center text-md-start">
            <h2>Ready to Start Shopping?</h2>
            <p className="lead">Find everything you need in one place. Quality products, great prices.</p>
            <Button as={Link} to="/products" variant="primary" size="lg">
              Explore All Products
            </Button>
          </Col>
        </Row>


        <Row className="text-center my-4">
          <Col>
            <h2>Featured Products</h2>
          </Col>
        </Row>

        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {featuredProducts.map(product => (
            <Col key={product.id}>
              <Card className="h-100">
                <Card.Img variant="top" src={product.image} style={{height:'200px', objectFit: 'contain' }} />
                <Card.Body>
                  <Card.Title>{product.name}</Card.Title>
                  <Link to={`/products/${product.id}`}>
                    <Button variant="outline-primary">View Details</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

      </Container>
       <Footer />
    </>
  );
};

export default HomePage;