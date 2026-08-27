package com.paddyai.config;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
@Configuration
public class AppConfig {
    @Bean public RestTemplate restTemplate(){
        SimpleClientHttpRequestFactory f=new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(5000); f.setReadTimeout(30000);
        return new RestTemplate(f);
    }
    @Bean public ObjectMapper objectMapper(){
        // IMPORTANT: this bean is used by Spring MVC for ALL JSON responses.
        // Without JavaTimeModule, any entity containing a java.time.LocalDateTime
        // field (Farm, FarmActivity, Notification, Prediction, User, ...) throws
        // InvalidDefinitionException when serialized ("Java 8 date/time type
        // `java.time.LocalDateTime` not supported by default").
        ObjectMapper m = new ObjectMapper();
        m.registerModule(new JavaTimeModule());
        m.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // write as readable ISO-8601 strings
        return m;
    }
}
