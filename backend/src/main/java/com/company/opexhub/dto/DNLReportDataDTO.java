package com.company.opexhub.dto;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DNLReportDataDTO {
    private List<Object[]> monitoringData;
    private List<Object[]> budgetTargets;
    
    public DNLReportDataDTO(List<Object[]> monitoringData, List<Object[]> budgetTargets) {
        this.monitoringData = monitoringData;
        this.budgetTargets = budgetTargets;
    }
    
    public double[][] getProcessedData() {
        // Initialize data array [4 rows (RMC, Spent Acid, Environment, Total) x 6 columns]
        double[][] data = new double[4][6];
        
        // Initialize category mapping
        Map<String, Integer> categoryMap = new HashMap<>();
        categoryMap.put("RMC", 0);
        categoryMap.put("Spent Acid", 1);
        categoryMap.put("Environment", 2);
        
        // Process monitoring data
        for (Object[] row : monitoringData) {
            String category = (String) row[0];
            String budgetType = (String) row[1];
            Double totalSavings = ((Number) row[2]).doubleValue();
            
            Integer categoryIndex = categoryMap.get(category);
            if (categoryIndex != null) {
                if ("budgeted".equals(budgetType)) {
                    data[categoryIndex][0] = totalSavings; // FY'26 Budgeted Saving
                    data[categoryIndex][2] = totalSavings; // Budgeted
                    data[categoryIndex][4] = totalSavings; // Savings till June'25
                } else if ("non-budgeted".equals(budgetType)) {
                    data[categoryIndex][1] = totalSavings; // FY'26 Non Budgeted Saving
                    data[categoryIndex][3] = totalSavings; // Non-budgeted
                    data[categoryIndex][4] += totalSavings; // Add to Savings till June'25
                }
                
                // Calculate Total column
                data[categoryIndex][5] = data[categoryIndex][2] + data[categoryIndex][3];
            }
        }
        
        // Calculate totals row (index 3)
        for (int j = 0; j < 6; j++) {
            data[3][j] = data[0][j] + data[1][j] + data[2][j];
        }
        
        return data;
    }
    
    // Getters
    public List<Object[]> getMonitoringData() {
        return monitoringData;
    }
    
    public List<Object[]> getBudgetTargets() {
        return budgetTargets;
    }
}