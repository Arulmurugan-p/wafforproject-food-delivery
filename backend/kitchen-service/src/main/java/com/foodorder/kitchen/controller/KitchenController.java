package com.foodorder.kitchen.controller;

import com.foodorder.kitchen.dto.KitchenRequest;
import com.foodorder.kitchen.dto.KitchenResponse;
import com.foodorder.kitchen.service.KitchenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/kitchen")
@RequiredArgsConstructor
public class KitchenController {

    private final KitchenService kitchenService;

    @PostMapping
    public ResponseEntity<KitchenResponse> processKitchenTicket(@Valid @RequestBody KitchenRequest request) {
        KitchenResponse response = kitchenService.processKitchenTicket(request);
        return ResponseEntity.ok(response);
    }
}
