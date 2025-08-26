package com.company.opexhub.controller;

import com.company.opexhub.service.ReportsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
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
            
            // Generate filename with current timestamp
            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String filename = String.format("DNL_Plant_Initiatives_Report_%s.pdf", timestamp);
            
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
            
            // Generate filename
            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String filename = String.format("Detailed_Report_%s.xlsx", timestamp);
            
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
}