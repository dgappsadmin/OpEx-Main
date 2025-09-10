package com.company.opexhub.controller;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.dto.InitiativeRequest;
import com.company.opexhub.dto.InitiativeResponse;
import com.company.opexhub.entity.Initiative;
import com.company.opexhub.security.UserPrincipal;
import com.company.opexhub.service.InitiativeService;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/initiatives")
public class InitiativeController {

    @Autowired
    private InitiativeService initiativeService;

    // Upload directory path
    private static final String UPLOAD_DIR = "D:\\DNLOPEX";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFiles(@RequestParam("files") MultipartFile[] files) {
        try {
            // Create upload directory if it doesn't exist
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            List<String> filePaths = new ArrayList<>();
            List<String> fileNames = new ArrayList<>();

            for (MultipartFile file : files) {
                // Validate file size
                if (file.getSize() > MAX_FILE_SIZE) {
                    return ResponseEntity.badRequest()
                            .body(new ApiResponse(false, "File " + file.getOriginalFilename() + " exceeds maximum size of 5MB"));
                }

                // Validate file is not empty
                if (file.isEmpty()) {
                    continue;
                }

                String originalFileName = file.getOriginalFilename();
                if (originalFileName == null) {
                    continue;
                }

                // Create unique filename to avoid conflicts
                String fileName = System.currentTimeMillis() + "_" + originalFileName;
                Path filePath = Paths.get(UPLOAD_DIR, fileName);

                // Save file
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                filePaths.add(filePath.toString());
                fileNames.add(originalFileName); // Store original name for display
            }

            // Convert lists to JSON strings
            ObjectMapper objectMapper = new ObjectMapper();
            String filePathsJson = objectMapper.writeValueAsString(filePaths);
            String fileNamesJson = objectMapper.writeValueAsString(fileNames);

            Map<String, String> response = new HashMap<>();
            response.put("fPath", filePathsJson);
            response.put("fName", fileNamesJson);

            return ResponseEntity.ok(new ApiResponse(true, "Files uploaded successfully", response));

        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to upload files: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Error uploading files: " + e.getMessage()));
        }
    }

    @GetMapping
    public Page<InitiativeResponse> getAllInitiatives(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        
        Page<Initiative> initiatives = initiativeService.searchInitiatives(status, site, search, pageable);
        return initiatives.map(this::convertToResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InitiativeResponse> getInitiativeById(@PathVariable Long id) {
        return initiativeService.getInitiativeById(id)
                .map(initiative -> ResponseEntity.ok(convertToResponse(initiative)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createInitiative(@Valid @RequestBody InitiativeRequest request,
                                            @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            System.out.println("=== CREATING INITIATIVE ===");
            System.out.println("Request: " + request);
            System.out.println("Expected Savings: " + request.getExpectedSavings());
            System.out.println("Target Value: " + request.getTargetValue());
            System.out.println("Estimated CAPEX: " + request.getEstimatedCapex());
            
            Initiative initiative = initiativeService.createInitiative(request, currentUser.getId());
            InitiativeResponse response = convertToResponse(initiative);
            
            System.out.println("Initiative created successfully with ID: " + initiative.getId());
            return ResponseEntity.ok(new ApiResponse(true, "Initiative created successfully", response));
        } catch (Exception e) {
            System.err.println("Error creating initiative: " + e.getMessage());
            e.printStackTrace();
            
            String errorMessage = "Failed to create initiative";
            if (e.getMessage().contains("could not execute statement")) {
                errorMessage = "Database error: Unable to save initiative with current values. Please ensure all numeric fields have valid values.";
            } else if (e.getMessage().contains("constraint")) {
                errorMessage = "Data validation error: Please check all required fields are properly filled.";
            } else {
                errorMessage = "Error: " + e.getMessage();
            }
            
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, errorMessage));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInitiative(@PathVariable Long id,
                                            @Valid @RequestBody InitiativeRequest request) {
        try {
            Initiative initiative = initiativeService.updateInitiative(id, request);
            InitiativeResponse response = convertToResponse(initiative);
            return ResponseEntity.ok(new ApiResponse(true, "Initiative updated successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInitiative(@PathVariable Long id) {
        try {
            initiativeService.deleteInitiative(id);
            return ResponseEntity.ok(new ApiResponse(true, "Initiative deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Helper method to convert Initiative entity to InitiativeResponse DTO
    private InitiativeResponse convertToResponse(Initiative initiative) {
        InitiativeResponse response = new InitiativeResponse();
        response.setId(initiative.getId());
        response.setTitle(initiative.getTitle());
        response.setDescription(initiative.getDescription());
        response.setStatus(initiative.getStatus());
        response.setPriority(initiative.getPriority());
        response.setExpectedSavings(initiative.getExpectedSavings());
        response.setActualSavings(initiative.getActualSavings());
        response.setSite(initiative.getSite());
        response.setDiscipline(initiative.getDiscipline());
        response.setInitiativeNumber(initiative.getInitiativeNumber());
        response.setStartDate(initiative.getStartDate());
        response.setEndDate(initiative.getEndDate());
        response.setProgressPercentage(initiative.getProgressPercentage());
        response.setCurrentStage(initiative.getCurrentStage()); // This will auto-set currentStageName
        response.setRequiresMoc(initiative.getRequiresMoc());
        response.setRequiresCapex(initiative.getRequiresCapex());
        response.setCreatedAt(initiative.getCreatedAt());
        response.setUpdatedAt(initiative.getUpdatedAt());
        
        // Set creator information
        if (initiative.getCreatedBy() != null) {
            response.setCreatedByName(initiative.getCreatedBy().getFullName());
            response.setCreatedByEmail(initiative.getCreatedBy().getEmail());
        }
        
        // Set new fields for assumptions and additional form data
        response.setAssumption1(initiative.getAssumption1());
        response.setAssumption2(initiative.getAssumption2());
        response.setAssumption3(initiative.getAssumption3());
        response.setBaselineData(initiative.getBaselineData());
        response.setTargetOutcome(initiative.getTargetOutcome());
        response.setTargetValue(initiative.getTargetValue());
        response.setConfidenceLevel(initiative.getConfidenceLevel());
        response.setEstimatedCapex(initiative.getEstimatedCapex());
        response.setBudgetType(initiative.getBudgetType());
        response.setInitiatorName(initiative.getInitiatorName());
        
        // Set MOC and CAPEX numbers - FIXED: These were missing!
        response.setMocNumber(initiative.getMocNumber());
        response.setCapexNumber(initiative.getCapexNumber());
        
        // Set file attachment fields
        response.setFPath(initiative.getFPath());
        response.setFName(initiative.getFName());
        
        return response;
    }
    
    // Add this method to handle MOC/CAPEX updates for Stage 6 approval
    @PutMapping("/{id}/moc-capex")
    public ResponseEntity<ApiResponse> updateMocCapexRequirements(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> mocCapexData,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        try {
            boolean updated = initiativeService.updateMocCapexRequirements(id, mocCapexData);
            
            if (updated) {
                return ResponseEntity.ok(new ApiResponse(true, 
                    "Initiative MOC/CAPEX requirements updated successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Error updating MOC/CAPEX requirements: " + e.getMessage()));
        }
    }
}