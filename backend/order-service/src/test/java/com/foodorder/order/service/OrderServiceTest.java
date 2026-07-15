package com.foodorder.order.service;

import com.foodorder.order.dto.OrderRequest;
import com.foodorder.order.dto.OrderResponse;
import com.foodorder.order.entity.Order;
import com.foodorder.order.jms.OrderEventPublisher;
import com.foodorder.order.repository.OrderRepository;
import com.foodorder.order.repository.WorkflowLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private WorkflowLogRepository logRepository;

    @Mock
    private WorkflowLogService logService;

    @Mock
    private OrderEventPublisher eventPublisher;

    @InjectMocks
    private OrderService orderService;

    private OrderRequest request;
    private Order savedOrder;

    @BeforeEach
    void setUp() {
        request = new OrderRequest("Alice", "Pizza", BigDecimal.valueOf(15.99), "Anna Nagar, Chennai", "+1 555-0123");
        savedOrder = Order.builder()
                .id(1L)
                .customerName("Alice")
                .foodItem("Pizza")
                .amount(BigDecimal.valueOf(15.99))
                .address("Anna Nagar, Chennai")
                .phone("+1 555-0123")
                .status("PLACED")
                .build();
    }

    @Test
    void testCreateOrder() {
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(1L);
            return o;
        });

        OrderResponse response = orderService.createOrder(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Alice", response.getCustomerName());
        assertEquals("Pizza", response.getFoodItem());
        assertEquals(BigDecimal.valueOf(15.99), response.getAmount());
        assertEquals("Anna Nagar, Chennai", response.getAddress());
        assertEquals("+1 555-0123", response.getPhone());
        assertEquals("REQUESTED", response.getStatus());

        verify(orderRepository, times(1)).save(any(Order.class));
        verify(logService, times(1)).logWorkflowStep(anyLong(), anyString(), anyString(), anyString(), anyString());
        verify(eventPublisher, times(1)).publishOrderCreated(anyLong(), anyString(), anyString(), anyDouble());
    }

    @Test
    void testGetOrderById() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(savedOrder));

        Optional<OrderResponse> responseOpt = orderService.getOrderById(1L);

        assertTrue(responseOpt.isPresent());
        OrderResponse response = responseOpt.get();
        assertEquals(1L, response.getId());
        assertEquals("Alice", response.getCustomerName());
        assertEquals("PLACED", response.getStatus());

        verify(orderRepository, times(1)).findById(1L);
    }
}
