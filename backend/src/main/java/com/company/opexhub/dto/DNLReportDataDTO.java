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
        categoryMap.put("rmc", 0);           // Lowercase as per database
        categoryMap.put("spent acid", 1);    // Lowercase as per database
        categoryMap.put("environment", 2);   // Lowercase as per database
        
        // Process monitoring data - fetch from ACHIEVED_VALUE column
        for (Object[] row : monitoringData) {
            String category = ((String) row[0]).toLowerCase(); // Convert to lowercase for matching
            String budgetType = ((String) row[1]).toLowerCase(); // Should be 'budgeted' or 'non-budgeted'
            Double totalSavings = ((Number) row[2]).doubleValue(); // This comes from ACHIEVED_VALUE column
            
            Integer categoryIndex = categoryMap.get(category);
            if (categoryIndex != null) {
                if ("budgeted".equals(budgetType)) {
                    data[categoryIndex][0] = totalSavings; // FY'26 Budgeted Saving (from ACHIEVED_VALUE)
                    data[categoryIndex][2] = totalSavings; // Budgeted (from ACHIEVED_VALUE)
                    data[categoryIndex][4] = totalSavings; // Savings till current month (from ACHIEVED_VALUE)
                } else if ("non-budgeted".equals(budgetType)) {
                    data[categoryIndex][1] = totalSavings; // FY'26 Non Budgeted Saving (from ACHIEVED_VALUE)
                    data[categoryIndex][3] = totalSavings; // Non-budgeted (from ACHIEVED_VALUE)
                    data[categoryIndex][4] += totalSavings; // Add to Savings till current month (from ACHIEVED_VALUE)
                }
                
                // Calculate Total column (sum of Budgeted + Non-budgeted from ACHIEVED_VALUE)
                data[categoryIndex][5] = data[categoryIndex][2] + data[categoryIndex][3];
            }
        }
        
        // Calculate totals row (index 3) - sum of all categories from ACHIEVED_VALUE
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