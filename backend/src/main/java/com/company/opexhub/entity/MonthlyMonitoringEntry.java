package com.company.opexhub.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "monthly_monitoring_entries")
public class MonthlyMonitoringEntry {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiative_id", nullable = false)
    @JsonIgnore
    private Initiative initiative;
    
    @Column(nullable = false)
    private YearMonth monitoringMonth;
    
    @Column(nullable = false)
    private String kpiDescription;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal targetValue;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal achievedValue;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal deviation;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;
    
    @Column(name = "category")
    private String category = "General";
    
    @Column(name = "deviation_percentage", precision = 5, scale = 2)
    private BigDecimal deviationPercentage;
    
    @Column(nullable = false)
    private Boolean isFinalized = false;
    
    @Column(nullable = false)
    private Boolean faApproval = false;
    
    @Column(columnDefinition = "TEXT")
    private String faComments;
    
    @Column(nullable = false)
    private String enteredBy; // User role who entered the data
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    public MonthlyMonitoringEntry() {}
    
    public MonthlyMonitoringEntry(Initiative initiative, YearMonth monitoringMonth, 
                                 String kpiDescription, BigDecimal targetValue, String enteredBy) {
        this.initiative = initiative;
        this.monitoringMonth = monitoringMonth;
        this.kpiDescription = kpiDescription;
        this.targetValue = targetValue;
        this.enteredBy = enteredBy;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateDeviation();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateDeviation();
    }
    
    private void calculateDeviation() {
        if (targetValue != null && achievedValue != null) {
            deviation = achievedValue.subtract(targetValue);
            // Calculate deviation percentage
            if (targetValue.compareTo(BigDecimal.ZERO) != 0) {
                deviationPercentage = deviation.divide(targetValue, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            }
        }
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Initiative getInitiative() { return initiative; }
    public void setInitiative(Initiative initiative) { this.initiative = initiative; }
    
    public YearMonth getMonitoringMonth() { return monitoringMonth; }
    public void setMonitoringMonth(YearMonth monitoringMonth) { this.monitoringMonth = monitoringMonth; }
    
    public String getKpiDescription() { return kpiDescription; }
    public void setKpiDescription(String kpiDescription) { this.kpiDescription = kpiDescription; }
    
    public BigDecimal getTargetValue() { return targetValue; }
    public void setTargetValue(BigDecimal targetValue) { 
        this.targetValue = targetValue;
        calculateDeviation();
    }
    
    public BigDecimal getAchievedValue() { return achievedValue; }
    public void setAchievedValue(BigDecimal achievedValue) { 
        this.achievedValue = achievedValue;
        calculateDeviation();
    }
    
    public BigDecimal getDeviation() { return deviation; }
    public void setDeviation(BigDecimal deviation) { this.deviation = deviation; }
    
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    
    public Boolean getIsFinalized() { return isFinalized; }
    public void setIsFinalized(Boolean isFinalized) { this.isFinalized = isFinalized; }
    
    public Boolean getFaApproval() { return faApproval; }
    public void setFaApproval(Boolean faApproval) { this.faApproval = faApproval; }
    
    public String getFaComments() { return faComments; }
    public void setFaComments(String faComments) { this.faComments = faComments; }
    
    public String getEnteredBy() { return enteredBy; }
    public void setEnteredBy(String enteredBy) { this.enteredBy = enteredBy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public BigDecimal getDeviationPercentage() { return deviationPercentage; }
    public void setDeviationPercentage(BigDecimal deviationPercentage) { this.deviationPercentage = deviationPercentage; }
}