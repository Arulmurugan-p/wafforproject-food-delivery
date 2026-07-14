package com.foodorder.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {
    private String taskId;
    private String taskName;
    private Long orderId;
    private String customerName;
    private String foodItem;
    private BigDecimal amount;
    private String status;
    private String taskDefinitionKey;
}
