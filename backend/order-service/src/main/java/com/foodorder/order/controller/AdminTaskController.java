package com.foodorder.order.controller;

import com.foodorder.order.dto.TaskResponse;
import com.foodorder.order.entity.Order;
import com.foodorder.order.entity.DeliveryPartner;
import com.foodorder.order.entity.Delivery;
import com.foodorder.order.repository.OrderRepository;
import com.foodorder.order.repository.DeliveryPartnerRepository;
import com.foodorder.order.repository.DeliveryRepository;
import com.foodorder.order.service.WorkflowLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/tasks")
@RequiredArgsConstructor
@Slf4j
public class AdminTaskController {

    private final TaskService taskService;
    private final OrderRepository orderRepository;
    private final DeliveryPartnerRepository partnerRepository;
    private final DeliveryRepository deliveryRepository;
    private final WorkflowLogService logService;

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getActiveTasks() {
        log.info("[OrderService] [Admin] Fetching active approval tasks from Camunda");
        
        // Fetch all admin tasks
        List<Task> adminTasks = taskService.createTaskQuery()
                .taskCandidateGroup("ROLE_ADMIN")
                .list();

        List<TaskResponse> responseList = new ArrayList<>();
        for (Task task : adminTasks) {
            Long orderId = (Long) taskService.getVariable(task.getId(), "orderId");
            if (orderId != null) {
                Optional<Order> orderOpt = orderRepository.findById(orderId);
                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();
                    responseList.add(TaskResponse.builder()
                            .taskId(task.getId())
                            .taskName(task.getName())
                            .orderId(order.getId())
                            .customerName(order.getCustomerName())
                            .foodItem(order.getFoodItem())
                            .amount(order.getAmount())
                            .status(order.getStatus())
                            .taskDefinitionKey(task.getTaskDefinitionKey()) // e.g. AdminApproveTask
                            .build());
                }
            }
        }
        return ResponseEntity.ok(responseList);
    }

    @PostMapping("/{taskId}/approve-order")
    public ResponseEntity<?> approveOrder(@PathVariable String taskId) {
        log.info("[OrderService] [Admin] Approving order for task: {}", taskId);
        Long orderId = (Long) taskService.getVariable(taskId, "orderId");

        if (orderId != null) {
            logService.logWorkflowStep(
                    orderId,
                    "Admin Order Approval",
                    "USER_TASK",
                    "COMPLETED",
                    "Order was manually approved by Admin. Transitioning to payment pending."
            );
        }

        taskService.setVariable(taskId, "approved", true);
        taskService.complete(taskId);
        return ResponseEntity.ok(Map.of("message", "Order approved successfully"));
    }

    @PostMapping("/{taskId}/reject-order")
    public ResponseEntity<?> rejectOrder(@PathVariable String taskId) {
        log.info("[OrderService] [Admin] Rejecting order for task: {}", taskId);
        Long orderId = (Long) taskService.getVariable(taskId, "orderId");

        if (orderId != null) {
            logService.logWorkflowStep(
                    orderId,
                    "Admin Order Approval",
                    "USER_TASK",
                    "FAILED",
                    "Order was manually rejected by Admin. Transitioning to cancelled."
            );
        }

        taskService.setVariable(taskId, "approved", false);
        taskService.complete(taskId);
        return ResponseEntity.ok(Map.of("message", "Order rejected successfully"));
    }

    @PostMapping("/{taskId}/verify-payment")
    public ResponseEntity<?> verifyPayment(@PathVariable String taskId, @RequestBody Map<String, Boolean> request) {
        Boolean approved = request.get("approved");
        log.info("[OrderService] [Admin] Verifying payment for task: {}, approved: {}", taskId, approved);
        Long orderId = (Long) taskService.getVariable(taskId, "orderId");

        if (orderId != null) {
            logService.logWorkflowStep(
                    orderId,
                    "Admin Payment Verification",
                    "USER_TASK",
                    "COMPLETED",
                    approved ? "Payment verified successfully by Admin." : "Payment rejected by Admin."
            );
        }

        taskService.setVariable(taskId, "paymentSuccess", approved);
        taskService.complete(taskId);
        return ResponseEntity.ok(Map.of("message", "Payment verification completed."));
    }

    @PostMapping("/{taskId}/start-preparing")
    public ResponseEntity<?> startPreparing(@PathVariable String taskId) {
        log.info("[OrderService] [Admin] Starting food preparation for task: {}", taskId);
        Long orderId = (Long) taskService.getVariable(taskId, "orderId");

        if (orderId != null) {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                order.setStatus("PREPARING");
                orderRepository.save(order);

                logService.logWorkflowStep(
                        orderId,
                        "Kitchen Preparation Start",
                        "USER_TASK",
                        "STARTED",
                        "Kitchen started preparing the food item."
                );
            }
        }
        return ResponseEntity.ok(Map.of("message", "Kitchen preparation started."));
    }

    @PostMapping("/{taskId}/food-ready")
    public ResponseEntity<?> foodReady(@PathVariable String taskId) {
        log.info("[OrderService] [Admin] Marking food as ready for task: {}", taskId);
        Long orderId = (Long) taskService.getVariable(taskId, "orderId");

        if (orderId != null) {
            logService.logWorkflowStep(
                    orderId,
                    "Kitchen Preparation Complete",
                    "USER_TASK",
                    "COMPLETED",
                    "Food is ready! Waiting for delivery assignment."
            );
        }

        taskService.complete(taskId);
        return ResponseEntity.ok(Map.of("message", "Food marked as ready."));
    }

    @PostMapping("/{taskId}/assign-delivery")
    public ResponseEntity<?> assignDelivery(@PathVariable String taskId, @RequestBody Map<String, String> request) {
        String partnerUsername = request.get("partnerUsername");
        log.info("[OrderService] [Admin] Assigning delivery partner: {} for task: {}", partnerUsername, taskId);
        Long orderId = (Long) taskService.getVariable(taskId, "orderId");

        if (orderId != null) {
            // Save delivery job
            deliveryRepository.save(Delivery.builder()
                    .orderId(orderId)
                    .partnerUsername(partnerUsername)
                    .status("ASSIGNED")
                    .eta(25)
                    .createdAt(LocalDateTime.now())
                    .build());

            logService.logWorkflowStep(
                    orderId,
                    "Delivery Courier Assignment",
                    "USER_TASK",
                    "COMPLETED",
                    "Delivery courier partner assigned: " + partnerUsername
            );
        }

        taskService.complete(taskId);
        return ResponseEntity.ok(Map.of("message", "Delivery partner assigned successfully."));
    }

    @GetMapping("/delivery-partners")
    public ResponseEntity<List<DeliveryPartner>> getAvailablePartners() {
        return ResponseEntity.ok(partnerRepository.findAll());
    }

    @PostMapping("/{taskId}/cancel-order")
    public ResponseEntity<?> cancelOrder(@PathVariable String taskId) {
        log.info("[OrderService] [Admin] Manually cancelling task: {}", taskId);
        Long orderId = (Long) taskService.getVariable(taskId, "orderId");

        if (orderId != null) {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                order.setStatus("CANCELLED");
                orderRepository.save(order);

                logService.logWorkflowStep(
                        orderId,
                        "Order Aborted",
                        "USER_TASK",
                        "FAILED",
                        "Order was manually cancelled/aborted by Admin."
                );
            }
        }
        
        try {
            taskService.complete(taskId);
        } catch (Exception e) {
            log.warn("[OrderService] Task already completed or process finished: {}", e.getMessage());
        }
        return ResponseEntity.ok(Map.of("message", "Order cancelled successfully."));
    }
}
