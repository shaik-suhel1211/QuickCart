package com.quickcart.repository;

import com.quickcart.entity.Order;
import com.quickcart.entity.User;
import com.quickcart.entity.Order.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserOrderByOrderDateDesc(User user, Pageable pageable);


    Page<Order> findByUserAndStatusOrderByOrderDateDesc(User user, OrderStatus status, Pageable pageable);


    @Query("SELECT DISTINCT o FROM Order o JOIN o.items oi JOIN oi.product p WHERE p.seller = :seller")
    Page<Order> findOrdersBySeller(@Param("seller") User seller, Pageable pageable);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items oi JOIN oi.product p WHERE p.seller = :seller AND o.status = :status")
    Page<Order> findOrdersBySellerAndStatus(@Param("seller") User seller, @Param("status") OrderStatus status, Pageable pageable);

    @Query("SELECT SUM(oi.price * oi.quantity) " +
            "FROM Order o " +
            "JOIN o.items oi " +
            "WHERE oi.product.seller = :seller " +
            "AND o.status IN :statuses " +
            "AND o.orderDate BETWEEN :from AND :to")
    Double sumSellerEarningsByDateRange(@Param("seller") User seller,
                                            @Param("statuses") List<Order.OrderStatus> statuses,
                                            @Param("from") LocalDateTime from,
                                            @Param("to") LocalDateTime to);


}