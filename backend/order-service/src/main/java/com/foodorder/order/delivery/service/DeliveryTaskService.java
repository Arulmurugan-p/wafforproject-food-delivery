package com.foodorder.order.delivery.service;

import com.foodorder.order.delivery.dto.DeliveryRequest;
import com.foodorder.order.delivery.dto.DeliveryResponse;
import com.foodorder.order.delivery.entity.DeliveryTask;
import com.foodorder.order.delivery.repository.DeliveryTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryTaskService {

    private final DeliveryTaskRepository deliveryTaskRepository;
    private final Random random = new Random();
    private static final String[] PARTNERS = {"Swift Runner", "Express Courier", "Flash Delivery", "Eco Rider", "Zoom Delivery"};

    @Transactional
    public DeliveryResponse processDelivery(DeliveryRequest request) {
        log.info("[DeliveryService] Assigning delivery partner for Order #{} (Customer: {})", request.getOrderId(), request.getCustomerName());

        String partner = PARTNERS[random.nextInt(PARTNERS.length)];
        String eta = (10 + random.nextInt(20)) + " mins";

        DeliveryTask task = DeliveryTask.builder()
                .orderId(request.getOrderId())
                .deliveryPartner(partner)
                .eta(eta)
                .status("OUT_FOR_DELIVERY")
                .build();

        deliveryTaskRepository.save(task);
        log.info("[DeliveryService] Order #{} status: OUT_FOR_DELIVERY, Courier: {}, ETA: {}", request.getOrderId(), partner, eta);

        // Transition to DELIVERED
        task.setStatus("DELIVERED");
        deliveryTaskRepository.save(task);

        log.info("[DeliveryService] DELIVERED Order #{} (Timestamp: {})", request.getOrderId(), LocalDateTime.now());

        return DeliveryResponse.builder()
                .deliveryId(task.getId())
                .deliveryPartner(partner)
                .eta(eta)
                .status("DELIVERED")
                .message("Delivery completed successfully by " + partner)
                .build();
    }
}
