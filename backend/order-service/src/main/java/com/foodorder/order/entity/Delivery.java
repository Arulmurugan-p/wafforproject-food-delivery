package com.foodorder.order.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "partner_username")
    private String partnerUsername;

    @Column(nullable = false)
    private String status; // "ASSIGNED", "ACCEPTED", "STARTED", "REACHED", "DELIVERED"

    @Column
    private Integer eta; // in minutes

    @Column
    private LocalDateTime createdAt;
}
