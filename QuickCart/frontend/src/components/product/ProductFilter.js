import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Card } from 'react-bootstrap';
import productService from '../../services/productService';

const ProductFilter = ({ onFilterChange, initialFilters }) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters?.searchTerm || '');
  const [category, setCategory] = useState(initialFilters?.category || '');
  const [brand, setBrand] = useState(initialFilters?.brand || '');
  const [minPrice, setMinPrice] = useState(initialFilters?.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters?.maxPrice || '');
  const [sortBy, setSortBy] = useState(initialFilters?.sortBy || 'createdAt_desc');
  const [available, setAvailable] = useState(initialFilters?.available === undefined ? true : initialFilters.available);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          productService.getCategories(),
          productService.getBrands()
        ]);
        setCategories(categoriesResponse.data);
        setBrands(brandsResponse.data);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterSubmit = (e) => {
    if (e) e.preventDefault();
    onFilterChange({
      searchTerm,
      category,
      brand,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      sortBy,
      available: available === false ? false : null
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt_desc');
    setAvailable(true);
    onFilterChange({
      searchTerm: '',
      category: '',
      brand: '',
      minPrice: null,
      maxPrice: null,
      sortBy: 'createdAt_desc',
      available: null
    });
  };

  return (
    <Card className="mb-4 p-3 shadow-sm">
      <Form onSubmit={handleFilterSubmit}>
        <Row className="g-3">
          <Col md={12} lg={6}>
            <Form.Group controlId="searchTerm">
              <Form.Label className="text-start d-block">Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6} lg={3}>
            <Form.Group controlId="category">
              <Form.Label className="text-start d-block">Category</Form.Label>
              <Form.Select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6} lg={3}>
            <Form.Group controlId="brand">
              <Form.Label className="text-start d-block">Brand</Form.Label>
              <Form.Select 
                value={brand} 
                onChange={(e) => setBrand(e.target.value)}
                disabled={loading}
              >
                <option value="">All Brands</option>
                {brands.map(b => (
                  <option key={b} value={b.toLowerCase()}>{b}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Row className="g-3 mt-2">
          <Col md={4} lg={2}>
            <Form.Group controlId="minPrice">
              <Form.Label className="text-start d-block">Min Price</Form.Label>
              <Form.Control
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={4} lg={2}>
            <Form.Group controlId="maxPrice">
              <Form.Label className="text-start d-block">Max Price</Form.Label>
              <Form.Control
                type="number"
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={4} lg={3}>
            <Form.Group controlId="sortBy">
              <Form.Label className="text-start d-block">Sort By</Form.Label>
              <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="createdAt_desc">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
                <option value="name_desc">Name: Z-A</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={12} lg={2} className="d-flex align-items-end">
            <Form.Group controlId="available" className="mt-3 mt-md-0 w-100">
              <Form.Check 
                type="checkbox"
                label="Only Available"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
            </Form.Group>
          </Col>
          <Col md={12} lg={3} className="d-flex align-items-end mt-3 mt-lg-0">
            <Button variant="primary" type="submit" className="w-100 me-2">Apply Filters</Button>
            <Button variant="secondary" onClick={handleResetFilters} className="w-100">Reset</Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default ProductFilter; 