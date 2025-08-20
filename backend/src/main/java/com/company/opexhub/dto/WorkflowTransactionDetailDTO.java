package com.company.opexhub.dto;

import java.time.LocalDateTime;

public class WorkflowTransactionDetailDTO {
    private Long id;
    private Long initiativeId;
    private Integer stageNumber;
    private String stageName;
    private String site;
    private String approveStatus;
    private String comment;
    private String actionBy;
    private LocalDateTime actionDate;
    private String pendingWith;
    private String requiredRole;
    private Long assignedUserId;
    private String assignedUserName;
    private Boolean requiresMoc;
    private String mocNumber;
    private Boolean requiresCapex;
    private String capexNumber;
    private String nextStageName;
    private String nextUser;
    private String nextUserEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isVisible; // Controls stage visibility
    
    // Initiative details for frontend use
    private String initiativeNumber;
    private String initiativeTitle;
    private String initiativeStatus;
    private String assignedUserEmail;
    private java.math.BigDecimal expectedSavings;
    private String description;
    
    // Constructors
    public WorkflowTransactionDetailDTO() {}
    
    public WorkflowTransactionDetailDTO(Long id, Long initiativeId, Integer stageNumber, String stageName,
                                      String site, String approveStatus, String comment, String actionBy,
                                      LocalDateTime actionDate, String pendingWith, String requiredRole,
                                      Long assignedUserId, String assignedUserName, String nextStageName,
                                      String nextUser, String nextUserEmail, LocalDateTime createdAt,
                                      LocalDateTime updatedAt, Boolean isVisible) {
        this.id = id;
        this.initiativeId = initiativeId;
        this.stageNumber = stageNumber;
        this.stageName = stageName;
        this.site = site;
        this.approveStatus = approveStatus;
        this.comment = comment;
        this.actionBy = actionBy;
        this.actionDate = actionDate;
        this.pendingWith = pendingWith;
        this.requiredRole = requiredRole;
        this.assignedUserId = assignedUserId;
        this.assignedUserName = assignedUserName;
        this.nextStageName = nextStageName;
        this.nextUser = nextUser;
        this.nextUserEmail = nextUserEmail;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.isVisible = isVisible;
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

    public String getAssignedUserName() { return assignedUserName; }
    public void setAssignedUserName(String assignedUserName) { this.assignedUserName = assignedUserName; }

    public String getNextStageName() { return nextStageName; }
    public void setNextStageName(String nextStageName) { this.nextStageName = nextStageName; }

    public String getNextUser() { return nextUser; }
    public void setNextUser(String nextUser) { this.nextUser = nextUser; }

    public String getNextUserEmail() { return nextUserEmail; }
    public void setNextUserEmail(String nextUserEmail) { this.nextUserEmail = nextUserEmail; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getIsVisible() { return isVisible; }
    public void setIsVisible(Boolean isVisible) { this.isVisible = isVisible; }

    public Boolean getRequiresMoc() { return requiresMoc; }
    public void setRequiresMoc(Boolean requiresMoc) { this.requiresMoc = requiresMoc; }

    public String getMocNumber() { return mocNumber; }
    public void setMocNumber(String mocNumber) { this.mocNumber = mocNumber; }

    public Boolean getRequiresCapex() { return requiresCapex; }
    public void setRequiresCapex(Boolean requiresCapex) { this.requiresCapex = requiresCapex; }

    public String getCapexNumber() { return capexNumber; }
    public void setCapexNumber(String capexNumber) { this.capexNumber = capexNumber; }
    
    public String getInitiativeNumber() { return initiativeNumber; }
    public void setInitiativeNumber(String initiativeNumber) { this.initiativeNumber = initiativeNumber; }
    
    public String getInitiativeTitle() { return initiativeTitle; }
    public void setInitiativeTitle(String initiativeTitle) { this.initiativeTitle = initiativeTitle; }
    
    public String getInitiativeStatus() { return initiativeStatus; }
    public void setInitiativeStatus(String initiativeStatus) { this.initiativeStatus = initiativeStatus; }
    
    public String getAssignedUserEmail() { return assignedUserEmail; }
    public void setAssignedUserEmail(String assignedUserEmail) { this.assignedUserEmail = assignedUserEmail; }
    
    public java.math.BigDecimal getExpectedSavings() { return expectedSavings; }
    public void setExpectedSavings(java.math.BigDecimal expectedSavings) { this.expectedSavings = expectedSavings; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}