package com.paddyai.controller;

import com.paddyai.dto.ProfileDto;
import com.paddyai.model.User;
import com.paddyai.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private static final Pattern SAFE_AVATAR = Pattern.compile(
            "^data:image/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\\r\\n]+$",
            Pattern.CASE_INSENSITIVE);

    private final UserRepository userRepository;

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails currentUser) {
        Optional<User> found = currentUser == null
                ? Optional.empty()
                : userRepository.findByEmail(currentUser.getUsername());

        if (found.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authenticated user not found."));
        }
        return ResponseEntity.ok(toResponse(found.get()));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@Valid @RequestBody ProfileDto.UpdateRequest req,
                                           @AuthenticationPrincipal UserDetails currentUser) {
        Optional<User> found = currentUser == null
                ? Optional.empty()
                : userRepository.findByEmail(currentUser.getUsername());

        if (found.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authenticated user not found."));
        }

        String avatarImage = normalize(req.getAvatarImage());
        if (avatarImage != null && !SAFE_AVATAR.matcher(avatarImage).matches()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Profile photo must be a valid JPEG, PNG or WebP image."));
        }

        User user = found.get();
        user.setLocation(normalize(req.getLocation()));
        user.setFarmSize(req.getFarmSize());
        user.setSoilType(normalize(req.getSoilType()));
        user.setAvatarColor(normalize(req.getAvatarColor()) == null ? "#2ecc71" : req.getAvatarColor());
        user.setAvatarImage(avatarImage);
        user.setBio(normalize(req.getBio()));
        userRepository.save(user);

        return ResponseEntity.ok(toResponse(user));
    }

    private ProfileDto.Response toResponse(User u) {
        return new ProfileDto.Response(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole().name(),
                u.getLocation(),
                u.getFarmSize(),
                u.getSoilType(),
                u.getAvatarColor() == null || u.getAvatarColor().isBlank() ? "#2ecc71" : u.getAvatarColor(),
                u.getAvatarImage(),
                u.getBio()
        );
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
