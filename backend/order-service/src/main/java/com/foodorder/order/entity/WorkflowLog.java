package com.foodorder.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_logs", indexes = {
    @Index(name = "idx_workflow_logs_order_id", columnList = "orderId")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private String activityName;

    @Column(nullable = false)
    private String activityType; // SERVICE_TASK, USER_TASK, GATEWAY, etc.

    @Column(nullable = false)
    private String status; // STARTED, COMPLETED, FAILED

    @Column(columnDefinition = "TEXT")
    private String details;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
