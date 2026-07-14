package com.foodorder.order.repository;

import com.foodorder.order.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByOrderId(Long orderId);
    List<Delivery> findByPartnerUsername(String partnerUsername);
}
