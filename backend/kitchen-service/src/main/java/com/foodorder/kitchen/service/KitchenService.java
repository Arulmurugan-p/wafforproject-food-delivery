package com.foodorder.kitchen.service;

import com.foodorder.kitchen.dto.KitchenRequest;
import com.foodorder.kitchen.dto.KitchenResponse;
import com.foodorder.kitchen.entity.KitchenTask;
import com.foodorder.kitchen.repository.KitchenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenService {

    private final KitchenRepository kitchenRepository;

    @Transactional
    public KitchenResponse processKitchenTicket(KitchenRequest request) {
        log.info("[KitchenService] Received kitchen ticket for Order #{} (Item: {})", request.getOrderId(), request.getFoodItem());

        // Store ticket as PREPARING first
        KitchenTask task = KitchenTask.builder()
                .orderId(request.getOrderId())
                .foodItem(request.getFoodItem())
                .status("PREPARING")
                .build();
        
        kitchenRepository.save(task);
        log.info("[KitchenService] Ticket #{} created for Order #{} in status PREPARING", task.getId(), request.getOrderId());

        // Update to READY (since it's a mock sync process, or we can just return ready)
        task.setStatus("READY");
        kitchenRepository.save(task);

        log.info("[KitchenService] Food READY for Order #{} (Item: {}, Timestamp: {})",
                request.getOrderId(), request.getFoodItem(), LocalDateTime.now());

        return KitchenResponse.builder()
                .ticketId(task.getId())
                .status("FOOD_READY")
                .message("Food prepared and packaged successfully")
                .build();
    }
}
