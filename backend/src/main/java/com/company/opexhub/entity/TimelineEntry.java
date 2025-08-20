package com.company.opexhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "OPEX_TIMELINE_ENTRIES")
public class TimelineEntry {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "timeline_entry_seq")
    @SequenceGenerator(name = "timeline_entry_seq", sequenceName = "OPEX_TIMELINE_ENT_SEQ", allocationSize = 1)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiative_id", nullable = false)
    @JsonIgnore
    private Initiative initiative;
    
    @Column(name = "stage_name", nullable = false)
    private String stageName;
    
    @Column(name = "planned_start_date", nullable = false)
    private LocalDate plannedStartDate;
    
    @Column(name = "planned_end_date", nullable = false)
    private LocalDate plannedEndDate;
    
    @Column(name = "actual_start_date")
    private LocalDate actualStartDate;
    
    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TimelineStatus status = TimelineStatus.PENDING;
    
    @Column(name = "responsible_person", nullable = false)
    private String responsiblePerson;
    
    @Column(columnDefinition = "CLOB")
    private String remarks;
    
    @Column(name = "document_path")
    private String documentPath;
    
    @Column(name = "site_lead_approval", nullable = false, columnDefinition = "CHAR(1) DEFAULT 'N'")
    private String siteLeadApproval = "N";
    
    @Column(name = "initiative_lead_approval", nullable = false, columnDefinition = "CHAR(1) DEFAULT 'N'")
    private String initiativeLeadApproval = "N";
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum TimelineStatus {
        PENDING, IN_PROGRESS, COMPLETED, DELAYED
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
        
        // Don't auto-update status if it's manually set to DELAYED
        if (status == TimelineStatus.DELAYED) {
            return;
        }
        
        if (actualEndDate != null) {
            status = TimelineStatus.COMPLETED;
        } else if (actualStartDate != null || 
                  (plannedStartDate != null && !today.isBefore(plannedStartDate))) {
            // Check if we're past the planned end date without completion - set to DELAYED
            if (plannedEndDate != null && today.isAfter(plannedEndDate)) {
                status = TimelineStatus.DELAYED;
            } else {
                status = TimelineStatus.IN_PROGRESS;
            }
        } else {
            status = TimelineStatus.PENDING;
        }
    }
    
    // Helper methods for Boolean to CHAR conversion
    public Boolean getSiteLeadApprovalBoolean() {
        return "Y".equals(this.siteLeadApproval);
    }

    public void setSiteLeadApprovalBoolean(Boolean siteLeadApproval) {
        this.siteLeadApproval = Boolean.TRUE.equals(siteLeadApproval) ? "Y" : "N";
    }

    public Boolean getInitiativeLeadApprovalBoolean() {
        return "Y".equals(this.initiativeLeadApproval);
    }

    public void setInitiativeLeadApprovalBoolean(Boolean initiativeLeadApproval) {
        this.initiativeLeadApproval = Boolean.TRUE.equals(initiativeLeadApproval) ? "Y" : "N";
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
    
    public String getSiteLeadApproval() { return siteLeadApproval; }
    public void setSiteLeadApproval(String siteLeadApproval) { this.siteLeadApproval = siteLeadApproval; }
    
    public String getInitiativeLeadApproval() { return initiativeLeadApproval; }
    public void setInitiativeLeadApproval(String initiativeLeadApproval) { this.initiativeLeadApproval = initiativeLeadApproval; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}