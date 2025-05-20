package com.quickcart.service;

import com.quickcart.entity.Product;
import com.quickcart.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import com.quickcart.payload.ProductResponseDTO;
import com.quickcart.payload.ProductRequestDTO;
import java.util.Map;
import java.util.Optional;
import java.util.List;

public interface ProductService {
    ProductResponseDTO addProduct(ProductRequestDTO productRequestDTO, MultipartFile imageFile, User seller);
    Optional<ProductResponseDTO> getProductById(Long productId);
    Page<ProductResponseDTO> getAllProducts(Pageable pageable);
    Page<ProductResponseDTO> searchAndFilterProducts(
        String searchTerm,
        String category,
        String brand,
        String color,
        String size,
        Boolean available,
        Double minPrice,
        Double maxPrice,
        java.math.BigDecimal minDiscount,
        String sortBy, // e.g., "price_asc", "price_desc", "name_asc", "createdAt_desc"
        Pageable pageable
    );
    ProductResponseDTO updateProduct(Long productId, ProductRequestDTO productRequestDTO, MultipartFile imageFile, User seller);
    void deleteProduct(Long productId, User seller);
    Page<ProductResponseDTO> getProductsBySeller(User seller, Pageable pageable);
    List<String> getAllCategories();
    List<String> getAllBrands();
} 