package com.paddyai.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="notifications")
public class Notification {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="user_id",nullable=false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password"})
    private User user;
    @Column(nullable=false,length=40) private String type; // IRRIGATION_REMINDER, DISEASE_ALERT, PEST_WARNING, WEATHER_ALERT, FERTILIZER_REMINDER, HARVEST_REMINDER
    @Column(nullable=false,length=150) private String title;
    @Column(nullable=false,length=500) private String message;
    @Column(name="related_prediction_id") private Long relatedPredictionId;
    @Column(name="is_read",nullable=false) private boolean isRead=false;
    @Column(name="created_at",updatable=false) private LocalDateTime createdAt=LocalDateTime.now();

    public Notification(){}
    public Long getId(){return id;}
    public User getUser(){return user;}
    public String getType(){return type;}
    public String getTitle(){return title;}
    public String getMessage(){return message;}
    public Long getRelatedPredictionId(){return relatedPredictionId;}
    public boolean isRead(){return isRead;}
    public LocalDateTime getCreatedAt(){return createdAt;}
    public void setId(Long v){this.id=v;}
    public void setUser(User v){this.user=v;}
    public void setType(String v){this.type=v;}
    public void setTitle(String v){this.title=v;}
    public void setMessage(String v){this.message=v;}
    public void setRelatedPredictionId(Long v){this.relatedPredictionId=v;}
    public void setRead(boolean v){this.isRead=v;}
    public void setCreatedAt(LocalDateTime v){this.createdAt=v;}
}
