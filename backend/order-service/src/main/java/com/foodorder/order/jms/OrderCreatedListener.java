package com.foodorder.order.jms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.RuntimeService;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderCreatedListener {

    private final RuntimeService runtimeService;

    @JmsListener(destination = "${activemq.queue.name}", containerFactory = "jmsListenerContainerFactory")
    public void onOrderCreated(OrderCreatedEvent event) {
        Long orderId = event.getOrderId();
        String customerName = event.getCustomerName();
        String foodItem = event.getFoodItem();
        Double amount = event.getAmount();

        log.info("[OrderService] ActiveMQ Queue Consumer: Received Order #{} (Customer: {}, Item: {}, Amount: {})",
                orderId, customerName, foodItem, amount);

        // Start Camunda BPM Workflow
        Map<String, Object> variables = new HashMap<>();
        variables.put("orderId", orderId);
        variables.put("customerName", customerName);
        variables.put("foodItem", foodItem);
        variables.put("amount", amount);

        log.info("[OrderService] Triggering Camunda process 'FoodOrderFlow' for Order #{}", orderId);
        runtimeService.startProcessInstanceByKey("FoodOrderFlow", String.valueOf(orderId), variables);
        log.info("[OrderService] Camunda workflow instance successfully started for Order #{}", orderId);
    }
}
