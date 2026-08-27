package com.paddyai.config;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import java.security.Key; import java.util.Date;
@Component
public class JwtUtil {
    @Value("${app.jwt.secret}") private String secret;
    @Value("${app.jwt.expiration-ms}") private long expirationMs;
    private Key getKey(){return Keys.hmacShaKeyFor(secret.getBytes());}
    public String generateToken(String email){
        return Jwts.builder().setSubject(email).setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis()+expirationMs))
                .signWith(getKey(),SignatureAlgorithm.HS256).compact();
    }
    public String extractEmail(String token){
        return Jwts.parserBuilder().setSigningKey(getKey()).build().parseClaimsJws(token).getBody().getSubject();
    }
    public boolean validateToken(String token,UserDetails ud){
        try{String e=extractEmail(token);
            Date exp=Jwts.parserBuilder().setSigningKey(getKey()).build().parseClaimsJws(token).getBody().getExpiration();
            return e.equals(ud.getUsername())&&exp.after(new Date());
        }catch(JwtException e){return false;}
    }
}
