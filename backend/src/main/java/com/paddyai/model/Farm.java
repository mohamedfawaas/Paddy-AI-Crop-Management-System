package com.paddyai.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="farms")
public class Farm {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="user_id",nullable=false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password"})
    private User user;
    @Column(nullable=false,length=150) private String name;
    @Column(length=200) private String location;
    @Column(name="size_acres") private Double sizeAcres;
    @Column(name="soil_type",length=50) private String soilType;
    @Column(name="current_crop_variety",length=100) private String currentCropVariety;
    @Column(name="planting_date") private String plantingDate; // stored as ISO string (yyyy-MM-dd)
    @Column(columnDefinition="TEXT") private String notes;
    @Column(name="created_at",updatable=false) private LocalDateTime createdAt=LocalDateTime.now();
    @Column(name="updated_at") private LocalDateTime updatedAt=LocalDateTime.now();

    public Farm(){}
    public Long getId(){return id;}
    public User getUser(){return user;}
    public String getName(){return name;}
    public String getLocation(){return location;}
    public Double getSizeAcres(){return sizeAcres;}
    public String getSoilType(){return soilType;}
    public String getCurrentCropVariety(){return currentCropVariety;}
    public String getPlantingDate(){return plantingDate;}
    public String getNotes(){return notes;}
    public LocalDateTime getCreatedAt(){return createdAt;}
    public LocalDateTime getUpdatedAt(){return updatedAt;}
    public void setId(Long v){this.id=v;}
    public void setUser(User v){this.user=v;}
    public void setName(String v){this.name=v;}
    public void setLocation(String v){this.location=v;}
    public void setSizeAcres(Double v){this.sizeAcres=v;}
    public void setSoilType(String v){this.soilType=v;}
    public void setCurrentCropVariety(String v){this.currentCropVariety=v;}
    public void setPlantingDate(String v){this.plantingDate=v;}
    public void setNotes(String v){this.notes=v;}
    public void setCreatedAt(LocalDateTime v){this.createdAt=v;}
    public void setUpdatedAt(LocalDateTime v){this.updatedAt=v;}
}
