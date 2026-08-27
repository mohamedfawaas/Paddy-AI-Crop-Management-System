package com.paddyai.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class ProfileDto {

    public static class UpdateRequest {
        @Size(max = 150)
        private String location;

        @DecimalMin(value = "0.0", inclusive = true)
        private BigDecimal farmSize;

        @Size(max = 50)
        private String soilType;

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Avatar color must be a 6-digit hex color.")
        private String avatarColor;

        // Frontend compresses profile photos to a small JPEG data URL before upload.
        // Keeping a hard cap here prevents unexpectedly large database/request payloads.
        @Size(max = 2_000_000, message = "Profile image is too large.")
        private String avatarImage;

        @Size(max = 500)
        private String bio;

        public String getLocation() { return location; }
        public BigDecimal getFarmSize() { return farmSize; }
        public String getSoilType() { return soilType; }
        public String getAvatarColor() { return avatarColor; }
        public String getAvatarImage() { return avatarImage; }
        public String getBio() { return bio; }

        public void setLocation(String v) { this.location = v; }
        public void setFarmSize(BigDecimal v) { this.farmSize = v; }
        public void setSoilType(String v) { this.soilType = v; }
        public void setAvatarColor(String v) { this.avatarColor = v; }
        public void setAvatarImage(String v) { this.avatarImage = v; }
        public void setBio(String v) { this.bio = v; }
    }

    public static class Response {
        private final Long id;
        private final String name;
        private final String email;
        private final String role;
        private final String location;
        private final BigDecimal farmSize;
        private final String soilType;
        private final String avatarColor;
        private final String avatarImage;
        private final String bio;

        public Response(Long id,
                        String name,
                        String email,
                        String role,
                        String location,
                        BigDecimal farmSize,
                        String soilType,
                        String avatarColor,
                        String avatarImage,
                        String bio) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.role = role;
            this.location = location;
            this.farmSize = farmSize;
            this.soilType = soilType;
            this.avatarColor = avatarColor;
            this.avatarImage = avatarImage;
            this.bio = bio;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public String getLocation() { return location; }
        public BigDecimal getFarmSize() { return farmSize; }
        public String getSoilType() { return soilType; }
        public String getAvatarColor() { return avatarColor; }
        public String getAvatarImage() { return avatarImage; }
        public String getBio() { return bio; }
    }
}
