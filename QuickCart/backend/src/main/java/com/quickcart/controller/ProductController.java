package com.quickcart.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcart.entity.Product;
import com.quickcart.entity.User;
import com.quickcart.exception.ResourceNotFoundException;
import com.quickcart.payload.ApiResponse;
import com.quickcart.payload.ProductRequestDTO;
import com.quickcart.payload.ProductResponseDTO;
import com.quickcart.repository.UserRepository;
import com.quickcart.security.UserPrincipal;
import com.quickcart.service.ProductService;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private static final Logger logger = LoggerFactory.getLogger(ProductController.class);

    @Autowired
    private ProductService productService;

    @Autowired
    private UserRepository userRepository; // To fetch User entity from UserPrincipal

    @Autowired
    private ObjectMapper objectMapper; // Autowire ObjectMapper

    @Autowired
    private Validator validator; // Autowire Validator

    @GetMapping
    public Page<ProductResponseDTO> getAllProducts(@PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return productService.getAllProducts(pageable);
    }

    @GetMapping("/search")
    public Page<ProductResponseDTO> searchProducts(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) BigDecimal minDiscount,
            @RequestParam(required = false) String sortBy,
            @PageableDefault(size = 10) Pageable pageable) {
        
        logger.info("Search request received with params: searchTerm='{}', category='{}', brand='{}', color='{}', size='{}', available='{}', minPrice='{}', maxPrice='{}', minDiscount='{}', sortBy='{}', page='{}', size='{}'",
            searchTerm, category, brand, color, size, available, minPrice, maxPrice, minDiscount, sortBy, pageable.getPageNumber(), pageable.getPageSize());
        
        // Remove pagination size from product size filter if present
        String productSize = size;
        if (size != null && size.matches("\\d+") && Integer.parseInt(size) == pageable.getPageSize()) {
            productSize = null;
            logger.info("Removing pagination size parameter from product filters");
        }
        
        Page<ProductResponseDTO> result = productService.searchAndFilterProducts(
            searchTerm, category, brand, color, productSize, available, minPrice, maxPrice, minDiscount, sortBy, pageable);
        
        logger.info("Search completed. Found {} products", result.getTotalElements());
        return result;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getProductById(@PathVariable Long id) {
        ProductResponseDTO productDTO = productService.getProductById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return ResponseEntity.ok(productDTO);
    }

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<ProductResponseDTO> addProduct(
            @RequestPart("product") String productRequestJson,
            @RequestPart(name = "imageFile", required = false) MultipartFile imageFile,
            @AuthenticationPrincipal UserPrincipal currentUser) throws Exception {
        
        ProductRequestDTO productRequestDTO = objectMapper.readValue(productRequestJson, ProductRequestDTO.class);
        
        var violations = validator.validate(productRequestDTO);
        if (!violations.isEmpty()) {
            logger.error("Validation errors: {}", violations);
            throw new IllegalArgumentException("Validation failed: " + violations.iterator().next().getMessage());
        }

        logger.info("Attempting to add product. User: {}, Authorities: {}", currentUser.getUsername(), currentUser.getAuthorities());
        User seller = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));
        ProductResponseDTO newProductDTO = productService.addProduct(productRequestDTO, imageFile, seller);
        return ResponseEntity.status(HttpStatus.CREATED).body(newProductDTO);
    }

    @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<ProductResponseDTO> updateProduct(
            @PathVariable Long id, 
            @RequestPart("product") String productDetailsJson,
            @RequestPart(name = "imageFile", required = false) MultipartFile imageFile,
            @AuthenticationPrincipal UserPrincipal currentUser) throws Exception {
        
        ProductRequestDTO productRequestDTO = objectMapper.readValue(productDetailsJson, ProductRequestDTO.class);

        var violations = validator.validate(productRequestDTO);
        if (!violations.isEmpty()) {
            logger.error("Validation errors for update: {}", violations);
            throw new IllegalArgumentException("Validation failed for update: " + violations.iterator().next().getMessage());
        }

        User seller = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));
        ProductResponseDTO updatedProductDTO = productService.updateProduct(id, productRequestDTO, imageFile, seller);
        return ResponseEntity.ok(updatedProductDTO);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal currentUser) {
        User seller = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));
        productService.deleteProduct(id, seller);
        return ResponseEntity.ok(new ApiResponse(true, "Product deleted successfully"));
    }

    // Endpoint for sellers to get their own products
    @GetMapping("/my-products")
    @PreAuthorize("hasRole('SELLER')")
    public Page<ProductResponseDTO> getMyProducts(@AuthenticationPrincipal UserPrincipal currentUser,
                                       @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User seller = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));
        return productService.getProductsBySeller(seller, pageable);
    }

     // Public endpoint to get products by a specific seller ID
    @GetMapping("/seller/{sellerId}")
    public Page<ProductResponseDTO> getProductsBySellerId(@PathVariable Long sellerId,
                                                @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));
        return productService.getProductsBySeller(seller, pageable);
    }

    // Public endpoint to get all unique categories
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(productService.getAllCategories());
    }

    // Public endpoint to get all unique brands
    @GetMapping("/brands")
    public ResponseEntity<List<String>> getAllBrands() {
        return ResponseEntity.ok(productService.getAllBrands());
    }
} 