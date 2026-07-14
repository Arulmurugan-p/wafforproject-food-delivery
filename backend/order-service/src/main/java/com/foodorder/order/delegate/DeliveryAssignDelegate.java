package com.foodorder.order.delegate;

import com.foodorder.order.service.WorkflowLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeliveryAssignDelegate implements JavaDelegate {

    private final RestTemplate restTemplate;
    private final WorkflowLogService logService;
    private static final String DELIVERY_SERVICE_URL = "http://localhost:8084/internal/delivery";

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long orderId = (Long) execution.getVariable("orderId");
        String customerName = (String) execution.getVariable("customerName");

        log.info("[OrderService] [Workflow] Invoking Delivery Service for Order #{}", orderId);
        logService.logWorkflowStep(orderId, "Assign Delivery Partner", "SERVICE_TASK", "STARTED", "Assigning courier and generating ETA");

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("orderId", orderId);
            request.put("customerName", customerName);

            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(DELIVERY_SERVICE_URL, request, Map.class);
            Map<String, Object> response = responseEntity.getBody();

            if (response != null && "DELIVERED".equals(response.get("status"))) {
                String partner = (String) response.get("deliveryPartner");
                String eta = (String) response.get("eta");
                Long deliveryId = ((Number) response.get("deliveryId")).longValue();

                log.info("[OrderService] [Workflow] Delivery assigned for Order #{} to {} (ETA: {})", orderId, partner, eta);
                execution.setVariable("deliveryPartner", partner);
                execution.setVariable("deliveryEta", eta);

                logService.logWorkflowStep(orderId, "Assign Delivery Partner", "SERVICE_TASK", "COMPLETED", 
                        "Delivery completed. Courier: " + partner + ", ETA: " + eta);
            } else {
                log.error("[OrderService] [Workflow] Delivery assignment failed for Order #{}", orderId);
                throw new IllegalStateException("Delivery assignment failed");
            }
        } catch (Exception e) {
            log.error("[OrderService] [Workflow] Failed to communicate with Delivery Service for Order #{}", orderId, e);
            logService.logWorkflowStep(orderId, "Assign Delivery Partner", "SERVICE_TASK", "FAILED", 
                    "Delivery integration failed: " + e.getMessage());
            throw e; // Throw to trigger Camunda incident / retry
        }
    }
}
