package com.foodorder.order.jms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    public void publishOrderCreated(Long orderId, String customerName, String foodItem, double amount) {
        log.info("[OrderService] Publishing Order #{} Created Event in-process", orderId);
        
        OrderCreatedEvent event = OrderCreatedEvent.builder()
                .orderId(orderId)
                .customerName(customerName)
                .foodItem(foodItem)
                .amount(amount)
                .timestamp(System.currentTimeMillis())
                .build();

        applicationEventPublisher.publishEvent(event);
        log.info("[OrderService] Published Order #{} in-process event successfully", orderId);
    }
}
