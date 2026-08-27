package com.paddyai.dto;
import jakarta.validation.constraints.*;
public class AuthDto {
    public static class RegisterRequest {
        @NotBlank @Size(min=2,max=100) private String name;
        @Email @NotBlank private String email;
        @NotBlank @Size(min=6) private String password;
        public String getName(){return name;} public String getEmail(){return email;} public String getPassword(){return password;}
        public void setName(String v){this.name=v;} public void setEmail(String v){this.email=v;} public void setPassword(String v){this.password=v;}
    }
    public static class LoginRequest {
        @Email @NotBlank private String email; @NotBlank private String password;
        public String getEmail(){return email;} public String getPassword(){return password;}
        public void setEmail(String v){this.email=v;} public void setPassword(String v){this.password=v;}
    }
    public static class AuthResponse {
        private final String token,name,email,role;
        public AuthResponse(String t,String n,String e,String r){token=t;name=n;email=e;role=r;}
        public String getToken(){return token;} public String getName(){return name;}
        public String getEmail(){return email;} public String getRole(){return role;}
    }
}
