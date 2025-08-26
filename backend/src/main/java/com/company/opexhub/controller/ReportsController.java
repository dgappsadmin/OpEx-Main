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
import java.util.Date;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportsController {

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

    // New endpoint to get dynamic savings data from ACHIEVED_VALUE
    @GetMapping("/savings-data")
    public ResponseEntity<DNLReportDataDTO> getSavingsData(
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String year) {
        try {
            DNLReportDataDTO savingsData = reportsService.getDNLSavingsData(site, period, year);
            return ResponseEntity.ok(savingsData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}