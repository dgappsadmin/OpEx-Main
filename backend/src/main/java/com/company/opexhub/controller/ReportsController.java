package com.company.opexhub.controller;

import com.company.opexhub.dto.DNLReportDataDTO;
import com.company.opexhub.dto.FinancialYearReportDTO;
import com.company.opexhub.service.ReportsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportsController {

    private static final Logger logger = LoggerFactory.getLogger(ReportsController.class);
    
    @Autowired
    private ReportsService reportsService;

    @GetMapping("/export/dnl-plant-initiatives")
    public ResponseEntity<ByteArrayResource> exportDNLPlantInitiatives(
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String year) {
        try {
            logger.info("🔄 Generating DNL Plant Initiatives PDF - site: {}, period: {}, year: {}", site, period, year);
            
            // Generate the PDF report with improved error handling
            ByteArrayOutputStream outputStream = reportsService.generateDNLPlantInitiativesPDF(site, period, year);
            
            // Validate output stream
            if (outputStream == null || outputStream.size() == 0) {
                logger.error("❌ Generated PDF is empty or null");
                return ResponseEntity.internalServerError()
                    .header("X-Error-Message", "PDF generation failed: Empty document")
                    .build();
            }
            
            // Create response with proper headers
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());
            
            // Generate dynamic filename with current month and year
            LocalDate now = LocalDate.now();
            String currentMonth = now.getMonth().toString().toLowerCase();
            currentMonth = currentMonth.substring(0, 1).toUpperCase() + currentMonth.substring(1);
            String currentYear = String.valueOf(now.getYear()).substring(2);
            String filename = String.format("DNL_Plant_Initiatives_%s%s.pdf", currentMonth, currentYear);
            
            logger.info("✅ Successfully generated DNL Plant Initiatives PDF: {}", filename);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(resource.contentLength())
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("❌ Error generating DNL Plant Initiatives PDF: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .header("X-Error-Message", "PDF generation failed: " + e.getMessage())
                .build();
        }
    }

    @GetMapping("/export/detailed-excel")
    public ResponseEntity<ByteArrayResource> exportDetailedExcel(
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String year) {
        try {
            logger.info("🔄 Generating Detailed Excel - site: {}, year: {}", site, year);
            
            // Generate the Excel report using existing logic
            ByteArrayOutputStream outputStream = reportsService.generateDetailedExcelReport(site, year);
            
            // Validate output stream
            if (outputStream == null || outputStream.size() == 0) {
                logger.error("❌ Generated Excel is empty or null");
                return ResponseEntity.internalServerError()
                    .header("X-Error-Message", "Excel generation failed: Empty document")
                    .build();
            }
            
            // Create response with proper headers
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());
            
            // Generate dynamic filename with current fiscal year
            LocalDate now = LocalDate.now();
            int fiscalYear = now.getMonthValue() >= 4 ? now.getYear() + 1 : now.getYear();
            String filename = String.format("Detailed_Report_FY%s.xlsx", String.valueOf(fiscalYear).substring(2));
            
            logger.info("✅ Successfully generated Detailed Excel: {}", filename);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .contentLength(resource.contentLength())
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("❌ Error generating Detailed Excel: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .header("X-Error-Message", "Excel generation failed: " + e.getMessage())
                .build();
        }
    }

    @GetMapping("/export/initiative-form/{initiativeId}")
    public ResponseEntity<ByteArrayResource> exportInitiativeForm(@PathVariable String initiativeId) {
        try {
            logger.info("🔄 Generating Initiative Form - ID: {}", initiativeId);
            
            // Validate initiative ID
            if (initiativeId == null || initiativeId.trim().isEmpty()) {
                logger.warn("⚠️ Invalid initiative ID provided");
                return ResponseEntity.badRequest()
                    .header("X-Error-Message", "Invalid initiative ID")
                    .build();
            }
            
            // Generate the Word document for the initiative
            ByteArrayOutputStream outputStream = reportsService.generateInitiativeForm(initiativeId);
            
            // Validate output stream
            if (outputStream == null || outputStream.size() == 0) {
                logger.error("❌ Generated Word document is empty or null");
                return ResponseEntity.internalServerError()
                    .header("X-Error-Message", "Word document generation failed: Empty document")
                    .build();
            }
            
            // Create response with proper headers
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());
            
            // Generate filename
            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String filename = String.format("Initiative_Form_%s_%s.docx", initiativeId, timestamp);
            
            logger.info("✅ Successfully generated Initiative Form: {}", filename);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")  
                    .header(HttpHeaders.EXPIRES, "0")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                    .contentLength(resource.contentLength())
                    .body(resource);
                    
        } catch (IllegalArgumentException e) {
            // Initiative not found
            logger.warn("⚠️ Initiative not found: {}", e.getMessage());
            return ResponseEntity.notFound()
                .header("X-Error-Message", "Initiative not found: " + e.getMessage())
                .build();
        } catch (Exception e) {
            // Log the full stack trace for debugging
            logger.error("❌ Error generating initiative form for ID: {} - {}", initiativeId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .header("X-Error-Message", "Initiative form generation failed: " + e.getMessage())
                .build();
        }
    }

    // Public method to expose savings data for API endpoint
    @GetMapping("/dnl-savings-data")
    public ResponseEntity<DNLReportDataDTO> getDNLSavingsData(
            @RequestParam(value = "site", required = false) String site,
            @RequestParam(value = "period", required = false, defaultValue = "yearly") String period,
            @RequestParam(value = "year", required = false) String year) {
        
        try {
            logger.info("🔍 DNL API Request - site: {}, period: {}, year: {}", site, period, year);
            
            DNLReportDataDTO data = reportsService.getDNLSavingsData(site, period, year);
            
            // Validate data
            if (data == null) {
                logger.warn("⚠️ No DNL data found for given parameters");
                return ResponseEntity.notFound()
                    .header("X-Error-Message", "No data found for selected filters")
                    .build();
            }
            
            logger.info("✅ DNL API Response - Data retrieved successfully");
            return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(data);
        } catch (Exception e) {
            logger.error("❌ Error in getDNLSavingsData API: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .header("X-Error-Message", "Failed to retrieve chart data: " + e.getMessage())
                .build();
        }
    }
    
    // Export DNL Plant Initiatives with Bar Chart as PDF
    @GetMapping("/export/dnl-chart-pdf")
    public ResponseEntity<byte[]> downloadDNLChartPDF(
            @RequestParam(value = "site", required = false) String site,
            @RequestParam(value = "period", required = false, defaultValue = "yearly") String period,
            @RequestParam(value = "year", required = false) String year) {
        
        try {
            logger.info("🔄 Generating DNL Chart PDF - site: {}, period: {}, year: {}", site, period, year);
            
            ByteArrayOutputStream outputStream = reportsService.generateDNLChartPDF(site, period, year);
            
            // Validate output stream
            if (outputStream == null || outputStream.size() == 0) {
                logger.error("❌ Generated DNL Chart PDF is empty or null");
                return ResponseEntity.internalServerError()
                    .header("X-Error-Message", "PDF chart generation failed: Empty document")
                    .build();
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);
            
            // Dynamic filename with current date and year
            String currentYear = year != null ? year : String.valueOf(LocalDate.now().getYear());
            String filename = String.format("DNL_Plant_Initiatives_Chart_%s_%s.pdf", 
                currentYear, 
                LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyyyy")));
            headers.setContentDispositionFormData("attachment", filename);
            
            logger.info("✅ Successfully generated DNL Chart PDF: {}", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(outputStream.toByteArray());
        } catch (Exception e) {
            logger.error("❌ Error generating DNL Chart PDF report: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .header("X-Error-Message", "PDF chart generation failed: " + e.getMessage())
                .build();
        }
    }
    
    // Export DNL Plant Initiatives with Bar Chart as Excel
    @GetMapping("/export/dnl-chart-excel")
    public ResponseEntity<byte[]> downloadDNLChartExcel(
            @RequestParam(value = "site", required = false) String site,
            @RequestParam(value = "period", required = false, defaultValue = "yearly") String period,
            @RequestParam(value = "year", required = false) String year) {
        
        try {
            logger.info("🔄 Generating DNL Chart Excel - site: {}, period: {}, year: {}", site, period, year);
            
            ByteArrayOutputStream outputStream = reportsService.generateDNLChartExcel(site, period, year);
            
            // Validate output stream
            if (outputStream == null || outputStream.size() == 0) {
                logger.error("❌ Generated DNL Chart Excel is empty or null");
                return ResponseEntity.internalServerError()
                    .header("X-Error-Message", "Excel chart generation failed: Empty document")
                    .build();
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);
            
            // Dynamic filename with current date and year
            String currentYear = year != null ? year : String.valueOf(LocalDate.now().getYear());
            String filename = String.format("DNL_Plant_Initiatives_Chart_%s_%s.xlsx", 
                currentYear, 
                LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyyyy")));
            headers.setContentDispositionFormData("attachment", filename);
            
            logger.info("✅ Successfully generated DNL Chart Excel: {}", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(outputStream.toByteArray());
        } catch (Exception e) {
            logger.error("❌ Error generating DNL Chart Excel report: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .header("X-Error-Message", "Excel chart generation failed: " + e.getMessage())
                .build();
        }
    }
    
    // Financial Year Reporting Endpoints
    @GetMapping("/financial-year-data")
    public ResponseEntity<FinancialYearReportDTO> getFinancialYearData(
            @RequestParam(value = "financialYear", required = false) String financialYear,
            @RequestParam(value = "site", required = false) String site,
            @RequestParam(value = "budgetType", required = false) String budgetType,
            @RequestParam(value = "category", required = false) String category) {
        
        try {
            logger.info("🔍 Financial Year API Request - FY: {}, site: {}, budgetType: {}, category: {}", 
                       financialYear, site, budgetType, category);
            
            FinancialYearReportDTO data = reportsService.getFinancialYearData(financialYear, site, budgetType, category);
            
            if (data == null) {
                logger.warn("⚠️ No financial year data found for given parameters");
                return ResponseEntity.notFound()
                    .header("X-Error-Message", "No data found for selected filters")
                    .build();
            }
            
            logger.info("✅ Financial Year API Response - Data retrieved successfully");
            return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(data);
        } catch (Exception e) {
            logger.error("❌ Error in getFinancialYearData API: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .header("X-Error-Message", "Failed to retrieve financial year data: " + e.getMessage())
                .build();
        }
    }
    
    @GetMapping("/available-financial-years")
    public ResponseEntity<List<String>> getAvailableFinancialYears() {
        try {
            logger.info("🔍 Available Financial Years API Request");
            
            List<String> financialYears = reportsService.getAvailableFinancialYears();
            
            logger.info("✅ Available Financial Years API Response - {} years found", financialYears.size());
            return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(financialYears);
        } catch (Exception e) {
            logger.error("❌ Error in getAvailableFinancialYears API: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .header("X-Error-Message", "Failed to retrieve available financial years: " + e.getMessage())
                .build();
        }
    }
}