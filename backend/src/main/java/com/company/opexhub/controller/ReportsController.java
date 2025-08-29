package com.company.opexhub.controller;

import com.company.opexhub.dto.DNLReportDataDTO;
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
            // Generate the PDF report
            ByteArrayOutputStream outputStream = reportsService.generateDNLPlantInitiativesPDF(site, period, year);
            
            // Create response with proper headers
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());
            
            // Generate dynamic filename with current month and year
            LocalDate now = LocalDate.now();
            String currentMonth = now.getMonth().toString().toLowerCase();
            currentMonth = currentMonth.substring(0, 1).toUpperCase() + currentMonth.substring(1);
            String currentYear = String.valueOf(now.getYear()).substring(2);
            String filename = String.format("DNL_Plant_Initiatives_%s%s.pdf", currentMonth, currentYear);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(resource.contentLength())
                    .body(resource);
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/detailed-excel")
    public ResponseEntity<ByteArrayResource> exportDetailedExcel(
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String year) {
        try {
            // Generate the Excel report using existing logic
            ByteArrayOutputStream outputStream = reportsService.generateDetailedExcelReport(site, year);
            
            // Create response with proper headers
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());
            
            // Generate dynamic filename with current fiscal year
            LocalDate now = LocalDate.now();
            int fiscalYear = now.getMonthValue() >= 4 ? now.getYear() + 1 : now.getYear();
            String filename = String.format("Detailed_Report_FY%s.xlsx", String.valueOf(fiscalYear).substring(2));
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .contentLength(resource.contentLength())
                    .body(resource);
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/initiative-form/{initiativeId}")
    public ResponseEntity<ByteArrayResource> exportInitiativeForm(@PathVariable String initiativeId) {
        try {
            // Validate initiative ID
            if (initiativeId == null || initiativeId.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // Generate the Word document for the initiative
            ByteArrayOutputStream outputStream = reportsService.generateInitiativeForm(initiativeId);
            
            // Create response with proper headers
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());
            
            // Generate filename
            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String filename = String.format("Initiative_Form_%s_%s.docx", initiativeId, timestamp);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                    .contentLength(resource.contentLength())
                    .body(resource);
                    
        } catch (IllegalArgumentException e) {
            // Initiative not found
            System.err.println("Initiative not found: " + e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            // Log the full stack trace for debugging
            System.err.println("Error generating initiative form for ID: " + initiativeId);
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
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
            
            logger.info("✅ DNL API Response - Data retrieved successfully");
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            logger.error("❌ Error in getDNLSavingsData API: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Export DNL Plant Initiatives with Bar Chart as PDF
    @GetMapping("/export/dnl-chart-pdf")
    public ResponseEntity<byte[]> downloadDNLChartPDF(
            @RequestParam(value = "site", required = false) String site,
            @RequestParam(value = "period", required = false, defaultValue = "yearly") String period,
            @RequestParam(value = "year", required = false) String year) {
        
        try {
            ByteArrayOutputStream outputStream = reportsService.generateDNLChartPDF(site, period, year);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            
            // Dynamic filename with current date and year
            String currentYear = year != null ? year : String.valueOf(LocalDate.now().getYear());
            String filename = String.format("DNL_Plant_Initiatives_Chart_%s_%s.pdf", 
                currentYear, 
                LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyyyy")));
            headers.setContentDispositionFormData("attachment", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(outputStream.toByteArray());
        } catch (Exception e) {
            logger.error("Error generating DNL Chart PDF report", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Export DNL Plant Initiatives with Bar Chart as Excel
    @GetMapping("/export/dnl-chart-excel")
    public ResponseEntity<byte[]> downloadDNLChartExcel(
            @RequestParam(value = "site", required = false) String site,
            @RequestParam(value = "period", required = false, defaultValue = "yearly") String period,
            @RequestParam(value = "year", required = false) String year) {
        
        try {
            ByteArrayOutputStream outputStream = reportsService.generateDNLChartExcel(site, period, year);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            
            // Dynamic filename with current date and year
            String currentYear = year != null ? year : String.valueOf(LocalDate.now().getYear());
            String filename = String.format("DNL_Plant_Initiatives_Chart_%s_%s.xlsx", 
                currentYear, 
                LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyyyy")));
            headers.setContentDispositionFormData("attachment", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(outputStream.toByteArray());
        } catch (Exception e) {
            logger.error("Error generating DNL Chart Excel report", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}