package com.company.opexhub.service;

import com.company.opexhub.dto.DNLReportDataDTO;
import com.company.opexhub.dto.FinancialYearReportDTO;
import com.company.opexhub.entity.Initiative;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.MonthlyMonitoringEntryRepository;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.apache.poi.xddf.usermodel.chart.*;
import org.apache.poi.xddf.usermodel.*;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.poi.util.Units;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ReportsService {

    private static final Logger logger = LoggerFactory.getLogger(ReportsService.class);

    @Autowired
    private InitiativeRepository initiativeRepository;

    @Autowired
    private MonthlyMonitoringEntryRepository monthlyMonitoringEntryRepository;

    // Financial Year Reporting Methods
    public FinancialYearReportDTO getFinancialYearData(String financialYear, String site, String budgetType, String category) {
        // Calculate financial year date range (April to March)
        LocalDate currentDate = LocalDate.now();
        
        // Handle financial year format (convert "25" to 2025)
        int fyYear;
        if (financialYear != null && financialYear.length() == 2) {
            // Convert 2-digit FY to full year (e.g., "22" -> 2022)
            int fyShort = Integer.parseInt(financialYear);
            fyYear = fyShort < 50 ? 2000 + fyShort : 1900 + fyShort; // Assume years < 50 are 20xx
        } else if (financialYear != null) {
            fyYear = Integer.parseInt(financialYear);
        } else {
            // Default to current financial year
            fyYear = currentDate.getMonthValue() >= 4 ? currentDate.getYear() : currentDate.getYear() - 1;
        }
        
        logger.info("Financial Year Data - Input FY: {}, Calculated FY year: {}", financialYear, fyYear);
        
        String startMonth = fyYear + "-04"; // April of FY start year
        String endMonth = (fyYear + 1) + "-03"; // March of FY end year
        
        logger.info("Financial Year Data - Start Month: {}, End Month: {}", startMonth, endMonth);
        
        // Get financial year data from repository
        List<Object[]> financialData = monthlyMonitoringEntryRepository.findFinancialYearData(
            startMonth, endMonth, site, budgetType, category);
        
        logger.info("Financial Year Data - Retrieved {} rows from repository", 
                   financialData != null ? financialData.size() : 0);
        
        // Process monthly data
        Map<String, FinancialYearReportDTO.MonthlyData> monthlyDataMap = processMonthlyData(
            financialData, fyYear, site, budgetType, category);
        
        // Process category data
        Map<String, FinancialYearReportDTO.CategoryData> categoryDataMap = processCategoryData(
            startMonth, endMonth, site, budgetType, category);
        
        return new FinancialYearReportDTO(financialYear, monthlyDataMap, categoryDataMap);
    }
    
    private Map<String, FinancialYearReportDTO.MonthlyData> processMonthlyData(
            List<Object[]> financialData, int fyYear, String site, String budgetType, String category) {
        
        Map<String, FinancialYearReportDTO.MonthlyData> monthlyDataMap = new HashMap<>();
        String[] months = {"Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"};
        
        // Initialize all months with zero values
        for (int i = 0; i < months.length; i++) {
            String monthKey = months[i];
            String monthStr = String.format("%d-%02d", i < 9 ? fyYear : fyYear + 1, (i % 12) + (i < 9 ? 4 : -8));
            
            // Get last FY cumulative savings (previous year same month)
            String lastFYEndMonth = String.format("%d-%02d", fyYear - 1, (i % 12) + (i < 9 ? 4 : -8));
            BigDecimal lastFYCumulative = monthlyMonitoringEntryRepository.findCumulativeSavings(
                (fyYear - 1) + "-04", lastFYEndMonth, site, budgetType, category);
            
            // Get potential monthly savings cumulative (expected savings)
            LocalDate startDate = LocalDate.of(fyYear, i < 9 ? i + 4 : i - 8, 1);
            LocalDate endDate = LocalDate.of(i < 9 ? fyYear : fyYear + 1, (i % 12) + (i < 9 ? 4 : -8), 
                                           LocalDate.of(i < 9 ? fyYear : fyYear + 1, (i % 12) + (i < 9 ? 4 : -8), 1).lengthOfMonth());
            BigDecimal potentialCumulative = monthlyMonitoringEntryRepository.findPotentialSavings(
                startDate, endDate, site, budgetType);
            
            // Get current month actual and target savings from financial data
            BigDecimal actualSavings = BigDecimal.ZERO;
            BigDecimal targetSavings = BigDecimal.ZERO;
            BigDecimal expectedSavings = BigDecimal.ZERO;
            
            for (Object[] row : financialData) {
                String dataMonth = (String) row[0];
                if (dataMonth.equals(monthStr)) {
                    actualSavings = actualSavings.add(row[3] != null ? (BigDecimal) row[3] : BigDecimal.ZERO);
                    targetSavings = targetSavings.add(row[4] != null ? (BigDecimal) row[4] : BigDecimal.ZERO);
                    expectedSavings = expectedSavings.add(row[5] != null ? (BigDecimal) row[5] : BigDecimal.ZERO);
                }
            }
            
            // Calculate cumulative projected savings (target values cumulative)
            BigDecimal cumulativeProjected = monthlyMonitoringEntryRepository.findCumulativeSavings(
                fyYear + "-04", monthStr, site, budgetType, category);
            
            FinancialYearReportDTO.MonthlyData monthlyData = new FinancialYearReportDTO.MonthlyData(
                monthKey,
                lastFYCumulative != null ? lastFYCumulative : BigDecimal.ZERO,
                potentialCumulative != null ? potentialCumulative : BigDecimal.ZERO,
                actualSavings,
                cumulativeProjected != null ? cumulativeProjected : BigDecimal.ZERO,
                targetSavings // Current FY Target for the month
            );
            
            monthlyDataMap.put(monthKey, monthlyData);
        }
        
        return monthlyDataMap;
    }
    
    private Map<String, FinancialYearReportDTO.CategoryData> processCategoryData(
            String startMonth, String endMonth, String site, String budgetType, String category) {
        
        Map<String, FinancialYearReportDTO.CategoryData> categoryDataMap = new HashMap<>();
        
        // Get category-wise summary data
        List<Object[]> categoryData = monthlyMonitoringEntryRepository.findCategoryWiseSummary(
            startMonth, endMonth, site, budgetType, category);
        
        // Process each category
        for (Object[] row : categoryData) {
            String cat = (String) row[0];
            String budgetTypeVal = (String) row[1];
            BigDecimal totalSavings = (BigDecimal) row[2];
            
            FinancialYearReportDTO.CategoryData existingData = categoryDataMap.get(cat);
            if (existingData == null) {
                existingData = new FinancialYearReportDTO.CategoryData(cat, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
                categoryDataMap.put(cat, existingData);
            }
            
            if ("budgeted".equals(budgetTypeVal)) {
                existingData.setBudgetedSavings(totalSavings);
            } else {
                existingData.setNonBudgetedSavings(totalSavings);
            }
            
            // Update total
            existingData.setTotalSavings(
                existingData.getBudgetedSavings().add(existingData.getNonBudgetedSavings())
            );
        }
        
        return categoryDataMap;
    }
    
    // Get available financial years dynamically from initiative data
    public List<String> getAvailableFinancialYears() {
        try {
            // Get distinct years from initiative created dates
            List<String> availableYears = new java.util.ArrayList<>();
            
            // Query all initiatives and extract financial years
            List<Initiative> allInitiatives = initiativeRepository.findAll();
            java.util.Set<String> fySet = new java.util.LinkedHashSet<>();
            
            for (Initiative initiative : allInitiatives) {
                LocalDate createdDate = null;
                
                // Try to get date from startDate first, then createdAt
                if (initiative.getStartDate() != null) {
                    createdDate = initiative.getStartDate();
                } else if (initiative.getCreatedAt() != null) {
                    createdDate = initiative.getCreatedAt().toLocalDate();
                }
                
                if (createdDate != null) {
                    // Calculate financial year (April to March)
                    int fyStartYear = createdDate.getMonthValue() >= 4 ? 
                        createdDate.getYear() : createdDate.getYear() - 1;
                    
                    // Convert to 2-digit format (e.g., 2022 -> "22")
                    String fyShort = String.valueOf(fyStartYear).substring(2);
                    fySet.add(fyShort);
                }
            }
            
            // Convert to list and sort in descending order (most recent first)
            availableYears.addAll(fySet);
            availableYears.sort((a, b) -> b.compareTo(a));
            
            // If no data found, return current FY and previous few years
            if (availableYears.isEmpty()) {
                LocalDate currentDate = LocalDate.now();
                int currentFY = currentDate.getMonthValue() >= 4 ? currentDate.getYear() : currentDate.getYear() - 1;
                
                for (int i = 0; i < 5; i++) {
                    String fyShort = String.valueOf(currentFY - i).substring(2);
                    availableYears.add(fyShort);
                }
            }
            
            logger.info("Available Financial Years: {}", availableYears);
            return availableYears;
            
        } catch (Exception e) {
            logger.error("Error getting available financial years: {}", e.getMessage(), e);
            
            // Fallback to current FY and previous years
            LocalDate currentDate = LocalDate.now();
            int currentFY = currentDate.getMonthValue() >= 4 ? currentDate.getYear() : currentDate.getYear() - 1;
            
            return java.util.Arrays.asList(
                String.valueOf(currentFY).substring(2),
                String.valueOf(currentFY - 1).substring(2),
                String.valueOf(currentFY - 2).substring(2),
                String.valueOf(currentFY - 3).substring(2),
                String.valueOf(currentFY - 4).substring(2)
            );
        }
    }

    // Existing methods

    public ByteArrayOutputStream generateDNLPlantInitiativesPDF(String site, String period, String year) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Create font
        PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

        // Get report data
        DNLReportDataDTO reportData = getDNLReportData(site, period, year);

        // Title
        document.add(new Paragraph("DNL - Plant Initiatives")
            .setFont(boldFont)
            .setFontSize(16)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(10));

        // Dynamic subtitle with current month and year - match frontend format
        String titleYear = year != null ? year : String.valueOf(LocalDate.now().getYear());
        document.add(new Paragraph("Initiative saving till " + getCurrentMonth() + " " + titleYear + " (Rs. Lacs)")
            .setFont(boldFont)
            .setFontSize(14)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(20));

        // Chart Area Label
        document.add(new Paragraph("Chart Area")
            .setFont(boldFont)
            .setFontSize(12)
            .setMarginBottom(10));

        // Create visual chart representation and data table
        createVisualChartAndTable(document, pdf, font, boldFont, reportData.getProcessedData());

        document.close();
        return outputStream;
    }

    private void createVisualChartAndTable(Document document, PdfDocument pdf, PdfFont font, PdfFont boldFont, double[][] data) {
        // Add chart area label
        document.add(new Paragraph("Bar Chart")
            .setFont(boldFont)
            .setFontSize(12)
            .setMarginBottom(10));
        
        // Create visual bar chart using canvas
        createPDFBarChart(document, pdf, data);
        
        // Add sufficient spacing between chart and table (about 350 points to clear the chart area)
        for (int i = 0; i < 18; i++) {
            document.add(new Paragraph(" ").setMarginBottom(2));
        }
        
        // Add data table label
        document.add(new Paragraph("Data Table")
            .setFont(boldFont)
            .setFontSize(12)
            .setMarginBottom(10));
        
        // Create data table below chart
        createDataTable(document, font, data);
    }
    
    private void createPDFBarChart(Document document, PdfDocument pdf, double[][] data) {
        try {
            String[] categories = {"RMC", "Spent Acid", "Environment", "Total"};
            String currentFY = getCurrentFiscalYear();
            String currentMonth = getCurrentMonth();
            String currentYearShort = String.valueOf(LocalDate.now().getYear()).substring(2);
            
            String[] periods = {
                "FY'" + currentFY + " Budgeted Saving",
                "FY'" + currentFY + " Non Budgeted Saving", 
                "Budgeted",
                "Non-budgeted",
                "Savings till " + currentMonth + "'" + currentYearShort,
                "Total"
            };
            
            // Chart dimensions and position - position higher on page to avoid table overlap
            float chartX = 50;
            float chartY = 450; // Moved up to provide space for table below
            float chartWidth = 500;
            float chartHeight = 200; // Reduced height to fit better
            
            PdfCanvas canvas = new PdfCanvas(pdf.getLastPage());
            
            // Define colors for categories
            DeviceRgb[] categoryColors = {
                new DeviceRgb(31, 78, 121),   // Dark Blue for RMC
                new DeviceRgb(255, 102, 0),   // Orange for Spent Acid
                new DeviceRgb(112, 173, 71),  // Green for Environment  
                new DeviceRgb(91, 155, 213)   // Light Blue for Total
            };
            
            // Draw chart background
            canvas.setFillColor(ColorConstants.WHITE)
                  .rectangle(chartX, chartY, chartWidth, chartHeight)
                  .fill();
                  
            // Draw chart border
            canvas.setStrokeColor(ColorConstants.BLACK)
                  .setLineWidth(1)
                  .rectangle(chartX, chartY, chartWidth, chartHeight)
                  .stroke();
            
            // Calculate dynamic intervals based on actual data - matches frontend logic
            double maxDataValue = 0;
            for (int i = 0; i < data.length; i++) {
                for (int j = 0; j < data[i].length; j++) {
                    if (data[i][j] > maxDataValue) {
                        maxDataValue = data[i][j];
                    }
                }
            }
            
            SmartInterval interval = calculateSmartInterval(maxDataValue);
            
            // Calculate bar dimensions
            float groupWidth = chartWidth / periods.length;
            float barWidth = groupWidth / (categories.length + 1); // +1 for spacing
            float maxValue = (float) interval.max; // Dynamic max value
            
            // Draw Y-axis labels and grid lines with dynamic intervals
            int numGridLines = (int) Math.ceil(interval.max / interval.stepSize);
            for (int i = 0; i <= numGridLines; i++) {
                float value = (float) (i * interval.stepSize);
                float y = chartY + (value / maxValue) * chartHeight;
                
                // Grid line
                canvas.setStrokeColor(ColorConstants.LIGHT_GRAY)
                      .setLineWidth(0.5f)
                      .moveTo(chartX, y)
                      .lineTo(chartX + chartWidth, y)
                      .stroke();
                      
                // Y-axis label
                canvas.beginText()
                      .setFontAndSize(PdfFontFactory.createFont(StandardFonts.HELVETICA), 8)
                      .setTextMatrix(chartX - 30, y - 3)
                      .showText(String.valueOf((int)value))
                      .endText();
            }
            
            // Draw bars for each period
            for (int periodIndex = 0; periodIndex < periods.length && periodIndex < data[0].length; periodIndex++) {
                float groupStartX = chartX + (periodIndex * groupWidth) + (groupWidth - (barWidth * categories.length)) / 2;
                
                for (int categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
                    double value = data[categoryIndex][periodIndex];
                    float barHeight = (float) ((value / maxValue) * chartHeight);
                    float barX = groupStartX + (categoryIndex * barWidth);
                    float barY = chartY;
                    
                    // Draw bar
                    canvas.setFillColor(categoryColors[categoryIndex])
                          .rectangle(barX, barY, barWidth - 2, barHeight) // -2 for spacing between bars
                          .fill();
                    
                    // Add value label on top of bar if space allows
                    if (barHeight > 15) {
                        canvas.beginText()
                              .setFontAndSize(PdfFontFactory.createFont(StandardFonts.HELVETICA), 7)
                              .setFillColor(ColorConstants.BLACK)
                              .setTextMatrix(barX + 2, barY + barHeight + 2)
                              .showText(String.valueOf((int)value))
                              .endText();
                    }
                }
            }
            
            // Draw X-axis labels
            for (int i = 0; i < periods.length; i++) {
                float labelX = chartX + (i * groupWidth) + groupWidth / 2;
                canvas.beginText()
                      .setFontAndSize(PdfFontFactory.createFont(StandardFonts.HELVETICA), 8)
                      .setTextMatrix(labelX - 30, chartY - 15)
                      .showText(periods[i].length() > 15 ? periods[i].substring(0, 15) + "..." : periods[i])
                      .endText();
            }
            
            // Draw legend below the chart with proper spacing
            float legendY = chartY - 30;
            for (int i = 0; i < categories.length; i++) {
                float legendX = chartX + (i * 120);
                
                // Legend color box
                canvas.setFillColor(categoryColors[i])
                      .rectangle(legendX, legendY, 15, 10)
                      .fill();
                      
                // Legend text
                canvas.beginText()
                      .setFontAndSize(PdfFontFactory.createFont(StandardFonts.HELVETICA), 9)
                      .setFillColor(ColorConstants.BLACK)
                      .setTextMatrix(legendX + 20, legendY + 2)
                      .showText(categories[i])
                      .endText();
            }
            
            // Add axis titles
            // X-axis title
            canvas.beginText()
                  .setFontAndSize(PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD), 10)
                  .setFillColor(ColorConstants.BLACK)
                  .setTextMatrix(chartX + chartWidth/2 - 30, chartY - 80)
                  .showText("Time Periods")
                  .endText();
                  
            // Y-axis title (rotated)
            canvas.beginText()
                  .setFontAndSize(PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD), 10)
                  .setFillColor(ColorConstants.BLACK)
                  .setTextMatrix(chartX - 45, chartY + chartHeight/2 - 20)
                  .showText("Savings")
                  .endText();
            
        } catch (Exception e) {
            System.err.println("Error creating PDF bar chart: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void createDataTable(Document document, PdfFont font, double[][] data) {
        String[] categories = {"RMC", "Spent Acid", "Environment", "Total"};
        
        // Create table with 7 columns as shown in the image
        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 2, 2, 1.5f, 1.5f, 2, 1.5f}));
        table.setWidth(UnitValue.createPercentValue(100));
        table.setMarginTop(30); // Increased margin to ensure separation from chart
        
        // Define colors matching the image
        Color[] categoryColors = {
            new DeviceRgb(31, 78, 121),   // Dark Blue for RMC
            new DeviceRgb(255, 102, 0),   // Orange for Spent Acid
            new DeviceRgb(112, 173, 71),  // Green for Environment  
            new DeviceRgb(91, 155, 213)   // Light Blue for Total
        };
        
        // Dynamic table headers based on current fiscal year and current month - match frontend format
        String currentFY = getCurrentFiscalYear();
        String currentMonth = getCurrentMonth();
        String currentYearShort = String.valueOf(LocalDate.now().getYear()).substring(2);
        String[] headers = {"", 
            "FY'" + currentFY + " Budgeted Saving", 
            "FY'" + currentFY + " Non Budgeted Saving", 
            "Budgeted", 
            "Non-budgeted", 
            "Savings till " + currentMonth + "'" + currentYearShort, 
            "Total"};
        
        // Add header row
        for (String header : headers) {
            com.itextpdf.layout.element.Cell headerCell = new com.itextpdf.layout.element.Cell().add(new Paragraph(header).setFont(font).setFontSize(10).setBold())
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(ColorConstants.LIGHT_GRAY);
            table.addCell(headerCell);
        }
        
        // Add data rows with colored category names
        for (int i = 0; i < categories.length; i++) {
            // Category name with color background
            com.itextpdf.layout.element.Cell categoryCell = new com.itextpdf.layout.element.Cell().add(new Paragraph(categories[i]).setFont(font).setFontSize(10).setBold().setFontColor(ColorConstants.WHITE))
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(categoryColors[i]);
            table.addCell(categoryCell);
            
            // Data cells - values from the processed data
            for (int j = 0; j < 6; j++) {
                String value = String.valueOf((int)data[i][j]);
                com.itextpdf.layout.element.Cell dataCell = new com.itextpdf.layout.element.Cell().add(new Paragraph(value).setFont(font).setFontSize(10))
                    .setTextAlignment(TextAlignment.CENTER);
                table.addCell(dataCell);
            }
        }
        
        document.add(table);
    }
    
    // Dynamic method to get current month in frontend format (Jan, Feb, etc.)
    private String getCurrentMonth() {
        LocalDate now = LocalDate.now();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        return months[now.getMonthValue() - 1]; // getMonthValue() returns 1-12, so subtract 1
    }
    
    
    // Dynamic method to get current fiscal year in frontend format
    private String getCurrentFiscalYear() {
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        // Fiscal year starts from April, so if current month is Jan-Mar, FY is previous year
        if (now.getMonthValue() >= 4) {
            return String.valueOf(year + 1).substring(2); // e.g., "26" for 2026
        } else {
            return String.valueOf(year).substring(2); // e.g., "25" for 2025
        }
    }
    
    // Helper class to hold calculated interval values
    private static class SmartInterval {
        public final double max;
        public final double stepSize;
        
        public SmartInterval(double max, double stepSize) {
            this.max = max;
            this.stepSize = stepSize;
        }
    }
    
    // Dynamic interval calculation - matches frontend calculateSmartInterval function exactly
    private SmartInterval calculateSmartInterval(double maxValue) {
        if (maxValue == 0) {
            return new SmartInterval(1000, 200);
        }
        
        // Add 20% padding to max value for better visualization
        double paddedMax = maxValue * 1.2;
        
        if (paddedMax <= 5000) {
            // For values up to 5000, use intervals of 500 or 1000
            double max = Math.ceil(paddedMax / 1000) * 1000;
            return new SmartInterval(max, max <= 3000 ? 500 : 1000);
        } else if (paddedMax <= 50000) {
            // For values up to 50,000 (50L), use intervals of 5000 or 10000
            double max = Math.ceil(paddedMax / 10000) * 10000;
            return new SmartInterval(max, max <= 30000 ? 5000 : 10000);
        } else if (paddedMax <= 500000) {
            // For values up to 5,00,000 (50L), use intervals of 50000 or 100000
            double max = Math.ceil(paddedMax / 100000) * 100000;
            return new SmartInterval(max, max <= 300000 ? 50000 : 100000);
        } else if (paddedMax <= 10000000) {
            // For values up to 1,00,00,000 (1Cr), use intervals of 1000000 (10L)
            double max = Math.ceil(paddedMax / 1000000) * 1000000;
            return new SmartInterval(max, max <= 5000000 ? 500000 : 1000000);
        } else {
            // For values above 1 crore, use intervals of 10000000 (1Cr) or more
            double max = Math.ceil(paddedMax / 10000000) * 10000000;
            return new SmartInterval(max, max <= 50000000 ? 10000000 : 20000000);
        }
    }
    
    private DNLReportDataDTO getDNLReportData(String site, String period, String year) {
        // Calculate date range based on period and financial year
        String startDate = null;
        String endDate = null;
        
        LocalDate now = LocalDate.now();
        
        // Handle financial year format (convert "25" to 2025)
        int targetYear;
        if (year != null && year.length() == 2) {
            // Convert 2-digit FY to full year (e.g., "22" -> 2022)
            int fyShort = Integer.parseInt(year);
            targetYear = fyShort < 50 ? 2000 + fyShort : 1900 + fyShort; // Assume years < 50 are 20xx
        } else if (year != null) {
            targetYear = Integer.parseInt(year);
        } else {
            // Default to current financial year
            targetYear = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        }
        
        logger.info("DNL Report Data - Input year: {}, Calculated target year: {}", year, targetYear);
        
        switch (period != null ? period.toLowerCase() : "yearly") {
            case "weekly":
                startDate = now.minusWeeks(1).toString().substring(0, 7); // YYYY-MM format
                endDate = now.toString().substring(0, 7);
                break;
            case "monthly":
                startDate = now.minusMonths(1).toString().substring(0, 7);
                endDate = now.toString().substring(0, 7);
                break;
            case "quarterly":
                startDate = now.minusMonths(3).toString().substring(0, 7);
                endDate = now.toString().substring(0, 7);
                break;
            default: // yearly - Financial year period (April to March)
                // Financial year starts in April of target year
                startDate = targetYear + "-04"; // April of FY start year
                
                // Financial year ends in March of next year, but limit to current month if it's current FY
                int currentFY = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
                
                if (targetYear == currentFY) {
                    // For current FY, go till current month
                    if (now.getMonthValue() >= 4) {
                        endDate = String.format("%d-%02d", targetYear, now.getMonthValue());
                    } else {
                        endDate = String.format("%d-%02d", targetYear + 1, now.getMonthValue());
                    }
                } else {
                    // For historical FY, go till March of next year
                    endDate = (targetYear + 1) + "-03";
                }
                break;
        }
        
        logger.info("DNL Report Data - Start Date: {}, End Date: {}", startDate, endDate);
        
        // Get aggregated data from repository - fetching from ACHIEVED_VALUE column
        List<Object[]> monitoringData = monthlyMonitoringEntryRepository.findDNLPlantInitiativesData(site, startDate, endDate);
        List<Object[]> budgetTargets = monthlyMonitoringEntryRepository.findBudgetTargetsByType(site);
        
        logger.info("DNL Report Data - Monitoring data rows: {}, Budget targets rows: {}", 
                   monitoringData != null ? monitoringData.size() : 0,
                   budgetTargets != null ? budgetTargets.size() : 0);
        
        return new DNLReportDataDTO(monitoringData, budgetTargets);
    }
    
    // Public method to expose savings data for API endpoint
    public DNLReportDataDTO getDNLSavingsData(String site, String period, String year) {
        return getDNLReportData(site, period, year);
    }
    
    // Keep existing Excel generation methods with dynamic updates
    public ByteArrayOutputStream generateDNLPlantInitiativesReport(String site, String period, String year) throws IOException {
        // Create workbook
        XSSFWorkbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("DNL - Plant Initiatives");
        
        // Get report data
        DNLReportDataDTO reportData = getDNLReportData(site, period, year);
        
        // Create the report
        createDNLPlantInitiativesSheet(workbook, sheet, reportData, year);
        
        // Write to output stream
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        return outputStream;
    }
    
    // New method to generate DNL Chart PDF with proper PDF generation
    public ByteArrayOutputStream generateDNLChartPDF(String site, String period, String year) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        try {
            // Use iText for proper PDF generation
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Create font
            PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

            // Get report data
            DNLReportDataDTO reportData = getDNLReportData(site, period, year);
            
            // Validate data
            if (reportData == null) {
                throw new IOException("No report data available for the given parameters");
            }

            // Title
            document.add(new Paragraph("DNL - Plant Initiatives Chart")
                .setFont(boldFont)
                .setFontSize(18)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10));

            // Dynamic subtitle with current month and year - match frontend format  
            String titleYear = year != null ? year : String.valueOf(LocalDate.now().getYear());
            document.add(new Paragraph("Initiative saving till " + getCurrentMonth() + " " + titleYear + " (Rs. Lacs)")
                .setFont(boldFont)
                .setFontSize(14)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20));

            // Create visual bar chart and data table
            createVisualChartAndTable(document, pdf, font, boldFont, reportData.getProcessedData());

            // Add metadata for better PDF compatibility
            pdf.getDocumentInfo().setTitle("DNL Plant Initiatives Chart");
            pdf.getDocumentInfo().setAuthor("OpEx Hub System");
            pdf.getDocumentInfo().setCreator("OpEx Hub Report Generator");

            document.close();
            
        } catch (Exception e) {
            throw new IOException("Failed to generate PDF: " + e.getMessage(), e);
        }
        
        return outputStream;
    }
    
    // New method to generate DNL Chart Excel with embedded charts
    public ByteArrayOutputStream generateDNLChartExcel(String site, String period, String year) throws IOException {
        XSSFWorkbook workbook = null;
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        try {
            // Create workbook
            workbook = new XSSFWorkbook();
            
            // Get report data
            DNLReportDataDTO reportData = getDNLReportData(site, period, year);
            
            // Validate data
            if (reportData == null) {
                throw new IOException("No report data available for the given parameters");
            }
            
            // Create chart sheet with embedded charts
            Sheet chartSheet = workbook.createSheet("DNL Chart & Data");
            createDNLChartSheetWithEmbeddedChart(workbook, chartSheet, reportData, year);
            
            // Create raw data sheet
            Sheet dataSheet = workbook.createSheet("Raw Data");
            createRawDataSheet(workbook, dataSheet, reportData, year);
            
            // Set the chart sheet as active
            workbook.setActiveSheet(0);
            
            // Write to output stream
            workbook.write(outputStream);
            
        } catch (Exception e) {
            throw new IOException("Failed to generate Excel with charts: " + e.getMessage(), e);
        } finally {
            if (workbook != null) {
                try {
                    workbook.close();
                } catch (IOException e) {
                    // Log but don't throw - we want to return the data we have
                    System.err.println("Warning: Failed to close workbook: " + e.getMessage());
                }
            }
        }
        
        return outputStream;
    }
    
    private void createDNLPlantInitiativesSheet(XSSFWorkbook workbook, Sheet sheet, DNLReportDataDTO reportData, String year) {
        // Create styles
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        
        // Create colored styles for chart representation
        CellStyle rmcStyle = createColoredStyle(workbook, "1F4E79"); // Dark Blue
        CellStyle spentAcidStyle = createColoredStyle(workbook, "FF6600"); // Orange  
        CellStyle environmentStyle = createColoredStyle(workbook, "70AD47"); // Green
        CellStyle totalStyle = createColoredStyle(workbook, "5B9BD5"); // Light Blue
        
        int rowNum = 0;
        int currentYear = year != null ? Integer.parseInt(year) : LocalDate.now().getYear();
        
        // Title row with current month
        Row titleRow = sheet.createRow(rowNum++);
        org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("DNL - Plant Initiatives");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));
        
        // Dynamic subtitle row - match frontend format exactly
        Row subtitleRow = sheet.createRow(rowNum++);
        org.apache.poi.ss.usermodel.Cell subtitleCell = subtitleRow.createCell(0);
        String titleYear = year != null ? year : String.valueOf(LocalDate.now().getYear());
        subtitleCell.setCellValue("Initiative saving till " + getCurrentMonth() + " " + titleYear + " (Rs. Lacs)");
        subtitleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 6));
        
        // Empty row
        sheet.createRow(rowNum++);
        
        // Chart Area Label
        Row chartLabelRow = sheet.createRow(rowNum++);
        org.apache.poi.ss.usermodel.Cell chartLabelCell = chartLabelRow.createCell(0);
        chartLabelCell.setCellValue("Chart Area");
        chartLabelCell.setCellStyle(createChartLabelStyle(workbook));
        
        // Process data for chart representation
        double[][] data = reportData.getProcessedData();
        String[] categories = {"RMC", "Spent Acid", "Environment", "Total"};
        CellStyle[] categoryStyles = {rmcStyle, spentAcidStyle, environmentStyle, totalStyle};
        
        // Create visual chart representation using cells
        for (int i = 0; i < categories.length; i++) {
            Row chartRow = sheet.createRow(rowNum++);
            
            // Category name
            org.apache.poi.ss.usermodel.Cell categoryCell = chartRow.createCell(0);
            categoryCell.setCellValue(categories[i]);
            categoryCell.setCellStyle(categoryStyles[i]);
            
            // Visual bar representation using total value
            double totalValue = data[i][5]; // Total column
            int barLength = (int) Math.min(10, Math.max(1, totalValue / 100)); // Scale bar length
            
            for (int j = 1; j <= barLength; j++) {
                org.apache.poi.ss.usermodel.Cell barCell = chartRow.createCell(j);
                barCell.setCellValue("█"); // Block character for bar
                barCell.setCellStyle(categoryStyles[i]);
            }
            
            // Add value at the end
            org.apache.poi.ss.usermodel.Cell valueCell = chartRow.createCell(barLength + 2);
            valueCell.setCellValue(totalValue);
            valueCell.setCellStyle(dataStyle);
        }
        
        // Empty rows for spacing
        sheet.createRow(rowNum++);
        sheet.createRow(rowNum++);
        
        // Dynamic headers for data table with current fiscal year and month
        Row headerRow = sheet.createRow(rowNum++);
        String currentFY = getCurrentFiscalYear();
        String currentMonth = getCurrentMonth();
        String currentYearShort = String.valueOf(LocalDate.now().getYear()).substring(2);
        String[] headers = {"Category", 
            "FY'" + currentFY + " Budgeted Saving", 
            "FY'" + currentFY + " Non Budgeted Saving", 
            "Budgeted", 
            "Non-budgeted", 
            "Savings till " + currentMonth + "'" + currentYearShort, 
            "Total"};
        
        for (int i = 0; i < headers.length; i++) {
            org.apache.poi.ss.usermodel.Cell headerCell = headerRow.createCell(i);
            headerCell.setCellValue(headers[i]);
            headerCell.setCellStyle(headerStyle);
        }
        
        // Process data and create table rows with colors
        for (int i = 0; i < categories.length; i++) {
            Row dataRow = sheet.createRow(rowNum++);
            
            // Category name with color
            org.apache.poi.ss.usermodel.Cell categoryCell = dataRow.createCell(0);
            categoryCell.setCellValue(categories[i]);
            categoryCell.setCellStyle(categoryStyles[i]);
            
            // Data values
            for (int j = 0; j < 6; j++) {
                org.apache.poi.ss.usermodel.Cell cell = dataRow.createCell(j + 1);
                cell.setCellValue(data[i][j]);
                if (j == 5) { // Total column
                    cell.setCellStyle(categoryStyles[i]);
                } else {
                    cell.setCellStyle(dataStyle);
                }
            }
        }
        
        // Auto-size columns
        for (int i = 0; i < 12; i++) {
            sheet.autoSizeColumn(i);
        }
    }
    
    // New method to create chart data sheet for PDF export
    private void createDNLChartDataSheet(XSSFWorkbook workbook, Sheet sheet, DNLReportDataDTO reportData, String year) {
        // Create styles
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        
        // Create colored styles for chart categories
        CellStyle rmcStyle = createColoredStyle(workbook, "1F4E79"); // Dark Blue
        CellStyle spentAcidStyle = createColoredStyle(workbook, "FF6600"); // Orange  
        CellStyle environmentStyle = createColoredStyle(workbook, "70AD47"); // Green
        CellStyle totalStyle = createColoredStyle(workbook, "5B9BD5"); // Light Blue
        
        int rowNum = 0;
        int currentYear = year != null ? Integer.parseInt(year) : LocalDate.now().getYear();
        
        // Title row
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("DNL - Plant Initiatives Chart Export");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));
        
        // Dynamic subtitle row - match frontend format exactly
        Row subtitleRow = sheet.createRow(rowNum++);
        Cell subtitleCell = subtitleRow.createCell(0);
        String titleYear = year != null ? year : String.valueOf(LocalDate.now().getYear());
        subtitleCell.setCellValue("Initiative saving till " + getCurrentMonth() + " " + titleYear + " (Rs. Lacs)");
        subtitleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 6));
        
        // Process data for chart
        double[][] data = reportData.getProcessedData();
        String[] categories = {"RMC", "Spent Acid", "Environment", "Total"};
        CellStyle[] categoryStyles = {rmcStyle, spentAcidStyle, environmentStyle, totalStyle};
        
        // Create data table for chart
        rowNum += 2; // Add some spacing
        Row headerRow = sheet.createRow(rowNum++);
        String currentFY = getCurrentFiscalYear();
        String currentMonth = getCurrentMonth();
        String currentYearShort = String.valueOf(LocalDate.now().getYear()).substring(2);
        String[] headers = {"Category", 
            "FY'" + currentFY + " Budgeted Saving", 
            "FY'" + currentFY + " Non Budgeted Saving", 
            "Budgeted", 
            "Non-budgeted", 
            "Savings till " + currentMonth + "'" + currentYearShort, 
            "Total"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell headerCell = headerRow.createCell(i);
            headerCell.setCellValue(headers[i]);
            headerCell.setCellStyle(headerStyle);
        }
        
        // Add data rows
        for (int i = 0; i < categories.length; i++) {
            Row dataRow = sheet.createRow(rowNum++);
            
            Cell categoryCell = dataRow.createCell(0);
            categoryCell.setCellValue(categories[i]);
            categoryCell.setCellStyle(categoryStyles[i]);
            
            for (int j = 0; j < 6; j++) {
                Cell cell = dataRow.createCell(j + 1);
                cell.setCellValue(data[i][j]);
                if (j == 5) { // Total column
                    cell.setCellStyle(categoryStyles[i]);
                } else {
                    cell.setCellStyle(dataStyle);
                }
            }
        }
        
        // Auto-size columns
        for (int i = 0; i < 7; i++) {
            sheet.autoSizeColumn(i);
        }
    }
    
    // New method to create enhanced chart sheet for Excel export
    private void createDNLChartSheet(XSSFWorkbook workbook, Sheet sheet, DNLReportDataDTO reportData, String year) {
        // Create styles
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        
        // Create colored styles for chart representation
        CellStyle rmcStyle = createColoredStyle(workbook, "1F4E79"); // Dark Blue
        CellStyle spentAcidStyle = createColoredStyle(workbook, "FF6600"); // Orange  
        CellStyle environmentStyle = createColoredStyle(workbook, "70AD47"); // Green
        CellStyle totalStyle = createColoredStyle(workbook, "5B9BD5"); // Light Blue
        
        int rowNum = 0;
        int currentYear = year != null ? Integer.parseInt(year) : LocalDate.now().getYear();
        
        // Title row
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("DNL - Plant Initiatives");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));
        
        // Dynamic subtitle row - match frontend format exactly
        Row subtitleRow = sheet.createRow(rowNum++);
        Cell subtitleCell = subtitleRow.createCell(0);
        String titleYear = year != null ? year : String.valueOf(LocalDate.now().getYear());
        subtitleCell.setCellValue("Initiative saving till " + getCurrentMonth() + " " + titleYear + " (Rs. Lacs)");
        subtitleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 10));
        
        // Empty row
        sheet.createRow(rowNum++);
        
        // Chart representation section
        Row chartLabelRow = sheet.createRow(rowNum++);
        Cell chartLabelCell = chartLabelRow.createCell(0);
        chartLabelCell.setCellValue("Bar Chart Representation");
        chartLabelCell.setCellStyle(createChartLabelStyle(workbook));
        
        // Process data for chart representation
        double[][] data = reportData.getProcessedData();
        String[] categories = {"RMC", "Spent Acid", "Environment", "Total"};
        CellStyle[] categoryStyles = {rmcStyle, spentAcidStyle, environmentStyle, totalStyle};
        
        // Create visual bar chart representation using cells
        for (int i = 0; i < categories.length; i++) {
            Row chartRow = sheet.createRow(rowNum++);
            
            // Category name
            Cell categoryCell = chartRow.createCell(0);
            categoryCell.setCellValue(categories[i]);
            categoryCell.setCellStyle(categoryStyles[i]);
            
            // Create bars for different data points
            double budgetedValue = data[i][2]; // Budgeted
            double nonBudgetedValue = data[i][3]; // Non-budgeted
            double totalValue = data[i][5]; // Total
            
            // Scale the bars (divide by 50 to fit in cells)
            int budgetedBars = Math.max(1, (int)(budgetedValue / 50));
            int nonBudgetedBars = Math.max(1, (int)(nonBudgetedValue / 50));
            
            // Draw budgeted bars
            for (int j = 1; j <= budgetedBars && j <= 5; j++) {
                Cell barCell = chartRow.createCell(j);
                barCell.setCellValue("█");
                barCell.setCellStyle(categoryStyles[i]);
            }
            
            // Add values at the end
            Cell valueCell = chartRow.createCell(8);
            valueCell.setCellValue(String.format("B: %.0f, NB: %.0f, Total: %.0f", budgetedValue, nonBudgetedValue, totalValue));
            valueCell.setCellStyle(dataStyle);
        }
        
        // Empty rows for spacing
        sheet.createRow(rowNum++);
        sheet.createRow(rowNum++);
        
        // Data table section
        Row headerRow = sheet.createRow(rowNum++);
        String currentFY = getCurrentFiscalYear();
        String currentMonth = getCurrentMonth();
        String currentYearShort = String.valueOf(LocalDate.now().getYear()).substring(2);
        String[] headers = {"Category", 
            "FY'" + currentFY + " Budgeted Saving", 
            "FY'" + currentFY + " Non Budgeted Saving", 
            "Budgeted", 
            "Non-budgeted", 
            "Savings till " + currentMonth + "'" + currentYearShort, 
            "Total"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell headerCell = headerRow.createCell(i);
            headerCell.setCellValue(headers[i]);
            headerCell.setCellStyle(headerStyle);
        }
        
        // Add data rows with colors
        for (int i = 0; i < categories.length; i++) {
            Row dataRow = sheet.createRow(rowNum++);
            
            Cell categoryCell = dataRow.createCell(0);
            categoryCell.setCellValue(categories[i]);
            categoryCell.setCellStyle(categoryStyles[i]);
            
            for (int j = 0; j < 6; j++) {
                Cell cell = dataRow.createCell(j + 1);
                cell.setCellValue(data[i][j]);
                if (j == 5) { // Total column
                    cell.setCellStyle(categoryStyles[i]);
                } else {
                    cell.setCellStyle(dataStyle);
                }
            }
        }
        
        // Auto-size columns
        for (int i = 0; i < 12; i++) {
            sheet.autoSizeColumn(i);
        }
    }
    
    private CellStyle createColoredStyle(XSSFWorkbook workbook, String hexColor) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        
        // Set background color using indexed colors for better compatibility
        IndexedColors bgColor;
        switch(hexColor) {
            case "1F4E79": // Dark Blue for RMC
                bgColor = IndexedColors.DARK_BLUE;
                break;
            case "FF6600": // Orange for Spent Acid
                bgColor = IndexedColors.ORANGE;
                break;
            case "70AD47": // Green for Environment
                bgColor = IndexedColors.GREEN;
                break;
            case "5B9BD5": // Light Blue for Total
                bgColor = IndexedColors.LIGHT_BLUE;
                break;
            default:
                bgColor = IndexedColors.GREY_25_PERCENT;
                break;
        }
        
        style.setFillForegroundColor(bgColor.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        // Add borders
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // Center alignment
        style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        return style;
    }
    
    private CellStyle createChartLabelStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    public ByteArrayOutputStream generateDetailedExcelReport(String site, String year) throws IOException {
        // Create workbook
        XSSFWorkbook workbook = new XSSFWorkbook();
        
        // Define months dynamically based on fiscal year
        String[] months = generateMonthsForFiscalYear(year);
        
        // Get current date for filtering (if year is specified)
        LocalDate currentDate = LocalDate.now();
        int filterYear = year != null ? Integer.parseInt(year) : currentDate.getYear();
        
        // Get initiatives data
        List<Initiative> initiatives;
        if (site != null && !site.equals("all")) {
            initiatives = initiativeRepository.findBySite(site, null).getContent();
        } else {
            initiatives = initiativeRepository.findAll();
        }
        
        // Create each monthly sheet
        for (String month : months) {
            createMonthlySheet(workbook, month, initiatives, filterYear);
        }
        
        // Write to output stream
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        return outputStream;
    }
    
    // Dynamic method to generate months for fiscal year
    private String[] generateMonthsForFiscalYear(String year) {
        LocalDate now = LocalDate.now();
        int currentYear = year != null ? Integer.parseInt(year) : now.getYear();
        
        // For Indian fiscal year (April to March)
        return new String[] {
            "Apr." + String.valueOf(currentYear).substring(2), 
            "May." + String.valueOf(currentYear).substring(2), 
            "June." + String.valueOf(currentYear).substring(2), 
            "Jul." + String.valueOf(currentYear).substring(2), 
            "Aug." + String.valueOf(currentYear).substring(2), 
            "Sept." + String.valueOf(currentYear).substring(2),
            "Oct." + String.valueOf(currentYear).substring(2), 
            "Nov." + String.valueOf(currentYear).substring(2), 
            "Dec." + String.valueOf(currentYear).substring(2), 
            "Jan." + String.valueOf(currentYear + 1).substring(2), 
            "Feb." + String.valueOf(currentYear + 1).substring(2), 
            "Mar." + String.valueOf(currentYear + 1).substring(2)
        };
    }
    
    private void createMonthlySheet(XSSFWorkbook workbook, String monthName, List<Initiative> initiatives, int filterYear) {
        Sheet sheet = workbook.createSheet(monthName);
        
        // Create styles
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        CellStyle dateStyle = createDateStyle(workbook);
        
        // Set column widths - Updated to accommodate selected fields (23 columns)
        sheet.setColumnWidth(0, 2500);  // Sr. No. (Column A)
        sheet.setColumnWidth(1, 6000);  // Description (Column B)
        sheet.setColumnWidth(2, 3000);  // Category (Column C)
        sheet.setColumnWidth(3, 4000);  // Initiative No. (Column D)
        sheet.setColumnWidth(4, 3000);  // Initiation Date (Column E)
        sheet.setColumnWidth(5, 3500);  // Initiative Leader (Column F)
        sheet.setColumnWidth(6, 3000);  // Target Date (Column G)
        sheet.setColumnWidth(7, 4000);  // Modification/CAPEX Cost (Column H)
        sheet.setColumnWidth(8, 3500);  // Current Status (Column I)
        sheet.setColumnWidth(9, 4000);  // Expected Savings (Column J)
        sheet.setColumnWidth(10, 4000); // Actual Savings (Column K)
        sheet.setColumnWidth(11, 4500); // Annualized Value (Column L)
        sheet.setColumnWidth(12, 3000); // Budget Type (Column M)
        sheet.setColumnWidth(13, 3000); // Site (Column N)
        sheet.setColumnWidth(14, 3500); // Discipline (Column O)
        sheet.setColumnWidth(15, 3000); // Stage (Column P)
        sheet.setColumnWidth(16, 3000); // Requires MOC (Column Q)
        sheet.setColumnWidth(17, 3000); // Requires CAPEX (Column R)
        sheet.setColumnWidth(18, 4000); // MOC Number (Column S)
        sheet.setColumnWidth(19, 4000); // CAPEX Number (Column T)
        sheet.setColumnWidth(20, 4000); // Target Value (Column U)
        sheet.setColumnWidth(21, 3000); // Created Date (Column V)
        sheet.setColumnWidth(22, 3000); // Updated Date (Column W)
        
        int rowNum = 0;
        
        // Row 1 (A1): Title - INITIATIVE TRACKER SHEET
        Row titleRow = sheet.createRow(rowNum++);
        org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("INITIATIVE TRACKER SHEET");
        titleCell.setCellStyle(titleStyle);
        // Merge cells A1 to W1 for title
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 22));
        
        // Row 2: Empty
        Row emptyRow1 = sheet.createRow(rowNum++);
        
        // Row 3 (A3): Dynamic tracker updated date
        Row dateRow = sheet.createRow(rowNum++);
        org.apache.poi.ss.usermodel.Cell dateLabelCell = dateRow.createCell(0);
        dateLabelCell.setCellValue("Tracker updated on Date:");
        dateLabelCell.setCellStyle(dateStyle);
        
        // Add current date in next cell (B3)
        org.apache.poi.ss.usermodel.Cell currentDateCell = dateRow.createCell(1);
        currentDateCell.setCellValue(LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));
        currentDateCell.setCellStyle(dateStyle);
        
        // Add form reference in the right corner (W3)
        org.apache.poi.ss.usermodel.Cell formRefCell = dateRow.createCell(22);
        formRefCell.setCellValue("(CRP-002/F4-01)");
        formRefCell.setCellStyle(dateStyle);
        
        // Row 4: Empty
        Row emptyRow2 = sheet.createRow(rowNum++);
        
        // Row 5 (A5): Headers starting from column A - Excluding remarks, priority, progress, confidence level
        Row headerRow = sheet.createRow(rowNum++);
        String[] headers = {
            "Sr. No.", "Description of Initiative", "Category", "Initiative No.", 
            "Initiation Date", "Initiative Leader", "Target Date", "Modification or CAPEX Cost", 
            "Current Status", "Expected Savings", "Actual Savings", "Annualized Value FY" + getCurrentFiscalYear() + "-" + (Integer.parseInt(getCurrentFiscalYear()) + 1), 
            "Budget Type", "Site", "Discipline", "Current Stage", 
            "Requires MOC", "Requires CAPEX", "MOC Number", "CAPEX Number", "Target Value", 
            "Created Date", "Updated Date"
        };
        
        for (int i = 0; i < headers.length; i++) {
            org.apache.poi.ss.usermodel.Cell headerCell = headerRow.createCell(i);
            headerCell.setCellValue(headers[i]);
            headerCell.setCellStyle(headerStyle);
        }
        
        // Add data rows starting from Row 6 (A6) - Excluding remarks, priority, progress, confidence level
        int dataRowNum = 1;
        for (Initiative initiative : initiatives) {
            Row dataRow = sheet.createRow(rowNum++);
            
            // Sr. No. (Column A)
            dataRow.createCell(0).setCellValue(dataRowNum++);
            
            // Description of Initiative (Column B)
            dataRow.createCell(1).setCellValue(initiative.getTitle() != null ? initiative.getTitle() : "");
            
            // Category (Discipline) (Column C)
            dataRow.createCell(2).setCellValue(initiative.getDiscipline() != null ? initiative.getDiscipline() : "");
            
            // Initiative No. (Column D)
            dataRow.createCell(3).setCellValue(initiative.getInitiativeNumber() != null ? initiative.getInitiativeNumber() : "");
            
            // Initiation Date (Column E)
            if (initiative.getStartDate() != null) {
                dataRow.createCell(4).setCellValue(initiative.getStartDate().toString());
            }
            
            // Initiative Leader (from initiator or created by) (Column F)
            String initiativeLeader = "";
            if (initiative.getInitiatorName() != null && !initiative.getInitiatorName().isEmpty()) {
                initiativeLeader = initiative.getInitiatorName();
            } else if (initiative.getCreatedBy() != null) {
                initiativeLeader = initiative.getCreatedBy().getFullName();
            }
            dataRow.createCell(5).setCellValue(initiativeLeader);
            
            // Target Date (Column G)
            if (initiative.getEndDate() != null) {
                dataRow.createCell(6).setCellValue(initiative.getEndDate().toString());
            }
            
            // Modification or CAPEX Cost (Column H)
            if (initiative.getEstimatedCapex() != null) {
                dataRow.createCell(7).setCellValue(initiative.getEstimatedCapex().doubleValue());
            }
            
            // Current Status (Column I)
            dataRow.createCell(8).setCellValue(initiative.getStatus() != null ? initiative.getStatus() : "");
            
            // Expected Savings (Column J)
            if (initiative.getExpectedSavings() != null) {
                dataRow.createCell(9).setCellValue(initiative.getExpectedSavings().doubleValue());
            }
            
            // Actual Savings (Column K)
            if (initiative.getActualSavings() != null) {
                dataRow.createCell(10).setCellValue(initiative.getActualSavings().doubleValue());
            }
            
            // Annualized Value (Expected Savings if no actual savings) (Column L)
            if (initiative.getActualSavings() != null) {
                dataRow.createCell(11).setCellValue(initiative.getActualSavings().doubleValue());
            } else if (initiative.getExpectedSavings() != null) {
                dataRow.createCell(11).setCellValue(initiative.getExpectedSavings().doubleValue());
            }
            
            // Budget Type (Column M)
            dataRow.createCell(12).setCellValue(initiative.getBudgetType() != null ? initiative.getBudgetType() : "Budgeted");
            
            // Site (Column N)
            dataRow.createCell(13).setCellValue(initiative.getSite() != null ? initiative.getSite() : "");
            
            // Discipline (Column O)
            dataRow.createCell(14).setCellValue(initiative.getDiscipline() != null ? initiative.getDiscipline() : "");
            
            // Current Stage (Column P)
            String stageName = getStageName(initiative.getCurrentStage());
            dataRow.createCell(15).setCellValue(stageName);
            
            // Requires MOC (Column Q)
            dataRow.createCell(16).setCellValue(initiative.getRequiresMoc() != null ? initiative.getRequiresMoc() : "N");
            
            // Requires CAPEX (Column R)
            dataRow.createCell(17).setCellValue(initiative.getRequiresCapex() != null ? initiative.getRequiresCapex() : "N");
            
            // MOC Number (Column S)
            dataRow.createCell(18).setCellValue(initiative.getMocNumber() != null ? initiative.getMocNumber() : "");
            
            // CAPEX Number (Column T)
            dataRow.createCell(19).setCellValue(initiative.getCapexNumber() != null ? initiative.getCapexNumber() : "");
            
            // Target Value (Column U)
            if (initiative.getTargetValue() != null) {
                dataRow.createCell(20).setCellValue(initiative.getTargetValue().doubleValue());
            }
            
            // Created Date (Column V)
            if (initiative.getCreatedAt() != null) {
                dataRow.createCell(21).setCellValue(initiative.getCreatedAt().toLocalDate().toString());
            }
            
            // Updated Date (Column W)
            if (initiative.getUpdatedAt() != null) {
                dataRow.createCell(22).setCellValue(initiative.getUpdatedAt().toLocalDate().toString());
            }
            
            // Apply data style to all cells
            for (int i = 0; i < 23; i++) {
                org.apache.poi.ss.usermodel.Cell cell = dataRow.getCell(i);
                if (cell != null) {
                    cell.setCellStyle(dataStyle);
                }
            }
        }
        
        // Add empty rows to match template (ensure at least 20 empty rows for data entry)
        int minRows = Math.max(25, rowNum + 15); // At least 25 rows total
        while (rowNum < minRows) {
            Row emptyDataRow = sheet.createRow(rowNum++);
            // Create empty cells with borders - Updated to 23 columns
            for (int i = 0; i < 23; i++) {
                org.apache.poi.ss.usermodel.Cell emptyCell = emptyDataRow.createCell(i);
                emptyCell.setCellValue("");
                emptyCell.setCellStyle(dataStyle);
            }
        }
    }
    
    private String getStageName(Integer stageNumber) {
        if (stageNumber == null) return "Register Initiative";
        
        switch (stageNumber) {
            case 1: return "Register Initiative";
            case 2: return "Approval";
            case 3: return "Define Responsibilities";
            case 4: return "MOC Stage";
            case 5: return "CAPEX Stage";
            case 6: return "Initiative Timeline Tracker";
            case 7: return "Trial Implementation & Performance Check";
            case 8: return "Periodic Status Review with CMO";
            case 9: return "Savings Monitoring (1 Month)";
            case 10: return "Saving Validation with F&A";
            case 11: return "Initiative Closure";
            default: return "Register Initiative";
        }
    }
    
    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        
        // Add borders
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // Center alignment
        style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        // Background color (light gray)
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        return style;
    }
    
    private CellStyle createTitleStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
        return style;
    }
    
    private CellStyle createDataStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        
        // Add borders
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // Left alignment for text
        style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        return style;
    }
    
    private CellStyle createDateStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    // New method to create Excel sheet with actual embedded charts
    private void createDNLChartSheetWithEmbeddedChart(XSSFWorkbook workbook, Sheet sheet, DNLReportDataDTO reportData, String year) {
        // Create styles
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        
        // Create colored styles for chart representation
        CellStyle rmcStyle = createColoredStyle(workbook, "1F4E79"); // Dark Blue
        CellStyle spentAcidStyle = createColoredStyle(workbook, "FF6600"); // Orange  
        CellStyle environmentStyle = createColoredStyle(workbook, "70AD47"); // Green
        CellStyle totalStyle = createColoredStyle(workbook, "5B9BD5"); // Light Blue
        
        int rowNum = 0;
        int currentYear = year != null ? Integer.parseInt(year) : LocalDate.now().getYear();
        
        // Title row
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("DNL - Plant Initiatives");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));
        
        // Dynamic subtitle row - match frontend format exactly
        Row subtitleRow = sheet.createRow(rowNum++);
        Cell subtitleCell = subtitleRow.createCell(0);
        String titleYear = year != null ? year : String.valueOf(LocalDate.now().getYear());
        subtitleCell.setCellValue("Initiative saving till " + getCurrentMonth() + " " + titleYear + " (Rs. Lacs)");
        subtitleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 10));
        
        // Empty row for spacing
        rowNum += 2;
        
        // Process data for chart representation
        double[][] data = reportData.getProcessedData();
        String[] categories = {"RMC", "Spent Acid", "Environment", "Total"};
        CellStyle[] categoryStyles = {rmcStyle, spentAcidStyle, environmentStyle, totalStyle};
        
        // Create data table for chart
        Row headerRow = sheet.createRow(rowNum++);
        String currentFY = getCurrentFiscalYear();
        String currentMonth = getCurrentMonth();
        String currentYearShort = String.valueOf(LocalDate.now().getYear()).substring(2);
        
        // Match frontend time periods exactly
        String[] headers = {"Category", 
            "FY'" + currentFY + " Budgeted Saving", 
            "FY'" + currentFY + " Non Budgeted Saving", 
            "Budgeted", 
            "Non-budgeted", 
            "Savings till " + currentMonth + "'" + currentYearShort, 
            "Total"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell headerCell = headerRow.createCell(i);
            headerCell.setCellValue(headers[i]);
            headerCell.setCellStyle(headerStyle);
        }
        
        // Add data rows with colors
        for (int i = 0; i < categories.length; i++) {
            Row dataRow = sheet.createRow(rowNum++);
            
            Cell categoryCell = dataRow.createCell(0);
            categoryCell.setCellValue(categories[i]);
            categoryCell.setCellStyle(categoryStyles[i]);
            
            for (int j = 0; j < 6; j++) {
                Cell cell = dataRow.createCell(j + 1);
                cell.setCellValue(data[i][j]);
                if (j == 5) { // Total column
                    cell.setCellStyle(categoryStyles[i]);
                } else {
                    cell.setCellStyle(dataStyle);
                }
            }
        }
        
        // Add spacing rows before chart
        rowNum += 2;
        Row spacingRow1 = sheet.createRow(rowNum++);
        Row spacingRow2 = sheet.createRow(rowNum++);
        
        // Add chart label
        Row chartLabelRow = sheet.createRow(rowNum++);
        Cell chartLabelCell = chartLabelRow.createCell(0);
        chartLabelCell.setCellValue("Bar Chart Visualization");
        chartLabelCell.setCellStyle(createChartLabelStyle(workbook));
        
        // Create actual Excel bar chart
        createExcelBarChart(workbook, sheet, data, rowNum);
        
        // Auto-size columns
        for (int i = 0; i < 7; i++) {
            sheet.autoSizeColumn(i);
        }
    }
    
    // Method to create actual Excel bar chart
    private void createExcelBarChart(XSSFWorkbook workbook, Sheet sheet, double[][] data, int startRow) {
        try {
            XSSFDrawing drawing = (XSSFDrawing) sheet.createDrawingPatriarch();
            
            // Create chart anchor - position and size (properly sized chart)
            XSSFClientAnchor anchor = drawing.createAnchor(0, 0, 0, 0, 1, startRow + 1, 9, startRow + 18);
            
            // Create chart
            XSSFChart chart = drawing.createChart(anchor);
            chart.setTitleText("DNL Plant Initiatives - Savings by Category (Rs. Lacs)");
            chart.setTitleOverlay(false);
            
            // Create data for the chart
            String[] categories = {"RMC", "Spent Acid", "Environment", "Total"};
            String currentFY = getCurrentFiscalYear();
            String currentMonth = getCurrentMonth();
            String currentYearShort = String.valueOf(LocalDate.now().getYear()).substring(2);
            
            // Match frontend time periods exactly
            String[] periods = {
                "FY'" + currentFY + " Budgeted Saving",
                "FY'" + currentFY + " Non Budgeted Saving", 
                "Budgeted",
                "Non-budgeted",
                "Savings till " + currentMonth + "'" + currentYearShort,
                "Total"
            };
            
            // Create chart legend
            XDDFChartLegend legend = chart.getOrAddLegend();
            legend.setPosition(LegendPosition.BOTTOM);
            
            // Create category axis (X-axis)
            XDDFCategoryAxis bottomAxis = chart.createCategoryAxis(AxisPosition.BOTTOM);
            bottomAxis.setTitle("Time Periods");
            
            // Calculate dynamic intervals based on actual data - matches frontend logic
            double maxValue = 0;
            for (int i = 0; i < data.length; i++) {
                for (int j = 0; j < data[i].length; j++) {
                    if (data[i][j] > maxValue) {
                        maxValue = data[i][j];
                    }
                }
            }
            
            SmartInterval interval = calculateSmartInterval(maxValue);
            
            // Create value axis (Y-axis) with dynamic scaling
            XDDFValueAxis leftAxis = chart.createValueAxis(AxisPosition.LEFT);
            leftAxis.setTitle("Savings (Rs. Lacs)");
            leftAxis.setMinimum(0.0);
            leftAxis.setMaximum(interval.max);
            
            // Add major grid lines with dynamic intervals
            leftAxis.setMajorUnit(interval.stepSize);
            leftAxis.setMinorUnit(interval.stepSize / 5.0); // Minor units are 1/5 of major units
            
            // Create data sources for periods (X-axis labels)
            XDDFDataSource<String> periodDataSource = XDDFDataSourcesFactory.fromArray(periods);
            
            // Create bar chart data
            XDDFChartData chartData = chart.createData(ChartTypes.BAR, bottomAxis, leftAxis);
            
            // Add data series for each category
            for (int categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
                // Extract values for this category across all periods
                Double[] values = new Double[Math.min(periods.length, data[categoryIndex].length)];
                for (int periodIndex = 0; periodIndex < values.length; periodIndex++) {
                    values[periodIndex] = data[categoryIndex][periodIndex];
                }
                
                XDDFNumericalDataSource<Double> valuesDataSource = XDDFDataSourcesFactory.fromArray(values);
                XDDFChartData.Series series = chartData.addSeries(periodDataSource, valuesDataSource);
                series.setTitle(categories[categoryIndex], null);
            }
            
            // Plot the chart
            chart.plot(chartData);
            
            // Set bar chart direction to column (vertical bars)
            if (chartData instanceof XDDFBarChartData) {
                XDDFBarChartData barChartData = (XDDFBarChartData) chartData;
                barChartData.setBarDirection(BarDirection.COL);
                barChartData.setBarGrouping(BarGrouping.CLUSTERED);
            }
            
            // Enable major gridlines for better readability like in reference image
            chart.getCTChart().getPlotArea().getValAxArray(0).addNewMajorGridlines();
            
            // Note: Chart will use default Excel colors which are visually distinct
            // Custom colors in Apache POI require complex configuration, using defaults for compatibility
            
        } catch (Exception e) {
            System.err.println("Error creating Excel bar chart: " + e.getMessage());
            e.printStackTrace();
            
            // Add a note if chart creation fails
            Row noteRow = sheet.createRow(startRow);
            Cell noteCell = noteRow.createCell(0);
            noteCell.setCellValue("Chart creation failed. Please use the data table above to create charts manually.");
        }
    }
    
    // Method to create raw data sheet
    private void createRawDataSheet(XSSFWorkbook workbook, Sheet sheet, DNLReportDataDTO reportData, String year) {
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        
        int rowNum = 0;
        
        // Header
        Row headerRow = sheet.createRow(rowNum++);
        String[] rawHeaders = {"Category", "Budget Type", "Achieved Value", "Notes"};
        
        for (int i = 0; i < rawHeaders.length; i++) {
            Cell headerCell = headerRow.createCell(i);
            headerCell.setCellValue(rawHeaders[i]);
            headerCell.setCellStyle(headerStyle);
        }
        
        // Add raw monitoring data if available
        if (reportData.getMonitoringData() != null) {
            for (Object[] rowData : reportData.getMonitoringData()) {
                Row dataRow = sheet.createRow(rowNum++);
                
                for (int i = 0; i < Math.min(rowData.length, 3); i++) {
                    Cell cell = dataRow.createCell(i);
                    if (rowData[i] != null) {
                        cell.setCellValue(rowData[i].toString());
                    }
                    cell.setCellStyle(dataStyle);
                }
                
                // Add notes column
                Cell notesCell = dataRow.createCell(3);
                notesCell.setCellValue("Raw data from monitoring entries");
                notesCell.setCellStyle(dataStyle);
            }
        }
        
        // Auto-size columns
        for (int i = 0; i < 4; i++) {
            sheet.autoSizeColumn(i);
        }
    }
    
    public ByteArrayOutputStream generateInitiativeForm(String initiativeId) throws IOException {
        // Get initiative data
        Long id = Long.parseLong(initiativeId);
        Initiative initiative = initiativeRepository.findById(id).orElse(null);
        
        if (initiative == null) {
            throw new IllegalArgumentException("Initiative not found with ID: " + initiativeId);
        }
        
        // Create Word document
        XWPFDocument document = new XWPFDocument();
        
        // Add title with logo beside it
        addLogoAndTitleToDocument(document);
        
        document.createParagraph(); // Empty line
        
        // Create main form table
        XWPFTable formTable = document.createTable();
        formTable.setWidth("100%");
        
        // Remove default row
        formTable.removeRow(0);
        
        // Initiative Title
        createFormRow(formTable, "Initiative Title:", initiative.getTitle() != null ? initiative.getTitle() : "");
        
        // Initiative Number
        createFormRow(formTable, "Initiative Number:", initiative.getInitiativeNumber() != null ? initiative.getInitiativeNumber() : "");
        
        // Initiator Name
        String initiatorName = "";
        if (initiative.getInitiatorName() != null && !initiative.getInitiatorName().isEmpty()) {
            initiatorName = initiative.getInitiatorName();
        } else if (initiative.getCreatedBy() != null) {
            initiatorName = initiative.getCreatedBy().getFullName();
        }
        createFormRow(formTable, "Initiator Name:", initiatorName);
        
        // Site
        createFormRow(formTable, "Site:", initiative.getSite() != null ? initiative.getSite() : "");
        
        // Date
        createFormRow(formTable, "Date:", initiative.getStartDate() != null ? initiative.getStartDate().toString() : "");
        
        // Description of Initiative
        createFormRow(formTable, "Description of Initiative:", initiative.getDescription() != null ? initiative.getDescription() : "Summary of what the initiative entails");
        
        // Baseline
        createFormRow(formTable, "Baseline:", initiative.getBaselineData() != null ? initiative.getBaselineData() : "Annualized basis of last 12 months of un-deviated operational data");
        
        // Target
        createFormRow(formTable, "Target:", initiative.getTargetOutcome() != null ? initiative.getTargetOutcome() : "Time bound specific and measurable desired outcome (e.g., cost savings, efficiency gains)");
        
        // Expected Value
        String expectedValue = "";
        if (initiative.getExpectedSavings() != null) {
            expectedValue = "₹" + initiative.getExpectedSavings().toString();
            // expectedValue = "Expected value is multiple of Annual financial benefit and percent confidence level of achieving that benefit";
        }
        createFormRow(formTable, "Expected Value:", expectedValue);
        
        // 3 Key Assumptions
        String assumptions = "";
        if (initiative.getAssumption1() != null || initiative.getAssumption2() != null || initiative.getAssumption3() != null) {
            assumptions = "1. " + (initiative.getAssumption1() != null ? initiative.getAssumption1() : "Quantum of Processed volume") + "\n";
            assumptions += "2. " + (initiative.getAssumption2() != null ? initiative.getAssumption2() : "Pricing of baseline") + "\n";
            assumptions += "3. " + (initiative.getAssumption3() != null ? initiative.getAssumption3() : "Technology or Process continuity");
        } else {
            assumptions = "1. Quantum of Processed volume\n2. Pricing of baseline\n3. Technology or Process continuity";
        }
        createFormRow(formTable, "3 Key Assumptions:", assumptions);
        
        // Estimated CAPEX
        String capex = "";
        if (initiative.getEstimatedCapex() != null) {
            capex = "₹" + initiative.getEstimatedCapex().toString();
        }
        createFormRow(formTable, "Estimated CAPEX:", capex);
        
        document.createParagraph(); // Empty line
        
        // Add note
        XWPFParagraph notePara = document.createParagraph();
        XWPFRun noteRun = notePara.createRun();
        noteRun.setItalic(true);
        noteRun.setFontSize(10);
        noteRun.setText("(*Wherever required corresponding data to be attached.)");
        
        document.createParagraph(); // Empty line
        
        // Create signature table
        XWPFTable signatureTable = document.createTable();
        signatureTable.setWidth("100%");
        
        // Remove default row
        signatureTable.removeRow(0);
        
        // Header row
        XWPFTableRow headerRow = signatureTable.createRow();
        // Ensure we have enough cells for the header
        while (headerRow.getTableCells().size() < 5) {
            headerRow.addNewTableCell();
        }
        setCellText(headerRow.getCell(0), "", true); // Empty cell for row labels
        setCellText(headerRow.getCell(1), "Name", true);
        setCellText(headerRow.getCell(2), "Designation", true);
        setCellText(headerRow.getCell(3), "Sign", true);
        setCellText(headerRow.getCell(4), "Date", true);
        
        // Initiated by row
        XWPFTableRow initiatedRow = signatureTable.createRow();
        // Ensure we have enough cells before accessing them
        while (initiatedRow.getTableCells().size() < 5) {
            initiatedRow.addNewTableCell();
        }
        setCellText(initiatedRow.getCell(0), "Initiated by", true);
        setCellText(initiatedRow.getCell(1), initiatorName, false); // Fill with initiator name
        setCellText(initiatedRow.getCell(2), "Site TSD", false);
        setCellText(initiatedRow.getCell(3), "", false);
        setCellText(initiatedRow.getCell(4), "", false);
        
        // Reviewed by row
        XWPFTableRow reviewedRow = signatureTable.createRow();
        // Ensure we have enough cells before accessing them
        while (reviewedRow.getTableCells().size() < 5) {
            reviewedRow.addNewTableCell();
        }
        setCellText(reviewedRow.getCell(0), "Reviewed by", true);
        setCellText(reviewedRow.getCell(1), "", false);
        setCellText(reviewedRow.getCell(2), "Unit Head", false);
        setCellText(reviewedRow.getCell(3), "", false);
        setCellText(reviewedRow.getCell(4), "", false);
        
        // First Approved by row (Corp. TSD)
        XWPFTableRow approvedRow = signatureTable.createRow();
        // Ensure we have enough cells before accessing them
        while (approvedRow.getTableCells().size() < 5) {
            approvedRow.addNewTableCell();
        }
        setCellText(approvedRow.getCell(0), "Approved by", true);
        setCellText(approvedRow.getCell(1), "", false);
        setCellText(approvedRow.getCell(2), "Corp. TSD", false);
        setCellText(approvedRow.getCell(3), "", false);
        setCellText(approvedRow.getCell(4), "", false);
        
        // Second Approved by row (CMO)
        XWPFTableRow approved2Row = signatureTable.createRow();
        // Ensure we have enough cells before accessing them
        while (approved2Row.getTableCells().size() < 5) {
            approved2Row.addNewTableCell();
        }
        setCellText(approved2Row.getCell(0), "Approved by", true);
        setCellText(approved2Row.getCell(1), "", false);
        setCellText(approved2Row.getCell(2), "CMO", false);
        setCellText(approved2Row.getCell(3), "", false);
        setCellText(approved2Row.getCell(4), "", false);
        
        // Write to output stream
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        document.write(outputStream);
        document.close();
        
        return outputStream;
    }
    
    private void createFormRow(XWPFTable table, String label, String value) {
        XWPFTableRow row = table.createRow();
        
        // Ensure we have at least 2 cells
        while (row.getTableCells().size() < 2) {
            row.addNewTableCell();
        }
        
        // Label cell (left column) - blue background
        XWPFTableCell labelCell = row.getCell(0);
        if (labelCell != null) {
            setCellText(labelCell, label, true); // setCellText will handle the blue background
        }
        
        // Value cell (right column)
        XWPFTableCell valueCell = row.getCell(1);
        if (valueCell != null) {
            setCellText(valueCell, value, false);
        }
    }
    
    private void setCellText(XWPFTableCell cell, String text, boolean bold) {
        if (cell == null) {
            return; // Safety check for null cells
        }
        
        // Clear existing paragraphs and create fresh content
        cell.removeParagraph(0);
        XWPFParagraph para = cell.addParagraph();
        para.setAlignment(ParagraphAlignment.LEFT);
        
        XWPFRun run = para.createRun();
        run.setText(text != null ? text : "");
        run.setBold(bold);
        
        if (bold) {
            run.setColor("FFFFFF"); // White text for headers
            cell.setColor("4F81BD"); // Blue background for headers
        }
        run.setFontSize(10);
    }
    
    /**
     * Add logo beside the title in the top right corner
     */
    private void addLogoAndTitleToDocument(XWPFDocument document) {
        try {
            // Create a table with 3 columns for proper centering: empty, title, logo
            XWPFTable titleLogoTable = document.createTable(1, 3);
            titleLogoTable.setWidth("100%");
            
            // Remove default borders
            titleLogoTable.getCTTbl().getTblPr().unsetTblBorders();
            
            XWPFTableRow row = titleLogoTable.getRow(0);
            
            // Empty cell (left side) for balancing
            XWPFTableCell emptyCell = row.getCell(0);
            emptyCell.setVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);
            emptyCell.getCTTc().getTcPr().addNewTcW().setW(BigInteger.valueOf(2000)); // 20% width
            XWPFParagraph emptyPara = emptyCell.getParagraphs().get(0);
            emptyPara.createRun().setText(""); // Empty cell
            
            // Title cell (center) - this will be truly centered
            XWPFTableCell titleCell = row.getCell(1);
            titleCell.setVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);
            titleCell.getCTTc().getTcPr().addNewTcW().setW(BigInteger.valueOf(6000)); // 60% width
            
            XWPFParagraph titlePara = titleCell.getParagraphs().get(0);
            titlePara.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = titlePara.createRun();
            titleRun.setBold(true);
            titleRun.setFontSize(16);
            titleRun.setText("INITIATIVE");
            titleRun.addBreak();
            titleRun.setText("APPROVAL FORM");
            
            // Logo cell (right side)
            XWPFTableCell logoCell = row.getCell(2);
            logoCell.setVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);
            logoCell.getCTTc().getTcPr().addNewTcW().setW(BigInteger.valueOf(2000)); // 20% width
            
            XWPFParagraph logoPara = logoCell.getParagraphs().get(0);
            logoPara.setAlignment(ParagraphAlignment.RIGHT);
            XWPFRun logoRun = logoPara.createRun();
            
            // Load the logo from resources
            InputStream logoStream = getClass().getResourceAsStream("/static/images/dnl.png");
            if (logoStream != null) {
                // Add the logo image to the document
                logoRun.addPicture(logoStream, 
                    XWPFDocument.PICTURE_TYPE_PNG, 
                    "dnl.png", 
                    Units.toEMU(50), // width in EMU (smaller size)
                    Units.toEMU(35));  // height in EMU (smaller size)
                
                logoStream.close();
            } else {
                // If logo not found, add placeholder text
                logoRun.setText("[DNL LOGO]");
                logoRun.setBold(true);
                logoRun.setFontSize(8);
            }
            
            // Add spacing after title/logo section
            document.createParagraph();
            
        } catch (Exception e) {
            logger.warn("⚠️ Could not add logo and title to document: {}", e.getMessage());
            // Fallback to simple title if there's an error
            XWPFParagraph titlePara = document.createParagraph();
            titlePara.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = titlePara.createRun();
            titleRun.setBold(true);
            titleRun.setFontSize(16);
            titleRun.setText("INITIATIVE");
            titleRun.addBreak();
            titleRun.setText("APPROVAL FORM");
            document.createParagraph();
        }
    }
    
    /**
     * Generate MOM Report in Excel format
     */
    public ByteArrayOutputStream generateMOMReport(String site, String year) throws IOException {
        logger.info("🔄 Starting MOM Report generation - site: {}, year: {}", site, year);
        
        // Create workbook and worksheet
        XSSFWorkbook workbook = new XSSFWorkbook();
        XSSFSheet sheet = workbook.createSheet("MOM Report");
        
        // Create header style
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        
        // Column headers for MOM data
        String[] headers = {
            "Initiative Number", "Initiative Title", "Site", "Meeting Title", 
            "Meeting Date", "Meeting Type", "Responsible Person", "Content", 
            "Status", "Priority", "Due Date", "Attendees", "Created At"
        };
        
        // Create header row
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // Get MOM data based on filters
        List<Object[]> momData = getMOMData(site, year);
        
        // Populate data rows
        int rowIndex = 1;
        for (Object[] row : momData) {
            Row dataRow = sheet.createRow(rowIndex++);
            
            for (int i = 0; i < row.length && i < headers.length; i++) {
                Cell cell = dataRow.createCell(i);
                if (row[i] != null) {
                    if (row[i] instanceof LocalDate) {
                        cell.setCellValue(((LocalDate) row[i]).toString());
                    } else {
                        cell.setCellValue(row[i].toString());
                    }
                } else {
                    cell.setCellValue("");
                }
                cell.setCellStyle(dataStyle);
            }
        }
        
        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
        
        // Write to output stream
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        logger.info("✅ MOM Report generation completed - {} records", momData.size());
        return outputStream;
    }
    
    /**
     * Get MOM data with filters
     */
    @SuppressWarnings("unchecked")
    private List<Object[]> getMOMData(String site, String year) {
        // Convert 2-digit year to 4-digit year if needed
        Integer fullYear = null;
        if (year != null && !year.isEmpty()) {
            if (year.length() == 2) {
                // Convert 2-digit year (e.g., "25") to 4-digit year (e.g., "2025")
                int shortYear = Integer.parseInt(year);
                // Assume years 00-50 are 2000s, 51-99 are 1900s
                if (shortYear >= 0 && shortYear <= 50) {
                    fullYear = 2000 + shortYear;
                } else {
                    fullYear = 1900 + shortYear;
                }
            } else {
                // Already 4-digit year
                fullYear = Integer.parseInt(year);
            }
        }
        
        return initiativeRepository.getMOMReportDataFiltered(site, fullYear);
    }
}