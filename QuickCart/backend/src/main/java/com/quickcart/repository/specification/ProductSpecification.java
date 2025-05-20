package com.quickcart.repository.specification;

import com.quickcart.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    private static final Logger logger = LoggerFactory.getLogger(ProductSpecification.class);

    public static Specification<Product> filterByCriteria(
            String searchTerm,
            String category,
            String brand,
            String color,
            String size,
            Boolean available,
            Double minPrice,
            Double maxPrice,
            BigDecimal minDiscount) {

        logger.info("ProductSpecification received: size='{}', available='{}'", size, available);

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(searchTerm)) {
                logger.info("Applying searchTerm filter: '{}'", searchTerm);
                Predicate namePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%" + searchTerm.toLowerCase() + "%");
                Predicate descriptionPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), "%" + searchTerm.toLowerCase() + "%");
                predicates.add(criteriaBuilder.or(namePredicate, descriptionPredicate));
            }

            if (StringUtils.hasText(category)) {
                logger.info("Applying category filter: '{}'", category);
                predicates.add(criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("category")), 
                    category.toLowerCase()
                ));
            }

            if (StringUtils.hasText(brand)) {
                logger.info("Applying brand filter: '{}'", brand);
                predicates.add(criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("brand")), 
                    brand.toLowerCase()
                ));
            }

            if (StringUtils.hasText(color)) {
                logger.info("Applying color filter: '{}'", color);
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("color")), color.toLowerCase()));
            }

            if (StringUtils.hasText(size)) {

                if (size.matches("\\d+")) {
                    logger.info("Ignoring pagination size parameter: '{}'", size);
                } else {
                    logger.info("Applying size filter: '{}'", size);
                    predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("size")), size.toLowerCase()));
                }
            }

            if (available != null) {
                logger.info("Applying available filter: '{}'", available);
                predicates.add(criteriaBuilder.equal(root.get("available"), available));
            }

            if (minPrice != null) {
                logger.info("Applying minPrice filter: '{}'", minPrice);
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), BigDecimal.valueOf(minPrice)));
            }

            if (maxPrice != null) {
                logger.info("Applying maxPrice filter: '{}'", maxPrice);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), BigDecimal.valueOf(maxPrice)));
            }

            if (minDiscount != null && minDiscount.compareTo(BigDecimal.ZERO) > 0) {
                logger.info("Applying minDiscount filter: '{}'", minDiscount);
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("discountPercentage"), minDiscount));
            }


            if (predicates.isEmpty()) {
                logger.info("No filters applied by ProductSpecification.");
            } else {
                logger.info("Final predicates count: {}", predicates.size());
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
} 