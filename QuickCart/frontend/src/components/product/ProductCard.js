import React, { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();


  const imageSrc = product.imageUrl
    ? product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `http://localhost:8080${product.imageUrl.replace(/\/product-images\/product-images\//, '/product-images/')}`
    : 'https://via.placeholder.com/400x300?text=No+Image';

  // Default placeholder image
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

  const handleViewDetails = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Product ID:', product.id);
    console.log('Product:', product);
    console.log('Navigating to:', `/products/${product.id}`);
    navigate(`/products/${product.id}`, { state: { product } });
  };

  return (
    <Card className="h-100 shadow-sm">
      <div 
        className="position-relative" 
        style={{ height: '200px', overflow: 'hidden', cursor: 'pointer' }}
        onClick={handleViewDetails}
      >
        <Card.Img
          variant="top"
          src={imgError ? placeholderImage : imageSrc}
          style={{
            height: '100%',
            objectFit: 'contain',
            padding: '10px',
            backgroundColor: '#f8f9fa'
          }}
          onError={() => setImgError(true)}
        />
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title 
          className="text-truncate" 
          style={{ cursor: 'pointer' }}
          onClick={handleViewDetails}
        >
          {product.name}
        </Card.Title>
        <Card.Text className="text-muted small">
          {product.category} - {product.brand}
        </Card.Text>
        <Card.Text style={{ fontSize: '1.25rem', fontWeight: 'bold' }} className="mt-auto">
          ${product.price.toFixed(2)}
        </Card.Text>
        {product.stock === 0 && <p className='text-danger'>Out of Stock</p>}
        <Button 
          variant="primary" 
          className="w-100 mt-2"
          onClick={handleViewDetails}
        >
          View Details
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;