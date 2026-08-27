package com.paddyai.config;
import com.paddyai.model.User;
import com.paddyai.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Optional;

@Configuration
public class SecurityConfig {
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    public SecurityConfig(UserRepository ur, JwtUtil j){ this.userRepository=ur; this.jwtUtil=j; }

    @Bean
    public UserDetailsService userDetailsService(){
        return email -> {
            Optional<User> f = userRepository.findByEmail(email);
            if (f.isEmpty()) throw new UsernameNotFoundException("Not found: "+email);
            User u = f.get();
            return org.springframework.security.core.userdetails.User
                .withUsername(u.getEmail())
                .password(u.getPassword())
                .roles(u.getRole().name())   // FARMER or ADMIN
                .build();
        };
    }

    @Bean public PasswordEncoder passwordEncoder(){ return new BCryptPasswordEncoder(); }
    @Bean public AuthenticationManager authenticationManager(AuthenticationConfiguration c) throws Exception{ return c.getAuthenticationManager(); }

    @Bean
    public OncePerRequestFilter jwtFilter(){
        return new OncePerRequestFilter(){
            @Override
            protected void doFilterInternal(@NonNull HttpServletRequest req,
                                            @NonNull HttpServletResponse res,
                                            @NonNull FilterChain chain) throws ServletException,IOException {
                String h = req.getHeader("Authorization");
                if (StringUtils.hasText(h) && h.startsWith("Bearer ")) {
                    try {
                        String email = jwtUtil.extractEmail(h.substring(7));
                        UserDetails ud = userDetailsService().loadUserByUsername(email);
                        if (jwtUtil.validateToken(h.substring(7), ud)) {
                            UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    } catch (Exception ignored){}
                }
                chain.doFilter(req, res);
            }
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"error\":\"Authentication required or token expired.\"}");
                })
                .accessDeniedHandler((req, res, ex) -> {
                    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"error\":\"Forbidden: ADMIN role required.\"}");
                })
            )
            .addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
