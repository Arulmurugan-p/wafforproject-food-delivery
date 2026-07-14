package com.foodorder.order.controller;

import com.foodorder.order.dto.OrderRequest;
import com.foodorder.order.dto.OrderResponse;
import com.foodorder.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody OrderRequest request) {
        OrderResponse response = orderService.createOrder(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/customer")
    public ResponseEntity<List<OrderResponse>> getCustomerOrders(org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getOrderDetails(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderDetailsWithLogs(id));
    }
}
