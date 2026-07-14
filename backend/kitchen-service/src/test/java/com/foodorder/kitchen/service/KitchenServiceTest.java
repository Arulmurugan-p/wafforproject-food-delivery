package com.foodorder.kitchen.service;

import com.foodorder.kitchen.dto.KitchenRequest;
import com.foodorder.kitchen.dto.KitchenResponse;
import com.foodorder.kitchen.entity.KitchenTask;
import com.foodorder.kitchen.repository.KitchenRepository;
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
public class KitchenServiceTest {

    @Mock
    private KitchenRepository kitchenRepository;

    @InjectMocks
    private KitchenService kitchenService;

    private KitchenRequest request;

    @BeforeEach
    void setUp() {
        request = new KitchenRequest(1L, "Classic Burger");
    }

    @Test
    void testProcessKitchenTicket() {
        when(kitchenRepository.save(any(KitchenTask.class))).thenAnswer(invocation -> {
            KitchenTask t = invocation.getArgument(0);
            t.setId(10L);
            return t;
        });

        KitchenResponse response = kitchenService.processKitchenTicket(request);

        assertNotNull(response);
        assertEquals("FOOD_READY", response.getStatus());
        assertEquals(10L, response.getTicketId());

        verify(kitchenRepository, times(2)).save(any(KitchenTask.class));
    }
}
