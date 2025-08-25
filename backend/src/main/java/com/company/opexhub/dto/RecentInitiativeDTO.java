package com.company.opexhub.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RecentInitiativeDTO {
    private Long id;
    private String title;
    private String initiativeNumber;
    private String site;
    private String status;
    private String priority;
    private BigDecimal expectedSavings;
    private Integer progressPercentage;
    private Integer currentStage;
    private LocalDateTime createdAt;
    
    // Constructors
    public RecentInitiativeDTO() {}
    
    public RecentInitiativeDTO(Long id, String title, String initiativeNumber, String site, 
                             String status, String priority, BigDecimal expectedSavings, 
                             Integer progressPercentage, Integer currentStage, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.initiativeNumber = initiativeNumber;
        this.site = site;
        this.status = status;
        this.priority = priority;
        this.expectedSavings = expectedSavings;
        this.progressPercentage = progressPercentage;
        this.currentStage = currentStage;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getInitiativeNumber() { return initiativeNumber; }
    public void setInitiativeNumber(String initiativeNumber) { this.initiativeNumber = initiativeNumber; }
    
    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    
    public BigDecimal getExpectedSavings() { return expectedSavings; }
    public void setExpectedSavings(BigDecimal expectedSavings) { this.expectedSavings = expectedSavings; }
    
    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }
    
    public Integer getCurrentStage() { return currentStage; }
    public void setCurrentStage(Integer currentStage) { this.currentStage = currentStage; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}