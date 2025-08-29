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
        try {
            System.out.println("🔍 Processing DNL data - monitoringData size: " + (monitoringData != null ? monitoringData.size() : 0));
            
            // Initialize data array [4 rows (RMC, Spent Acid, Environment, Total) x 6 columns]
            double[][] data = new double[4][6];
            
            // Initialize category mapping
            Map<String, Integer> categoryMap = new HashMap<>();
            categoryMap.put("rmc", 0);           // Lowercase as per database
            categoryMap.put("spent acid", 1);    // Lowercase as per database  
            categoryMap.put("environment", 2);   // Lowercase as per database
            
            // Handle null or empty monitoring data
            if (monitoringData == null || monitoringData.isEmpty()) {
                System.out.println("⚠️  No monitoring data found, returning zero values");
                return data; // Return array of zeros
            }
            
            // Process monitoring data - fetch from ACHIEVED_VALUE column
            for (Object[] row : monitoringData) {
                try {
                    String category = ((String) row[0]).toLowerCase(); // Convert to lowercase for matching
                    String budgetType = row[1] != null ? ((String) row[1]).toLowerCase() : "budgeted"; // Handle null budgetType with default
                    Double totalSavings = ((Number) row[2]).doubleValue(); // This comes from ACHIEVED_VALUE column
                    
                    System.out.println("📊 Processing row - category: " + category + ", budgetType: " + budgetType + ", savings: " + totalSavings);
                    
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
                    } else {
                        System.out.println("⚠️  Unknown category: " + category);
                    }
                } catch (Exception e) {
                    System.err.println("❌ Error processing monitoring data row: " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            // Calculate totals row (index 3) - sum of all categories from ACHIEVED_VALUE
            for (int j = 0; j < 6; j++) {
                data[3][j] = data[0][j] + data[1][j] + data[2][j];
            }
            
            System.out.println("✅ Data processing completed successfully");
            return data;
        } catch (Exception e) {
            System.err.println("❌ Error in getProcessedData: " + e.getMessage());
            e.printStackTrace();
            // Return empty data array on error
            return new double[4][6];
        }
    }
    
    // Method to return processed data for JSON serialization (frontend consumption)
    public double[][] getProcessedDataForChart() {
        return getProcessedData();
    }
    
    // Getters
    public List<Object[]> getMonitoringData() {
        return monitoringData;
    }
    
    public List<Object[]> getBudgetTargets() {
        return budgetTargets;
    }
    
    // Add getter for frontend
    public double[][] getProcessedData2() {
        return getProcessedData();
    }
}