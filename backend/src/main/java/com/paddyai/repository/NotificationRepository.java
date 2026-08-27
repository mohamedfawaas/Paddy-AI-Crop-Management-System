package com.paddyai.repository;
import com.paddyai.model.Notification;
import com.paddyai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface NotificationRepository extends JpaRepository<Notification,Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    long countByUserAndIsReadFalse(User user);
    long deleteByUser(User user);
}
