package com.paddyai.service;

import com.paddyai.model.Notification;
import com.paddyai.model.User;
import com.paddyai.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepo;

    public NotificationService(NotificationRepository notificationRepo) {
        this.notificationRepo = notificationRepo;
    }

    private static final Map<String, String> TITLES = Map.of(
        "IRRIGATION_REMINDER", "Irrigation Reminder",
        "DISEASE_ALERT",       "Disease Alert",
        "PEST_WARNING",        "Pest Warning",
        "WEATHER_ALERT",       "Weather Alert",
        "FERTILIZER_REMINDER", "Fertilizer Reminder",
        "HARVEST_REMINDER",    "Harvest Reminder"
    );

    private void create(User user, String type, String message, Long relatedPredictionId) {
        try {
            Notification n = new Notification();
            n.setUser(user);
            n.setType(type);
            n.setTitle(TITLES.getOrDefault(type, "Notification"));
            n.setMessage(message);
            n.setRelatedPredictionId(relatedPredictionId);
            notificationRepo.save(n);
        } catch (Exception ignored) { /* notifications are best-effort, never break the main prediction flow */ }
    }

    /** Inspects a prediction's result and creates the right notification, if warranted. Safe to call for any type. */
    public void notifyFromPrediction(User user, String predictionType, Map<String, Object> result, Long predictionId) {
        try {
            switch (predictionType) {
                case "IRRIGATION" -> {
                    if (Boolean.TRUE.equals(result.get("irrigation_needed"))) {
                        String urgency = String.valueOf(result.getOrDefault("urgency", ""));
                        create(user, "IRRIGATION_REMINDER",
                                "💧 Irrigation needed" + (urgency.isBlank() ? "" : " — urgency: " + urgency), predictionId);
                    }
                }
                case "DISEASE" -> {
                    String disease = String.valueOf(result.getOrDefault("disease_name", ""));
                    if (!disease.isBlank() && !disease.toLowerCase().contains("healthy")) {
                        String severity = String.valueOf(result.getOrDefault("severity", ""));
                        create(user, "DISEASE_ALERT",
                                "🔬 " + disease + " detected" + (severity.isBlank() ? "" : " (" + severity + " severity)"), predictionId);
                    }
                }
                case "PEST" -> {
                    String risk = String.valueOf(result.getOrDefault("risk_level", ""));
                    if ("High".equalsIgnoreCase(risk)) {
                        String pest = String.valueOf(result.getOrDefault("likely_pest", "pest"));
                        create(user, "PEST_WARNING", "🐛 High pest risk — likely: " + pest, predictionId);
                    }
                }
                case "WEATHER" -> {
                    Object alertsObj = result.get("alerts");
                    if (alertsObj instanceof List<?> alerts) {
                        for (Object a : alerts) {
                            String alert = String.valueOf(a);
                            if (!alert.startsWith("✅")) {
                                create(user, "WEATHER_ALERT", alert, predictionId);
                            }
                        }
                    }
                }
                case "YIELD" -> {
                    Object daysObj = result.get("expected_harvest_days");
                    if (daysObj != null) {
                        try {
                            int days = Integer.parseInt(String.valueOf(daysObj));
                            if (days <= 14) {
                                create(user, "HARVEST_REMINDER", "🌾 Estimated harvest in " + days + " days — plan logistics ahead", predictionId);
                            }
                        } catch (NumberFormatException ignored) {}
                    }
                }
                default -> { /* no auto-notification for this type */ }
            }
        } catch (Exception ignored) { /* never let notification logic break the prediction response */ }
    }
}
