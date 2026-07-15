package com.foodorder.order.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryResponse {
    private Long deliveryId;
    private String deliveryPartner;
    private String eta;
    private String status;
    private String message;
}
