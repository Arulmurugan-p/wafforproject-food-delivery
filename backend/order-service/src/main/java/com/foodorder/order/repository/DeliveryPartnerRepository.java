package com.foodorder.order.repository;

import com.foodorder.order.entity.DeliveryPartner;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, Long> {
    Optional<DeliveryPartner> findByUsername(String username);
    List<DeliveryPartner> findByStatus(String status);
}
