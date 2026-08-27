package com.paddyai.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="predictions")
public class Prediction {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="user_id",nullable=false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password","predictions"})
    private User user;
    @Column(nullable=false,length=50) private String type;
    @Column(name="input_data",columnDefinition="TEXT") private String inputData;
    @Column(columnDefinition="TEXT") private String result;
    @Column(nullable=false) private String status;
    @Column(name="image_data",columnDefinition="LONGTEXT") private String imageData;     // base64 uploaded leaf photo (DISEASE only)
    @Column(name="heatmap_data",columnDefinition="LONGTEXT") private String heatmapData; // base64 Grad-CAM overlay (DISEASE only)
    @Column(length=20) private String feedback;                                          // ACCURATE / INACCURATE / null
    @Column(name="created_at",updatable=false) private LocalDateTime createdAt=LocalDateTime.now();

    public Prediction(){}
    public Long getId(){return id;}
    public User getUser(){return user;}
    public String getType(){return type;}
    public String getInputData(){return inputData;}
    public String getResult(){return result;}
    public String getStatus(){return status;}
    public String getImageData(){return imageData;}
    public String getHeatmapData(){return heatmapData;}
    public String getFeedback(){return feedback;}
    public LocalDateTime getCreatedAt(){return createdAt;}
    public void setId(Long v){this.id=v;}
    public void setUser(User v){this.user=v;}
    public void setType(String v){this.type=v;}
    public void setInputData(String v){this.inputData=v;}
    public void setResult(String v){this.result=v;}
    public void setStatus(String v){this.status=v;}
    public void setImageData(String v){this.imageData=v;}
    public void setHeatmapData(String v){this.heatmapData=v;}
    public void setFeedback(String v){this.feedback=v;}
    public void setCreatedAt(LocalDateTime v){this.createdAt=v;}
    public static Builder builder(){return new Builder();}
    public static class Builder{
        private User user; private String type,inputData,result,status,imageData,heatmapData;
        public Builder user(User v){this.user=v;return this;}
        public Builder type(String v){this.type=v;return this;}
        public Builder inputData(String v){this.inputData=v;return this;}
        public Builder result(String v){this.result=v;return this;}
        public Builder status(String v){this.status=v;return this;}
        public Builder imageData(String v){this.imageData=v;return this;}
        public Builder heatmapData(String v){this.heatmapData=v;return this;}
        public Prediction build(){
            Prediction p=new Prediction();
            p.user=user;p.type=type;p.inputData=inputData;p.result=result;p.status=status;
            p.imageData=imageData;p.heatmapData=heatmapData;
            return p;
        }
    }
}
