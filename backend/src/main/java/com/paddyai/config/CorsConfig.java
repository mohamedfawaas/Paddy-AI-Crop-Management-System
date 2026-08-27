package com.paddyai.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import java.util.Arrays; import java.util.List;
@Configuration
public class CorsConfig {
    @Bean public CorsFilter corsFilter(){
        CorsConfiguration c=new CorsConfiguration();
        c.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173","http://localhost:5174","http://localhost:5175",
            "http://127.0.0.1:5173","http://127.0.0.1:5174","http://localhost:3000"));
        c.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","OPTIONS","PATCH"));
        c.setAllowedHeaders(List.of("*")); c.setAllowCredentials(true); c.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource s=new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**",c); return new CorsFilter(s);
    }
}
