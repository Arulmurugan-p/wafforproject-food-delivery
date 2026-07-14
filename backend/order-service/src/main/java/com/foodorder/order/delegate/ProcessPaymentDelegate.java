package com.foodorder.order.delegate;

import com.foodorder.order.service.WorkflowLogService;
import com.foodorder.order.payment.dto.PaymentRequest;
import com.foodorder.order.payment.dto.PaymentResponse;
import com.foodorder.order.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProcessPaymentDelegate implements JavaDelegate {

    private final PaymentService paymentService;
    private final WorkflowLogService logService;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long orderId = (Long) execution.getVariable("orderId");
        Double amountDouble = (Double) execution.getVariable("amount");
        BigDecimal amount = BigDecimal.valueOf(amountDouble != null ? amountDouble : 0.0);

        log.info("[OrderService] [Workflow] Invoking Payment Service for Order #{} via dependency injection", orderId);
        logService.logWorkflowStep(orderId, "Process Payment", "SERVICE_TASK", "STARTED", "Invoking direct payment service bean");

        try {
            PaymentRequest paymentRequest = new PaymentRequest(orderId, amount);
            PaymentResponse response = paymentService.processPayment(paymentRequest);

            if (response != null && "SUCCESS".equals(response.getStatus())) {
                String txnId = response.getTransactionId();
                log.info("[OrderService] [Workflow] Payment SUCCESS for Order #{} (Txn ID: {})", orderId, txnId);
                execution.setVariable("paymentSuccess", true);
                execution.setVariable("transactionId", txnId);

                logService.logWorkflowStep(orderId, "Process Payment", "SERVICE_TASK", "COMPLETED", 
                        "Payment succeeded. Transaction ID: " + txnId);
            } else {
                String msg = response != null ? response.getMessage() : "Empty response";
                log.warn("[OrderService] [Workflow] Payment FAILED for Order #{}: {}", orderId, msg);
                execution.setVariable("paymentSuccess", false);

                logService.logWorkflowStep(orderId, "Process Payment", "SERVICE_TASK", "FAILED", 
                        "Payment failed. Reason: " + msg);
            }
        } catch (Exception e) {
            log.error("[OrderService] [Workflow] Failed to execute Payment Service for Order #{}", orderId, e);
            execution.setVariable("paymentSuccess", false);

            logService.logWorkflowStep(orderId, "Process Payment", "SERVICE_TASK", "FAILED", 
                    "Payment integration failed. Technical error: " + e.getMessage());
        }
    }
}
