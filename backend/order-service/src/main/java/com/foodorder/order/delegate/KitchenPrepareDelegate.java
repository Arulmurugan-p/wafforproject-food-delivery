package com.foodorder.order.delegate;

import com.foodorder.order.kitchen.dto.KitchenRequest;
import com.foodorder.order.kitchen.dto.KitchenResponse;
import com.foodorder.order.kitchen.service.KitchenService;
import com.foodorder.order.service.WorkflowLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class KitchenPrepareDelegate implements JavaDelegate {

    private final KitchenService kitchenService;
    private final WorkflowLogService logService;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long orderId = (Long) execution.getVariable("orderId");
        String foodItem = (String) execution.getVariable("foodItem");

        log.info("[OrderService] [Workflow] Invoking Kitchen Service (Direct Java Call) for Order #{}", orderId);
        logService.logWorkflowStep(orderId, "Kitchen Preparation", "SERVICE_TASK", "STARTED", "Sending food ticket to kitchen");

        try {
            KitchenRequest request = new KitchenRequest(orderId, foodItem);
            KitchenResponse response = kitchenService.processKitchenTicket(request);

            if (response != null && "FOOD_READY".equals(response.getStatus())) {
                Long ticketId = response.getTicketId();
                log.info("[OrderService] [Workflow] Kitchen READY for Order #{} (Ticket: {})", orderId, ticketId);
                execution.setVariable("kitchenTicketId", ticketId);

                logService.logWorkflowStep(orderId, "Kitchen Preparation", "SERVICE_TASK", "COMPLETED", 
                        "Food prepared. Ticket ID: " + ticketId);
            } else {
                log.error("[OrderService] [Workflow] Kitchen failed to prepare food for Order #{}", orderId);
                throw new IllegalStateException("Kitchen preparation failed");
            }
        } catch (Exception e) {
            log.error("[OrderService] [Workflow] Failed to execute Kitchen Service call for Order #{}", orderId, e);
            logService.logWorkflowStep(orderId, "Kitchen Preparation", "SERVICE_TASK", "FAILED", 
                    "Kitchen integration failed: " + e.getMessage());
            throw e; // Throw to trigger Camunda incident / retry
        }
    }
}

