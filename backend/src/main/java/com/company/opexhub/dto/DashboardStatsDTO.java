package com.company.opexhub.dto;

import java.math.BigDecimal;

public class DashboardStatsDTO {
    private Long totalInitiatives;
    private BigDecimal actualSavings;
    private Long completedInitiatives;
    private Long pendingApprovals;
    
    // Trend data (percentage change from previous month)
    private Double totalInitiativesTrend;
    private Double actualSavingsTrend;
    private Double completedInitiativesTrend;
    private Double pendingApprovalsTrend;
    
    // Constructors
    public DashboardStatsDTO() {}
    
    public DashboardStatsDTO(Long totalInitiatives, BigDecimal actualSavings, 
                           Long completedInitiatives, Long pendingApprovals) {
        this.totalInitiatives = totalInitiatives;
        this.actualSavings = actualSavings;
        this.completedInitiatives = completedInitiatives;
        this.pendingApprovals = pendingApprovals;
    }
    
    public DashboardStatsDTO(Long totalInitiatives, BigDecimal actualSavings, 
                           Long completedInitiatives, Long pendingApprovals,
                           Double totalInitiativesTrend, Double actualSavingsTrend,
                           Double completedInitiativesTrend, Double pendingApprovalsTrend) {
        this.totalInitiatives = totalInitiatives;
        this.actualSavings = actualSavings;
        this.completedInitiatives = completedInitiatives;
        this.pendingApprovals = pendingApprovals;
        this.totalInitiativesTrend = totalInitiativesTrend;
        this.actualSavingsTrend = actualSavingsTrend;
        this.completedInitiativesTrend = completedInitiativesTrend;
        this.pendingApprovalsTrend = pendingApprovalsTrend;
    }
    
    // Getters and Setters
    public Long getTotalInitiatives() { return totalInitiatives; }
    public void setTotalInitiatives(Long totalInitiatives) { this.totalInitiatives = totalInitiatives; }
    
    public BigDecimal getActualSavings() { return actualSavings; }
    public void setActualSavings(BigDecimal actualSavings) { this.actualSavings = actualSavings; }
    
    public Long getCompletedInitiatives() { return completedInitiatives; }
    public void setCompletedInitiatives(Long completedInitiatives) { this.completedInitiatives = completedInitiatives; }
    
    public Long getPendingApprovals() { return pendingApprovals; }
    public void setPendingApprovals(Long pendingApprovals) { this.pendingApprovals = pendingApprovals; }
    
    // Trend getters and setters
    public Double getTotalInitiativesTrend() { return totalInitiativesTrend; }
    public void setTotalInitiativesTrend(Double totalInitiativesTrend) { this.totalInitiativesTrend = totalInitiativesTrend; }
    
    public Double getActualSavingsTrend() { return actualSavingsTrend; }
    public void setActualSavingsTrend(Double actualSavingsTrend) { this.actualSavingsTrend = actualSavingsTrend; }
    
    public Double getCompletedInitiativesTrend() { return completedInitiativesTrend; }
    public void setCompletedInitiativesTrend(Double completedInitiativesTrend) { this.completedInitiativesTrend = completedInitiativesTrend; }
    
    public Double getPendingApprovalsTrend() { return pendingApprovalsTrend; }
    public void setPendingApprovalsTrend(Double pendingApprovalsTrend) { this.pendingApprovalsTrend = pendingApprovalsTrend; }
}