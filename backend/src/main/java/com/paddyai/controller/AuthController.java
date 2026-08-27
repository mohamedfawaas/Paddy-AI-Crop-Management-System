package com.paddyai.controller;

import com.paddyai.config.JwtUtil;
import com.paddyai.dto.AuthDto;
import com.paddyai.model.User;
import com.paddyai.repository.UserRepository;
import com.paddyai.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtUtil               jwtUtil;
    private final AuthenticationManager authManager;
    private final EmailService          emailService;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          AuthenticationManager authManager,
                          EmailService emailService) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil         = jwtUtil;
        this.authManager     = authManager;
        this.emailService    = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthDto.RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered."));
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .build();
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthDto.AuthResponse(
                        token, user.getName(), user.getEmail(), user.getRole().name()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDto.LoginRequest req) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password."));
        }
        Optional<User> found = userRepository.findByEmail(req.getEmail());
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found."));
        }
        User user = found.get();
        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthDto.AuthResponse(
                token, user.getName(), user.getEmail(), user.getRole().name()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        Optional<User> found = email != null ? userRepository.findByEmail(email) : Optional.empty();

        // Always return the same generic message whether or not the email exists —
        // this prevents leaking which emails are registered to an attacker.
        String genericMsg = "If an account exists for that email, a reset link has been sent.";

        if (found.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", genericMsg));
        }

        User user = found.get();
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(user);

        String resetLink = frontendBaseUrl + "/reset-password?token=" + token;
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);
        } catch (Exception e) {
            // Email failed to send (e.g. SMTP not configured yet) — still don't leak
            // this to the client for security reasons, but surface it clearly server-side.
            return ResponseEntity.ok(Map.of("message", genericMsg,
                    "warning", "Email delivery failed — check server logs and SMTP config."));
        }
        return ResponseEntity.ok(Map.of("message", genericMsg));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        if (token == null || token.isBlank() || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid request. Password must be at least 6 characters."));
        }

        Optional<User> found = userRepository.findByResetToken(token);
        if (found.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired reset link. Please request a new one."));
        }

        User user = found.get();
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This reset link has expired. Please request a new one."));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now sign in."));
    }
}
