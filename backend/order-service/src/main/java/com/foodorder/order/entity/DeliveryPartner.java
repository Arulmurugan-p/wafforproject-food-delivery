package com.foodorder.order.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "delivery_partners")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String fullName;

    @Column
    private String phone;

    @Column(nullable = false)
    private String status; // "AVAILABLE", "BUSY"
}
