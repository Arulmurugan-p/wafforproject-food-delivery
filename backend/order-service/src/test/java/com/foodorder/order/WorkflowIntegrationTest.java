package com.foodorder.order;

import com.foodorder.order.dto.OrderRequest;
import com.foodorder.order.dto.OrderResponse;
import com.foodorder.order.entity.Delivery;
import com.foodorder.order.entity.Notification;
import com.foodorder.order.entity.Order;
import com.foodorder.order.repository.DeliveryRepository;
import com.foodorder.order.repository.NotificationRepository;
import com.foodorder.order.repository.OrderRepository;
import com.foodorder.order.service.OrderService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {"activemq.embedded=false", "activemq.queue.name=order.created.test"})
public class WorkflowIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private RuntimeService runtimeService;

    @Autowired
    private TaskService taskService;

    @Test
    public void testCompleteWorkflowEndToEnd() throws Exception {
        // 1. Place order (simulates Customer checkout)
        OrderRequest request = new OrderRequest("TestCustomer", "Burgers x2, Coke", BigDecimal.valueOf(458.00), "Anna Nagar, Chennai", "+1 555-0123");
        OrderResponse response = orderService.createOrder(request);

        assertNotNull(response);
        Long orderId = response.getId();
        assertNotNull(orderId);
        assertEquals("REQUESTED", response.getStatus());

        // Wait up to 5 seconds for ActiveMQ listener to pick up and start Camunda workflow
        Task adminApproveTask = null;
        for (int i = 0; i < 25; i++) {
            List<Task> tasks = taskService.createTaskQuery()
                    .processVariableValueEquals("orderId", orderId)
                    .taskDefinitionKey("AdminApproveTask")
                    .list();
            if (!tasks.isEmpty()) {
                adminApproveTask = tasks.get(0);
                break;
            }
            Thread.sleep(200);
        }

        assertNotNull(adminApproveTask, "AdminApproveTask should be created for Order #" + orderId);

        // 2. Admin Approves Order
        taskService.setVariable(adminApproveTask.getId(), "approved", true);
        taskService.complete(adminApproveTask.getId());

        // Wait for status to transition to PAYMENT_PENDING and create AdminVerifyPaymentTask
        Task verifyPaymentTask = null;
        for (int i = 0; i < 25; i++) {
            List<Task> tasks = taskService.createTaskQuery()
                    .processVariableValueEquals("orderId", orderId)
                    .taskDefinitionKey("AdminVerifyPaymentTask")
                    .list();
            if (!tasks.isEmpty()) {
                verifyPaymentTask = tasks.get(0);
                break;
            }
            Thread.sleep(200);
        }

        assertNotNull(verifyPaymentTask, "AdminVerifyPaymentTask should be created");

        // Verify order status in DB
        Order order = orderRepository.findById(orderId).orElseThrow();
        assertEquals("PAYMENT_PENDING", order.getStatus());

        // 3. Admin Verifies Payment (Approved)
        taskService.setVariable(verifyPaymentTask.getId(), "paymentSuccess", true);
        taskService.complete(verifyPaymentTask.getId());

        // Wait for status to transition and create AdminKitchenPrepTask
        Task kitchenPrepTask = null;
        for (int i = 0; i < 25; i++) {
            List<Task> tasks = taskService.createTaskQuery()
                    .processVariableValueEquals("orderId", orderId)
                    .taskDefinitionKey("AdminKitchenPrepTask")
                    .list();
            if (!tasks.isEmpty()) {
                kitchenPrepTask = tasks.get(0);
                break;
            }
            Thread.sleep(200);
        }

        assertNotNull(kitchenPrepTask, "AdminKitchenPrepTask should be created");
        order = orderRepository.findById(orderId).orElseThrow();
        assertEquals("PAYMENT_VERIFIED", order.getStatus());

        // 4. Admin starts preparing (Updates DB state to PREPARING)
        order.setStatus("PREPARING");
        orderRepository.save(order);

        // 5. Admin marks food ready (completes AdminKitchenPrepTask)
        taskService.complete(kitchenPrepTask.getId());

        // Wait for status to transition to FOOD_READY and create AdminAssignDeliveryTask
        Task assignDeliveryTask = null;
        for (int i = 0; i < 25; i++) {
            List<Task> tasks = taskService.createTaskQuery()
                    .processVariableValueEquals("orderId", orderId)
                    .taskDefinitionKey("AdminAssignDeliveryTask")
                    .list();
            if (!tasks.isEmpty()) {
                assignDeliveryTask = tasks.get(0);
                break;
            }
            Thread.sleep(200);
        }

        assertNotNull(assignDeliveryTask, "AdminAssignDeliveryTask should be created");
        order = orderRepository.findById(orderId).orElseThrow();
        assertEquals("FOOD_READY", order.getStatus());

        // 6. Admin assigns delivery partner (Saves Delivery entity and completes task)
        deliveryRepository.save(Delivery.builder()
                .orderId(orderId)
                .partnerUsername("delivery")
                .status("ASSIGNED")
                .eta(25)
                .createdAt(java.time.LocalDateTime.now())
                .build());

        taskService.complete(assignDeliveryTask.getId());

        // Wait for status to transition to DELIVERY_ASSIGNED and create DeliveryPartnerAcceptTask
        Task acceptDeliveryTask = null;
        for (int i = 0; i < 25; i++) {
            List<Task> tasks = taskService.createTaskQuery()
                    .processVariableValueEquals("orderId", orderId)
                    .taskDefinitionKey("DeliveryPartnerAcceptTask")
                    .list();
            if (!tasks.isEmpty()) {
                acceptDeliveryTask = tasks.get(0);
                break;
            }
            Thread.sleep(200);
        }

        assertNotNull(acceptDeliveryTask, "DeliveryPartnerAcceptTask should be created");
        order = orderRepository.findById(orderId).orElseThrow();
        assertEquals("DELIVERY_ASSIGNED", order.getStatus());

        // 7. Delivery partner accepts courier task
        Optional<Delivery> delOpt = deliveryRepository.findByOrderId(orderId);
        assertTrue(delOpt.isPresent());
        Delivery delivery = delOpt.get();
        delivery.setStatus("ACCEPTED");
        deliveryRepository.save(delivery);

        taskService.complete(acceptDeliveryTask.getId());

        // Wait for status to transition to OUT_FOR_DELIVERY and create DeliveryPartnerDeliverTask
        Task deliverTask = null;
        for (int i = 0; i < 25; i++) {
            List<Task> tasks = taskService.createTaskQuery()
                    .processVariableValueEquals("orderId", orderId)
                    .taskDefinitionKey("DeliveryPartnerDeliverTask")
                    .list();
            if (!tasks.isEmpty()) {
                deliverTask = tasks.get(0);
                break;
            }
            Thread.sleep(200);
        }

        assertNotNull(deliverTask, "DeliveryPartnerDeliverTask should be created");
        order = orderRepository.findById(orderId).orElseThrow();
        assertEquals("OUT_FOR_DELIVERY", order.getStatus());

        // 8. Delivery partner marks delivered (completes task)
        delivery.setStatus("DELIVERED");
        deliveryRepository.save(delivery);

        taskService.complete(deliverTask.getId());

        // Wait for final state: DELIVERED and workflow completion
        boolean completed = false;
        for (int i = 0; i < 25; i++) {
            order = orderRepository.findById(orderId).orElseThrow();
            if ("DELIVERED".equals(order.getStatus())) {
                completed = true;
                break;
            }
            Thread.sleep(200);
        }

        assertTrue(completed);
        assertEquals("DELIVERED", order.getStatus());

        // Clean up database entities for test isolation
        deliveryRepository.delete(delivery);
        orderRepository.delete(order);
        List<Notification> notifs = notificationRepository.findMyNotifications("TestCustomer", "CUSTOMER");
        notificationRepository.deleteAll(notifs);
        List<Notification> adminNotifs = notificationRepository.findMyNotifications("admin", "ADMIN");
        notificationRepository.deleteAll(adminNotifs);
    }
}
