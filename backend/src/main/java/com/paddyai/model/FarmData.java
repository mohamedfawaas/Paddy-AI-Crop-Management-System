package com.paddyai.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="farm_data")
public class FarmData {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id") private User user;
    @Column(name="farm_name",length=100) private String farmName;
    private String location; @Column(name="soil_type",length=50) private String soilType;
    private Double temperature,rainfall,ph,humidity;
    @Column(name="area_hectares") private Double areaHectares;
    @Column(name="recorded_at") private LocalDateTime recordedAt=LocalDateTime.now();
    public FarmData(){}
    public Long getId(){return id;} public User getUser(){return user;} public String getFarmName(){return farmName;}
    public String getLocation(){return location;} public String getSoilType(){return soilType;}
    public Double getTemperature(){return temperature;} public Double getRainfall(){return rainfall;}
    public Double getPh(){return ph;} public Double getHumidity(){return humidity;}
    public Double getAreaHectares(){return areaHectares;} public LocalDateTime getRecordedAt(){return recordedAt;}
    public void setId(Long v){this.id=v;} public void setUser(User v){this.user=v;} public void setFarmName(String v){this.farmName=v;}
    public void setLocation(String v){this.location=v;} public void setSoilType(String v){this.soilType=v;}
    public void setTemperature(Double v){this.temperature=v;} public void setRainfall(Double v){this.rainfall=v;}
    public void setPh(Double v){this.ph=v;} public void setHumidity(Double v){this.humidity=v;}
    public void setAreaHectares(Double v){this.areaHectares=v;} public void setRecordedAt(LocalDateTime v){this.recordedAt=v;}
}
