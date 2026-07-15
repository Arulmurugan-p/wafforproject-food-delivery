package com.foodorder.order.service;

import com.foodorder.order.dto.OrderRequest;
import com.foodorder.order.dto.OrderResponse;
import com.foodorder.order.entity.Order;
import com.foodorder.order.entity.WorkflowLog;
import com.foodorder.order.jms.OrderEventPublisher;
import com.foodorder.order.repository.OrderRepository;
import com.foodorder.order.repository.WorkflowLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final WorkflowLogRepository logRepository;
    private final WorkflowLogService logService;
    private final OrderEventPublisher eventPublisher;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        log.info("[OrderService] Placing order for {} (Item: {}, Amount: {})",
                request.getCustomerName(), request.getFoodItem(), request.getAmount());

        Order order = Order.builder()
                .customerName(request.getCustomerName())
                .foodItem(request.getFoodItem())
                .amount(request.getAmount())
                .address(request.getAddress())
                .phone(request.getPhone())
                .status("REQUESTED")
                .build();

        orderRepository.save(order);

        log.info("[OrderService] Order #{} stored in status REQUESTED", order.getId());

        // Log the placement step
        logService.logWorkflowStep(
                order.getId(),
                "Order Placement",
                "USER_ACTION",
                "COMPLETED",
                "Order requested by customer and saved to database"
        );

        // Publish event to ActiveMQ
        eventPublisher.publishOrderCreated(
                order.getId(),
                order.getCustomerName(),
                order.getFoodItem(),
                order.getAmount().doubleValue()
        );

        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByCustomer(String customerName) {
        return orderRepository.findByCustomerNameOrderByCreatedAtDesc(customerName)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<OrderResponse> getOrderById(Long id) {
        return orderRepository.findById(id).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderDetailsWithLogs(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + id));

        List<WorkflowLog> logs = logRepository.findByOrderIdOrderByCreatedAtDesc(id);

        Map<String, Object> details = new HashMap<>();
        details.put("order", mapToResponse(order));
        details.put("logs", logs);
        return details;
    }

    private OrderResponse mapToResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .customerName(order.getCustomerName())
                .foodItem(order.getFoodItem())
                .amount(order.getAmount())
                .address(order.getAddress())
                .phone(order.getPhone())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
