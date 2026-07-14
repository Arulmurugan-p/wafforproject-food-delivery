package com.foodorder.payment.service;

import com.foodorder.payment.dto.PaymentRequest;
import com.foodorder.payment.dto.PaymentResponse;
import com.foodorder.payment.entity.Payment;
import com.foodorder.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final Random random = new Random();

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("[PaymentService] Processing payment for Order #{} of amount {}", request.getOrderId(), request.getAmount());

        // Mock payment logic: 80% Success, 20% Failure
        boolean isSuccess = random.nextDouble() >= 0.20;
        String status = isSuccess ? "SUCCESS" : "FAILURE";
        String txnId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .amount(request.getAmount())
                .transactionId(txnId)
                .status(status)
                .build();

        paymentRepository.save(payment);

        log.info("[PaymentService] Order #{} Payment status: {} (Txn ID: {}, Timestamp: {})",
                request.getOrderId(), status, txnId, LocalDateTime.now());

        return PaymentResponse.builder()
                .transactionId(txnId)
                .status(status)
                .message(isSuccess ? "Payment completed successfully" : "Payment failed due to insufficient funds")
                .build();
    }
}
