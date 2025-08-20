package com.company.opexhub.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class InitiativeResponse {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private BigDecimal expectedSavings;
    private BigDecimal actualSavings;
    private String site;
    private String discipline;
    private String category;
    private String initiativeNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer progressPercentage;
    private Integer currentStage;
    private String currentStageName; // New field for current stage name
    private Boolean requiresMoc;
    private Boolean requiresCapex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByName;
    private String createdByEmail;

    // New fields for assumptions and additional form data
    private String assumption1;
    private String assumption2;
    private String assumption3;
    private String baselineData;
    private String targetOutcome;
    private BigDecimal targetValue;
    private Integer confidenceLevel;
    private BigDecimal estimatedCapex;
    private String budgetType;
    private String initiatorName;

    // Constructors
    public InitiativeResponse() {}

    // Static method to get stage name by stage number
    public static String getStageName(Integer stageNumber) {
        if (stageNumber == null) return "Register Initiative";
        
        switch (stageNumber) {
            case 1: return "Register Initiative";
            case 2: return "Approval";
            case 3: return "Define Responsibilities";
            case 4: return "MOC Stage";
            case 5: return "CAPEX Stage";
            case 6: return "Initiative Timeline Tracker";
            case 7: return "Trial Implementation & Performance Check";
            case 8: return "Periodic Status Review with CMO";
            case 9: return "Savings Monitoring (1 Month)";
            case 10: return "Saving Validation with F&A";
            case 11: return "Initiative Closure";
            default: return "Register Initiative";
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public BigDecimal getExpectedSavings() { return expectedSavings; }
    public void setExpectedSavings(BigDecimal expectedSavings) { this.expectedSavings = expectedSavings; }

    public BigDecimal getActualSavings() { return actualSavings; }
    public void setActualSavings(BigDecimal actualSavings) { this.actualSavings = actualSavings; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getDiscipline() { return discipline; }
    public void setDiscipline(String discipline) { this.discipline = discipline; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getInitiativeNumber() { return initiativeNumber; }
    public void setInitiativeNumber(String initiativeNumber) { this.initiativeNumber = initiativeNumber; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

    public Integer getCurrentStage() { return currentStage; }
    public void setCurrentStage(Integer currentStage) { 
        this.currentStage = currentStage; 
        this.currentStageName = getStageName(currentStage); // Auto-set stage name
    }

    public String getCurrentStageName() { return currentStageName; }
    public void setCurrentStageName(String currentStageName) { this.currentStageName = currentStageName; }

    public Boolean getRequiresMoc() { return requiresMoc; }
    public void setRequiresMoc(Boolean requiresMoc) { this.requiresMoc = requiresMoc; }

    public Boolean getRequiresCapex() { return requiresCapex; }
    public void setRequiresCapex(Boolean requiresCapex) { this.requiresCapex = requiresCapex; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public String getCreatedByEmail() { return createdByEmail; }
    public void setCreatedByEmail(String createdByEmail) { this.createdByEmail = createdByEmail; }

    // New getters and setters for assumptions
    public String getAssumption1() { return assumption1; }
    public void setAssumption1(String assumption1) { this.assumption1 = assumption1; }

    public String getAssumption2() { return assumption2; }
    public void setAssumption2(String assumption2) { this.assumption2 = assumption2; }

    public String getAssumption3() { return assumption3; }
    public void setAssumption3(String assumption3) { this.assumption3 = assumption3; }

    // New getters and setters for additional form data
    public String getBaselineData() { return baselineData; }
    public void setBaselineData(String baselineData) { this.baselineData = baselineData; }

    public String getTargetOutcome() { return targetOutcome; }
    public void setTargetOutcome(String targetOutcome) { this.targetOutcome = targetOutcome; }

    public BigDecimal getTargetValue() { return targetValue; }
    public void setTargetValue(BigDecimal targetValue) { this.targetValue = targetValue; }

    public Integer getConfidenceLevel() { return confidenceLevel; }
    public void setConfidenceLevel(Integer confidenceLevel) { this.confidenceLevel = confidenceLevel; }

    public BigDecimal getEstimatedCapex() { return estimatedCapex; }
    public void setEstimatedCapex(BigDecimal estimatedCapex) { this.estimatedCapex = estimatedCapex; }

    public String getBudgetType() { return budgetType; }
    public void setBudgetType(String budgetType) { this.budgetType = budgetType; }

    public String getInitiatorName() { return initiatorName; }
    public void setInitiatorName(String initiatorName) { this.initiatorName = initiatorName; }
}