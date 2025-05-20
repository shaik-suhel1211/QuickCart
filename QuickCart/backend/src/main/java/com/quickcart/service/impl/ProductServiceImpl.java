package com.quickcart.service.impl;

import com.quickcart.entity.Product;
import com.quickcart.entity.User;
import com.quickcart.entity.User.Role;
import com.quickcart.exception.ResourceNotFoundException;
import com.quickcart.exception.UnauthorizedOperationException;
import com.quickcart.repository.ProductRepository;
import com.quickcart.repository.specification.ProductSpecification;
import com.quickcart.service.ProductService;
import com.quickcart.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import com.quickcart.payload.ProductResponseDTO;
import com.quickcart.payload.ProductRequestDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.quickcart.util.SortingUtils;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID; // For unique filenames

@Service
public class ProductServiceImpl implements ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductServiceImpl.class);

    @Autowired
    private ProductRepository productRepository;

    @Autowired(required = false)
    private NotificationService notificationService;

    @Value("${file.upload-dir:./uploads/product-images}") // Default value if not in properties
    private String uploadDir;

    private Path rootLocation; // To store the root path

    @jakarta.annotation.PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir);
        try {
            if (!Files.exists(rootLocation)) {
                logger.info("Creating upload directory at: {}", rootLocation.toAbsolutePath());
                Files.createDirectories(rootLocation);
            }
            logger.info("Upload directory initialized at: {}", rootLocation.toAbsolutePath());
        } catch (IOException e) {
            logger.error("Could not initialize storage location: {}", e.getMessage());
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    private String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            logger.warn("Attempted to store empty file");
            return null;
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";
        int i = originalFilename.lastIndexOf('.');
        if (i > 0) {
            extension = originalFilename.substring(i);
        }
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        try {
            if (originalFilename.contains("..")) {
                throw new RuntimeException("Cannot store file with relative path outside current directory " + originalFilename);
            }

            Path targetLocation = this.rootLocation.resolve(uniqueFilename);
            logger.info("Storing file {} to {}", originalFilename, targetLocation.toAbsolutePath());
            
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            

            String imageUrl = "api/product-images/" + uniqueFilename;
            logger.info("File stored successfully. Access URL: {}", imageUrl);
            return imageUrl;
        } catch (IOException e) {
            logger.error("Failed to store file {}: {}", originalFilename, e.getMessage());
            throw new RuntimeException("Failed to store file " + originalFilename, e);
        }
    }

    private void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }
        try {

            String filename = Paths.get(fileUrl).getFileName().toString();
            Path filePath = this.rootLocation.resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {

            System.err.println("Failed to delete file: " + fileUrl + " Error: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ProductResponseDTO addProduct(ProductRequestDTO productRequestDTO, MultipartFile imageFile, User seller) {
        if (seller.getRole() != User.Role.SELLER) {
            throw new UnauthorizedOperationException("User is not authorized to add products.");
        }

        Product product = new Product();
        // Map from DTO to Entity
        product.setName(productRequestDTO.getName());
        product.setDescription(productRequestDTO.getDescription());
        product.setPrice(productRequestDTO.getPrice());
        product.setCategory(productRequestDTO.getCategory());
        product.setBrand(productRequestDTO.getBrand());
        product.setColor(productRequestDTO.getColor());
        product.setSize(productRequestDTO.getSize());
        product.setStock(productRequestDTO.getStock());
        product.setDiscountPercentage(productRequestDTO.getDiscountPercentage() != null ? productRequestDTO.getDiscountPercentage() : BigDecimal.ZERO);
        product.setAvailable(productRequestDTO.isAvailable());


        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = storeFile(imageFile);
            product.setImageUrl(imageUrl);
        }
        
        product.setSeller(seller);


        Product savedProduct = productRepository.save(product);
        
        // Send notification after product is successfully saved
        if (notificationService != null) {
            try {

                notificationService.sendProductUpdateNotification(mapProductToResponseDTO(savedProduct), "PRODUCT_ADDED");
            } catch (Exception e) {

                 System.err.println("Error sending product update notification: " + e.getMessage());
            }
        }

        return mapProductToResponseDTO(savedProduct);
    }

    @Override
    public Optional<ProductResponseDTO> getProductById(Long productId) {
        return productRepository.findById(productId)
            .map(product -> new ProductResponseDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getCategory(),
                product.getBrand(),
                product.getColor(),
                product.getSize(),
                product.getStock(),
                product.getImageUrl(),
                product.getDiscountPercentage(),
                product.isAvailable(),
                product.getSeller().getId(),
                product.getSeller().getUsername(),
                product.getCreatedAt(),
                product.getUpdatedAt()
            ));
    }

    @Override
    public Page<ProductResponseDTO> getAllProducts(Pageable pageable) {
        // Default sort by creation date if not specified
        if (pageable.getSort().isUnsorted()) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        

        Specification<Product> spec = (root, query, criteriaBuilder) -> 
            criteriaBuilder.isTrue(root.get("available"));
        

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        
        return productPage.map(this::mapProductToResponseDTO);
    }

    @Override
    public Page<ProductResponseDTO> searchAndFilterProducts(
            String searchTerm,
            String category,
            String brand,
            String color,
            String size,
            Boolean available,
            Double minPrice,
            Double maxPrice,
            BigDecimal minDiscount,
            String sortBy,
            Pageable pageable) {
        
        logger.info("ProductService.searchAndFilterProducts called with: searchTerm='{}', category='{}', brand='{}', color='{}', size='{}', available='{}', minPrice='{}', maxPrice='{}', minDiscount='{}', sortBy='{}'",
            searchTerm, category, brand, color, size, available, minPrice, maxPrice, minDiscount, sortBy);


        Boolean effectiveAvailable = available != null ? available : true;

        Specification<Product> spec = ProductSpecification.filterByCriteria(
                searchTerm, category, brand, color, size, effectiveAvailable, minPrice, maxPrice, minDiscount);
        
        Sort sort = parseSortBy(sortBy);
        Pageable effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort.isSorted() ? sort : Sort.by(Sort.Direction.DESC, "createdAt"));

        logger.info("Executing search with pageable: page={}, size={}, sort={}", 
            effectivePageable.getPageNumber(), effectivePageable.getPageSize(), effectivePageable.getSort());

        Page<Product> productPage = productRepository.findAll(spec, effectivePageable);
        
        logger.info("Found {} products in database", productPage.getTotalElements());
        
        return productPage.map(this::mapProductToResponseDTO);
    }

    private Sort parseSortBy(String sortBy) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return Sort.unsorted();
        }

        String[] parts = sortBy.split("_");
        if (parts.length == 2) {
            try {
                Sort.Direction direction = Sort.Direction.fromString(parts[1]);
                return Sort.by(direction, parts[0]);
            } catch (IllegalArgumentException e) {

                return Sort.by(Sort.Direction.DESC, "createdAt"); 
            }
        }
        return Sort.by(Sort.Direction.DESC, "createdAt"); // Default sort
    }

    @Override
    @Transactional
    public ProductResponseDTO updateProduct(Long productId, ProductRequestDTO productRequestDTO, MultipartFile imageFile, User seller) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (!product.getSeller().getId().equals(seller.getId()) && seller.getRole() != Role.SELLER) {

            throw new UnauthorizedOperationException("You are not authorized to update this product.");
        }

        // Map from DTO to Entity for update
        product.setName(productRequestDTO.getName());
        product.setDescription(productRequestDTO.getDescription());
        product.setPrice(productRequestDTO.getPrice());
        product.setCategory(productRequestDTO.getCategory());
        product.setBrand(productRequestDTO.getBrand());
        product.setColor(productRequestDTO.getColor());
        product.setSize(productRequestDTO.getSize());
        product.setStock(productRequestDTO.getStock());
        product.setDiscountPercentage(productRequestDTO.getDiscountPercentage() != null ? productRequestDTO.getDiscountPercentage() : BigDecimal.ZERO);
        product.setAvailable(productRequestDTO.isAvailable());

        if (imageFile != null && !imageFile.isEmpty()) {

            if (product.getImageUrl() != null && !product.getImageUrl().isBlank()) {
                deleteFile(product.getImageUrl());
            }
            String newImageUrl = storeFile(imageFile);
            product.setImageUrl(newImageUrl);
        }


        Product updatedProduct = productRepository.save(product);

        // Send notification after product is successfully updated
        if (notificationService != null) {
            try {
                notificationService.sendProductUpdateNotification(mapProductToResponseDTO(updatedProduct), "PRODUCT_UPDATED");
            } catch (Exception e) {
                System.err.println("Error sending product update notification: " + e.getMessage());
            }
        }

        return mapProductToResponseDTO(updatedProduct);
    }

    // Helper method to map Product entity to ProductResponseDTO
    private ProductResponseDTO mapProductToResponseDTO(Product product) {
        if (product == null) return null;


        String imageUrl = product.getImageUrl();
        if (imageUrl != null && !imageUrl.startsWith("http")) {

            imageUrl = imageUrl.replaceFirst("^/+", "");

            if (!imageUrl.startsWith("api/product-images/")) {
                imageUrl = "api/product-images/" + imageUrl;
            }

            imageUrl = "/" + imageUrl;
        }

        return new ProductResponseDTO(
            product.getId(),
            product.getName(),
            product.getDescription(),
            product.getPrice(),
            product.getCategory(),
            product.getBrand(),
            product.getColor(),
            product.getSize(),
            product.getStock(),
            imageUrl,
            product.getDiscountPercentage(),
            product.isAvailable(),
            product.getSeller().getId(),
            product.getSeller().getUsername(),
            product.getCreatedAt(),
            product.getUpdatedAt()
        );
    }

    @Override
    @Transactional
    public void deleteProduct(Long productId, User seller) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (!product.getSeller().getId().equals(seller.getId()) && seller.getRole() != Role.SELLER) {
            throw new UnauthorizedOperationException("User is not authorized to delete this product.");
        }
        
        String imageUrl = product.getImageUrl();
        productRepository.delete(product);
        deleteFile(imageUrl);


        if (notificationService != null) {
            try {

                notificationService.sendProductUpdateNotification(mapProductToResponseDTO(product), "PRODUCT_DELETED"); // Sending full DTO for context
            } catch (Exception e) {
                System.err.println("Error sending product delete notification: " + e.getMessage());
            }
        }
    }

    @Override
    public Page<ProductResponseDTO> getProductsBySeller(User seller, Pageable pageable) {
        return productRepository.findBySeller(seller, pageable)
                .map(this::mapProductToResponseDTO);
    }

    @Override
    public List<String> getAllCategories() {
        return productRepository.findAllCategories();
    }

    @Override
    public List<String> getAllBrands() {
        return productRepository.findAllBrands();
    }
} 