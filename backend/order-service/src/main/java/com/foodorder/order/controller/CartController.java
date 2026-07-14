package com.foodorder.order.controller;

import com.foodorder.order.entity.CartItem;
import com.foodorder.order.repository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Slf4j
public class CartController {

    private final CartItemRepository cartItemRepository;

    @GetMapping
    public ResponseEntity<List<CartItem>> getCart(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(cartItemRepository.findByUsername(username));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(Authentication authentication, @RequestBody Map<String, Object> request) {
        String username = authentication.getName();
        String name = (String) request.get("name");
        Number priceNum = (Number) request.get("price");
        BigDecimal price = BigDecimal.valueOf(priceNum != null ? priceNum.doubleValue() : 0.0);
        String icon = (String) request.get("icon");

        log.info("[CartController] Adding to cart for user {}: {}", username, name);

        List<CartItem> cart = cartItemRepository.findByUsername(username);
        Optional<CartItem> existing = cart.stream().filter(i -> i.getName().equals(name)).findFirst();

        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + 1);
            cartItemRepository.save(item);
        } else {
            cartItemRepository.save(CartItem.builder()
                    .username(username)
                    .name(name)
                    .price(price)
                    .quantity(1)
                    .icon(icon)
                    .build());
        }

        return ResponseEntity.ok(cartItemRepository.findByUsername(username));
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateQuantity(Authentication authentication, @RequestBody Map<String, Object> request) {
        String username = authentication.getName();
        String name = (String) request.get("name");
        Integer delta = (Integer) request.get("delta");

        log.info("[CartController] Updating qty in cart for user {} item {}: delta {}", username, name, delta);

        List<CartItem> cart = cartItemRepository.findByUsername(username);
        Optional<CartItem> existing = cart.stream().filter(i -> i.getName().equals(name)).findFirst();

        if (existing.isPresent()) {
            CartItem item = existing.get();
            int newQty = item.getQuantity() + delta;
            if (newQty <= 0) {
                cartItemRepository.delete(item);
            } else {
                item.setQuantity(newQty);
                cartItemRepository.save(item);
            }
        }

        return ResponseEntity.ok(cartItemRepository.findByUsername(username));
    }

    @PostMapping("/remove")
    @Transactional
    public ResponseEntity<?> removeFromCart(Authentication authentication, @RequestBody Map<String, String> request) {
        String username = authentication.getName();
        String name = request.get("name");

        log.info("[CartController] Removing item {} from cart for user {}", name, username);
        List<CartItem> cart = cartItemRepository.findByUsername(username);
        cart.stream().filter(i -> i.getName().equals(name)).forEach(cartItemRepository::delete);

        return ResponseEntity.ok(cartItemRepository.findByUsername(username));
    }

    @PostMapping("/clear")
    @Transactional
    public ResponseEntity<?> clearCart(Authentication authentication) {
        String username = authentication.getName();
        log.info("[CartController] Clearing cart for user {}", username);
        cartItemRepository.deleteByUsername(username);
        return ResponseEntity.ok(Map.of("message", "Cart cleared"));
    }
}
