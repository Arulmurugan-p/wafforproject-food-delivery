package com.foodorder.order.delivery.controller;

import com.foodorder.order.delivery.dto.DeliveryRequest;
import com.foodorder.order.delivery.dto.DeliveryResponse;
import com.foodorder.order.delivery.service.DeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    @PostMapping
    public ResponseEntity<DeliveryResponse> processDelivery(@Valid @RequestBody DeliveryRequest request) {
        DeliveryResponse response = deliveryService.processDelivery(request);
        return ResponseEntity.ok(response);
    }
}
