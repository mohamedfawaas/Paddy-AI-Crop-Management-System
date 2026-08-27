package com.paddyai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paddyai.model.Prediction;
import com.paddyai.model.User;
import com.paddyai.repository.PredictionRepository;
import com.paddyai.repository.UserRepository;
import com.paddyai.service.MLClientService;
import com.paddyai.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/disease")
public class DiseaseController {

    private final MLClientService      mlClient;
    private final PredictionRepository predictionRepo;
    private final UserRepository       userRepository;
    private final ObjectMapper         objectMapper;
    private final NotificationService  notificationService;

    // Keep stored "recent activity" thumbnails small — long side capped, so the
    // dashboard feed loads quickly and the DB doesn't fill up with full-size photos.
    private static final int THUMB_MAX_DIM = 220;

    public DiseaseController(MLClientService mlClient,
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
    public ResponseEntity<?> predict(@RequestParam("image") MultipartFile image,
                                     @AuthenticationPrincipal UserDetails ud) {
        if (image.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Upload a valid image."));
        }
        String contentType = image.getContentType() == null ? "" : image.getContentType().toLowerCase();
        String originalName = image.getOriginalFilename() == null ? "" : image.getOriginalFilename().toLowerCase();
        boolean validMime = contentType.equals("image/jpeg") || contentType.equals("image/jpg")
                || contentType.equals("image/png") || contentType.equals("image/webp");
        boolean validExt = originalName.matches(".*\\.(jpg|jpeg|png|webp)$");
        if (!validMime || !validExt) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Only JPG, JPEG, PNG or WebP image files are accepted."));
        }
        if (image.getSize() > 5L * 1024L * 1024L) {
            return ResponseEntity.badRequest().body(Map.of("error", "Image must be 5 MB or smaller."));
        }
        try {
            Map<String, Object> result = mlClient.predictDisease(image);
            String filename = image.getOriginalFilename() != null
                    ? image.getOriginalFilename() : "image.jpg";

            // Feature 1: store a small base64 thumbnail of the uploaded leaf so the
            // Dashboard "Recent Activity" feed and History page can show the actual photo.
            String thumbBase64 = null;
            try {
                thumbBase64 = makeThumbnailBase64(image.getBytes(), image.getContentType());
            } catch (Exception ignored) {}

            // Feature 3: the ML service already returns a Grad-CAM heatmap image (base64)
            // inside `result.heatmap_image` — pull it out so it can be stored separately.
            String heatmapBase64 = result.get("heatmap_image") != null
                    ? String.valueOf(result.get("heatmap_image")) : null;

            save(ud, "DISEASE", Map.of("filename", filename), result, thumbBase64, heatmapBase64);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            String message = e.getMessage() == null ? "Disease prediction failed." : e.getMessage();
            if (message.contains("ML service unavailable") || message.contains("port 8000")) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", message));
            }
            return ResponseEntity.internalServerError().body(Map.of("error", message));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> history(@AuthenticationPrincipal UserDetails ud) {
        Optional<User> found = userRepository.findByEmail(ud.getUsername());
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(
                predictionRepo.findByUserAndTypeOrderByCreatedAtDesc(found.get(), "DISEASE"));
    }

    private void save(UserDetails ud, String type, Map<String, Object> input,
                       Map<String, Object> result, String imageData, String heatmapData) {
        try {
            Optional<User> found = userRepository.findByEmail(ud.getUsername());
            if (found.isEmpty()) return;
            Prediction p = Prediction.builder()
                    .user(found.get()).type(type)
                    .inputData(objectMapper.writeValueAsString(input))
                    .result(objectMapper.writeValueAsString(result))
                    .status("SUCCESS")
                    .imageData(imageData)
                    .heatmapData(heatmapData)
                    .build();
            predictionRepo.save(p);
            notificationService.notifyFromPrediction(found.get(), type, result, p.getId());
            // Feature 2: expose the saved prediction's id in the response so the UI can submit feedback
            result.put("predictionId", p.getId());
        } catch (Exception ignored) {}
    }

    /** Downscale the uploaded photo to a small JPEG thumbnail and base64-encode it,
     *  so recent-activity thumbnails stay lightweight in the database and over the wire. */
    private String makeThumbnailBase64(byte[] bytes, String contentType) throws Exception {
        java.awt.image.BufferedImage original = javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(bytes));
        if (original == null) return null;
        int w = original.getWidth(), h = original.getHeight();
        double scale = Math.min(1.0, THUMB_MAX_DIM / (double) Math.max(w, h));
        int nw = Math.max(1, (int) (w * scale));
        int nh = Math.max(1, (int) (h * scale));
        java.awt.image.BufferedImage resized = new java.awt.image.BufferedImage(nw, nh, java.awt.image.BufferedImage.TYPE_INT_RGB);
        java.awt.Graphics2D g = resized.createGraphics();
        g.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION, java.awt.RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(original, 0, 0, nw, nh, null);
        g.dispose();
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(resized, "jpg", baos);
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
    }
}
