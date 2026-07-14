package com.foodorder.order.controller;

import com.foodorder.order.entity.Notification;
import com.foodorder.order.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Authentication authentication) {
        String username = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(r -> r.replace("ROLE_", ""))
                .findFirst()
                .orElse("CUSTOMER");

        log.info("[NotificationController] Fetching notifications for user: {}, role: {}", username, role);
        List<Notification> list = notificationRepository.findByUsernameOrRoleOrderByCreatedAtDesc(username, role);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/mark-read")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        String username = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(r -> r.replace("ROLE_", ""))
                .findFirst()
                .orElse("CUSTOMER");

        log.info("[NotificationController] Marking notifications as read for user: {}, role: {}", username, role);
        List<Notification> list = notificationRepository.findByUsernameOrRoleOrderByCreatedAtDesc(username, role);
        for (Notification n : list) {
            n.setRead(true);
        }
        notificationRepository.saveAll(list);
        return ResponseEntity.ok(Map.of("message", "Notifications marked as read"));
    }
}
