package com.foodorder.payment.service;

import com.foodorder.payment.dto.PaymentRequest;
import com.foodorder.payment.dto.PaymentResponse;
import com.foodorder.payment.entity.Payment;
import com.foodorder.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PaymentService paymentService;

    private PaymentRequest request;

    @BeforeEach
    void setUp() {
        request = new PaymentRequest(1L, BigDecimal.valueOf(15.99));
    }

    @Test
    void testProcessPayment() {
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.processPayment(request);

        assertNotNull(response);
        assertNotNull(response.getTransactionId());
        assertTrue(response.getTransactionId().startsWith("TXN-"));
        assertTrue("SUCCESS".equals(response.getStatus()) || "FAILURE".equals(response.getStatus()));

        verify(paymentRepository, times(1)).save(any(Payment.class));
    }
}
