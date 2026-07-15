package com.foodorder.order.delivery.repository;

import com.foodorder.order.delivery.entity.DeliveryTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryTaskRepository extends JpaRepository<DeliveryTask, Long> {
    Optional<DeliveryTask> findByOrderId(Long orderId);
}
