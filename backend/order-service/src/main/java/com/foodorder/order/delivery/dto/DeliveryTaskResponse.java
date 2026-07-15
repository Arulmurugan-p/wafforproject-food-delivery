package com.foodorder.order.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryTaskResponse {
    private Long id;
    private Long orderId;
    private String partnerUsername;
    private String status;
    private Integer eta;
    private LocalDateTime createdAt;
    private String customerName;
    private String address;
    private String phone;
    private String foodItem;
    private BigDecimal amount;
}
