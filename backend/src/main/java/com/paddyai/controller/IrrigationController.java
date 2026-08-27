package com.paddyai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paddyai.model.Prediction;
import com.paddyai.model.User;
import com.paddyai.repository.PredictionRepository;
import com.paddyai.repository.UserRepository;
import com.paddyai.service.MLClientService;
import com.paddyai.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/irrigation")
public class IrrigationController {

    private final MLClientService      mlClient;
    private final PredictionRepository predictionRepo;
    private final UserRepository       userRepository;
    private final ObjectMapper         objectMapper;
    private final NotificationService  notificationService;

    public IrrigationController(MLClientService mlClient,
                                 PredictionRepository predictionRepo,
                                 UserRepository userRepository,
                                 ObjectMapper objectMapper,
                                 NotificationService notificationService) {
        this.mlClient       = mlClient;
        this.predictionRepo = predictionRepo;
        this.userRepository = userRepository;
        this.objectMapper   = objectMapper;
        this.notificationService = notificationService;
    }

    @PostMapping("/predict")
    public ResponseEntity<?> predict(@RequestBody Map<String, Object> payload,
                                     @AuthenticationPrincipal UserDetails ud) {
        try {
            Map<String, Object> result = mlClient.predictIrrigation(payload);
            Long predictionId = save(ud, "IRRIGATION", payload, result);
            Map<String, Object> withId = new HashMap<>(result);
            withId.put("predictionId", predictionId);
            return ResponseEntity.ok(withId);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> history(@AuthenticationPrincipal UserDetails ud) {
        Optional<User> found = userRepository.findByEmail(ud.getUsername());
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(
                predictionRepo.findByUserAndTypeOrderByCreatedAtDesc(found.get(), "IRRIGATION"));
    }

    private Long save(UserDetails ud, String type,
                      Map<String, Object> input, Map<String, Object> result) {
        try {
            Optional<User> found = userRepository.findByEmail(ud.getUsername());
            if (found.isEmpty()) return null;
            Prediction p = Prediction.builder()
                    .user(found.get()).type(type)
                    .inputData(objectMapper.writeValueAsString(input))
                    .result(objectMapper.writeValueAsString(result))
                    .status("SUCCESS").build();
            predictionRepo.save(p);
            notificationService.notifyFromPrediction(found.get(), type, result, p.getId());
            return p.getId();
        } catch (Exception ignored) { return null; }
    }
}
