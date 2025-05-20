import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import productService from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import ProductFilter from '../components/product/ProductFilter';
import PaginationComponent from '../components/ui/PaginationComponent';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyFilters } from '../utils/filterAlgorithms';


const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const ProductsPage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 8;

  const query = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const sellerId = query.get('sellerId');

  const [filters, setFilters] = useState(() => {
    const queryAvailable = query.get('available');
    return {
      searchTerm: query.get('searchTerm') || '',
      category: query.get('category') || '',
      brand: query.get('brand') || '',
      minPrice: query.get('minPrice') ? parseFloat(query.get('minPrice')) : null,
      maxPrice: query.get('maxPrice') ? parseFloat(query.get('maxPrice')) : null,
      sortBy: query.get('sortBy') || 'createdAt_desc',
      available: queryAvailable !== null ? queryAvailable === 'true' : null,
    };
  });

  // Fetch all products once
  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let all = [];
      let page = 0;
      let totalPages = 1;

      do {
        const response = await productService.getAllProducts({ page, size: 50 }); // adjust size if needed
        const pageData = response.data;
        all = [...all, ...pageData.content];
        totalPages = pageData.totalPages;
        page++;
      } while (page < totalPages);

      console.log('Fetched all products:', all);
      setAllProducts(all);

      const filtered = applyFilters(all, filters);
      setFilteredProducts(filtered);
      setTotalPages(Math.ceil(filtered.length / pageSize));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  // Apply filters whenever they change
  useEffect(() => {
    if (allProducts.length > 0) {
      const filtered = applyFilters(allProducts, filters);
      setFilteredProducts(filtered);
      setTotalPages(Math.ceil(filtered.length / pageSize));
      setCurrentPage(0); // Reset to first page when filters change
    }
  }, [filters, allProducts]);

  // Get current page products
  const getCurrentPageProducts = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredProducts.slice(start, end);
  };

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // Update URL params when filters or currentPage change
  useEffect(() => {
    const params = new URLSearchParams();
    if (sellerId) params.set('sellerId', sellerId);
    if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);
    if (filters.category) params.set('category', filters.category);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.minPrice !== null && filters.minPrice !== '') params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice !== null && filters.maxPrice !== '') params.set('maxPrice', String(filters.maxPrice));
    if (filters.available !== null) params.set('available', String(filters.available));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (currentPage > 0) params.set('page', String(currentPage));
    
    const queryString = params.toString();
    navigate(
      `${location.pathname}${queryString ? `?${queryString}` : ''}`,
      { replace: true }
    );
  }, [filters, currentPage, navigate, location.pathname, sellerId]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">{sellerId ? "Seller's Products" : "Our Products"}</h2>
      
      <div className="mb-4">
        <ProductFilter onFilterChange={handleFilterChange} initialFilters={filters} />
      </div>

      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {error && <Alert variant="danger" className="my-3">{error}</Alert>}

      {!loading && !error && filteredProducts.length === 0 && (
        <Alert variant="info" className="my-3">No products found matching your criteria.</Alert>
      )}

      {!loading && filteredProducts.length > 0 && (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {getCurrentPageProducts().map((product) => (
            <Col key={product.id}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}

      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-center my-4">
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </Container>
  );
};

export default ProductsPage;
