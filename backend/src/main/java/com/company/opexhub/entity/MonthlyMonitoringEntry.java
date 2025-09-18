package com.company.opexhub.entity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ForeignKey;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "OPEX_MONTHLY_MON_ENTRIES")
public class MonthlyMonitoringEntry {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "monthly_monitoring_seq")
    @SequenceGenerator(name = "monthly_monitoring_seq", sequenceName = "OPEX_MONTHLY_MON_SEQ", allocationSize = 1, initialValue = 1)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiative_id", nullable = false, 
                foreignKey = @ForeignKey(name = "FK_MON_ENTRY_INITIATIVE"))
    @JsonIgnore
    private Initiative initiative;
    
    @Column(name = "monitoring_month", nullable = false, length = 7)
    private String monitoringMonth; // Changed from YearMonth to String (YYYY-MM format)
    
    @Column(name = "kpi_description", nullable = false)
    private String kpiDescription;
    
    @Column(name = "target_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal targetValue;
    
    @Column(name = "achieved_value", precision = 15, scale = 2)
    private BigDecimal achievedValue;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal deviation;
    
    @Column(columnDefinition = "CLOB")
    private String remarks;
    
    @Column(name = "category")
    private String category = "General";
    
    @Column(name = "deviation_percentage", precision = 5, scale = 2)
    private BigDecimal deviationPercentage;
    
    @Column(name = "is_finalized", nullable = false, length = 1)
    private String isFinalized = "N";
    
    @Column(name = "fa_approval", nullable = false, length = 1)
    private String faApproval = "N";
    
    @Column(name = "fa_remarks", columnDefinition = "CLOB")
    private String faComments;
    
    @Column(name = "entered_by", nullable = false)
    private String enteredBy; // User role who entered the data
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    public MonthlyMonitoringEntry() {
        this.category = "General";
        this.isFinalized = "N";
        this.faApproval = "N";
    }
    
    public MonthlyMonitoringEntry(Initiative initiative, String monitoringMonth, 
                                 String kpiDescription, BigDecimal targetValue, String enteredBy) {
        this();  // Call default constructor first
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
        normalizeMonitoringMonth(); // Ensure proper format before saving
        calculateDeviation();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        normalizeMonitoringMonth(); // Ensure proper format before updating
        calculateDeviation();
    }
    
    private void calculateDeviation() {
        if (targetValue != null && achievedValue != null) {
            deviation = achievedValue.subtract(targetValue);
            // Calculate deviation percentage
            if (targetValue.compareTo(BigDecimal.ZERO) != 0) {
                deviationPercentage = deviation.divide(targetValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            }
        }
    }
    
    // Validation helper methods
    public boolean isValidMonitoringMonth() {
        if (monitoringMonth == null) return false;
        // Match both YYYY-MM and YYYY-M formats to be more flexible
        return monitoringMonth.matches("\\d{4}-(0[1-9]|1[0-2])");
    }
    
    public boolean isValidYNField(String value) {
        return "Y".equals(value) || "N".equals(value);
    }
    
    // Helper method to ensure proper month format before persistence
    public void normalizeMonitoringMonth() {
        if (monitoringMonth != null && monitoringMonth.matches("\\d{4}-\\d{1,2}")) {
            String[] parts = monitoringMonth.split("-");
            if (parts.length == 2) {
                String year = parts[0];
                String month = parts[1];
                // Ensure month is zero-padded (e.g., "2024-1" becomes "2024-01")
                if (month.length() == 1) {
                    this.monitoringMonth = year + "-0" + month;
                }
            }
        }
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Initiative getInitiative() { return initiative; }
    public void setInitiative(Initiative initiative) { this.initiative = initiative; }
    
    public String getMonitoringMonth() { return monitoringMonth; }
    public void setMonitoringMonth(String monitoringMonth) { 
        this.monitoringMonth = monitoringMonth;
    }
    
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
    
    public String getIsFinalized() { return isFinalized; }
    public void setIsFinalized(String isFinalized) { 
        if (isValidYNField(isFinalized)) {
            this.isFinalized = isFinalized;
        } else {
            this.isFinalized = "N";
        }
    }
    
    public String getFaApproval() { return faApproval; }
    public void setFaApproval(String faApproval) { 
        if (isValidYNField(faApproval)) {
            this.faApproval = faApproval;
        } else {
            this.faApproval = "N";
        }
    }
    
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