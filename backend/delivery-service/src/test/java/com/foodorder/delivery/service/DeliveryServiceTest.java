package com.foodorder.delivery.service;

import com.foodorder.delivery.dto.DeliveryRequest;
import com.foodorder.delivery.dto.DeliveryResponse;
import com.foodorder.delivery.entity.DeliveryTask;
import com.foodorder.delivery.repository.DeliveryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @InjectMocks
    private DeliveryService deliveryService;

    private DeliveryRequest request;

    @BeforeEach
    void setUp() {
        request = new DeliveryRequest(1L, "Alice");
    }

    @Test
    void testProcessDelivery() {
        when(deliveryRepository.save(any(DeliveryTask.class))).thenAnswer(invocation -> {
            DeliveryTask t = invocation.getArgument(0);
            t.setId(100L);
            return t;
        });

        DeliveryResponse response = deliveryService.processDelivery(request);

        assertNotNull(response);
        assertEquals("DELIVERED", response.getStatus());
        assertNotNull(response.getDeliveryPartner());
        assertNotNull(response.getEta());
        assertEquals(100L, response.getDeliveryId());

        verify(deliveryRepository, times(2)).save(any(DeliveryTask.class));
    }
}
