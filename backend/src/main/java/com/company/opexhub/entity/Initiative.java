package com.company.opexhub.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "initiatives")
public class Initiative {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank
    @Size(max = 20)
    private String status;

    @NotBlank
    @Size(max = 20)
    private String priority;

    @Column(name = "expected_savings", precision = 15, scale = 2)
    private BigDecimal expectedSavings;

    @Column(name = "actual_savings", precision = 15, scale = 2)
    private BigDecimal actualSavings;

    @NotBlank
    @Size(max = 10)
    private String site;

    @NotBlank
    @Size(max = 50)
    private String discipline;

    @Column(name = "initiative_number", unique = true)
    @Size(max = 50)
    private String initiativeNumber;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "progress_percentage")
    private Integer progressPercentage = 0;

    @Column(name = "current_stage")
    private Integer currentStage = 1;

    @Column(name = "requires_moc")
    private Boolean requiresMoc = false;

    @Column(name = "requires_capex")
    private Boolean requiresCapex = false;

    @Column(name = "moc_number")
    private String mocNumber;

    @Column(name = "capex_number")
    private String capexNumber;

    // New fields for assumptions
    @Column(name = "assumption_1", columnDefinition = "TEXT")
    private String assumption1;

    @Column(name = "assumption_2", columnDefinition = "TEXT")
    private String assumption2;

    @Column(name = "assumption_3", columnDefinition = "TEXT")
    private String assumption3;

    // New fields for additional form data
    @Column(name = "baseline_data", columnDefinition = "TEXT")
    private String baselineData;

    @Column(name = "target_outcome")
    private String targetOutcome;

    @Column(name = "target_value", precision = 15, scale = 2)
    private BigDecimal targetValue;

    @Column(name = "confidence_level")
    private Integer confidenceLevel;

    @Column(name = "estimated_capex", precision = 15, scale = 2)
    private BigDecimal estimatedCapex;

    @Column(name = "budget_type")
    private String budgetType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnore
    private User createdBy;

    @NotBlank
    @Size(max = 100)
    @Column(name = "initiator_name")
    private String initiatorName;

    @OneToMany(mappedBy = "initiative", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("initiative-timelineTasks")
    private Set<TimelineTask> timelineTasks = new HashSet<>();

    @OneToMany(mappedBy = "initiative", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("initiative-comments")
    private Set<Comment> comments = new HashSet<>();

    // WorkflowStage is now a master table, no direct relationship to Initiative
    // Workflow progress is tracked via WorkflowTransaction entity

    // Constructors
    public Initiative() {}

    public Initiative(String title, String description, String priority, BigDecimal expectedSavings, 
                     String site, String discipline, LocalDate startDate, LocalDate endDate, 
                     User createdBy, String initiatorName) {
        this.title = title;
        this.description = description;
        this.status = "Pending";
        this.priority = priority;
        this.expectedSavings = expectedSavings;
        this.site = site;
        this.discipline = discipline;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdBy = createdBy;
        this.initiatorName = initiatorName;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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

    public String getInitiativeNumber() { return initiativeNumber; }
    public void setInitiativeNumber(String initiativeNumber) { this.initiativeNumber = initiativeNumber; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

    public Integer getCurrentStage() { return currentStage; }
    public void setCurrentStage(Integer currentStage) { this.currentStage = currentStage; }

    public Boolean getRequiresMoc() { return requiresMoc; }
    public void setRequiresMoc(Boolean requiresMoc) { this.requiresMoc = requiresMoc; }

    public Boolean getRequiresCapex() { return requiresCapex; }
    public void setRequiresCapex(Boolean requiresCapex) { this.requiresCapex = requiresCapex; }

    public String getMocNumber() { return mocNumber; }
    public void setMocNumber(String mocNumber) { this.mocNumber = mocNumber; }

    public String getCapexNumber() { return capexNumber; }
    public void setCapexNumber(String capexNumber) { this.capexNumber = capexNumber; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public Set<TimelineTask> getTimelineTasks() { return timelineTasks; }
    public void setTimelineTasks(Set<TimelineTask> timelineTasks) { this.timelineTasks = timelineTasks; }

    public Set<Comment> getComments() { return comments; }
    public void setComments(Set<Comment> comments) { this.comments = comments; }

    public String getInitiatorName() { return initiatorName; }
    public void setInitiatorName(String initiatorName) { this.initiatorName = initiatorName; }
}