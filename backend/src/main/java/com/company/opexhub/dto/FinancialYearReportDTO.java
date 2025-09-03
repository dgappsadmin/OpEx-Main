package com.company.opexhub.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class FinancialYearReportDTO {
    private String financialYear;
    private Map<String, MonthlyData> monthlyData;
    private Map<String, CategoryData> categoryData;
    
    public FinancialYearReportDTO() {}
    
    public FinancialYearReportDTO(String financialYear, Map<String, MonthlyData> monthlyData, Map<String, CategoryData> categoryData) {
        this.financialYear = financialYear;
        this.monthlyData = monthlyData;
        this.categoryData = categoryData;
    }
    
    // Inner class for monthly data
    public static class MonthlyData {
        private String month;
        private BigDecimal lastFYCumulativeSavings;
        private BigDecimal potentialMonthlySavingsCumulative;
        private BigDecimal actualSavings;
        private BigDecimal monthlyCumulativeProjectedSavings;
        private BigDecimal currentFYTarget;
        
        public MonthlyData() {}
        
        public MonthlyData(String month, BigDecimal lastFYCumulativeSavings, 
                          BigDecimal potentialMonthlySavingsCumulative, 
                          BigDecimal actualSavings, 
                          BigDecimal monthlyCumulativeProjectedSavings, 
                          BigDecimal currentFYTarget) {
            this.month = month;
            this.lastFYCumulativeSavings = lastFYCumulativeSavings;
            this.potentialMonthlySavingsCumulative = potentialMonthlySavingsCumulative;
            this.actualSavings = actualSavings;
            this.monthlyCumulativeProjectedSavings = monthlyCumulativeProjectedSavings;
            this.currentFYTarget = currentFYTarget;
        }
        
        // Getters and setters
        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        
        public BigDecimal getLastFYCumulativeSavings() { return lastFYCumulativeSavings; }
        public void setLastFYCumulativeSavings(BigDecimal lastFYCumulativeSavings) { this.lastFYCumulativeSavings = lastFYCumulativeSavings; }
        
        public BigDecimal getPotentialMonthlySavingsCumulative() { return potentialMonthlySavingsCumulative; }
        public void setPotentialMonthlySavingsCumulative(BigDecimal potentialMonthlySavingsCumulative) { this.potentialMonthlySavingsCumulative = potentialMonthlySavingsCumulative; }
        
        public BigDecimal getActualSavings() { return actualSavings; }
        public void setActualSavings(BigDecimal actualSavings) { this.actualSavings = actualSavings; }
        
        public BigDecimal getMonthlyCumulativeProjectedSavings() { return monthlyCumulativeProjectedSavings; }
        public void setMonthlyCumulativeProjectedSavings(BigDecimal monthlyCumulativeProjectedSavings) { this.monthlyCumulativeProjectedSavings = monthlyCumulativeProjectedSavings; }
        
        public BigDecimal getCurrentFYTarget() { return currentFYTarget; }
        public void setCurrentFYTarget(BigDecimal currentFYTarget) { this.currentFYTarget = currentFYTarget; }
    }
    
    // Inner class for category data
    public static class CategoryData {
        private String category;
        private BigDecimal budgetedSavings;
        private BigDecimal nonBudgetedSavings;
        private BigDecimal totalSavings;
        
        public CategoryData() {}
        
        public CategoryData(String category, BigDecimal budgetedSavings, BigDecimal nonBudgetedSavings, BigDecimal totalSavings) {
            this.category = category;
            this.budgetedSavings = budgetedSavings;
            this.nonBudgetedSavings = nonBudgetedSavings;
            this.totalSavings = totalSavings;
        }
        
        // Getters and setters
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        
        public BigDecimal getBudgetedSavings() { return budgetedSavings; }
        public void setBudgetedSavings(BigDecimal budgetedSavings) { this.budgetedSavings = budgetedSavings; }
        
        public BigDecimal getNonBudgetedSavings() { return nonBudgetedSavings; }
        public void setNonBudgetedSavings(BigDecimal nonBudgetedSavings) { this.nonBudgetedSavings = nonBudgetedSavings; }
        
        public BigDecimal getTotalSavings() { return totalSavings; }
        public void setTotalSavings(BigDecimal totalSavings) { this.totalSavings = totalSavings; }
    }
    
    // Getters and setters
    public String getFinancialYear() { return financialYear; }
    public void setFinancialYear(String financialYear) { this.financialYear = financialYear; }
    
    public Map<String, MonthlyData> getMonthlyData() { return monthlyData; }
    public void setMonthlyData(Map<String, MonthlyData> monthlyData) { this.monthlyData = monthlyData; }
    
    public Map<String, CategoryData> getCategoryData() { return categoryData; }
    public void setCategoryData(Map<String, CategoryData> categoryData) { this.categoryData = categoryData; }
}