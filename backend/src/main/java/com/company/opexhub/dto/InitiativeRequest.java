package com.company.opexhub.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class InitiativeRequest {
    @NotBlank
    @Size(max = 200)
    private String title;

    private String description;

    @NotBlank
    private String priority;

    @NotNull
    private BigDecimal expectedSavings;

    @NotBlank
    private String site;

    @NotBlank
    private String discipline;

    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean requiresMoc = false;
    private Boolean requiresCapex = false;

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

    @NotBlank
    @Size(max = 100)
    private String initiatorName;

    // Constructors
    public InitiativeRequest() {}

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public BigDecimal getExpectedSavings() { return expectedSavings; }
    public void setExpectedSavings(BigDecimal expectedSavings) { this.expectedSavings = expectedSavings; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getDiscipline() { return discipline; }
    public void setDiscipline(String discipline) { this.discipline = discipline; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Boolean getRequiresMoc() { return requiresMoc; }
    public void setRequiresMoc(Boolean requiresMoc) { this.requiresMoc = requiresMoc; }

    public Boolean getRequiresCapex() { return requiresCapex; }
    public void setRequiresCapex(Boolean requiresCapex) { this.requiresCapex = requiresCapex; }

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