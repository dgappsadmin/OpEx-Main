package com.company.opexhub.entity;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "OPEX_WORKFLOW_TRANSACTIONS")
public class WorkflowTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "workflow_transaction_seq")
    @SequenceGenerator(name = "workflow_transaction_seq", sequenceName = "OPEX_WF_TRANS_SEQ", allocationSize = 1)
    private Long id;

    @NotNull
    @Column(name = "initiative_id")
    private Long initiativeId;

    @NotNull
    @Column(name = "stage_number")
    private Integer stageNumber;

    @NotNull
    @Column(name = "stage_name")
    private String stageName;

    @NotNull
    private String site;

    @NotNull
    @Column(name = "approve_status")
    private String approveStatus; // pending, approved, rejected

    @Column(name = "remarks", columnDefinition = "CLOB")
    private String comment;

    @Column(name = "action_by")
    private String actionBy;

    @Column(name = "action_date")
    private LocalDateTime actionDate;

    @Column(name = "pending_with")
    private String pendingWith; // role code

    @Column(name = "required_role")
    private String requiredRole;

    @Column(name = "assigned_user_id")
    private Long assignedUserId; // for IL assignment



    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public WorkflowTransaction() {}

    public WorkflowTransaction(Long initiativeId, Integer stageNumber, String stageName, 
                             String site, String requiredRole, String pendingWith) {
        this.initiativeId = initiativeId;
        this.stageNumber = stageNumber;
        this.stageName = stageName;
        this.site = site;
        this.requiredRole = requiredRole;
        this.pendingWith = pendingWith;
        this.approveStatus = "pending";
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

    public Long getInitiativeId() { return initiativeId; }
    public void setInitiativeId(Long initiativeId) { this.initiativeId = initiativeId; }

    public Integer getStageNumber() { return stageNumber; }
    public void setStageNumber(Integer stageNumber) { this.stageNumber = stageNumber; }

    public String getStageName() { return stageName; }
    public void setStageName(String stageName) { this.stageName = stageName; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getApproveStatus() { return approveStatus; }
    public void setApproveStatus(String approveStatus) { this.approveStatus = approveStatus; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getActionBy() { return actionBy; }
    public void setActionBy(String actionBy) { this.actionBy = actionBy; }

    public LocalDateTime getActionDate() { return actionDate; }
    public void setActionDate(LocalDateTime actionDate) { this.actionDate = actionDate; }

    public String getPendingWith() { return pendingWith; }
    public void setPendingWith(String pendingWith) { this.pendingWith = pendingWith; }

    public String getRequiredRole() { return requiredRole; }
    public void setRequiredRole(String requiredRole) { this.requiredRole = requiredRole; }

    public Long getAssignedUserId() { return assignedUserId; }
    public void setAssignedUserId(Long assignedUserId) { this.assignedUserId = assignedUserId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }


}