package com.paddyai.controller;

import com.paddyai.model.Prediction;
import com.paddyai.model.User;
import com.paddyai.repository.PredictionRepository;
import com.paddyai.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/predictions")
public class PredictionController {

    private final PredictionRepository predictionRepo;
    private final UserRepository       userRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public PredictionController(PredictionRepository predictionRepo,
                                 UserRepository userRepository) {
        this.predictionRepo = predictionRepo;
        this.userRepository = userRepository;
    }

    private Map<String, Object> toDto(Prediction p, boolean includeImages) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id",        p.getId());
        dto.put("type",      p.getType());
        dto.put("result",    p.getResult());    // raw JSON string — frontend parses
        dto.put("inputData", p.getInputData());
        dto.put("status",    p.getStatus());
        dto.put("feedback",  p.getFeedback());
        dto.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().format(FMT) : null);
        if (includeImages) {
            dto.put("imageData",   p.getImageData());
            dto.put("heatmapData", p.getHeatmapData());
        }
        return dto;
    }

    // Single unified endpoint — returns all predictions for logged-in user as plain DTO
    @GetMapping("/history")
    public ResponseEntity<?> history(@AuthenticationPrincipal UserDetails ud) {
        Optional<User> found = userRepository.findByEmail(ud.getUsername());
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        List<Prediction> raw = predictionRepo.findByUserOrderByCreatedAtDesc(found.get());
        List<Map<String, Object>> dtos = new ArrayList<>();
        for (Prediction p : raw) dtos.add(toDto(p, false));
        return ResponseEntity.ok(dtos);
    }

    // Feature 1: Recent activity feed WITH images/heatmaps — used by the Dashboard
    // "Recent Predictions" panel so farmers can see the actual photo + AI confidence.
    @GetMapping("/recent")
    public ResponseEntity<?> recent(@AuthenticationPrincipal UserDetails ud,
                                     @RequestParam(defaultValue = "5") int limit) {
        Optional<User> found = userRepository.findByEmail(ud.getUsername());
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        List<Prediction> raw = predictionRepo.findByUserOrderByCreatedAtDesc(
                found.get(), PageRequest.of(0, Math.min(Math.max(limit, 1), 20)));
        List<Map<String, Object>> dtos = new ArrayList<>();
        for (Prediction p : raw) dtos.add(toDto(p, true));
        return ResponseEntity.ok(dtos);
    }

    // Feature 2: Farmer confirms whether a prediction was accurate or not.
    @PutMapping("/{id}/feedback")
    public ResponseEntity<?> setFeedback(@PathVariable Long id,
                                          @RequestBody Map<String, String> body,
                                          @AuthenticationPrincipal UserDetails ud) {
        Optional<User> found = userRepository.findByEmail(ud.getUsername());
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        Optional<Prediction> predOpt = predictionRepo.findById(id);
        if (predOpt.isEmpty()) return ResponseEntity.notFound().build();
        Prediction p = predOpt.get();

        // Farmers may only rate their own predictions.
        if (p.getUser() == null || !p.getUser().getId().equals(found.get().getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not your prediction."));
        }
        String value = body.get("feedback");
        if (!"ACCURATE".equals(value) && !"INACCURATE".equals(value)) {
            return ResponseEntity.badRequest().body(Map.of("error", "feedback must be ACCURATE or INACCURATE"));
        }
        p.setFeedback(value);
        predictionRepo.save(p);
        return ResponseEntity.ok(Map.of("message", "Feedback saved", "feedback", value));
    }
}
