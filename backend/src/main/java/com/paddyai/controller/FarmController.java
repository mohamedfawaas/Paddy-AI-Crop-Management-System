package com.paddyai.controller;

import com.paddyai.model.Farm;
import com.paddyai.model.FarmActivity;
import com.paddyai.model.User;
import com.paddyai.repository.FarmActivityRepository;
import com.paddyai.repository.FarmRepository;
import com.paddyai.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/farms")
public class FarmController {

    private final FarmRepository farmRepo;
    private final FarmActivityRepository activityRepo;
    private final UserRepository userRepository;

    public FarmController(FarmRepository farmRepo, FarmActivityRepository activityRepo, UserRepository userRepository) {
        this.farmRepo = farmRepo;
        this.activityRepo = activityRepo;
        this.userRepository = userRepository;
    }

    private Optional<User> currentUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername());
    }

    // ── Farm CRUD ────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(farmRepo.findByUserOrderByCreatedAtDesc(u.get()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, @AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        try {
            Farm f = new Farm();
            f.setUser(u.get());
            applyFields(f, body);
            farmRepo.save(f);
            return ResponseEntity.ok(f);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body, @AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        Optional<Farm> f = farmRepo.findByIdAndUser(id, u.get());
        if (f.isEmpty()) return ResponseEntity.notFound().build();
        try {
            Farm farm = f.get();
            applyFields(farm, body);
            farm.setUpdatedAt(java.time.LocalDateTime.now());
            farmRepo.save(farm);
            return ResponseEntity.ok(farm);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        Optional<Farm> f = farmRepo.findByIdAndUser(id, u.get());
        if (f.isEmpty()) return ResponseEntity.notFound().build();
        activityRepo.deleteByFarm(f.get());
        farmRepo.delete(f.get());
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    private void applyFields(Farm f, Map<String, Object> body) {
        if (body.containsKey("name")) f.setName(String.valueOf(body.get("name")));
        if (body.containsKey("location")) f.setLocation(String.valueOf(body.get("location")));
        if (body.containsKey("sizeAcres") && body.get("sizeAcres") != null) {
            String size = String.valueOf(body.get("sizeAcres")).trim();
            f.setSizeAcres(size.isEmpty() ? null : Double.valueOf(size));
        }
        if (body.containsKey("soilType")) f.setSoilType(String.valueOf(body.get("soilType")));
        if (body.containsKey("currentCropVariety")) f.setCurrentCropVariety(String.valueOf(body.get("currentCropVariety")));
        if (body.containsKey("plantingDate")) f.setPlantingDate(String.valueOf(body.get("plantingDate")));
        if (body.containsKey("notes")) f.setNotes(String.valueOf(body.get("notes")));
    }

    // ── Activity tracking (nested under a farm) ─────────────────────────────

    @GetMapping("/{farmId}/activities")
    public ResponseEntity<?> listActivities(@PathVariable Long farmId, @AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        Optional<Farm> f = farmRepo.findByIdAndUser(farmId, u.get());
        if (f.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(activityRepo.findByFarmOrderByActivityDateDesc(f.get()));
    }

    @PostMapping("/{farmId}/activities")
    public ResponseEntity<?> addActivity(@PathVariable Long farmId, @RequestBody Map<String, Object> body, @AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        Optional<Farm> f = farmRepo.findByIdAndUser(farmId, u.get());
        if (f.isEmpty()) return ResponseEntity.notFound().build();
        try {
            FarmActivity a = new FarmActivity();
            a.setFarm(f.get());
            a.setActivityType(String.valueOf(body.getOrDefault("activityType", "OTHER")));
            a.setDescription(String.valueOf(body.getOrDefault("description", "")));
            a.setActivityDate(String.valueOf(body.getOrDefault("activityDate", "")));
            activityRepo.save(a);
            return ResponseEntity.ok(a);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{farmId}/activities/{activityId}")
    public ResponseEntity<?> deleteActivity(@PathVariable Long farmId, @PathVariable Long activityId, @AuthenticationPrincipal UserDetails ud) {
        Optional<User> u = currentUser(ud);
        if (u.isEmpty()) return ResponseEntity.notFound().build();
        Optional<Farm> f = farmRepo.findByIdAndUser(farmId, u.get());
        if (f.isEmpty()) return ResponseEntity.notFound().build();
        activityRepo.findById(activityId).ifPresent(a -> {
            if (a.getFarm().getId().equals(farmId)) activityRepo.delete(a);
        });
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
