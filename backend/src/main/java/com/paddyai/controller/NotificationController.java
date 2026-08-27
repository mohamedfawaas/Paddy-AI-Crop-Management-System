package com.paddyai.controller;

import com.paddyai.model.Notification;
import com.paddyai.model.User;
import com.paddyai.repository.NotificationRepository;
import com.paddyai.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepo;
    private final UserRepository userRepository;

    public NotificationController(NotificationRepository notificationRepo, UserRepository userRepository) {
        this.notificationRepo = notificationRepo;
        this.userRepository = userRepository;
    }

    private Optional<User> currentUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername());
    }

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(notificationRepo.findByUserOrderByCreatedAtDesc(u.get()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(@AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("count", notificationRepo.countByUserAndIsReadFalse(u.get())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        Optional<Notification> n = notificationRepo.findById(id);
        if (n.isEmpty() || !n.get().getUser().getId().equals(u.get().getId())) return ResponseEntity.notFound().build();
        Notification notif = n.get();
        notif.setRead(true);
        notificationRepo.save(notif);
        return ResponseEntity.ok(notif);
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        var list = notificationRepo.findByUserOrderByCreatedAtDesc(u.get());
        list.forEach(n -> n.setRead(true));
        notificationRepo.saveAll(list);
        return ResponseEntity.ok(Map.of("updated", list.size()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        Optional<Notification> n = notificationRepo.findById(id);
        if (n.isEmpty() || !n.get().getUser().getId().equals(u.get().getId())) return ResponseEntity.notFound().build();
        notificationRepo.delete(n.get());
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
