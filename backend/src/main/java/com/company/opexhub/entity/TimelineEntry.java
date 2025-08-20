package com.company.opexhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "timeline_entries")
public class TimelineEntry {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiative_id", nullable = false)
    @JsonIgnore
    private Initiative initiative;
    
    @Column(nullable = false)
    private String stageName;
    
    @Column(nullable = false)
    private LocalDate plannedStartDate;
    
    @Column(nullable = false)
    private LocalDate plannedEndDate;
    
    private LocalDate actualStartDate;
    
    private LocalDate actualEndDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TimelineStatus status = TimelineStatus.PENDING;
    
    @Column(nullable = false)
    private String responsiblePerson;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;
    
    private String documentPath;
    
    @Column(nullable = false)
    private Boolean siteLeadApproval = false;
    
    @Column(nullable = false)
    private Boolean initiativeLeadApproval = false;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    public enum TimelineStatus {
        PENDING, IN_PROGRESS, COMPLETED
    }
    
    // Constructors
    public TimelineEntry() {}
    
    public TimelineEntry(Initiative initiative, String stageName, LocalDate plannedStartDate, 
                        LocalDate plannedEndDate, String responsiblePerson) {
        this.initiative = initiative;
        this.stageName = stageName;
        this.plannedStartDate = plannedStartDate;
        this.plannedEndDate = plannedEndDate;
        this.responsiblePerson = responsiblePerson;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        updateStatusFromDates();
    }
    
    private void updateStatusFromDates() {
        LocalDate today = LocalDate.now();
        
        if (actualEndDate != null) {
            status = TimelineStatus.COMPLETED;
        } else if (actualStartDate != null || 
                  (plannedStartDate != null && !today.isBefore(plannedStartDate))) {
            status = TimelineStatus.IN_PROGRESS;
        } else {
            status = TimelineStatus.PENDING;
        }
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Initiative getInitiative() { return initiative; }
    public void setInitiative(Initiative initiative) { this.initiative = initiative; }
    
    public String getStageName() { return stageName; }
    public void setStageName(String stageName) { this.stageName = stageName; }
    
    public LocalDate getPlannedStartDate() { return plannedStartDate; }
    public void setPlannedStartDate(LocalDate plannedStartDate) { this.plannedStartDate = plannedStartDate; }
    
    public LocalDate getPlannedEndDate() { return plannedEndDate; }
    public void setPlannedEndDate(LocalDate plannedEndDate) { this.plannedEndDate = plannedEndDate; }
    
    public LocalDate getActualStartDate() { return actualStartDate; }
    public void setActualStartDate(LocalDate actualStartDate) { this.actualStartDate = actualStartDate; }
    
    public LocalDate getActualEndDate() { return actualEndDate; }
    public void setActualEndDate(LocalDate actualEndDate) { this.actualEndDate = actualEndDate; }
    
    public TimelineStatus getStatus() { return status; }
    public void setStatus(TimelineStatus status) { this.status = status; }
    
    public String getResponsiblePerson() { return responsiblePerson; }
    public void setResponsiblePerson(String responsiblePerson) { this.responsiblePerson = responsiblePerson; }
    
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    
    public String getDocumentPath() { return documentPath; }
    public void setDocumentPath(String documentPath) { this.documentPath = documentPath; }
    
    public Boolean getSiteLeadApproval() { return siteLeadApproval; }
    public void setSiteLeadApproval(Boolean siteLeadApproval) { this.siteLeadApproval = siteLeadApproval; }
    
    public Boolean getInitiativeLeadApproval() { return initiativeLeadApproval; }
    public void setInitiativeLeadApproval(Boolean initiativeLeadApproval) { this.initiativeLeadApproval = initiativeLeadApproval; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}