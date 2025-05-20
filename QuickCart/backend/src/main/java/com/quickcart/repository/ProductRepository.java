package com.quickcart.repository;

import com.quickcart.entity.Product;
import com.quickcart.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    // Find products by seller
    Page<Product> findBySeller(User seller, Pageable pageable);

    // Basic search by name
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    // Find by category
    Page<Product> findByCategoryIgnoreCase(String category, Pageable pageable);

    // Find by brand
    Page<Product> findByBrandIgnoreCase(String brand, Pageable pageable);



    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL ORDER BY p.category")
    List<String> findAllCategories();

    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.brand IS NOT NULL ORDER BY p.brand")
    List<String> findAllBrands();
} 