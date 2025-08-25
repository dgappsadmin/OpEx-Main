package com.company.opexhub.dto;

import java.math.BigDecimal;

public class DashboardStatsDTO {
    private Long totalInitiatives;
    private BigDecimal actualSavings;
    private Long completedInitiatives;
    private Long pendingApprovals;
    
    // Constructors
    public DashboardStatsDTO() {}
    
    public DashboardStatsDTO(Long totalInitiatives, BigDecimal actualSavings, 
                           Long completedInitiatives, Long pendingApprovals) {
        this.totalInitiatives = totalInitiatives;
        this.actualSavings = actualSavings;
        this.completedInitiatives = completedInitiatives;
        this.pendingApprovals = pendingApprovals;
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
}