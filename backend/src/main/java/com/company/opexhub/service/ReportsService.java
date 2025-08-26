package com.company.opexhub.service;

import com.company.opexhub.dto.DNLReportDataDTO;
import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.MonthlyMonitoringEntry;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.MonthlyMonitoringEntryRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportsService {

    @Autowired
    private InitiativeRepository initiativeRepository;

    @Autowired
    private MonthlyMonitoringEntryRepository monthlyMonitoringEntryRepository;
    
    // New method for DNL Plant Initiatives report
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
    
    private DNLReportDataDTO getDNLReportData(String site, String period, String year) {
        // Calculate date range based on period - Default to yearly for current year
        String startDate = null;
        String endDate = null;
        
        LocalDate now = LocalDate.now();
        int targetYear = year != null ? Integer.parseInt(year) : now.getYear();
        
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
            default: // yearly - Default option for specified year (current year if not provided)
                startDate = targetYear + "-01"; // January of target year
                endDate = targetYear + "-12";   // December of target year
                break;
        }
        
        // Get aggregated data from repository
        List<Object[]> monitoringData = monthlyMonitoringEntryRepository.findDNLPlantInitiativesData(site, startDate, endDate);
        List<Object[]> budgetTargets = monthlyMonitoringEntryRepository.findBudgetTargetsByType(site);
        
        return new DNLReportDataDTO(monitoringData, budgetTargets);
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
        
        // Title row
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("DNL - Plant Initiatives");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));
        
        // Subtitle row with dynamic year
        Row subtitleRow = sheet.createRow(rowNum++);
        Cell subtitleCell = subtitleRow.createCell(0);
        subtitleCell.setCellValue("Initiative saving till June " + currentYear + " (Rs. Lacs)");
        subtitleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 6));
        
        // Empty row
        sheet.createRow(rowNum++);
        
        // Chart Area Label
        Row chartLabelRow = sheet.createRow(rowNum++);
        Cell chartLabelCell = chartLabelRow.createCell(0);
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
            Cell categoryCell = chartRow.createCell(0);
            categoryCell.setCellValue(categories[i]);
            categoryCell.setCellStyle(categoryStyles[i]);
            
            // Visual bar representation using total value
            double totalValue = data[i][5]; // Total column
            int barLength = (int) Math.min(10, Math.max(1, totalValue / 100)); // Scale bar length
            
            for (int j = 1; j <= barLength; j++) {
                Cell barCell = chartRow.createCell(j);
                barCell.setCellValue("█"); // Block character for bar
                barCell.setCellStyle(categoryStyles[i]);
            }
            
            // Add value at the end
            Cell valueCell = chartRow.createCell(barLength + 2);
            valueCell.setCellValue(totalValue);
            valueCell.setCellStyle(dataStyle);
        }
        
        // Empty rows for spacing
        sheet.createRow(rowNum++);
        sheet.createRow(rowNum++);
        
        // Headers for data table
        Row headerRow = sheet.createRow(rowNum++);
        String[] headers = {"Category", "FY'26 Budgeted Saving", "FY'26 Non Budgeted Saving", 
                           "Budgeted", "Non-budgeted", "Savings till June'25", "Total"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell headerCell = headerRow.createCell(i);
            headerCell.setCellValue(headers[i]);
            headerCell.setCellStyle(headerStyle);
        }
        
        // Process data and create table rows with colors
        for (int i = 0; i < categories.length; i++) {
            Row dataRow = sheet.createRow(rowNum++);
            
            // Category name with color
            Cell categoryCell = dataRow.createCell(0);
            categoryCell.setCellValue(categories[i]);
            categoryCell.setCellStyle(categoryStyles[i]);
            
            // Data values
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
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        return style;
    }
    
    private CellStyle createChartLabelStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    public ByteArrayOutputStream generateDetailedExcelReport(String site, String year) throws IOException {
        // Create workbook
        XSSFWorkbook workbook = new XSSFWorkbook();
        
        // Define months for sheets
        String[] months = {
            "Apr.25", "May.25", "June.25", "Jul.25", "Aug.25", "Sept.25",
            "Oct.25", "Nov.25", "Dec.25", "Jan.26", "Feb.26", "Mar.26"
        };
        
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
    
    private void createMonthlySheet(XSSFWorkbook workbook, String monthName, List<Initiative> initiatives, int filterYear) {
        Sheet sheet = workbook.createSheet(monthName);
        
        // Create styles
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        CellStyle dateStyle = createDateStyle(workbook);
        
        // Set column widths
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
        sheet.setColumnWidth(12, 3000); // Remarks (Column M)
        
        int rowNum = 0;
        
        // Row 1 (A1): Title - INITIATIVE TRACKER SHEET
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("INITIATIVE TRACKER SHEET");
        titleCell.setCellStyle(titleStyle);
        // Merge cells A1 to M1 for title
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 12));
        
        // Row 2: Empty
        Row emptyRow1 = sheet.createRow(rowNum++);
        
        // Row 3 (A3): Tracker updated on Date with form reference
        Row dateRow = sheet.createRow(rowNum++);
        Cell dateLabelCell = dateRow.createCell(0);
        dateLabelCell.setCellValue("Tracker updated on Date:");
        dateLabelCell.setCellStyle(dateStyle);
        
        // Add current date in next cell (B3)
        Cell currentDateCell = dateRow.createCell(1);
        currentDateCell.setCellValue(LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));
        currentDateCell.setCellStyle(dateStyle);
        
        // Add form reference in the right corner (L3)
        Cell formRefCell = dateRow.createCell(11);
        formRefCell.setCellValue("(CRP-002/F4-01)");
        formRefCell.setCellStyle(dateStyle);
        
        // Row 4: Empty
        Row emptyRow2 = sheet.createRow(rowNum++);
        
        // Row 5 (A5): Headers starting from column A
        Row headerRow = sheet.createRow(rowNum++);
        String[] headers = {
            "Sr. No.", "Description of Initiative", "Category", "Initiative No.", 
            "Initiation Date", "Initiative Leader", "Target Date", "Modification or CAPEX Cost", 
            "Current Status", "Expected Savings", "Actual Savings", "Annualized Value FY25-26", "Remarks"
        };
        
        for (int i = 0; i < headers.length; i++) {
            Cell headerCell = headerRow.createCell(i);
            headerCell.setCellValue(headers[i]);
            headerCell.setCellStyle(headerStyle);
        }
        
        // Add data rows starting from Row 6 (A6)
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
            
            // Remarks (Current Stage Name) (Column M)
            String stageName = getStageName(initiative.getCurrentStage());
            dataRow.createCell(12).setCellValue(stageName);
            
            // Apply data style to all cells
            for (int i = 0; i < 13; i++) {
                Cell cell = dataRow.getCell(i);
                if (cell != null) {
                    cell.setCellStyle(dataStyle);
                }
            }
        }
        
        // Add empty rows to match template (ensure at least 20 empty rows for data entry)
        int minRows = Math.max(25, rowNum + 15); // At least 25 rows total
        while (rowNum < minRows) {
            Row emptyDataRow = sheet.createRow(rowNum++);
            // Create empty cells with borders
            for (int i = 0; i < 13; i++) {
                Cell emptyCell = emptyDataRow.createCell(i);
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
        style.setAlignment(HorizontalAlignment.CENTER);
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
        style.setAlignment(HorizontalAlignment.CENTER);
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
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        return style;
    }
    
    private CellStyle createDateStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
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
        
        // Add title
        XWPFParagraph titlePara = document.createParagraph();
        titlePara.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun titleRun = titlePara.createRun();
        titleRun.setBold(true);
        titleRun.setFontSize(16);
        titleRun.setText("Annexure-I");
        titleRun.addBreak();
        titleRun.setText("INITIATIVES APPROVAL FORM");
        
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
            expectedValue = "₹" + initiative.getExpectedSavings().toString() + " - Expected value is multiple of Annual financial benefit and percent confidence level of achieving that benefit";
        } else {
            expectedValue = "Expected value is multiple of Annual financial benefit and percent confidence level of achieving that benefit";
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
}