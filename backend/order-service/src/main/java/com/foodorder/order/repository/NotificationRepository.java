package com.foodorder.order.repository;

import com.foodorder.order.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUsernameOrRoleOrderByCreatedAtDesc(String username, String role);
    List<Notification> findByUsernameOrderByCreatedAtDesc(String username);
}
