package com.paddyai.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;
@Entity @Table(name="users")
public class User {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=100) private String name;
    @Column(nullable=false,unique=true,length=100) private String email;
    @Column(nullable=false) private String password;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Role role=Role.FARMER;
    @Column(name="created_at",updatable=false) private LocalDateTime createdAt=LocalDateTime.now();
    @Column(name="reset_token",length=100) private String resetToken;
    @Column(name="reset_token_expiry") private LocalDateTime resetTokenExpiry;
    @Column(length=150) private String location;
    @Column(name="farm_size",precision=10,scale=2) private BigDecimal farmSize;
    @Column(name="soil_type",length=50) private String soilType;
    @Column(name="avatar_color",length=20) private String avatarColor="#2ecc71";
    @Lob @Column(name="avatar_image",columnDefinition="LONGTEXT") private String avatarImage;
    @Column(length=500) private String bio;
    public enum Role{FARMER,ADMIN}
    public User(){}
    public Long getId(){return id;} public String getName(){return name;} public String getEmail(){return email;}
    public String getPassword(){return password;} public Role getRole(){return role;} public LocalDateTime getCreatedAt(){return createdAt;}
    public String getResetToken(){return resetToken;} public LocalDateTime getResetTokenExpiry(){return resetTokenExpiry;}
    public String getLocation(){return location;} public BigDecimal getFarmSize(){return farmSize;} public String getSoilType(){return soilType;}
    public String getAvatarColor(){return avatarColor;} public String getAvatarImage(){return avatarImage;} public String getBio(){return bio;}
    public void setId(Long v){this.id=v;} public void setName(String v){this.name=v;} public void setEmail(String v){this.email=v;}
    public void setPassword(String v){this.password=v;} public void setRole(Role v){this.role=v;} public void setCreatedAt(LocalDateTime v){this.createdAt=v;}
    public void setResetToken(String v){this.resetToken=v;} public void setResetTokenExpiry(LocalDateTime v){this.resetTokenExpiry=v;}
    public void setLocation(String v){this.location=v;} public void setFarmSize(BigDecimal v){this.farmSize=v;} public void setSoilType(String v){this.soilType=v;}
    public void setAvatarColor(String v){this.avatarColor=v;} public void setAvatarImage(String v){this.avatarImage=v;} public void setBio(String v){this.bio=v;}
    public static Builder builder(){return new Builder();}
    public static class Builder{
        private String name,email,password; private Role role=Role.FARMER;
        public Builder name(String v){this.name=v;return this;} public Builder email(String v){this.email=v;return this;}
        public Builder password(String v){this.password=v;return this;} public Builder role(Role v){this.role=v;return this;}
        public User build(){User u=new User();u.name=name;u.email=email;u.password=password;u.role=role;return u;}
    }
}
