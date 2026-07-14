package com.foodorder.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryRequest {
    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotBlank(message = "Customer name is required")
    private String customerName;
}
