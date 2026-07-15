package com.foodorder.order.kitchen.repository;

import com.foodorder.order.kitchen.entity.KitchenTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KitchenRepository extends JpaRepository<KitchenTask, Long> {
    Optional<KitchenTask> findByOrderId(Long orderId);
}
