package com.foodorder.delivery.repository;

import com.foodorder.delivery.entity.DeliveryTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<DeliveryTask, Long> {
    Optional<DeliveryTask> findByOrderId(Long orderId);
}
