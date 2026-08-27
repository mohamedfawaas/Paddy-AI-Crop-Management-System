package com.paddyai.controller;

import com.paddyai.model.Farm;
import com.paddyai.model.Prediction;
import com.paddyai.model.User;
import com.paddyai.repository.FarmActivityRepository;
import com.paddyai.repository.FarmRepository;
import com.paddyai.repository.NotificationRepository;
import com.paddyai.repository.PredictionRepository;
import com.paddyai.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepo;
    private final PredictionRepository predRepo;
    private final FarmRepository farmRepo;
    private final FarmActivityRepository activityRepo;
    private final NotificationRepository notificationRepo;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public AdminController(UserRepository userRepo,
                           PredictionRepository predRepo,
                           FarmRepository farmRepo,
                           FarmActivityRepository activityRepo,
                           NotificationRepository notificationRepo) {
        this.userRepo = userRepo;
        this.predRepo = predRepo;
        this.farmRepo = farmRepo;
        this.activityRepo = activityRepo;
        this.notificationRepo = notificationRepo;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        long accurate = predRepo.countByFeedback("ACCURATE");
        long inaccurate = predRepo.countByFeedback("INACCURATE");
        long totalRated = predRepo.countByFeedbackIsNotNull();
        double accuracyPct = totalRated > 0 ? Math.round((accurate * 1000.0) / totalRated) / 10.0 : 0.0;

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepo.count());
        stats.put("totalPredictions", predRepo.count());
        stats.put("suitabilityCount", predRepo.countByType("SUITABILITY"));
        stats.put("diseaseCount", predRepo.countByType("DISEASE"));
        stats.put("irrigationCount", predRepo.countByType("IRRIGATION"));
        stats.put("fertilizerCount", predRepo.countByType("FERTILIZER"));
        stats.put("yieldCount", predRepo.countByType("YIELD"));
        stats.put("pestCount", predRepo.countByType("PEST"));
        stats.put("weatherCount", predRepo.countByType("WEATHER"));
        stats.put("feedbackAccurate", accurate);
        stats.put("feedbackInaccurate", inaccurate);
        stats.put("feedbackTotal", totalRated);
        stats.put("feedbackAccuracyPct", accuracyPct);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<?> allUsers() {
        List<User> users = userRepo.findAllByOrderByCreatedAtDesc();
        List<Map<String,Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String,Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("role", u.getRole().name());
            m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().format(FMT) : null);
            m.put("predictions", predRepo.countByUser(u));
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/predictions")
    public ResponseEntity<?> allPredictions() {
        List<Prediction> raw = predRepo.findAllByOrderByCreatedAtDesc();
        List<Map<String,Object>> dtos = new ArrayList<>();
        for (Prediction p : raw) {
            Map<String,Object> dto = new LinkedHashMap<>();
            dto.put("id", p.getId());
            dto.put("type", p.getType());
            dto.put("result", p.getResult());
            dto.put("status", p.getStatus());
            dto.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().format(FMT) : null);
            if (p.getUser() != null) {
                dto.put("userName", p.getUser().getName());
                dto.put("userEmail", p.getUser().getEmail());
                dto.put("userId", p.getUser().getId());
            }
            dtos.add(dto);
        }
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(@PathVariable Long id,
                                        @RequestBody Map<String,String> body,
                                        @AuthenticationPrincipal UserDetails currentUser) {
        Optional<User> found = userRepo.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        User u = found.get();

        if (currentUser != null && u.getEmail().equalsIgnoreCase(currentUser.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot change your own admin role while signed in."));
        }

        try {
            User.Role requestedRole = User.Role.valueOf(String.valueOf(body.get("role")).toUpperCase(Locale.ROOT));
            if (u.getRole() == User.Role.ADMIN && requestedRole != User.Role.ADMIN && userRepo.countByRole(User.Role.ADMIN) <= 1) {
                return ResponseEntity.badRequest().body(Map.of("error", "At least one administrator account must remain."));
            }
            u.setRole(requestedRole);
            userRepo.save(u);
            return ResponseEntity.ok(Map.of("message", "Role updated", "role", u.getRole().name()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
        }
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id,
                                        @AuthenticationPrincipal UserDetails currentUser) {
        Optional<User> found = userRepo.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        User target = found.get();

        if (currentUser != null && target.getEmail().equalsIgnoreCase(currentUser.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot delete the account you are currently using."));
        }
        if (target.getRole() == User.Role.ADMIN && userRepo.countByRole(User.Role.ADMIN) <= 1) {
            return ResponseEntity.badRequest().body(Map.of("error", "At least one administrator account must remain."));
        }

        // Delete dependent rows explicitly so this works regardless of whether an existing
        // database was originally created with ON DELETE CASCADE foreign keys.
        List<Farm> farms = farmRepo.findByUserOrderByCreatedAtDesc(target);
        for (Farm farm : farms) activityRepo.deleteByFarm(farm);
        farmRepo.deleteByUser(target);
        notificationRepo.deleteByUser(target);
        predRepo.deleteByUser(target);
        userRepo.delete(target);

        return ResponseEntity.ok(Map.of("message", "User and related data deleted"));
    }
}
