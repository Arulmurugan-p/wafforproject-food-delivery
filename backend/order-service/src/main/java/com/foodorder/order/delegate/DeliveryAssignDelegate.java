package com.foodorder.order.delegate;

import com.foodorder.order.delivery.dto.DeliveryRequest;
import com.foodorder.order.delivery.dto.DeliveryResponse;
import com.foodorder.order.delivery.service.DeliveryService;
import com.foodorder.order.service.WorkflowLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeliveryAssignDelegate implements JavaDelegate {

    private final DeliveryService deliveryService;
    private final WorkflowLogService logService;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long orderId = (Long) execution.getVariable("orderId");
        String customerName = (String) execution.getVariable("customerName");

        log.info("[OrderService] [Workflow] Invoking Delivery Service (Direct Java Call) for Order #{}", orderId);
        logService.logWorkflowStep(orderId, "Assign Delivery Partner", "SERVICE_TASK", "STARTED", "Assigning courier and generating ETA");

        try {
            DeliveryRequest request = new DeliveryRequest(orderId, customerName);
            DeliveryResponse response = deliveryService.processDelivery(request);

            if (response != null && "DELIVERED".equals(response.getStatus())) {
                String partner = response.getDeliveryPartner();
                String eta = response.getEta();
                Long deliveryId = response.getDeliveryId();

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
            log.error("[OrderService] [Workflow] Failed to execute Delivery Service call for Order #{}", orderId, e);
            logService.logWorkflowStep(orderId, "Assign Delivery Partner", "SERVICE_TASK", "FAILED", 
                    "Delivery integration failed: " + e.getMessage());
            throw e; // Throw to trigger Camunda incident / retry
        }
    }
}

