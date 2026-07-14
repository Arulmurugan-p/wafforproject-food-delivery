package com.foodorder.order.delegate;

import com.foodorder.order.entity.Order;
import com.foodorder.order.entity.Notification;
import com.foodorder.order.entity.Delivery;
import com.foodorder.order.repository.OrderRepository;
import com.foodorder.order.repository.NotificationRepository;
import com.foodorder.order.repository.DeliveryRepository;
import com.foodorder.order.service.WorkflowLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UpdateStatusDelegate implements JavaDelegate {

    private final OrderRepository orderRepository;
    private final NotificationRepository notificationRepository;
    private final DeliveryRepository deliveryRepository;
    private final WorkflowLogService logService;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long orderId = (Long) execution.getVariable("orderId");
        String targetStatus = (String) execution.getVariable("targetStatus");

        if (orderId == null || targetStatus == null) {
            log.warn("[UpdateStatusDelegate] Missing variables: orderId={} targetStatus={}", orderId, targetStatus);
            return;
        }

        log.info("[OrderService] [Workflow] Updating Order #{} status to {}", orderId, targetStatus);

        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setStatus(targetStatus);
            orderRepository.save(order);

            logService.logWorkflowStep(
                    orderId,
                    "Update Status to " + targetStatus,
                    "SERVICE_TASK",
                    "COMPLETED",
                    "Order status updated in database to: " + targetStatus
            );

            // Trigger Notifications based on state transitions
            createStatusNotifications(order, targetStatus);
        } else {
            log.error("[UpdateStatusDelegate] Order #{} not found in database", orderId);
            throw new IllegalArgumentException("Order " + orderId + " not found");
        }
    }

    private void createStatusNotifications(Order order, String status) {
        try {
            switch (status) {
                case "REQUESTED":
                    // Admin receives notification for new order
                    notificationRepository.save(Notification.builder()
                            .role("ADMIN")
                            .message("New order request #" + order.getId() + " submitted by customer. Needs approval.")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;

                case "ORDER_APPROVED":
                    // Customer receives notification
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("Your order #" + order.getId() + " has been approved by the Admin.")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;

                case "ORDER_REJECTED":
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("Your order #" + order.getId() + " has been rejected by the Admin.")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;

                case "PAYMENT_PENDING":
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("Order #" + order.getId() + " is pending payment verification.")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;

                case "PAYMENT_VERIFIED":
                    // Customer receives notification
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("Payment for order #" + order.getId() + " was successfully verified.")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;

                case "PAYMENT_REJECTED":
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("Payment for order #" + order.getId() + " was rejected.")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;

                case "PREPARING":
                    // Customer receives notification
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("Your order #" + order.getId() + " is now preparing in the kitchen.")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;

                case "FOOD_READY":
                    // Customer receives notification
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("Your food for order #" + order.getId() + " is ready! Waiting for courier pickup.")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;

                case "DELIVERY_ASSIGNED":
                    // Customer receives notification
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("A delivery partner has been assigned to your order #" + order.getId())
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());

                    // Find assigned partner username from delivery entry
                    Optional<Delivery> delOpt = deliveryRepository.findByOrderId(order.getId());
                    if (delOpt.isPresent()) {
                        String partner = delOpt.get().getPartnerUsername();
                        notificationRepository.save(Notification.builder()
                                .username(partner)
                                .role("DELIVERY_PARTNER")
                                .message("You have been assigned a new delivery task for order #" + order.getId())
                                .isRead(false)
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                    break;

                case "OUT_FOR_DELIVERY":
                    // Customer receives notification
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("Your order #" + order.getId() + " is out for delivery! The driver is on their way.")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;

                case "DELIVERED":
                    // Customer receives notification
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("Your order #" + order.getId() + " was successfully delivered. Enjoy your meal!")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;

                case "CANCELLED":
                    notificationRepository.save(Notification.builder()
                            .username(order.getCustomerName())
                            .role("CUSTOMER")
                            .message("Your order #" + order.getId() + " was cancelled.")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                    break;
            }
        } catch (Exception e) {
            log.error("[UpdateStatusDelegate] Failed to generate notification for order status changes", e);
        }
    }
}
