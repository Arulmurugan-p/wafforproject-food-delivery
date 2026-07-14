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
public class KitchenPrepareDelegate implements JavaDelegate {

    private final RestTemplate restTemplate;
    private final WorkflowLogService logService;
    private static final String KITCHEN_SERVICE_URL = "http://localhost:8083/internal/kitchen";

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long orderId = (Long) execution.getVariable("orderId");
        String foodItem = (String) execution.getVariable("foodItem");

        log.info("[OrderService] [Workflow] Invoking Kitchen Service for Order #{}", orderId);
        logService.logWorkflowStep(orderId, "Kitchen Preparation", "SERVICE_TASK", "STARTED", "Sending food ticket to kitchen");

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("orderId", orderId);
            request.put("foodItem", foodItem);

            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(KITCHEN_SERVICE_URL, request, Map.class);
            Map<String, Object> response = responseEntity.getBody();

            if (response != null && "FOOD_READY".equals(response.get("status"))) {
                Long ticketId = ((Number) response.get("ticketId")).longValue();
                log.info("[OrderService] [Workflow] Kitchen READY for Order #{} (Ticket: {})", orderId, ticketId);
                execution.setVariable("kitchenTicketId", ticketId);

                logService.logWorkflowStep(orderId, "Kitchen Preparation", "SERVICE_TASK", "COMPLETED", 
                        "Food prepared. Ticket ID: " + ticketId);
            } else {
                log.error("[OrderService] [Workflow] Kitchen failed to prepare food for Order #{}", orderId);
                throw new IllegalStateException("Kitchen preparation failed");
            }
        } catch (Exception e) {
            log.error("[OrderService] [Workflow] Failed to communicate with Kitchen Service for Order #{}", orderId, e);
            logService.logWorkflowStep(orderId, "Kitchen Preparation", "SERVICE_TASK", "FAILED", 
                    "Kitchen integration failed: " + e.getMessage());
            throw e; // Throw to trigger Camunda incident / retry
        }
    }
}
