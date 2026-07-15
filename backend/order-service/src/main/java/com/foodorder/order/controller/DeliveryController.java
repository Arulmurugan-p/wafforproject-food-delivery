package com.foodorder.order.controller;

import com.foodorder.order.delivery.dto.DeliveryTaskResponse;
import com.foodorder.order.entity.Delivery;
import com.foodorder.order.entity.Order;
import com.foodorder.order.repository.DeliveryRepository;
import com.foodorder.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
@Slf4j
public class DeliveryController {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final TaskService taskService;

    @GetMapping("/tasks")
    public ResponseEntity<List<DeliveryTaskResponse>> getMyDeliveries(Authentication authentication) {
        String partnerUsername = authentication.getName();
        log.info("[DeliveryController] Fetching deliveries for partner: {}", partnerUsername);
        List<Delivery> list = deliveryRepository.findByPartnerUsername(partnerUsername);
        List<DeliveryTaskResponse> responseList = list.stream().map(d -> {
            Optional<Order> orderOpt = orderRepository.findById(d.getOrderId());
            String customerName = "Unknown";
            String address = "Unknown";
            String phone = "Unknown";
            String foodItem = "Unknown";
            BigDecimal amount = BigDecimal.ZERO;
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                customerName = order.getCustomerName();
                address = order.getAddress();
                phone = order.getPhone();
                foodItem = order.getFoodItem();
                amount = order.getAmount();
            }
            return DeliveryTaskResponse.builder()
                    .id(d.getId())
                    .orderId(d.getOrderId())
                    .partnerUsername(d.getPartnerUsername())
                    .status(d.getStatus())
                    .eta(d.getEta())
                    .createdAt(d.getCreatedAt())
                    .customerName(customerName)
                    .address(address)
                    .phone(phone)
                    .foodItem(foodItem)
                    .amount(amount)
                    .build();
        }).toList();
        return ResponseEntity.ok(responseList);
    }

    @PostMapping("/tasks/{orderId}/accept")
    public ResponseEntity<?> acceptDelivery(Authentication authentication, @PathVariable Long orderId) {
        String partnerUsername = authentication.getName();
        log.info("[DeliveryController] Partner {} accepting delivery for order #{}", partnerUsername, orderId);

        Optional<Delivery> delOpt = deliveryRepository.findByOrderId(orderId);
        if (delOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Delivery task not found"));
        }

        Delivery delivery = delOpt.get();
        delivery.setStatus("ACCEPTED");
        deliveryRepository.save(delivery);

        // Resume Camunda workflow at DeliveryPartnerAcceptTask
        Task camundaTask = taskService.createTaskQuery()
                .processVariableValueEquals("orderId", orderId)
                .taskDefinitionKey("DeliveryPartnerAcceptTask")
                .singleResult();

        if (camundaTask != null) {
            taskService.complete(camundaTask.getId());
            log.info("[DeliveryController] Completed Camunda Accept task for order #{}", orderId);
        } else {
            log.warn("[DeliveryController] No active Camunda Accept task found for order #{}", orderId);
        }

        return ResponseEntity.ok(delivery);
    }

    @PostMapping("/tasks/{orderId}/start")
    public ResponseEntity<?> startDelivery(Authentication authentication, @PathVariable Long orderId) {
        String partnerUsername = authentication.getName();
        log.info("[DeliveryController] Partner {} starting delivery for order #{}", partnerUsername, orderId);

        Optional<Delivery> delOpt = deliveryRepository.findByOrderId(orderId);
        if (delOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Delivery task not found"));
        }

        Delivery delivery = delOpt.get();
        delivery.setStatus("STARTED");
        deliveryRepository.save(delivery);

        return ResponseEntity.ok(delivery);
    }

    @PostMapping("/tasks/{orderId}/reached")
    public ResponseEntity<?> reachedLocation(Authentication authentication, @PathVariable Long orderId) {
        String partnerUsername = authentication.getName();
        log.info("[DeliveryController] Partner {} reached location for order #{}", partnerUsername, orderId);

        Optional<Delivery> delOpt = deliveryRepository.findByOrderId(orderId);
        if (delOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Delivery not found"));
        }

        Delivery delivery = delOpt.get();
        delivery.setStatus("REACHED");
        deliveryRepository.save(delivery);

        return ResponseEntity.ok(delivery);
    }

    @PostMapping("/tasks/{orderId}/deliver")
    public ResponseEntity<?> markDelivered(Authentication authentication, @PathVariable Long orderId) {
        String partnerUsername = authentication.getName();
        log.info("[DeliveryController] Partner {} delivering order #{}", partnerUsername, orderId);

        Optional<Delivery> delOpt = deliveryRepository.findByOrderId(orderId);
        if (delOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Delivery not found"));
        }

        Delivery delivery = delOpt.get();
        delivery.setStatus("DELIVERED");
        deliveryRepository.save(delivery);

        // Resume Camunda workflow at DeliveryPartnerDeliverTask
        Task camundaTask = taskService.createTaskQuery()
                .processVariableValueEquals("orderId", orderId)
                .taskDefinitionKey("DeliveryPartnerDeliverTask")
                .singleResult();

        if (camundaTask != null) {
            taskService.complete(camundaTask.getId());
            log.info("[DeliveryController] Completed Camunda Deliver task for order #{}", orderId);
        } else {
            log.warn("[DeliveryController] No active Camunda Deliver task found for order #{}", orderId);
        }

        return ResponseEntity.ok(delivery);
    }
}
