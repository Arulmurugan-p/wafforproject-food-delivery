package com.foodorder.order.jms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private final JmsTemplate jmsTemplate;

    @Value("${activemq.queue.name}")
    private String queueName;

    public void publishOrderCreated(Long orderId, String customerName, String foodItem, double amount) {
        log.info("[OrderService] Publishing Order #{} Created Event to ActiveMQ Queue: {}", orderId, queueName);
        
        Map<String, Object> message = new HashMap<>();
        message.put("orderId", orderId);
        message.put("customerName", customerName);
        message.put("foodItem", foodItem);
        message.put("amount", amount);
        message.put("timestamp", System.currentTimeMillis());

        // Set type ID property so listener can identify it if necessary, though Jackson serializes it nicely
        jmsTemplate.convertAndSend(queueName, message, postProcessor -> {
            postProcessor.setStringProperty("_type", "com.foodorder.order.jms.OrderCreatedEvent");
            return postProcessor;
        });

        log.info("[OrderService] Published Order #{} successfully", orderId);
    }
}
