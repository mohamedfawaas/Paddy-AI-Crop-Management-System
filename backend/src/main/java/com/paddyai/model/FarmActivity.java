package com.paddyai.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="farm_activities")
public class FarmActivity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="farm_id",nullable=false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","user"})
    private Farm farm;
    @Column(name="activity_type",nullable=false,length=50) private String activityType; // FERTILIZER, IRRIGATION, PEST_CONTROL, HARVEST, PLANTING, OTHER
    @Column(columnDefinition="TEXT") private String description;
    @Column(name="activity_date") private String activityDate; // ISO string (yyyy-MM-dd)
    @Column(name="created_at",updatable=false) private LocalDateTime createdAt=LocalDateTime.now();

    public FarmActivity(){}
    public Long getId(){return id;}
    public Farm getFarm(){return farm;}
    public String getActivityType(){return activityType;}
    public String getDescription(){return description;}
    public String getActivityDate(){return activityDate;}
    public LocalDateTime getCreatedAt(){return createdAt;}
    public void setId(Long v){this.id=v;}
    public void setFarm(Farm v){this.farm=v;}
    public void setActivityType(String v){this.activityType=v;}
    public void setDescription(String v){this.description=v;}
    public void setActivityDate(String v){this.activityDate=v;}
    public void setCreatedAt(LocalDateTime v){this.createdAt=v;}
}
