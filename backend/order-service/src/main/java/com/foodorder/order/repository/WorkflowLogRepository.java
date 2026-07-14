package com.foodorder.order.repository;

import com.foodorder.order.entity.WorkflowLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowLogRepository extends JpaRepository<WorkflowLog, Long> {
    List<WorkflowLog> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}
