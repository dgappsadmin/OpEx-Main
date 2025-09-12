package com.company.opexhub.dto;

import java.math.BigDecimal;

/**
 * DTO for Performance Analysis Dashboard
 * Contains metrics for Overall, Budget, and Non-Budget performance analysis
 */
public class PerformanceAnalysisDTO {
    
    // Overall Performance Analysis
    private PerformanceMetrics overall;
    
    // Budget Performance Analysis  
    private PerformanceMetrics budget;
    
    // Non-Budget Performance Analysis
    private PerformanceMetrics nonBudget;
    
    // Current Financial Year info
    private String currentFinancialYear;
    
    public PerformanceAnalysisDTO() {}
    
    public PerformanceAnalysisDTO(PerformanceMetrics overall, PerformanceMetrics budget, 
                                 PerformanceMetrics nonBudget, String currentFinancialYear) {
        this.overall = overall;
        this.budget = budget;
        this.nonBudget = nonBudget;
        this.currentFinancialYear = currentFinancialYear;
    }
    
    // Inner class for performance metrics
    public static class PerformanceMetrics {
        private Long totalInitiatives;
        private BigDecimal potentialSavingsAnnualized;
        private BigDecimal potentialSavingsCurrentFY;
        private BigDecimal actualSavingsCurrentFY;
        private BigDecimal savingsProjectionCurrentFY;
        private BigDecimal progressPercentage;
        
        // Trend fields for real-time comparison
        private BigDecimal totalInitiativesTrend;
        private BigDecimal potentialSavingsAnnualizedTrend;
        private BigDecimal potentialSavingsCurrentFYTrend;
        private BigDecimal actualSavingsCurrentFYTrend;
        private BigDecimal savingsProjectionCurrentFYTrend;
        private BigDecimal progressPercentageTrend;
        
        public PerformanceMetrics() {}
        
        public PerformanceMetrics(Long totalInitiatives, BigDecimal potentialSavingsAnnualized,
                                BigDecimal potentialSavingsCurrentFY, BigDecimal actualSavingsCurrentFY,
                                BigDecimal savingsProjectionCurrentFY, BigDecimal progressPercentage) {
            this.totalInitiatives = totalInitiatives;
            this.potentialSavingsAnnualized = potentialSavingsAnnualized != null ? potentialSavingsAnnualized : BigDecimal.ZERO;
            this.potentialSavingsCurrentFY = potentialSavingsCurrentFY != null ? potentialSavingsCurrentFY : BigDecimal.ZERO;
            this.actualSavingsCurrentFY = actualSavingsCurrentFY != null ? actualSavingsCurrentFY : BigDecimal.ZERO;
            this.savingsProjectionCurrentFY = savingsProjectionCurrentFY != null ? savingsProjectionCurrentFY : BigDecimal.ZERO;
            this.progressPercentage = progressPercentage != null ? progressPercentage : BigDecimal.ZERO;
            
            // Initialize trends to zero by default
            this.totalInitiativesTrend = BigDecimal.ZERO;
            this.potentialSavingsAnnualizedTrend = BigDecimal.ZERO;
            this.potentialSavingsCurrentFYTrend = BigDecimal.ZERO;
            this.actualSavingsCurrentFYTrend = BigDecimal.ZERO;
            this.savingsProjectionCurrentFYTrend = BigDecimal.ZERO;
            this.progressPercentageTrend = BigDecimal.ZERO;
        }
        
        public PerformanceMetrics(Long totalInitiatives, BigDecimal potentialSavingsAnnualized,
                                BigDecimal potentialSavingsCurrentFY, BigDecimal actualSavingsCurrentFY,
                                BigDecimal savingsProjectionCurrentFY, BigDecimal progressPercentage,
                                BigDecimal totalInitiativesTrend, BigDecimal potentialSavingsAnnualizedTrend,
                                BigDecimal potentialSavingsCurrentFYTrend, BigDecimal actualSavingsCurrentFYTrend,
                                BigDecimal savingsProjectionCurrentFYTrend, BigDecimal progressPercentageTrend) {
            this.totalInitiatives = totalInitiatives;
            this.potentialSavingsAnnualized = potentialSavingsAnnualized != null ? potentialSavingsAnnualized : BigDecimal.ZERO;
            this.potentialSavingsCurrentFY = potentialSavingsCurrentFY != null ? potentialSavingsCurrentFY : BigDecimal.ZERO;
            this.actualSavingsCurrentFY = actualSavingsCurrentFY != null ? actualSavingsCurrentFY : BigDecimal.ZERO;
            this.savingsProjectionCurrentFY = savingsProjectionCurrentFY != null ? savingsProjectionCurrentFY : BigDecimal.ZERO;
            this.progressPercentage = progressPercentage != null ? progressPercentage : BigDecimal.ZERO;
            
            this.totalInitiativesTrend = totalInitiativesTrend != null ? totalInitiativesTrend : BigDecimal.ZERO;
            this.potentialSavingsAnnualizedTrend = potentialSavingsAnnualizedTrend != null ? potentialSavingsAnnualizedTrend : BigDecimal.ZERO;
            this.potentialSavingsCurrentFYTrend = potentialSavingsCurrentFYTrend != null ? potentialSavingsCurrentFYTrend : BigDecimal.ZERO;
            this.actualSavingsCurrentFYTrend = actualSavingsCurrentFYTrend != null ? actualSavingsCurrentFYTrend : BigDecimal.ZERO;
            this.savingsProjectionCurrentFYTrend = savingsProjectionCurrentFYTrend != null ? savingsProjectionCurrentFYTrend : BigDecimal.ZERO;
            this.progressPercentageTrend = progressPercentageTrend != null ? progressPercentageTrend : BigDecimal.ZERO;
        }
        
        // Getters and Setters
        public Long getTotalInitiatives() { return totalInitiatives; }
        public void setTotalInitiatives(Long totalInitiatives) { this.totalInitiatives = totalInitiatives; }
        
        public BigDecimal getPotentialSavingsAnnualized() { return potentialSavingsAnnualized; }
        public void setPotentialSavingsAnnualized(BigDecimal potentialSavingsAnnualized) { 
            this.potentialSavingsAnnualized = potentialSavingsAnnualized; 
        }
        
        public BigDecimal getPotentialSavingsCurrentFY() { return potentialSavingsCurrentFY; }
        public void setPotentialSavingsCurrentFY(BigDecimal potentialSavingsCurrentFY) { 
            this.potentialSavingsCurrentFY = potentialSavingsCurrentFY; 
        }
        
        public BigDecimal getActualSavingsCurrentFY() { return actualSavingsCurrentFY; }
        public void setActualSavingsCurrentFY(BigDecimal actualSavingsCurrentFY) { 
            this.actualSavingsCurrentFY = actualSavingsCurrentFY; 
        }
        
        public BigDecimal getSavingsProjectionCurrentFY() { return savingsProjectionCurrentFY; }
        public void setSavingsProjectionCurrentFY(BigDecimal savingsProjectionCurrentFY) { 
            this.savingsProjectionCurrentFY = savingsProjectionCurrentFY; 
        }
        
        public BigDecimal getProgressPercentage() { return progressPercentage; }
        public void setProgressPercentage(BigDecimal progressPercentage) { 
            this.progressPercentage = progressPercentage; 
        }
        
        // Trend getters and setters
        public BigDecimal getTotalInitiativesTrend() { return totalInitiativesTrend; }
        public void setTotalInitiativesTrend(BigDecimal totalInitiativesTrend) { 
            this.totalInitiativesTrend = totalInitiativesTrend; 
        }
        
        public BigDecimal getPotentialSavingsAnnualizedTrend() { return potentialSavingsAnnualizedTrend; }
        public void setPotentialSavingsAnnualizedTrend(BigDecimal potentialSavingsAnnualizedTrend) { 
            this.potentialSavingsAnnualizedTrend = potentialSavingsAnnualizedTrend; 
        }
        
        public BigDecimal getPotentialSavingsCurrentFYTrend() { return potentialSavingsCurrentFYTrend; }
        public void setPotentialSavingsCurrentFYTrend(BigDecimal potentialSavingsCurrentFYTrend) { 
            this.potentialSavingsCurrentFYTrend = potentialSavingsCurrentFYTrend; 
        }
        
        public BigDecimal getActualSavingsCurrentFYTrend() { return actualSavingsCurrentFYTrend; }
        public void setActualSavingsCurrentFYTrend(BigDecimal actualSavingsCurrentFYTrend) { 
            this.actualSavingsCurrentFYTrend = actualSavingsCurrentFYTrend; 
        }
        
        public BigDecimal getSavingsProjectionCurrentFYTrend() { return savingsProjectionCurrentFYTrend; }
        public void setSavingsProjectionCurrentFYTrend(BigDecimal savingsProjectionCurrentFYTrend) { 
            this.savingsProjectionCurrentFYTrend = savingsProjectionCurrentFYTrend; 
        }
        
        public BigDecimal getProgressPercentageTrend() { return progressPercentageTrend; }
        public void setProgressPercentageTrend(BigDecimal progressPercentageTrend) { 
            this.progressPercentageTrend = progressPercentageTrend; 
        }
    }
    
    // Getters and Setters
    public PerformanceMetrics getOverall() { return overall; }
    public void setOverall(PerformanceMetrics overall) { this.overall = overall; }
    
    public PerformanceMetrics getBudget() { return budget; }
    public void setBudget(PerformanceMetrics budget) { this.budget = budget; }
    
    public PerformanceMetrics getNonBudget() { return nonBudget; }
    public void setNonBudget(PerformanceMetrics nonBudget) { this.nonBudget = nonBudget; }
    
    public String getCurrentFinancialYear() { return currentFinancialYear; }
    public void setCurrentFinancialYear(String currentFinancialYear) { 
        this.currentFinancialYear = currentFinancialYear; 
    }
}