package com.foodorder.order.repository;

import com.foodorder.order.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @Query("SELECT n FROM Notification n WHERE n.username = :username OR (n.username IS NULL AND n.role = :role) ORDER BY n.createdAt DESC")
    List<Notification> findMyNotifications(@Param("username") String username, @Param("role") String role);

    List<Notification> findByUsernameOrRoleOrderByCreatedAtDesc(String username, String role);
    List<Notification> findByUsernameOrderByCreatedAtDesc(String username);
}
