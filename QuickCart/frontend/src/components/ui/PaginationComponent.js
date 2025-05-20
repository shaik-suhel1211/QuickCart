import React from 'react';
import { Pagination } from 'react-bootstrap';

const PaginationComponent = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (pageNumber) => {
    if (pageNumber >= 0 && pageNumber < totalPages) {
      onPageChange(pageNumber);
    }
  };

  let items = [];
  const pageNeighbours = 2;

  // Always show first page
  items.push(
    <Pagination.First key="first" onClick={() => handlePageClick(0)} disabled={currentPage === 0} />
  );
  items.push(
    <Pagination.Prev key="prev" onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 0} />
  );


  if (currentPage > pageNeighbours + 1) {
    items.push(<Pagination.Item key={0} onClick={() => handlePageClick(0)}>{1}</Pagination.Item>);
    if (currentPage > pageNeighbours + 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);   
    }
  }


  const startPage = Math.max(0, currentPage - pageNeighbours);
  const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);

  for (let number = startPage; number <= endPage; number++) {
    items.push(
      <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageClick(number)}>
        {number + 1}
      </Pagination.Item>
    );
  }


  if (currentPage < totalPages - pageNeighbours - 2) {
    if (currentPage < totalPages - pageNeighbours - 3) {
         items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />); 
    }
    items.push(<Pagination.Item key={totalPages -1} onClick={() => handlePageClick(totalPages - 1)}>{totalPages}</Pagination.Item>);
  }

  // Always show last page
  items.push(
    <Pagination.Next key="next" onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage === totalPages - 1} />
  );
  items.push(
    <Pagination.Last key="last" onClick={() => handlePageClick(totalPages - 1)} disabled={currentPage === totalPages - 1} />
  );

  return (
    <Pagination className="justify-content-center">
        {items}
    </Pagination>
  );
};

export default PaginationComponent; 