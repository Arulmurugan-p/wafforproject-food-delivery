package com.foodorder.order.delegate;

import com.foodorder.order.service.WorkflowLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProcessPaymentDelegate implements JavaDelegate {

    private final RestTemplate restTemplate;
    private final WorkflowLogService logService;
    private static final String PAYMENT_SERVICE_URL = "http://localhost:8082/internal/payment";

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long orderId = (Long) execution.getVariable("orderId");
        Double amountDouble = (Double) execution.getVariable("amount");
        BigDecimal amount = BigDecimal.valueOf(amountDouble != null ? amountDouble : 0.0);

        log.info("[OrderService] [Workflow] Invoking Payment Service for Order #{}", orderId);
        logService.logWorkflowStep(orderId, "Process Payment", "SERVICE_TASK", "STARTED", "Invoking external payment service");

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("orderId", orderId);
            request.put("amount", amount);

            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(PAYMENT_SERVICE_URL, request, Map.class);
            Map<String, Object> response = responseEntity.getBody();

            if (response != null && "SUCCESS".equals(response.get("status"))) {
                String txnId = (String) response.get("transactionId");
                log.info("[OrderService] [Workflow] Payment SUCCESS for Order #{} (Txn ID: {})", orderId, txnId);
                execution.setVariable("paymentSuccess", true);
                execution.setVariable("transactionId", txnId);

                logService.logWorkflowStep(orderId, "Process Payment", "SERVICE_TASK", "COMPLETED", 
                        "Payment succeeded. Transaction ID: " + txnId);
            } else {
                String msg = response != null ? (String) response.get("message") : "Empty response";
                log.warn("[OrderService] [Workflow] Payment FAILED for Order #{}: {}", orderId, msg);
                execution.setVariable("paymentSuccess", false);

                logService.logWorkflowStep(orderId, "Process Payment", "SERVICE_TASK", "FAILED", 
                        "Payment failed. Reason: " + msg);
            }
        } catch (Exception e) {
            log.error("[OrderService] [Workflow] Failed to communicate with Payment Service for Order #{}", orderId, e);
            execution.setVariable("paymentSuccess", false);

            logService.logWorkflowStep(orderId, "Process Payment", "SERVICE_TASK", "FAILED", 
                    "Payment integration failed. Technical error: " + e.getMessage());
        }
    }
}
