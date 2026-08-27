package com.paddyai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.Collections;
import java.util.Map;

@Service
public class MLClientService {

    private static final Logger log = LoggerFactory.getLogger(MLClientService.class);

    // FIX: TypeReference — zero raw Map<K,V> warnings
    private static final TypeReference<Map<String, Object>> MAP_TYPE =
            new TypeReference<Map<String, Object>>() {};

    @Value("${ml.api.base-url}")
    private String mlBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public MLClientService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> predictSuitability(Map<String, Object> payload) {
        String url = mlBaseUrl + "/predict/suitability";
        log.debug("ML suitability call: {}", url);
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<String> res = restTemplate.postForEntity(
                    url, new HttpEntity<>(payload, h), String.class);
            String body = res.getBody();
            return body != null ? objectMapper.readValue(body, MAP_TYPE) : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Suitability ML failed: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable. Start Python on port 8000.", e);
        }
    }

    public Map<String, Object> predictDisease(MultipartFile image) {
        String url = mlBaseUrl + "/predict/disease";
        log.debug("ML disease call: {}", url);
        try {
            final String fname = image.getOriginalFilename() != null
                    ? image.getOriginalFilename() : "image.jpg";
            ByteArrayResource resource = new ByteArrayResource(image.getBytes()) {
                @Override public String getFilename() { return fname; }
            };
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.MULTIPART_FORM_DATA);
            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("file", resource);
            ResponseEntity<String> res = restTemplate.postForEntity(
                    url, new HttpEntity<>(form, h), String.class);
            String body = res.getBody();
            return body != null ? objectMapper.readValue(body, MAP_TYPE) : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Disease ML failed: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable. Start Python on port 8000.", e);
        }
    }

    public Map<String, Object> predictIrrigation(Map<String, Object> payload) {
        String url = mlBaseUrl + "/predict/irrigation";
        log.debug("ML irrigation call: {}", url);
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<String> res = restTemplate.postForEntity(
                    url, new HttpEntity<>(payload, h), String.class);
            String body = res.getBody();
            return body != null ? objectMapper.readValue(body, MAP_TYPE) : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Irrigation ML failed: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable. Start Python on port 8000.", e);
        }
    }

    public Map<String, Object> predictFertilizer(Map<String, Object> payload) {
        String url = mlBaseUrl + "/predict/fertilizer";
        log.debug("ML fertilizer call: {}", url);
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<String> res = restTemplate.postForEntity(
                    url, new HttpEntity<>(payload, h), String.class);
            String body = res.getBody();
            return body != null ? objectMapper.readValue(body, MAP_TYPE) : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Fertilizer ML failed: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable. Start Python on port 8000.", e);
        }
    }

    public Map<String, Object> predictYield(Map<String, Object> payload) {
        String url = mlBaseUrl + "/predict/yield";
        log.debug("ML yield call: {}", url);
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<String> res = restTemplate.postForEntity(
                    url, new HttpEntity<>(payload, h), String.class);
            String body = res.getBody();
            return body != null ? objectMapper.readValue(body, MAP_TYPE) : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Yield ML failed: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable. Start Python on port 8000.", e);
        }
    }

    public Map<String, Object> predictPest(Map<String, Object> payload) {
        String url = mlBaseUrl + "/predict/pest";
        log.debug("ML pest call: {}", url);
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<String> res = restTemplate.postForEntity(
                    url, new HttpEntity<>(payload, h), String.class);
            String body = res.getBody();
            return body != null ? objectMapper.readValue(body, MAP_TYPE) : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Pest ML failed: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable. Start Python on port 8000.", e);
        }
    }

    public Map<String, Object> predictWeather(Map<String, Object> payload) {
        String url = mlBaseUrl + "/predict/weather-advisory";
        log.debug("ML weather call: {}", url);
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<String> res = restTemplate.postForEntity(
                    url, new HttpEntity<>(payload, h), String.class);
            String body = res.getBody();
            return body != null ? objectMapper.readValue(body, MAP_TYPE) : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Weather ML failed: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable. Start Python on port 8000.", e);
        }
    }
}
